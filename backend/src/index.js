import 'dotenv/config';
import cors from 'cors';
import express from 'express';
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, '..', 'public')));

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

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`EquipMaster API → http://0.0.0.0:${PORT} (LAN)`);
});
