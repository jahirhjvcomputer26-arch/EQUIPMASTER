import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useInventario } from '../context/InventarioContext';
import { useNotify } from '../componentes/Notification';
import { CATEGORIAS, ESTADOS, RAM_OPTIONS, STORAGE_OPTIONS, TECNICOS, GENERACION_OPTIONS, TIPO_RAM_OPTIONS, RESOLUCION_OPTIONS, ANIO_OPTIONS, esEstadoML, generarCodigoSiguiente, buscarSku, buscarPorSku, aprenderSku, derivarModeloComercial } from '../utils/inventario';
import { getTemplate, CHECKLIST_ICONS } from '../utils/formTemplates';
import SmartProgressBar from '../componentes/SmartProgressBar';
import VisualChecklist from '../componentes/VisualChecklist';
import LivePreview from '../componentes/LivePreview';
import ActionBar from '../componentes/ActionBar';
import useDocumentTitle from '../utils/useDocumentTitle';
import useUnsavedChanges from '../utils/useUnsavedChanges';

const ESTADOS_CONDICION = ['', 'EXCELENTE', 'BUENA', 'REGULAR', 'MALA', 'NO APLICA'];
const ESTADOS_BATERIA = ['', 'BUENA', 'REGULAR', 'MALA', 'NO REPORTA'];

const CONECTIVIDAD_OPTIONS = [
  { key: 'wifi', label: 'WiFi', icon: 'fa-wifi' },
  { key: 'bluetooth', label: 'Bluetooth', icon: 'fa-bluetooth-b' },
  { key: 'pantallaTactil', label: 'Pantalla Táctil', icon: 'fa-hand-pointer' },
  { key: 'retroiluminacion', label: 'Retroiluminación', icon: 'fa-keyboard' },
  { key: 'lectorHuellas', label: 'Lector Huellas', icon: 'fa-fingerprint' },
  { key: 'camaraIR', label: 'Cámara IR', icon: 'fa-eye' },
];

const CONDICION_LABELS = {
  exterior: 'Exterior', pantalla: 'Pantalla', carcasaInferior: 'Carcasa Inferior',
  teclado: 'Teclado', touchpad: 'Touchpad', bisagras: 'Bisagras',
  puertos: 'Puertos', camara: 'Cámara', bocinas: 'Bocinas', microfono: 'Micrófono',
  ventiladores: 'Ventiladores', base: 'Base',
};

const emptyFichaV2 = {
  sistemaOperativo: '', color: '', pantalla: '', modeloComercial: '',
  condicionEstetica: { exterior: '', pantalla: '', carcasaInferior: '', teclado: '', touchpad: '', bisagras: '', puertos: '', camara: '', bocinas: '', microfono: '' },
  bateriaDetalle: { porcentaje: '', ciclos: '', condicion: '' },
  checklistPruebas: {},
  fechaRevision: '',
};

const emptyForm = {
  codigo: '', categoria: '', marca: '', modelo: '', serie: '', sku: '',
  anio: '', procesador: '', generacion: '', ram: '16 GB', tipoRam: 'DDR4', almacenamiento: '512 GB', tipoDisco: 'M.2 NVME', grafica: 'INTEGRADA',
  resolucion: '', pantallaTactil: false, retroiluminacion: false, lectorHuellas: false, camaraIR: false, wifi: true, bluetooth: true,
  tecnico: '', bateria: '', cargador: '', estado: '🔵 OK', observaciones: '',
  mlFechaEnvio: '', mlPublicacionId: '', mlEnviadoPor: '',
  fichaV2: emptyFichaV2,
  fotos: {},
};

