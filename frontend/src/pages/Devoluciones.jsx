import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useInventario } from '../context/InventarioContext';
import { useNotify } from '../componentes/Notification';
import { normalizarSerie } from '../utils/inventario';
import useDocumentTitle from '../utils/useDocumentTitle';
import ConfirmModal from '../componentes/ConfirmModal';

function esVendido(item) {
  return item.flujoSalida || item.flujoVentaML || item.estado?.includes('🔴 VENDIDO');
}

export default function Devoluciones() {
  useDocumentTitle('Devoluciones');
  const { inventario } = useInventario();
  const { notify } = useNotify();
  const navigate = useNavigate();
  const [serie, setSerie] = useState('');
  const [fechaDevolucion, setFechaDevolucion] = useState(new Date().toISOString().split('T')[0]);
  const [motivo, setMotivo] = useState('');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const buscar = () => {
    const norm = normalizarSerie(serie);
    const item = inventario.find(i => normalizarSerie(i.serie) === norm);
    setPreview(null);
    setError('');
    if (!item) { setError('No se encontró equipo con ese número de serie.'); return; }
    if (!esVendido(item)) { setError('El equipo no está marcado como vendido.'); return; }
    if (item.flujoDevolucion && !item.estado?.includes('🔴 VENDIDO')) {
      setError('Este equipo ya tiene una devolución registrada.'); return;
    }
    setPreview(item);
  };

  const handleConfirm = async () => {
    setConfirmOpen(false);
    try {
      await api.devolucion({ codigo: preview.codigo, fechaDevolucion, motivo });
      notify('Devolución registrada', `Equipo ${preview.codigo} en revisión.`, 'success');
      setSerie(''); setMotivo(''); setPreview(null);
      navigate('/base-datos');
    } catch (err) {
      notify('Error', err.message, 'error');
    }
  };

  return (
    <section className="space-y-6 animate-fade-in">
      <div className="animate-slide-up">
        <h2 className="font-display text-2xl font-bold text-slate-900">Devoluciones</h2>
        <p className="text-slate-500 text-sm">Registra devoluciones de equipos vendidos → vuelven a <strong>🟠 Revisión</strong></p>
      </div>
      <form onSubmit={e => { e.preventDefault(); if (preview) setConfirmOpen(true); }} className="panel p-6 md:p-8 space-y-5 max-w-3xl animate-slide-up" style={{ animationDelay: '50ms' }}>
        <div><label className="form-label">Número de serie *</label>
          <div className="flex gap-3">
            <input className="form-input font-mono uppercase flex-1" value={serie} onChange={e => setSerie(e.target.value)} placeholder="S/N del equipo vendido" required />
            <button type="button" onClick={buscar} className="px-5 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-bold">Buscar</button>
          </div></div>
        {error && <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 text-sm">{error}</div>}
        {preview && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-[10px] uppercase text-orange-600 font-bold">Equipo</p><p className="font-semibold">{preview.marca} {preview.modelo}</p></div>
            <div><p className="text-[10px] uppercase text-orange-600 font-bold">Canal previo</p>
              <p className="font-semibold">{preview.flujoVentaML ? 'MERCADO LIBRE' : preview.flujoSalida?.metodoPago || 'VENTA LOCAL'}</p></div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div><label className="form-label">Fecha devolución *</label><input type="date" className="form-input" value={fechaDevolucion} onChange={e => setFechaDevolucion(e.target.value)} required /></div>
          <div><label className="form-label">Motivo *</label><input className="form-input uppercase" value={motivo} onChange={e => setMotivo(e.target.value)} required placeholder="Ej: CLIENTE NO CONFORME" /></div>
        </div>
        <button type="submit" disabled={!preview} className="bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white px-8 py-3 rounded-xl text-sm font-bold hover:scale-[1.02] transition-transform disabled:hover:scale-100">
          <i className="fa-solid fa-rotate-left mr-1" /> Registrar Devolución
        </button>
      </form>
      <ConfirmModal open={confirmOpen} title="Registrar devolución" message={`¿Devolver ${preview?.marca} ${preview?.modelo} (${preview?.serie})? Pasará a 🟠 Revisión.`} confirmLabel="Sí, devolver" onConfirm={handleConfirm} onCancel={() => setConfirmOpen(false)} danger />
    </section>
  );
}
