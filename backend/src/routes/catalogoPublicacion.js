import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { loadPermisos, requirePerm } from '../permisos.js';
import { firebaseGet, firebaseSet } from '../firebase.js';
import { registrarActividad } from './actividad.js';

const router = Router();
router.use(authMiddleware, loadPermisos(), requirePerm('publicar_catalogo'));

function fotosLocales(fotos) {
  return Object.fromEntries(Object.entries(fotos || {}).map(([key, value]) => {
    const raw = String(value || '');
    const match = raw.match(/storage\.googleapis\.com\/[^/]+\/(.+)$/);
    return [key, match ? `/archivos/${match[1]}` : value];
  }));
}

router.get('/', async (_req, res) => {
  try {
    const data = await firebaseGet('inventario');
    const lista = (data ? Object.values(data) : [])
      .filter(i => i.estado?.includes('🔵 OK') && !i.estado?.includes('VENDIDO'))
      .map(i => ({
        codigo: i.codigo, marca: i.marca, modelo: i.modelo, serie: i.serie,
        ram: i.ram, almacenamiento: i.almacenamiento, procesador: i.procesador,
        fotos: fotosLocales(i.fotos), publicado: i.publicado === true,
        precioPublico: i.precioPublico || '', descripcionPublica: i.descripcionPublica || '',
      }));
    res.json(lista);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:codigo', async (req, res) => {
  try {
    const codigo = req.params.codigo.toUpperCase();
    const item = await firebaseGet(`inventario/${codigo}`);
    if (!item) return res.status(404).json({ error: 'Equipo no encontrado' });
    const publicado = req.body.publicado === true;
    if (publicado && !item.estado?.includes('🔵 OK')) return res.status(400).json({ error: 'Solo se pueden publicar equipos en estado 🔵 OK' });
    const actualizado = {
      ...item,
      publicado,
      precioPublico: publicado ? String(req.body.precioPublico || '').trim() : item.precioPublico || '',
      descripcionPublica: publicado ? String(req.body.descripcionPublica || '').trim() : item.descripcionPublica || '',
    };
    await firebaseSet(`inventario/${codigo}`, actualizado);
    registrarActividad(req.user?.nombre, publicado ? 'PRODUCTO_PUBLICADO' : 'PRODUCTO_OCULTO', `${codigo} en catálogo`, { registro: `inventario/${codigo}` });
    res.json({ ok: true, producto: { codigo, publicado: actualizado.publicado, precioPublico: actualizado.precioPublico, descripcionPublica: actualizado.descripcionPublica } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
