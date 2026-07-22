import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref as dbRef, get } from 'firebase/database';
import { db } from '../services/firebase';
import { useNotify } from '../componentes/Notification';
import useDocumentTitle from '../utils/useDocumentTitle';
import { useInventario } from '../context/InventarioContext';

const LABEL_SIZES = [
  { key: 'small', label: 'Pequeña (54×25mm)', w: 210, h: 96, fontTitle: 8, fontSub: 6, fontCode: 7 },
  { key: 'medium', label: 'Mediana (100×50mm)', w: 380, h: 190, fontTitle: 12, fontSub: 9, fontCode: 10 },
  { key: 'large', label: 'Grande (100×70mm)', w: 380, h: 266, fontTitle: 14, fontSub: 10, fontCode: 12 },
];

function EtiquetaUnica({ item, size }) {
  const s = LABEL_SIZES.find(l => l.key === size) || LABEL_SIZES[1];
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(item.codigo)}`;

  return (
    <div className="inline-block border border-slate-300 rounded-lg overflow-hidden bg-white print:break-inside-avoid" style={{ width: s.w, padding: 8 }}>
      <div className="flex items-center gap-2">
        <img src={qrUrl} alt="QR" style={{ width: s.h * 0.55, height: s.h * 0.55 }} crossOrigin="anonymous" className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900 truncate" style={{ fontSize: s.fontTitle }}>{item.marca} {item.modelo}</p>
          <p className="text-slate-500 truncate" style={{ fontSize: s.fontSub }}>{item.categoria} · {item.serie}</p>
          <p className="font-mono text-brand-700 font-bold mt-0.5" style={{ fontSize: s.fontCode }}>{item.codigo}</p>
        </div>
      </div>
    </div>
  );
}

function MultiEtiquetas({ items, size }) {
  return (
    <div className="flex flex-wrap gap-3 justify-center p-4">
      {items.map(it => <EtiquetaUnica key={it.codigo} item={it} size={size} />)}
    </div>
  );
}

export default function Etiquetas() {
  useDocumentTitle('Etiquetas');
  const { codigo } = useParams();
  const navigate = useNavigate();
  const { inventario } = useInventario();
  const { notify: toast } = useNotify();
  const [item, setItem] = useState(null);
  const [selected, setSelected] = useState([]);
  const [size, setSize] = useState('medium');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!codigo) return;
    get(dbRef(db, `inventario/${codigo.toUpperCase()}`)).then(snap => {
      if (snap.exists()) setItem({ ...snap.val(), codigo: snap.key });
      else setError('Equipo no encontrado');
    }).catch(() => setError('Error al cargar'));
  }, [codigo]);

  const toggleSelect = (cod) => {
    setSelected(prev => prev.includes(cod) ? prev.filter(c => c !== cod) : [...prev, cod]);
  };

  const filtered = inventario.filter(i =>
    !i.estado?.includes('🔴 VENDIDO') &&
    (i.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     i.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     i.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     i.serie?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedItems = inventario.filter(i => selected.includes(i.codigo));

  const handlePrint = () => window.print();

  if (codigo && !error && !item) {
    return <div className="min-h-screen flex items-center justify-center"><i className="fa-solid fa-spinner fa-spin text-2xl text-slate-400" /></div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500"><p>{error}</p></div>;
  }

  if (item) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 print:p-2 print:bg-white">
        <style>{`@media print { @page { margin: 5mm; } .no-print { display: none !important; } }`}</style>
        <div className="max-w-xl mx-auto space-y-4">
          <div className="no-print flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-200 transition"><i className="fa-solid fa-arrow-left text-slate-600" /></button>
            <h2 className="text-xl font-bold text-slate-800">Etiqueta — {item.codigo}</h2>
          </div>
          <div className="no-print flex gap-2 items-center">
            <label className="text-sm font-bold text-slate-600">Tamaño:</label>
            <select value={size} onChange={e => setSize(e.target.value)} className="form-input text-sm py-1.5">
              {LABEL_SIZES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <button onClick={handlePrint} className="btn-brand px-4 py-1.5 rounded-xl text-white text-sm font-bold ml-auto"><i className="fa-solid fa-print mr-1" /> Imprimir</button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex justify-center">
            <EtiquetaUnica item={item} size={size} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Etiquetas</h2>
          <p className="text-slate-500 text-sm">Selecciona equipos para imprimir etiquetas con QR</p>
        </div>
        <div className="flex gap-2 no-print">
          <select value={size} onChange={e => setSize(e.target.value)} className="form-input text-sm py-1.5">
            {LABEL_SIZES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <button onClick={handlePrint} disabled={selected.length === 0}
            className="btn-brand px-4 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-40">
            <i className="fa-solid fa-print mr-1" /> Imprimir ({selected.length})
          </button>
        </div>
      </div>

      <div className="no-print">
        <input type="text" placeholder="Buscar por código, marca, modelo o serie..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          className="form-input w-full" />
      </div>

      {selectedItems.length > 0 && (
        <div className="no-print bg-brand-50 border border-brand-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-brand-800">{selected.length} etiqueta{selected.length > 1 ? 's' : ''} seleccionada{selected.length > 1 ? 's' : ''}</p>
            <button onClick={() => setSelected([])} className="text-xs font-bold text-brand-500 hover:underline">Limpiar</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedItems.map(it => (
              <span key={it.codigo} onClick={() => toggleSelect(it.codigo)} className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-lg border border-brand-200 text-xs font-bold text-brand-700 cursor-pointer hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition">
                {it.codigo} <i className="fa-solid fa-xmark text-[10px]" />
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left">
                <th className="p-3 w-10">
                  <input type="checkbox" onChange={e => {
                    if (e.target.checked) setSelected(filtered.map(i => i.codigo));
                    else setSelected([]);
                  }} checked={selected.length === filtered.length && filtered.length > 0} className="rounded" />
                </th>
                <th className="p-3 font-bold text-slate-600">Código</th>
                <th className="p-3 font-bold text-slate-600">Equipo</th>
                <th className="p-3 font-bold text-slate-600">Serie</th>
                <th className="p-3 font-bold text-slate-600">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.codigo} className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition ${selected.includes(item.codigo) ? 'bg-brand-50' : ''}`}
                  onClick={() => toggleSelect(item.codigo)}>
                  <td className="p-3"><input type="checkbox" checked={selected.includes(item.codigo)} onChange={() => toggleSelect(item.codigo)} onClick={e => e.stopPropagation()} className="rounded" /></td>
                  <td className="p-3 font-mono font-bold text-brand-700 text-xs">{item.codigo}</td>
                  <td className="p-3">{item.marca} {item.modelo}</td>
                  <td className="p-3 font-mono text-xs text-slate-500">{item.serie}</td>
                  <td className="p-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.estado?.includes('OK') ? 'bg-emerald-100 text-emerald-700' : item.estado?.includes('VENDIDO') ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-700'}`}>{item.estado}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="p-8 text-center text-slate-400 text-sm">No se encontraron equipos</p>}
      </div>

      <div className="print:block hidden">
        <MultiEtiquetas items={selectedItems} size={size} />
      </div>
    </section>
  );
}


