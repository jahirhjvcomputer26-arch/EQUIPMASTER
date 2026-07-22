import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { firebaseGet, firebaseSet, firebaseDelete } from '../firebase.js';
import { registrarActividad } from './actividad.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const data = await firebaseGet('tickets');
    let list = data ? Object.entries(data).map(([id, v]) => ({ id, ...v })) : [];

    if (req.query.estado) list = list.filter(t => t.estado === req.query.estado);
    if (req.query.prioridad) list = list.filter(t => t.prioridad === req.query.prioridad);
    if (req.query.asignado) list = list.filter(t => t.tecnicoAsignado === req.query.asignado);
    if (req.query.q) {
      const q = req.query.q.toLowerCase();
      list = list.filter(t =>
        (t.asunto || '').toLowerCase().includes(q) ||
        (t.descripcion || '').toLowerCase().includes(q) ||
        (t.id || '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { asunto, descripcion, prioridad } = req.body;
    if (!asunto) return res.status(400).json({ error: 'El asunto es obligatorio' });

    const id = `TK-${Date.now().toString(36).toUpperCase()}`;
    const ticket = {
      id,
      asunto: asunto.trim(),
      descripcion: (descripcion || '').trim(),
      prioridad: ['baja', 'media', 'alta'].includes(prioridad) ? prioridad : 'media',
      estado: 'abierto',
      creadoPor: req.user?.nombre || req.user?.usuario || 'Desconocido',
      creadoEn: new Date().toISOString(),
      timestamp: Date.now(),
      tecnicoAsignado: '',
      notasInternas: '',
      notas: [],
    };

    await firebaseSet(`tickets/${id}`, ticket);
    registrarActividad(req.user?.nombre, 'TICKET_CREADO', `${id}: ${asunto.trim()}`);
    res.status(201).json({ message: 'Ticket creado', ticket });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await firebaseGet(`tickets/${req.params.id}`);
    if (!existing) return res.status(404).json({ error: 'Ticket no encontrado' });

    const { asunto, descripcion, prioridad, estado, tecnicoAsignado, notasInternas } = req.body;

    if (estado && !['abierto', 'en_proceso', 'resuelto', 'cerrado'].includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const updated = {
      ...existing,
      ...(asunto !== undefined && { asunto: asunto.trim() }),
      ...(descripcion !== undefined && { descripcion: descripcion.trim() }),
      ...(prioridad !== undefined && { prioridad }),
      ...(estado !== undefined && { estado }),
      ...(tecnicoAsignado !== undefined && { tecnicoAsignado }),
      ...(notasInternas !== undefined && { notasInternas: notasInternas.trim() }),
      modificadoEn: new Date().toISOString(),
    };

    await firebaseSet(`tickets/${req.params.id}`, updated);

    const cambios = [];
    if (estado && estado !== existing.estado) cambios.push(`estado: ${existing.estado} → ${estado}`);
    if (tecnicoAsignado !== undefined && tecnicoAsignado !== existing.tecnicoAsignado) {
      cambios.push(`asignado: ${tecnicoAsignado || 'sin asignar'}`);
    }
    if (cambios.length) {
      registrarActividad(req.user?.nombre, 'TICKET_ACTUALIZADO', `${req.params.id}: ${cambios.join(', ')}`);
    }

    res.json({ message: 'Ticket actualizado', ticket: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/nota', async (req, res) => {
  try {
    const existing = await firebaseGet(`tickets/${req.params.id}`);
    if (!existing) return res.status(404).json({ error: 'Ticket no encontrado' });

    const { texto } = req.body;
    if (!texto) return res.status(400).json({ error: 'El texto de la nota es obligatorio' });

    const notas = existing.notas || [];
    notas.push({
      texto: texto.trim(),
      autor: req.user?.nombre || req.user?.usuario || 'Desconocido',
      fecha: new Date().toISOString(),
    });

    const updated = { ...existing, notas, modificadoEn: new Date().toISOString() };
    await firebaseSet(`tickets/${req.params.id}`, updated);
    registrarActividad(req.user?.nombre, 'TICKET_NOTA', `${req.params.id}: nota agregada`);
    res.json({ message: 'Nota agregada', ticket: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const existing = await firebaseGet(`tickets/${req.params.id}`);
    if (!existing) return res.status(404).json({ error: 'Ticket no encontrado' });

    await firebaseDelete(`tickets/${req.params.id}`);
    registrarActividad(req.user?.nombre, 'TICKET_ELIMINADO', `${req.params.id}: ${existing.asunto}`);
    res.json({ message: 'Ticket eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
