import mssql from 'mssql';

// ============================================================
// Capa de datos SQL Server para EquipMaster
// Reemplaza las lecturas/escrituras del Realtime Database de
// Firebase por tablas SQL, manteniendo la MISMA forma de datos.
//
// Variables de entorno:
//   DB_SERVER     host o 'host\INSTANCIA' (ej: 'localhost\SQLEXPRESS')
//   DB_PORT       (opcional, default 1433; se ignora en instancias nombradas)
//   DB_DATABASE   (opcional, default 'EquipMaster')
//   DB_USER       usuario SQL
//   DB_PASSWORD   contraseña SQL
// ============================================================

const DB_SERVER = process.env.DB_SERVER || '';
const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined;
const DB_DATABASE = process.env.DB_DATABASE || 'EquipMaster';

function connConfig(db) {
  const cfg = {
    server: DB_SERVER,
    database: db || DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: { encrypt: false, trustServerCertificate: true },
  };
  if (!DB_SERVER.includes('\\')) cfg.port = DB_PORT || 1433;
  return cfg;
}

// ---------------- Pool ----------------

let pool = null;
let poolPromise = null;

async function connect(db) {
  const p = new mssql.ConnectionPool(connConfig(db));
  await p.connect();
  return p;
}

async function getPool() {
  if (pool && pool.connected) return pool;
  if (poolPromise) return poolPromise;
  poolPromise = (async () => {
    try {
      pool = await connect(DB_DATABASE);
      return pool;
    } catch (err) {
      if (/4060|Cannot open database|not found/i.test(err.message)) {
        const master = await connect('master');
        await master.request()
          .input('db', mssql.NVarChar(128), DB_DATABASE)
          .query(`IF DB_ID(@db) IS NULL CREATE DATABASE [${DB_DATABASE.replace(/[^\w]/g, '_')}]`);
        await master.close();
        pool = await connect(DB_DATABASE);
        return pool;
      }
      throw err;
    }
  })();
  try {
    return await poolPromise;
  } finally {
    poolPromise = null;
  }
}

async function run(query, params = {}) {
  const p = await getPool();
  const req = p.request();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    if (v === null) { req.input(k, mssql.NVarChar(4000), null); continue; }
    if (typeof v === 'boolean') req.input(k, mssql.Bit, v);
    else if (typeof v === 'number') {
      if (!Number.isInteger(v)) req.input(k, mssql.Float, v);
      else if (v >= -2147483648 && v <= 2147483647) req.input(k, mssql.Int, v);
      else req.input(k, mssql.BigInt, v);
    } else req.input(k, mssql.NVarChar(mssql.MAX), v);
  }
  const res = await req.query(query);
  return res.recordset || [];
}

// ---------------- Mapeo de tablas ----------------

