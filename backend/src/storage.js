import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let bucket = null;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadServiceAccount() {
  const envVar = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (envVar) {
    try { return JSON.parse(envVar); } catch { console.warn('⚠ FIREBASE_SERVICE_ACCOUNT no es JSON válido'); }
  }
  const jsonPath = path.join(__dirname, '..', 'service-account.json');
  if (fs.existsSync(jsonPath)) {
    try { return JSON.parse(fs.readFileSync(jsonPath, 'utf-8')); } catch { console.warn('⚠ service-account.json corrupto'); }
  }
  return null;
}

export function initStorage() {
  if (bucket) return bucket;

  const creds = loadServiceAccount();
  if (!creds) {
    console.warn('⚠ Storage deshabilitado. Agrega FIREBASE_SERVICE_ACCOUNT o service-account.json');
    return null;
  }

  try {
    let app;
    if (!getApps().length) {
      app = initializeApp({
        credential: cert(creds),
        storageBucket: `${creds.project_id}.appspot.com`,
      });
    } else {
      app = getApps()[0];
    }
    bucket = getStorage(app).bucket();
    console.log('✅ Firebase Storage conectado:', bucket.name);
    return bucket;
  } catch (err) {
    console.error('Error al inicializar Firebase Storage:', err.message);
    return null;
  }
}

export function getBucket() {
  return bucket || initStorage();
}
