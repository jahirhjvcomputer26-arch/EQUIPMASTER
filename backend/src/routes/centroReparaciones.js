import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { loadPermisos, requirePerm } from '../permisos.js';
import { firebaseGet, firebaseSet, firebaseUpdate, firebaseDelete } from '../firebase.js';
import { registrarActividad } from './actividad.js';
import * as XLSX from 'xlsx';

const router = Router();
router.use(authMiddleware, loadPermisos());

const NODE = 'centroReparaciones';

const CATEGORIAS_VALIDAS = ['Pantallas', 'Baterías', 'Teclados', 'Almacenamiento (SSD/HDD)', 'Memoria RAM', 'Motherboard', 'Sistema de enfriamiento', 'Puertos (USB, HDMI, Type-C, etc.)', 'Cámara / Audio', 'Carcasa y bisagras', 'Software', 'Otros'];

const CATEGORIA_ALIAS = {
  'pantalla': 'Pantallas', 'display': 'Pantallas', 'lcd': 'Pantallas',
  'bateria': 'Baterías', 'battery': 'Baterías',
  'teclado': 'Teclados', 'keyboard': 'Teclados',
  'almacenamiento': 'Almacenamiento (SSD/HDD)', 'disco': 'Almacenamiento (SSD/HDD)', 'ssd': 'Almacenamiento (SSD/HDD)', 'hdd': 'Almacenamiento (SSD/HDD)',
  'memoria': 'Memoria RAM', 'ram': 'Memoria RAM',
  'motherboard': 'Motherboard', 'placa': 'Motherboard', 'mainboard': 'Motherboard', 'tarjetamadre': 'Motherboard',
  'enfriamiento': 'Sistema de enfriamiento', 'ventilador': 'Sistema de enfriamiento', 'fan': 'Sistema de enfriamiento', 'disipador': 'Sistema de enfriamiento',
  'puertos': 'Puertos (USB, HDMI, Type-C, etc.)', 'puerto': 'Puertos (USB, HDMI, Type-C, etc.)', 'usb': 'Puertos (USB, HDMI, Type-C, etc.)', 'hdmi': 'Puertos (USB, HDMI, Type-C, etc.)', 'tipoc': 'Puertos (USB, HDMI, Type-C, etc.)',
  'camara': 'Cámara / Audio', 'audio': 'Cámara / Audio', 'microfono': 'Cámara / Audio', 'parlante': 'Cámara / Audio', 'bocina': 'Cámara / Audio',
  'carcasa': 'Carcasa y bisagras', 'bisagra': 'Carcasa y bisagras', 'tapa': 'Carcasa y bisagras',
  'software': 'Software', 'sistema': 'Software',
  'otros': 'Otros', 'otro': 'Otros',
};

const ESTADOS_VALIDOS = ['Pendiente', 'En proceso', 'Esperando refacción', 'Finalizada'];
const PRIORIDADES_VALIDAS = ['Alta', 'Media', 'Baja'];

const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

const HEADER_ALIAS = {
  marca: ['marca', 'fabricante', 'brand', 'equipo'],
  modelo: ['modelo', 'model'],
  serie: ['serie', 'serial', 'sn', 'noserie', 'numerodeserie', 'numserie', 'nserie'],
  categoria: ['categoria', 'tipodefalla', 'tipofalla', 'categoriadefalla', 'fallacategoria', 'tipo'],
  prioridad: ['prioridad'],
  falla: ['falla', 'falladetectada', 'detalle', 'problema', 'descripcion', 'observaciones', 'observacion', 'defecto', 'diagnostico'],
  tecnico: ['tecnico', 'tecnicoasignado', 'responsable', 'encargado'],
  estado: ['estado', 'estatus', 'status'],
  fecha: ['fecha', 'fechadeingreso', 'fechaingreso', 'fechadeentrada', 'ingreso'],
};

function detectarCols(headers) {
  const cols = {};
  const tokens = headers.map(h => norm(h));
  for (const [campo, alias] of Object.entries(HEADER_ALIAS)) {
    cols[campo] = tokens.findIndex(t => alias.includes(t) || t.includes(alias[0]));
  }
  return cols;
}

function parseFecha(v) {
  if (v instanceof Date && !isNaN(v)) return new Date(v.getTime()).toISOString();
  if (typeof v === 'number') {
    const d = new Date(Date.UTC(1899, 11, 30) + v * 86400000);
    if (!isNaN(d)) return d.toISOString();
  }
  if (typeof v === 'string') {
    const s = v.trim();
    let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toISOString();
    m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (m) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1])).toISOString();
  }
  return new Date().toISOString();
}

