import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { firebaseGet, firebaseSet } from '../firebase.js';

const router = Router();
router.use(authMiddleware);

export async function registrarActividad(usuario, accion, detalle) {
  const id = `ACT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const entrada = {
    usuario: usuario || 'SISTEMA',
    accion,
    detalle: (detalle || '').toString(),
    fecha: new Date().toISOString(),
    timestamp: Date.now(),
  };
  await firebaseSet(`actividad/${id}`, entrada).catch(() => {});
  return entrada;
}

router.get('/', async (req, res) => {
  try {
    const data = await firebaseGet('actividad');
    const lista = data ? Object.entries(data).map(([id, v]) => ({ id, ...v })) : [];
    lista.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const inicio = (page - 1) * limit;
    res.json({ data: lista.slice(inicio, inicio + limit), total: lista.length, page, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
