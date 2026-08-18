import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from '../middleware/auth.js';
import { loadPermisos, requirePerm } from '../permisos.js';
import { answer } from '../jvbot/service.js';
import { clearMemory } from '../jvbot/memory.js';

const router = Router();
const chatRateLimit = rateLimit({ windowMs: 60 * 1000, limit: 60, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'JVBOT recibió demasiadas consultas. Espera un momento.' } });
router.use(authMiddleware, loadPermisos(), requirePerm('ver_inventario'));

router.post('/chat', chatRateLimit, async (req, res) => {
  try {
    const { message, history } = req.body || {};
    if (typeof message !== 'string' || message.length > 1000) return res.status(400).json({ error: 'Mensaje inválido' });
    res.json(await answer(message, Array.isArray(history) ? history : [], req.user.usuario));
  } catch (error) { console.error('JVBOT chat error:', error); res.status(500).json({ error: 'No se pudo consultar EquipMaster' }); }
});

router.delete('/memory', async (req, res) => {
  try { await clearMemory(req.user.usuario); res.json({ message: 'Memoria de JVBOT eliminada' }); }
  catch { res.status(500).json({ error: 'No se pudo eliminar la memoria de JVBOT' }); }
});

export default router;
