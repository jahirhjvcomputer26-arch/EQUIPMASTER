import { Router } from 'express';
import * as XLSX from 'xlsx';
import { authMiddleware } from '../middleware/auth.js';
import { firebaseGet } from '../firebase.js';

const router = Router();
router.use(authMiddleware);

router.get('/filtros', async (req, res) => {
  try {
    const data = await firebaseGet('inventario');
    const marcas = new Set();
    const modelos = new Set();
    const tecnicos = new Set();
    const categorias = new Set();
    const estados = new Set();
    (Object.values(data || {})).forEach(item => {
      if (item.marca) marcas.add(item.marca);
      if (item.modelo) modelos.add(item.modelo);
      if (item.tecnico) tecnicos.add(item.tecnico);
      if (item.categoria) categorias.add(item.categoria);
      if (item.estado) estados.add(item.estado);
    });
    res.json({
      marcas: [...marcas].sort(),
      modelos: [...modelos].sort(),
      tecnicos: [...tecnicos].sort(),
      categorias: [...categorias].sort(),
      estados: [...estados].sort(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/avanzado', async (req, res) => {
  try {
    const data = await firebaseGet('inventario');
    let lista = data ? Object.values(data) : [];

    const { marca, modelo, tecnico, categoria, estado, fechaDesde, fechaHasta } = req.query;
    if (marca) lista = lista.filter(i => (i.marca || '').toUpperCase() === marca.toUpperCase());
    if (modelo) lista = lista.filter(i => (i.modelo || '').toUpperCase().includes(modelo.toUpperCase()));
    if (tecnico) lista = lista.filter(i => (i.tecnico || '') === tecnico);
    if (categoria) lista = lista.filter(i => (i.categoria || '') === categoria);
    if (estado) lista = lista.filter(i => (i.estado || '') === estado);
    if (fechaDesde) lista = lista.filter(i => {
      const f = i.fechaRegistro?.split(',')[0] || '';
      return f >= fechaDesde;
    });
    if (fechaHasta) lista = lista.filter(i => {
      const f = i.fechaRegistro?.split(',')[0] || '';
      return f <= fechaHasta;
    });

    res.json({ total: lista.length, items: lista });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/dashboard', async (_req, res) => {
  try {
    const data = await firebaseGet('inventario');
    const lista = data ? Object.values(data) : [];

    let equiposVentaStock = 0, equiposMercadoLibre = 0, equiposRevisionTriage = 0;
    let mermasTKF = 0, totalVendidos = 0;
    const conteoEstados = { '🟢 FULL (ML)': 0, '🔵 OK': 0, '🟡 Detalles': 0, '🟠 Revisión': 0, '🔴 TKF': 0, '🔴 VENDIDO': 0 };
    const conteoModelosPorEstado = {};
    const conteoMetodosPago = {};

    lista.forEach(item => {
      const est = item.estado || '';
      if (est === '🔵 OK') equiposVentaStock++;
      if (est.includes('🟢')) equiposMercadoLibre++;
      if (est === '🟡 Detalles' || est === '🟠 Revisión') equiposRevisionTriage++;
      if (est === '🔴 TKF') mermasTKF++;

      if ((item.flujoSalida || item.flujoVentaML) && !item.flujoDevolucion) {
        totalVendidos++;
        if (item.flujoVentaML) conteoMetodosPago['MERCADO LIBRE'] = (conteoMetodosPago['MERCADO LIBRE'] || 0) + 1;
        else if (item.flujoSalida?.metodoPago) {
          conteoMetodosPago[item.flujoSalida.metodoPago] = (conteoMetodosPago[item.flujoSalida.metodoPago] || 0) + 1;
        }
      }

      if (est.includes('🟢')) conteoEstados['🟢 FULL (ML)']++;
      else if (est.includes('🔵')) conteoEstados['🔵 OK']++;
      else if (est.includes('🟡')) conteoEstados['🟡 Detalles']++;
      else if (est.includes('🟠')) conteoEstados['🟠 Revisión']++;
      else if (est.includes('🔴 TKF')) conteoEstados['🔴 TKF']++;
      else if (est.includes('🔴 VENDIDO')) conteoEstados['🔴 VENDIDO']++;

      if (!est.includes('🔴 VENDIDO')) {
        const modelo = item.modelo ? item.modelo.toUpperCase().trim() : 'SIN MODELO';
        let estadoStock = null;
        if (est.includes('🟢')) estadoStock = '🟢 FULL (ML)';
        else if (est.includes('🔵')) estadoStock = '🔵 OK';
        else if (est.includes('🟡')) estadoStock = '🟡 Detalles';
        else if (est.includes('🟠')) estadoStock = '🟠 Revisión';
        else if (est.includes('🔴 TKF')) estadoStock = '🔴 TKF';

        if (estadoStock) {
          if (!conteoModelosPorEstado[modelo]) conteoModelosPorEstado[modelo] = {};
          conteoModelosPorEstado[modelo][estadoStock] = (conteoModelosPorEstado[modelo][estadoStock] || 0) + 1;
        }
      }
    });

    let topPago = 'Ninguno';
    let maxPago = 0;
    Object.entries(conteoMetodosPago).forEach(([m, c]) => { if (c > maxPago) { maxPago = c; topPago = m; } });

    res.json({
      totalEntradasHistorico: lista.length,
      equiposVentaStock, equiposMercadoLibre, equiposRevisionTriage, mermasTKF,
      totalVendidos, topPago, conteoEstados, conteoModelosPorEstado,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/ventas', async (_req, res) => {
  try {
    const data = await firebaseGet('inventario');
    const lista = data ? Object.values(data) : [];
    const vendidos = lista.filter(i => i.flujoSalida || i.flujoVentaML);
    const ventas = await firebaseGet('ventas');
    const ventasList = ventas ? Object.values(ventas) : [];

    let totalLocal = 0, totalML = 0, countLocal = 0, countML = 0;
    const porMes = {};

    vendidos.forEach(item => {
      if (item.flujoVentaML) {
        countML++;
        totalML += parseFloat(item.flujoVentaML.precioVenta || 0);
      } else if (item.flujoSalida) {
        countLocal++;
        totalLocal += parseFloat(item.flujoSalida.precio || 0);
      }
    });

    ventasList.forEach(v => {
      const mes = (v.fecha || '').substring(0, 7);
      if (mes) porMes[mes] = (porMes[mes] || 0) + 1;
    });

    res.json({
      totalVendidos: vendidos.length,
      totalLocal, totalML, countLocal, countML,
      porMes,
      items: vendidos.map(i => ({
        codigo: i.codigo, marca: i.marca, modelo: i.modelo,
        estado: i.estado, fechaRegistro: i.fechaRegistro,
        precio: i.flujoSalida?.precio || i.flujoVentaML?.precioVenta || '-',
        metodo: i.flujoSalida?.metodoPago || 'MERCADO LIBRE',
        cliente: i.flujoSalida?.cliente || 'Mercado Libre',
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/reparaciones', async (_req, res) => {
  try {
    const data = await firebaseGet('inventario');
    const lista = data ? Object.values(data) : [];
    const reparaciones = await firebaseGet('reparaciones');
    const repList = reparaciones ? Object.values(reparaciones) : [];

    const conteoEstados = {};
    repList.forEach(r => {
      const est = r.estado || 'RECIBIDO';
      conteoEstados[est] = (conteoEstados[est] || 0) + 1;
    });

    res.json({
      total: repList.length,
      conteoEstados,
      items: repList.slice(0, 100).map(r => ({
        id: r.id, equipo: r.equipo, cliente: r.cliente,
        falla: r.falla, estado: r.estado, tecnico: r.tecnico,
        fechaIngreso: r.fechaIngreso, costo: r.costo || 0,
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/excel', async (_req, res) => {
  try {
    const data = await firebaseGet('inventario');
    const lista = data ? Object.values(data) : [];

    const filas = lista.map(item => ({
      'Código Inventario': item.codigo,
      'Categoría': item.categoria,
      'Marca': item.marca,
      'Modelo': item.modelo,
      'Número de Serie': item.serie,
      'SKU': item.sku,
      'Procesador': item.procesador,
      'Memoria RAM': item.ram,
      'Almacenamiento': item.almacenamiento,
      'Tipo de Disco': item.tipoDisco,
      'Gráfica': item.grafica,
      'Condición de Batería': item.bateria,
      'Cargador Incluido': item.cargador,
      'Técnico de Ingreso': item.tecnico,
      'Fecha de Entrada': item.fechaRegistro,
      'Observaciones de Entrada': item.observaciones,
      'Estado Actual': item.estado,
      'Fecha Envío Mercado Libre': item.flujoMercadoLibre?.fechaEnvio || '-',
      'ID Publicación / SKU ML': item.flujoMercadoLibre?.idPublicacion || '-',
      'Enviado a ML Por': item.flujoMercadoLibre?.enviadoPor || '-',
      'Venta Mercado Libre': item.flujoVentaML ? 'SÍ' : '-',
      'Fecha Venta ML': item.flujoVentaML?.fechaVenta || '-',
      'Fecha Devolución': item.flujoDevolucion?.fechaDevolucion || '-',
      'Motivo Devolución': item.flujoDevolucion?.motivo || '-',
      'Precio de Venta': item.flujoSalida?.precio || '-',
      'Forma de Pago': item.flujoSalida?.metodoPago || '-',
      'Fecha de Salida': item.flujoSalida?.fechaSalida || '-',
      'Entregado Por': item.flujoSalida?.tecnicoEntrega || '-',
      'Notas de la Venta': item.flujoSalida?.notasSalida || '-',
    }));

    const hoja = XLSX.utils.json_to_sheet(filas);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Control Maestro TI');
    const buffer = XLSX.write(libro, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=Reporte_General_TI_Master.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
