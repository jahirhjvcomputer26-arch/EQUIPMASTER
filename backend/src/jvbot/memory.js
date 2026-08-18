import { firebaseGet, firebaseSet } from '../firebase.js';

function memoryPath(userId) {
  return `jvbotMemory/${String(userId || 'unknown').replace(/[.#$/\[\]]/g, '_')}`;
}

export async function getMemory(userId) {
  const data = await firebaseGet(memoryPath(userId));
  return Array.isArray(data?.items) ? data.items.slice(-20) : [];
}

export async function remember(userId, text) {
  const items = await getMemory(userId);
  const next = [...items.filter(item => item.text !== text), { text, createdAt: new Date().toISOString() }].slice(-20);
  await firebaseSet(memoryPath(userId), { items: next });
  return next;
}

export async function clearMemory(userId) {
  await firebaseSet(memoryPath(userId), { items: [] });
}
