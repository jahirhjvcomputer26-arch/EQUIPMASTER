import { Router } from 'express';
import * as XLSX from 'xlsx';
import nodemailer from 'nodemailer';
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

router.post('/email', async (req, res) => {
  try {
    const { para, asunto, tipo, filtros } = req.body;
    if (!para) return res.status(400).json({ error: 'El campo "para" (email destino) es requerido' });

    const config = (await firebaseGet('configuracion')) || {};
    const smtp = config.smtp || {};

    if (!smtp.host || !smtp.user || !smtp.pass) {
      return res.status(400).json({ error: 'Configura el SMTP en Configuración > Correo antes de enviar reportes' });
    }

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: parseInt(smtp.port) || 587,
      secure: smtp.port === '465',
      auth: { user: smtp.user, pass: smtp.pass },
    });

    const data = await firebaseGet('inventario');
    let items = Object.values(data || {});

    if (filtros) {
      if (filtros.estado) items = items.filter(i => i.estado === filtros.estado);
      if (filtros.tecnico) items = items.filter(i => i.tecnico === filtros.tecnico);
      if (filtros.categoria) items = items.filter(i => i.categoria === filtros.categoria);
      if (filtros.marca) items = items.filter(i => i.marca === filtros.marca);
    }

    const total = items.length;
    const porEstado = {};
    items.forEach(i => { porEstado[i.estado] = (porEstado[i.estado] || 0) + 1; });

    const empresa = config.nombreEmpresa || 'JV Computer';
    const fecha = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

    let tablaHtml = items.slice(0, 200).map(i => `
      <tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-family:monospace;font-size:12px;color:#0018B0;font-weight:bold">${i.codigo || ''}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:12px">${i.marca || ''} ${i.modelo || ''}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:12px">${i.procesador || ''}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:12px">${i.ram || ''} / ${i.almacenamiento || ''}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:12px">${i.estado || ''}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:12px">${i.tecnico || '—'}</td>
      </tr>
    `).join('');

    const resumenHtml = Object.entries(porEstado).map(([e, c]) => `<li style="margin:4px 0"><strong>${e}:</strong> ${c}</li>`).join('');

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:800px;margin:0 auto">
        <div style="background:#0018B0;color:white;padding:24px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="margin:0;font-size:22px">${empresa}</h1>
          <p style="margin:8px 0 0;opacity:0.8;font-size:14px">${asunto || 'Reporte de Inventario'}</p>
          <p style="margin:4px 0 0;opacity:0.6;font-size:12px">${fecha}</p>
        </div>
        <div style="padding:24px;background:#f8fafc;border:1px solid #e2e8f0">
          <h2 style="font-size:16px;color:#1e293b;margin:0 0 12px">Resumen</h2>
          <p style="font-size:14px;color:#475569;margin:0 0 8px"><strong>${total}</strong> equipo${total !== 1 ? 's' : ''} en inventario</p>
          <ul style="list-style:none;padding:0;margin:0 0 16px">${resumenHtml}</ul>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0" />
          <h2 style="font-size:16px;color:#1e293b;margin:0 0 12px">Detalle (máx. 200)</h2>
          <table style="width:100%;border-collapse:collapse;background:white;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
            <thead><tr style="background:#f1f5f9">
              <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase">Código</th>
              <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase">Equipo</th>
              <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase">Procesador</th>
              <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase">RAM / Disco</th>
              <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase">Estado</th>
              <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase">Técnico</th>
            </tr></thead>
            <tbody>${tablaHtml}</tbody>
          </table>
          ${items.length > 200 ? `<p style="font-size:11px;color:#94a3b8;margin-top:12px;text-align:center">Mostrando 200 de ${total} equipos. Descarga el Excel para el reporte completo.</p>` : ''}
        </div>
        <div style="text-align:center;padding:16px;background:#f1f5f9;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none">
          <p style="font-size:11px;color:#94a3b8;margin:0">Generado por EquipMaster · ${empresa}</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"${empresa}" <${smtp.user}>`,
      to: para,
      subject: asunto || `Reporte de Inventario - ${fecha}`,
      html,
    });

    res.json({ ok: true, message: `Reporte enviado a ${para}`, total, items: items.length });
  } catch (err) {
    console.error('Error enviando email:', err);
    res.status(500).json({ error: 'Error al enviar el correo: ' + err.message });
  }
});

export default router;
