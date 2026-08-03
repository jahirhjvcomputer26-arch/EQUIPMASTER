import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { loadPermisos, requirePerm, esSuperAdmin, resolverPermisos } from '../permisos.js';
import { firebaseGet, firebaseSet, firebaseDelete } from '../firebase.js';
import { registrarActividad } from './actividad.js';

const router = Router();
router.use(authMiddleware, loadPermisos());

const ESTADOS = [
  'pendiente', 'asignado', 'en_diagnostico', 'en_reparacion',
  'esperando_refacciones', 'esperando_autorizacion', 'reparado',
  'entregado', 'cerrado', 'cancelado',
];
const ESTADOS_TERMINALES = ['entregado', 'cerrado', 'cancelado'];
const ESTADOS_TECNICO = ['asignado', 'en_diagnostico', 'en_reparacion', 'esperando_refacciones', 'esperando_autorizacion', 'reparado'];
const PRIORIDADES = ['baja', 'media', 'alta', 'critica'];

function clave(req) { return req.user?.usuario; }
function nombreUsuario(req) { return req.user?.nombre || req.user?.usuario || 'Desconocido'; }

function esTecnicoAsignado(req, ticket) {
  return ticket?.tecnicoAsignado === clave(req) || ticket?.tecnicoAsignadoNombre === nombreUsuario(req);
}

function puedeVer(req, ticket) {
  const p = req.permisos || {};
  if (p.all || p.gestionar_tickets) return true;
  if (p.atender_tickets) return esTecnicoAsignado(req, ticket);
  return ticket?.creadoPorClave === clave(req);
}

function puedeComentar(req, ticket) {
  const p = req.permisos || {};
  if (p.all || p.gestionar_tickets) return true;
  if (p.atender_tickets) return esTecnicoAsignado(req, ticket);
  return ticket?.creadoPorClave === clave(req) && !ESTADOS_TERMINALES.includes(ticket?.estado);
}

function entradaHistorial(req, accion, detalle = '', extra = {}) {
  return {
    accion,
    autor: nombreUsuario(req),
    autorClave: clave(req),
    fecha: new Date().toISOString(),
    detalle,
    ...extra,
  };
}

async function conHistorial(ticket, req, entry) {
  const historial = Array.isArray(ticket.historial) ? ticket.historial : [];
  historial.push(entry);
  return historial;
}

