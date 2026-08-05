import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { authMiddleware } from '../middleware/auth.js';
import { loadPermisos } from '../permisos.js';
import { firebaseGet } from '../firebase.js';

const router = Router();
router.use(authMiddleware, loadPermisos());

function getModel() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY no configurada en .env');
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
}

async function obtenerContexto() {
  const inv = await firebaseGet('inventario');
  const items = inv ? Object.values(inv) : [];
  const total = items.length;
  const activos = items.filter(i => !i.estado?.includes('VENDIDO')).length;
  const estados = {};
  items.forEach(i => { const e = i.estado || 'Sin estado'; estados[e] = (estados[e] || 0) + 1; });
  const marcas = {};
  items.forEach(i => { const m = i.marca || 'Sin marca'; marcas[m] = (marcas[m] || 0) + 1; });
  const topMarcas = Object.entries(marcas).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([m, c]) => `${m}: ${c}`).join(', ');
  const tickets = await firebaseGet('tickets');
  const tList = tickets ? Object.values(tickets) : [];
  const ticketsAbiertos = tList.filter(t => !['entregado','cerrado','cancelado','reparado'].includes(t.estado)).length;
  return `INVENTARIO: ${total} equipos (${activos} activos). Estados: ${Object.entries(estados).map(([k,v])=>`${k}=${v}`).join(', ')}. Marcas principales: ${topMarcas}. TICKETS: ${tList.length} total, ${ticketsAbiertos} abiertos. El sistema se llama EquipMaster de JV COMPUTER, ubicado en Nuevo León, México.`;
}

router.post('/chat', async (req, res) => {
  try {
    const { mensaje } = req.body;
    if (!mensaje) return res.status(400).json({ error: 'Mensaje requerido' });
    const ctx = await obtenerContexto();
    const model = getModel();
    const chat = model.startChat({
      systemInstruction: `Eres el asistente de EquipMaster, un software de gestión de inventario de equipos de cómputo. Responde en español, con datos precisos. Contexto actual del sistema: ${ctx}. Puedes ayudar con: consultas de inventario, sugerencias de diagnóstico de fallas, estadísticas, y recomendaciones. Sé amable y profesional. El usuario actual es ${req.user?.nombre || 'un usuario'}.`,
    });
    const result = await chat.sendMessage(mensaje);
    const respuesta = result.response.text();
    res.json({ respuesta });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/diagnostico', async (req, res) => {
  try {
    const { sintomas, equipo } = req.body;
    if (!sintomas) return res.status(400).json({ error: 'Describe los síntomas' });
    const model = getModel();
    const eq = equipo ? `Equipo: ${equipo.marca || ''} ${equipo.modelo || ''} ${equipo.procesador || ''}` : '';
    const prompt = `Eres un técnico experto en reparación de computadoras. Diagnostica los siguientes síntomas: "${sintomas}". ${eq}. Da 3 posibles causas ordenadas por probabilidad, y para cada una sugiere la solución. Sé breve. Responde en español.`;
    const result = await model.generateContent(prompt);
    res.json({ diagnostico: result.response.text() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
