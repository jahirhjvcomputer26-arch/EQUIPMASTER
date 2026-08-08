import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useNotify } from '../componentes/Notification';
import useDocumentTitle from '../utils/useDocumentTitle';

export default function SolicitudesVenta() {
  useDocumentTitle('Solicitudes de compra');
  const { notify } = useNotify();
  const [items, setItems] = useState([]);
  const cargar = () => api.getSolicitudesVenta().then(setItems).catch(err => notify('Error', err.message, 'error'));
  useEffect(() => { cargar(); }, []);
  const cambiar = async (id, estado) => { try { await api.actualizarSolicitudVenta(id, estado); cargar(); } catch (err) { notify('Error', err.message, 'error'); } };
  return <section className="space-y-6 animate-fade-in"><div><h2 className="font-display text-2xl font-bold text-slate-900">Solicitudes de compra</h2><p className="text-slate-500 text-sm">Clientes interesados en productos publicados.</p></div><div className="panel overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50"><tr><th className="p-3 text-left">Producto</th><th className="p-3 text-left">Cliente</th><th className="p-3 text-left">Contacto</th><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Fecha</th></tr></thead><tbody>{items.map(i => <tr key={i.id} className="border-t border-slate-100"><td className="p-3"><b>{i.codigo}</b><br /><span className="text-xs text-slate-500">{i.producto}</span></td><td className="p-3">{i.nombre}<br /><span className="text-xs text-slate-400">{i.mensaje}</span></td><td className="p-3"><a className="text-brand-600" href={`tel:${i.telefono}`}>{i.telefono}</a><br />{i.email}</td><td className="p-3"><select className="form-input py-1 text-xs" value={i.estado} onChange={e => cambiar(i.id, e.target.value)}>{['pendiente','contactado','apartado','vendido','cancelado'].map(s => <option key={s}>{s}</option>)}</select></td><td className="p-3 text-xs text-slate-400">{i.creado ? new Date(i.creado).toLocaleString() : ''}</td></tr>)}{items.length === 0 && <tr><td colSpan="5" className="p-10 text-center text-slate-400">No hay solicitudes.</td></tr>}</tbody></table></div></div></section>;
}
