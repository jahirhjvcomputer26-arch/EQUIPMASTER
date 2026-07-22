const DB_URL = process.env.FIREBASE_DB_URL || 'https://inventarioequip-default-rtdb.firebaseio.com';

export async function firebaseGet(path) {
  const res = await fetch(`${DB_URL}/${path}.json`);
  if (!res.ok) throw new Error(`Firebase GET error: ${res.status}`);
  return res.json();
}

export async function firebaseSet(path, data) {
  const res = await fetch(`${DB_URL}/${path}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Firebase SET error: ${res.status}`);
  return res.json();
}

export async function firebaseUpdate(path, data) {
  const res = await fetch(`${DB_URL}/${path}.json`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Firebase PATCH error: ${res.status}`);
  return res.json();
}

export async function firebaseDelete(path) {
  const res = await fetch(`${DB_URL}/${path}.json`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Firebase DELETE error: ${res.status}`);
  return res.json();
}

export function claveUsuario(usuario) {
  return usuario.toLowerCase().replace(/[.#$/\[\]]/g, '_');
}

export async function hashPassword(password) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
