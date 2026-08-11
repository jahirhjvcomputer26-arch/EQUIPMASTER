import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { loadPermisos, requirePerm } from '../permisos.js';
import { firebaseGet } from '../firebase.js';

const router = Router();
router.use(authMiddleware, loadPermisos(), requirePerm('ver_marketing'));

router.get('/', async (_req, res) => {
  try {
    const data = await firebaseGet('inventario');
    const equipos = (data ? Object.values(data) : [])
      .filter(i => i.estado?.includes('🔵 OK') && !i.estado?.includes('VENDIDO'))
      .map(i => ({
        codigo: i.codigo, marca: i.marca, modelo: i.modelo, serie: i.serie,
        categoria: i.categoria, procesador: i.procesador, ram: i.ram,
        almacenamiento: i.almacenamiento, tipoDisco: i.tipoDisco, grafica: i.grafica,
        sistemaOperativo: i.sistemaOperativo, pantalla: i.pantalla, color: i.color,
        precioPublico: i.precioPublico || '', descripcionPublica: i.descripcionPublica || '',
        detallesPublicos: i.detallesPublicos || '', publicado: i.publicado === true,
        fotos: i.fotos || {},
      }));
    res.json(equipos);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
