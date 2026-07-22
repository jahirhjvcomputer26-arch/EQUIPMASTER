import { Router } from 'express';
import { firebaseGet } from '../firebase.js';
import { registrarActividad } from './actividad.js';

const router = Router();

const PATHS = ['inventario', 'ventas', 'prestamos', 'reparaciones', 'actividad', 'usuarios', 'notificaciones'];

router.get('/', async (req, res) => {
  try {
    const dump = {};
    for (const p of PATHS) {
      const data = await firebaseGet(p);
      if (data) dump[p] = data;
    }
    await registrarActividad('backup', null, 'Respaldo completo exportado');
    res.json(dump);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
