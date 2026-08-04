// Aplica backend/scripts/schema.sql contra SQL Server.
// Usa las variables DB_SERVER, DB_PORT, DB_DATABASE, DB_USER, DB_PASSWORD
// (leídas de .env en backend/ o del entorno).
//
// Uso: node scripts/init-sql.mjs
import 'dotenv/config';
import mssql from 'mssql';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.join(__dirname, 'schema.sql');
const dbName = process.env.DB_DATABASE || 'EquipMaster';
const server = process.env.DB_SERVER || '';
const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined;

function cfg(db) {
  const c = {
    server,
    database: db,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: { encrypt: false, trustServerCertificate: true },
  };
  if (!server.includes('\\')) c.port = port || 1433;
  return c;
}

function splitBatches(sql) {
  return sql
    .replace(/^\s*--.*$/gm, '')
    .split(/\bGO\b/i)
    .map(s => s.trim())
    .filter(Boolean);
}

async function main() {
  if (!server) { console.error('Falta DB_SERVER (revisa .env)'); process.exit(1); }

  const master = await new mssql.ConnectionPool(cfg('master')).connect();
  await master.request()
    .input('db', mssql.NVarChar(128), dbName)
    .query(`IF DB_ID(@db) IS NULL CREATE DATABASE [${dbName.replace(/[^\w]/g, '_')}]`);
  await master.close();
  console.log('✔ Base garantizada:', dbName);

  const sql = fs.readFileSync(sqlPath, 'utf-8');
  const pool = await new mssql.ConnectionPool(cfg(dbName)).connect();
  let aplicados = 0;
  for (const batch of splitBatches(sql)) {
    if (/^USE\s+/i.test(batch) || /^CREATE\s+DATABASE/i.test(batch)) continue;
    await pool.request().query(batch);
    aplicados++;
  }
  await pool.close();
  console.log(`✔ Esquema aplicado en ${dbName} (${aplicados} batches)`);
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
