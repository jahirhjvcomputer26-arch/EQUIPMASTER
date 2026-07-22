import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { firebaseDelete, firebaseGet, firebaseSet } from '../firebase.js';
import { registrarActividad } from './actividad.js';

const router = Router();
router.use(authMiddleware);

const ESTADOS_REP = ['RECIBIDO', 'DIAGNÓSTICO', 'ESPERANDO PIEZAS', 'EN REPARACIÓN', 'EN PRUEBAS', 'FINALIZADO', 'ENTREGADO', 'CANCELADO'];

router.get('/', async (_req, res) => {
  try {
    const data = await firebaseGet('reparaciones');
    const lista = data ? Object.entries(data).map(([id, v]) => ({ id, ...v })) : [];
    lista.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    res.json(lista);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await firebaseGet(`reparaciones/${req.params.id}`);
    if (!item) return res.status(404).json({ error: 'Orden no encontrada' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const id = `REP-${Date.now()}`;
    const orden = {
      ...req.body,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await firebaseSet(`reparaciones/${id}`, orden);
    registrarActividad(req.user?.nombre, 'REPARACION_CREADA', `${id} · ${orden.cliente || ''} · ${orden.equipoMarca || ''} ${orden.equipoModelo || ''}`);
    res.json({ message: 'Orden creada', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existente = await firebaseGet(`reparaciones/${req.params.id}`);
    if (!existente) return res.status(404).json({ error: 'Orden no encontrada' });
    const actualizada = { ...existente, ...req.body, id: req.params.id, updatedAt: new Date().toISOString() };
    await firebaseSet(`reparaciones/${req.params.id}`, actualizada);
    registrarActividad(req.user?.nombre, 'REPARACION_EDITADA', `${req.params.id} · ${actualizada.cliente || ''}`);
    res.json({ message: 'Orden actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await firebaseDelete(`reparaciones/${req.params.id}`);
    registrarActividad(req.user?.nombre, 'REPARACION_ELIMINADA', `Orden ${req.params.id}`);
    res.json({ message: 'Orden eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
