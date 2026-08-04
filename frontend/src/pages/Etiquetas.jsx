import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useNotify } from '../componentes/Notification';
import useDocumentTitle from '../utils/useDocumentTitle';
import { useInventario } from '../context/InventarioContext';
import { EtiquetaUnica, LABEL_SIZES, printStyles } from '../componentes/EtiquetaQR';
import ModalImprimirEtiqueta from '../componentes/EtiquetaQR';

function MultiEtiquetas({ items, size }) {
  return (
    <div className="flex flex-wrap gap-3 justify-center p-4 print:p-0 print:gap-0 print:justify-start print:block">
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
  const [size, setSize] = useState('2b51x25');
  const [imprimirItem, setImprimirItem] = useState(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!codigo) return;
    api.getEquipo(codigo.toUpperCase())
      .then(data => setItem(data))
      .catch(() => setError('Equipo no encontrado'));
  }, [codigo]);

  useEffect(() => {
    document.body.classList.add('printing-labels');
    return () => document.body.classList.remove('printing-labels');
  }, []);

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
      <div className="min-h-screen bg-slate-50 p-6">
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
          <div className="no-print bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
            <p><b>Para impresora de etiquetas:</b></p>
            <p>1. En el diálogo de impresión elige tu impresora térmica y selecciona el tamaño de papel {(LABEL_SIZES.find(s => s.key === size) || {}).mm} (o papel personalizado). Debe mostrar 1 página.</p>
            <p>2. Escala al 100%, márgenes "Ninguno" y desactiva "Encabezados y pies de página".</p>
          </div>
          <div className="no-print bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex justify-center">
            <EtiquetaUnica item={item} size={size} />
          </div>
        </div>
        {createPortal(
          <div className="print-only">
            <style>{printStyles(size)}</style>
            <EtiquetaUnica item={item} size={size} />
          </div>,
          document.body
        )}
      </div>
    );
  }

  return (
    <>
    <section className="space-y-6 no-print">
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
                <th className="p-3 w-16 text-center font-bold text-slate-600">Etiqueta</th>
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
                  <td className="p-3 text-center">
                    <button onClick={e => { e.stopPropagation(); setImprimirItem(item); }}
                      title={`Imprimir etiqueta de ${item.codigo}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 transition">
                      <i className="fa-solid fa-print text-[10px]" /> Imprimir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="p-8 text-center text-slate-400 text-sm">No se encontraron equipos</p>}
      </div>
    </section>

    {createPortal(
      <div className="print-only">
        <style>{printStyles(size)}</style>
        <MultiEtiquetas items={selectedItems} size={size} />
      </div>,
      document.body
    )}

    {imprimirItem && (
      <ModalImprimirEtiqueta item={imprimirItem} onClose={() => setImprimirItem(null)} />
    )}
    </>
  );
}


