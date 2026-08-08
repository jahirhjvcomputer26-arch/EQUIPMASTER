import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { loadPermisos, requirePerm } from '../permisos.js';
import { firebaseGet, firebaseSet } from '../firebase.js';
import { registrarActividad } from './actividad.js';

const router = Router();

// Ruta pública: solo acepta solicitudes para productos publicados.
router.post('/', async (req, res) => {
  try {
    const { codigo, nombre, telefono, email, mensaje } = req.body;
    if (!codigo || !nombre || !telefono) return res.status(400).json({ error: 'Código, nombre y teléfono son obligatorios' });
    const item = await firebaseGet(`inventario/${String(codigo).toUpperCase()}`);
    if (!item || item.publicado !== true || item.estado?.includes('VENDIDO')) return res.status(400).json({ error: 'Producto no disponible' });
    const id = `SOL-${Date.now()}`;
    const solicitud = { id, codigo: item.codigo, producto: `${item.marca} ${item.modelo}`, nombre: String(nombre).trim(), telefono: String(telefono).trim(), email: String(email || '').trim(), mensaje: String(mensaje || '').trim(), estado: 'pendiente', creado: new Date().toISOString() };
    await firebaseSet(`solicitudesVenta/${id}`, solicitud);
    res.status(201).json({ ok: true, id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.use(authMiddleware, loadPermisos(), requirePerm('gestionar_solicitudes'));

router.get('/', async (_req, res) => {
  try {
    const data = await firebaseGet('solicitudesVenta');
    const list = data ? Object.entries(data).map(([id, item]) => ({ id, ...item })) : [];
    list.sort((a, b) => String(b.creado || '').localeCompare(String(a.creado || '')));
    res.json(list);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const actual = await firebaseGet(`solicitudesVenta/${req.params.id}`);
    if (!actual) return res.status(404).json({ error: 'Solicitud no encontrada' });
    const estados = ['pendiente', 'contactado', 'apartado', 'vendido', 'cancelado'];
    if (!estados.includes(req.body.estado)) return res.status(400).json({ error: 'Estado no válido' });
    const updated = { ...actual, estado: req.body.estado, actualizado: new Date().toISOString() };
    await firebaseSet(`solicitudesVenta/${req.params.id}`, updated);
    registrarActividad(req.user?.nombre, 'SOLICITUD_VENTA', `${req.params.id}: ${updated.estado}`);
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
