import { useState } from 'react';
import { ref, get } from 'firebase/database';
import { db } from '../services/firebase';
import { badgeEstado } from '../utils/inventario';

export default function ConsultaPublica() {
  const [query, setQuery] = useState('');
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const buscar = async (e) => {
    e.preventDefault();
    const q = query.toUpperCase().trim();
    if (!q) return;
    setLoading(true);
    setError('');
    setResultado(null);
    try {
      const snap = await get(ref(db, 'inventario'));
      const data = snap.val();
      if (!data) { setError('No hay equipos registrados'); return; }
      const items = Object.values(data);
      const found = items.find(i =>
        i.codigo?.toUpperCase() === q || i.serie?.toUpperCase() === q
      );
      if (!found) { setError('Equipo no encontrado con ese código o serie'); return; }
      setResultado(found);
    } catch (err) {
      setError('Error al consultar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #000856 0%, #0018B0 50%, #000856 100%)' }}>
      <div className="w-full max-w-md">
        <div className="bg-white/95 rounded-3xl p-8 text-center shadow-2xl mb-4">
          <img src="/logo-empresa.png" alt="JV COMPUTER" className="max-h-16 object-contain mx-auto mb-4" />
          <h1 className="font-display text-xl font-bold text-slate-900">Consulta tu equipo</h1>
          <p className="text-slate-500 text-sm mb-6">Ingresa el código o número de serie</p>

          <form onSubmit={buscar} className="flex gap-2">
            <input className="form-input uppercase flex-1" value={query}
              onChange={e => setQuery(e.target.value)} placeholder="INV-1000 o S/N..." />
            <button type="submit" disabled={loading}
              className="btn-brand px-5 py-2.5 rounded-xl text-white text-sm font-bold">
              <i className={"fa-solid " + (loading ? 'fa-spinner fa-spin' : 'fa-search')} />
            </button>
          </form>

          {error && <p className="text-rose-600 text-sm mt-4 font-medium">{error}</p>}

          {resultado && (
            <div className="mt-6 border border-slate-200 rounded-2xl p-5 text-left space-y-2 animate-fade-in">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase">Estado</span>
                <span className={"px-3 py-1 rounded-full text-xs font-bold " + badgeEstado(resultado.estado)}>
                  {resultado.estado}
                </span>
              </div>
              <hr className="border-slate-100" />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-slate-400 text-xs">Código</span><p className="font-mono font-bold">{resultado.codigo}</p></div>
                <div><span className="text-slate-400 text-xs">Serie</span><p className="font-mono">{resultado.serie}</p></div>
              </div>
              <div><span className="text-slate-400 text-xs">Equipo</span><p className="font-bold">{resultado.marca} {resultado.modelo}</p></div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                <div><span className="block text-slate-400">Procesador</span>{resultado.procesador}</div>
                <div><span className="block text-slate-400">RAM / Disco</span>{resultado.ram} / {resultado.almacenamiento}</div>
              </div>
              {resultado.fechaIngreso && <p className="text-[10px] text-slate-400">Registrado: {resultado.fechaIngreso}</p>}
            </div>
          )}
        </div>
        <p className="text-center text-[11px] text-white/50">JV COMPUTER · Sistema de Consulta Pública</p>
      </div>
    </div>
  );
}
