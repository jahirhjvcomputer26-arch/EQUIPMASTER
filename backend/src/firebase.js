import { sqlGet, sqlSet, sqlUpdate, sqlDelete } from './db.js';
import bcrypt from 'bcryptjs';

const DB_URL = process.env.FIREBASE_DB_URL || 'https://inventarioequip-default-rtdb.firebaseio.com';

// Modo dual: si DB_SERVER está configurado se usa SQL Server;
// si además se define USE_FIREBASE=1, se fuerza el modo Firebase.
function usarSql() {
  return !!process.env.DB_SERVER && !process.env.USE_FIREBASE;
}

export async function firebaseGet(path) {
  if (usarSql()) return sqlGet(path);
  const res = await fetch(`${DB_URL}/${path}.json`);
  if (!res.ok) throw new Error(`Firebase GET error: ${res.status}`);
  return res.json();
}

export async function firebaseSet(path, data) {
  if (usarSql()) return sqlSet(path, data);
  const res = await fetch(`${DB_URL}/${path}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Firebase SET error: ${res.status}`);
  return res.json();
}

export async function firebaseUpdate(path, data) {
  if (usarSql()) return sqlUpdate(path, data);
  const res = await fetch(`${DB_URL}/${path}.json`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Firebase PATCH error: ${res.status}`);
  return res.json();
}

export async function firebaseDelete(path) {
  if (usarSql()) return sqlDelete(path);
  const res = await fetch(`${DB_URL}/${path}.json`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Firebase DELETE error: ${res.status}`);
  return res.json();
}

export function claveUsuario(usuario) {
  return usuario.toLowerCase().replace(/[.#$/\[\]]/g, '_');
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$')) {
    const match = await bcrypt.compare(password, hash);
    return { match, rehash: false };
  }
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  const sha = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  const match = sha === hash;
  return { match, rehash: match };
}
