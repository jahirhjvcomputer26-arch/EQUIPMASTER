import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useInventario } from '../context/InventarioContext';
import { useNotify } from '../componentes/Notification';
import { normalizarSerie } from '../utils/inventario';
import useDocumentTitle from '../utils/useDocumentTitle';
import ConfirmModal from '../componentes/ConfirmModal';

export default function MercadoLibre() {
  useDocumentTitle('Venta Mercado Libre');
  const { inventario } = useInventario();
  const { notify } = useNotify();
  const navigate = useNavigate();
  const [serie, setSerie] = useState('');
  const [fechaVenta, setFechaVenta] = useState(new Date().toISOString().split('T')[0]);
  const [notasVenta, setNotasVenta] = useState('');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const buscar = () => {
    const norm = normalizarSerie(serie);
    const item = inventario.find(i => normalizarSerie(i.serie) === norm);
    setPreview(null);
    setError('');
    if (!item) { setError('No se encontró equipo con ese número de serie.'); return; }
    console.log('item.estado ===', JSON.stringify(item.estado));
    if (item.estado !== '🔵 OK') { setError(`Equipo no disponible para ML. Estado: ${item.estado}`); return; }
    setPreview(item);
  };

  const handleConfirm = async () => {
    setConfirmOpen(false);
    if (!preview) return;
    try {
      await api.ventaML({ serie, fechaVenta, notasVenta });
      notify('¡Venta ML!', `Equipo ${preview.codigo} registrado como vendido.`, 'success');
      setSerie(''); setPreview(null); setNotasVenta('');
      navigate('/base-datos');
    } catch (err) {
      notify('Error', err.message, 'error');
    }
  };

  return (
    <section className="space-y-6 animate-fade-in">
      <div className="animate-slide-up">
        <h2 className="font-display text-2xl font-bold text-slate-900">Venta Mercado Libre</h2>
        <p className="text-slate-500 text-sm">Busca por número de serie — solo equipos <strong>🔵 OK</strong> (stock local)</p>
      </div>
      <form onSubmit={e => { e.preventDefault(); if (preview) setConfirmOpen(true); }} className="panel p-6 md:p-8 space-y-5 max-w-3xl animate-slide-up" style={{ animationDelay: '50ms' }}>
        <div className="flex gap-3">
          <div className="flex-1"><label className="form-label">Número de serie *</label>
            <input className="form-input font-mono uppercase" value={serie} onChange={e => setSerie(e.target.value)} placeholder="S/N del equipo" required /></div>
          <div className="flex items-end"><button type="button" onClick={buscar} className="px-5 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-bold">Buscar</button></div>
        </div>
        {error && <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 text-sm"><i className="fa-solid fa-triangle-exclamation mr-1" />{error}</div>}
        {preview && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-3">
            <p className="font-bold text-emerald-900">{preview.marca} {preview.modelo} · {preview.categoria}</p>
            <p className="text-sm text-emerald-700">Código: {preview.codigo} · Serie: {preview.serie}</p>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="form-label">Fecha venta</label><input type="date" className="form-input" value={fechaVenta} onChange={e => setFechaVenta(e.target.value)} /></div>
              <div><label className="form-label">Notas</label><input className="form-input uppercase" value={notasVenta} onChange={e => setNotasVenta(e.target.value)} /></div>
            </div>
          </div>
        )}
        <button type="submit" disabled={!preview} className="btn-brand text-white px-8 py-3 rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] transition-transform disabled:hover:scale-100">
          <i className="fa-solid fa-warehouse mr-1" /> Registrar Venta ML
        </button>
      </form>
      <ConfirmModal open={confirmOpen} title="Confirmar venta ML" message={`¿Registrar venta de ${preview?.codigo} · ${preview?.marca} ${preview?.modelo}?`} confirmLabel="Sí, vender" onConfirm={handleConfirm} onCancel={() => setConfirmOpen(false)} danger />
    </section>
  );
}
