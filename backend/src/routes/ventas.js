import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { firebaseGet, firebaseSet } from '../firebase.js';
import { registrarActividad } from './actividad.js';

const router = Router();
router.use(authMiddleware);

router.post('/local', async (req, res) => {
  try {
    const { codigo, cliente, precio, metodoPago, fechaSalida, tecnicoEntrega, notasSalida } = req.body;
    const item = await firebaseGet(`inventario/${codigo}`);
    if (!item) return res.status(404).json({ error: 'Equipo no encontrado' });
    if (item.estado?.includes('🔴 VENDIDO')) return res.status(400).json({ error: 'Equipo ya vendido' });

    item.flujoSalida = {
      estadoAnterior: item.estado,
      cliente: (cliente || '').toUpperCase().trim(),
      precio: precio?.startsWith('$') ? precio : `$${precio}`,
      metodoPago,
      fechaSalida,
      tecnicoEntrega,
      notasSalida: (notasSalida || 'SIN NOTAS ADICIONALES.').toUpperCase().trim(),
    };

    item.estado = '🔴 VENDIDO / SALIDA';
    await firebaseSet(`inventario/${codigo}`, item);
    registrarActividad(req.user?.nombre, 'VENTA_LOCAL', `${codigo} · ${cliente} · $${precio}`);
    res.json({ message: 'Venta local registrada', item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/mercadolibre', async (req, res) => {
  try {
    const { serie, fechaVenta, notasVenta } = req.body;
    const serieNorm = (serie || '').toUpperCase().trim().replace(/\s+/g, '');
    const inventario = await firebaseGet('inventario');
    const item = Object.values(inventario || {}).find(
      i => (i.serie || '').toUpperCase().trim().replace(/\s+/g, '') === serieNorm
    );

    if (!item) return res.status(404).json({ error: 'No se encontró equipo con ese número de serie' });
    if (!item.estado?.includes('🔵')) {
      return res.status(400).json({ error: `Equipo no disponible para ML. Estado: ${item.estado}` });
    }

    item.estado = '🔴 VENDIDO / SALIDA';
    item.flujoVentaML = {
      fechaVenta: fechaVenta || new Date().toISOString().split('T')[0],
      notasVenta: (notasVenta || 'VENTA ML REGISTRADA.').toUpperCase().trim(),
    };

    await firebaseSet(`inventario/${item.codigo}`, item);
    registrarActividad(req.user?.nombre, 'VENTA_ML', `${item.codigo} · ${item.serie}`);
    res.json({ message: 'Venta ML registrada', item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/devolucion', async (req, res) => {
  try {
    const { codigo, fechaDevolucion, motivo } = req.body;
    const item = await firebaseGet(`inventario/${codigo}`);
    if (!item) return res.status(404).json({ error: 'Equipo no encontrado' });

    const esVendido = item.flujoSalida || item.flujoVentaML || item.estado?.includes('🔴 VENDIDO');
    if (!esVendido) return res.status(400).json({ error: 'El equipo no está marcado como vendido' });

    item.estado = '🟠 Revisión';
    item.flujoDevolucion = {
      fechaDevolucion: fechaDevolucion || new Date().toISOString().split('T')[0],
      motivo: (motivo || 'DEVOLUCIÓN SIN MOTIVO ESPECIFICADO.').toUpperCase().trim(),
      canalPrevio: item.flujoVentaML ? 'MERCADO LIBRE' : (item.flujoSalida?.metodoPago || 'VENTA LOCAL'),
    };

    await firebaseSet(`inventario/${codigo}`, item);
    registrarActividad(req.user?.nombre, 'DEVOLUCION', `${codigo} · ${motivo}`);
    res.json({ message: 'Devolución registrada', item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/local/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    const { cliente, precio, metodoPago, fechaSalida, tecnicoEntrega, notasSalida } = req.body;
    const item = await firebaseGet(`inventario/${codigo}`);
    if (!item) return res.status(404).json({ error: 'Equipo no encontrado' });
    if (!item.flujoSalida) return res.status(400).json({ error: 'Este equipo no tiene venta registrada' });

    item.flujoSalida = {
      ...item.flujoSalida,
      cliente: (cliente || item.flujoSalida.cliente || '').toUpperCase().trim(),
      precio: precio?.startsWith('$') ? precio : `$${precio}`,
      metodoPago: metodoPago || item.flujoSalida.metodoPago,
      fechaSalida: fechaSalida || item.flujoSalida.fechaSalida,
      tecnicoEntrega: tecnicoEntrega || item.flujoSalida.tecnicoEntrega,
      notasSalida: (notasSalida || item.flujoSalida.notasSalida || '').toUpperCase().trim(),
    };

    await firebaseSet(`inventario/${codigo}`, item);
    registrarActividad(req.user?.nombre, 'VENTA_EDITADA', `${codigo} · ${item.flujoSalida.cliente}`);
    res.json({ message: 'Venta actualizada', item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/local/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    const item = await firebaseGet(`inventario/${codigo}`);
    if (!item) return res.status(404).json({ error: 'Equipo no encontrado' });

    item.estado = item.flujoSalida?.estadoAnterior || '🔵 OK';
    item.flujoSalida = null;

    await firebaseSet(`inventario/${codigo}`, item);
    registrarActividad(req.user?.nombre, 'VENTA_ELIMINADA', `${codigo} · venta anulada, equipo regresa a ${item.estado}`);
    res.json({ message: `Venta eliminada, equipo regresa a ${item.estado}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