function SectionHeader({ icon, title, color, children }) {
  return (
    <div className="border-t border-slate-200 pt-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${color}`}>
            <i className={`fa-solid ${icon}`} />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Inventario() {
  useDocumentTitle('Entrada de equipos');
  const { inventario } = useInventario();
  const { notify } = useNotify();
  const [params] = useSearchParams();
  const [mode, setMode] = useState(() => localStorage.getItem('em_capture_mode') || 'full');
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [skuManual, setSkuManual] = useState(false);

  const tmpl = useMemo(() => getTemplate(form.categoria), [form.categoria]);

  const stepLabels = tmpl.stepLabels || ['Identificación', 'Hardware', 'Estado y Técnico', 'Ficha Técnica'];
  const stepIcons = tmpl.stepIcons || ['fa-id-card', 'fa-microchip', 'fa-clipboard-check', 'fa-file-lines'];
  const allSteps = [1, 2, 3, 4];
  const activeSteps = mode === 'quick' ? [1, 3] : allSteps;
  const totalSteps = activeSteps.length;
  const currentStepIndex = activeSteps.indexOf(step);

  useEffect(() => { localStorage.setItem('em_capture_mode', mode); }, [mode]);

  const generarSku = useCallback((modelo, marca, procesador) => {
    const m = modelo?.toUpperCase().trim();
    const p = procesador?.toUpperCase().trim();
    if (m && p) {
      const enTabla = buscarSku(modelo, procesador);
      if (enTabla) return enTabla;
      const enInv = inventario.find(i => i.modelo?.toUpperCase().trim() === m && i.procesador?.toUpperCase().trim() === p && i.sku && i.sku !== 'N/A');
      if (enInv) return enInv.sku;
    }
    if (m) {
      const soloTabla = buscarSku(modelo, null);
      if (soloTabla) return soloTabla;
      const soloInv = inventario.find(i => i.modelo?.toUpperCase().trim() === m && i.sku && i.sku !== 'N/A');
      if (soloInv) return soloInv.sku;
    }
    return '';
  }, [inventario]);

  const markDirty = (field, value) => {
    setDirty(true);
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (!skuManual && !editing) {
        const modelo = field === 'modelo' ? value : next.modelo;
        const procesador = field === 'procesador' ? value : next.procesador;
        const marca = field === 'marca' ? value : next.marca;
        if ((field === 'modelo' || field === 'procesador' || field === 'marca') && modelo) {
          const generado = generarSku(modelo, marca, procesador);
          if (generado) next.sku = generado;
        }
      }
      if (field === 'estado' && esEstadoML(value)) {
        const match = inventario.find(i =>
          i.marca === next.marca && i.modelo === next.modelo &&
          i.flujoMercadoLibre?.idPublicacion && i.flujoMercadoLibre?.idPublicacion !== 'N/A'
        );
        if (match) next.mlPublicacionId = match.flujoMercadoLibre.idPublicacion;
      }
      return next;
    });
  };

  const markFichaV2 = (field, value) => {
    setDirty(true);
    setForm(prev => {
      const [parent, child] = field.split('.');
      const ficha = { ...prev.fichaV2 };
      if (child) {
        ficha[parent] = { ...ficha[parent], [child]: value };
      } else {
        ficha[parent] = value;
      }
      return { ...prev, fichaV2: ficha };
    });
  };

  const toggleChecklist = (test) => {
    setDirty(true);
    setForm(prev => ({
      ...prev,
      fichaV2: {
        ...prev.fichaV2,
        checklistPruebas: {
          ...prev.fichaV2.checklistPruebas,
          [test]: prev.fichaV2.checklistPruebas[test] === 'OK' ? null : 'OK',
        },
      },
    }));
  };

  const resizeImage = (file) => new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 800;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) { if (w > h) { h = Math.round(h * MAX / w); w = MAX; } else { w = Math.round(w * MAX / h); h = MAX; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  const handleFormPhotoUpload = async (categoria, files) => {
    if (!files?.length) return;
    try {
      const base64 = await resizeImage(files[0]);
      const result = await api.uploadFile({ codigo: form.codigo, categoria, archivo: base64, esDocumento: false });
      setDirty(true);
      setForm(prev => ({ ...prev, fotos: { ...prev.fotos, [categoria]: result.url } }));
      notify('Foto subida', `${categoria} guardada en Storage.`, 'success');
    } catch (err) { notify('Error', err.message, 'error'); }
  };

  const handleFormPhotoDelete = async (categoria) => {
    if (form.fotos[categoria]?.includes('storage.googleapis.com') || form.fotos[categoria]?.includes('firebasestorage')) {
      try {
        const ext = (form.fotos[categoria].split('.').pop()?.split('?')[0]) || 'jpg';
        await api.deleteFile(`fotos/${form.codigo}/${categoria}.${ext}`);
      } catch {}
    }
    setDirty(true);
    setForm(prev => { const f = { ...prev.fotos }; delete f[categoria]; return { ...prev, fotos: f }; });
  };

  useEffect(() => {
    if (!form.modelo || form.fichaV2.modeloComercial) return;
    const derivado = derivarModeloComercial(form.marca, form.modelo);
    if (derivado) markFichaV2('modeloComercial', derivado);
  }, [form.modelo, form.marca]);

  useUnsavedChanges(dirty);

  useEffect(() => {
    const codigo = params.get('editar');
    if (codigo) {
      const item = inventario.find(i => i.codigo === codigo);
      if (item) cargarEdicion(item);
    } else if (!editing) {
      const hoy = new Date().toISOString().split('T')[0];
      setForm(f => {
        const lastBrand = localStorage.getItem('em_last_brand') || '';
        const lastTech = localStorage.getItem('em_last_technician') || '';
        return {
          ...f,
          codigo: generarCodigoSiguiente(inventario),
          marca: lastBrand,
          tecnico: lastTech,
          fichaV2: { ...f.fichaV2, fechaRevision: hoy },
        };
      });
    }
  }, [inventario, params]);

  const cargarEdicion = (item) => {
    setEditing(true);
    setForm({
      codigo: item.codigo, categoria: item.categoria || 'LAPTOP', marca: item.marca, modelo: item.modelo,
      serie: item.serie, sku: item.sku || '',
      anio: item.anio || '', procesador: item.procesador, generacion: item.generacion || '',
      ram: item.ram, tipoRam: item.tipoRam || 'DDR4',
      almacenamiento: item.almacenamiento, tipoDisco: item.tipoDisco, grafica: item.grafica,
      resolucion: item.resolucion || '',
      pantallaTactil: item.pantallaTactil || false, retroiluminacion: item.retroiluminacion || false,
      lectorHuellas: item.lectorHuellas || false, camaraIR: item.camaraIR || false,
      wifi: item.wifi !== false, bluetooth: item.bluetooth !== false,
      tecnico: item.tecnico, bateria: item.bateria, cargador: item.cargador || '',
      estado: item.estado, observaciones: item.observaciones || '',
      mlFechaEnvio: item.flujoMercadoLibre?.fechaEnvio || '',
      mlPublicacionId: item.flujoMercadoLibre?.idPublicacion || '',
      mlEnviadoPor: item.flujoMercadoLibre?.enviadoPor || '',
      fotos: item.fotos || {},
      fichaV2: {
        sistemaOperativo: item.sistemaOperativo || '',
        color: item.color || '',
        pantalla: item.pantalla || '',
        modeloComercial: item.modeloComercial || '',
        condicionEstetica: { ...emptyFichaV2.condicionEstetica, ...item.condicionEstetica },
        bateriaDetalle: item.bateriaDetalle || emptyFichaV2.bateriaDetalle,
        checklistPruebas: item.checklistPruebas || {},
        fechaRevision: item.fechaRevision || '',
      },
    });
    setStep(mode === 'quick' ? 1 : 1);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (esEstadoML(form.estado) && (!form.mlFechaEnvio || !form.mlEnviadoPor)) {
      notify('Datos ML incompletos', 'Completa fecha y responsable del envío.', 'error');
      return;
    }

    setDirty(false);
    const existente = inventario.find(i => i.codigo === form.codigo);
    if (!editing) {
      const dup = inventario.find(i => i.serie.toUpperCase().trim() === form.serie.toUpperCase().trim() && i.codigo !== form.codigo);
      if (dup) {
        notify('Duplicado', `Ya existe un equipo con la serie ${form.serie} (${dup.codigo} · ${dup.marca} ${dup.modelo}).`, 'error');
        return;
      }
    }
    const payload = {
      codigo: form.codigo.toUpperCase().trim(),
      categoria: form.categoria,
      marca: form.marca.toUpperCase().trim(),
      modelo: form.modelo.toUpperCase().trim(),
      serie: form.serie.toUpperCase().trim(),
      sku: form.sku.toUpperCase().trim() || 'N/A',
      procesador: form.procesador.toUpperCase().trim(),
      ram: form.ram, almacenamiento: form.almacenamiento,
      tipoDisco: form.tipoDisco.toUpperCase().trim(),
      grafica: form.grafica.toUpperCase().trim() || 'INTEGRADA',
      tecnico: form.tecnico,
      bateria: form.bateria.toUpperCase().trim(),
      cargador: form.cargador.toUpperCase().trim() || 'N/A',
      estado: form.estado,
      observaciones: form.observaciones.toUpperCase().trim() || 'SIN OBSERVACIONES.',
      anio: form.anio || '',
      generacion: form.generacion.toUpperCase().trim(),
      tipoRam: form.tipoRam,
      resolucion: form.resolucion,
      pantallaTactil: form.pantallaTactil,
      retroiluminacion: form.retroiluminacion,
      lectorHuellas: form.lectorHuellas,
      camaraIR: form.camaraIR,
      wifi: form.wifi,
      bluetooth: form.bluetooth,
      fotos: Object.keys(form.fotos).length > 0 ? form.fotos : existente?.fotos || {},
      fechaRegistro: existente?.fechaRegistro || new Date().toLocaleString(),
      flujoSalida: existente?.flujoSalida || null,
      flujoVentaML: existente?.flujoVentaML || null,
      flujoDevolucion: existente?.flujoDevolucion || null,
      flujoMercadoLibre: esEstadoML(form.estado) ? {
        fechaEnvio: form.mlFechaEnvio,
        idPublicacion: form.mlPublicacionId.toUpperCase().trim() || 'N/A',
        enviadoPor: form.mlEnviadoPor,
      } : null,
    };

    const fv = form.fichaV2;
    if (fv.sistemaOperativo || fv.color || fv.pantalla || fv.modeloComercial || fv.fechaRevision ||
        Object.values(fv.condicionEstetica).some(Boolean) ||
        Object.values(fv.bateriaDetalle).some(Boolean) ||
        Object.keys(fv.checklistPruebas).length > 0) {
      payload.sistemaOperativo = fv.sistemaOperativo.toUpperCase().trim() || undefined;
      payload.color = fv.color.toUpperCase().trim() || undefined;
      payload.pantalla = fv.pantalla.toUpperCase().trim() || undefined;
      payload.modeloComercial = fv.modeloComercial.toUpperCase().trim() || undefined;
      payload.condicionEstetica = fv.condicionEstetica;
      payload.bateriaDetalle = fv.bateriaDetalle;
      payload.checklistPruebas = fv.checklistPruebas;
      payload.fechaRevision = fv.fechaRevision || undefined;
    }

    try {
      const result = await api.saveEquipo(payload.codigo, payload);
      const codigoReal = result.codigo || payload.codigo;
      if (editing && payload.sku && payload.sku !== 'N/A') {
        try {
          const hermanos = inventario.filter(i => i.sku === payload.sku && i.codigo !== codigoReal);
          if (hermanos.length > 0 && window.confirm(`¿Propagar marca/modelo/hardware a los otros ${hermanos.length} equipos con SKU ${payload.sku}?`)) {
            await Promise.all(hermanos.map(i => api.saveEquipo(i.codigo, {
              ...i, marca: payload.marca, modelo: payload.modelo,
              procesador: payload.procesador, ram: payload.ram, almacenamiento: payload.almacenamiento
            })));
            notify('¡Propagado!', `Se actualizaron ${hermanos.length} equipos con el mismo SKU.`, 'success');
          }
        } catch { /* propagación falló, no bloquea */ }
      }
      localStorage.setItem('em_last_brand', form.marca);
      localStorage.setItem('em_last_technician', form.tecnico);
      notify('¡Procesado!', editing ? 'Equipo actualizado.' : 'Equipo registrado en Firebase.', 'success');
      if (!editing && payload.sku && payload.sku !== 'N/A') {
        aprenderSku(payload.sku, `${payload.marca} ${payload.modelo}`, payload.procesador, payload.ram, payload.almacenamiento);
      }
      cancelar(!editing ? codigoReal : null);
    } catch (err) {
      notify('Error', err.message, 'error');
    }
  };

  const cancelar = (ultimoCodigo = null) => {
    const nextCodigo = ultimoCodigo
      ? `INV-${parseInt(ultimoCodigo.replace('INV-', ''), 10) + 1}`
      : generarCodigoSiguiente(inventario);
    setDirty(false);
    setEditing(false);
    setSkuManual(false);
    const hoy = new Date().toISOString().split('T')[0];
    setForm({ ...emptyForm, codigo: nextCodigo, fichaV2: { ...emptyFichaV2, fechaRevision: hoy }, fotos: {} });
    setStep(mode === 'quick' ? 1 : 1);
  };

  const goNext = () => {
    const idx = activeSteps.indexOf(step);
    if (idx < activeSteps.length - 1) setStep(activeSteps[idx + 1]);
  };
  const goPrev = () => {
    const idx = activeSteps.indexOf(step);
    if (idx > 0) setStep(activeSteps[idx - 1]);
  };

  return (
    <section className="space-y-4 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-3 animate-slide-up">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">{editing ? '✏️ Modificando Ficha' : 'Entrada de equipos'}</h2>
          <p className="text-slate-500 text-sm flex items-center gap-2">
            <span className="font-semibold text-brand-600">{mode === 'quick' ? 'Captura Rápida' : 'Captura Completa'}</span>
            {form.categoria && <span className="text-slate-400">· {tmpl.label}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editing && (
            <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl p-1">
              <a href={`/ficha-v2/${form.codigo}`} target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-white transition">
                <i className="fa-solid fa-file-lines" /> Ficha
              </a>
              <a href={`/galeria/${form.codigo}`} target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-white transition">
                <i className="fa-solid fa-camera" /> Galería
              </a>
              <a href={`/documentos/${form.codigo}`} target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-white transition">
                <i className="fa-solid fa-folder-open" /> Docs
              </a>
              <a href={`/etiquetas/${form.codigo}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-white transition">
                <i className="fa-solid fa-tag" /> Etiqueta
              </a>
            </div>
          )}
          <div className="flex items-center bg-slate-100 rounded-xl p-1">
            <button onClick={() => { setMode('quick'); setStep(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${mode === 'quick' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-500 hover:bg-white'}`}>
              <i className="fa-solid fa-bolt text-[10px]" /> Rápida
            </button>
            <button onClick={() => { setMode('full'); setStep(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${mode === 'full' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-500 hover:bg-white'}`}>
              <i className="fa-solid fa-list-check text-[10px]" /> Completa
            </button>
          </div>
        </div>
      </div>

      <SmartProgressBar stepIndex={currentStepIndex} totalSteps={totalSteps} stepLabels={mode === 'quick' ? ['Identificación', 'Estado y Técnico'] : stepLabels} stepIcons={mode === 'quick' ? [stepIcons[0], stepIcons[2]] : stepIcons} />

      <div className="flex gap-5 items-start">
        <form onSubmit={e => e.preventDefault()} onKeyDown={e => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); } if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleSubmit(e); } }} className="flex-1 min-w-0 panel overflow-hidden animate-fade-in">

          {step === 1 && (
            <div className="p-6 md:p-8 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="form-label">Código (Auto) *</label><input className="form-input font-mono font-bold" value={form.codigo} readOnly /></div>
                <div><label className="form-label">Categoría *</label>
                  <select className="form-input" value={form.categoria} onChange={e => markDirty('categoria', e.target.value)} required>
                    <option value="">Selecciona...</option>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select></div>
                <div><label className="form-label">Año</label>
                  <select className="form-input" value={form.anio} onChange={e => markDirty('anio', e.target.value)}>
                    {ANIO_OPTIONS.map(a => <option key={a}>{a}</option>)}
                  </select></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="form-label">Marca *</label><input className="form-input uppercase" value={form.marca} onChange={e => markDirty('marca', e.target.value)} required placeholder="HP, LENOVO, DELL..." /></div>
                <div><label className="form-label">Modelo *</label><input className="form-input uppercase" value={form.modelo} onChange={e => markDirty('modelo', e.target.value)} required placeholder="PROBOOK 450 G10..." /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="form-label">Número de serie *</label><input className="form-input font-mono uppercase" value={form.serie} onChange={e => markDirty('serie', e.target.value)} required placeholder="S/N grabado en el equipo" /></div>
                <div><label className="form-label">SKU interno</label><input className="form-input font-mono uppercase" value={form.sku} onChange={e => { setSkuManual(true); markDirty('sku', e.target.value); }} onBlur={e => {
                  const val = e.target.value.toUpperCase().trim();
                  if (!editing && val) {
                    const encontrado = buscarPorSku(val);
                    if (encontrado) {
                      let modelo = encontrado.modelo;
                      if (encontrado.marca === 'LENOVO') {
                        modelo = modelo.replace(/^LENOVO\s+/, '');
                        modelo = modelo.replace(/^(THINKPAD|THINKBOOK|WORKSTATION|YOGA|LEGION|IDEAPAD|THINKCENTRE|LOQ)\s+/, '');
                      }
                      const comercial = derivarModeloComercial(encontrado.marca, modelo);
                      setForm(prev => ({
                        ...prev, sku: val, marca: encontrado.marca, modelo,
                        procesador: encontrado.procesador, ram: encontrado.ram,
                        almacenamiento: encontrado.almacenamiento,
                        fichaV2: { ...prev.fichaV2, modeloComercial: comercial },
                      }));
                      setSkuManual(true);
                    }
                  }
                }} placeholder="Escribí el SKU y se auto-rellena" /></div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="p-6 md:p-8 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tmpl.step2.includes('procesador') && <div className="md:col-span-2"><label className="form-label">Procesador *</label><input className="form-input uppercase" value={form.procesador} onChange={e => markDirty('procesador', e.target.value)} required placeholder="INTEL CORE I5-12400F..." /></div>}
                {tmpl.step2.includes('generacion') && <div><label className="form-label">Generación</label>
                  <select className="form-input" value={form.generacion} onChange={e => markDirty('generacion', e.target.value)}>
                    <option value="">Selecciona...</option>
                    {GENERACION_OPTIONS.map(g => <option key={g}>{g}</option>)}
                  </select></div>}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {tmpl.step2.includes('ram') && <div><label className="form-label">RAM *</label>
                  <select className="form-input" value={form.ram} onChange={e => markDirty('ram', e.target.value)}>{RAM_OPTIONS.map(r => <option key={r}>{r}</option>)}</select></div>}
                {tmpl.step2.includes('tipoRam') && <div><label className="form-label">Tipo RAM</label>
                  <select className="form-input" value={form.tipoRam} onChange={e => markDirty('tipoRam', e.target.value)}>{TIPO_RAM_OPTIONS.map(t => <option key={t}>{t}</option>)}</select></div>}
                {tmpl.step2.includes('almacenamiento') && <div><label className="form-label">Almacenamiento *</label>
                  <select className="form-input" value={form.almacenamiento} onChange={e => markDirty('almacenamiento', e.target.value)}>{STORAGE_OPTIONS.map(s => <option key={s}>{s}</option>)}</select></div>}
                {tmpl.step2.includes('tipoDisco') && <div><label className="form-label">Tipo disco *</label><input className="form-input uppercase" value={form.tipoDisco} onChange={e => markDirty('tipoDisco', e.target.value)} required placeholder="M.2 NVME, SSD SATA..." /></div>}
              </div>
              {tmpl.step2.includes('grafica') && (
                <div><label className="form-label">Gráfica</label><input className="form-input uppercase" value={form.grafica} onChange={e => markDirty('grafica', e.target.value)} placeholder="GTX 1650, INTEGRADA..." /></div>
              )}
              {tmpl.step2.includes('resolucion') && (
                <div className="max-w-xs"><label className="form-label">Resolución</label>
                  <select className="form-input" value={form.resolucion} onChange={e => markDirty('resolucion', e.target.value)}>
                    <option value="">Selecciona...</option>
                    {RESOLUCION_OPTIONS.map(r => <option key={r}>{r}</option>)}
                  </select></div>
              )}

              {(() => {
                const connFields = CONECTIVIDAD_OPTIONS.filter(o => tmpl.step2.includes(o.key));
                if (connFields.length === 0) return null;
                return (
                  <SectionHeader icon="fa-wifi" title="Conectividad y Extras" color="bg-emerald-50 text-emerald-600">
                    <span className="text-[10px] font-bold text-slate-400">
                      {connFields.filter(o => form[o.key]).length}/{connFields.length} activas
                    </span>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mt-1">
                      {connFields.map(({ key, label, icon }) => (
                        <button key={key} type="button" onClick={() => markDirty(key, !form[key])}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                            form[key]
                              ? 'bg-brand-50 border-brand-300 text-brand-700'
                              : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                          }`}>
                          <i className={`fa-solid ${icon} ${form[key] ? 'text-brand-500' : 'text-slate-300'}`} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </SectionHeader>
                );
              })()}
            </div>
          )}

          {step === 3 && (
            <div className="p-6 md:p-8 space-y-5">
              <div className={`grid grid-cols-1 gap-4 ${tmpl.step3.includes('bateria') && tmpl.step3.includes('cargador') ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
                <div><label className="form-label">Técnico *</label>
                  <select className="form-input" value={form.tecnico} onChange={e => markDirty('tecnico', e.target.value)} required>
                    <option value="">Selecciona...</option>{TECNICOS.map(t => <option key={t}>{t}</option>)}
                  </select></div>
                {tmpl.step3.includes('bateria') && <div><label className="form-label">Batería *</label><input className="form-input uppercase" value={form.bateria} onChange={e => markDirty('bateria', e.target.value)} required placeholder="100%, 80%, SIN BATERÍA" /></div>}
                {tmpl.step3.includes('cargador') && <div><label className="form-label">Cargador</label><input className="form-input uppercase" value={form.cargador} onChange={e => markDirty('cargador', e.target.value)} placeholder="ORIGINAL 65W, GENÉRICO" /></div>}
                <div><label className="form-label">Estado *</label>
                  <select className="form-input font-semibold" value={form.estado} onChange={e => markDirty('estado', e.target.value)}>
                    {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                  </select></div>
              </div>
              {esEstadoML(form.estado) && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="form-label text-emerald-800">Fecha envío ML *</label><input type="date" className="form-input" value={form.mlFechaEnvio} onChange={e => markDirty('mlFechaEnvio', e.target.value)} required /></div>
                  <div><label className="form-label text-emerald-800">ID Publicación</label><input className="form-input uppercase" value={form.mlPublicacionId} onChange={e => markDirty('mlPublicacionId', e.target.value)} /></div>
                  <div><label className="form-label text-emerald-800">Enviado por *</label><select className="form-input" value={form.mlEnviadoPor} onChange={e => markDirty('mlEnviadoPor', e.target.value)} required>
                    <option value="">Selecciona...</option>
                    {TECNICOS.filter(t => t !== 'VALERIA BARRUETA').map(t => <option key={t}>{t}</option>)}
                  </select></div>
                </div>
              )}
              <div><label className="form-label">Observaciones</label><textarea className="form-input uppercase min-h-[80px]" value={form.observaciones} onChange={e => markDirty('observaciones', e.target.value)} placeholder="Detalles adicionales del equipo" /></div>
            </div>
          )}

          {step === 4 && (
            <div className="p-6 md:p-8 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="form-label">Sistema Operativo</label>
                  <input className="form-input uppercase" value={form.fichaV2.sistemaOperativo} onChange={e => markFichaV2('sistemaOperativo', e.target.value)} placeholder="WINDOWS 11 PRO" /></div>
                <div><label className="form-label">Color</label>
                  <input className="form-input uppercase" value={form.fichaV2.color} onChange={e => markFichaV2('color', e.target.value)} placeholder="NEGRO, PLATA, GRIS" /></div>
                <div><label className="form-label">Pantalla</label>
                  <input className="form-input uppercase" value={form.fichaV2.pantalla} onChange={e => markFichaV2('pantalla', e.target.value)} placeholder='15.6" FHD IPS' /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="form-label">Modelo Comercial</label>
                  <input className="form-input uppercase" value={form.fichaV2.modeloComercial} onChange={e => markFichaV2('modeloComercial', e.target.value)} placeholder="THINKPAD X1 CARBON G10" /></div>
                <div><label className="form-label">Fecha de Revisión</label>
                  <input type="date" className="form-input" value={form.fichaV2.fechaRevision} onChange={e => markFichaV2('fechaRevision', e.target.value)} /></div>
              </div>

              {tmpl.ficha.condicion.length > 0 && (
                <SectionHeader icon="fa-eye" title="Condición Estética" color="bg-orange-50 text-orange-600">
                  <span className="text-[10px] font-bold text-slate-400">
                    {tmpl.ficha.condicion.filter(c => form.fichaV2.condicionEstetica[c]).length}/{tmpl.ficha.condicion.length} evaluadas
                  </span>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-1">
                    {tmpl.ficha.condicion.map(parte => (
                      <div key={parte}>
                        <label className="form-label">{CONDICION_LABELS[parte] || parte}</label>
                        <select className="form-input" value={form.fichaV2.condicionEstetica[parte] || ''} onChange={e => markFichaV2('condicionEstetica.' + parte, e.target.value)}>
                          {ESTADOS_CONDICION.map(o => <option key={o} value={o}>{o || '—'}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </SectionHeader>
              )}

              {tmpl.ficha.bateria.length > 0 && (
                <SectionHeader icon="fa-battery-three-quarters" title="Batería (Detalle)" color="bg-green-50 text-green-600">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-1">
                    <div><label className="form-label">Porcentaje</label>
                      <select className="form-input" value={form.fichaV2.bateriaDetalle.porcentaje} onChange={e => markFichaV2('bateriaDetalle.porcentaje', e.target.value)}>
                        <option value="">—</option>
                        {['100%', '90%', '80%', '70%', '60%', '50%', '40%', '30%', '20%', 'SIN BATERÍA'].map(o => <option key={o}>{o}</option>)}
                      </select></div>
                    <div><label className="form-label">Ciclos</label>
                      <input type="number" className="form-input" min="0" value={form.fichaV2.bateriaDetalle.ciclos} onChange={e => markFichaV2('bateriaDetalle.ciclos', e.target.value)} placeholder="150" /></div>
                    <div><label className="form-label">Condición</label>
                      <select className="form-input" value={form.fichaV2.bateriaDetalle.condicion} onChange={e => markFichaV2('bateriaDetalle.condicion', e.target.value)}>
                        {ESTADOS_BATERIA.map(o => <option key={o} value={o}>{o || '—'}</option>)}
                      </select></div>
                  </div>
                </SectionHeader>
              )}

              {tmpl.ficha.checklist.length > 0 && (
                <SectionHeader icon="fa-clipboard-check" title="Checklist de Pruebas" color="bg-cyan-50 text-cyan-600">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    tmpl.ficha.checklist.every(t => form.fichaV2.checklistPruebas[t] === 'OK')
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {tmpl.ficha.checklist.filter(t => form.fichaV2.checklistPruebas[t] === 'OK').length}/{tmpl.ficha.checklist.length}
                  </span>
                  <VisualChecklist items={tmpl.ficha.checklist} results={form.fichaV2.checklistPruebas} onToggle={toggleChecklist} compact />
                </SectionHeader>
              )}

              <SectionHeader icon="fa-camera" title="Fotos del Equipo" color="bg-pink-50 text-pink-600">
                  <span className="text-[10px] font-bold text-slate-400">
                    {Object.keys(form.fotos).length}/9
                  </span>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-1">
                    {[
                      { key: 'frente', label: 'Frente', icon: 'fa-laptop' },
                      { key: 'posterior', label: 'Posterior', icon: 'fa-rotate-left' },
                      { key: 'laterales', label: 'Laterales', icon: 'fa-arrows-left-right' },
                      { key: 'pantalla', label: 'Pantalla', icon: 'fa-desktop' },
                      { key: 'teclado', label: 'Teclado', icon: 'fa-keyboard' },
                      { key: 'bios', label: 'BIOS', icon: 'fa-microchip' },
                      { key: 'crystalDiskInfo', label: 'CrystalDiskInfo', icon: 'fa-hard-drive' },
                      { key: 'bateria', label: 'Batería', icon: 'fa-battery-three-quarters' },
                      { key: 'etiquetas', label: 'Etiquetas', icon: 'fa-tag' },
                    ].map(({ key, label, icon }) => (
                      <label key={key} className={`relative group flex flex-col items-center gap-1 p-2 rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden ${
                        form.fotos[key]
                          ? 'border-brand-300 bg-brand-50/50'
                          : 'border-slate-200 hover:border-brand-300 bg-slate-50'
                      }`}>
                        {form.fotos[key] ? (
                          <>
                            <img src={form.fotos[key]} alt={label} className="w-full h-14 object-cover rounded-lg" />
                            <button type="button" onClick={e => { e.preventDefault(); e.stopPropagation(); handleFormPhotoDelete(key); }}
                              className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] opacity-0 group-hover:opacity-100 transition shadow">
                              <i className="fa-solid fa-xmark" />
                            </button>
                          </>
                        ) : (
                          <div className="w-full h-14 flex flex-col items-center justify-center">
                            <i className={`fa-solid ${icon} text-slate-300 text-sm`} />
                            <span className="text-[9px] text-slate-400 mt-0.5">{label}</span>
                          </div>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={e => { handleFormPhotoUpload(key, e.target.files); e.target.value = ''; }} />
                      </label>
                    ))}
                  </div>
                </SectionHeader>
            </div>
          )}

          <ActionBar
            stepIndex={currentStepIndex}
            totalSteps={totalSteps}
            editing={editing}
            onPrev={goPrev}
            onNext={goNext}
            onSubmit={handleSubmit}
            onCancel={() => cancelar()}
          />
        </form>

        {mode === 'full' && (
          <div className="hidden lg:block w-72 shrink-0 sticky top-4">
            <LivePreview form={form} tmpl={tmpl} />
          </div>
        )}
      </div>
    </section>
  );
}
