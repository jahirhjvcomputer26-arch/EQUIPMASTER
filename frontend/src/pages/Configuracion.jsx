import { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../componentes/Notification';
import useDocumentTitle from '../utils/useDocumentTitle';

const DEFAULTS = {
  nombreEmpresa: 'JV COMPUTER',
  lema: 'Centro de Servicio TI',
  direccion: 'Nuevo León, México',
  telefono: '',
  email: '',
  website: '',
  rfc: '',
  logoBase64: '',
  colorPrimario: '#0018B0',
  moneda: 'MXN',
  iva: 16,
  notasPie: 'Gracias por su preferencia',
};

function resizeLogo(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > 300 || h > 100) {
          if (w > h) { h = Math.round(h * 300 / w); w = 300; }
          else { w = Math.round(w * 100 / h); h = 100; }
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function Configuracion() {
  useDocumentTitle('Configuración');
  const { user } = useAuth();
  const { notify } = useNotify();
  const [config, setConfig] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (user?.rol !== 'admin') return;
    api.getConfiguracion()
      .then(c => setConfig({ ...DEFAULTS, ...c }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      notify('Logo muy grande', 'El archivo no debe superar 500 KB', 'error');
      return;
    }
    try {
      const base64 = await resizeLogo(file);
      handleChange('logoBase64', base64);
    } catch {
      notify('Error', 'No se pudo procesar la imagen', 'error');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.saveConfiguracion(config);
      setConfig({ ...DEFAULTS, ...res.config });
      notify('Guardado', 'Configuración actualizada correctamente', 'success');
    } catch (err) {
      notify('Error', err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (user?.rol !== 'admin') {
    return (
      <section className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <i className="fa-solid fa-lock text-red-400 text-3xl" />
        </div>
        <h2 className="font-display text-xl font-bold text-slate-900">Acceso restringido</h2>
        <p className="text-slate-500 text-sm mt-1">Solo los administradores pueden acceder a esta sección.</p>
      </section>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const colorSecundario = config.colorPrimario + '22';

  return (
    <section className="space-y-6 animate-fade-in max-w-3xl">
      <div className="animate-slide-up">
        <h2 className="font-display text-2xl font-bold text-slate-900">Configuración</h2>
        <p className="text-slate-500 text-sm">Datos de la empresa y parámetros del sistema</p>
      </div>

      <div className="panel p-6 space-y-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <i className="fa-solid fa-building text-brand-500" /> Datos de la Empresa
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="form-label">Nombre de la Empresa *</label>
            <input className="form-input" value={config.nombreEmpresa} onChange={e => handleChange('nombreEmpresa', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Lema</label>
            <input className="form-input" value={config.lema} onChange={e => handleChange('lema', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Dirección</label>
            <input className="form-input" value={config.direccion} onChange={e => handleChange('direccion', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Teléfono</label>
            <input className="form-input" value={config.telefono} onChange={e => handleChange('telefono', e.target.value)} placeholder="Ej: 81-1234-5678" />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={config.email} onChange={e => handleChange('email', e.target.value)} placeholder="correo@empresa.com" />
          </div>
          <div>
            <label className="form-label">Website</label>
            <input className="form-input" value={config.website} onChange={e => handleChange('website', e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label className="form-label">RFC</label>
            <input className="form-input" value={config.rfc} onChange={e => handleChange('rfc', e.target.value)} placeholder="XAXX010101000" />
          </div>
        </div>
      </div>

      <div className="panel p-6 space-y-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <i className="fa-solid fa-image text-brand-500" /> Logo de la Empresa
        </h3>
        <div className="flex items-start gap-6">
          <div className="shrink-0">
            {config.logoBase64 ? (
              <img src={config.logoBase64} alt="Logo" className="h-16 w-auto object-contain rounded-lg border border-slate-200 bg-white p-2" />
            ) : (
              <div className="h-16 w-32 rounded-lg bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs">
                Sin logo
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
            <div className="flex gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} className="px-4 py-2 rounded-xl bg-brand-50 text-brand-700 text-sm font-bold hover:bg-brand-100 transition">
                <i className="fa-solid fa-upload mr-1" /> Subir logo
              </button>
              {config.logoBase64 && (
                <button type="button" onClick={() => handleChange('logoBase64', '')} className="px-4 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition">
                  <i className="fa-solid fa-trash mr-1" /> Quitar
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400">PNG o JPG. Máximo 500 KB. Se redimensiona automáticamente.</p>
          </div>
        </div>
      </div>

      <div className="panel p-6 space-y-6 animate-slide-up" style={{ animationDelay: '150ms' }}>
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <i className="fa-solid fa-sliders text-brand-500" /> Parámetros del Sistema
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Color Primario</label>
            <div className="flex items-center gap-3">
              <input type="color" value={config.colorPrimario} onChange={e => handleChange('colorPrimario', e.target.value)} className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer" />
              <input className="form-input flex-1" value={config.colorPrimario} onChange={e => handleChange('colorPrimario', e.target.value)} placeholder="#0018B0" />
            </div>
          </div>
          <div>
            <label className="form-label">Moneda</label>
            <select className="form-input" value={config.moneda} onChange={e => handleChange('moneda', e.target.value)}>
              <option value="MXN">MXN - Peso Mexicano</option>
              <option value="USD">USD - Dólar Americano</option>
            </select>
          </div>
          <div>
            <label className="form-label">IVA (%)</label>
            <input type="number" min="0" max="100" className="form-input" value={config.iva} onChange={e => handleChange('iva', Number(e.target.value))} />
          </div>
          <div className="md:col-span-2">
            <label className="form-label">Notas al pie (reportes)</label>
            <input className="form-input" value={config.notasPie} onChange={e => handleChange('notasPie', e.target.value)} placeholder="Gracias por su preferencia" />
          </div>
        </div>
      </div>

      <div className="panel p-6 space-y-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <i className="fa-solid fa-eye text-brand-500" /> Vista Previa
        </h3>
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
          <div className="px-6 py-4 flex items-center gap-4" style={{ backgroundColor: config.colorPrimario }}>
            {config.logoBase64 && <img src={config.logoBase64} alt="Logo" className="h-10 w-auto object-contain bg-white/20 rounded p-1" />}
            <div>
              <p className="text-white font-bold text-lg leading-tight">{config.nombreEmpresa}</p>
              {config.lema && <p className="text-white/70 text-xs">{config.lema}</p>}
            </div>
          </div>
          <div className="px-6 py-4 space-y-2">
            <div className="text-xs text-slate-500 space-y-1">
              {config.direccion && <p><i className="fa-solid fa-location-dot mr-1" />{config.direccion}</p>}
              {config.telefono && <p><i className="fa-solid fa-phone mr-1" />{config.telefono}</p>}
              {config.email && <p><i className="fa-solid fa-envelope mr-1" />{config.email}</p>}
              {config.rfc && <p><i className="fa-solid fa-id-card mr-1" />RFC: {config.rfc}</p>}
            </div>
            <div className="border-t border-slate-100 pt-3 mt-3">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Producto de ejemplo</span>
                <span className="font-bold">$1,250.00 {config.moneda}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>IVA ({config.iva}%)</span>
                <span>${(1250 * config.iva / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-800 mt-1 pt-1 border-t border-slate-100">
                <span>Total</span>
                <span>${(1250 * (1 + config.iva / 100)).toFixed(2)} {config.moneda}</span>
              </div>
            </div>
            {config.notasPie && (
              <p className="text-[10px] text-center text-slate-400 mt-4 pt-3 border-t border-slate-100 italic">{config.notasPie}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end animate-slide-up" style={{ animationDelay: '250ms' }}>
        <button onClick={handleSave} disabled={saving} className="btn-brand text-white px-8 py-3 rounded-xl text-sm font-bold disabled:opacity-60">
          {saving ? (
            <><i className="fa-solid fa-spinner animate-spin mr-2" />Guardando...</>
          ) : (
            <><i className="fa-solid fa-floppy-disk mr-2" />Guardar Configuración</>
          )}
        </button>
      </div>
    </section>
  );
}
