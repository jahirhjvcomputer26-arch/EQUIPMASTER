import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../componentes/Notification';
import useDocumentTitle from '../utils/useDocumentTitle';

const ESTADOS = [
  { key: 'pendiente', label: 'Pendiente', icon: 'fa-circle-dot', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', dot: 'bg-amber-400' },
  { key: 'asignado', label: 'Asignado', icon: 'fa-user-check', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', dot: 'bg-blue-400' },
  { key: 'en_diagnostico', label: 'En diagnóstico', icon: 'fa-stethoscope', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-600', dot: 'bg-violet-400' },
  { key: 'en_reparacion', label: 'En reparación', icon: 'fa-wrench', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600', dot: 'bg-indigo-400' },
  { key: 'esperando_refacciones', label: 'Esperando refacciones', icon: 'fa-box-open', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', dot: 'bg-orange-400' },
  { key: 'esperando_autorizacion', label: 'Esperando autorización', icon: 'fa-hourglass-half', bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-600', dot: 'bg-pink-400' },
  { key: 'reparado', label: 'Reparado', icon: 'fa-circle-check', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', dot: 'bg-emerald-400' },
  { key: 'entregado', label: 'Entregado', icon: 'fa-truck-fast', bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-600', dot: 'bg-teal-400' },
  { key: 'cerrado', label: 'Cerrado', icon: 'fa-circle-xmark', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-500', dot: 'bg-slate-400' },
  { key: 'cancelado', label: 'Cancelado', icon: 'fa-ban', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', dot: 'bg-red-400' },
];

const PRIORIDADES = {
  critica: { label: 'Crítica', selected: 'bg-red-600 text-white border-red-600', color: 'text-red-700 bg-red-50 border-red-200', icon: 'fa-fire' },
  alta: { label: 'Alta', selected: 'bg-orange-500 text-white border-orange-500', color: 'text-orange-600 bg-orange-50 border-orange-200', icon: 'fa-arrow-up' },
  media: { label: 'Media', selected: 'bg-amber-500 text-white border-amber-500', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: 'fa-minus' },
  baja: { label: 'Baja', selected: 'bg-slate-600 text-white border-slate-600', color: 'text-slate-500 bg-slate-50 border-slate-200', icon: 'fa-arrow-down' },
};

const MAPA_LEGACY = { abierto: 'pendiente', en_proceso: 'en_reparacion', resuelto: 'reparado' };
const ESTADOS_TECNICO = ['asignado', 'en_diagnostico', 'en_reparacion', 'esperando_refacciones', 'esperando_autorizacion', 'reparado'];
const ESTADOS_TERMINALES = ['entregado', 'cerrado', 'cancelado'];
const EMPTY_TICKET = { asunto: '', descripcion: '', prioridad: 'media' };

const HISTORIAL_ICONOS = {
  creado: { icon: 'fa-circle-plus', color: 'text-brand-500 bg-brand-50' },
  actualizado: { icon: 'fa-pen', color: 'text-blue-600 bg-blue-50' },
  comentario: { icon: 'fa-comment', color: 'text-slate-600 bg-slate-100' },
  reabierto: { icon: 'fa-rotate-left', color: 'text-violet-600 bg-violet-50' },
};

function TiempoRelativo({ fecha }) {
  if (!fecha) return null;
  const diff = Date.now() - new Date(fecha).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return <span>ahora</span>;
  if (mins < 60) return <span>{mins}m</span>;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return <span>{hrs}h</span>;
  return <span>{Math.floor(hrs / 24)}d</span>;
}

function estadoInfo(key) {
  return ESTADOS.find(e => e.key === (MAPA_LEGACY[key] || key)) || ESTADOS.find(e => e.key === 'pendiente');
}

function BadgeEstado({ estado }) {
  const e = estadoInfo(estado);
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${e.text} ${e.border} ${e.bg} dark:bg-slate-800 dark:border-slate-600 dark:!text-slate-100`}>
      <span className={`w-1.5 h-1.5 rounded-full ${e.dot}`} />
      {e.label}
    </span>
  );
}

function BadgePrioridad({ prioridad }) {
  const p = PRIORIDADES[prioridad] || PRIORIDADES.media;
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${p.color}`}>{p.label}</span>;
}

export default function Tickets() {
  useDocumentTitle('Tickets de Reparación');
  const { user, can } = useAuth();
  const { notify } = useNotify();

  const esSuperAdmin = user?.rol === 'superadmin' || (user?.nivel || 0) >= 100;
  const puedeGestionar = can('gestionar_tickets');
  const puedeAtender = can('atender_tickets');
  const puedeCrear = can('registrar_tickets');
  const esAdmin = esSuperAdmin || puedeGestionar;

  const [tickets, setTickets] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState({ estado: '', prioridad: '', q: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState(EMPTY_TICKET);
  const [saving, setSaving] = useState(false);

  const [detail, setDetail] = useState(null);
  const [asignarModal, setAsignarModal] = useState(null);
  const [asignarForm, setAsignarForm] = useState({ tecnico: '', fechaEstimadaEntrega: '', prioridad: '' });
  const [notaTexto, setNotaTexto] = useState('');
  const [trabajo, setTrabajo] = useState({ diagnosticos: '', reparaciones: '', piezas: '', fotografias: '' });

  const cargar = useCallback(async () => {
    try {
      const params = {};
      if (filtro.estado) params.estado = filtro.estado;
      if (filtro.prioridad) params.prioridad = filtro.prioridad;
      if (filtro.q) params.q = filtro.q;
      const data = await api.getTickets(params);
      setTickets(data);
    } catch (err) {
      notify(err.message, '', 'error');
    } finally {
      setLoading(false);
    }
  }, [filtro, notify]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    const id = setInterval(cargar, 30000);
    return () => clearInterval(id);
  }, [cargar]);

  useEffect(() => {
    if (esAdmin || puedeAtender) {
      api.getTecnicos().then(setTecnicos).catch(() => {});
    }
  }, [esAdmin, puedeAtender]);

  const refrescarDetalle = useCallback(async (id) => {
    try {
      const t = await api.getTicket(id);
      setDetail(t);
    } catch (err) {
      setDetail(null);
      notify(err.message, '', 'error');
    }
  }, [notify]);

  const soyTecnicoAsignado = detail &&
    (detail.tecnicoAsignado === user?.clave || detail.tecnicoAsignadoNombre === user?.nombre);
  const esCreador = detail?.creadoPorClave === user?.clave;
  const ticketAbierto = detail && !ESTADOS_TERMINALES.includes(detail.estado);
  const puedeComentar = detail && (esSuperAdmin || puedeGestionar || (puedeAtender && soyTecnicoAsignado) || (esCreador && ticketAbierto));

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!form.asunto.trim()) return notify('El problema es obligatorio', '', 'error');
    setSaving(true);
    try {
      if (editando) {
        await api.actualizarTicket(detail.id, { asunto: form.asunto, descripcion: form.descripcion, prioridad: form.prioridad });
        notify('Ticket actualizado', '', 'success');
        await refrescarDetalle(detail.id);
      } else {
        await api.crearTicket(form);
        notify('Ticket creado', '', 'success');
      }
      setModalOpen(false);
      setEditando(false);
      setForm(EMPTY_TICKET);
      cargar();
    } catch (err) {
      notify(err.message, '', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCambiarEstado = async (nuevoEstado) => {
    if (!detail) return;
    setSaving(true);
    try {
      const res = await api.actualizarTicket(detail.id, { estado: nuevoEstado });
      notify(`Estado → ${estadoInfo(nuevoEstado).label}`, '', 'success');
      setDetail(res.ticket);
      cargar();
    } catch (err) {
      notify(err.message, '', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openAsignar = (ticket) => {
    setAsignarForm({
      tecnico: ticket.tecnicoAsignado || '',
      fechaEstimadaEntrega: ticket.fechaEstimadaEntrega || '',
      prioridad: ticket.prioridad || 'media',
    });
    setAsignarModal(ticket);
  };

  const handleAsignar = async () => {
    if (!asignarModal) return;
    setSaving(true);
    try {
      const body = { prioridad: asignarForm.prioridad };
      if (asignarForm.fechaEstimadaEntrega) body.fechaEstimadaEntrega = asignarForm.fechaEstimadaEntrega;
      if (asignarForm.tecnico) body.tecnicoAsignado = asignarForm.tecnico;
      else body.tecnicoAsignado = '';
      const res = await api.actualizarTicket(asignarModal.id, body);
      const t = res.ticket;
      notify(t.tecnicoAsignadoNombre ? `Asignado a ${t.tecnicoAsignadoNombre}` : 'Ticket sin asignar', '', 'success');
      setAsignarModal(null);
      setDetail(t);
      cargar();
    } catch (err) {
      notify(err.message, '', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleNota = async () => {
    if (!notaTexto.trim() || !detail) return;
    setSaving(true);
    try {
      const res = await api.agregarNotaTicket(detail.id, notaTexto);
      setNotaTexto('');
      notify('Comentario agregado', '', 'success');
      setDetail(res.ticket);
      cargar();
    } catch (err) {
      notify(err.message, '', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAgregarTrabajo = async (campo) => {
    if (!trabajo[campo].trim() || !detail) return;
    const lista = Array.isArray(detail[campo]) ? detail[campo] : [];
    const nuevo = [...lista, trabajo[campo].trim()];
    setSaving(true);
    try {
      const res = await api.actualizarTicket(detail.id, { [campo]: nuevo });
      notify('Información guardada', '', 'success');
      setTrabajo(t => ({ ...t, [campo]: '' }));
      setDetail(res.ticket);
      cargar();
    } catch (err) {
      notify(err.message, '', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (ticket) => {
    if (!confirm(`Eliminar ticket ${ticket.id}? Esta acción no se puede deshacer.`)) return;
    try {
      await api.eliminarTicket(ticket.id);
      notify('Ticket eliminado', '', 'success');
      setDetail(null);
      cargar();
    } catch (err) {
      notify(err.message, '', 'error');
    }
  };

  const handleReabrir = async () => {
    if (!detail) return;
    if (!confirm(`Reabrir ticket ${detail.id}?`)) return;
    try {
      const res = await api.reabrirTicket(detail.id);
      notify('Ticket reabierto', '', 'success');
      setDetail(res.ticket);
      cargar();
    } catch (err) {
      notify(err.message, '', 'error');
    }
  };

  const openCrear = () => {
    setForm(EMPTY_TICKET);
    setEditando(false);
    setModalOpen(true);
  };

  const openEditar = () => {
    if (!detail) return;
    setForm({ asunto: detail.asunto, descripcion: detail.descripcion || '', prioridad: detail.prioridad || 'media' });
    setEditando(true);
    setModalOpen(true);
  };

  const estadoActual = (key) => estadoInfo(key);

  const conteo = (keys) => tickets.filter(t => keys.includes(t.estado)).length;
  const stats = {
    total: tickets.length,
    pendientes: conteo(['pendiente']),
    asignados: conteo(['asignado']),
    enProceso: conteo(['en_diagnostico', 'en_reparacion', 'esperando_refacciones', 'esperando_autorizacion']),
    reparados: conteo(['reparado']),
    entregados: conteo(['entregado']),
    cerrados: conteo(['cerrado', 'cancelado']),
  };

  const chips = [
    { key: '', label: `Todos (${stats.total})`, active: !filtro.estado },
    { key: 'pendiente', label: `Pendientes (${stats.pendientes})`, active: filtro.estado === 'pendiente' },
    { key: 'asignado', label: `Asignados (${stats.asignados})`, active: filtro.estado === 'asignado' },
    { key: 'proceso', label: `En proceso (${stats.enProceso})`, active: ['en_diagnostico', 'en_reparacion', 'esperando_refacciones', 'esperando_autorizacion'].includes(filtro.estado) },
    { key: 'reparado', label: `Reparados (${stats.reparados})`, active: filtro.estado === 'reparado' },
    { key: 'entregado', label: `Entregados (${stats.entregados})`, active: filtro.estado === 'entregado' },
    { key: 'cerrado', label: `Cerrados/Cancelados (${stats.cerrados})`, active: ['cerrado', 'cancelado'].includes(filtro.estado) },
  ];

  const setChip = (key) => {
    setFiltro(f => ({
      ...f,
      estado: key === 'proceso' ? 'en_diagnostico' : key,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <i className="fa-solid fa-spinner fa-spin text-brand-500 text-3xl mb-3" />
          <p className="text-sm text-slate-400">Cargando tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <i className="fa-solid fa-screwdriver-wrench text-brand-500" /> Tickets de Reparación
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">{stats.total} tickets · {stats.enProceso} en proceso · {stats.pendientes} pendientes</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="text" placeholder="Buscar..." value={filtro.q} onChange={e => setFiltro(f => ({ ...f, q: e.target.value }))}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm w-40 focus:ring-2 focus:ring-brand-300 focus:border-brand-300 outline-none dark:bg-slate-700 dark:border-slate-600 dark:!text-slate-100" />
          <select value={filtro.prioridad} onChange={e => setFiltro(f => ({ ...f, prioridad: e.target.value }))}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-300 focus:border-brand-300 outline-none dark:bg-slate-700 dark:border-slate-600 dark:!text-slate-100">
            <option value="">Todas las prioridades</option>
            {Object.entries(PRIORIDADES).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
          </select>
          {puedeCrear && (
            <button onClick={openCrear}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl shadow transition flex items-center gap-2">
              <i className="fa-solid fa-plus" /> Nuevo Ticket
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {chips.map(c => (
          <button key={c.key} onClick={() => setChip(c.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
              c.active
                ? 'bg-brand-600 border-brand-600 text-white'
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:!text-slate-300'
            }`}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wide text-slate-400 border-b border-slate-100 dark:border-slate-700">
                <th className="px-4 py-3 font-bold">Ticket</th>
                <th className="px-4 py-3 font-bold">Prioridad</th>
                <th className="px-4 py-3 font-bold">Estado</th>
                <th className="px-4 py-3 font-bold">Reportado por</th>
                <th className="px-4 py-3 font-bold">Técnico</th>
                <th className="px-4 py-3 font-bold">Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400 italic">
                    No hay tickets que coincidan con los filtros
                  </td>
                </tr>
              )}
              {tickets.map(t => (
                <tr key={t.id} onClick={() => setDetail(t)}
                  className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition cursor-pointer">
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 dark:!text-slate-400 mt-0.5">{t.id}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-700 dark:!text-slate-100 line-clamp-1">{t.asunto}</p>
                        {t.descripcion && <p className="text-xs text-slate-400 dark:!text-slate-400 line-clamp-1">{t.descripcion}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><BadgePrioridad prioridad={t.prioridad} /></td>
                  <td className="px-4 py-3"><BadgeEstado estado={t.estado} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center shrink-0">
                        <span className="text-[8px] font-bold text-brand-600 dark:!text-brand-300">{(t.creadoPor || '?')[0].toUpperCase()}</span>
                      </div>
                      <span className="text-xs text-slate-500 dark:!text-slate-300 line-clamp-1">{t.creadoPor}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {t.tecnicoAsignadoNombre ? (
                      <span className="text-xs font-bold text-blue-600 dark:!text-blue-400">
                        <i className="fa-solid fa-user-check mr-1" />{t.tecnicoAsignadoNombre}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300 dark:!text-slate-500 italic">Sin asignar</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 dark:!text-slate-400">
                    <TiempoRelativo fecha={t.modificadoEn || t.creadoEn} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 dark:!text-slate-100">
                <i className={`fa-solid ${editando ? 'fa-pen' : 'fa-plus'} text-brand-500 mr-2`} />
                {editando ? 'Editar Ticket' : 'Nuevo Ticket'}
              </h3>
              <button onClick={() => { setModalOpen(false); setEditando(false); }} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>
            <form onSubmit={handleCrear} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:!text-slate-300 mb-1">Problema *</label>
                <input type="text" value={form.asunto} onChange={e => setForm(f => ({ ...f, asunto: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:!text-slate-100 text-sm focus:ring-2 focus:ring-brand-300 focus:border-brand-300 outline-none"
                  placeholder="Ej: No enciende laptop Dell..." autoFocus />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:!text-slate-300 mb-1">Descripción</label>
                <textarea rows={3} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:!text-slate-100 text-sm focus:ring-2 focus:ring-brand-300 focus:border-brand-300 outline-none resize-none"
                  placeholder="Detalles del problema..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:!text-slate-300 mb-1">Prioridad</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(PRIORIDADES).map(([key, p]) => (
                    <button key={key} type="button" onClick={() => setForm(f => ({ ...f, prioridad: key }))}
                      className={`cursor-pointer py-2 rounded-xl text-sm font-bold border-2 transition flex items-center justify-center gap-1.5 ${
                        form.prioridad === key
                          ? p.selected
                          : 'border-slate-200 dark:border-slate-600 text-slate-400 dark:!text-slate-400 hover:border-slate-300 hover:text-slate-600'
                      }`}>
                      {form.prioridad === key && <i className="fa-solid fa-check text-[10px]" />}
                      <i className={`fa-solid ${p.icon}`} />{p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setModalOpen(false); setEditando(false); }}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 dark:!text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl shadow transition disabled:opacity-50">
                  {saving ? <i className="fa-solid fa-spinner fa-spin mr-1" /> : null}
                  {editando ? 'Guardar' : 'Crear Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {asignarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setAsignarModal(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 dark:!text-slate-100">
                <i className="fa-solid fa-user-gear text-brand-500 mr-2" /> Asignar / Reasignar Ticket
              </h3>
              <button onClick={() => setAsignarModal(null)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-400">{asignarModal.id} · {asignarModal.asunto}</p>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:!text-slate-300 mb-1">Técnico responsable</label>
                <select value={asignarForm.tecnico} onChange={e => setAsignarForm(f => ({ ...f, tecnico: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:!text-slate-100 text-sm focus:ring-2 focus:ring-brand-300 outline-none">
                  <option value="">Sin asignar</option>
                  {tecnicos.map(t => <option key={t.clave} value={t.clave}>{t.nombre}</option>)}
                </select>
                {tecnicos.length === 0 && (
                  <p className="text-[10px] text-amber-600 mt-1">No hay usuarios con permiso para atender tickets. Crea un rol Técnico o Admin en Administración de Usuarios.</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:!text-slate-300 mb-1">Prioridad</label>
                <select value={asignarForm.prioridad} onChange={e => setAsignarForm(f => ({ ...f, prioridad: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:!text-slate-100 text-sm focus:ring-2 focus:ring-brand-300 outline-none">
                  {Object.entries(PRIORIDADES).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:!text-slate-300 mb-1">Fecha estimada de entrega (opcional)</label>
                <input type="date" value={asignarForm.fechaEstimadaEntrega} onChange={e => setAsignarForm(f => ({ ...f, fechaEstimadaEntrega: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:!text-slate-100 text-sm focus:ring-2 focus:ring-brand-300 outline-none" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setAsignarModal(null)}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 dark:!text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                  Cancelar
                </button>
                <button onClick={handleAsignar} disabled={saving}
                  className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl shadow transition disabled:opacity-50">
                  {saving ? <i className="fa-solid fa-spinner fa-spin mr-1" /> : null}
                  Guardar asignación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDetail(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-mono font-bold text-slate-400 dark:!text-slate-400">{detail.id}</span>
                  <BadgePrioridad prioridad={detail.prioridad} />
                  <BadgeEstado estado={detail.estado} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:!text-slate-100">{detail.asunto}</h3>
                {detail.descripcion && (
                  <p className="text-sm text-slate-500 dark:!text-slate-300 mt-1 whitespace-pre-wrap">{detail.descripcion}</p>
                )}
              </div>
              <button onClick={() => setDetail(null)} className="text-slate-400 hover:text-slate-600 ml-4 shrink-0">
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Reportado por</p>
                  <p className="font-bold text-slate-700 dark:!text-slate-100">{detail.creadoPor}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{detail.creadoEn ? new Date(detail.creadoEn).toLocaleString('es-MX') : ''}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Técnico responsable</p>
                  <p className="font-bold text-blue-600 dark:!text-blue-400">{detail.tecnicoAsignadoNombre || 'Sin asignar'}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {detail.fechaAsignacion ? `Desde ${new Date(detail.fechaAsignacion).toLocaleDateString('es-MX')}` : 'Sin fecha'}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Fecha estimada entrega</p>
                  <p className="font-bold text-slate-700 dark:!text-slate-100">{detail.fechaEstimadaEntrega ? new Date(detail.fechaEstimadaEntrega).toLocaleDateString('es-MX') : '—'}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Creado</p>
                  <p className="font-bold text-slate-700 dark:!text-slate-100">{detail.creadoEn ? new Date(detail.creadoEn).toLocaleDateString('es-MX') : '—'}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5"><TiempoRelativo fecha={detail.creadoEn} /></p>
                </div>
              </div>

              {(esAdmin || (puedeAtender && soyTecnicoAsignado)) && (
                <div className="flex flex-wrap items-center gap-2">
                  <select value={detail.estado} onChange={e => handleCambiarEstado(e.target.value)} disabled={saving}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:!text-slate-100 text-sm focus:ring-2 focus:ring-brand-300 outline-none">
                    {(esAdmin ? ESTADOS : ESTADOS_TECNICO).map(e => {
                      const clave = typeof e === 'string' ? e : e.key;
                      return <option key={clave} value={clave}>{estadoActual(clave).label}</option>;
                    })}
                  </select>
                  {esAdmin && (
                    <>
                      <button onClick={() => openAsignar(detail)}
                        className="px-3 py-2 text-xs font-bold text-blue-600 dark:!text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-xl transition hover:bg-blue-100">
                        <i className="fa-solid fa-user-gear mr-1" />Asignar / Reasignar
                      </button>
                      <button onClick={openEditar}
                        className="px-3 py-2 text-xs font-bold text-slate-500 dark:!text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-xl transition hover:bg-slate-200">
                        <i className="fa-solid fa-pen mr-1" />Editar
                      </button>
                    </>
                  )}
                  {esSuperAdmin && ESTADOS_TERMINALES.includes(detail.estado) && (
                    <button onClick={handleReabrir}
                      className="px-3 py-2 text-xs font-bold text-violet-600 dark:!text-violet-400 bg-violet-50 dark:bg-violet-900/30 rounded-xl transition hover:bg-violet-100">
                      <i className="fa-solid fa-rotate-left mr-1" />Reabrir
                    </button>
                  )}
                  {esSuperAdmin && (
                    <button onClick={() => handleEliminar(detail)}
                      className="px-3 py-2 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/30 rounded-xl transition hover:bg-red-100">
                      <i className="fa-solid fa-trash mr-1" />Eliminar
                    </button>
                  )}
                </div>
              )}

              {(esAdmin || (puedeAtender && soyTecnicoAsignado)) && (
                <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Trabajo del técnico</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { campo: 'diagnosticos', label: 'Diagnóstico(s)', icon: 'fa-stethoscope', place: 'Ej: Batería dañada...' },
                      { campo: 'reparaciones', label: 'Reparación(es)', icon: 'fa-wrench', place: 'Ej: Cambio de batería...' },
                      { campo: 'piezas', label: 'Piezas utilizadas', icon: 'fa-cubes', place: 'Ej: Batería 11.1V 4Ah' },
                      { campo: 'fotografias', label: 'Fotografías (URL)', icon: 'fa-image', place: 'https://...' },
                    ].map(({ campo, label, icon, place }) => (
                      <div key={campo} className="space-y-2">
                        <label className="block text-xs font-bold text-slate-600 dark:!text-slate-300">
                          <i className={`fa-solid ${icon} mr-1 text-slate-400`} />{label}
                        </label>
                        {(detail[campo] || []).length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {(detail[campo] || []).map((item, i) =>
                              campo === 'fotografias'
                                ? <a key={i} href={item} target="_blank" rel="noreferrer"
                                    className="w-14 h-14 rounded-lg border border-slate-200 overflow-hidden hover:ring-2 ring-brand-300">
                                    <img src={item} alt={`foto ${i + 1}`} className="w-full h-full object-cover"
                                      onError={e => { e.target.onerror = null; e.target.src = ''; }} />
                                  </a>
                                : <span key={i} className="text-xs text-slate-600 dark:!text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1">
                                    {item}
                                  </span>
                            )}
                          </div>
                        )}
                        <div className="flex gap-1.5">
                          <input type="text" value={trabajo[campo]} onChange={e => setTrabajo(t => ({ ...t, [campo]: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAgregarTrabajo(campo); } }}
                            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:!text-slate-100 text-xs focus:ring-2 focus:ring-brand-300 outline-none"
                            placeholder={place} />
                          <button onClick={() => handleAgregarTrabajo(campo)} disabled={saving}
                            className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50">
                            <i className="fa-solid fa-plus" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {esAdmin && (
                <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Notas internas (privadas)</label>
                  <textarea rows={2} value={detail.notasInternas || ''} onChange={e => setDetail(d => ({ ...d, notasInternas: e.target.value }))}
                    onBlur={async () => { try { const res = await api.actualizarTicket(detail.id, { notasInternas: detail.notasInternas }); setDetail(res.ticket); } catch {} }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:!text-slate-100 text-sm focus:ring-2 focus:ring-brand-300 outline-none resize-none"
                    placeholder="Notas privadas del administrador..." />
                </div>
              )}

              <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">
                  Comentarios ({detail.notas?.length || 0})
                </p>
                <div className="space-y-2 max-h-44 overflow-y-auto mb-3">
                  {(!detail.notas || detail.notas.length === 0) && (
                    <p className="text-xs text-slate-400 italic">Sin comentarios aún</p>
                  )}
                  {(detail.notas || []).map((n, i) => (
                    <div key={i} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-2.5 text-xs">
                      <p className="text-slate-700 dark:!text-slate-200 whitespace-pre-wrap">{n.texto}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        <i className="fa-solid fa-user mr-1" />{n.autor} · {new Date(n.fecha).toLocaleString('es-MX')}
                      </p>
                    </div>
                  ))}
                </div>
                {puedeComentar ? (
                  <div className="flex gap-2">
                    <input type="text" value={notaTexto} onChange={e => setNotaTexto(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleNota(); }}
                      disabled={saving}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:!text-slate-100 text-sm focus:ring-2 focus:ring-brand-300 outline-none disabled:opacity-50"
                      placeholder="Escribe un comentario..." />
                    <button onClick={handleNota} disabled={saving}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl transition disabled:opacity-50">
                      <i className="fa-solid fa-paper-plane" />
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No puedes comentar en este ticket (solo mientras esté abierto o si estás asignado).</p>
                )}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">
                  Historial ({detail.historial?.length || 0})
                </p>
                <div className="space-y-3 max-h-52 overflow-y-auto">
                  {(!detail.historial || detail.historial.length === 0) && (
                    <p className="text-xs text-slate-400 italic">Sin historial</p>
                  )}
                  {[...(detail.historial || [])].reverse().map((h, i) => {
                    const ic = HISTORIAL_ICONOS[h.accion] || { icon: 'fa-circle-info', color: 'text-slate-500 bg-slate-100' };
                    return (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className={`w-7 h-7 rounded-full ${ic.color} flex items-center justify-center shrink-0`}>
                          <i className={`fa-solid ${ic.icon} text-[10px]`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-700 dark:!text-slate-200">
                            <span className="font-bold">{h.autor}</span>
                            {h.detalle && <span className="text-slate-500 dark:!text-slate-400"> · {h.detalle}</span>}
                          </p>
                          <p className="text-[10px] text-slate-400">{new Date(h.fecha).toLocaleString('es-MX')}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
