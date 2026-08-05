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
    const campos = ['codigo','serie','sku','marca','modelo','procesador','ram','almacenamiento','tipoDisco','grafica','color','tecnico','estado','generacion','tipoRam','resolucion','sistemaOperativo','wifi','bluetooth','bateria','cargador','pantalla','anio','observaciones'];
    const out = [];
    for (const i of inventario) {
      for (const c of campos) {
        const v = (i[c] || '').toString().toLowerCase();
        if (v.includes(s)) { out.push({ ...i, match: c }); break; }
      }
      if (out.length >= 15) break;
    }
    return out;
  }, [q, inventario]);

  const matchLabel = {
    codigo: 'Código', serie: 'Serie', sku: 'SKU', marca: 'Marca', modelo: 'Modelo',
    procesador: 'CPU', ram: 'RAM', almacenamiento: 'Disco', tipoDisco: 'Tipo Disco',
    grafica: 'Gráfica', color: 'Color', tecnico: 'Técnico', estado: 'Estado',
    generacion: 'Generación', tipoRam: 'Tipo RAM', resolucion: 'Resolución',
    sistemaOperativo: 'SO', wifi: 'WiFi', bluetooth: 'Bluetooth',
    bateria: 'Batería', cargador: 'Cargador', pantalla: 'Pantalla', anio: 'Año',
    observaciones: 'Notas',
  };

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
                  <p className="text-xs text-slate-400 truncate font-mono">{item.codigo} · <span className="text-brand-600 font-semibold">{matchLabel[item.match]}</span></p>
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
