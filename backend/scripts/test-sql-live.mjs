// Prueba de punta a punta de la capa SQL (backend/src/db.js)
// contra una instancia real de SQL Server.
// Usa las variables DB_SERVER, DB_PORT, DB_DATABASE, DB_USER, DB_PASSWORD.
//
// Uso: node scripts/test-sql-live.mjs
import 'dotenv/config';
import { sqlGet, sqlSet, sqlUpdate, sqlDelete } from '../src/db.js';
import assert from 'assert';

let pasos = 0;
function ok(nombre) { pasos++; console.log(`  ✔ ${nombre}`); }

const equipo = {
  codigo: 'INV-TEST',
  categoria: 'LAPTOP',
  marca: 'LENOVO',
  modelo: 'THINKPAD T14',
  serie: 'PF-TEST-1',
  sku: 'LAP99999',
  procesador: 'INTEL CORE I5-1135G7',
  ram: '16 GB',
  almacenamiento: '512 GB',
  tipoDisco: 'SSD SATA',
  grafica: 'INTEGRADA',
  tecnico: 'JUAN PEREZ',
  bateria: 'EXCELENTE',
  cargador: 'SI',
  estado: '🔵 OK',
  observaciones: 'EQUIPO DE PRUEBA DE MIGRACIÓN.',
  pantallaTactil: false,
  retroiluminacion: true,
  condicionEstetica: { carcasa: true, pantalla: false },
  fotos: { frente: 'https://storage.googleapis.com/INV-TEST/FRENTE.jpg' },
  historial: [{ fecha: '2026-01-01', usuario: 'TEST', cambios: 'creado' }],
  flujoSalida: null,
  flujoMercadoLibre: null,
  fechaRegistro: '2025-10-10T10:00:00.000Z',
  campoFuturo: 'se-conserva',
};

async function main() {
  console.log('Capa SQL: prueba de punta a punta');
  if (!process.env.DB_SERVER) { console.error('Falta DB_SERVER (revisa .env)'); process.exit(1); }

  // Inventario: upsert + lectura exacta
  await sqlSet('inventario/INV-TEST', equipo);
  const back = await sqlGet('inventario/INV-TEST');
  assert.deepStrictEqual(back, equipo);
  ok('inventario: upsert + round-trip exacto');

  // Lista keyed por código
  const lista = await sqlGet('inventario');
  assert(lista && lista['INV-TEST']);
  ok('inventario: getAll keyed por codigo');

  // Actualización por merge (semántica PATCH)
  await sqlUpdate('inventario/INV-TEST', { estado: '🔴 VENDIDO / SALIDA', flujoSalida: { cliente: 'PRUEBA', precio: '$1000' } });
  const editado = await sqlGet('inventario/INV-TEST');
  assert.strictEqual(editado.estado, '🔴 VENDIDO / SALIDA');
  assert.strictEqual(editado.flujoSalida.cliente, 'PRUEBA');
  assert.strictEqual(editado.marca, 'LENOVO');
  ok('inventario: sqlUpdate preserva el resto y mergea anidados');

  // Usuarios (renombrado password → PasswordHash)
  await sqlSet('usuarios/juan_perez', { nombre: 'Juan Perez', password: 'abc123', rol: 'admin', nivel: 80, activo: true, permisos: { ver_inventario: true } });
  const user = await sqlGet('usuarios/juan_perez');
  assert.strictEqual(user.password, 'abc123');
  assert.strictEqual(user.rol, 'admin');
  ok('usuarios: round-trip con password');

  // Tickets (arrays JSON + timestamp)
  await sqlSet('tickets/TK-TEST', { id: 'TK-TEST', asunto: 'Pantalla', estado: 'pendiente', prioridad: 'alta', timestamp: 1767283200000, notas: [], historial: [{ accion: 'creado' }], fotografias: ['/archivos/1.jpg'] });
  const tk = await sqlGet('tickets/TK-TEST');
  assert.deepStrictEqual(tk.notas, []);
  assert.strictEqual(tk.timestamp, 1767283200000);
  assert.strictEqual(tk.fotografias.length, 1);
  ok('tickets: round-trip con arrays JSON y timestamp');

  // Nodo JSON (reparaciones)
  await sqlSet('reparaciones/REP-TEST', { id: 'REP-TEST', cliente: 'MARIA', equipoMarca: 'HP', estado: 'RECIBIDO' });
  const rep = await sqlGet('reparaciones/REP-TEST');
  assert.strictEqual(rep.cliente, 'MARIA');
  ok('reparaciones: nodo JSON');

  // Configuración (modo config)
  await sqlSet('configuracion/empresa', { nombreEmpresa: 'JV COMPUTER', lema: 'Centro de Servicio TI' });
  await sqlUpdate('configuracion/empresa', { iva: 16 });
  const conf = await sqlGet('configuracion/empresa');
  assert.strictEqual(conf.nombreEmpresa, 'JV COMPUTER');
  assert.strictEqual(conf.iva, 16);
  const todoConf = await sqlGet('configuracion');
  assert(todoConf.empresa && todoConf.empresa.nombreEmpresa === 'JV COMPUTER');
  ok('configuracion: upsert + update + getAll');

  // Roles (keyed)
  await sqlSet('roles/superadmin', { nivel: 100, nombre: 'Super Administrador', color: '#7c3aed', descripcion: 'Acceso total', permisos: {} });
  const roles = await sqlGet('roles');
  assert(roles.superadmin && roles.superadmin.nivel === 100);
  ok('roles: keyed');

  // Préstamo (incluye id)
  await sqlSet('prestamos/P-TEST', { serie: 'PF-TEST-1', responsable: 'MARIA', area: 'MARKETING', activo: true, fechaSalida: '2026-01-01' });
  const prestamo = await sqlGet('prestamos/P-TEST');
  assert.strictEqual(prestamo.id, 'P-TEST');
  ok('prestamos: round-trip con id');

  // Actividad (auditoría)
  await sqlSet('actividad/ACT-TEST', { usuario: 'Juan', accion: 'EQUIPO_REGISTRADO', detalle: 'INV-TEST · LENOVO', fecha: '2026-01-01T00:00:00.000Z', timestamp: 1767283200000 });
  const act = await sqlGet('actividad/ACT-TEST');
  assert.strictEqual(act.id, 'ACT-TEST');
  assert.strictEqual(act.timestamp, 1767283200000);
  ok('actividad: round-trip');

  // Eliminación (set null = delete)
  await sqlSet('inventario/INV-TEST', null);
  assert.strictEqual(await sqlGet('inventario/INV-TEST'), null);
  ok('inventario: set null elimina la fila');

  // Limpieza
  await sqlDelete('usuarios/juan_perez');
  await sqlDelete('tickets/TK-TEST');
  await sqlDelete('reparaciones/REP-TEST');
  await sqlDelete('configuracion/empresa');
  await sqlDelete('roles/superadmin');
  await sqlDelete('prestamos/P-TEST');
  await sqlDelete('actividad/ACT-TEST');
  ok('limpieza de datos de prueba');

  console.log(`\nTodas las pruebas SQL pasaron (${pasos}) ✔`);
}

main().catch(e => { console.error('\nPRUEBA FALLÓ:', e.message); process.exit(1); });
