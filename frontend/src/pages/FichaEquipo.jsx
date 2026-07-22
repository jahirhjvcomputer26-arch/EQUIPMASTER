import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { db } from '../services/firebase';
import { badgeEstado } from '../utils/inventario';

export default function FichaEquipo() {
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

  useEffect(() => {
    if (item) setTimeout(() => window.print(), 800);
  }, [item]);

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

  const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(
    window.location.origin + '/consulta?q=' + item.serie
  );

  return (
    <div className="min-h-screen bg-white p-8 print:p-4" style={{ fontFamily: 'Arial, sans-serif' }}>
      <style>{`@media print { @page { margin: 0.5cm; } body { -webkit-print-color-adjust: exact; } }`}</style>
      <div className="max-w-2xl mx-auto border-2 border-slate-200 rounded-2xl p-8 shadow-lg">
        <div className="flex justify-between items-start mb-6 pb-6 border-b-2 border-slate-100">
          <div>
            <img src="/logo-empresa.png" alt="JV COMPUTER" style={{ maxHeight: 50, marginBottom: 8 }} />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">EquipMaster · Ficha Técnica</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-brand-600">{item.codigo}</p>
            <span className={"inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 " + badgeEstado(item.estado)}>
              {item.estado}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="space-y-3">
            <Section label="Equipo">
              <p className="font-bold text-lg">{item.marca} {item.modelo}</p>
              <p className="text-sm text-slate-500">{item.categoria}</p>
            </Section>
            <Section label="Identificación">
              <Row label="Serie" value={item.serie} />
              <Row label="SKU" value={item.sku} />
            </Section>
          </div>
          <div className="space-y-3">
            <Section label="Hardware">
              <Row label="Procesador" value={item.procesador} />
              <Row label="RAM" value={item.ram} />
              <Row label="Almacenamiento" value={item.almacenamiento + ' ' + (item.tipoDisco || '')} />
              <Row label="Gráfica" value={item.grafica} />
            </Section>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <Section label="Diagnóstico">
            <Row label="Técnico" value={item.tecnico} />
            <Row label="Batería" value={item.bateria} />
            <Row label="Cargador" value={item.cargador} />
          </Section>
          <Section label="Observaciones">
            <p className="text-sm text-slate-600">{item.observaciones}</p>
          </Section>
        </div>

        {item.flujoSalida && (
          <div className="mb-6 p-4 bg-slate-50 rounded-xl">
            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Flujo de Venta Local</p>
            <Row label="Cliente" value={item.flujoSalida.cliente} />
            <Row label="Precio" value={item.flujoSalida.precio} />
            <Row label="Método de pago" value={item.flujoSalida.metodoPago} />
          </div>
        )}

        <div className="flex justify-between items-center pt-6 border-t-2 border-slate-100">
          <p className="text-[10px] text-slate-400">Generado: {new Date().toLocaleString()}</p>
          <img src={qrUrl} alt="QR" className="w-16 h-16" crossOrigin="anonymous" />
        </div>
      </div>
      <p className="text-center text-xs text-slate-400 mt-4 print:hidden">Presiona Ctrl+P o Cmd+P para imprimir · <button onClick={() => window.print()} className="text-brand-600 underline">Imprimir</button></p>
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div className="p-4 bg-slate-50 rounded-xl">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm py-0.5">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-slate-800 text-right">{value || '—'}</span>
    </div>
  );
}
