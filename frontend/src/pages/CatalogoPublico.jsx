import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import useDocumentTitle from '../utils/useDocumentTitle';
import { fotoPrincipal } from '../utils/inventario';

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

  useEffect(() => {
    if (codigo) api.productoPublico(codigo).then(setProducto).catch(err => setError(err.message));
    else api.catalogoPublico().then(setProductos).catch(err => setError(err.message));
  }, [codigo]);

  const filtrados = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return productos;
    return productos.filter(p => [p.codigo, p.marca, p.modelo, p.procesador, p.ram, p.almacenamiento].some(v => String(v || '').toLowerCase().includes(s)));
  }, [productos, q]);

  if (codigo && producto) return (
    <main className="min-h-screen bg-slate-50 p-5 sm:p-8">
      <div className="max-w-4xl mx-auto"><Link to="/catalogo" className="text-sm text-brand-600 font-bold hover:underline"><i className="fa-solid fa-arrow-left mr-1" />Volver al catálogo</Link>
        <div className="mt-5 bg-white rounded-3xl overflow-hidden shadow-xl grid grid-cols-1 md:grid-cols-2"><Foto producto={producto} grande /><div className="p-7"><p className="text-xs font-bold text-brand-600 uppercase">{producto.categoria}</p><h1 className="text-3xl font-extrabold text-slate-900 mt-1">{producto.marca} {producto.modelo}</h1><p className="text-slate-500 mt-3">{producto.descripcionPublica || 'Equipo disponible para consulta.'}</p><p className="text-3xl font-extrabold text-brand-700 mt-6">{producto.precioPublico ? `$${Number(producto.precioPublico).toLocaleString('es-MX')} MXN` : 'Precio a consultar'}</p><div className="mt-6 grid grid-cols-2 gap-3 text-sm"><span><b>Procesador</b><br />{producto.procesador || 'N/A'}</span><span><b>RAM</b><br />{producto.ram || 'N/A'}</span><span><b>Almacenamiento</b><br />{producto.almacenamiento || 'N/A'}</span><span><b>Sistema</b><br />{producto.sistemaOperativo || 'N/A'}</span></div></div></div>
      </div>
    </main>
  );

  return <main className="min-h-screen bg-slate-50 p-5 sm:p-8"><div className="max-w-6xl mx-auto"><div className="text-center mb-8"><p className="text-brand-600 font-bold text-sm uppercase tracking-widest">EquipMaster</p><h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">Catálogo de equipos</h1><p className="text-slate-500 mt-2">Equipos disponibles para venta y entrega.</p></div><input value={q} onChange={e => setQ(e.target.value)} className="form-input max-w-xl mx-auto block mb-8" placeholder="Buscar marca, modelo, RAM o almacenamiento..." />{error && <p className="text-center text-red-600">{error}</p>}<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{filtrados.map(p => <Link key={p.codigo} to={`/catalogo/${p.codigo}`} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition group"><Foto producto={p} /><div className="p-4"><p className="text-xs text-brand-600 font-bold">{p.codigo}</p><h2 className="font-bold text-lg text-slate-900 group-hover:text-brand-600">{p.marca} {p.modelo}</h2><p className="text-sm text-slate-500">{p.ram} · {p.almacenamiento}</p><p className="text-xl font-extrabold text-brand-700 mt-3">{p.precioPublico ? `$${Number(p.precioPublico).toLocaleString('es-MX')}` : 'Consultar precio'}</p></div></Link>)}</div>{!error && filtrados.length === 0 && <p className="text-center text-slate-400 py-16">No hay productos publicados.</p>}</div></main>;
}