const TABLES = {
  inventario: {
    table: 'Inventario', idCol: 'Codigo', mode: 'flat',
    bits: ['pantallaTactil', 'retroiluminacion', 'lectorHuellas', 'camaraIR'],
    flat: {
      codigo: 'Codigo', categoria: 'Categoria', marca: 'Marca', modelo: 'Modelo',
      serie: 'Serie', sku: 'Sku', procesador: 'Procesador', ram: 'Ram',
      almacenamiento: 'Almacenamiento', tipoDisco: 'TipoDisco', grafica: 'Grafica',
      tecnico: 'Tecnico', bateria: 'Bateria', cargador: 'Cargador', estado: 'Estado',
      observaciones: 'Observaciones', anio: 'Anio', generacion: 'Generacion',
      tipoRam: 'TipoRam', resolucion: 'Resolucion', wifi: 'Wifi', bluetooth: 'Bluetooth',
      sistemaOperativo: 'SistemaOperativo', color: 'Color', pantalla: 'Pantalla',
      modeloComercial: 'ModeloComercial', fechaRevision: 'FechaRevision',
      fechaRegistro: 'FechaRegistro',
    },
    json: {
      condicionEstetica: 'CondicionEstetica', bateriaDetalle: 'BateriaDetalle',
      checklistPruebas: 'ChecklistPruebas', fotos: 'Fotos', historial: 'Historial',
      flujoSalida: 'FlujoSalida', flujoVentaML: 'FlujoVentaML',
      flujoDevolucion: 'FlujoDevolucion', flujoMercadoLibre: 'FlujoMercadoLibre',
    },
  },
  usuarios: {
    table: 'Usuarios', idCol: 'Clave', mode: 'flat',
    bits: ['activo'],
    flat: {
      nombre: 'Nombre', password: 'PasswordHash', rol: 'Rol', nivel: 'Nivel',
      activo: 'Activo', creado: 'Creado',
    },
    json: { permisos: 'Permisos', sesionActiva: 'SesionActiva' },
  },
  roles: {
    table: 'Roles', idCol: 'Rol', mode: 'flat',
    flat: { nivel: 'Nivel', nombre: 'Nombre', color: 'Color', descripcion: 'Descripcion' },
    json: { permisos: 'Permisos' },
  },
  permisosCatalog: {
    table: 'PermisosCatalog', idCol: 'Clave', mode: 'flat',
    flat: { label: 'Label', grupo: 'Grupo', desc: 'Descripcion' },
    json: {},
  },
  tickets: {
    table: 'Tickets', idCol: 'Id', mode: 'flat',
    bits: [],
    bigints: ['timestamp'],
    flat: {
      id: 'Id', asunto: 'Asunto', descripcion: 'Descripcion', prioridad: 'Prioridad',
      estado: 'Estado', creadoPor: 'CreadoPor', creadoPorClave: 'CreadoPorClave',
      creadoEn: 'CreadoEn', timestamp: 'Timestamp', tecnicoAsignado: 'TecnicoAsignado',
      tecnicoAsignadoNombre: 'TecnicoAsignadoNombre', fechaAsignacion: 'FechaAsignacion',
      fechaEstimadaEntrega: 'FechaEstimadaEntrega', notasInternas: 'NotasInternas',
      modificadoEn: 'ModificadoEn',
    },
    json: {
      notas: 'Notas', historial: 'Historial', diagnosticos: 'Diagnosticos',
      reparaciones: 'Reparaciones', piezas: 'Piezas', fotografias: 'Fotografias',
    },
  },
  centroReparaciones: {
    table: 'CentroReparaciones', idCol: 'Id', mode: 'flat',
    bits: [],
    flat: {
      id: 'Id', marca: 'Marca', modelo: 'Modelo', serie: 'Serie', categoria: 'Categoria',
      prioridad: 'Prioridad', falla: 'Falla', tecnico: 'Tecnico', estado: 'Estado',
      fecha: 'Fecha', fechaFin: 'FechaFin', origen: 'Origen', fechaRegistro: 'FechaRegistro',
    },
    json: { fotos: 'Fotos' },
  },
  prestamos: {
    table: 'Prestamos', idCol: 'Id', mode: 'flat',
    bits: ['activo'],
    includeId: true,
    flat: {
      serie: 'Serie', modelo: 'Modelo', procesador: 'Procesador', responsable: 'Responsable',
      area: 'Area', fechaSalida: 'FechaSalida', notas: 'Notas', activo: 'Activo',
      fechaRegistro: 'FechaRegistro', fechaDevolucion: 'FechaDevolucion',
    },
    json: {},
  },
  actividad: {
    table: 'Actividad', idCol: 'Id', mode: 'flat',
    bits: [],
    bigints: ['timestamp'],
    includeId: true,
    flat: {
      usuario: 'Usuario', accion: 'Accion', detalle: 'Detalle',
      fecha: 'Fecha', timestamp: 'Timestamp',
    },
    json: {},
  },
  reparaciones: { table: 'Reparaciones', idCol: 'Id', mode: 'json' },
  ventas: { table: 'Ventas', idCol: 'Id', mode: 'json', fechaCol: 'Fecha' },
  notificaciones: { table: 'Notificaciones', idCol: 'Id', mode: 'json' },
  modelosFotos: { table: 'ModelosFotos', idCol: 'Id', mode: 'json' },
  garantias: { table: 'Garantias', idCol: 'Id', mode: 'json' },
  mantenimientos: { table: 'Mantenimientos', idCol: 'Id', mode: 'json' },
  solicitudesVenta: { table: 'SolicitudesVenta', idCol: 'Id', mode: 'json' },
  configuracion: { table: 'Configuracion', idCol: 'Clave', mode: 'config' },
};

