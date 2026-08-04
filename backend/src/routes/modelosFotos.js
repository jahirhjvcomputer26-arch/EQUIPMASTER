import { Router } from 'express';
import { uploadToStorage, deleteFromStorage, makePublic, getPublicUrl } from '../storage.js';
import { firebaseGet, firebaseSet, firebaseDelete } from '../firebase.js';
import { authMiddleware } from '../middleware/auth.js';
import { loadPermisos, requirePerm } from '../permisos.js';

const router = Router();
router.use(authMiddleware, loadPermisos());

const ROOT = 'modelosFotos';
const MAX_SIZE = 3 * 1024 * 1024;

function normalizarClave(marca, modelo) {
  const txt = `${(marca || '').toUpperCase().trim()} ${(modelo || '').toUpperCase().trim()}`.replace(/\s+/g, ' ');
  const clave = txt.replace(/[^A-Z0-9.]+/g, '_').replace(/^_+|_+$/g, '');
  return clave || 'SIN_NOMBRE';
}

function fotoId(nombre, ext) {
  const base = (nombre || 'foto').replace(/[^A-Za-z0-9._-]/g, '_').replace(/_+/g, '_');
  const sinExt = base.replace(/\.[A-Za-z0-9]+$/, '');
  return `${Date.now()}-${sinExt}.${ext}`;
}

function parseDataUrl(archivo) {
  const matches = (archivo || '').match(/^data:(.+);base64,(.+)$/);
  if (!matches) return null;
  return { mimeType: matches[1], buffer: Buffer.from(matches[2], 'base64') };
}

async function obtenerGrupo(clave) {
  return (await firebaseGet(`${ROOT}/${clave}`)) || null;
}

router.get('/', async (req, res) => {
  try {
    const data = await firebaseGet(ROOT);
    const grupos = data ? Object.entries(data) : [];
    const lista = grupos.map(([clave, g]) => {
      const fotos = g.fotos || {};
      const items = Object.entries(fotos).map(([id, f]) => ({ id, url: f.url, path: f.path, nombre: f.nombre, subidoPor: f.subidoPor, fecha: f.fecha })).sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
      return { clave, marca: g.marca, modelo: g.modelo, cantidad: items.length, miniatura: items[0]?.url || null, fotos: items };
    });
    lista.sort((a, b) => (a.marca || '').localeCompare(b.marca || '') || (a.modelo || '').localeCompare(b.modelo || ''));
    res.json(lista);
  } catch (err) {
    console.error('modelosFotos list error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:clave', async (req, res) => {
  try {
    const g = await obtenerGrupo(req.params.clave);
    if (!g) return res.status(404).json({ error: 'Modelo no encontrado' });
    const fotos = g.fotos || {};
    const items = Object.entries(fotos).map(([id, f]) => ({ id, url: f.url, path: f.path, nombre: f.nombre, subidoPor: f.subidoPor, fecha: f.fecha })).sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
    res.json({ clave: req.params.clave, marca: g.marca, modelo: g.modelo, cantidad: items.length, fotos: items });
  } catch (err) {
    console.error('modelosFotos get error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requirePerm('gestionar_modelos'), async (req, res) => {
  try {
    const { marca, modelo, archivo, nombre } = req.body;
    if (!marca || !modelo || !archivo) {
      return res.status(400).json({ error: 'Faltan campos: marca, modelo, archivo' });
    }
    const parsed = parseDataUrl(archivo);
    if (!parsed) return res.status(400).json({ error: 'Formato base64 inválido' });
    if (parsed.buffer.length > MAX_SIZE) {
      return res.status(400).json({ error: 'Archivo muy grande. Máximo 3 MB por foto' });
    }

    const clave = normalizarClave(marca, modelo);
    const ext = parsed.mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'bin';
    const id = fotoId(nombre, ext);
    const filePath = `${ROOT}/${clave}/${id}`;

    await uploadToStorage(filePath, parsed.buffer, parsed.mimeType);
    await makePublic(filePath);

    const url = getPublicUrl(filePath);
    const grupo = (await obtenerGrupo(clave)) || { marca: marca.trim(), modelo: modelo.trim(), creadoPor: req.user?.usuario, fechaCreacion: new Date().toISOString(), fotos: {} };
    grupo.fotos = grupo.fotos || {};
    grupo.fotos[id] = { url, path: filePath, nombre: nombre || id, subidoPor: req.user?.usuario, fecha: new Date().toISOString() };
    await firebaseSet(`${ROOT}/${clave}`, grupo);

    res.json({ ok: true, clave, fotoId: id, url });
  } catch (err) {
    console.error('modelosFotos upload error:', err);
    res.status(500).json({ error: 'Error al subir foto: ' + err.message });
  }
});

router.delete('/:clave/:fotoId', requirePerm('gestionar_modelos'), async (req, res) => {
  try {
    const { clave, fotoId } = req.params;
    const grupo = await obtenerGrupo(clave);
    if (!grupo || !grupo.fotos?.[fotoId]) return res.status(404).json({ error: 'Foto no encontrada' });

    const foto = grupo.fotos[fotoId];
    try { await deleteFromStorage(foto.path); } catch { /* sigue */ }
    delete grupo.fotos[fotoId];

    if (Object.keys(grupo.fotos).length === 0) {
      await firebaseDelete(`${ROOT}/${clave}`);
    } else {
      await firebaseSet(`${ROOT}/${clave}`, grupo);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('modelosFotos delete foto error:', err);
    res.status(500).json({ error: 'Error al eliminar foto' });
  }
});

router.delete('/:clave', requirePerm('gestionar_modelos'), async (req, res) => {
  try {
    const { clave } = req.params;
    const grupo = await obtenerGrupo(clave);
    if (grupo?.fotos) {
      for (const f of Object.values(grupo.fotos)) {
        try { await deleteFromStorage(f.path); } catch { /* sigue */ }
      }
    }
    await firebaseDelete(`${ROOT}/${clave}`);
    res.json({ ok: true });
  } catch (err) {
    console.error('modelosFotos delete grupo error:', err);
    res.status(500).json({ error: 'Error al eliminar modelo' });
  }
});

export default router;
