import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../componentes/Notification';
import useDocumentTitle from '../utils/useDocumentTitle';

const ESTADOS = [
  { key: 'abierto', label: 'Abierto', color: 'amber', icon: 'fa-circle-dot', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', dot: 'bg-amber-400' },
  { key: 'en_proceso', label: 'En proceso', color: 'blue', icon: 'fa-spinner', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', dot: 'bg-blue-400' },
  { key: 'resuelto', label: 'Resuelto', color: 'emerald', icon: 'fa-circle-check', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', dot: 'bg-emerald-400' },
  { key: 'cerrado', label: 'Cerrado', color: 'slate', icon: 'fa-circle-xmark', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-500', dot: 'bg-slate-400' },
];

const PRIORIDADES = {
  alta: { label: 'Alta', color: 'text-red-600 bg-red-50 border-red-200', icon: 'fa-arrow-up' },
  media: { label: 'Media', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: 'fa-minus' },
  baja: { label: 'Baja', color: 'text-slate-500 bg-slate-50 border-slate-200', icon: 'fa-arrow-down' },
};

const EMPTY_TICKET = { asunto: '', descripcion: '', prioridad: 'media' };

function TiempoRelativo({ fecha }) {
  if (!fecha) return null;
  const diff = Date.now() - new Date(fecha).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return <span>ahora</span>;
  if (mins < 60) return <span>{mins}m</span>;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return <span>{hrs}h</span>;
  const dias = Math.floor(hrs / 24);
  return <span>{dias}d</span>;
}

export default function Tickets() {
  useDocumentTitle('Tickets de Soporte');
  const { user } = useAuth();
  const { notify } = useNotify();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [form, setForm] = useState(EMPTY_TICKET);
  const [editando, setEditando] = useState(false);
  const [filtro, setFiltro] = useState({ prioridad: '', q: '' });
  const [notaTexto, setNotaTexto] = useState('');
  const [saving, setSaving] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const params = {};
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

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!form.asunto.trim()) return notify('El asunto es obligatorio', '', 'error');
    setSaving(true);
    try {
      if (editando) {
        await api.actualizarTicket(detailModal.id, form);
        notify('Ticket actualizado', '', 'success');
      } else {
        await api.crearTicket(form);
        notify('Ticket creado', '', 'success');
      }
      setModalOpen(false);
      setDetailModal(null);
      setForm(EMPTY_TICKET);
      setEditando(false);
      cargar();
    } catch (err) {
      notify(err.message, '', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCambiarEstado = async (ticket, nuevoEstado) => {
    try {
      await api.actualizarTicket(ticket.id, { estado: nuevoEstado });
      notify(`Ticket → ${ESTADOS.find(e => e.key === nuevoEstado)?.label}`, '', 'success');
      cargar();
      if (detailModal?.id === ticket.id) {
        setDetailModal({ ...ticket, estado: nuevoEstado });
      }
    } catch (err) {
      notify(err.message, '', 'error');
    }
  };

  const handleAsignar = async (ticket, tecnico) => {
    try {
      await api.actualizarTicket(ticket.id, { tecnicoAsignado: tecnico });
      notify(tecnico ? `Asignado a ${tecnico}` : 'Sin asignar', '', 'success');
      cargar();
    } catch (err) {
      notify(err.message, '', 'error');
    }
  };

  const handleNota = async () => {
    if (!notaTexto.trim() || !detailModal) return;
    try {
      await api.agregarNotaTicket(detailModal.id, notaTexto);
      setNotaTexto('');
      notify('Nota agregada', '', 'success');
      const updated = await api.getTickets({ q: detailModal.id });
      const t = updated.find(t => t.id === detailModal.id);
      if (t) setDetailModal(t);
      else cargar();
    } catch (err) {
      notify(err.message, '', 'error');
    }
  };

  const handleEliminar = async (ticket) => {
    if (!confirm(`Eliminar ticket ${ticket.id}?`)) return;
    try {
      await api.eliminarTicket(ticket.id);
      notify('Ticket eliminado', '', 'success');
      setDetailModal(null);
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

  const openEditar = (ticket) => {
    setForm({ asunto: ticket.asunto, descripcion: ticket.descripcion || '', prioridad: ticket.prioridad });
    setEditando(true);
    setDetailModal(ticket);
    setModalOpen(true);
  };

  const agrupados = {};
  ESTADOS.forEach(e => { agrupados[e.key] = []; });
  tickets.forEach(t => { if (agrupados[t.estado]) agrupados[t.estado].push(t); });

  const stats = {
    total: tickets.length,
    abiertos: agrupados.abierto?.length || 0,
    proceso: agrupados.en_proceso?.length || 0,
    resueltos: agrupados.resuelto?.length || 0,
    cerrados: agrupados.cerrado?.length || 0,
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
            <i className="fa-solid fa-ticket text-brand-500" /> Tickets de Soporte
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">{stats.total} tickets · {stats.abiertos} abiertos · {stats.proceso} en proceso</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="text" placeholder="Buscar..." value={filtro.q} onChange={e => setFiltro(f => ({ ...f, q: e.target.value }))}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm w-40 focus:ring-2 focus:ring-brand-300 focus:border-brand-300 outline-none" />
          <select value={filtro.prioridad} onChange={e => setFiltro(f => ({ ...f, prioridad: e.target.value }))}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-300 focus:border-brand-300 outline-none">
            <option value="">Todas</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
          <button onClick={openCrear}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl shadow transition flex items-center gap-2">
            <i className="fa-solid fa-plus" /> Nuevo Ticket
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {ESTADOS.map(estado => (
          <div key={estado.key} className={`${estado.bg} rounded-2xl border ${estado.border} overflow-hidden`}>
            <div className={`px-4 py-3 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${estado.dot}`} />
                <h3 className={`text-sm font-bold ${estado.text}`}>{estado.label}</h3>
              </div>
              <span className={`text-xs font-bold ${estado.text} bg-white/60 px-2 py-0.5 rounded-full`}>
                {agrupados[estado.key]?.length || 0}
              </span>
            </div>
            <div className="px-3 pb-3 space-y-2 max-h-[60vh] overflow-y-auto">
              {(agrupados[estado.key] || []).length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6 italic">Sin tickets</p>
              )}
              {(agrupados[estado.key] || []).map(ticket => (
                <div key={ticket.id}
                  onClick={() => setDetailModal(ticket)}
                  className="bg-white rounded-xl p-3 border border-slate-100 hover:border-slate-200 hover:shadow-sm transition cursor-pointer space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400">{ticket.id}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${PRIORIDADES[ticket.prioridad]?.color}`}>
                      {PRIORIDADES[ticket.prioridad]?.label}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 line-clamp-2">{ticket.asunto}</p>
                  {ticket.descripcion && (
                    <p className="text-xs text-slate-400 line-clamp-2">{ticket.descripcion}</p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center">
                        <span className="text-[8px] font-bold text-brand-600">
                          {(ticket.creadoPor || '?')[0].toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">{ticket.creadoPor}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      {ticket.tecnicoAsignado && (
                        <span className="text-blue-500 font-bold mr-1">
                          <i className="fa-solid fa-user-check mr-0.5" />{ticket.tecnicoAsignado}
                        </span>
                      )}
                      <TiempoRelativo fecha={ticket.modificadoEn || ticket.creadoEn} />
                    </div>
                  </div>
                  {ticket.notas?.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <i className="fa-solid fa-comment-dots" /> {ticket.notas.length}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">
                <i className={`fa-solid ${editando ? 'fa-pen' : 'fa-plus'} text-brand-500 mr-2`} />
                {editando ? 'Editar Ticket' : 'Nuevo Ticket'}
              </h3>
              <button onClick={() => { setModalOpen(false); setEditando(false); }} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>
            <form onSubmit={handleCrear} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Asunto *</label>
                <input type="text" value={form.asunto} onChange={e => setForm(f => ({ ...f, asunto: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-300 focus:border-brand-300 outline-none"
                  placeholder="Ej: No enciende laptop Dell..." autoFocus />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Descripción</label>
                <textarea rows={3} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-300 focus:border-brand-300 outline-none resize-none"
                  placeholder="Detalles del problema..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Prioridad</label>
                <div className="flex gap-2">
                  {Object.entries(PRIORIDADES).map(([key, p]) => (
                    <button key={key} type="button" onClick={() => setForm(f => ({ ...f, prioridad: key }))}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition ${
                        form.prioridad === key ? `${p.color} border-current` : 'border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}>
                      <i className={`fa-solid ${p.icon} mr-1`} />{p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setModalOpen(false); setEditando(false); }}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition">
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

      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDetailModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className={`px-6 py-4 border-b border-slate-100 flex items-start justify-between`}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-slate-400">{detailModal.id}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIORIDADES[detailModal.prioridad]?.color}`}>
                    {PRIORIDADES[detailModal.prioridad]?.label}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ESTADOS.find(e => e.key === detailModal.estado)?.text} ${ESTADOS.find(e => e.key === detailModal.estado)?.border} ${ESTADOS.find(e => e.key === detailModal.estado)?.bg}`}>
                    {ESTADOS.find(e => e.key === detailModal.estado)?.label}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-800">{detailModal.asunto}</h3>
                {detailModal.descripcion && (
                  <p className="text-sm text-slate-500 mt-1 whitespace-pre-wrap">{detailModal.descripcion}</p>
                )}
              </div>
              <button onClick={() => setDetailModal(null)} className="text-slate-400 hover:text-slate-600 ml-4 shrink-0">
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Estado</label>
                  <select value={detailModal.estado} onChange={e => handleCambiarEstado(detailModal, e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-300 outline-none">
                    {ESTADOS.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Asignar a</label>
                  <input type="text" value={detailModal.tecnicoAsignado || ''} onChange={e => handleAsignar(detailModal, e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-300 outline-none"
                    placeholder="Nombre del técnico..." />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Notas internas</label>
                <textarea rows={2} value={detailModal.notasInternas || ''} onChange={e => setDetailModal(d => ({ ...d, notasInternas: e.target.value }))}
                  onBlur={async () => { try { await api.actualizarTicket(detailModal.id, { notasInternas: detailModal.notasInternas }); } catch {} }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-300 outline-none resize-none"
                  placeholder="Notas privadas..." />
              </div>

              <div className="border-t border-slate-100 pt-4">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
                  Historial ({detailModal.notas?.length || 0})
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                  {(!detailModal.notas || detailModal.notas.length === 0) && (
                    <p className="text-xs text-slate-400 italic">Sin notas aún</p>
                  )}
                  {(detailModal.notas || []).map((n, i) => (
                    <div key={i} className="bg-slate-50 rounded-lg p-2.5 text-xs">
                      <p className="text-slate-700 whitespace-pre-wrap">{n.texto}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        <i className="fa-solid fa-user mr-1" />{n.autor} · {new Date(n.fecha).toLocaleString('es-MX')}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={notaTexto} onChange={e => setNotaTexto(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleNota(); }}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-300 outline-none"
                    placeholder="Escribe una nota..." />
                  <button onClick={handleNota}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl transition">
                    <i className="fa-solid fa-paper-plane" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="text-[10px] text-slate-400">
                  Creado por <span className="font-bold">{detailModal.creadoPor}</span> · {new Date(detailModal.creadoEn).toLocaleString('es-MX')}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditar(detailModal)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition">
                    <i className="fa-solid fa-pen mr-1" />Editar
                  </button>
                  <button onClick={() => handleEliminar(detailModal)}
                    className="px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition">
                    <i className="fa-solid fa-trash mr-1" />Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
