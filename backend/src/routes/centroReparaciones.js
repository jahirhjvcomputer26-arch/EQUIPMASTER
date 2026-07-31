import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { firebaseGet, firebaseSet, firebaseDelete } from '../firebase.js';
import { registrarActividad } from './actividad.js';

const router = Router();
router.use(authMiddleware);

const NODE = 'centroReparaciones';

function normalizar(body, id) {
  return {
    id,
    marca: (body.marca || '').toUpperCase().trim(),
    modelo: (body.modelo || '').toUpperCase().trim(),
    serie: (body.serie || '').toUpperCase().trim(),
    categoria: (body.categoria || 'Otros').trim(),
    prioridad: body.prioridad || 'Media',
    falla: (body.falla || '').toUpperCase().trim(),
    tecnico: (body.tecnico || 'SIN ASIGNAR').toUpperCase().trim(),
    estado: body.estado || 'Pendiente',
    fecha: body.fecha || new Date().toISOString(),
    fechaFin: body.fechaFin || null,
    origen: 'manual',
    fechaRegistro: body.fechaRegistro || new Date().toISOString(),
  };
}

router.get('/', async (_req, res) => {
  try {
    const data = await firebaseGet(NODE);
    const list = data ? Object.entries(data).map(([id, v]) => ({ id, ...v })) : [];
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { marca, modelo, serie } = req.body;
    if (!marca || !modelo || !serie) {
      return res.status(400).json({ error: 'Marca, modelo y serie son obligatorios' });
    }
    const id = `CR-${Date.now()}`;
    const reparacion = normalizar(req.body, id);
    await firebaseSet(`${NODE}/${id}`, reparacion);
    registrarActividad(req.user?.nombre, 'REPARACION_CENTRO', `${marca} ${modelo} (${serie}) → ${reparacion.categoria}`);
    res.status(201).json({ message: 'Equipo registrado en el centro', id, reparacion });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const actual = await firebaseGet(`${NODE}/${req.params.id}`);
    if (!actual) return res.status(404).json({ error: 'Registro no encontrado' });
    const reparacion = normalizar({ ...actual, ...req.body }, req.params.id);
    await firebaseSet(`${NODE}/${req.params.id}`, reparacion);
    registrarActividad(req.user?.nombre, 'REPARACION_CENTRO_EDITADA', `${reparacion.marca} ${reparacion.modelo} actualizado`);
    res.json({ message: 'Registro actualizado', reparacion });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/finalizar', async (req, res) => {
  try {
    const actual = await firebaseGet(`${NODE}/${req.params.id}`);
    if (!actual) return res.status(404).json({ error: 'Registro no encontrado' });
    const reparacion = {
      ...actual,
      estado: 'Finalizada',
      fechaFin: new Date().toISOString(),
    };
    await firebaseSet(`${NODE}/${req.params.id}`, reparacion);
    registrarActividad(req.user?.nombre, 'REPARACION_CENTRO_FINALIZADA', `${actual.marca} ${actual.modelo} (${actual.serie})`);
    res.json({ message: 'Reparación finalizada', reparacion });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await firebaseDelete(`${NODE}/${req.params.id}`);
    res.json({ message: 'Registro eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
