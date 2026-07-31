import { useState } from 'react';
import { useInventario } from '../context/InventarioContext';
import { useNotify } from '../componentes/Notification';
import { api } from '../services/api';
import { nombreEquipo, normalizarSerie, TECNICOS } from '../utils/inventario';
import ConfirmModal from '../componentes/ConfirmModal';
import useDocumentTitle from '../utils/useDocumentTitle';

export const CATEGORIAS_REP = [
  { key: 'Pantallas', icon: 'fa-display', grad: 'from-sky-500 to-blue-600' },
  { key: 'Baterías', icon: 'fa-battery-three-quarters', grad: 'from-amber-500 to-orange-600' },
  { key: 'Teclados', icon: 'fa-keyboard', grad: 'from-slate-600 to-slate-800' },
  { key: 'Almacenamiento (SSD/HDD)', icon: 'fa-hard-drive', grad: 'from-cyan-500 to-teal-600' },
  { key: 'Memoria RAM', icon: 'fa-memory', grad: 'from-violet-500 to-purple-600' },
  { key: 'Motherboard', icon: 'fa-microchip', grad: 'from-rose-500 to-pink-600' },
  { key: 'Sistema de enfriamiento', icon: 'fa-fan', grad: 'from-emerald-500 to-green-600' },
  { key: 'Puertos (USB, HDMI, Type-C, etc.)', icon: 'fa-plug-circle-bolt', grad: 'from-blue-500 to-indigo-600' },
  { key: 'Cámara / Audio', icon: 'fa-camera', grad: 'from-fuchsia-500 to-pink-600' },
  { key: 'Carcasa y bisagras', icon: 'fa-arrows-spin', grad: 'from-stone-500 to-zinc-700' },
  { key: 'Software', icon: 'fa-window-restore', grad: 'from-lime-500 to-green-600' },
  { key: 'Otros', icon: 'fa-boxes-stacked', grad: 'from-slate-400 to-slate-600' },
];

export const PRIORIDADES_REP = ['Alta', 'Media', 'Baja'];

const PRIORIDAD_STYLE = {
  Alta: 'bg-red-50 text-red-700 border-red-200',
  Media: 'bg-amber-50 text-amber-700 border-amber-200',
  Baja: 'bg-sky-50 text-sky-700 border-sky-200',
};

const PRIORIDAD_ICON = { Alta: 'fa-angles-up', Media: 'fa-equals', Baja: 'fa-angles-down' };

export const ESTADOS_REP = ['Pendiente', 'En proceso', 'Esperando refacción', 'Finalizada'];

