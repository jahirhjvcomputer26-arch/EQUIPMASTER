import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { loadPermisos, requirePerm } from '../permisos.js';
import { firebaseGet } from '../firebase.js';
import { registrarActividad } from './actividad.js';

const router = Router();
router.use(authMiddleware, loadPermisos(), requirePerm('respaldos'));

const PATHS = ['inventario', 'ventas', 'prestamos', 'reparaciones', 'actividad', 'usuarios', 'notificaciones', 'garantias', 'mantenimientos'];

router.get('/', async (req, res) => {
  try {
    const dump = {};
    for (const p of PATHS) {
      const data = await firebaseGet(p);
      if (data) {
        if (p === 'usuarios') {
          dump[p] = Object.fromEntries(
            Object.entries(data).map(([k, v]) => {
              const { password, sesionActiva, ...rest } = v || {};
              return [k, rest];
            })
          );
        } else {
          dump[p] = data;
        }
      }
    }
    await registrarActividad('backup', null, 'Respaldo completo exportado');
    res.json(dump);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
