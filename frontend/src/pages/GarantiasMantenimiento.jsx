import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useNotify } from '../componentes/Notification';
import useDocumentTitle from '../utils/useDocumentTitle';

const emptyGarantia = { codigo: '', proveedor: '', tipo: 'Fabricante', inicio: '', vencimiento: '', notas: '' };
const emptyMantenimiento = { codigo: '', tipo: 'Preventivo', fechaProgramada: '', tecnico: '', estado: 'Programado', notas: '' };

export default function GarantiasMantenimiento() {
  useDocumentTitle('Garantías y Mantenimientos');
  const { notify } = useNotify();
  const [tab, setTab] = useState('garantias');
  const [garantias, setGarantias] = useState([]);
  const [mantenimientos, setMantenimientos] = useState([]);
  const [form, setForm] = useState(emptyGarantia);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargar = async () => {
    setLoading(true);
    setError('');
    try {
      if (typeof api.getGarantias !== 'function' || typeof api.getMantenimientos !== 'function') throw new Error('La aplicación del servidor está desactualizada.');
      const [g, m] = await Promise.all([api.getGarantias(), api.getMantenimientos()]);
      setGarantias(g);
      setMantenimientos(m);
    } catch (err) { setError(err.message || 'No se pudieron cargar los registros.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { cargar(); }, []);

  const cambiarTab = (next) => {
    setTab(next);
    setForm(next === 'garantias' ? emptyGarantia : emptyMantenimiento);
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.codigo.trim()) return notify('Falta código', 'Indica el código del equipo.', 'error');
    setSaving(true);
    try {
      if (tab === 'garantias') await api.crearGarantia(form);
      else await api.crearMantenimiento(form);
      notify('Guardado', 'El registro fue agregado correctamente.', 'success');
      setForm(tab === 'garantias' ? emptyGarantia : emptyMantenimiento);
      await cargar();
    } catch (err) { notify('Error', err.message, 'error'); }
    finally { setSaving(false); }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este registro?')) return;
    try {
      if (tab === 'garantias') await api.eliminarGarantia(id);
      else await api.eliminarMantenimiento(id);
      await cargar();
    } catch (err) { notify('Error', err.message, 'error'); }
  };

  const lista = tab === 'garantias' ? garantias : mantenimientos;
  return (
    <section className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900">Garantías y Mantenimientos</h2>
        <p className="text-slate-500 text-sm">Seguimiento preventivo ligado a cada equipo.</p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => cambiarTab('garantias')} className={`px-4 py-2 rounded-xl text-sm font-bold ${tab === 'garantias' ? 'bg-brand-600 text-white' : 'bg-white text-slate-500 border'}`}><i className="fa-solid fa-shield-halved mr-1" />Garantías ({garantias.length})</button>
        <button onClick={() => cambiarTab('mantenimientos')} className={`px-4 py-2 rounded-xl text-sm font-bold ${tab === 'mantenimientos' ? 'bg-brand-600 text-white' : 'bg-white text-slate-500 border'}`}><i className="fa-solid fa-screwdriver-wrench mr-1" />Mantenimientos ({mantenimientos.length})</button>
      </div>
      {error && <div className="panel p-4 border border-red-200 bg-red-50 text-red-700 flex items-center justify-between gap-3"><span><i className="fa-solid fa-triangle-exclamation mr-2" />{error}</span><button onClick={cargar} className="font-bold underline">Reintentar</button></div>}
      <form onSubmit={guardar} className="panel p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><label className="form-label">Código del equipo *</label><input className="form-input" value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value.toUpperCase() })} placeholder="INV-1000" /></div>
        {tab === 'garantias' ? <>
          <div><label className="form-label">Proveedor</label><input className="form-input" value={form.proveedor} onChange={e => setForm({ ...form, proveedor: e.target.value })} /></div>
          <div><label className="form-label">Tipo</label><select className="form-input" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}><option>Fabricante</option><option>Tienda</option><option>Extendida</option></select></div>
          <div><label className="form-label">Inicio</label><input type="date" className="form-input" value={form.inicio} onChange={e => setForm({ ...form, inicio: e.target.value })} /></div>
          <div><label className="form-label">Vencimiento</label><input type="date" className="form-input" value={form.vencimiento} onChange={e => setForm({ ...form, vencimiento: e.target.value })} /></div>
        </> : <>
          <div><label className="form-label">Tipo</label><select className="form-input" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}><option>Preventivo</option><option>Correctivo</option><option>Limpieza</option><option>Actualización</option></select></div>
          <div><label className="form-label">Fecha programada</label><input type="date" className="form-input" value={form.fechaProgramada} onChange={e => setForm({ ...form, fechaProgramada: e.target.value })} /></div>
          <div><label className="form-label">Técnico</label><input className="form-input" value={form.tecnico} onChange={e => setForm({ ...form, tecnico: e.target.value })} /></div>
        </>}
        <div className="md:col-span-2"><label className="form-label">Notas</label><input className="form-input" value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} /></div>
        <div className="flex items-end"><button disabled={saving} className="btn-brand w-full py-2.5 rounded-xl text-white font-bold disabled:opacity-50">{saving ? 'Guardando...' : 'Agregar registro'}</button></div>
      </form>
      <div className="panel overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50"><tr><th className="p-3 text-left">Equipo</th><th className="p-3 text-left">Detalle</th><th className="p-3 text-left">Fecha</th><th className="p-3" /></tr></thead><tbody>
        {loading ? <tr><td colSpan="4" className="p-8 text-center text-slate-400"><i className="fa-solid fa-spinner fa-spin mr-2" />Cargando...</td></tr> : lista.map(item => <tr key={item.id} className="border-t border-slate-100"><td className="p-3 font-mono font-bold text-brand-700">{item.codigo}</td><td className="p-3">{tab === 'garantias' ? `${item.proveedor || 'Sin proveedor'} · ${item.tipo || ''}` : `${item.tipo || ''} · ${item.tecnico || 'Sin técnico'}`}</td><td className="p-3 text-slate-500">{item.vencimiento || item.fechaProgramada || 'Sin fecha'}</td><td className="p-3 text-right"><button onClick={() => eliminar(item.id)} className="text-red-500 hover:text-red-700"><i className="fa-solid fa-trash" /></button></td></tr>)}
        {lista.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-slate-400">No hay registros.</td></tr>}
      </tbody></table></div></div>
    </section>
  );
}