const ESTADO_REP_STYLE = {
  Pendiente: 'bg-red-100 text-red-700 border-red-200',
  'En proceso': 'bg-amber-100 text-amber-700 border-amber-200',
  'Esperando refacción': 'bg-orange-100 text-orange-700 border-orange-200',
  Finalizada: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const ESTADOS_ACTIVOS = ESTADOS_REP.filter(e => e !== 'Finalizada');

function fmtFecha(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function esVendido(item) {
  return item.flujoSalida || item.flujoVentaML || item.estado?.includes('🔴 VENDIDO');
}

export default function CentroReparaciones() {
  useDocumentTitle('Centro de Reparaciones');
  const { inventario } = useInventario();
  const { notify } = useNotify();

  const [categoria, setCategoria] = useState(null);
  const [modal, setModal] = useState(null); // { modo: 'nuevo' } | { modo: 'editar', item }
  const [query, setQuery] = useState('');
  const [seleccionado, setSeleccionado] = useState(null);
  const [form, setForm] = useState({ categoria: '', prioridad: 'Media', falla: '', tecnico: TECNICOS[0], estado: 'Pendiente', fecha: new Date().toISOString().split('T')[0] });
  const [guardando, setGuardando] = useState(false);
  const [finItem, setFinItem] = useState(null);

  const reparaciones = inventario.filter(i => i.reparacion && i.reparacion.estado !== 'Finalizada');
  const porCategoria = key => reparaciones.filter(i => i.reparacion.categoria === key);
  const disponibles = inventario.filter(i =>
    !esVendido(i) && (!i.reparacion || i.reparacion.estado === 'Finalizada'));

  const resultados = query.trim()
    ? disponibles.filter(i => {
        const q = query.trim().toLowerCase();
        const norm = normalizarSerie(query.trim());
        return i.codigo?.toLowerCase().includes(q)
          || normalizarSerie(i.serie)?.includes(norm)
          || i.marca?.toLowerCase().includes(q)
          || i.modelo?.toLowerCase().includes(q);
      })
    : [];

  const abrirNuevo = () => {
    setSeleccionado(null);
    setQuery('');
    setForm({ categoria: '', prioridad: 'Media', falla: '', tecnico: TECNICOS[0], estado: 'Pendiente', fecha: new Date().toISOString().split('T')[0] });
    setModal({ modo: 'nuevo' });
  };

  const abrirEditar = (item) => {
    setSeleccionado(item);
    setQuery('');
    setForm({
      categoria: item.reparacion.categoria || '',
      prioridad: item.reparacion.prioridad || 'Media',
      falla: item.reparacion.falla || '',
      tecnico: item.reparacion.tecnico || TECNICOS[0],
      estado: item.reparacion.estado || 'Pendiente',
      fecha: (item.reparacion.fecha || new Date().toISOString()).split('T')[0],
    });
    setModal({ modo: 'editar', item });
  };

  const cerrarModal = () => { if (!guardando) setModal(null); };

  const guardar = async () => {
    if (!seleccionado) return;
    if (!form.categoria) { notify('Falta categoría', 'Selecciona la categoría de la reparación.', 'error'); return; }
    if (!form.falla.trim()) { notify('Falta falla', 'Describe la falla detectada.', 'error'); return; }
    setGuardando(true);
    try {
      const esNuevo = modal?.modo === 'nuevo';
      const prev = esNuevo ? seleccionado.reparacion || {} : seleccionado.reparacion;
      const enInventarioOK = seleccionado.estado === '🔵 OK' || seleccionado.estado === '🟢 FULL (ML)';
      const payload = {
        ...seleccionado,
        reparacion: {
          ...prev,
          categoria: form.categoria,
          prioridad: form.prioridad,
          falla: form.falla.trim().toUpperCase(),
          tecnico: form.tecnico,
          estado: form.estado,
          fecha: esNuevo ? new Date(`${form.fecha}T12:00:00`).toISOString() : (prev.fecha || new Date().toISOString()),
          fechaFin: prev.fechaFin || null,
        },
        estado: esNuevo && enInventarioOK ? '🟠 Revisión' : seleccionado.estado,
      };
      await api.saveEquipo(seleccionado.codigo, payload);
      notify(esNuevo ? 'Reparación iniciada' : 'Reparación actualizada',
        `${nombreEquipo(seleccionado.marca, seleccionado.modelo)} → ${form.categoria}`, 'success');
      setModal(null);
      if (esNuevo && !form.categoria) setCategoria(null);
    } catch (err) {
      notify('Error', err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstadoRep = async (item, estado) => {
    try {
      await api.saveEquipo(item.codigo, {
        ...item,
        reparacion: { ...item.reparacion, estado },
      });
      notify('Estado actualizado', `${item.codigo} → ${estado}`, 'success');
    } catch (err) {
      notify('Error', err.message, 'error');
    }
  };

  const finalizar = async () => {
    const item = finItem;
    setFinItem(null);
    try {
      await api.saveEquipo(item.codigo, {
        ...item,
        estado: '🔵 OK',
        reparacion: { ...item.reparacion, estado: 'Finalizada', fechaFin: new Date().toISOString() },
      });
      notify('Reparación finalizada', `${item.codigo} vuelve al inventario como 🔵 OK.`, 'success');
    } catch (err) {
      notify('Error', err.message, 'error');
    }
  };

  const CardEquipo = ({ item }) => (
    <div className="panel p-4 animate-slide-up">
      <div className="flex gap-4">
        {item.fotos?.frente ? (
          <img src={item.fotos.frente} alt={item.codigo} className="w-24 h-24 object-cover rounded-xl border border-slate-200 shrink-0" />
        ) : (
          <div className="w-24 h-24 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
            <i className="fa-solid fa-image text-2xl" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900 leading-tight">{nombreEquipo(item.marca, item.modelo)}</p>
          <p className="text-xs text-slate-400 font-mono mt-0.5">{item.codigo} · S/N {item.serie || '—'}</p>
          <p className="text-xs text-slate-500 mt-1 truncate">{item.procesador}{item.ram ? ` · ${item.ram}` : ''}{item.almacenamiento ? ` · ${item.almacenamiento}` : ''}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIORIDAD_STYLE[item.reparacion.prioridad] || PRIORIDAD_STYLE.Media}`}>
              <i className={`fa-solid ${PRIORIDAD_ICON[item.reparacion.prioridad] || 'fa-equals'} mr-1`} />{item.reparacion.prioridad}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ESTADO_REP_STYLE[item.reparacion.estado] || ''}`}>{item.reparacion.estado}</span>
          </div>
        </div>
      </div>
      <div className="mt-3 bg-rose-50/70 border border-rose-100 rounded-lg p-2.5 text-xs text-rose-900">
        <span className="font-bold uppercase text-[10px] text-rose-500 block mb-0.5">Falla detectada</span>
        {item.reparacion.falla || '—'}
      </div>
      <div className="flex items-center justify-between gap-3 mt-3">
        <div className="text-[11px] text-slate-500 min-w-0">
          <p><i className="fa-solid fa-user-gear w-4 text-slate-400" /> {item.reparacion.tecnico || '—'}</p>
          <p className="mt-0.5"><i className="fa-solid fa-calendar-plus w-4 text-slate-400" /> Ingreso: {fmtFecha(item.reparacion.fecha)}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={item.reparacion.estado}
            onChange={e => cambiarEstadoRep(item, e.target.value)}
            className="form-input !py-1.5 !px-2 text-xs"
          >
            {ESTADOS_ACTIVOS.map(e => <option key={e}>{e}</option>)}
          </select>
          <button onClick={() => abrirEditar(item)} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition" title="Editar reparación">
            <i className="fa-solid fa-pen text-sm" />
          </button>
          <button onClick={() => setFinItem(item)} className="p-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition" title="Marcar como Finalizada">
            <i className="fa-solid fa-check text-sm" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <section className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Centro de Reparaciones</h2>
          <p className="text-slate-500 text-sm">Equipos del inventario en reparación o mantenimiento, organizados por categoría de falla</p>
        </div>
        <button onClick={abrirNuevo} className="btn-brand px-5 py-3 rounded-xl text-sm font-bold">
          <i className="fa-solid fa-plus mr-1" /> Registrar reparación
        </button>
      </div>

      {!categoria ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="panel p-4">
              <p className="text-3xl font-bold text-slate-900">{reparaciones.length}</p>
              <p className="text-xs text-slate-500 font-bold uppercase mt-1">En taller</p>
            </div>
            <div className="panel p-4">
              <p className="text-3xl font-bold text-red-600">{reparaciones.filter(i => i.reparacion.prioridad === 'Alta').length}</p>
              <p className="text-xs text-slate-500 font-bold uppercase mt-1">Prioridad alta</p>
            </div>
            <div className="panel p-4">
              <p className="text-3xl font-bold text-amber-600">{reparaciones.filter(i => i.reparacion.estado === 'En proceso').length}</p>
              <p className="text-xs text-slate-500 font-bold uppercase mt-1">En proceso</p>
            </div>
            <div className="panel p-4">
              <p className="text-3xl font-bold text-orange-600">{reparaciones.filter(i => i.reparacion.estado === 'Esperando refacción').length}</p>
              <p className="text-xs text-slate-500 font-bold uppercase mt-1">Esperando refacción</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {CATEGORIAS_REP.map(cat => {
              const n = porCategoria(cat.key).length;
              return (
                <button key={cat.key} onClick={() => setCategoria(cat.key)} className="panel p-4 text-left hover:scale-[1.02] transition-transform animate-slide-up">
                  <div className="flex items-center justify-between">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cat.grad} flex items-center justify-center text-white shadow-md`}>
                      <i className={`fa-solid ${cat.icon} text-lg`} />
                    </div>
                    {n > 0 && <span className="text-xs font-bold text-slate-600 bg-slate-100 rounded-full px-2.5 py-1">{n}</span>}
                  </div>
                  <p className="font-semibold text-slate-800 text-sm mt-3 leading-snug">{cat.key}</p>
                  <p className="text-xs text-slate-400 mt-1">{n} equipo{n !== 1 ? 's' : ''}</p>
                </button>
              );
            })}
          </div>

          {reparaciones.length === 0 && (
            <div className="panel p-12 text-center text-slate-400">
              <i className="fa-solid fa-screwdriver-wrench text-4xl mb-3" />
              <p className="text-sm font-semibold">No hay equipos en el centro de reparaciones</p>
              <p className="text-xs mt-1">Registra una reparación para un equipo del inventario.</p>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <button onClick={() => setCategoria(null)} className="p-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 transition" title="Volver">
              <i className="fa-solid fa-arrow-left" />
            </button>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-lg">{categoria}</h3>
              <p className="text-xs text-slate-500">{porCategoria(categoria).length} equipo{porCategoria(categoria).length !== 1 ? 's' : ''} en esta categoría</p>
            </div>
          </div>
          {porCategoria(categoria).length === 0 ? (
            <div className="panel p-12 text-center text-slate-400">
              <i className="fa-solid fa-box-open text-4xl mb-3" />
              <p className="text-sm">Sin equipos pendientes en esta categoría.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {porCategoria(categoria).map(item => <CardEquipo key={item.codigo} item={item} />)}
            </div>
          )}
        </>
      )}

      {modal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={cerrarModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 animate-in zoom-in-95 slide-in-from-bottom-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-lg">
                {modal.modo === 'editar' ? 'Editar reparación' : 'Registrar reparación'}
              </h3>
              <button onClick={cerrarModal} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {modal.modo === 'nuevo' && !seleccionado && (
              <div>
                <label className="form-label">Buscar equipo del inventario</label>
                <input
                  className="form-input uppercase"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Código, serie, marca o modelo..."
                  autoFocus
                />
                <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
                  {resultados.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">
                      {query.trim() ? 'Sin coincidencias. Solo se muestran equipos sin reparación activa.' : 'Escribe para buscar.'}
                    </p>
                  ) : resultados.map(r => (
                    <button
                      key={r.codigo}
                      onClick={() => {
                        setSeleccionado(r);
                        setForm(f => ({ ...f, tecnico: TECNICOS[0] }));
                      }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 hover:border-brand-400 hover:bg-brand-50 transition text-left"
                    >
                      {r.fotos?.frente ? (
                        <img src={r.fotos.frente} alt="" className="w-12 h-12 object-cover rounded-lg" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400"><i className="fa-solid fa-laptop" /></div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{nombreEquipo(r.marca, r.modelo)}</p>
                        <p className="text-xs text-slate-400 font-mono">{r.codigo} · {r.serie || 'sin serie'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {seleccionado && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
                  {seleccionado.fotos?.frente ? (
                    <img src={seleccionado.fotos.frente} alt="" className="w-14 h-14 object-cover rounded-lg" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400"><i className="fa-solid fa-laptop" /></div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 text-sm">{nombreEquipo(seleccionado.marca, seleccionado.modelo)}</p>
                    <p className="text-xs text-slate-400 font-mono">{seleccionado.codigo} · {seleccionado.serie || 'sin serie'}</p>
                  </div>
                  {modal.modo === 'nuevo' && (
                    <button onClick={() => setSeleccionado(null)} className="text-xs text-brand-600 font-bold hover:underline">Cambiar</button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Categoría de falla *</label>
                    <select className="form-input" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                      <option value="">Selecciona...</option>
                      {CATEGORIAS_REP.map(c => <option key={c.key} value={c.key}>{c.key}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Prioridad</label>
                    <select className="form-input" value={form.prioridad} onChange={e => setForm({ ...form, prioridad: e.target.value })}>
                      {PRIORIDADES_REP.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Técnico</label>
                    <select className="form-input" value={form.tecnico} onChange={e => setForm({ ...form, tecnico: e.target.value })}>
                      {TECNICOS.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Estado</label>
                    <select className="form-input" value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
                      {ESTADOS_REP.map(e => <option key={e}>{e}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label">Falla detectada *</label>
                  <textarea className="form-input" rows={3} value={form.falla} onChange={e => setForm({ ...form, falla: e.target.value })} placeholder="Describe la falla, daños o mantenimiento requerido..." />
                </div>
                <div>
                  <label className="form-label">Fecha de ingreso</label>
                  <input type="date" className="form-input" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} />
                </div>

                <div className="flex gap-3 justify-end pt-1">
                  <button onClick={cerrarModal} className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
                    Cancelar
                  </button>
                  <button onClick={guardar} disabled={guardando} className="btn-brand px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50">
                    <i className={`fa-solid ${guardando ? 'fa-spinner fa-spin' : 'fa-save'} mr-1`} />
                    {guardando ? 'Guardando...' : modal.modo === 'editar' ? 'Guardar cambios' : 'Iniciar reparación'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!finItem}
        title="Finalizar reparación"
        message={`¿Marcar como finalizada ${finItem ? nombreEquipo(finItem.marca, finItem.modelo) : ''}? El equipo volverá al inventario como 🔵 OK, listo para venta o entrega.`}
        confirmLabel="Sí, finalizar"
        onConfirm={finalizar}
        onCancel={() => setFinItem(null)}
      />
    </section>
  );
}
