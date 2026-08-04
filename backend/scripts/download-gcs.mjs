// Etapa 2 · Descarga del bucket GCS a disco local.
// Lista todos los objetos del bucket y los descarga a
// backend/public/archivos/ preservando la estructura (fotos/... documentos/...).
//
// Uso:
//   node scripts/download-gcs.mjs            # solo listado + conteos
//   node scripts/download-gcs.mjs --download # descarga (omite archivos ya descargados)
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleAuth } from 'google-auth-library';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUCKET = 'inventarioequip.firebasestorage.app';
const SCOPES = ['https://www.googleapis.com/auth/devstorage.read_only'];
const destRoot = path.resolve(__dirname, '..', 'public', 'archivos');
const descargar = process.argv.includes('--download');

function loadServiceAccount() {
  const jsonPath = path.join(__dirname, '..', 'service-account.json');
  if (fs.existsSync(jsonPath)) {
    try { return JSON.parse(fs.readFileSync(jsonPath, 'utf-8')); } catch { console.warn('⚠ service-account.json corrupto'); }
  }
  const envVar = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (envVar) {
    try { return JSON.parse(envVar); } catch { console.warn('⚠ FIREBASE_SERVICE_ACCOUNT no es JSON válido'); }
  }
  return null;
}

async function listarTodos(token) {
  const items = [];
  let pageToken = '';
  do {
    const qs = `maxResults=1000${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const res = await fetch(`https://storage.googleapis.com/storage/v1/b/${BUCKET}/o?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`LIST ${res.status}: ${await res.text()}`);
    const data = await res.json();
    items.push(...(data.items || []).map(i => ({ name: i.name, size: Number(i.size || 0) })));
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return items;
}

async function main() {
  const creds = loadServiceAccount();
  if (!creds) {
    console.error('Falta FIREBASE_SERVICE_ACCOUNT en .env o service-account.json');
    process.exit(1);
  }

  const auth = new GoogleAuth({ credentials: creds, scopes: SCOPES });
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();

  console.log(`Bucket: ${BUCKET}`);
  const items = await listarTodos(token);

  const total = items.reduce((a, b) => a + b.size, 0);
  const porCarpeta = {};
  for (const i of items) {
    const top = i.name.split('/')[0] || '(raiz)';
    porCarpeta[top] = (porCarpeta[top] || 0) + 1;
  }

  console.log(`Objetos: ${items.length}`);
  console.log(`Tamaño total: ${(total / 1048576).toFixed(2)} MB`);
  console.log('Por carpeta:', porCarpeta);

  if (!descargar) {
    console.log('\nUso: node scripts/download-gcs.mjs --download');
    return;
  }

  let ok = 0, skip = 0, fail = 0;
  for (const item of items) {
    const dest = path.join(destRoot, ...item.name.split('/'));
    try {
      if (fs.existsSync(dest) && fs.statSync(dest).size === item.size) { skip++; continue; }
      const res = await fetch(`https://storage.googleapis.com/storage/v1/b/${BUCKET}/o/${encodeURIComponent(item.name)}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`${res.status}`);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
      ok++;
    } catch (e) {
      fail++;
      console.error(`✖ ${item.name}: ${e.message}`);
    }
  }

  console.log(`\nDescargadas: ${ok}, ya existentes: ${skip}, errores: ${fail}`);
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