function normalizarCategoria(v) {
  const token = norm(v);
  if (!token) return 'Otros';
  for (const [alias, cat] of Object.entries(CATEGORIA_ALIAS)) {
    if (token.includes(alias)) return cat;
  }
  const cat = CATEGORIAS_VALIDAS.find(c => norm(c).includes(token));
  return cat || 'Otros';
}

function normalizarPrioridad(v) {
  const t = norm(v);
  if (t.includes('alta') || t === 'a') return 'Alta';
  if (t.includes('baja') || t === 'b') return 'Baja';
  return 'Media';
}

function normalizarEstado(v) {
  const t = norm(v);
  if (t.includes('finaliz') || t.includes('termin') || t === 'fin') return 'Finalizada';
  if (t.includes('proceso') || t.includes('reparando')) return 'En proceso';
  if (t.includes('esperando') || t.includes('refaccion') || t.includes('pieza')) return 'Esperando refacción';
  return 'Pendiente';
}

const normalizarSerie = s => String(s || '').trim().toUpperCase().replace(/\s+/g, '');

function normalizar(body, id) {
  return {
    id,
    marca: (body.marca || '').toUpperCase().trim(),
    modelo: (body.modelo || '').toUpperCase().trim(),
    serie: (body.serie || '').toUpperCase().trim(),
    categoria: (body.categoria || 'Otros').trim(),
    prioridad: body.prioridad || 'Media',
    falla: (body.falla || '').toUpperCase().trim(),
    tecnico: (body.tecnico || 'SIN ASIGNAR').toUpperCase().trim(),
    estado: body.estado || 'Pendiente',
    fecha: body.fecha || new Date().toISOString(),
    fechaFin: body.fechaFin || null,
    origen: 'manual',
    fechaRegistro: body.fechaRegistro || new Date().toISOString(),
  };
}

