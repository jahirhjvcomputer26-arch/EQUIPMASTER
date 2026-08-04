// Verificación E2E de la API en modo SQL tras la migración.
// Uso: node scripts/test-api-sql.mjs
// (requiere la API corriendo: PORT por defecto 3001, .env con DB_SERVER)
import 'dotenv/config';

const BASE = process.env.API_BASE || 'http://localhost:3001';
const usuario = process.env.TEST_USER || 'ocadmin';
const password = process.env.TEST_PASS || '1234';

let pasos = 0, fallos = 0;
function ok(nombre) { pasos++; console.log(`  ✔ ${nombre}`); }
function fail(nombre, detalle) { fallos++; console.log(`  ✖ ${nombre}: ${detalle}`); }

async function req(path, token, metodo = 'GET', body) {
  const res = await fetch(`${BASE}${path}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, json };
}

function escanear(o, fn) {
  if (typeof o === 'string') { fn(o); return; }
  if (Array.isArray(o)) return o.forEach(v => escanear(v, fn));
  if (o && typeof o === 'object') return Object.values(o).forEach(v => escanear(v, fn));
}

async function main() {
  console.log(`E2E API SQL → ${BASE}`);
  const login = await req('/api/usuarios/login', null, 'POST', { usuario, password });
  if (login.status !== 200 || !login.json.token) {
    fail('login', `${login.status}: ${JSON.stringify(login.json)}`);
    process.exit(1);
  }
  ok(`login ${usuario} (rol=${login.json.rol}, nivel=${login.json.nivel})`);
  const t = login.json.token;

  const inv = await req('/api/inventario', t);
  if (inv.status === 200 && Array.isArray(inv.json)) {
    const n = inv.json.length;
    ok(`inventario: ${n} equipos (esperado 152)`);
    if (n === 152) ok('inventario: cantidad exacta');
    else fail('inventario cantidad', `recibidos ${n}`);

    const conCodigo = inv.json.filter(e => e.codigo).length;
    if (conCodigo === n) ok('inventario: todos con codigo');
    else fail('inventario codigo', `${conCodigo}/${n}`);

    const urlGcs = [];
    inv.json.forEach(e => escanear(e, s => { if (s.includes('storage.googleapis.com')) urlGcs.push(s); }));
    if (urlGcs.length === 0) ok('inventario: 0 URLs GCS (todas reescritas)');
    else fail('inventario URLs GCS', urlGcs.length + ' restantes');

    const inv1077 = inv.json.find(e => e.codigo === 'INV-1077');
    if (inv1077?.fotos?.frente === '/archivos/fotos/INV-1077/frente.jpg') ok('INV-1077 fotos.frente reescrita');
    else fail('INV-1077 fotos', JSON.stringify(inv1077?.fotos));
  } else {
    fail('inventario GET', `${inv.status}: ${JSON.stringify(inv.json)}`);
  }

  const r = await req('/api/usuarios/roles', t);
  if (r.status === 200) {
    const n = Object.keys(r.json?.roles || {}).length;
    ok(`roles: ${n} (esperado 7)`);
  } else fail('roles GET', `${r.status}`);

  const u = await req('/api/usuarios/list', t);
  if (u.status === 200 && Array.isArray(u.json)) ok(`usuarios: ${u.json.length} (esperado 13)`);
  else fail('usuarios list', `${u.status}: ${JSON.stringify(u.json)}`);

  const p = await req('/api/prestamos', t);
  if (p.status === 200 && Array.isArray(p.json)) ok(`prestamos: ${p.json.length} (esperado 12)`);
  else fail('prestamos GET', `${p.status}: ${JSON.stringify(p.json)}`);

  const a = await req('/api/actividad?page=1&limit=5', t);
  if (a.status === 200 && a.json?.total === 467) ok(`actividad: ${a.json.total} (esperado 467)`);
  else fail('actividad GET', `${a.status}: ${JSON.stringify(a.json)}`);

  const tk = await req('/api/tickets', t);
  if (tk.status === 200 && Array.isArray(tk.json)) ok(`tickets: ${tk.json.length} (esperado 1)`);
  else fail('tickets GET', `${tk.status}: ${JSON.stringify(tk.json)}`);

  const cr = await req('/api/centro-reparaciones', t);
  if (cr.status === 200 && Array.isArray(cr.json)) ok(`centroReparaciones: ${cr.json.length} (esperado 0)`);
  else fail('centroReparaciones GET', `${cr.status}: ${JSON.stringify(cr.json)}`);

  const mf = await req('/api/modelos-fotos', t);
  if (mf.status === 200 && Array.isArray(mf.json)) ok(`modelosFotos: ${mf.json.length} (esperado 0)`);
  else fail('modelosFotos GET', `${mf.status}: ${JSON.stringify(mf.json)}`);

  const cfg = await req('/api/configuracion/public', t);
  if (cfg.status === 200) ok(`configuracion/public: ${JSON.stringify(cfg.json)}`);
  else fail('configuracion/public', `${cfg.status}`);

  const rep = await req('/api/reportes/dashboard', t);
  if (rep.status === 200) ok(`reportes/dashboard: totalEquipos=${rep.json?.totalEquipos ?? rep.json?.equipos?.length ?? '?'}`);
  else fail('reportes/dashboard', `${rep.status}: ${JSON.stringify(rep.json)}`);

  console.log(`\n${pasos} correctos · ${fallos} fallos`);
  process.exit(fallos ? 1 : 0);
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
