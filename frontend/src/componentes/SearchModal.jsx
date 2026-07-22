import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventario } from '../context/InventarioContext';

export default function SearchModal({ open, onClose }) {
  const { inventario } = useInventario();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else setQ('');
  }, [open]);

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const s = q.toLowerCase();
    return inventario.filter(i =>
      (i.codigo || '').toLowerCase().includes(s) ||
      (i.serie || '').toLowerCase().includes(s) ||
      (i.marca || '').toLowerCase().includes(s) ||
      (i.modelo || '').toLowerCase().includes(s) ||
      (i.sku || '').toLowerCase().includes(s) ||
      (i.procesador || '').toLowerCase().includes(s) ||
      (i.ram || '').toLowerCase().includes(s) ||
      (i.almacenamiento || '').toLowerCase().includes(s) ||
      (i.grafica || '').toLowerCase().includes(s) ||
      (i.color || '').toLowerCase().includes(s) ||
      (i.tecnico || '').toLowerCase().includes(s) ||
      (i.estado || '').toLowerCase().includes(s) ||
      (i.tipoDisco || '').toLowerCase().includes(s) ||
      (i.generacion || '').toLowerCase().includes(s)
    ).slice(0, 10);
  }, [q, inventario]);

  const select = (item) => {
    onClose();
    navigate(`/inventario?editar=${item.codigo}`);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[15vh] animate-fade-in">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden animate-slide-up">
        <div className="flex items-center gap-3 p-4 border-b border-slate-200">
          <i className="fa-solid fa-search text-slate-400" />
          <input ref={inputRef} className="flex-1 border-0 outline-none text-base bg-transparent text-slate-900 placeholder:text-slate-400" value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por código, serie, marca, modelo, procesador, RAM..." />
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">ESC</span>
        </div>
        {results.length > 0 && (
          <div className="max-h-72 overflow-y-auto">
            {results.map(item => (
              <button key={item.codigo} onClick={() => select(item)} className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-bold">{item.codigo?.replace('INV-', '')}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-900 truncate">{item.marca} {item.modelo}</p>
                  <p className="text-xs text-slate-400 truncate font-mono">S/N: {item.serie} · {item.estado}</p>
                </div>
                <i className="fa-solid fa-chevron-right text-slate-300 text-xs" />
              </button>
            ))}
          </div>
        )}
        {q.trim() && results.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-sm">Sin resultados para <strong>"{q}"</strong></div>
        )}
      </div>
    </div>
  );
}
