import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { loadPermisos, requirePerm, tienePermiso } from '../permisos.js';
import { firebaseDelete, firebaseGet, firebaseSet } from '../firebase.js';
import { registrarActividad } from './actividad.js';

const router = Router();

router.get('/public/consulta', async (req, res) => {
  try {
    const q = (req.query.q || '').toUpperCase().trim();
    if (!q) return res.status(400).json({ error: 'Parámetro q requerido' });
    const data = await firebaseGet('inventario');
    const items = data ? Object.values(data) : [];
    const found = items.find(i =>
      i.codigo?.toUpperCase() === q ||
      i.serie?.toUpperCase() === q ||
      i.sku?.toUpperCase() === q
    );
    if (!found) return res.status(404).json({ error: 'Equipo no encontrado con ese código o serie' });
    res.json(found);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function productoPublico(item) {
  const fotos = Object.fromEntries(Object.entries(item.fotos || {}).map(([key, value]) => {
    const raw = String(value || '');
    const match = raw.match(/storage\.googleapis\.com\/[^/]+\/(.+)$/);
    return [key, match ? `/archivos/${match[1]}` : value];
  }));
  return {
    codigo: item.codigo,
    categoria: item.categoria,
    marca: item.marca,
    modelo: item.modelo,
    modeloComercial: item.modeloComercial,
    procesador: item.procesador,
    ram: item.ram,
    almacenamiento: item.almacenamiento,
    tipoDisco: item.tipoDisco,
    grafica: item.grafica,
    sistemaOperativo: item.sistemaOperativo,
    estado: item.estado,
    precioPublico: item.precioPublico,
    descripcionPublica: item.descripcionPublica,
    fotos,
  };
}

router.get('/public/catalogo', async (_req, res) => {
  try {
    const data = await firebaseGet('inventario');
    const lista = (data ? Object.values(data) : [])
      .filter(item => item.publicado === true && !item.estado?.includes('VENDIDO'))
      .map(productoPublico);
    res.json(lista);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/public/catalogo/:codigo', async (req, res) => {
  try {
    const item = await firebaseGet(`inventario/${req.params.codigo}`);
    if (!item || item.publicado !== true || item.estado?.includes('VENDIDO')) return res.status(404).json({ error: 'Producto no disponible' });
    res.json(productoPublico(item));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.use(authMiddleware, loadPermisos());

router.get('/', requirePerm('ver_inventario'), async (_req, res) => {
  try {
    const data = await firebaseGet('inventario');
    const lista = data ? Object.values(data) : [];
    res.json(lista);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/buscar', requirePerm('ver_inventario'), async (req, res) => {
  try {
    const data = await firebaseGet('inventario');
    const q = String(req.query.q || '').trim().toLowerCase();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const fields = ['codigo', 'serie', 'sku', 'marca', 'modelo', 'procesador', 'ram', 'almacenamiento', 'tipoDisco', 'grafica', 'tecnico', 'estado', 'sistemaOperativo', 'color'];
    const lista = (data ? Object.values(data) : []).filter(item => {
      if (!q) return true;
      return fields.some(field => String(item[field] || '').toLowerCase().includes(q));
    });
    const inicio = (page - 1) * limit;
    res.json({ data: lista.slice(inicio, inicio + limit), total: lista.length, page, limit });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:codigo', requirePerm('ver_inventario'), async (req, res) => {
  try {
    const item = await firebaseGet(`inventario/${req.params.codigo}`);
    if (!item) return res.status(404).json({ error: 'Equipo no encontrado' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:codigo', async (req, res) => {
  try {
    let codigo = req.params.codigo;
    const existente = await firebaseGet(`inventario/${codigo}`);
    const esNuevo = !existente;
    const perm = esNuevo ? 'crear_equipos' : 'editar_equipos';
    if (!tienePermiso(req, perm)) {
      return res.status(403).json({ error: `Acceso denegado: necesitas permiso de ${esNuevo ? 'crear' : 'editar'} equipos` });
    }
    if (esNuevo && existente !== null) {
      const data = await firebaseGet('inventario');
      const items = data ? Object.keys(data) : [];
      let maxNum = 1000;
      items.forEach(k => {
        if (k.startsWith('INV-')) {
          const n = parseInt(k.replace('INV-', ''), 10);
          if (n > maxNum) maxNum = n;
        }
      });
      codigo = `INV-${maxNum + 1}`;
      req.body.codigo = codigo;
    }

    if (!esNuevo && existente) {
      const camposDetectados = [];
      const camposClave = ['procesador', 'ram', 'almacenamiento', 'tipoDisco', 'grafica', 'estado', 'tecnico', 'bateria', 'cargador', 'observaciones', 'modelo', 'marca', 'serie', 'generacion', 'tipoRam', 'resolucion', 'color', 'sistemaOperativo'];
      camposClave.forEach(c => {
        const viejo = typeof existente[c] === 'object' ? JSON.stringify(existente[c]) : String(existente[c] || '');
        const nuevo = typeof req.body[c] === 'object' ? JSON.stringify(req.body[c]) : String(req.body[c] || '');
        if (viejo !== nuevo) camposDetectados.push(c);
      });
      if (req.body.checklistPruebas && existente.checklistPruebas) {
        const oldKeys = Object.keys(existente.checklistPruebas).sort();
        const newKeys = Object.keys(req.body.checklistPruebas).sort();
        if (JSON.stringify(oldKeys) !== JSON.stringify(newKeys)) camposDetectados.push('checklistPruebas');
      }
      if (camposDetectados.length > 0) {
        if (!req.body.historial) req.body.historial = existente.historial || [];
        req.body.historial.push({
          fecha: new Date().toISOString(),
          usuario: req.user?.nombre || 'SISTEMA',
          cambios: camposDetectados.join(', '),
        });
      }
    }

    await firebaseSet(`inventario/${codigo}`, req.body);
    registrarActividad(req.user?.nombre, esNuevo ? 'EQUIPO_REGISTRADO' : 'EQUIPO_EDITADO',
      `${codigo} · ${req.body.marca || ''} ${req.body.modelo || ''}`, {
        registro: `inventario/${codigo}`,
        antes: existente || null,
        despues: req.body,
      });
    res.json({ message: 'Equipo guardado', codigo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:codigo', requirePerm('eliminar_equipos'), async (req, res) => {
  try {
    const existente = await firebaseGet(`inventario/${req.params.codigo}`);
    await firebaseDelete(`inventario/${req.params.codigo}`);
    registrarActividad(req.user?.nombre, 'EQUIPO_ELIMINADO', `Código ${req.params.codigo}`, {
      registro: `inventario/${req.params.codigo}`,
      antes: existente || null,
      despues: null,
    });
    res.json({ message: 'Equipo eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
