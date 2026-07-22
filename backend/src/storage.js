import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleAuth } from 'google-auth-library';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let authClient = null;
let googleAuth = null;
let projectId = null;
const BUCKET = 'inventarioequip.firebasestorage.app';
const SCOPES = ['https://www.googleapis.com/auth/devstorage.full_control'];

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

function getGoogleAuth() {
  if (googleAuth) return googleAuth;
  const creds = loadServiceAccount();
  if (!creds) {
    console.warn('⚠ Storage deshabilitado. Agrega FIREBASE_SERVICE_ACCOUNT o service-account.json');
    return null;
  }
  projectId = creds.project_id;
  googleAuth = new GoogleAuth({ credentials: creds, scopes: SCOPES });
  return googleAuth;
}

export function initStorage() {
  const auth = getGoogleAuth();
  if (!auth) return null;
  console.log('✅ Firebase Storage conectado (google-auth-library):', BUCKET);
  return { auth, bucket: BUCKET };
}

export function getBucket() {
  return getGoogleAuth() ? { auth: googleAuth, bucket: BUCKET } : null;
}

async function getAccessToken() {
  const auth = getGoogleAuth();
  if (!auth) throw new Error('Storage no disponible');
  const client = await auth.getClient();
  return client.getAccessToken();
}

function storageUrl(objectPath) {
  return `https://storage.googleapis.com/upload/storage/v1/b/${BUCKET}/o?uploadType=media&name=${encodeURIComponent(objectPath)}`;
}

function storageApiUrl(objectPath) {
  return `https://storage.googleapis.com/storage/v1/b/${BUCKET}/o/${encodeURIComponent(objectPath)}`;
}

export async function uploadToStorage(objectPath, buffer, contentType) {
  const auth = getGoogleAuth();
  if (!auth) throw new Error('Storage no disponible');

  const { token } = await getAccessToken();

  const res = await fetch(storageUrl(objectPath), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': contentType || 'application/octet-stream',
    },
    body: buffer,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Storage upload ${res.status}: ${err}`);
  }

  return res.json();
}

export async function deleteFromStorage(objectPath) {
  const auth = getGoogleAuth();
  if (!auth) throw new Error('Storage no disponible');

  const { token } = await getAccessToken();

  const res = await fetch(storageApiUrl(objectPath), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 404) {
    const err = await res.text();
    throw new Error(`Storage delete ${res.status}: ${err}`);
  }

  return true;
}

export async function makePublic(objectPath) {
  const auth = getGoogleAuth();
  if (!auth) return;

  const { token } = await getAccessToken();

  const res = await fetch(`${storageApiUrl(objectPath)}/acl`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ entity: 'allUsers', role: 'READER' }),
  });

  return res.ok;
}

export function getPublicUrl(objectPath) {
  return `https://storage.googleapis.com/${BUCKET}/${objectPath}`;
}

export async function listStorageFiles(prefix) {
  const auth = getGoogleAuth();
  if (!auth) return [];

  const { token } = await getAccessToken();
  const res = await fetch(`https://storage.googleapis.com/storage/v1/b/${BUCKET}/o?prefix=${encodeURIComponent(prefix)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return (data.items || []).map(i => ({ name: i.name, size: i.size, updated: i.updated }));
}
