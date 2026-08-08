import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { fotoPrincipal } from '../utils/inventario';
import useDocumentTitle from '../utils/useDocumentTitle';

function Foto({ producto, grande = false }) {
  const src = fotoPrincipal(producto.fotos);
  return src ? <img src={src} alt={`${producto.marca} ${producto.modelo}`} className={`${grande ? 'w-full h-72' : 'w-full h-44'} object-cover`} /> : <div className={`${grande ? 'h-72' : 'h-44'} flex items-center justify-center bg-slate-100 text-slate-300`}><i className="fa-solid fa-laptop text-5xl" /></div>;
}

export default function CatalogoPublico() {
  useDocumentTitle('Catálogo');
  const { codigo } = useParams();
  const [productos, setProductos] = useState([]);
  const [producto, setProducto] = useState(null);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const [favoritos, setFavoritos] = useState(() => JSON.parse(localStorage.getItem('equipmaster_favoritos') || '[]'));
  const [comparar, setComparar] = useState(() => JSON.parse(localStorage.getItem('equipmaster_comparar') || '[]'));
  const [showCompare, setShowCompare] = useState(false);
  const [solicitud, setSolicitud] = useState({ nombre: '', telefono: '', email: '', mensaje: '' });
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    if (codigo) api.productoPublico(codigo).then(setProducto).catch(err => setError(err.message));
    else api.catalogoPublico().then(setProductos).catch(err => setError(err.message));
  }, [codigo]);

  const filtrados = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return productos;
    return productos.filter(p => [p.codigo, p.marca, p.modelo, p.procesador, p.ram, p.almacenamiento].some(v => String(v || '').toLowerCase().includes(s)));
  }, [productos, q]);

  const toggle = (list, setList, value, storage, max = 99) => {
    const next = list.includes(value) ? list.filter(v => v !== value) : list.length < max ? [...list, value] : list;
    setList(next); localStorage.setItem(storage, JSON.stringify(next));
  };

  const enviarSolicitud = async (e) => {
    e.preventDefault();
    try { await api.crearSolicitudVenta({ codigo: producto.codigo, ...solicitud }); setEnviado(true); }
    catch (err) { setError(err.message); }
  };

  if (codigo && producto) {
    const wa = `https://wa.me/?text=${encodeURIComponent(`Hola, me interesa el equipo ${producto.marca} ${producto.modelo} (${producto.codigo})`)}`;
    return <main className="min-h-screen bg-slate-50 text-slate-900 font-bold p-5 sm:p-8"><div className="max-w-5xl mx-auto"><Link to="/catalogo" className="text-sm text-brand-600 font-bold hover:underline"><i className="fa-solid fa-arrow-left mr-1" />Volver al catálogo</Link><div className="mt-5 !bg-white !text-slate-900 rounded-3xl overflow-hidden shadow-xl grid grid-cols-1 md:grid-cols-2"><Foto producto={producto} grande /><div className="p-7 !text-slate-900"><p className="text-xs font-bold text-brand-600 uppercase">{producto.categoria}</p><h1 className="text-3xl font-extrabold !text-slate-900 mt-1">{producto.marca} {producto.modelo}</h1><p className="!text-slate-700 font-bold mt-3">{producto.descripcionPublica || 'Equipo disponible para consulta.'}</p>{producto.detallesPublicos && <div className="mt-4 p-3 rounded-xl bg-amber-50 text-amber-900 text-sm"><b>Detalles:</b> {producto.detallesPublicos}</div>}<p className="text-3xl font-extrabold text-brand-700 mt-6">{producto.precioPublico ? `$${Number(producto.precioPublico).toLocaleString('es-MX')} MXN` : 'Precio a consultar'}</p><div className="mt-6 grid grid-cols-2 gap-3 text-sm !text-slate-900"><span><b>Procesador</b><br />{producto.procesador || 'N/A'}</span><span><b>RAM</b><br />{producto.ram || 'N/A'}</span><span><b>Almacenamiento</b><br />{producto.almacenamiento || 'N/A'}</span><span><b>Sistema</b><br />{producto.sistemaOperativo || 'N/A'}</span></div><div className="mt-6 flex gap-2"><a href={wa} target="_blank" rel="noreferrer" className="flex-1 text-center py-2.5 rounded-xl bg-green-600 text-white font-bold"><i className="fa-brands fa-whatsapp mr-1" />WhatsApp</a><button onClick={() => toggle(favoritos, setFavoritos, producto.codigo, 'equipmaster_favoritos')} className="px-4 rounded-xl border text-red-500"><i className={`fa-${favoritos.includes(producto.codigo) ? 'solid' : 'regular'} fa-heart`} /></button></div><div className="mt-6 border-t pt-5">{enviado ? <p className="text-emerald-700 font-bold">Solicitud enviada. Ventas se pondrá en contacto contigo.</p> : <form onSubmit={enviarSolicitud} className="space-y-2"><p className="font-bold !text-slate-900">Solicitar compra</p><input required className="form-input !bg-white !text-slate-900 placeholder:!text-slate-500 font-bold" placeholder="Nombre" value={solicitud.nombre} onChange={e => setSolicitud({ ...solicitud, nombre: e.target.value })} /><input required className="form-input !bg-white !text-slate-900 placeholder:!text-slate-500 font-bold" placeholder="Teléfono" value={solicitud.telefono} onChange={e => setSolicitud({ ...solicitud, telefono: e.target.value })} /><input className="form-input !bg-white !text-slate-900 placeholder:!text-slate-500 font-bold" placeholder="Correo" value={solicitud.email} onChange={e => setSolicitud({ ...solicitud, email: e.target.value })} /><textarea className="form-input !bg-white !text-slate-900 placeholder:!text-slate-500 font-bold" placeholder="Mensaje" value={solicitud.mensaje} onChange={e => setSolicitud({ ...solicitud, mensaje: e.target.value })} /><button className="w-full py-2.5 rounded-xl bg-brand-600 text-white font-bold">Enviar solicitud</button></form>}</div></div></div></div></main>;
  }

  const comparados = productos.filter(p => comparar.includes(p.codigo));
  return <main className="min-h-screen bg-slate-50 p-5 sm:p-8"><div className="max-w-6xl mx-auto"><div className="text-center mb-8"><p className="text-brand-600 font-bold text-sm uppercase tracking-widest">EquipMaster</p><h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">Catálogo de equipos</h1><p className="text-slate-500 mt-2">Equipos disponibles para venta y entrega.</p></div><input value={q} onChange={e => setQ(e.target.value)} className="form-input max-w-xl mx-auto block mb-8" placeholder="Buscar marca, modelo, RAM o almacenamiento..." />{error && <p className="text-center text-red-600">{error}</p>}<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{filtrados.map(p => <div key={p.codigo} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition"><Link to={`/catalogo/${p.codigo}`}><Foto producto={p} /><div className="p-4 text-slate-900"><p className="text-xs text-brand-600 font-bold">{p.codigo}</p><h2 className="font-bold text-lg">{p.marca} {p.modelo}</h2><p className="text-sm text-slate-500">{p.ram} · {p.almacenamiento}</p><p className="text-xl font-extrabold text-brand-700 mt-3">{p.precioPublico ? `$${Number(p.precioPublico).toLocaleString('es-MX')}` : 'Consultar precio'}</p></div></Link><div className="px-4 pb-4 flex gap-2"><button onClick={() => toggle(favoritos, setFavoritos, p.codigo, 'equipmaster_favoritos')} className="flex-1 py-2 rounded-lg border text-xs font-bold text-red-500"><i className={`fa-${favoritos.includes(p.codigo) ? 'solid' : 'regular'} fa-heart mr-1`} />Favorito</button><button onClick={() => toggle(comparar, setComparar, p.codigo, 'equipmaster_comparar', 3)} className="flex-1 py-2 rounded-lg border text-xs font-bold text-brand-600"><i className="fa-solid fa-code-compare mr-1" />Comparar</button></div></div>)}</div>{!error && filtrados.length === 0 && <p className="text-center text-slate-400 py-16">No hay productos publicados.</p>}{comparar.length > 0 && <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-white text-slate-900 shadow-xl rounded-2xl border p-3 flex items-center gap-3 text-sm"><b>{comparar.length}/3 para comparar</b><button onClick={() => setShowCompare(true)} className="px-3 py-1.5 rounded-lg bg-brand-600 text-white font-bold">Ver selección</button><button onClick={() => { setComparar([]); localStorage.removeItem('equipmaster_comparar'); }} className="text-slate-400">Limpiar</button></div>}{showCompare && <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowCompare(false)}><div className="bg-white text-slate-900 rounded-2xl p-5 max-w-4xl w-full" onClick={e => e.stopPropagation()}><div className="flex justify-between mb-4"><h2 className="font-bold text-xl">Comparar equipos</h2><button onClick={() => setShowCompare(false)}><i className="fa-solid fa-xmark" /></button></div><div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{comparados.map(p => <div key={p.codigo} className="border rounded-xl p-3 text-sm"><b>{p.marca} {p.modelo}</b><p>RAM: {p.ram || 'N/A'}</p><p>Disco: {p.almacenamiento || 'N/A'}</p><p>CPU: {p.procesador || 'N/A'}</p><p className="font-bold text-brand-700 mt-2">{p.precioPublico ? `$${p.precioPublico}` : 'Consultar precio'}</p><Link to={`/catalogo/${p.codigo}`} className="mt-2 inline-block px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-bold">Consultar equipo</Link></div>)}</div></div></div>}</div></main>;
}