// ---------------- Serialización ----------------

function objToRow(cfg, obj) {
  const cols = {};
  const extra = {};
  for (const [field, value] of Object.entries(obj)) {
    const col = cfg.flat[field];
    if (col) {
      if (value === null || value === undefined) continue;
      cols[col] = cfg.bits?.includes(field) ? !!value : value;
      continue;
    }
    const jcol = cfg.json[field];
    if (jcol) {
      if (value === undefined) continue;
      cols[jcol] = JSON.stringify(value); // null explícito se conserva como 'null'
      continue;
    }
    if (value === null || value === undefined) continue;
    extra[field] = value;
  }
  if (Object.keys(extra).length) cols.Extra = JSON.stringify(extra);
  return cols;
}

function rowToObj(cfg, row) {
  const obj = {};
  for (const [field, col] of Object.entries(cfg.flat)) {
    const v = row[col];
    if (v !== null && v !== undefined) {
      obj[field] = (cfg.bigints?.includes(field) && typeof v === 'string' && /^-?\d+$/.test(v)) ? Number(v) : v;
    }
  }
  for (const [field, col] of Object.entries(cfg.json)) {
    const v = row[col];
    if (v !== null && v !== undefined && v !== '') {
      try { obj[field] = JSON.parse(v); } catch { obj[field] = v; }
    }
  }
  if (row.Extra !== null && row.Extra !== undefined && row.Extra !== '') {
    try { Object.assign(obj, JSON.parse(row.Extra)); } catch { /* ignorar */ }
  }
  if (cfg.includeId) obj.id = row[cfg.idCol];
  return obj;
}

// ---------------- Operaciones por fila ----------------

async function upsertFlat(cfg, id, obj) {
  const cols = objToRow(cfg, obj);
  cols[cfg.idCol] = id;
  const existing = await run(`SELECT 1 AS x FROM [${cfg.table}] WHERE [${cfg.idCol}] = @id`, { id });
  if (existing.length) {
    const sets = Object.keys(cols).filter(c => c !== cfg.idCol).map(c => `[${c}] = @${c}`);
    if (!sets.length) return;
    await run(`UPDATE [${cfg.table}] SET ${sets.join(', ')} WHERE [${cfg.idCol}] = @id`, { ...cols, id });
  } else {
    const all = Object.keys(cols);
    await run(
      `INSERT INTO [${cfg.table}] ([${all.join('], [')}]) VALUES (${all.map(c => `@${c}`).join(', ')})`,
      cols
    );
  }
}

async function upsertJson(cfg, id, obj) {
  const rid = (obj && obj.id) || id;
  const datos = JSON.stringify(obj || {});
  const params = { id: rid, datos };
  const fechaExtra = cfg.fechaCol ? `, [${cfg.fechaCol}] = @fecha` : '';
  const fechaSet = cfg.fechaCol ? ', @fecha' : '';
  const fechaParams = cfg.fechaCol ? { fecha: (obj && obj.fecha) || null } : {};
  const existing = await run(`SELECT 1 AS x FROM [${cfg.table}] WHERE [${cfg.idCol}] = @id`, { id: rid });
  if (existing.length) {
    await run(`UPDATE [${cfg.table}] SET [Datos] = @datos${fechaExtra} WHERE [${cfg.idCol}] = @id`, { ...params, ...fechaParams });
  } else {
    await run(`INSERT INTO [${cfg.table}] ([${cfg.idCol}], [Datos]${cfg.fechaCol ? ', [' + cfg.fechaCol + ']' : ''}) VALUES (@id, @datos${fechaSet})`, { ...params, ...fechaParams });
  }
}

async function upsertConfig(cfg, id, obj) {
  const datos = JSON.stringify(obj || {});
  const existing = await run(`SELECT 1 AS x FROM [${cfg.table}] WHERE [${cfg.idCol}] = @id`, { id });
  if (existing.length) {
    await run(`UPDATE [${cfg.table}] SET [Valor] = @datos WHERE [${cfg.idCol}] = @id`, { id, datos });
  } else {
    await run(`INSERT INTO [${cfg.table}] ([${cfg.idCol}], [Valor]) VALUES (@id, @datos)`, { id, datos });
  }
}

