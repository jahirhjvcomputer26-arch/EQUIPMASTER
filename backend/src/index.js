import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import usuariosRouter from './routes/usuarios.js';
import inventarioRouter from './routes/inventario.js';
import ventasRouter from './routes/ventas.js';
import reportesRouter from './routes/reportes.js';
import prestamosRouter from './routes/prestamos.js';
import actividadRouter from './routes/actividad.js';
import reparacionesRouter from './routes/reparaciones.js';
import backupRouter from './routes/backup.js';
import configuracionRouter from './routes/configuracion.js';
import storageRouter from './routes/storage.js';
import { initStorage } from './storage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(express.static(publicDir));

app.get('/api/health', (_req, res) => res.json({ ok: true, app: 'EquipMaster API' }));

app.use('/api/usuarios', usuariosRouter);
app.use('/api/inventario', inventarioRouter);
app.use('/api/ventas', ventasRouter);
app.use('/api/reportes', reportesRouter);
app.use('/api/prestamos', prestamosRouter);
app.use('/api/actividad', actividadRouter);
app.use('/api/reparaciones', reparacionesRouter);
app.use('/api/backup', backupRouter);
app.use('/api/configuracion', configuracionRouter);
app.use('/api/storage', storageRouter);

initStorage();

const indexPath = path.join(publicDir, 'index.html');
if (fs.existsSync(indexPath)) {
  app.get('*', (_req, res) => {
    res.sendFile(indexPath);
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`EquipMaster API → http://0.0.0.0:${PORT} (LAN)`);
});
