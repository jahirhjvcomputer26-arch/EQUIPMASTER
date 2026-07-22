import admin from 'firebase-admin';

let bucket = null;

export function initStorage() {
  if (bucket) return bucket;

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccount) {
    console.warn('⚠ FIREBASE_SERVICE_ACCOUNT no configurado. Storage deshabilitado.');
    return null;
  }

  try {
    const creds = JSON.parse(serviceAccount);
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(creds),
        storageBucket: `${creds.project_id}.appspot.com`,
      });
    }
    bucket = admin.storage().bucket();
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