async function upsert(cfg, id, obj) {
  if (cfg.mode === 'json') return upsertJson(cfg, id, obj);
  if (cfg.mode === 'config') return upsertConfig(cfg, id, obj);
  return upsertFlat(cfg, id, obj);
}

async function deleteRow(cfg, id) {
  await run(`DELETE FROM [${cfg.table}] WHERE [${cfg.idCol}] = @id`, { id });
}

// ---------------- Lecturas ----------------

async function getOneRow(cfg, id) {
  if (cfg.mode === 'json') {
    const rows = await run(`SELECT [Datos] FROM [${cfg.table}] WHERE [${cfg.idCol}] = @id`, { id });
    if (!rows.length) return null;
    try { return JSON.parse(rows[0].Datos); } catch { return null; }
  }
  if (cfg.mode === 'config') {
    const rows = await run(`SELECT [Valor] FROM [${cfg.table}] WHERE [${cfg.idCol}] = @id`, { id });
    if (!rows.length) return null;
    try { return JSON.parse(rows[0].Valor); } catch { return null; }
  }
  const rows = await run(`SELECT * FROM [${cfg.table}] WHERE [${cfg.idCol}] = @id`, { id });
  return rows.length ? rowToObj(cfg, rows[0]) : null;
}

async function getAllRows(cfg) {
  const result = {};
  if (cfg.mode === 'json') {
    const rows = await run(`SELECT [${cfg.idCol}], [Datos] FROM [${cfg.table}]`);
    for (const r of rows) {
      try { result[r[cfg.idCol]] = JSON.parse(r.Datos); } catch { result[r[cfg.idCol]] = null; }
    }
  } else if (cfg.mode === 'config') {
    const rows = await run(`SELECT [${cfg.idCol}], [Valor] FROM [${cfg.table}]`);
    for (const r of rows) {
      try { result[r[cfg.idCol]] = JSON.parse(r.Valor); } catch { result[r[cfg.idCol]] = null; }
    }
  } else {
    const rows = await run(`SELECT * FROM [${cfg.table}]`);
    for (const r of rows) result[r[cfg.idCol]] = rowToObj(cfg, r);
  }
  return Object.keys(result).length ? result : null;
}

// ---------------- API pública (misma semántica que firebase.js) ----------------

function splitPath(path) {
  const parts = String(path || '').split('/').filter(Boolean);
  return { node: parts[0], id: parts[1] };
}

function resolver(path) {
  const { node, id } = splitPath(path);
  const cfg = TABLES[node];
  if (!cfg) throw new Error(`Nodo SQL desconocido: '${node}'`);
  return { cfg, id };
}

export async function sqlGet(path) {
  const { cfg, id } = resolver(path);
  return id ? getOneRow(cfg, id) : getAllRows(cfg);
}

export async function sqlSet(path, data) {
  const { cfg, id } = resolver(path);
  if (data === null || data === undefined) {
    if (id) await deleteRow(cfg, id);
    return;
  }
  if (id) { await upsert(cfg, id, data); return; }
  for (const [key, val] of Object.entries(data || {})) {
    if (val === null || val === undefined) await deleteRow(cfg, key);
    else await upsert(cfg, key, val);
  }
}

export async function sqlUpdate(path, data) {
  const { cfg, id } = resolver(path);
  if (id) {
    const current = (await getOneRow(cfg, id)) || {};
    await upsert(cfg, id, { ...current, ...(data || {}) });
    return;
  }
  for (const [key, val] of Object.entries(data || {})) {
    const current = (await getOneRow(cfg, key)) || {};
    await upsert(cfg, key, { ...current, ...(val || {}) });
  }
}

export async function sqlDelete(path) {
  const { cfg, id } = resolver(path);
  if (id) await deleteRow(cfg, id);
}

// Vacía todas las tablas (usado por la migración de datos).
export async function sqlClearAll() {
  const p = await getPool();
  for (const cfg of Object.values(TABLES)) {
    await p.request().query(`DELETE FROM [${cfg.table}]`);
  }
}

// Helpers exportados para pruebas de mapeo
export { rowToObj, objToRow, TABLES };
