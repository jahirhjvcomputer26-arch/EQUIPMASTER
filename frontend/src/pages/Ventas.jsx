import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useInventario } from '../context/InventarioContext';
import { useNotify } from '../componentes/Notification';
import { METODOS_PAGO, TECNICOS } from '../utils/inventario';
import useDocumentTitle from '../utils/useDocumentTitle';
import ConfirmModal from '../componentes/ConfirmModal';

export default function Ventas() {
  useDocumentTitle('Venta Local');
  const { inventario } = useInventario();
  const { notify } = useNotify();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [form, setForm] = useState({
    codigo: '', cliente: '', precio: '', metodoPago: 'EFECTIVO',
    fechaSalida: new Date().toISOString().split('T')[0], tecnicoEntrega: '', notasSalida: '',
  });
  const [serieBuscar, setSerieBuscar] = useState('');
  const [info, setInfo] = useState({ encontrado: false, equipo: '', estado: '', codigo: '' });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editandoVenta, setEditandoVenta] = useState(null);
  const [eliminarConfirm, setEliminarConfirm] = useState(null);

  const ventasRealizadas = inventario.filter(i => i.flujoSalida).sort((a, b) => {
    const da = a.flujoSalida?.fechaSalida || '';
    const db = b.flujoSalida?.fechaSalida || '';
    return db.localeCompare(da);
  });

  const buscar = () => {
    const q = serieBuscar.toUpperCase().trim();
    if (!q) return notify('Aviso', 'Ingresa un número de serie', 'error');
    const item = inventario.find(i =>
      (i.serie || '').toUpperCase() === q || (i.codigo || '').toUpperCase() === q
    );
    if (!item) {
      setInfo({ encontrado: false, equipo: '', estado: '', codigo: '' });
      setForm(f => ({ ...f, codigo: '' }));
      return notify('No encontrado', 'No hay equipo con ese código o serie', 'error');
    }
    if (!editandoVenta && item.estado !== '🔵 OK') {
      setInfo({ encontrado: false, equipo: '', estado: item.estado, codigo: '' });
      setForm(f => ({ ...f, codigo: '' }));
      return notify('Equipo no disponible', `Estado actual: ${item.estado}. Solo se venden equipos 🔵 OK`, 'error');
    }
    setForm(f => ({ ...f, codigo: item.codigo }));
    setInfo({
      encontrado: true,
      equipo: `${item.marca} - ${item.modelo} (${item.procesador})`,
      estado: item.estado,
      codigo: item.codigo,
      serie: item.serie,
    });
  };

  const handleEliminar = async () => {
    const codigo = eliminarConfirm;
    setEliminarConfirm(null);
    try {
      await api.eliminarVentaLocal(codigo);
      notify('Venta eliminada', `Equipo ${codigo} regresa a 🔵 OK`, 'success');
    } catch (err) {
      notify('Error', err.message, 'error');
    }
  };

  const limpiarForm = () => {
    setForm({ codigo: '', cliente: '', precio: '', metodoPago: 'EFECTIVO', fechaSalida: new Date().toISOString().split('T')[0], tecnicoEntrega: '', notasSalida: '' });
    setSerieBuscar('');
    setInfo({ encontrado: false, equipo: '', estado: '', codigo: '' });
    setEditandoVenta(null);
  };

  const handleConfirm = async () => {
    setConfirmOpen(false);
    try {
      if (editandoVenta) {
        await api.editarVentaLocal(form.codigo, form);
        notify('Venta actualizada', `Equipo ${form.codigo} actualizado.`, 'success');
      } else {
        await api.ventaLocal(form);
        notify('¡Salida Exitosa!', `Equipo ${form.codigo} vendido.`, 'success');
      }
      limpiarForm();
    } catch (err) {
      notify('Error', err.message, 'error');
    }
  };

  const editarVenta = (item) => {
    const v = item.flujoSalida;
    setEditandoVenta(item.codigo);
    setForm({
      codigo: item.codigo,
      cliente: v.cliente?.replace(/^\$/, '') || '',
      precio: (v.precio || '').replace('$', ''),
      metodoPago: v.metodoPago || 'EFECTIVO',
      fechaSalida: v.fechaSalida || new Date().toISOString().split('T')[0],
      tecnicoEntrega: v.tecnicoEntrega || '',
      notasSalida: v.notasSalida || '',
    });
    setSerieBuscar(item.serie || item.codigo);
    setInfo({
      encontrado: true,
      equipo: `${item.marca} - ${item.modelo} (${item.procesador})`,
      estado: item.estado,
      codigo: item.codigo,
      serie: item.serie,
    });
  };

  return (
    <section className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">{editandoVenta ? '✏️ Modificar Venta' : 'Venta Local'}</h2>
          <p className="text-slate-500 text-sm">{editandoVenta ? 'Editando venta existente' : 'Solo equipos con estado <strong>🔵 OK</strong>'}</p>
        </div>
        {editandoVenta && (
          <button type="button" onClick={limpiarForm} className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
            <i className="fa-solid fa-times mr-1" /> Cancelar edición
          </button>
        )}
      </div>
      <form onSubmit={e => { e.preventDefault(); if (!info.encontrado) return notify('Aviso', 'Busca un equipo antes de vender', 'error'); setConfirmOpen(true); }} onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); buscar(); } }} className="panel p-6 md:p-8 space-y-5 max-w-3xl animate-slide-up" style={{ animationDelay: '50ms' }}>
        {editandoVenta && <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-sm font-bold"><i className="fa-solid fa-pen mr-1" /> Modo edición — modificando venta de <span className="font-mono">{editandoVenta}</span></div>}
        <div>
          <label className="form-label">Buscar equipo por número de serie *</label>
          <div className="flex gap-2">
            <input ref={inputRef} className="form-input font-mono uppercase flex-1" value={serieBuscar} onChange={e => setSerieBuscar(e.target.value)} placeholder="Ingresa el S/N del equipo..." title="Número de serie grabado en el equipo" />
            <button type="button" onClick={buscar} className="px-5 py-2.5 btn-brand rounded-xl text-sm font-bold text-white transition flex items-center gap-2">
              <i className="fa-solid fa-search" /> Buscar
            </button>
          </div>
        </div>
        {info.encontrado && (
          <div className="grid grid-cols-2 gap-4 bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
            <div><p className="text-[10px] uppercase text-emerald-700 font-bold">Equipo</p><p className="font-semibold text-emerald-900">{info.equipo}</p></div>
            <div><p className="text-[10px] uppercase text-emerald-700 font-bold">Código</p><p className="font-semibold text-emerald-900 font-mono">{info.codigo}</p></div>
            <div><p className="text-[10px] uppercase text-emerald-700 font-bold">Serie</p><p className="font-semibold text-emerald-900 font-mono">{info.serie}</p></div>
            <div><p className="text-[10px] uppercase text-emerald-700 font-bold">Estado</p><p className="font-semibold text-emerald-900">{info.estado}</p></div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div><label className="form-label">Cliente *</label><input className="form-input uppercase" value={form.cliente} onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))} required title="Nombre completo del cliente" /></div>
          <div><label className="form-label">Precio *</label><input type="number" className="form-input" value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} required title="Monto en pesos mexicanos" /></div>
          <div><label className="form-label">Forma de pago *</label>
            <select className="form-input" value={form.metodoPago} onChange={e => setForm(f => ({ ...f, metodoPago: e.target.value }))}>
              {METODOS_PAGO.map(m => <option key={m}>{m}</option>)}
            </select></div>
          <div><label className="form-label">Fecha de salida *</label><input type="date" className="form-input" value={form.fechaSalida} onChange={e => setForm(f => ({ ...f, fechaSalida: e.target.value }))} required /></div>
          <div><label className="form-label">Entregado por *</label>
            <select className="form-input" value={form.tecnicoEntrega} onChange={e => setForm(f => ({ ...f, tecnicoEntrega: e.target.value }))} required>
              <option value="">Selecciona...</option>{TECNICOS.map(t => <option key={t}>{t}</option>)}
            </select></div>
          <div><label className="form-label">Notas</label><input className="form-input uppercase" value={form.notasSalida} onChange={e => setForm(f => ({ ...f, notasSalida: e.target.value }))} title="Información adicional de la venta" /></div>
        </div>
        <button type="submit" className="btn-brand text-white px-8 py-3 rounded-xl text-sm font-bold hover:scale-[1.02] transition-transform">
          <i className={"fa-solid mr-1 " + (editandoVenta ? 'fa-floppy-disk' : 'fa-store')} /> {editandoVenta ? 'Guardar Cambios' : 'Registrar Venta'}
        </button>
      </form>
      <ConfirmModal open={confirmOpen} title={editandoVenta ? 'Confirmar cambios' : 'Confirmar venta'}
        message={editandoVenta ? `¿Actualizar venta de ${form.codigo} a ${form.cliente} por $${form.precio}?` : `¿Registrar venta de ${form.codigo} a ${form.cliente} por $${form.precio}?`}
        confirmLabel={editandoVenta ? 'Sí, actualizar' : 'Sí, vender'} onConfirm={handleConfirm} onCancel={() => setConfirmOpen(false)} danger />
      <ConfirmModal open={!!eliminarConfirm} title="Eliminar venta"
        message={`¿Eliminar la venta de ${eliminarConfirm}? El equipo regresará al estado en el que estaba antes de la venta`}
        confirmLabel="Sí, eliminar" onConfirm={handleEliminar} onCancel={() => setEliminarConfirm(null)} danger />

      {ventasRealizadas.length > 0 && !editandoVenta && (
        <div className="panel overflow-hidden animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-700">Últimas ventas realizadas ({ventasRealizadas.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm table-responsive">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold uppercase">Código</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase">Equipo</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase">Cliente</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase">Precio</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase">Salida</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ventasRealizadas.slice(0, 10).map((item, idx) => (
                  <tr key={item.codigo} className="hover:bg-slate-50 transition-colors table-row-enter" style={{ animationDelay: idx * 25 + 'ms' }}>
                    <td className="px-4 py-3 font-mono font-bold text-xs text-brand-600" data-label="Código">{item.codigo}</td>
                    <td className="px-4 py-3" data-label="Equipo">
                      <span className="font-bold text-sm">{item.marca}</span>
                      <p className="text-xs text-slate-400">{item.modelo}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium" data-label="Cliente">{item.flujoSalida?.cliente}</td>
                    <td className="px-4 py-3 text-sm font-bold" data-label="Precio">{item.flujoSalida?.precio}</td>
                    <td className="px-4 py-3 text-xs text-slate-500" data-label="Salida">{item.flujoSalida?.fechaSalida}</td>
                    <td className="px-4 py-3 text-center" data-label="">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => editarVenta(item)} className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-600 hover:bg-white transition">
                          <i className="fa-solid fa-pen mr-1" /> Editar
                        </button>
                        <button onClick={() => setEliminarConfirm(item.codigo)} className="px-3 py-1.5 rounded-lg border border-rose-300 text-xs font-bold text-rose-600 hover:bg-rose-50 transition">
                          <i className="fa-solid fa-trash-can mr-1" /> Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
