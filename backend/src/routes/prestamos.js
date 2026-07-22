import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { firebaseGet, firebaseSet, firebaseDelete } from '../firebase.js';
import { registrarActividad } from './actividad.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (_req, res) => {
  try {
    const data = await firebaseGet('prestamos');
    const list = data ? Object.entries(data).map(([id, v]) => ({ id, ...v })) : [];
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { serie, modelo, procesador, responsable, area, fechaSalida, notas } = req.body;
    if (!serie || !responsable) return res.status(400).json({ error: 'Serie y responsable son obligatorios' });

    const id = `P-${Date.now()}`;
    const prestamo = {
      serie: (serie || '').toUpperCase().trim(),
      modelo: (modelo || '').toUpperCase().trim(),
      procesador: (procesador || '').toUpperCase().trim(),
      responsable: (responsable || '').toUpperCase().trim(),
      area: (area || 'MARKETING').toUpperCase().trim(),
      fechaSalida: fechaSalida || new Date().toISOString().split('T')[0],
      notas: (notas || '').toUpperCase().trim() || 'SIN NOTAS',
      activo: true,
      fechaRegistro: new Date().toISOString(),
    };

    await firebaseSet(`prestamos/${id}`, prestamo);
    registrarActividad(req.user?.nombre, 'PRESTAMO', `${serie} → ${responsable} (${area})`);
    res.status(201).json({ message: 'Préstamo registrado', id, prestamo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { serie, modelo, procesador, responsable, area, fechaSalida, notas, activo } = req.body;
    const prestamo = {
      serie: (serie || '').toUpperCase().trim(),
      modelo: (modelo || '').toUpperCase().trim(),
      procesador: (procesador || '').toUpperCase().trim(),
      responsable: (responsable || '').toUpperCase().trim(),
      area: (area || 'MARKETING').toUpperCase().trim(),
      fechaSalida: fechaSalida || new Date().toISOString().split('T')[0],
      notas: (notas || '').toUpperCase().trim() || 'SIN NOTAS',
      activo: activo !== undefined ? activo : true,
      fechaRegistro: new Date().toISOString(),
    };
    await firebaseSet(`prestamos/${req.params.id}`, prestamo);
    registrarActividad(req.user?.nombre, 'PRESTAMO_EDITADO', `${prestamo.serie} actualizado`);
    res.json({ message: 'Préstamo actualizado', prestamo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/devolver', async (req, res) => {
  try {
    const prestamo = await firebaseGet(`prestamos/${req.params.id}`);
    if (!prestamo) return res.status(404).json({ error: 'Préstamo no encontrado' });
    if (!prestamo.activo) return res.status(400).json({ error: 'Este préstamo ya fue devuelto' });

    prestamo.activo = false;
    prestamo.fechaDevolucion = new Date().toISOString().split('T')[0];

    await firebaseSet(`prestamos/${req.params.id}`, prestamo);
    registrarActividad(req.user?.nombre, 'DEVOLUCION_PRESTAMO', `${prestamo.serie} devuelto por ${prestamo.responsable}`);
    res.json({ message: 'Equipo devuelto', prestamo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await firebaseDelete(`prestamos/${req.params.id}`);
    res.json({ message: 'Préstamo eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
