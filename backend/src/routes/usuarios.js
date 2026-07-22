import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware/auth.js';
import { claveUsuario, firebaseGet, firebaseSet, hashPassword } from '../firebase.js';

const router = Router();

const rateLimitMap = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now - entry.start > 120000) rateLimitMap.delete(key);
  }
}, 60000);

function rateLimit(key, maxAttempts = 5, windowMs = 60000) {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now - entry.start > windowMs) {
    rateLimitMap.set(key, { start: now, count: 1 });
    return { blocked: false };
  }
  entry.count++;
  if (entry.count > maxAttempts) {
    return { blocked: true, retryAfter: Math.ceil((windowMs - (now - entry.start)) / 1000) };
  }
  return { blocked: false };
}

router.post('/register', async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress;
  const rl = rateLimit(`register:${ip}`, 3, 60000);
  if (rl.blocked) return res.status(429).json({ error: `Demasiados intentos. Espera ${rl.retryAfter}s.` });

  try {
    const { usuario, password, confirmPassword } = req.body;
    const nombre = (usuario || '').trim();
    const clave = claveUsuario(nombre);

    if (clave.length < 3) return res.status(400).json({ error: 'Usuario mínimo 3 caracteres' });
    if (!password || password.length < 4) return res.status(400).json({ error: 'Contraseña mínimo 4 caracteres' });
    if (password !== confirmPassword) return res.status(400).json({ error: 'Las contraseñas no coinciden' });

    const existente = await firebaseGet(`usuarios/${clave}`);
    if (existente) return res.status(409).json({ error: 'Ese usuario ya existe' });

    const datos = {
      nombre,
      password: await hashPassword(password),
      creado: new Date().toISOString(),
    };
    await firebaseSet(`usuarios/${clave}`, datos);
    res.status(201).json({ message: 'Cuenta creada', usuario: nombre });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress;
  const rl = rateLimit(`login:${ip}`, 5, 60000);
  if (rl.blocked) return res.status(429).json({ error: `Demasiados intentos. Espera ${rl.retryAfter}s.` });

  try {
    const { usuario, password } = req.body;
    const clave = claveUsuario((usuario || '').trim());
    const registro = await firebaseGet(`usuarios/${clave}`);

    if (!registro || registro.password !== await hashPassword(password || '')) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const token = jwt.sign(
      { usuario: clave, nombre: registro.nombre },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, nombre: registro.nombre, usuario: registro.nombre });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  const registro = await firebaseGet(`usuarios/${req.user.usuario}`);
  res.json({ nombre: req.user.nombre, usuario: req.user.nombre, creado: registro?.creado || null });
});

router.post('/cambiar-password', authMiddleware, async (req, res) => {
  try {
    const { actual, nueva, confirmar } = req.body;
    if (!actual || !nueva || !confirmar) return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    if (nueva.length < 4) return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 4 caracteres' });
    if (nueva !== confirmar) return res.status(400).json({ error: 'Las contraseñas no coinciden' });

    const registro = await firebaseGet(`usuarios/${req.user.usuario}`);
    if (!registro) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (registro.password !== await hashPassword(actual)) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
    }

    registro.password = await hashPassword(nueva);
    await firebaseSet(`usuarios/${req.user.usuario}`, registro);
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/cambiar-nombre', authMiddleware, async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre || nombre.trim().length < 3) return res.status(400).json({ error: 'Nombre mínimo 3 caracteres' });

    const registro = await firebaseGet(`usuarios/${req.user.usuario}`);
    if (!registro) return res.status(404).json({ error: 'Usuario no encontrado' });

    const nuevo = nombre.trim();
    registro.nombre = nuevo;
    await firebaseSet(`usuarios/${req.user.usuario}`, registro);

    const token = jwt.sign(
      { usuario: req.user.usuario, nombre: nuevo },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, nombre: nuevo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
