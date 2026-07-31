import { useEffect, useState } from 'react';
import { ref, get } from 'firebase/database';
import { db } from '../services/firebase';
import { badgeEstado, formatearFechaRegistro, nombreEquipo } from '../utils/inventario';

export default function ConsultaPublica() {
  const [query, setQuery] = useState('');
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const consultar = async (texto) => {
    const q = (texto || '').toUpperCase().trim();
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
        i.codigo?.toUpperCase() === q ||
        i.serie?.toUpperCase() === q ||
        i.sku?.toUpperCase() === q
      );
      if (!found) { setError('Equipo no encontrado con ese código o serie'); return; }
      setResultado(found);
    } catch (err) {
      setError('Error al consultar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q');
    if (q) {
      setQuery(q);
      consultar(q);
    }
  }, []);

  const buscar = (e) => {
    e.preventDefault();
    consultar(query);
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
            <div className="mt-6 border border-slate-200 rounded-2xl p-5 text-left space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-display font-bold text-slate-900 leading-tight">{nombreEquipo(resultado.marca, resultado.modelo)}</p>
                  <p className="text-xs text-slate-500">{resultado.categoria}</p>
                </div>
                <span className={"px-3 py-1 rounded-full text-xs font-bold shrink-0 " + badgeEstado(resultado.estado)}>
                  {resultado.estado}
                </span>
              </div>
              <hr className="border-slate-100" />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-slate-400 text-xs">Código</span><p className="font-mono font-bold">{resultado.codigo}</p></div>
                <div><span className="text-slate-400 text-xs">Serie</span><p className="font-mono">{resultado.serie}</p></div>
                <div><span className="text-slate-400 text-xs">SKU</span><p className="font-mono">{resultado.sku || 'N/A'}</p></div>
                <div><span className="text-slate-400 text-xs">Ingreso</span><p>{formatearFechaRegistro(resultado.fechaRegistro)}</p></div>
              </div>
              <hr className="border-slate-100" />
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between gap-2"><span className="text-slate-400 text-xs shrink-0">Procesador</span><span className="text-right font-medium">{resultado.procesador || 'N/A'}</span></div>
                <div className="flex justify-between gap-2"><span className="text-slate-400 text-xs shrink-0">Memoria RAM</span><span className="text-right font-medium">{resultado.ram ? `${resultado.ram}${resultado.tipoRam ? ' · ' + resultado.tipoRam : ''}` : 'N/A'}</span></div>
                <div className="flex justify-between gap-2"><span className="text-slate-400 text-xs shrink-0">Disco duro</span><span className="text-right font-medium">{resultado.almacenamiento ? `${resultado.almacenamiento}${resultado.tipoDisco ? ' · ' + resultado.tipoDisco : ''}` : 'N/A'}</span></div>
                <div className="flex justify-between gap-2"><span className="text-slate-400 text-xs shrink-0">Gráfica</span><span className="text-right font-medium">{resultado.grafica || 'N/A'}</span></div>
              </div>
            </div>
          )}
        </div>
        <p className="text-center text-[11px] text-white/50">JV COMPUTER · Sistema de Consulta Pública</p>
      </div>
    </div>
  );
}