router.get('/tecnicos', requirePerm('ver_tickets'), async (_req, res) => {
  try {
    const [users, roles] = await Promise.all([firebaseGet('usuarios'), firebaseGet('roles')]);
    const lista = Object.entries(users || {})
      .filter(([, u]) => {
        if (u?.activo === false) return false;
        const perms = resolverPermisos(u, roles);
        return perms.all || perms.atender_tickets || perms.gestionar_tickets;
      })
      .map(([claveU, u]) => ({ clave: claveU, nombre: u.nombre || claveU }));
    res.json(lista);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', requirePerm('ver_tickets'), async (req, res) => {
  try {
    const data = await firebaseGet('tickets');
    let list = data ? Object.entries(data).map(([id, v]) => ({ id, ...v })) : [];
    list = list.filter(t => puedeVer(req, t));

    if (req.query.estado) list = list.filter(t => t.estado === req.query.estado);
    if (req.query.prioridad) list = list.filter(t => t.prioridad === req.query.prioridad);
    if (req.query.asignado) list = list.filter(t => t.tecnicoAsignado === req.query.asignado || t.tecnicoAsignadoNombre === req.query.asignado);
    if (req.query.q) {
      const q = req.query.q.toLowerCase();
      list = list.filter(t =>
        (t.asunto || '').toLowerCase().includes(q) ||
        (t.descripcion || '').toLowerCase().includes(q) ||
        (t.id || '').toLowerCase().includes(q) ||
        (t.creadoPor || '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', requirePerm('ver_tickets'), async (req, res) => {
  try {
    const ticket = await firebaseGet(`tickets/${req.params.id}`);
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    if (!puedeVer(req, ticket)) return res.status(403).json({ error: 'No tienes acceso a este ticket' });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requirePerm('registrar_tickets'), async (req, res) => {
  try {
    const { asunto, descripcion, prioridad } = req.body;
    if (!asunto || !String(asunto).trim()) return res.status(400).json({ error: 'El problema es obligatorio' });
    const id = `TK-${Date.now().toString(36).toUpperCase()}`;
    const ticket = {
      id,
      asunto: String(asunto).trim(),
      descripcion: String(descripcion || '').trim(),
      prioridad: PRIORIDADES.includes(prioridad) ? prioridad : 'media',
      estado: 'pendiente',
      creadoPor: nombreUsuario(req),
      creadoPorClave: clave(req),
      creadoEn: new Date().toISOString(),
      timestamp: Date.now(),
      tecnicoAsignado: '',
      tecnicoAsignadoNombre: '',
      fechaAsignacion: '',
      fechaEstimadaEntrega: '',
      notasInternas: '',
      notas: [],
      historial: [],
      diagnosticos: [],
      reparaciones: [],
      piezas: [],
      fotografias: [],
      modificadoEn: new Date().toISOString(),
    };
    ticket.historial = await conHistorial(ticket, req, entradaHistorial(req, 'creado', `Ticket creado con prioridad ${ticket.prioridad}`));
    await firebaseSet(`tickets/${id}`, ticket);
    registrarActividad(nombreUsuario(req), 'TICKET_CREADO', `${id}: ${ticket.asunto}`);
    res.status(201).json({ message: 'Ticket creado', ticket });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await firebaseGet(`tickets/${req.params.id}`);
    if (!existing) return res.status(404).json({ error: 'Ticket no encontrado' });
    if (!puedeVer(req, existing)) return res.status(403).json({ error: 'No tienes acceso a este ticket' });

    const p = req.permisos || {};
    const esAdmin = p.all || p.gestionar_tickets;
    const esTecnico = p.atender_tickets && esTecnicoAsignado(req, existing);
    if (!esAdmin && !esTecnico) {
      return res.status(403).json({ error: 'No tienes permiso para modificar este ticket' });
    }

    const body = req.body || {};
    const cambios = [];
    const updated = { ...existing };

    if (esAdmin) {
      if (body.asunto !== undefined) {
        if (!String(body.asunto).trim()) return res.status(400).json({ error: 'El problema es obligatorio' });
        updated.asunto = String(body.asunto).trim();
        cambios.push('problema');
      }
      if (body.descripcion !== undefined) {
        updated.descripcion = String(body.descripcion).trim();
        cambios.push('descripción');
      }
      if (body.prioridad !== undefined) {
        if (!PRIORIDADES.includes(body.prioridad)) return res.status(400).json({ error: 'Prioridad inválida' });
        if (body.prioridad !== existing.prioridad) cambios.push(`prioridad: ${existing.prioridad} → ${body.prioridad}`);
        updated.prioridad = body.prioridad;
      }
      if (body.notasInternas !== undefined) updated.notasInternas = String(body.notasInternas).trim();
      if (body.fechaEstimadaEntrega !== undefined) {
        updated.fechaEstimadaEntrega = String(body.fechaEstimadaEntrega || '');
        cambios.push('fecha estimada de entrega');
      }
    }

    if (body.tecnicoAsignado !== undefined && (esAdmin || esTecnico)) {
      const nueva = body.tecnicoAsignado;
      if (nueva !== existing.tecnicoAsignado) {
        if (nueva) {
          const users = await firebaseGet('usuarios');
          const t = users?.[nueva];
          updated.tecnicoAsignado = nueva;
          updated.tecnicoAsignadoNombre = t?.nombre || nueva;
          updated.fechaAsignacion = existing.fechaAsignacion || new Date().toISOString();
          cambios.push(`asignado a ${updated.tecnicoAsignadoNombre}`);
          if (updated.estado === 'pendiente') {
            updated.estado = 'asignado';
            cambios.push('estado: pendiente → asignado');
          }
        } else {
          updated.tecnicoAsignado = '';
          updated.tecnicoAsignadoNombre = '';
          updated.fechaAsignacion = '';
          cambios.push('sin asignar');
          if (updated.estado === 'asignado') {
            updated.estado = 'pendiente';
            cambios.push('estado: asignado → pendiente');
          }
        }
      }
    }

    if (body.estado !== undefined) {
      if (!ESTADOS.includes(body.estado)) return res.status(400).json({ error: 'Estado inválido' });
      if (body.estado !== existing.estado) {
        const permitido = esAdmin || ESTADOS_TECNICO.includes(body.estado);
        if (!permitido) return res.status(403).json({ error: 'No puedes cambiar a ese estado' });
        updated.estado = body.estado;
        cambios.push(`estado: ${existing.estado} → ${body.estado}`);
      }
    }

    if (esAdmin || esTecnico) {
      for (const campo of ['diagnosticos', 'reparaciones', 'piezas', 'fotografias']) {
        if (Array.isArray(body[campo])) {
          const limpiado = body[campo].filter(x => x && String(x).trim()).map(x => String(x).trim());
          if (JSON.stringify(limpiado) !== JSON.stringify(existing[campo] || [])) {
            updated[campo] = limpiado;
            cambios.push(campo);
          }
        }
      }
    }

    if (cambios.length) {
      updated.historial = await conHistorial(existing, req, entradaHistorial(req, 'actualizado', cambios.join(', '), {
        estadoAnterior: existing.estado,
        estadoNuevo: updated.estado !== existing.estado ? updated.estado : undefined,
      }));
      registrarActividad(nombreUsuario(req), 'TICKET_ACTUALIZADO', `${req.params.id}: ${cambios.join(', ')}`);
    }
    updated.modificadoEn = new Date().toISOString();
    await firebaseSet(`tickets/${req.params.id}`, updated);
    res.json({ message: 'Ticket actualizado', ticket: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/nota', async (req, res) => {
  try {
    const existing = await firebaseGet(`tickets/${req.params.id}`);
    if (!existing) return res.status(404).json({ error: 'Ticket no encontrado' });
    if (!puedeVer(req, existing)) return res.status(403).json({ error: 'No tienes acceso a este ticket' });
    if (!puedeComentar(req, existing)) return res.status(403).json({ error: 'No puedes comentar en este ticket' });

    const { texto } = req.body;
    if (!texto || !String(texto).trim()) return res.status(400).json({ error: 'El texto del comentario es obligatorio' });

    const notas = Array.isArray(existing.notas) ? existing.notas : [];
    notas.push({
      texto: String(texto).trim(),
      autor: nombreUsuario(req),
      autorClave: clave(req),
      fecha: new Date().toISOString(),
    });

    const updated = {
      ...existing,
      notas,
      historial: await conHistorial(existing, req, entradaHistorial(req, 'comentario', 'Nuevo comentario')),
      modificadoEn: new Date().toISOString(),
    };
    await firebaseSet(`tickets/${req.params.id}`, updated);
    registrarActividad(nombreUsuario(req), 'TICKET_NOTA', `${req.params.id}: comentario agregado`);
    res.json({ message: 'Comentario agregado', ticket: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/reabrir', async (req, res) => {
  try {
    if (!esSuperAdmin(req.userRecord)) {
      return res.status(403).json({ error: 'Solo el Super Administrador puede reabrir tickets' });
    }
    const existing = await firebaseGet(`tickets/${req.params.id}`);
    if (!existing) return res.status(404).json({ error: 'Ticket no encontrado' });
    if (!ESTADOS_TERMINALES.includes(existing.estado)) {
      return res.status(400).json({ error: 'El ticket debe estar cerrado, cancelado o entregado para reabrirlo' });
    }
    const nuevoEstado = existing.tecnicoAsignado ? 'asignado' : 'pendiente';
    const updated = {
      ...existing,
      estado: nuevoEstado,
      historial: await conHistorial(existing, req, entradaHistorial(req, 'reabierto', `Reabierto (${existing.estado} → ${nuevoEstado})`, {
        estadoAnterior: existing.estado,
        estadoNuevo: nuevoEstado,
      })),
      modificadoEn: new Date().toISOString(),
    };
    await firebaseSet(`tickets/${req.params.id}`, updated);
    registrarActividad(nombreUsuario(req), 'TICKET_REABIERTO', `${req.params.id}`);
    res.json({ message: 'Ticket reabierto', ticket: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!esSuperAdmin(req.userRecord)) {
      return res.status(403).json({ error: 'Solo el Super Administrador puede eliminar tickets' });
    }
    const existing = await firebaseGet(`tickets/${req.params.id}`);
    if (!existing) return res.status(404).json({ error: 'Ticket no encontrado' });
    await firebaseDelete(`tickets/${req.params.id}`);
    registrarActividad(nombreUsuario(req), 'TICKET_ELIMINADO', `${req.params.id}: ${existing.asunto}`);
    res.json({ message: 'Ticket eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
