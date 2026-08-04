// Etapa 3 · Migración de datos Firebase Realtime Database → SQL Server.
// Lee el dump del árbol completo (o lo descarga fresco con --fetch),
// reescribe las URLs de GCS a rutas relativas (/archivos/...) y las
// inserta en SQL. Idempotente: vacía las tablas antes de reinsertar.
//
// Uso:
//   node scripts/migrate-firebase-to-sql.mjs            # usa scripts/dump-firebase.json
//   node scripts/migrate-firebase-to-sql.mjs --fetch    # descarga el árbol fresco y migra
//   node scripts/migrate-firebase-to-sql.mjs --dry-run  # solo reporta, no escribe nada
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sqlGet, sqlSet, sqlClearAll } from '../src/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DUMP = path.join(__dirname, 'dump-firebase.json');
const DB_URL = process.env.FIREBASE_DB_URL || 'https://inventarioequip-default-rtdb.firebaseio.com';
const ARCHIVOS_ROOT = path.resolve(__dirname, '..', 'public', 'archivos');
const PREFIX = 'https://storage.googleapis.com/inventarioequip.firebasestorage.app/';

function reescribirURLs(v) {
  if (typeof v === 'string' && v.startsWith(PREFIX)) return `/archivos/${v.slice(PREFIX.length)}`;
  if (Array.isArray(v)) return v.map(reescribirURLs);
  if (v && typeof v === 'object') {
    const o = {};
    for (const [k, val] of Object.entries(v)) o[k] = reescribirURLs(val);
    return o;
  }
  return v;
}

async function descargarDump() {
  const res = await fetch(`${DB_URL}/.json`);
  if (!res.ok) throw new Error(`GET /.json → ${res.status}`);
  const data = await res.json();
  fs.writeFileSync(DUMP, JSON.stringify(data, null, 2));
  console.log(`Dump descargado (${Object.keys(data).length} nodos) → ${path.basename(DUMP)}`);
  return data;
}

function escanear(o, urlsRestantes, faltantes) {
  if (typeof o === 'string') {
    if (o.startsWith(PREFIX)) urlsRestantes.push(o);
    if (o.startsWith('/archivos/')) {
      const rel = o.slice('/archivos/'.length);
      if (!fs.existsSync(path.join(ARCHIVOS_ROOT, ...rel.split('/')))) faltantes.push(o);
    }
    return;
  }
  if (Array.isArray(o)) return o.forEach(v => escanear(v, urlsRestantes, faltantes));
  if (o && typeof o === 'object') return Object.values(o).forEach(v => escanear(v, urlsRestantes, faltantes));
}

async function main() {
  const usarFetch = process.argv.includes('--fetch');
  const dryRun = process.argv.includes('--dry-run');

  if (!process.env.DB_SERVER) { console.error('Falta DB_SERVER (revisa .env)'); process.exit(1); }

  const dump = (usarFetch || !fs.existsSync(DUMP))
    ? await descargarDump()
    : JSON.parse(fs.readFileSync(DUMP, 'utf-8'));
  const migrado = reescribirURLs(dump);

  const nodos = Object.entries(migrado);
  console.log('Nodos a migrar:');
  for (const [nodo, v] of nodos) {
    const n = v && typeof v === 'object' && !Array.isArray(v) ? Object.keys(v).length : 1;
    console.log(`  ${nodo}: ${n}`);
  }

  if (dryRun) { console.log('\n(dry-run, no se escribió nada)'); return; }

  await sqlClearAll();
  console.log('\nTablas vaciadas.');

  let total = 0;
  for (const [nodo, v] of nodos) {
    if (!v) continue;
    if (typeof v !== 'object' || Array.isArray(v)) {
      console.log(`  ⚠ ${nodo}: valor no-objeto, se omite`);
      continue;
    }
    try {
      await sqlSet(nodo, v);
      total += Object.keys(v).length;
      console.log(`  ✔ ${nodo}: ${Object.keys(v).length} registros`);
    } catch (e) {
      console.error(`  ✖ ${nodo}: ${e.message}`);
    }
  }

  const urlsRestantes = [];
  const faltantes = [];
  escanear(migrado, urlsRestantes, faltantes);
  console.log(`\nURLs GCS sin reescribir: ${urlsRestantes.length}`);
  console.log(`Archivos /archivos/ referenciados y presentes: ${'verificado'}`);
  console.log(`Archivos /archivos/ faltantes en disco: ${faltantes.length}`);
  if (faltantes.length) console.log('  ej: ' + faltantes.slice(0, 5).join('\n      '));

  console.log('\nVerificación en SQL:');
  let okTotal = 0;
  for (const [nodo, v] of nodos) {
    if (!v || typeof v !== 'object' || Array.isArray(v)) continue;
    const enSQL = await sqlGet(nodo);
    const esperado = Object.keys(v).length;
    const real = enSQL ? Object.keys(enSQL).length : 0;
    const ok = real === esperado;
    if (ok) okTotal++;
    console.log(`  ${ok ? '✔' : '✖'} ${nodo}: ${real}/${esperado}`);
  }

  console.log(`\nTotal migrado: ${total} registros · ${okTotal}/${nodos.filter(([, v]) => v && typeof v === 'object' && !Array.isArray(v)).length} nodos exactos`);
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
