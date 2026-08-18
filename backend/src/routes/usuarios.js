import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware/auth.js';
import { loadPermisos, requirePerm, esSuperAdmin, resolverPermisos, PERMISOS_CATALOGO } from '../permisos.js';
import { claveUsuario, firebaseGet, firebaseSet, firebaseUpdate, hashPassword, verifyPassword } from '../firebase.js';
import { registrarActividad } from './actividad.js';

const router = Router();

const rateLimitMap = new Map();
const MAX_SESSIONS = 2;
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

function sesionesNormalizadas(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return [value];
  return [];
}

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

router.post('/register', authMiddleware, loadPermisos(), requirePerm('admin_usuarios'), async (req, res) => {
  if (!esSuperAdmin(req.userRecord) && req.userRecord?.rol !== 'admin') {
    return res.status(403).json({ error: 'Solo los administradores pueden crear usuarios' });
  }
  try {
    const { usuario, password, confirmPassword, nombre: nombreBody, rol, nivel, permisos } = req.body;
    const nombre = (nombreBody || usuario || '').trim();
    const clave = claveUsuario((usuario || nombre || '').trim());

    if (clave.length < 3) return res.status(400).json({ error: 'Usuario mínimo 3 caracteres' });
    if (!password || password.length < 8) return res.status(400).json({ error: 'Contraseña mínimo 8 caracteres' });
    if (password !== confirmPassword) return res.status(400).json({ error: 'Las contraseñas no coinciden' });

    const existente = await firebaseGet(`usuarios/${clave}`);
    if (existente) return res.status(409).json({ error: 'Ese usuario ya existe' });

    const seraSuper = rol === 'superadmin' || Number(nivel) >= 100;
    if (seraSuper && !esSuperAdmin(req.userRecord)) {
      return res.status(403).json({ error: 'Solo el Super Administrador puede crear usuarios de nivel 100' });
    }

    const datos = {
      nombre,
      password: await hashPassword(password),
      rol: rol || 'usuario',
      nivel: nivel !== undefined ? Number(nivel) : undefined,
      activo: true,
      permisos: permisos || {},
      creado: new Date().toISOString(),
    };
    await firebaseSet(`usuarios/${clave}`, datos);
    registrarActividad(req.user?.nombre, 'USUARIO_CREADO', `${nombre} · rol: ${datos.rol}`);
    res.status(201).json({ message: 'Usuario creado', usuario: nombre });
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

    if (!registro) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    const verif = await verifyPassword(password || '', registro.password);
    if (!verif.match) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    if (verif.rehash) {
      registro.password = await hashPassword(password);
      await firebaseSet(`usuarios/${clave}`, registro);
    }
    if (registro.activo === false) {
      return res.status(403).json({ error: 'Tu cuenta está desactivada. Contacta al administrador.' });
    }

    const dispositivo = (req.body.dispositivo || req.headers['x-device-id'] || `ip:${ip}`).trim();
    const ahora = Date.now();
    const sesiones = sesionesNormalizadas(registro.sesionActiva)
      .filter(s => typeof s.hasta === 'number' && s.hasta > ahora);
    const sesion = { dispositivo, desde: ahora, hasta: ahora + SESSION_MS };
    const indice = sesiones.findIndex(s => s.dispositivo === dispositivo);
    if (indice >= 0) sesiones[indice] = sesion;
    else {
      if (sesiones.length >= MAX_SESSIONS) {
        return res.status(403).json({ error: `Este usuario ya tiene ${MAX_SESSIONS} sesiones activas. Cierra una sesión antes de entrar desde otro dispositivo.` });
      }
      sesiones.push(sesion);
    }
    registro.sesionActiva = sesiones;
    await firebaseSet(`usuarios/${clave}`, registro);

    const token = jwt.sign(
      { usuario: clave, nombre: registro.nombre },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      nombre: registro.nombre,
      usuario: registro.nombre,
      rol: registro.rol || 'usuario',
      nivel: registro.nivel !== undefined ? Number(registro.nivel) : undefined,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const registro = await firebaseGet(`usuarios/${req.user.usuario}`);
    if (registro) {
      const dispositivo = (req.headers['x-device-id'] || '').trim();
      if (!dispositivo) delete registro.sesionActiva;
      else {
        const sesiones = sesionesNormalizadas(registro.sesionActiva)
          .filter(s => s.dispositivo !== dispositivo && s.hasta > Date.now());
        registro.sesionActiva = sesiones;
      }
      await firebaseSet(`usuarios/${req.user.usuario}`, registro);
    }
    res.json({ message: 'Sesión cerrada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authMiddleware, loadPermisos(), async (req, res) => {
  const registro = await firebaseGet(`usuarios/${req.user.usuario}`);
  res.json({
    clave: req.user.usuario,
    nombre: req.user.nombre,
    usuario: req.user.nombre,
    rol: registro?.rol || 'usuario',
    nivel: registro?.nivel !== undefined ? Number(registro.nivel) : undefined,
    activo: registro?.activo !== false,
    permisos: req.permisos || {},
    creado: registro?.creado || null,
  });
});

router.post('/cambiar-password', authMiddleware, async (req, res) => {
  try {
    const { actual, nueva, confirmar } = req.body;
    if (!actual || !nueva || !confirmar) return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    if (nueva.length < 8) return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });
    if (nueva !== confirmar) return res.status(400).json({ error: 'Las contraseñas no coinciden' });

    const registro = await firebaseGet(`usuarios/${req.user.usuario}`);
    if (!registro) return res.status(404).json({ error: 'Usuario no encontrado' });
    const verif = await verifyPassword(actual, registro.password);
    if (!verif.match) {
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

router.get('/roles', authMiddleware, loadPermisos(), requirePerm('admin_usuarios'), async (_req, res) => {
  try {
    const [roles, catalog] = await Promise.all([
      firebaseGet('roles'),
      firebaseGet('permisosCatalog'),
    ]);
    res.json({
      roles: roles || {},
      permisosCatalog: catalog ? Object.entries(catalog).map(([key, v]) => ({ key, ...v })) : PERMISOS_CATALOGO,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/roles/:rol', authMiddleware, loadPermisos(), requirePerm('admin_usuarios'), async (req, res) => {
  try {
    if (!esSuperAdmin(req.userRecord)) {
      return res.status(403).json({ error: 'Solo el Super Administrador puede modificar roles y permisos' });
    }
    const { rol } = req.params;
    const actual = await firebaseGet(`roles/${rol}`);
    if (!actual) return res.status(404).json({ error: 'Rol no encontrado' });

    const validKeys = new Set(PERMISOS_CATALOGO.map(p => p.key));
    const permisos = {};
    if (req.body.permisos) {
      for (const [k, v] of Object.entries(req.body.permisos)) {
        if (validKeys.has(k)) permisos[k] = !!v;
      }
    }

    const rolesActuales = await firebaseGet('roles');
    const rolesActualizados = { ...rolesActuales };
    rolesActualizados[rol] = {
      ...actual,
      ...(req.body.nivel !== undefined && { nivel: Number(req.body.nivel) }),
      ...(req.body.nombre !== undefined && { nombre: String(req.body.nombre).trim() }),
      ...(req.body.color !== undefined && { color: String(req.body.color) }),
      ...(req.body.descripcion !== undefined && { descripcion: String(req.body.descripcion) }),
      ...(Object.keys(permisos).length > 0 && { permisos }),
    };
    await firebaseSet('roles', rolesActualizados);
    registrarActividad(req.user?.nombre, 'ROL_EDITADO', `Rol ${rol} actualizado`);
    res.json({ message: 'Rol actualizado', rol: rolesActualizados[rol] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/list', authMiddleware, loadPermisos(), requirePerm('admin_usuarios'), async (req, res) => {
  const [all, roles] = await Promise.all([firebaseGet('usuarios'), firebaseGet('roles')]);
  const users = Object.entries(all || {}).map(([key, val]) => ({
    usuario: key,
    nombre: val.nombre,
    rol: val.rol || 'usuario',
    nivel: val.nivel !== undefined ? Number(val.nivel) : undefined,
    activo: val.activo !== false,
    permisos: val.permisos || {},
    creado: val.creado,
    sesionesActivas: sesionesNormalizadas(val.sesionActiva).filter(s => typeof s.hasta === 'number' && s.hasta > Date.now()).length,
  })).map(u => ({ ...u, permEfectivos: resolverPermisos(u, roles) }));
  res.json(users);
});

router.post('/reset-sesiones', authMiddleware, loadPermisos(), requirePerm('admin_usuarios'), async (req, res) => {
  try {
    const { usuario } = req.body;
    const clave = claveUsuario((usuario || '').trim());
    const target = await firebaseGet(`usuarios/${clave}`);
    if (!target) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (esSuperAdmin(target) && !esSuperAdmin(req.userRecord)) {
      return res.status(403).json({ error: 'No puedes cerrar las sesiones de un Super Administrador' });
    }

    await firebaseUpdate(`usuarios/${clave}`, { sesionActiva: [] });
    registrarActividad(req.user?.nombre, 'SESIONES_RESETEADAS', `Sesiones de ${clave} cerradas`);
    res.json({ message: `Sesiones de ${clave} cerradas. Ya puede volver a iniciar sesión.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/update', authMiddleware, loadPermisos(), requirePerm('admin_usuarios'), async (req, res) => {
  try {
    const { usuario, nombre, rol, nivel, permisos, activo } = req.body;
    const clave = claveUsuario((usuario || '').trim());
    const target = await firebaseGet(`usuarios/${clave}`);
    if (!target) return res.status(404).json({ error: 'Usuario no encontrado' });

    const esSelf = clave === req.user.usuario;
    const targetSuper = esSuperAdmin(target);
    const nuevoSuper = (rol === 'superadmin') || (nivel !== undefined && Number(nivel) >= 100);

    if (esSelf && (rol !== undefined || nivel !== undefined || permisos !== undefined || activo !== undefined)) {
      return res.status(400).json({ error: 'No puedes modificar tu propio rango o estado desde aquí' });
    }
    if (targetSuper && !esSuperAdmin(req.userRecord)) {
      return res.status(403).json({ error: 'No puedes modificar a un Super Administrador' });
    }
    if (nuevoSuper && !esSuperAdmin(req.userRecord)) {
      return res.status(403).json({ error: 'Solo el Super Administrador puede promover a nivel 100' });
    }

    const validKeys = new Set(PERMISOS_CATALOGO.map(p => p.key));
    const permisosFinal = {};
    if (permisos) {
      for (const [k, v] of Object.entries(permisos)) {
        if (validKeys.has(k)) permisosFinal[k] = !!v;
      }
    }

    const cambios = [];
    const actualizado = { ...target };
    if (nombre !== undefined && String(nombre).trim()) { actualizado.nombre = String(nombre).trim(); cambios.push('nombre'); }
    if (rol !== undefined) { actualizado.rol = String(rol).trim(); cambios.push('rol'); }
    if (nivel !== undefined) { actualizado.nivel = Number(nivel); cambios.push('nivel'); }
    if (activo !== undefined) { actualizado.activo = !!activo; cambios.push(activo ? 'activación' : 'desactivación'); }
    if (permisos) { actualizado.permisos = permisosFinal; cambios.push('permisos'); }

    await firebaseSet(`usuarios/${clave}`, actualizado);
    registrarActividad(req.user?.nombre, 'USUARIO_EDITADO', `${clave}: ${cambios.join(', ')}`);
    res.json({ message: 'Usuario actualizado', cambios });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reset-password', authMiddleware, loadPermisos(), requirePerm('admin_usuarios'), async (req, res) => {
  try {
    const { usuario, nueva, confirmar } = req.body;
    const clave = claveUsuario((usuario || '').trim());
    if (!nueva || nueva.length < 8) return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    if (nueva !== confirmar) return res.status(400).json({ error: 'Las contraseñas no coinciden' });

    const target = await firebaseGet(`usuarios/${clave}`);
    if (!target) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (esSuperAdmin(target) && !esSuperAdmin(req.userRecord)) {
      return res.status(403).json({ error: 'No puedes restablecer la contraseña de un Super Administrador' });
    }

    target.password = await hashPassword(nueva);
    await firebaseSet(`usuarios/${clave}`, target);
    registrarActividad(req.user?.nombre, 'PASSWORD_RESETEADO', `Contraseña restablecida para ${clave}`);
    res.json({ message: 'Contraseña restablecida' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/rol', authMiddleware, loadPermisos(), requirePerm('admin_usuarios'), async (req, res) => {
  const { usuario, rol } = req.body;
  const clave = claveUsuario((usuario || '').trim());
  if (clave === req.user.usuario) return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
  const target = await firebaseGet(`usuarios/${clave}`);
  if (!target) return res.status(404).json({ error: 'Usuario no encontrado' });
  if (esSuperAdmin(target) && !esSuperAdmin(req.userRecord)) {
    return res.status(403).json({ error: 'No puedes modificar a un Super Administrador' });
  }
  if ((rol === 'superadmin') && !esSuperAdmin(req.userRecord)) {
    return res.status(403).json({ error: 'Solo el Super Administrador puede asignar ese rol' });
  }
  target.rol = rol;
  await firebaseSet(`usuarios/${clave}`, target);
  registrarActividad(req.user?.nombre, 'USUARIO_EDITADO', `${clave}: rol ${rol}`);
  res.json({ message: 'Rol actualizado' });
});

router.delete('/:usuario', authMiddleware, loadPermisos(), requirePerm('admin_usuarios'), async (req, res) => {
  const clave = claveUsuario((req.params.usuario || '').trim());
  if (clave === req.user.usuario) return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
  const target = await firebaseGet(`usuarios/${clave}`);
  if (target && esSuperAdmin(target) && !esSuperAdmin(req.userRecord)) {
    return res.status(403).json({ error: 'No puedes eliminar a un Super Administrador' });
  }
  await firebaseSet(`usuarios/${clave}`, null);
  registrarActividad(req.user?.nombre, 'USUARIO_ELIMINADO', `Usuario ${clave} eliminado`);
  res.json({ message: 'Usuario eliminado' });
});

export default router;
