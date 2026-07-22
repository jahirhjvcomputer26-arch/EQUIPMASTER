import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { useNotify } from '../componentes/Notification';
import { useInventario } from '../context/InventarioContext';
import useDocumentTitle from '../utils/useDocumentTitle';
import ConfirmModal from '../componentes/ConfirmModal';

export default function Prestamos() {
  useDocumentTitle('Préstamos');
  const { inventario } = useInventario();
  const { notify } = useNotify();
  const [prestamos, setPrestamos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serie, setSerie] = useState('');
  const [modelo, setModelo] = useState('');
  const [procesador, setProcesador] = useState('');
  const [responsable, setResponsable] = useState('');
  const [area, setArea] = useState('MARKETING');
  const [fechaSalida, setFechaSalida] = useState(new Date().toISOString().split('T')[0]);
  const [notas, setNotas] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [devolverId, setDevolverId] = useState(null);
  const [editando, setEditando] = useState(null);

  useEffect(() => {
    api.getPrestamos().then(data => { setPrestamos(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const recargar = () => {
    api.getPrestamos().then(setPrestamos);
  };

  const handleSerieChange = (val) => {
    const q = val.toUpperCase().trim();
    setSerie(val);
    if (q) {
      const item = inventario.find(i =>
        (i.serie || '').toUpperCase() === q || (i.codigo || '').toUpperCase() === q
      );
      if (item) {
        setModelo(`${item.marca} ${item.modelo}`.trim());
        setProcesador(item.procesador || '');
      }
    } else if (!editando) {
      setModelo('');
      setProcesador('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setConfirmOpen(true);
  };

  const confirmarPrestamo = async () => {
    setConfirmOpen(false);
    try {
      if (editando) {
        const body = { serie, modelo, procesador, responsable, area, fechaSalida, notas, activo: true };
        await fetch(`/api/prestamos/${editando}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('equipmaster_token')}` },
          body: JSON.stringify(body),
        });
        notify('Préstamo actualizado', 'Datos modificados correctamente.', 'success');
      } else {
        await api.crearPrestamo({ serie, modelo, procesador, responsable, area, fechaSalida, notas });
        notify('Préstamo registrado', `${serie} prestado a ${responsable}`, 'success');
      }
      cancelarEdicion();
      recargar();
    } catch (err) {
      notify('Error', err.message, 'error');
    }
  };

  const handleDevolver = async (id) => {
    try {
      await api.devolverPrestamo(id);
      notify('Equipo devuelto', 'Préstamo cerrado correctamente.', 'success');
      recargar();
    } catch (err) {
      notify('Error', err.message, 'error');
    }
  };

  const handleRenovar = async (p) => {
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const renovaciones = (p.renovaciones || 0) + 1;
      await fetch(`/api/prestamos/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('equipmaster_token')}` },
        body: JSON.stringify({ fechaSalida: hoy, renovaciones }),
      });
      notify('Préstamo renovado', `Fecha reiniciada a hoy (${renovaciones}x renovado)`, 'success');
      recargar();
    } catch (err) {
      notify('Error', err.message, 'error');
    }
  };

  const activos = prestamos.filter(p => p.activo);
  const historial = prestamos.filter(p => !p.activo);

  const iniciarEdicion = (p) => {
    setEditando(p.id);
    setSerie(p.serie);
    setModelo(p.modelo || '');
    setProcesador(p.procesador || '');
    setResponsable(p.responsable);
    setArea(p.area);
    setFechaSalida(p.fechaSalida);
    setNotas(p.notas || '');
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setSerie(''); setModelo(''); setProcesador(''); setResponsable(''); setNotas(''); setArea('MARKETING');
    setFechaSalida(new Date().toISOString().split('T')[0]);
  };

  return (
    <section className="space-y-6 animate-fade-in">
      <div className="animate-slide-up">
        <h2 className="font-display text-2xl font-bold text-slate-900">Préstamo de Equipos</h2>
        <p className="text-slate-500 text-sm">Registra salidas temporales — Área <strong>Marketing</strong></p>
      </div>

      <form onSubmit={handleSubmit} onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleSubmit(e); } }} className="panel p-6 md:p-8 space-y-5 max-w-3xl animate-slide-up" style={{ animationDelay: '50ms' }}>
        {editando && <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-sm font-bold"><i className="fa-solid fa-pen mr-1" /> Editando préstamo</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div><label className="form-label">Número de serie *</label>
            <input className="form-input font-mono uppercase" value={serie} onChange={e => handleSerieChange(e.target.value)} required placeholder="S/N del equipo — auto-busca" title="Número de serie del equipo — modelo y procesador se llenan automáticamente" /></div>
          <div><label className="form-label">Modelo</label>
            <input className="form-input uppercase" value={modelo} onChange={e => setModelo(e.target.value)} placeholder="Ej: HP PROBOOK 450 G10" title="Modelo exacto del equipo" /></div>
          <div><label className="form-label">Procesador</label>
            <input className="form-input uppercase" value={procesador} onChange={e => setProcesador(e.target.value)} placeholder="Ej: INTEL CORE I5-12400F" title="Procesador del equipo" /></div>
          <div><label className="form-label">Responsable *</label>
            <input className="form-input uppercase" value={responsable} onChange={e => setResponsable(e.target.value)} required placeholder="Nombre de quien lo recibe" title="Persona que recibe el equipo" /></div>
          <div><label className="form-label">Área *</label>
            <select className="form-input" value={area} onChange={e => setArea(e.target.value)}>
              <option value="MARKETING">MARKETING</option>
              <option value="VENTAS">VENTAS</option>
              <option value="ADMINISTRACIÓN">ADMINISTRACIÓN</option>
              <option value="OTRO">OTRO</option>
            </select></div>
          <div><label className="form-label">Fecha de salida</label>
            <input type="date" className="form-input" value={fechaSalida} onChange={e => setFechaSalida(e.target.value)} /></div>
          <div><label className="form-label">Notas</label>
            <input className="form-input uppercase" value={notas} onChange={e => setNotas(e.target.value)} placeholder="Ej: CÁMARA WEB LOGITECH" title="Notas adicionales del préstamo" /></div>
        </div>
        <div className="flex gap-3">
          <button type="submit" className="btn-brand text-white px-8 py-3 rounded-xl text-sm font-bold hover:scale-[1.02] transition-transform">
            <i className={`fa-solid ${editando ? 'fa-pen' : 'fa-hand-holding'} mr-1`} /> {editando ? 'Actualizar Préstamo' : 'Registrar Préstamo'}
          </button>
          {editando && (
            <button type="button" onClick={cancelarEdicion} className="px-5 py-3 rounded-xl border border-slate-300 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="panel overflow-hidden animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Préstamos activos ({activos.length})</h3>
        </div>
        {loading ? (
          <div className="p-12 text-center text-slate-400"><i className="fa-solid fa-spinner fa-spin text-xl" /></div>
        ) : activos.length === 0 ? (
          <div className="p-12 text-center text-slate-400"><i className="fa-solid fa-box-open text-3xl mb-2" /><p className="text-sm">No hay préstamos activos</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm table-responsive">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase">Serie</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase">Modelo</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase">Responsable</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase">Área</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase">Salida</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activos.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-brand-600" data-label="Serie">{p.serie}</td>
                    <td className="px-6 py-4" data-label="Modelo">{p.modelo || <span className="text-slate-400">—</span>}</td>
                    <td className="px-6 py-4 font-medium" data-label="Responsable">{p.responsable}</td>
                    <td className="px-6 py-4" data-label="Área"><span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">{p.area}</span></td>
                    <td className="px-6 py-4 text-slate-500 text-xs" data-label="Salida">{p.fechaSalida}</td>
                    <td className="px-6 py-4 text-center" data-label="">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => iniciarEdicion(p)} title="Editar préstamo" className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-600 hover:bg-white transition">
                          <i className="fa-solid fa-pen mr-1" /> Editar
                        </button>
                        <button onClick={() => handleRenovar(p)} title="Renovar préstamo (reinicia contador)" className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition">
                          <i className="fa-solid fa-rotate-right mr-1" /> Renovar
                        </button>
                        <button onClick={() => handleDevolver(p.id)} title="Marcar como devuelto" className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition">
                          <i className="fa-solid fa-rotate-left mr-1" /> Devolver
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {historial.length > 0 && (
        <div className="panel overflow-hidden animate-fade-in">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-500">Historial de devoluciones ({historial.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm table-responsive">
              <thead className="bg-slate-50 text-slate-400">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase">Serie</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase">Modelo</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase">Responsable</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase">Salida</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase">Devolución</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historial.map(p => (
                  <tr key={p.id} className="text-slate-500">
                    <td className="px-6 py-4 font-mono" data-label="Serie">{p.serie}</td>
                    <td className="px-6 py-4" data-label="Modelo">{p.modelo || '—'}</td>
                    <td className="px-6 py-4" data-label="Responsable">{p.responsable}</td>
                    <td className="px-6 py-4 text-xs" data-label="Salida">{p.fechaSalida}</td>
                    <td className="px-6 py-4 text-xs" data-label="Devolución">{p.fechaDevolucion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal open={confirmOpen} title="Confirmar préstamo"
        message={`¿Prestar equipo ${serie} a ${responsable}?`}
        confirmLabel="Sí, registrar" onConfirm={confirmarPrestamo} onCancel={() => setConfirmOpen(false)} />
    </section>
  );
}
