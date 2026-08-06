import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { loadPermisos, requirePerm } from '../permisos.js';
import { firebaseDelete, firebaseGet, firebaseSet } from '../firebase.js';

function makeRouter(node) {
  const router = Router();
  router.use(authMiddleware, loadPermisos());

  router.get('/', requirePerm('ver_garantias'), async (_req, res) => {
    try {
      const data = await firebaseGet(node);
      const lista = data ? Object.entries(data).map(([id, value]) => ({ id, ...value })) : [];
      lista.sort((a, b) => String(b.fecha || b.vencimiento || b.fechaProgramada || '').localeCompare(String(a.fecha || a.vencimiento || a.fechaProgramada || '')));
      res.json(lista);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.post('/', requirePerm('gestionar_garantias'), async (req, res) => {
    try {
      const id = req.body.id || `${node.slice(0, 3).toUpperCase()}-${Date.now()}`;
      const data = { ...req.body, id, actualizado: new Date().toISOString() };
      await firebaseSet(`${node}/${id}`, data);
      res.status(201).json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.put('/:id', requirePerm('gestionar_garantias'), async (req, res) => {
    try {
      const actual = await firebaseGet(`${node}/${req.params.id}`);
      if (!actual) return res.status(404).json({ error: 'Registro no encontrado' });
      const data = { ...actual, ...req.body, id: req.params.id, actualizado: new Date().toISOString() };
      await firebaseSet(`${node}/${req.params.id}`, data);
      res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.delete('/:id', requirePerm('gestionar_garantias'), async (req, res) => {
    try {
      await firebaseDelete(`${node}/${req.params.id}`);
      res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
  return router;
}

export const garantiasRouter = makeRouter('garantias');
export const mantenimientosRouter = makeRouter('mantenimientos');
