import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { nombreEquipo } from '../utils/inventario';
import { APP_URL } from '../config.js';

export const LABEL_SIZES = [
  { key: '2b51x25', label: '4Barcode 51×25mm', w: 178, h: 90, mm: '51mm 25mm', fontTitle: 10, fontSub: 7, fontCode: 8 },
  { key: '2bqr', label: 'QR solo 51×25mm', w: 178, h: 90, mm: '51mm 25mm', fontTitle: 10, fontSub: 7, fontCode: 8, solo: true },
  { key: 'medium', label: 'Mediana (100×50mm)', w: 368, h: 182, mm: '100mm 50mm', fontTitle: 12, fontSub: 9, fontCode: 10 },
  { key: 'large', label: 'Grande (100×70mm)', w: 368, h: 256, mm: '100mm 70mm', fontTitle: 14, fontSub: 10, fontCode: 12 },
];

export const printStyles = (sizeKey) => {
  const s = LABEL_SIZES.find(l => l.key === sizeKey) || LABEL_SIZES[0];
  return `
    @page { size: ${s.mm}; margin: 0; }
    @media print {
      html, body { margin: 0; padding: 0; width: 100%; height: auto; }
      * { box-sizing: border-box; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .print-label { display: block; margin: 0; break-inside: avoid; page-break-inside: avoid; overflow: hidden; }
      .print-label + .print-label { page-break-before: always; }
    }
  `;
};

export function EtiquetaUnica({ item, size }) {
  const s = LABEL_SIZES.find(l => l.key === size) || LABEL_SIZES[0];
  const qrSize = Math.round(s.h * (s.solo ? 0.78 : 0.55));
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&ecc=L&qzone=3&margin=2&data=${encodeURIComponent(
    APP_URL + '/consulta?q=' + item.codigo
  )}`;

  if (s.solo) {
    return (
      <div className="inline-block border border-slate-300 rounded-lg overflow-hidden bg-white print-label flex items-center justify-center" style={{ width: s.w, height: s.h, padding: 4 }}>
        <div className="bg-white shrink-0" style={{ width: qrSize, height: qrSize }}>
          <img src={qrUrl} alt="QR" width={qrSize} height={qrSize} crossOrigin="anonymous" className="w-full h-full object-contain" />
        </div>
      </div>
    );
  }

  return (
    <div className="inline-block border border-slate-300 rounded-lg overflow-hidden bg-white print-label" style={{ width: s.w, height: s.h, padding: 5 }}>
      <div className="flex items-center gap-2 h-full">
        <div className="bg-white shrink-0" style={{ width: qrSize, height: qrSize }}>
          <img src={qrUrl} alt="QR" width={qrSize} height={qrSize} crossOrigin="anonymous" className="w-full h-full object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-extrabold text-black truncate" style={{ fontSize: s.fontTitle }}>{nombreEquipo(item.marca, item.modelo)}</p>
          {(item.categoria || item.serie) && (
            <p className="text-slate-700 truncate" style={{ fontSize: s.fontSub }}>{[item.categoria, item.serie].filter(Boolean).join(' · ')}</p>
          )}
          <p className="font-mono text-brand-700 font-extrabold mt-0.5" style={{ fontSize: s.fontCode }}>{item.codigo}</p>
        </div>
      </div>
    </div>
  );
}

export default function ModalImprimirEtiqueta({ item, onClose, nota }) {
  const [size, setSize] = useState('2b51x25');
  const sizeInfo = LABEL_SIZES.find(l => l.key === size) || LABEL_SIZES[0];
  const data = {
    codigo: item?.codigo || 'SIN-CODIGO',
    marca: item?.marca || '',
    modelo: item?.modelo || '',
    categoria: item?.categoria || '',
    serie: item?.serie || '',
  };

  useEffect(() => {
    document.body.classList.add('printing-labels');
    return () => document.body.classList.remove('printing-labels');
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl animate-slide-up" onClick={e => e.stopPropagation()}>
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">
              <i className="fa-solid fa-qrcode text-brand-500 mr-2" /> Imprimir Etiqueta QR
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <i className="fa-solid fa-xmark text-lg" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex gap-2 items-center flex-wrap">
              <label className="text-sm font-bold text-slate-600">Tamaño:</label>
              <select value={size} onChange={e => setSize(e.target.value)} className="form-input text-sm py-1.5 flex-1 min-w-40">
                {LABEL_SIZES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <button onClick={() => window.print()} className="btn-brand px-4 py-2 rounded-xl text-white text-sm font-bold ml-auto">
                <i className="fa-solid fa-print mr-1" /> Imprimir
              </button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex justify-center">
              <EtiquetaUnica item={data} size={size} />
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
              {nota && <p><b>Nota:</b> {nota}</p>}
              <p><b>Antes de imprimir (impresora 4Barcode):</b> en Windows ve a Dispositivos e impresoras → clic derecho en tu 4Barcode → <b>Preferencias de impresión</b> y configura el tamaño de etiqueta en <b>51×25mm</b> (si no aparece, "Tamaño personalizado").</p>
              <p><b>En el diálogo de impresión:</b> elige tu impresora 4Barcode, papel <b>{sizeInfo.mm}</b> (o personalizado), escala 100%, márgenes "Ninguno" y desactiva "Encabezados y pies de página". Debe mostrar <b>1 página</b>, no 2.</p>
            </div>
          </div>
        </div>
      </div>
      {createPortal(
        <div className="print-only">
          <style>{printStyles(size)}</style>
          <EtiquetaUnica item={data} size={size} />
        </div>,
        document.body
      )}
    </>
  );
}
