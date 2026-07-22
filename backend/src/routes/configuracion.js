import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { firebaseGet, firebaseSet } from '../firebase.js';

const router = Router();
router.use(authMiddleware);

const DEFAULT_CONFIG = {
  nombreEmpresa: 'JV COMPUTER',
  lema: 'Centro de Servicio TI',
  direccion: 'Nuevo León, México',
  telefono: '',
  email: '',
  website: '',
  rfc: '',
  logoBase64: '',
  colorPrimario: '#0018B0',
  moneda: 'MXN',
  iva: 16,
  notasPie: 'Gracias por su preferencia',
};

router.get('/', async (req, res) => {
  try {
    const config = await firebaseGet('configuracion/empresa');
    res.json({ ...DEFAULT_CONFIG, ...config });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/public', async (_req, res) => {
  try {
    const config = await firebaseGet('configuracion/empresa');
    const pub = config ? {
      nombreEmpresa: config.nombreEmpresa || DEFAULT_CONFIG.nombreEmpresa,
      lema: config.lema || DEFAULT_CONFIG.lema,
      logoBase64: config.logoBase64 || '',
      colorPrimario: config.colorPrimario || DEFAULT_CONFIG.colorPrimario,
    } : DEFAULT_CONFIG;
    res.json(pub);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const allowed = ['nombreEmpresa', 'lema', 'direccion', 'telefono', 'email', 'website', 'rfc', 'logoBase64', 'colorPrimario', 'moneda', 'iva', 'notasPie'];
    const current = await firebaseGet('configuracion/empresa') || {};
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const merged = { ...current, ...updates };
    await firebaseSet('configuracion/empresa', merged);
    res.json({ message: 'Configuración actualizada', config: merged });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