router.get('/', requirePerm('ver_reparaciones'), async (_req, res) => {
  try {
    const data = await firebaseGet(NODE);
    const list = data ? Object.entries(data).map(([id, v]) => ({ id, ...v })) : [];
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/plantilla', requirePerm('ver_reparaciones'), async (_req, res) => {
  try {
    const filas = [{
      marca: 'LENOVO', modelo: 'THINKPAD T520', serie: 'R9-XXXX', categoria: 'Pantallas',
      prioridad: 'Media', falla: 'LINEA BLANCA EN PANTALLA', tecnico: 'JAHIR HERNANDEZ',
      estado: 'Pendiente', fecha: new Date().toISOString().split('T')[0],
    }];
    const hoja = XLSX.utils.json_to_sheet(filas);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Centro Reparaciones');
    const buffer = XLSX.write(libro, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=Plantilla_Centro_Reparaciones.xlsx');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/importar', requirePerm('registrar_reparaciones'), async (req, res) => {
  try {
    const { nombre, data } = req.body;
    if (!data) return res.status(400).json({ error: 'No se recibió ningún archivo' });

    const buffer = Buffer.from(data, 'base64');
    const libro = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const hoja = libro.Sheets[libro.SheetNames[0]];
    if (!hoja) return res.status(400).json({ error: 'El archivo no contiene hojas de cálculo' });

    const rows = XLSX.utils.sheet_to_json(hoja, { header: 1, defval: '', raw: true });
    if (rows.length < 2) return res.status(400).json({ error: 'El archivo debe tener un encabezado y al menos una fila de datos' });

    const cols = detectarCols(rows[0] || []);
    if (cols.marca < 0 && cols.modelo < 0 && cols.serie < 0) {
      return res.status(400).json({ error: 'No se reconocieron columnas de marca, modelo o serie. Usa la plantilla descargable.' });
    }

    const [centroData, inventarioData] = await Promise.all([
      firebaseGet(NODE),
      firebaseGet('inventario'),
    ]);

    const seriesActivas = new Set(
      Object.values(centroData || {}).filter(r => r.estado !== 'Finalizada').map(r => normalizarSerie(r.serie))
    );
    const seriesInventario = new Set(
      Object.values(inventarioData || {}).map(r => normalizarSerie(r.serie))
    );

    const get = (row, campo) => (cols[campo] >= 0 ? row[cols[campo]] : '');
    const nuevos = {};
    const errores = [];
    const base = Date.now();
    let importados = 0;

    rows.slice(1).forEach((row, i) => {
      const marca = String(get(row, 'marca') || '').trim();
      const modelo = String(get(row, 'modelo') || '').trim();
      const serieRaw = String(get(row, 'serie') || '').trim();
      const serie = serieRaw.toUpperCase();
      const ref = `Fila ${i + 2}`;

      if (!marca && !modelo && !serieRaw) return;

      if (marca && !modelo) { errores.push(`${ref}: falta el modelo — omitida`); return; }
      if (modelo && !marca) { errores.push(`${ref}: falta la marca — omitida`); return; }
      if (!serieRaw) { errores.push(`${ref}: falta la serie — omitida`); return; }

      const sn = normalizarSerie(serieRaw);
      if (seriesActivas.has(sn)) { errores.push(`${ref}: serie ${serie} ya está en reparación activa — omitida`); return; }
      if (seriesInventario.has(sn)) { errores.push(`${ref}: serie ${serie} ya existe en el inventario — omitida`); return; }
      seriesActivas.add(sn);

      const id = `CR-${base}${String(i).padStart(2, '0')}`;
      nuevos[id] = {
        id,
        marca: marca.toUpperCase(),
        modelo: modelo.toUpperCase(),
        serie,
        categoria: normalizarCategoria(get(row, 'categoria')),
        prioridad: normalizarPrioridad(get(row, 'prioridad')),
        falla: String(get(row, 'falla') || '').toUpperCase().trim() || 'SIN FALLA DETALLADA',
        tecnico: String(get(row, 'tecnico') || 'SIN ASIGNAR').toUpperCase().trim(),
        estado: normalizarEstado(get(row, 'estado')),
        fecha: parseFecha(get(row, 'fecha')),
        fechaFin: null,
        origen: 'importado',
        fechaRegistro: new Date().toISOString(),
      };
      importados++;
    });

    if (importados > 0) {
      await firebaseUpdate(NODE, nuevos);
      registrarActividad(req.user?.nombre, 'CENTRO_IMPORTADO', `${importados} equipos importados desde ${nombre || 'Excel'}`);
    }

    res.json({ total: importados + errores.length, importados, omitidos: errores.length, errores });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requirePerm('registrar_reparaciones'), async (req, res) => {
  try {
    const { marca, modelo, serie } = req.body;
    if (!marca || !modelo || !serie) {
      return res.status(400).json({ error: 'Marca, modelo y serie son obligatorios' });
    }
    const id = `CR-${Date.now()}`;
    const reparacion = normalizar(req.body, id);
    await firebaseSet(`${NODE}/${id}`, reparacion);
    registrarActividad(req.user?.nombre, 'REPARACION_CENTRO', `${marca} ${modelo} (${serie}) → ${reparacion.categoria}`);
    res.status(201).json({ message: 'Equipo registrado en el centro', id, reparacion });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', requirePerm('registrar_reparaciones'), async (req, res) => {
  try {
    const actual = await firebaseGet(`${NODE}/${req.params.id}`);
    if (!actual) return res.status(404).json({ error: 'Registro no encontrado' });
    const reparacion = normalizar({ ...actual, ...req.body }, req.params.id);
    await firebaseSet(`${NODE}/${req.params.id}`, reparacion);
    registrarActividad(req.user?.nombre, 'REPARACION_CENTRO_EDITADA', `${reparacion.marca} ${reparacion.modelo} actualizado`);
    res.json({ message: 'Registro actualizado', reparacion });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/finalizar', requirePerm('aprobar_reparaciones'), async (req, res) => {
  try {
    const actual = await firebaseGet(`${NODE}/${req.params.id}`);
    if (!actual) return res.status(404).json({ error: 'Registro no encontrado' });
    const reparacion = {
      ...actual,
      estado: 'Finalizada',
      fechaFin: new Date().toISOString(),
    };
    await firebaseSet(`${NODE}/${req.params.id}`, reparacion);
    registrarActividad(req.user?.nombre, 'REPARACION_CENTRO_FINALIZADA', `${actual.marca} ${actual.modelo} (${actual.serie})`);
    res.json({ message: 'Reparación finalizada', reparacion });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requirePerm('aprobar_reparaciones'), async (req, res) => {
  try {
    await firebaseDelete(`${NODE}/${req.params.id}`);
    res.json({ message: 'Registro eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
