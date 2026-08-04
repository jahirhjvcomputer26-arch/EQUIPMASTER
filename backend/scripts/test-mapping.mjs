import { rowToObj, objToRow, TABLES } from '../src/db.js';
import assert from 'assert';

function roundTrip(cfg, obj, id) {
  const cols = objToRow(cfg, obj);
  const row = { ...cols };
  row[cfg.idCol] = id;
  return rowToObj(cfg, row);
}

function deepEqual(a, b) {
  assert.deepStrictEqual(a, b);
  return true;
}

const inventarioObj = {
  codigo: 'INV-1',
  categoria: 'LAPTOP',
  marca: 'LENOVO',
  modelo: 'THINKPAD T14',
  serie: 'PF-12345',
  sku: 'LAP00001',
  procesador: 'INTEL CORE I5-1135G7',
  ram: '16 GB',
  almacenamiento: '512 GB',
  tipoDisco: 'SSD SATA',
  grafica: 'INTEGRADA',
  tecnico: 'JUAN PEREZ',
  bateria: 'EXCELENTE',
  cargador: 'SI',
  estado: '🔵 OK',
  observaciones: 'SIN OBSERVACIONES.',
  anio: '2021',
  generacion: '11TH',
  tipoRam: 'DDR4',
  resolucion: '1920x1080',
  pantallaTactil: false,
  retroiluminacion: true,
  lectorHuellas: true,
  camaraIR: false,
  wifi: 'WIFI 6',
  bluetooth: 'BT 5.1',
  sistemaOperativo: 'WINDOWS 11 PRO',
  color: 'NEGRO',
  pantalla: '14 PULGADAS',
  modeloComercial: 'T14 GEN 1',
  fechaRevision: '2026-01-01',
  fechaRegistro: '2025-10-10T10:00:00.000Z',
  condicionEstetica: { carcasa: true, pantalla: false },
  bateriaDetalle: { ciclos: 120, salud: 'EXCELENTE' },
  checklistPruebas: { wifi: true, camara: false },
  fotos: { frente: 'https://storage.googleapis.com/x.jpg', trasera: '/archivos/trasera.jpg' },
  historial: [{ fecha: '2026-01-01', usuario: 'SISTEMA', cambios: 'estado' }],
  flujoSalida: null,
  flujoVentaML: null,
  flujoDevolucion: null,
  flujoMercadoLibre: { fechaEnvio: '2026-01-02', idPublicacion: 'MLX-1', enviadoPor: 'JUAN' },
  campoDesconocido: 'valor-futuro',
  otroNuevo: { anidado: true },
};
deepEqual(roundTrip(TABLES.inventario, inventarioObj, 'INV-1'), inventarioObj);
console.log('✔ Inventario round-trip');

const usuarioObj = {
  nombre: 'Juan Perez',
  password: 'abcdef0123456789',
  rol: 'admin',
  nivel: 80,
  activo: true,
  permisos: { ver_inventario: true, crear_equipos: true },
  creado: '2026-01-01T00:00:00.000Z',
  sesionActiva: { dispositivo: 'abc', desde: 123, hasta: 456 },
  campoExtra: 'x',
};
deepEqual(roundTrip(TABLES.usuarios, usuarioObj, 'juan_perez'), usuarioObj);
console.log('✔ Usuarios round-trip');

const ticketObj = {
  id: 'TK-ABC',
  asunto: 'Pantalla rota',
  descripcion: 'Tiene una linea blanca',
  prioridad: 'alta',
  estado: 'en_reparacion',
  creadoPor: 'Juan Perez',
  creadoPorClave: 'juan_perez',
  creadoEn: '2026-01-01T00:00:00.000Z',
  timestamp: 1767283200000,
  tecnicoAsignado: 'juan_perez',
  tecnicoAsignadoNombre: 'Juan Perez',
  fechaAsignacion: '2026-01-01T00:00:00.000Z',
  fechaEstimadaEntrega: '',
  notasInternas: '',
  modificadoEn: '2026-01-02T00:00:00.000Z',
  notas: [{ texto: 'hola', autor: 'x', fecha: '2026-01-01' }],
  historial: [],
  diagnosticos: ['Falla en panel'],
  reparaciones: [],
  piezas: ['PIEZA-1'],
  fotografias: ['/archivos/1.jpg'],
};
deepEqual(roundTrip(TABLES.tickets, ticketObj, 'TK-ABC'), ticketObj);
console.log('✔ Tickets round-trip');

const prestamoObj = {
  serie: 'PF-12345',
  modelo: 'THINKPAD T14',
  procesador: 'I5',
  responsable: 'MARIA',
  area: 'MARKETING',
  fechaSalida: '2026-01-01',
  notas: 'SIN NOTAS',
  activo: true,
  fechaRegistro: '2026-01-01T00:00:00.000Z',
  fechaDevolucion: '2026-02-01',
};
const prestamoRow = roundTrip(TABLES.prestamos, prestamoObj, 'P-123');
deepEqual(prestamoRow, { ...prestamoObj, id: 'P-123' });
console.log('✔ Prestamos round-trip (incluye id)');

const rolObj = { nivel: 100, nombre: 'Super Administrador', color: '#7c3aed', descripcion: 'Acceso total', permisos: {} };
deepEqual(roundTrip(TABLES.roles, rolObj, 'superadmin'), rolObj);
console.log('✔ Roles round-trip');

const actividadObj = { usuario: 'Juan', accion: 'EQUIPO_REGISTRADO', detalle: 'INV-1 · LENOVO', fecha: '2026-01-01T00:00:00.000Z', timestamp: 1767283200000 };
deepEqual(roundTrip(TABLES.actividad, actividadObj, 'ACT-1'), { ...actividadObj, id: 'ACT-1' });
console.log('✔ Actividad round-trip');

const extraConNulos = { codigo: 'INV-2', marca: 'HP', pantallaTactil: undefined, fotos: undefined, historial: [] };
deepEqual(roundTrip(TABLES.inventario, extraConNulos, 'INV-2'), { codigo: 'INV-2', marca: 'HP', historial: [] });
console.log('✔ Undefined/null se omiten correctamente');

const catalogo = { label: 'Ver Inventario', grupo: 'Inventario', desc: 'Consultar inventario' };
deepEqual(roundTrip(TABLES.permisosCatalog, catalogo, 'ver_inventario'), catalogo);
console.log('✔ PermisosCatalog round-trip');

console.log('\nTodas las pruebas de mapeo pasaron ✔');
