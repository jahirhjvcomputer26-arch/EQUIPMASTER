import 'dotenv/config';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import express from 'express';
import fs from 'fs';
import http from 'http';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';
import usuariosRouter from './routes/usuarios.js';
import inventarioRouter from './routes/inventario.js';
import ventasRouter from './routes/ventas.js';
import reportesRouter from './routes/reportes.js';
import prestamosRouter from './routes/prestamos.js';
import actividadRouter from './routes/actividad.js';
import reparacionesRouter from './routes/reparaciones.js';
import centroReparacionesRouter from './routes/centroReparaciones.js';
import backupRouter from './routes/backup.js';
import configuracionRouter from './routes/configuracion.js';
import storageRouter from './routes/storage.js';
import modelosFotosRouter from './routes/modelosFotos.js';
import ticketsRouter from './routes/tickets.js';
import hardwareRouter from './routes/hardware.js';
import notificacionesRouter from './routes/notificaciones.js';
import catalogosRouter from './routes/catalogos.js';
import { garantiasRouter, mantenimientosRouter } from './routes/seguimiento.js';
import catalogoPublicacionRouter from './routes/catalogoPublicacion.js';
import solicitudesVentaRouter from './routes/solicitudesVenta.js';
import marketingRouter from './routes/marketing.js';
import jvbotRouter from './routes/jvbot.js';
import { auditContext } from './middleware/auditContext.js';
import { initStorage } from './storage.js';
import { seedPermisos } from './permisos.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

const app = express();
const PORT = process.env.PORT || 3001;

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
const corsOrigins = (process.env.CORS_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (corsOrigins.length === 0) {
      if (process.env.NODE_ENV === 'production') return callback(new Error('CORS no configurado'));
      return callback(null, true);
    }
    if (corsOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origen no permitido'));
  },
  credentials: true,
}));
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: req => req.path === '/health',
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(compression());
app.use(auditContext);

app.use(express.static(publicDir, {
  setHeaders(res, filePath) {
    if (filePath.includes(`${path.sep}assets${path.sep}`)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (filePath.includes(`${path.sep}archivos${path.sep}`)) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  },
}));

app.get('/api/health', (_req, res) => res.json({ ok: true, app: 'EquipMaster API' }));

app.use('/api/usuarios', usuariosRouter);
app.use('/api/inventario', inventarioRouter);
app.use('/api/ventas', ventasRouter);
app.use('/api/reportes', reportesRouter);
app.use('/api/prestamos', prestamosRouter);
app.use('/api/actividad', actividadRouter);
app.use('/api/reparaciones', reparacionesRouter);
app.use('/api/centro-reparaciones', centroReparacionesRouter);
app.use('/api/backup', backupRouter);
app.use('/api/configuracion', configuracionRouter);
app.use('/api/storage', storageRouter);
app.use('/api/modelos-fotos', modelosFotosRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/hardware', hardwareRouter);
app.use('/api/notificaciones', notificacionesRouter);
app.use('/api/catalogos', catalogosRouter);
app.use('/api/garantias', garantiasRouter);
app.use('/api/mantenimientos', mantenimientosRouter);
app.use('/api/catalogo-publicacion', catalogoPublicacionRouter);
app.use('/api/solicitudes-venta', solicitudesVentaRouter);
app.use('/api/marketing', marketingRouter);
app.use('/api/jvbot', jvbotRouter);

app.use((err, _req, res, _next) => {
  console.error('API error:', err);
  if (res.headersSent) return;
  res.status(err.status || 500).json({ error: err.status && err.status < 500 ? err.message : 'Error interno del servidor' });
});

initStorage();
seedPermisos();

const indexPath = path.join(publicDir, 'index.html');
if (fs.existsSync(indexPath)) {
  app.get('*', (_req, res) => {
    res.sendFile(indexPath);
  });
}

const certPfx = process.env.HTTPS_PFX ? path.join(__dirname, '..', process.env.HTTPS_PFX) : null;
if (certPfx && fs.existsSync(certPfx)) {
  https.createServer({
    pfx: fs.readFileSync(certPfx),
    passphrase: process.env.HTTPS_PASSPHRASE || '',
  }, app).listen(PORT, '0.0.0.0', () => {
    console.log(`EquipMaster API → https://0.0.0.0:${PORT} (HTTPS)`);
  });
} else {
  http.createServer(app).listen(PORT, '0.0.0.0', () => {
    console.log(`EquipMaster API → http://0.0.0.0:${PORT} (LAN)`);
  });
}
