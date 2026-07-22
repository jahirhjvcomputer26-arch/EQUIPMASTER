import { Router } from 'express';
import { uploadToStorage, deleteFromStorage, makePublic, getPublicUrl, listStorageFiles } from '../storage.js';
import { firebaseGet } from '../firebase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.post('/upload', async (req, res) => {
  try {
    const { codigo, categoria, tipo, archivo, esDocumento } = req.body;
    if (!codigo || !categoria || !archivo) {
      return res.status(400).json({ error: 'Faltan campos: codigo, categoria, archivo' });
    }

    const matches = archivo.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: 'Formato base64 inválido' });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const maxSize = esDocumento ? 10 * 1024 * 1024 : 3 * 1024 * 1024;
    if (buffer.length > maxSize) {
      return res.status(400).json({ error: `Archivo muy grande. Máximo: ${esDocumento ? '10' : '3'} MB` });
    }

    const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'bin';
    const prefix = esDocumento ? 'documentos' : 'fotos';
    const filePath = `${prefix}/${codigo.toUpperCase()}/${categoria}.${ext}`;

    await uploadToStorage(filePath, buffer, mimeType);
    await makePublic(filePath);

    const url = getPublicUrl(filePath);

    res.json({ url, path: filePath, size: buffer.length });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Error al subir archivo: ' + err.message });
  }
});

router.delete('/delete', async (req, res) => {
  try {
    const { path } = req.query;
    if (!path) return res.status(400).json({ error: 'Falta path' });

    await deleteFromStorage(path);
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

router.post('/cleanup', async (req, res) => {
  try {
    const inventario = await firebaseGet('inventario');
    if (!inventario) return res.json({ eliminados: 0, razon: 'Sin inventario' });

    const tresMesesMs = 90 * 24 * 60 * 60 * 1000;
    const ahora = Date.now();
    let eliminados = 0;
    let conservados = 0;
    const detalles = [];

    for (const [codigo, item] of Object.entries(inventario)) {
      if (!item.estado?.includes('🔴 VENDIDO')) continue;
      if (item.flujoDevolucion) { conservados++; continue; }

      let fechaVenta = null;
      if (item.flujoVentaML?.fechaVenta) fechaVenta = new Date(item.flujoVentaML.fechaVenta);
      else if (item.flujoSalida?.fechaSalida) fechaVenta = new Date(item.flujoSalida.fechaSalida);

      if (!fechaVenta || isNaN(fechaVenta.getTime())) continue;
      if (ahora - fechaVenta.getTime() < tresMesesMs) continue;

      try {
        const fotosFiles = await listStorageFiles(`fotos/${codigo}/`);
        for (const f of fotosFiles) await deleteFromStorage(f.name);
        const docsFiles = await listStorageFiles(`documentos/${codigo}/`);
        for (const f of docsFiles) await deleteFromStorage(f.name);
        eliminados++;
        detalles.push(codigo);
      } catch (err) {
        console.error(`Cleanup error para ${codigo}:`, err.message);
      }
    }

    res.json({ eliminados, conservados, detalles });
  } catch (err) {
    console.error('Cleanup error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
