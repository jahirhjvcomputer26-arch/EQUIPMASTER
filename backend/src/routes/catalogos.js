import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { loadPermisos, requirePerm } from '../permisos.js';
import { firebaseGet, firebaseSet } from '../firebase.js';

const router = Router();
router.use(authMiddleware, loadPermisos());

const TIPOS = ['marcas', 'modelos', 'areas', 'sucursales', 'tiposEquipo', 'estados', 'fabricantes', 'procesadores', 'sistemasOperativos', 'ram', 'capacidades', 'tiposRam', 'tiposDisco', 'resoluciones', 'generaciones', 'tecnicos'];
const DEFAULTS = {
  marcas: [], modelos: [], areas: [], sucursales: [], tiposEquipo: ['LAPTOP', 'MINI PC', 'DESKTOP', 'ALL-IN-ONE', 'WORKSTATION', 'TABLET', 'MONITOR', 'ACCESORIO', 'OTRO'],
  estados: ['🔵 OK', '🟢 FULL (ML)', '🟡 Detalles', '🟠 Revisión', '🔴 TKF', '🔴 VENDIDO'], fabricantes: [], procesadores: [], sistemasOperativos: [],
  ram: ['N/A', '4 GB', '8 GB', '16 GB', '24 GB', '32 GB', '64 GB', '128 GB'], capacidades: ['N/A', '128 GB', '256 GB', '512 GB', '1 TB', '2 TB', '4 TB'], tiposRam: ['DDR3', 'DDR4', 'DDR5', 'LPDDR4', 'LPDDR5'], tiposDisco: ['N/A', 'M.2 NVME', 'SSD', 'HDD'], resoluciones: ['HD', 'FHD', 'FHD+', 'QHD', '4K'], generaciones: [], tecnicos: [],
};

router.get('/', async (_req, res) => {
  try {
    const saved = await firebaseGet('configuracion/catalogos') || {};
    const inventario = await firebaseGet('inventario') || {};
    const items = Object.values(inventario);
    const discovered = {
      marcas: [...new Set(items.map(i => i.marca).filter(Boolean))],
      modelos: [...new Set(items.map(i => i.modelo).filter(Boolean))],
      procesadores: [...new Set(items.map(i => i.procesador).filter(Boolean))],
      sistemasOperativos: [...new Set(items.map(i => i.sistemaOperativo).filter(Boolean))],
      tecnicos: [...new Set(items.map(i => i.tecnico).filter(Boolean))],
    };
    const result = {};
    for (const tipo of TIPOS) result[tipo] = [...new Set([...(saved[tipo] || DEFAULTS[tipo] || []), ...(discovered[tipo] || [])])].sort();
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:tipo', requirePerm('config_sistema'), async (req, res) => {
  try {
    const { tipo } = req.params;
    if (!TIPOS.includes(tipo)) return res.status(400).json({ error: 'Catálogo no válido' });
    if (!Array.isArray(req.body.valores)) return res.status(400).json({ error: 'valores debe ser un arreglo' });
    const valores = [...new Set(req.body.valores.map(v => String(v).trim()).filter(Boolean))].slice(0, 500);
    const actual = await firebaseGet('configuracion/catalogos') || {};
    actual[tipo] = valores;
    await firebaseSet('configuracion/catalogos', actual);
    res.json({ tipo, valores });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
