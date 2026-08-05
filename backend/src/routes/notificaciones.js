import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { loadPermisos } from '../permisos.js';
import { firebaseGet, firebaseSet } from '../firebase.js';

const router = Router();
router.use(authMiddleware, loadPermisos());

router.get('/', async (_req, res) => {
  try {
    const data = await firebaseGet('notificaciones');
    if (!data) return res.json([]);
    const lista = Object.entries(data)
      .map(([id, n]) => ({ id, ...n }))
      .filter(n => !n.leida)
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    res.json(lista);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { id, mensaje, detalle } = req.body;
    if (!id) return res.status(400).json({ error: 'id requerido' });
    await firebaseSet(`notificaciones/${id}`, {
      mensaje: mensaje || '',
      detalle: detalle || '',
      timestamp: Date.now(),
      leida: false,
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const actual = await firebaseGet(`notificaciones/${id}`);
    if (!actual) return res.status(404).json({ error: 'No encontrada' });
    actual.leida = true;
    await firebaseSet(`notificaciones/${id}`, actual);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
