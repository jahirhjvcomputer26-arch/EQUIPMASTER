import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { db } from '../services/firebase';
import { badgeEstado, derivarModeloComercial } from '../utils/inventario';

const CHECKLIST_ITEMS = [
  'Pantalla', 'Teclado', 'Touchpad', 'WiFi',
  'Bluetooth', 'Audio', 'Puertos USB', 'Cámara',
  'Batería', 'Cargador', 'Micrófono', 'Lector Huella',
];

const ESTETICA_LABELS = {
  exterior: 'Exterior / Carcasa Superior', pantalla: 'Pantalla', carcasaInferior: 'Carcasa Inferior',
  teclado: 'Teclado', touchpad: 'Touchpad', bisagras: 'Bisagras',
  puertos: 'Puertos', camara: 'Cámara', bocinas: 'Bocinas', microfono: 'Micrófono',
};

export default function FichaTecnicaV2() {
  const { codigo } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!codigo) return;
    get(ref(db, 'inventario/' + codigo.toUpperCase())).then(snap => {
      const data = snap.val();
      if (!data) { setError('Equipo no encontrado'); return; }
      setItem(data);
    }).catch(() => setError('Error al cargar'));
  }, [codigo]);

  useEffect(() => {}, [item]);

  if (error) return (
    <div className="min-h-screen flex items-center justify-center text-slate-500">
      <p>{error}</p>
    </div>
  );

  if (!item) return (
    <div className="min-h-screen flex items-center justify-center text-slate-400">
      <i className="fa-solid fa-spinner fa-spin text-2xl" />
    </div>
  );

  const docNum = `DOC-FV2-${item.codigo}-${new Date().toISOString().slice(0,10).replace(/-/g,'')}`;
  const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(
    window.location.origin + '/consulta?q=' + item.serie
  );

  const estetica = item.condicionEstetica || {};
  const bateria = item.bateriaDetalle || {};
  const pruebas = item.checklistPruebas || {};
  const fotoFrente = item.fotos?.frente;
  const checkedCount = CHECKLIST_ITEMS.filter(t => pruebas[t] === 'OK' || pruebas[t] === true).length;
  const checkPercent = Math.round((checkedCount / CHECKLIST_ITEMS.length) * 100);

  return (
    <div className="min-h-screen bg-slate-100 p-4 print:p-0 print:bg-white" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      <style>{`
        @media print {
          @page { margin: 5mm; size: letter; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
        }
      `}</style>

      <div className="max-w-[800px] mx-auto space-y-3 print:space-y-2">

        {/* HEADER */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 print:shadow-none print:border-slate-300">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <img src="/logo-empresa.png" alt="Logo" className="h-10" onError={e => { e.target.style.display = 'none'; }} />
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">JV Computer · Centro de Servicio</p>
                <p className="text-base font-bold text-slate-800">Ficha Técnica del Equipo</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-slate-400 font-mono">{docNum}</p>
              <p className="text-2xl font-extrabold text-brand-600 mt-0.5">{item.codigo}</p>
              <span className={"inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 " + badgeEstado(item.estado)}>
                {item.estado}
              </span>
            </div>
          </div>
        </div>

        {/* PHOTO + HARDWARE */}
        <div className="grid grid-cols-[200px_1fr] gap-3">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex flex-col items-center justify-center print:shadow-none print:border-slate-300">
            {fotoFrente ? (
              <img src={fotoFrente} alt="Foto equipo" className="w-full h-36 object-cover rounded-lg" />
            ) : (
              <div className="w-full h-36 bg-slate-50 rounded-lg flex items-center justify-center text-slate-300 border-2 border-dashed border-slate-200">
                <i className="fa-solid fa-camera text-2xl" />
              </div>
            )}
            <p className="text-[9px] text-slate-400 mt-1 text-center">Foto del equipo</p>
            {item.color && (
              <p className="text-[10px] text-slate-500 mt-1"><strong>Color:</strong> {item.color}</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 print:shadow-none print:border-slate-300">
            <SectionTitle icon="fa-microchip" title="Hardware Principal" color="text-blue-500" />
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <Row label="Procesador" value={item.procesador} />
              <Row label="Generación" value={item.generacion || '—'} />
              <Row label="RAM" value={`${item.ram || '—'} ${item.tipoRam || ''}`} />
              <Row label="Almacenamiento" value={formatearAlmacenamiento(item)} />
              <Row label="Gráfica" value={item.grafica} />
              <Row label="Resolución" value={item.resolucion || '—'} />
              <Row label="Pantalla" value={item.pantalla || '—'} />
              <Row label="Sistema Operativo" value={item.sistemaOperativo || '—'} />
              <Row label="Año" value={item.anio || '—'} />
            </div>
          </div>
        </div>

        {/* CONNECTIVITY */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 print:shadow-none print:border-slate-300">
          <SectionTitle icon="fa-wifi" title="Conectividad y Extras" color="text-emerald-500" />
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {[
              { key: 'wifi', label: 'WiFi', icon: 'fa-wifi' },
              { key: 'bluetooth', label: 'Bluetooth', icon: 'fa-bluetooth-b' },
              { key: 'pantallaTactil', label: 'Táctil', icon: 'fa-hand-pointer' },
              { key: 'retroiluminacion', label: 'Retroilum.', icon: 'fa-keyboard' },
              { key: 'lectorHuellas', label: 'Huellas', icon: 'fa-fingerprint' },
              { key: 'camaraIR', label: 'Cám. IR', icon: 'fa-eye' },
            ].map(({ key, label, icon }) => (
              <div key={key} className={`flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg ${item[key] ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'}`}>
                <i className={`fa-solid ${icon} text-[10px]`} />
                <span>{label}</span>
                <i className={`fa-solid ${item[key] ? 'fa-check text-emerald-500' : 'fa-minus text-slate-300'} ml-auto text-[10px]`} />
              </div>
            ))}
          </div>
        </div>

        {/* IDENTIFICATION + DIAGNOSIS */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 print:shadow-none print:border-slate-300">
            <SectionTitle icon="fa-id-card" title="Identificación" color="text-brand-500" />
            <div className="space-y-1">
              <Row label="Marca" value={item.marca} />
              <Row label="Modelo" value={item.modelo} />
              <Row label="Modelo Comercial" value={item.modeloComercial || derivarModeloComercial(item.marca, item.modelo) || '—'} />
              <Row label="Serie" value={item.serie} />
              <Row label="SKU" value={item.sku} />
              <Row label="Categoría" value={item.categoria} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 print:shadow-none print:border-slate-300">
            <SectionTitle icon="fa-stethoscope" title="Diagnóstico" color="text-purple-500" />
            <div className="space-y-1">
              <Row label="Técnico" value={item.tecnico} />
              <Row label="Cargador" value={item.cargador} />
              <div className="pt-1.5 mt-1.5 border-t border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Batería</p>
                <Row label="Porcentaje" value={item.bateria || bateria.porcentaje || '—'} />
                <Row label="Ciclos" value={bateria.ciclos || '—'} />
                <Row label="Condición" value={bateria.condicion || '—'} />
              </div>
            </div>
          </div>
        </div>

        {/* AESTHETIC CONDITION */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 print:shadow-none print:border-slate-300">
          <SectionTitle icon="fa-eye" title="Condición Estética" color="text-orange-500" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {Object.entries(ESTETICA_LABELS).map(([key, label]) => (
              <div key={key} className="text-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-[9px] text-slate-400 font-medium mb-0.5">{label}</p>
                <p className={`text-xs font-bold ${estetica[key] === 'EXCELENTE' ? 'text-emerald-600' : estetica[key] === 'BUENA' ? 'text-blue-600' : estetica[key] === 'REGULAR' ? 'text-amber-600' : estetica[key] === 'MALA' ? 'text-red-600' : 'text-slate-300'}`}>
                  {estetica[key] || '—'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CHECKLIST + FECHAS */}
        <div className="grid grid-cols-[2fr_1fr] gap-3">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 print:shadow-none print:border-slate-300">
            <div className="flex items-center justify-between mb-2">
              <SectionTitle icon="fa-clipboard-check" title="Checklist de Pruebas" color="text-cyan-500" />
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${checkPercent === 100 ? 'bg-emerald-100 text-emerald-700' : checkPercent >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                {checkedCount}/{CHECKLIST_ITEMS.length} · {checkPercent}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mb-3 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${checkPercent === 100 ? 'bg-emerald-500' : 'bg-brand-500'}`} style={{ width: checkPercent + '%' }} />
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {CHECKLIST_ITEMS.map(test => (
                <div key={test} className="flex items-center gap-1.5 text-xs py-1 px-2 rounded-lg bg-slate-50">
                  <span className={pruebas[test] === true || pruebas[test] === 'OK' ? 'text-emerald-600' : pruebas[test] === false || pruebas[test] === 'FAIL' ? 'text-red-500' : 'text-slate-300'}>
                    {pruebas[test] === true || pruebas[test] === 'OK' ? <i className="fa-solid fa-circle-check" />
                    : pruebas[test] === false || pruebas[test] === 'FAIL' ? <i className="fa-solid fa-circle-xmark" />
                    : <i className="fa-regular fa-circle" />}
                  </span>
                  <span className="text-slate-600">{test}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 print:shadow-none print:border-slate-300">
            <SectionTitle icon="fa-calendar" title="Fechas" color="text-indigo-500" />
            <div className="space-y-1">
              <Row label="Registro" value={item.fechaRegistro || '—'} />
              <Row label="Revisión" value={item.fechaRevision || '—'} />
            </div>
          </div>
        </div>

        {/* OBSERVATIONS */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 print:shadow-none print:border-slate-300">
          <SectionTitle icon="fa-comment" title="Observaciones" color="text-slate-500" />
          <p className="text-sm text-slate-600">{item.observaciones || 'Sin observaciones.'}</p>
        </div>

        {/* SALE FLOWS */}
        {(item.flujoSalida || item.flujoVentaML) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {item.flujoSalida && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 print:shadow-none print:border-slate-300">
                <SectionTitle icon="fa-store" title="Venta Local" color="text-emerald-500" />
                <Row label="Cliente" value={item.flujoSalida.cliente} />
                <Row label="Precio" value={item.flujoSalida.precio} />
                <Row label="Método" value={item.flujoSalida.metodoPago} />
              </div>
            )}
            {item.flujoVentaML && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 print:shadow-none print:border-slate-300">
                <SectionTitle icon="fa-truck" title="Mercado Libre" color="text-yellow-500" />
                <Row label="ID Publicación" value={item.flujoMercadoLibre?.idPublicacion} />
                <Row label="Fecha Envío" value={item.flujoMercadoLibre?.fechaEnvio} />
                <Row label="Enviado por" value={item.flujoMercadoLibre?.enviadoPor} />
                <Row label="Fecha Venta" value={item.flujoVentaML.fechaVenta} />
              </div>
            )}
          </div>
        )}

        {/* HISTORIAL */}
        {item.historial && item.historial.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 print:shadow-none print:border-slate-300">
            <SectionTitle icon="fa-clock-rotate-left" title="Historial de Cambios" color="text-teal-500" />
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {item.historial.slice(-8).reverse().map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] text-slate-500 py-0.5">
                  <i className="fa-solid fa-circle text-[3px] text-slate-300" />
                  <span className="font-mono text-slate-400">{new Date(h.fecha).toLocaleDateString('es-MX')}</span>
                  <span className="font-medium text-slate-600">{h.usuario}</span>
                  <span>{h.cambios}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex justify-between items-center print:shadow-none print:border-slate-300">
          <div className="text-[9px] text-slate-400 space-y-0.5">
            <p><strong>Documento:</strong> {docNum}</p>
            <p><strong>Generado:</strong> {new Date().toLocaleString('es-MX')}</p>
            <p>JV Computer · Centro de Servicio TI</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right text-[9px] text-slate-400 max-w-[120px] leading-tight">
              Escanea para ver ficha completa
            </div>
            <img src={qrUrl} alt="QR" className="w-16 h-16" crossOrigin="anonymous" />
          </div>
        </div>

        {/* Print buttons */}
        <p className="text-center text-xs text-slate-400 no-print">
          Presiona <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-xs font-mono">Ctrl+P</kbd> o{' '}
          <button onClick={() => window.print()} className="text-brand-600 underline font-medium">Imprimir</button>
        </p>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title, color }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <i className={`fa-solid ${icon} ${color} text-xs`} />
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{title}</p>
    </div>
  );
}

function formatearAlmacenamiento(item) {
  const cap = item.almacenamiento || '';
  const tipo = item.tipoDisco || '';
  if (!cap && !tipo) return '—';
  if (!tipo) return cap;
  return `${cap} ${tipo}`;
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-xs py-0.5">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-slate-800 text-right max-w-[60%] truncate">{value || '—'}</span>
    </div>
  );
}
