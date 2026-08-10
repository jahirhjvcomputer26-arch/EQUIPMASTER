import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useNotify } from '../componentes/Notification';
import useDocumentTitle from '../utils/useDocumentTitle';

export default function PublicarCatalogo() {
  useDocumentTitle('Publicar catálogo');
  const { notify } = useNotify();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);

  const cargar = () => {
    setLoading(true);
    api.getCatalogoPublicables().then(setItems).catch(err => notify('Error', err.message, 'error')).finally(() => setLoading(false));
  };
  useEffect(() => { cargar(); }, []);

  const cambiar = (item, field, value) => setItems(prev => prev.map(i => i.codigo === item.codigo ? { ...i, [field]: value } : i));
  const toggle = (codigo) => setSelected(prev => prev.includes(codigo) ? prev.filter(v => v !== codigo) : [...prev, codigo]);
  const publicarSeleccionados = async () => {
    try {
      await Promise.all(items.filter(i => selected.includes(i.codigo)).map(i => api.publicarCatalogo(i.codigo, { publicado: true, precioPublico: i.precioPublico, descripcionPublica: i.descripcionPublica, detallesPublicos: i.detallesPublicos })));
      notify('Publicados', `${selected.length} equipos publicados.`, 'success');
      setSelected([]); cargar();
    } catch (err) { notify('Error', err.message, 'error'); }
  };
  const guardar = async (item) => {
    try {
      await api.publicarCatalogo(item.codigo, { publicado: !item.publicado, precioPublico: item.precioPublico, descripcionPublica: item.descripcionPublica, detallesPublicos: item.detallesPublicos });
      notify(item.publicado ? 'Publicado' : 'Oculto', `${item.codigo} actualizado en el catálogo público.`, 'success');
      cargar();
    } catch (err) { notify('Error', err.message, 'error'); }
  };

  return (
    <section className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-2xl font-bold text-slate-900">Publicar catálogo</h2><p className="text-slate-500 text-sm">Solo aparecen equipos en estado 🔵 OK. MK puede publicar sin editar la ficha interna.</p></div>{selected.length > 0 && <button onClick={publicarSeleccionados} className="btn-brand px-4 py-2 rounded-xl text-white font-bold text-sm"><i className="fa-solid fa-bullhorn mr-1" />Publicar seleccionados ({selected.length})</button>}</div>
      {loading ? <div className="text-center py-16 text-slate-400"><i className="fa-solid fa-spinner fa-spin mr-2" />Cargando equipos OK...</div> : items.length === 0 ? <div className="panel p-12 text-center text-slate-400"><i className="fa-solid fa-box-open text-4xl mb-3" /><p>No hay equipos en estado 🔵 OK.</p></div> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
         {items.map(item => { const foto = item.fotos?.frente || Object.values(item.fotos || {})[0]; return <article key={item.codigo} className="panel overflow-hidden"><div className="h-40 bg-slate-100 flex items-center justify-center">{foto ? <img src={foto} alt="" className="w-full h-full object-cover" /> : <i className="fa-solid fa-laptop text-4xl text-slate-300" />}</div><div className="p-4 space-y-3"><div className="flex items-center justify-between"><div><p className="text-xs font-mono font-bold text-brand-600">{item.codigo}</p><h3 className="font-bold text-slate-900">{item.marca} {item.modelo}</h3></div><input type="checkbox" checked={selected.includes(item.codigo)} onChange={() => toggle(item.codigo)} className="w-5 h-5 rounded border-slate-300" /></div><p className="text-xs text-slate-500">{item.ram} · {item.almacenamiento} · {item.procesador}</p><input type="number" min="0" className="form-input" placeholder="Precio público" value={item.precioPublico} onChange={e => cambiar(item, 'precioPublico', e.target.value)} /><textarea className="form-input min-h-[60px] text-sm" placeholder="Descripción pública" value={item.descripcionPublica} onChange={e => cambiar(item, 'descripcionPublica', e.target.value)} /><textarea className="form-input min-h-[50px] text-sm" placeholder="Detalles públicos: desgaste, batería, garantía..." value={item.detallesPublicos || ''} onChange={e => cambiar(item, 'detallesPublicos', e.target.value)} /><button onClick={() => guardar(item)} className={`w-full py-2.5 rounded-xl text-sm font-bold ${item.publicado ? 'bg-emerald-100 text-emerald-700 hover:bg-red-100 hover:text-red-700' : 'bg-brand-600 text-white hover:bg-brand-700'}`}>{item.publicado ? 'Publicado · Ocultar' : 'Publicar en catálogo'}</button></div></article>; })}
      </div>}
    </section>
  );
}
