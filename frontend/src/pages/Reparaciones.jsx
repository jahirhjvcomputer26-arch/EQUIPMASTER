import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { useNotify } from '../componentes/Notification';
import { useInventario } from '../context/InventarioContext';
import { TECNICOS } from '../utils/inventario';
import useDocumentTitle from '../utils/useDocumentTitle';
import { SkeletonTable } from '../componentes/Skeleton';

const ESTADOS_REP = ['RECIBIDO', 'DIAGNÓSTICO', 'ESPERANDO PIEZAS', 'EN REPARACIÓN', 'EN PRUEBAS', 'FINALIZADO', 'ENTREGADO', 'CANCELADO'];
const ESTADOS_COLOR = { 'RECIBIDO': 'bg-slate-100 text-slate-700 border-slate-200', 'DIAGNÓSTICO': 'bg-purple-100 text-purple-700 border-purple-200', 'ESPERANDO PIEZAS': 'bg-amber-100 text-amber-700 border-amber-200', 'EN REPARACIÓN': 'bg-orange-100 text-orange-700 border-orange-200', 'EN PRUEBAS': 'bg-cyan-100 text-cyan-700 border-cyan-200', 'FINALIZADO': 'bg-emerald-100 text-emerald-700 border-emerald-200', 'ENTREGADO': 'bg-blue-100 text-blue-700 border-blue-200', 'CANCELADO': 'bg-red-100 text-red-700 border-red-200' };
const ESTADOS_ICON = { 'RECIBIDO': 'fa-inbox', 'DIAGNÓSTICO': 'fa-stethoscope', 'ESPERANDO PIEZAS': 'fa-box-open', 'EN REPARACIÓN': 'fa-screwdriver-wrench', 'EN PRUEBAS': 'fa-vial', 'FINALIZADO': 'fa-circle-check', 'ENTREGADO': 'fa-hand', 'CANCELADO': 'fa-ban' };
const ESTADOS_TRANSICIONES = {
  'RECIBIDO': ['DIAGNÓSTICO', 'CANCELADO'],
  'DIAGNÓSTICO': ['ESPERANDO PIEZAS', 'EN REPARACIÓN', 'FINALIZADO', 'CANCELADO'],
  'ESPERANDO PIEZAS': ['EN REPARACIÓN', 'CANCELADO'],
  'EN REPARACIÓN': ['EN PRUEBAS', 'CANCELADO'],
  'EN PRUEBAS': ['FINALIZADO', 'EN REPARACIÓN', 'CANCELADO'],
  'FINALIZADO': ['ENTREGADO'],
  'ENTREGADO': [],
  'CANCELADO': ['RECIBIDO'],
};

const emptyForm = {
  equipoCodigo: '', equipoMarca: '', equipoModelo: '', equipoSerie: '',
  cliente: '', telefono: '', email: '',
  fechaIngreso: new Date().toISOString().slice(0, 10),
  tecnico: '', estado: 'RECIBIDO',
  problema: '', diagnostico: '',
  repuestos: [],
  costoRepuestos: 0, manoObra: 0, total: 0, anticipo: 0, saldo: 0,
  fechaReparacion: '', fechaEntrega: '', observaciones: '',
};

