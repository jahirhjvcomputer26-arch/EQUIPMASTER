import { useEffect, useRef, useState } from 'react';
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

const emptyForm = () => ({
  marca: '', modelo: '', serie: '',
  categoria: '', prioridad: 'Media', falla: '', tecnico: TECNICOS[0],
  estado: 'Pendiente', fecha: new Date().toISOString().split('T')[0],
});

export default function CentroReparaciones() {
  useDocumentTitle('Centro de Reparaciones');
  const { inventario } = useInventario();
  const { notify } = useNotify();

  const [manuales, setManuales] = useState([]);
  const [cargandoManuales, setCargandoManuales] = useState(true);
  const [categoria, setCategoria] = useState(null);
  const [showFinalizadas, setShowFinalizadas] = useState(false);

  const [modal, setModal] = useState(null);
  const [pestana, setPestana] = useState('inv');
  const [query, setQuery] = useState('');
  const [seleccionado, setSeleccionado] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [guardando, setGuardando] = useState(false);

  const [finItem, setFinItem] = useState(null);
  const [delItem, setDelItem] = useState(null);
  const [importando, setImportando] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.getCentroReparaciones().then(d => { setManuales(d); setCargandoManuales(false); })
      .catch(() => setCargandoManuales(false));
  }, []);

  const recargarManuales = () => api.getCentroReparaciones().then(setManuales);

  const manualesNorm = manuales.map(m => ({
    key: `m-${m.id}`,
    origen: 'manual',
    ref: m,
    nombre: `${m.marca} ${m.modelo}`.trim(),
    codigo: m.id,
    serie: m.serie,
    foto: null,
    categoria: m.categoria,
    prioridad: m.prioridad,
    estado: m.estado,
    falla: m.falla,
    tecnico: m.tecnico,
    fecha: m.fecha,
    specs: '',
  }));

  const invNorm = inventario.filter(i => i.reparacion).map(i => ({
    key: `i-${i.codigo}`,
    origen: 'inv',
    ref: i,
    nombre: nombreEquipo(i.marca, i.modelo),
    codigo: i.codigo,
    serie: i.serie,
    foto: i.fotos?.frente,
    categoria: i.reparacion.categoria,
    prioridad: i.reparacion.prioridad,
    estado: i.reparacion.estado,
    falla: i.reparacion.falla,
    tecnico: i.reparacion.tecnico,
    fecha: i.reparacion.fecha,
    specs: [i.procesador, i.ram, i.almacenamiento].filter(Boolean).join(' · '),
  }));

  const todos = [...manualesNorm, ...invNorm];
  const activos = todos.filter(r => r.estado !== 'Finalizada');
  const finalizadas = todos.filter(r => r.estado === 'Finalizada');
  const mostrar = showFinalizadas ? todos : activos;

  const porCategoria = key => activos.filter(r => r.categoria === key);

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
    setPestana('inv');
    setSeleccionado(null);
    setQuery('');
    setForm(emptyForm());
    setModal({ modo: 'nuevo' });
  };

  const abrirManual = () => {
    setPestana('manual');
    setSeleccionado(null);
    setQuery('');
    setForm(emptyForm());
    setModal({ modo: 'nuevo' });
  };

  const abrirEditar = (record) => {
    if (record.origen === 'manual') {
      setPestana('manual');
      setSeleccionado(null);
      setForm({
        marca: record.ref.marca || '', modelo: record.ref.modelo || '', serie: record.ref.serie || '',
        categoria: record.ref.categoria || '', prioridad: record.ref.prioridad || 'Media',
        falla: record.ref.falla || '', tecnico: record.ref.tecnico || TECNICOS[0],
        estado: record.ref.estado || 'Pendiente',
        fecha: (record.ref.fecha || new Date().toISOString()).split('T')[0],
      });
      setModal({ modo: 'editar', record });
    } else {
      setPestana('inv');
      setSeleccionado(record.ref);
      setQuery('');
      setForm({
        ...emptyForm(),
        categoria: record.ref.reparacion.categoria || '',
        prioridad: record.ref.reparacion.prioridad || 'Media',
        falla: record.ref.reparacion.falla || '',
        tecnico: record.ref.reparacion.tecnico || TECNICOS[0],
        estado: record.ref.reparacion.estado || 'Pendiente',
        fecha: (record.ref.reparacion.fecha || new Date().toISOString()).split('T')[0],
      });
      setModal({ modo: 'editar', record });
    }
  };

  const cerrarModal = () => { if (!guardando) setModal(null); };

  const guardar = async () => {
    if (pestana === 'inv') {
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
      } catch (err) {
        notify('Error', err.message, 'error');
      } finally {
        setGuardando(false);
      }
      return;
    }

    if (!form.marca.trim() || !form.modelo.trim() || !form.serie.trim()) {
      notify('Datos incompletos', 'Marca, modelo y serie son obligatorios.', 'error'); return;
    }
    if (!form.categoria) { notify('Falta categoría', 'Selecciona la categoría de la reparación.', 'error'); return; }
    if (!form.falla.trim()) { notify('Falta falla', 'Describe la falla detectada.', 'error'); return; }
    setGuardando(true);
    try {
      const payload = {
        marca: form.marca, modelo: form.modelo, serie: form.serie,
        categoria: form.categoria, prioridad: form.prioridad, falla: form.falla,
        tecnico: form.tecnico, estado: form.estado,
        fecha: new Date(`${form.fecha}T12:00:00`).toISOString(),
      };
      if (modal?.modo === 'editar') {
        await api.updateCentroReparacion(modal.record.ref.id, payload);
        notify('Reparación actualizada', `${form.marca} ${form.modelo} → ${form.categoria}`, 'success');
      } else {
        await api.crearCentroReparacion(payload);
        notify('Equipo registrado', `${form.marca} ${form.modelo} → ${form.categoria}`, 'success');
      }
      setModal(null);
      recargarManuales();
    } catch (err) {
      notify('Error', err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstadoRep = async (record, estado) => {
    try {
      if (record.origen === 'manual') {
        await api.updateCentroReparacion(record.ref.id, { ...record.ref, estado });
        recargarManuales();
      } else {
        await api.saveEquipo(record.ref.codigo, {
          ...record.ref,
          reparacion: { ...record.ref.reparacion, estado },
        });
      }
      notify('Estado actualizado', `${record.codigo} → ${estado}`, 'success');
    } catch (err) {
      notify('Error', err.message, 'error');
    }
  };

  const finalizar = async () => {
    const item = finItem;
    setFinItem(null);
    try {
      if (item.origen === 'manual') {
        await api.finalizarCentroReparacion(item.ref.id);
        recargarManuales();
        notify('Reparación finalizada', `${item.nombre} marcado como terminado.`, 'success');
      } else {
        await api.saveEquipo(item.ref.codigo, {
          ...item.ref,
          estado: '🔵 OK',
          reparacion: { ...item.ref.reparacion, estado: 'Finalizada', fechaFin: new Date().toISOString() },
        });
        notify('Reparación finalizada', `${item.codigo} vuelve al inventario como 🔵 OK.`, 'success');
      }
    } catch (err) {
      notify('Error', err.message, 'error');
    }
  };

  const reabrir = async (record) => {
    try {
      await api.updateCentroReparacion(record.ref.id, { ...record.ref, estado: 'Pendiente', fechaFin: null });
      recargarManuales();
      notify('Reparación reabierta', `${record.codigo} vuelve a Pendiente.`, 'success');
    } catch (err) {
      notify('Error', err.message, 'error');
    }
  };

  const eliminar = async () => {
    const item = delItem;
    setDelItem(null);
    try {
      await api.deleteCentroReparacion(item.ref.id);
      recargarManuales();
      notify('Registro eliminado', `${item.nombre} eliminado del centro.`, 'success');
    } catch (err) {
      notify('Error', err.message, 'error');
    }
  };

  const onSeleccionarArchivo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImportando(true);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result.split(',')[1]);
        fr.onerror = reject;
        fr.readAsDataURL(file);
      });
      const res = await api.importarCentroReparaciones({ nombre: file.name, data: base64 });
      setImportResult(res);
      if (res.importados > 0) recargarManuales();
    } catch (err) {
      notify('Error', err.message, 'error');
    } finally {
      setImportando(false);
    }
  };

  const CardEquipo = ({ record }) => {
    const finalizada = record.estado === 'Finalizada';
    return (
      <div className="panel p-4 animate-slide-up">
        <div className="flex gap-4">
          {record.foto ? (
            <img src={record.foto} alt={record.codigo} className="w-24 h-24 object-cover rounded-xl border border-slate-200 shrink-0" />
          ) : (
            <div className="w-24 h-24 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
              <i className={`fa-solid ${record.origen === 'manual' ? 'fa-boxes-stacked' : 'fa-image'} text-2xl`} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-900 leading-tight">{record.nombre}</p>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {record.codigo} · S/N {record.serie || '—'}
              {record.origen === 'manual' && <span className="ml-2 text-[9px] uppercase font-bold bg-slate-100 rounded px-1.5 py-0.5 text-slate-500">Almacén</span>}
            </p>
            {record.specs && <p className="text-xs text-slate-500 mt-1 truncate">{record.specs}</p>}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIORIDAD_STYLE[record.prioridad] || PRIORIDAD_STYLE.Media}`}>
                <i className={`fa-solid ${PRIORIDAD_ICON[record.prioridad] || 'fa-equals'} mr-1`} />{record.prioridad}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ESTADO_REP_STYLE[record.estado] || ''}`}>{record.estado}</span>
              {record.origen === 'inv' && finalizada && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-sky-50 text-sky-700 border-sky-200">
                  <i className="fa-solid fa-store mr-1" />En inventario 🔵 OK
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-3 bg-rose-50/70 border border-rose-100 rounded-lg p-2.5 text-xs text-rose-900">
          <span className="font-bold uppercase text-[10px] text-rose-500 block mb-0.5">Falla detectada</span>
          {record.falla || '—'}
        </div>
        <div className="flex items-center justify-between gap-3 mt-3">
          <div className="text-[11px] text-slate-500 min-w-0">
            <p><i className="fa-solid fa-user-gear w-4 text-slate-400" /> {record.tecnico || '—'}</p>
            <p className="mt-0.5"><i className="fa-solid fa-calendar-plus w-4 text-slate-400" /> Ingreso: {fmtFecha(record.fecha)}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!finalizada ? (
              <>
                <select
                  value={record.estado}
                  onChange={e => cambiarEstadoRep(record, e.target.value)}
                  className="form-input !py-1.5 !px-2 text-xs"
                >
                  {ESTADOS_ACTIVOS.map(e => <option key={e}>{e}</option>)}
                </select>
                <button onClick={() => abrirEditar(record)} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition" title="Editar reparación">
                  <i className="fa-solid fa-pen text-sm" />
                </button>
                <button onClick={() => setFinItem(record)} className="p-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition" title="Marcar como Finalizada">
                  <i className="fa-solid fa-check text-sm" />
                </button>
              </>
            ) : (
              <>
                {record.origen === 'manual' && (
                  <button onClick={() => reabrir(record)} className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition">
                    Reabrir
                  </button>
                )}
                <button onClick={() => setDelItem(record)} className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition" title="Eliminar registro">
                  <i className="fa-solid fa-trash text-sm" />
                </button>
              </>
            )}
            {record.origen === 'manual' && !finalizada && (
              <button onClick={() => setDelItem(record)} className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition" title="Eliminar registro">
                <i className="fa-solid fa-trash text-sm" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Centro de Reparaciones</h2>
          <p className="text-slate-500 text-sm">Equipos en reparación o mantenimiento, del inventario o del almacén</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowFinalizadas(v => !v)}
            className={`px-4 py-3 rounded-xl text-sm font-bold border transition ${showFinalizadas ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
            title="Mostrar u ocultar reparaciones finalizadas"
          >
            <i className="fa-solid fa-clock-rotate-left mr-1" /> Finalizadas ({finalizadas.length})
          </button>
          <button
            onClick={() => api.descargarPlantillaCentro().catch(err => notify('Error', err.message, 'error'))}
            className="px-4 py-3 rounded-xl text-sm font-bold border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 transition"
            title="Descargar plantilla Excel con las columnas esperadas"
          >
            <i className="fa-solid fa-file-arrow-down mr-1" /> Plantilla
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importando}
            className="px-4 py-3 rounded-xl text-sm font-bold border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
            title="Importar equipos desde Excel"
          >
            <i className={`fa-solid ${importando ? 'fa-spinner fa-spin' : 'fa-file-import'} mr-1`} />
            {importando ? 'Importando...' : 'Importar Excel'}
          </button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onSeleccionarArchivo} />
          <button onClick={abrirNuevo} className="btn-brand px-5 py-3 rounded-xl text-sm font-bold">
            <i className="fa-solid fa-plus mr-1" /> Registrar reparación
          </button>
        </div>
      </div>

      {!categoria ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="panel p-4">
              <p className="text-3xl font-bold text-slate-900">{activos.length}</p>
              <p className="text-xs text-slate-500 font-bold uppercase mt-1">En taller</p>
            </div>
            <div className="panel p-4">
              <p className="text-3xl font-bold text-red-600">{activos.filter(r => r.prioridad === 'Alta').length}</p>
              <p className="text-xs text-slate-500 font-bold uppercase mt-1">Prioridad alta</p>
            </div>
            <div className="panel p-4">
              <p className="text-3xl font-bold text-amber-600">{activos.filter(r => r.estado === 'En proceso').length}</p>
              <p className="text-xs text-slate-500 font-bold uppercase mt-1">En proceso</p>
            </div>
            <div className="panel p-4">
              <p className="text-3xl font-bold text-orange-600">{activos.filter(r => r.estado === 'Esperando refacción').length}</p>
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

          {activos.length === 0 && (
            <div className="panel p-12 text-center text-slate-400">
              <i className="fa-solid fa-screwdriver-wrench text-4xl mb-3" />
              <p className="text-sm font-semibold">No hay equipos activos en el centro de reparaciones</p>
              <p className="text-xs mt-1">Registra una reparación de un equipo del inventario o agrega uno manual del almacén.</p>
              <button onClick={abrirManual} className="mt-4 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm font-bold hover:bg-slate-100 transition">
                <i className="fa-solid fa-boxes-stacked mr-1" /> Agregar equipo del almacén
              </button>
            </div>
          )}

          {cargandoManuales && <p className="text-center text-xs text-slate-400 animate-pulse"><i className="fa-solid fa-spinner fa-spin mr-1" />Cargando almacén...</p>}
        </>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <button onClick={() => setCategoria(null)} className="p-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 transition" title="Volver">
              <i className="fa-solid fa-arrow-left" />
            </button>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-lg">{categoria}</h3>
              <p className="text-xs text-slate-500">{porCategoria(categoria).length} activo{porCategoria(categoria).length !== 1 ? 's' : ''} · {mostrar.filter(r => r.categoria === categoria).length} en vista</p>
            </div>
          </div>
          {mostrar.filter(r => r.categoria === categoria).length === 0 ? (
            <div className="panel p-12 text-center text-slate-400">
              <i className="fa-solid fa-box-open text-4xl mb-3" />
              <p className="text-sm">Sin equipos en esta categoría.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {mostrar.filter(r => r.categoria === categoria).map(record => <CardEquipo key={record.key} record={record} />)}
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

            {modal.modo === 'nuevo' && (
              <div className="flex gap-2 mb-4 bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => setPestana('inv')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${pestana === 'inv' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <i className="fa-solid fa-laptop mr-1" /> Del inventario
                </button>
                <button
                  onClick={() => setPestana('manual')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${pestana === 'manual' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <i className="fa-solid fa-boxes-stacked mr-1" /> Manual (almacén)
                </button>
              </div>
            )}

            {pestana === 'inv' ? (
              <>
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
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Marca *</label>
                  <input className="form-input uppercase" value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} placeholder="LENOVO" />
                </div>
                <div>
                  <label className="form-label">Modelo *</label>
                  <input className="form-input uppercase" value={form.modelo} onChange={e => setForm({ ...form, modelo: e.target.value })} placeholder="THINKPAD T520" />
                </div>
                <div>
                  <label className="form-label">Serie *</label>
                  <input className="form-input uppercase" value={form.serie} onChange={e => setForm({ ...form, serie: e.target.value })} placeholder="R9-XXXX" />
                </div>
              </div>
            )}

            {pestana === 'inv' && modal.modo === 'editar' && (
              <p className="text-xs text-slate-500 mb-3">Editando {seleccionado ? nombreEquipo(seleccionado.marca, seleccionado.modelo) : ''}</p>
            )}

            {((pestana === 'inv' && seleccionado) || pestana === 'manual') && (
              <div className="space-y-4">
                {pestana === 'inv' && (
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
                )}

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
        message={finItem?.origen === 'manual'
          ? `¿Marcar como finalizada ${finItem?.nombre}? Salió del almacén, quedará registrado como terminado.`
          : `¿Marcar como finalizada ${finItem ? finItem.nombre : ''}? El equipo volverá al inventario como 🔵 OK, listo para venta o entrega.`}
        confirmLabel="Sí, finalizar"
        onConfirm={finalizar}
        onCancel={() => setFinItem(null)}
      />

      <ConfirmModal
        open={!!delItem}
        title="Eliminar registro"
        message={`¿Eliminar ${delItem?.nombre} (${delItem?.codigo}) del centro? No está en el inventario: se borrará definitivamente.`}
        confirmLabel="Sí, eliminar"
        onConfirm={eliminar}
        onCancel={() => setDelItem(null)}
        danger
      />

      {importResult && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setImportResult(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95 slide-in-from-bottom-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2.5 rounded-full ${importResult.omitidos > 0 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                <i className={`fa-solid ${importResult.omitidos > 0 ? 'fa-triangle-exclamation' : 'fa-file-import'} text-xl`} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Importación completada</h3>
                <p className="text-sm text-slate-500">Procesadas {importResult.total} filas del Excel</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-emerald-600">{importResult.importados}</p>
                <p className="text-xs text-emerald-700 font-bold uppercase mt-1">Importados</p>
              </div>
              <div className={`rounded-xl p-4 text-center ${importResult.omitidos > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50 border border-slate-200'}`}>
                <p className={`text-3xl font-bold ${importResult.omitidos > 0 ? 'text-amber-600' : 'text-slate-500'}`}>{importResult.omitidos}</p>
                <p className={`text-xs font-bold uppercase mt-1 ${importResult.omitidos > 0 ? 'text-amber-700' : 'text-slate-500'}`}>Omitidos</p>
              </div>
            </div>
            {importResult.errores?.length > 0 && (
              <div className="mt-4">
                <p className="form-label">Detalle de filas omitidas</p>
                <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                  {importResult.errores.map((err, i) => (
                    <p key={i} className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5">{err}</p>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => api.descargarPlantillaCentro().catch(err => notify('Error', err.message, 'error'))}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                <i className="fa-solid fa-file-arrow-down mr-1" /> Plantilla
              </button>
              <button onClick={() => setImportResult(null)} className="btn-brand px-5 py-2.5 rounded-xl text-sm font-bold">
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
