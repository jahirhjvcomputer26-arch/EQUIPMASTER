import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { firebaseDelete, firebaseGet, firebaseSet } from '../firebase.js';
import { registrarActividad } from './actividad.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (_req, res) => {
  try {
    const data = await firebaseGet('inventario');
    const lista = data ? Object.values(data) : [];
    res.json(lista);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:codigo', async (req, res) => {
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
      `${codigo} · ${req.body.marca || ''} ${req.body.modelo || ''}`);
    res.json({ message: 'Equipo guardado', codigo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:codigo', async (req, res) => {
  try {
    await firebaseDelete(`inventario/${req.params.codigo}`);
    registrarActividad(req.user?.nombre, 'EQUIPO_ELIMINADO', `Código ${req.params.codigo}`);
    res.json({ message: 'Equipo eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
