import { AsyncLocalStorage } from 'async_hooks';

const storage = new AsyncLocalStorage();

export function auditContext(req, _res, next) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (forwarded ? String(forwarded).split(',')[0] : req.ip || req.socket.remoteAddress || '').trim();
  storage.run({
    ip,
    dispositivo: req.headers['x-device-id'] || null,
    userAgent: req.headers['user-agent'] || null,
  }, next);
}

export function getAuditContext() {
  return storage.getStore() || {};
}
