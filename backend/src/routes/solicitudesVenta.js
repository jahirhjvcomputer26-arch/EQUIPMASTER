import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { loadPermisos, requirePerm } from '../permisos.js';
import { firebaseGet, firebaseSet } from '../firebase.js';
import { registrarActividad } from './actividad.js';
import rateLimit from 'express-rate-limit';

const router = Router();
const solicitudLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false });

// Ruta pública: solo acepta solicitudes para productos publicados.
router.post('/', solicitudLimiter, async (req, res) => {
  try {
    const { codigo, nombre, telefono, email, mensaje, website } = req.body;
    if (website) return res.status(400).json({ error: 'Solicitud no válida' });
    if (!codigo || !nombre || !telefono) return res.status(400).json({ error: 'Código, nombre y teléfono son obligatorios' });
    if (String(nombre).trim().length < 2 || String(nombre).length > 120) return res.status(400).json({ error: 'Nombre no válido' });
    if (!/^[0-9+()\s-]{7,25}$/.test(String(telefono).trim())) return res.status(400).json({ error: 'Teléfono no válido' });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) return res.status(400).json({ error: 'Correo no válido' });
    const item = await firebaseGet(`inventario/${String(codigo).toUpperCase()}`);
    if (!item || item.publicado !== true || item.estado?.includes('VENDIDO')) return res.status(400).json({ error: 'Producto no disponible' });
    const now = new Date().toISOString();
    const id = `SOL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const solicitud = { id, folio: id, codigo: item.codigo, producto: `${item.marca} ${item.modelo}`, nombre: String(nombre).trim(), telefono: String(telefono).trim(), email: String(email || '').trim(), mensaje: String(mensaje || '').trim().slice(0, 1000), estado: 'pendiente', responsable: null, creado: now, historial: [{ fecha: now, estado: 'pendiente', usuario: 'PUBLICO' }] };
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
    const now = new Date().toISOString();
    const updated = { ...actual, estado: req.body.estado, responsable: req.body.responsable !== undefined ? String(req.body.responsable).trim() : actual.responsable || null, actualizado: now, historial: [...(actual.historial || []), { fecha: now, estado: req.body.estado, usuario: req.user?.nombre || 'SISTEMA', nota: String(req.body.nota || '').trim() }] };
    await firebaseSet(`solicitudesVenta/${req.params.id}`, updated);
    registrarActividad(req.user?.nombre, 'SOLICITUD_VENTA', `${req.params.id}: ${updated.estado}`);
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