export default function Reparaciones() {
  useDocumentTitle('Órdenes de Reparación');
  const { notify } = useNotify();
  const { inventario } = useInventario();
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('TODAS');
  const [buscarSerie, setBuscarSerie] = useState('');
  const [buscarCliente, setBuscarCliente] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api.getReparaciones();
      setOrdenes(data);
    } catch (err) {
      notify('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const buscarEquipo = () => {
    const q = buscarSerie.toUpperCase().trim();
    if (!q) return notify('Aviso', 'Ingresa un código o serie para buscar', 'error');
    const eq = inventario.find(i =>
      i.codigo?.toUpperCase() === q || i.serie?.toUpperCase().includes(q)
    );
    if (!eq) return notify('No encontrado', 'No hay equipo con ese código o serie', 'error');
    set('equipoCodigo', eq.codigo);
    set('equipoMarca', eq.marca);
    set('equipoModelo', eq.modelo);
    set('equipoSerie', eq.serie);
    notify('Equipo vinculado', `${eq.codigo} · ${eq.marca} ${eq.modelo}`, 'success');
  };

  const agregarRepuesto = () => {
    setForm(f => ({
      ...f,
      repuestos: [...f.repuestos, { nombre: '', precio: 0, cantidad: 1 }],
    }));
  };

  const actualizarRepuesto = (idx, k, v) => {
    const r = [...form.repuestos];
    r[idx] = { ...r[idx], [k]: v };
    const costoR = r.reduce((s, x) => s + (parseFloat(x.precio) || 0) * (parseInt(x.cantidad) || 1), 0);
    const mo = parseFloat(form.manoObra) || 0;
    const ant = parseFloat(form.anticipo) || 0;
    setForm(f => ({
      ...f, repuestos: r,
      costoRepuestos: costoR,
      total: costoR + mo,
      saldo: costoR + mo - ant,
    }));
  };

  const quitarRepuesto = (idx) => {
    const r = form.repuestos.filter((_, i) => i !== idx);
    const costoR = r.reduce((s, x) => s + (parseFloat(x.precio) || 0) * (parseInt(x.cantidad) || 1), 0);
    const mo = parseFloat(form.manoObra) || 0;
    const ant = parseFloat(form.anticipo) || 0;
    setForm(f => ({
      ...f, repuestos: r,
      costoRepuestos: costoR,
      total: costoR + mo,
      saldo: costoR + mo - ant,
    }));
  };

  const recalcular = (campo) => {
    setForm(f => {
      const costoR = f.repuestos.reduce((s, x) => s + (parseFloat(x.precio) || 0) * (parseInt(x.cantidad) || 1), 0);
      const mo = campo === 'manoObra' ? (parseFloat(f.manoObra) || 0) : (parseFloat(f.manoObra) || 0);
      const ant = campo === 'anticipo' ? (parseFloat(f.anticipo) || 0) : (parseFloat(f.anticipo) || 0);
      return { ...f, costoRepuestos: costoR, total: costoR + mo, saldo: costoR + mo - ant };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.cliente || !form.tecnico || !form.problema) {
      return notify('Campos requeridos', 'Cliente, técnico y problema son obligatorios', 'error');
    }
    const body = {
      ...form,
      equipoCodigo: form.equipoCodigo || 'N/A',
      equipoMarca: form.equipoMarca || 'N/A',
      equipoModelo: form.equipoModelo || 'N/A',
      equipoSerie: form.equipoSerie || 'N/A',
      cliente: form.cliente.toUpperCase().trim(),
      telefono: form.telefono.trim(),
      email: form.email.trim(),
      problema: form.problema.toUpperCase().trim(),
      diagnostico: form.diagnostico.toUpperCase().trim(),
      observaciones: form.observaciones.toUpperCase().trim(),
    };
    try {
      if (editing) {
        await api.updateReparacion(editing, body);
        notify('Actualizada', `Orden ${editing} actualizada`, 'success');
      } else {
        await api.crearReparacion(body);
        notify('Creada', 'Nueva orden de reparación registrada', 'success');
      }
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      load();
    } catch (err) {
      notify('Error', err.message, 'error');
    }
  };

  const editarOrden = (ord) => {
    setForm({
      ...emptyForm,
      ...ord,
      repuestos: ord.repuestos || [],
      fechaIngreso: (ord.fechaIngreso || '').slice(0, 10),
      fechaReparacion: (ord.fechaReparacion || '').slice(0, 10),
      fechaEntrega: (ord.fechaEntrega || '').slice(0, 10),
    });
    setEditing(ord.id);
    setShowForm(true);
  };

  const cancelar = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const cambiarEstado = async (ord, nuevoEstado) => {
    try {
      const body = { estado: nuevoEstado };
      if (nuevoEstado === 'FINALIZADO' && !ord.fechaReparacion) body.fechaReparacion = new Date().toISOString().split('T')[0];
      if (nuevoEstado === 'ENTREGADO' && !ord.fechaEntrega) body.fechaEntrega = new Date().toISOString().split('T')[0];
      if (!ord.historial) body.historial = [];
      else body.historial = [...ord.historial];
      body.historial.push({ fecha: new Date().toISOString(), de: ord.estado, a: nuevoEstado, usuario: '' });
      await api.updateReparacion(ord.id, body);
      notify('Estado actualizado', `${ord.equipoCodigo || ord.cliente}: ${ord.estado} → ${nuevoEstado}`, 'success');
      load();
    } catch (err) {
      notify('Error', err.message, 'error');
    }
  };

  const filtered = useMemo(() => {
    let items = [...ordenes];
    if (filtroEstado !== 'TODAS') items = items.filter(o => o.estado === filtroEstado);
    if (buscarCliente) {
      const q = buscarCliente.toUpperCase();
      items = items.filter(o => (o.cliente || '').toUpperCase().includes(q));
    }
    return items;
  }, [ordenes, filtroEstado, buscarCliente]);

  const activas = ordenes.filter(o => o.estado !== 'FINALIZADO' && o.estado !== 'ENTREGADO' && o.estado !== 'CANCELADO');

  if (loading) return (
    <section className="space-y-6 animate-fade-in">
      <div className="panel p-6"><h2 className="text-xl font-bold">Órdenes de Reparación</h2><p className="text-sm text-slate-500">Cargando órdenes...</p></div>
      <div className="panel overflow-hidden"><SkeletonTable rows={6} cols={5} /></div>
    </section>
  );

  return (
    <section className="space-y-6 animate-fade-in">
      <div className="panel p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-slide-up">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Órdenes de Reparación</h2>
          <p className="text-sm text-slate-500">
            {ordenes.length} ordenes · {activas.length} activas
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button onClick={() => { cancelar(); setShowForm(true); }}
            className="btn-brand px-5 py-2.5 rounded-xl text-white text-sm font-bold flex items-center gap-2">
            <i className="fa-solid fa-plus" /> Nueva Orden
          </button>
        </div>
      </div>

      {!showForm ? (
        <>
          <div className="panel p-4 animate-slide-up" style={{ animationDelay: '50ms' }}>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex gap-2 flex-wrap">
                {['TODAS', ...ESTADOS_REP].map(e => (
                  <button key={e} onClick={() => setFiltroEstado(e)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      filtroEstado === e
                        ? 'bg-brand-500 text-white shadow'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}>{e}</button>
                ))}
              </div>
              <div className="flex-1" />
              <input className="form-input py-2 text-sm w-full sm:w-48" value={buscarCliente} onChange={e => setBuscarCliente(e.target.value)} placeholder="Buscar cliente..." />
            </div>

            {filtered.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                  <i className="fa-solid fa-toolbox text-3xl text-slate-300" />
                </div>
                <p className="text-base font-bold text-slate-500">Sin órdenes</p>
                <p className="text-sm text-slate-400 mt-1">Crea la primera orden de reparación</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm table-responsive">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold uppercase">Orden</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase">Cliente</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase">Equipo</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase">Técnico</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase">Estado</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase">Total</th>
                      <th className="px-4 py-3 text-xs font-bold uppercase text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((ord, idx) => (
                      <tr key={ord.id} className="hover:bg-slate-50 transition-colors table-row-enter" style={{ animationDelay: `${idx * 25}ms` }}>
                        <td className="px-4 py-3 font-mono font-bold text-xs text-brand-600" data-label="Orden">{ord.id}</td>
                        <td className="px-4 py-3" data-label="Cliente">
                          <span className="font-bold">{ord.cliente}</span>
                          {ord.telefono && <p className="text-xs text-slate-400">{ord.telefono}</p>}
                        </td>
                        <td className="px-4 py-3 text-xs" data-label="Equipo">
                          {ord.equipoMarca !== 'N/A' ? (
                            <><span className="font-bold">{ord.equipoMarca} {ord.equipoModelo}</span><p className="text-slate-400 font-mono text-[10px]">{ord.equipoCodigo} · {ord.equipoSerie}</p></>
                          ) : <span className="text-slate-400">Sin equipo</span>}
                        </td>
                        <td className="px-4 py-3 text-xs" data-label="Técnico">{ord.tecnico || <span className="text-slate-400">—</span>}</td>
                        <td className="px-4 py-3" data-label="Estado">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${ESTADOS_COLOR[ord.estado] || 'bg-slate-100'}`}>
                            <i className={`fa-solid ${ESTADOS_ICON[ord.estado] || 'fa-circle'}`} /> {ord.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-bold" data-label="Total">${(parseFloat(ord.total) || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-center" data-label="">
                          <div className="flex items-center gap-1 flex-wrap">
                            <button onClick={() => editarOrden(ord)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-600 transition" title="Editar">
                              <i className="fa-solid fa-pen text-xs" />
                            </button>
                            {(ESTADOS_TRANSICIONES[ord.estado] || []).map(sig => (
                              <button key={sig} onClick={() => cambiarEstado(ord, sig)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition hover:scale-105 ${ESTADOS_COLOR[sig] || 'bg-slate-50 text-slate-500'}`}
                                title={`Cambiar a ${sig}`}>
                                <i className={`fa-solid ${ESTADOS_ICON[sig] || 'fa-arrow-right'} mr-1`} />{sig}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {activas.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
              {activas.slice(0, 6).map(ord => (
                <div key={ord.id} className="panel p-4 flex items-center gap-3 hover:shadow-lg transition">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base ${ESTADOS_COLOR[ord.estado]}`}>
                    <i className={`fa-solid ${ESTADOS_ICON[ord.estado]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-brand-600 font-mono">{ord.id}</p>
                    <p className="font-bold text-sm truncate">{ord.cliente}</p>
                    <p className="text-xs text-slate-400 truncate">{ord.equipoMarca} {ord.equipoModelo}</p>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${ESTADOS_COLOR[ord.estado]}`}>{ord.estado}</span>
                    {ord.historial && ord.historial.length > 0 && (
                      <div className="mt-2 border-t border-slate-100 pt-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Timeline</p>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                          {ord.historial.slice(-5).reverse().map((h, i) => (
                            <div key={i} className="flex items-center gap-2 text-[10px] text-slate-500">
                              <i className="fa-solid fa-circle text-[4px] text-slate-300" />
                              <span className="font-mono">{new Date(h.fecha).toLocaleDateString('es-MX')}</span>
                              <span>{h.de} → <strong>{h.a}</strong></span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <form onSubmit={handleSubmit} onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleSubmit(e); } }} className="panel p-6 md:p-8 space-y-6 animate-fade-in">
          <h3 className="font-display font-bold text-lg text-slate-900">
            {editing ? '✏️ Editar Orden' : '📋 Nueva Orden de Reparación'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="panel p-5 border space-y-4">
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <i className="fa-solid fa-user text-brand-500" /> Datos del Cliente
              </h4>
              <div><label className="form-label">Cliente *</label>
                <input className="form-input uppercase" value={form.cliente} onChange={e => set('cliente', e.target.value)} required placeholder="Nombre del cliente" /></div>
              <div><label className="form-label">Teléfono</label>
                <input className="form-input" value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="662 123 4567" /></div>
              <div><label className="form-label">Email</label>
                <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="cliente@correo.com" /></div>
            </div>

            <div className="panel p-5 border space-y-4">
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <i className="fa-solid fa-laptop text-brand-500" /> Equipo
              </h4>
              <div>
                <label className="form-label">Buscar por código o serie</label>
                <div className="flex gap-2">
                  <input className="form-input uppercase flex-1" value={buscarSerie} onChange={e => setBuscarSerie(e.target.value)} placeholder="INV-123 / S/N..." />
                  <button type="button" onClick={buscarEquipo} className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 rounded-xl text-sm font-bold transition">
                    <i className="fa-solid fa-search" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label text-[10px]">Código</label>
                  <p className="form-input bg-slate-50 text-sm font-mono truncate">{form.equipoCodigo || '—'}</p>
                </div>
                <div>
                  <label className="form-label text-[10px]">Serie</label>
                  <p className="form-input bg-slate-50 text-sm font-mono truncate">{form.equipoSerie || '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label text-[10px]">Marca</label>
                  <p className="form-input bg-slate-50 text-sm truncate">{form.equipoMarca || '—'}</p>
                </div>
                <div>
                  <label className="form-label text-[10px]">Modelo</label>
                  <p className="form-input bg-slate-50 text-sm truncate">{form.equipoModelo || '—'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="panel p-5 border space-y-4">
            <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
              <i className="fa-solid fa-screwdriver-wrench text-brand-500" /> Diagnóstico
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><label className="form-label">Técnico asignado *</label>
                <select className="form-input" value={form.tecnico} onChange={e => set('tecnico', e.target.value)} required>
                  <option value="">Seleccionar...</option>
                  {TECNICOS.map(t => <option key={t} value={t}>{t}</option>)}
                </select></div>
              <div><label className="form-label">Fecha ingreso</label>
                <input type="date" className="form-input" value={form.fechaIngreso} onChange={e => set('fechaIngreso', e.target.value)} /></div>
            </div>
            <div><label className="form-label">Problema reportado *</label>
              <textarea className="form-input uppercase min-h-[60px]" value={form.problema} onChange={e => set('problema', e.target.value)} required placeholder="Ej: NO ENCIENDE, PANTALLA ROTA..." /></div>
            <div><label className="form-label">Diagnóstico técnico</label>
              <textarea className="form-input uppercase min-h-[60px]" value={form.diagnostico} onChange={e => set('diagnostico', e.target.value)} placeholder="Ej: FUENTE DE PODER DAÑADA" /></div>
          </div>

          <div className="panel p-5 border space-y-4">
            <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
              <i className="fa-solid fa-receipt text-brand-500" /> Costos y Repuestos
            </h4>
            {form.repuestos.map((r, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-3 items-end bg-slate-50 rounded-xl p-3">
                <div className="flex-1"><label className="form-label text-[10px]">Repuesto</label>
                  <input className="form-input uppercase text-sm py-2" value={r.nombre} onChange={e => actualizarRepuesto(idx, 'nombre', e.target.value)} placeholder="FUENTE 65W" /></div>
                <div className="w-full sm:w-24"><label className="form-label text-[10px]">Precio</label>
                  <input type="number" className="form-input text-sm py-2" value={r.precio} onChange={e => actualizarRepuesto(idx, 'precio', parseInt(e.target.value) || 0)} /></div>
                <div className="w-full sm:w-20"><label className="form-label text-[10px]">Cant.</label>
                  <input type="number" min="1" className="form-input text-sm py-2" value={r.cantidad} onChange={e => actualizarRepuesto(idx, 'cantidad', parseInt(e.target.value) || 1)} /></div>
                <button type="button" onClick={() => quitarRepuesto(idx)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"><i className="fa-solid fa-trash-can" /></button>
              </div>
            ))}
            <button type="button" onClick={agregarRepuesto}
              className="text-sm text-brand-600 font-bold hover:underline flex items-center gap-1">
              <i className="fa-solid fa-plus-circle" /> Agregar repuesto
            </button>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
              <div><label className="form-label">Costo repuestos</label>
                <p className="form-input bg-slate-50 font-bold">${(form.costoRepuestos || 0).toLocaleString()}</p></div>
              <div><label className="form-label">Mano de obra</label>
                <input type="number" className="form-input font-bold" value={form.manoObra} onChange={e => { set('manoObra', parseInt(e.target.value) || 0); recalcular('manoObra'); }} /></div>
              <div><label className="form-label">Anticipo</label>
                <input type="number" className="form-input font-bold" value={form.anticipo} onChange={e => { set('anticipo', parseInt(e.target.value) || 0); recalcular('anticipo'); }} /></div>
              <div><label className="form-label">Saldo pendiente</label>
                <p className={`form-input font-bold ${form.saldo > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  ${(form.saldo || 0).toLocaleString()}</p></div>
            </div>
          </div>

          <div className="panel p-5 border space-y-4">
            <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
              <i className="fa-solid fa-note-sticky text-brand-500" /> Información adicional
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="form-label">Estado *</label>
                <select className="form-input font-bold" value={form.estado} onChange={e => set('estado', e.target.value)}>
                  {ESTADOS_REP.map(e => <option key={e} value={e}>{e}</option>)}
                </select></div>
              <div><label className="form-label">Fecha reparación</label>
                <input type="date" className="form-input" value={form.fechaReparacion} onChange={e => set('fechaReparacion', e.target.value)} /></div>
              <div><label className="form-label">Fecha entrega</label>
                <input type="date" className="form-input" value={form.fechaEntrega} onChange={e => set('fechaEntrega', e.target.value)} /></div>
            </div>
            <div><label className="form-label">Observaciones</label>
              <textarea className="form-input uppercase min-h-[60px]" value={form.observaciones} onChange={e => set('observaciones', e.target.value)} placeholder="Notas adicionales..." /></div>
          </div>

          <div className="flex justify-between pt-2">
            <button type="button" onClick={cancelar}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-600">Cancelar</button>
            <button type="submit" className="btn-brand px-6 py-2.5 rounded-xl text-white text-sm font-bold">
              <i className={`fa-solid ${editing ? 'fa-floppy-disk' : 'fa-plus'} mr-1`} />
              {editing ? 'Guardar Cambios' : 'Crear Orden'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
