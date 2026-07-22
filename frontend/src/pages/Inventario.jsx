import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useInventario } from '../context/InventarioContext';
import { useNotify } from '../componentes/Notification';
import { CATEGORIAS, ESTADOS, RAM_OPTIONS, STORAGE_OPTIONS, TECNICOS, GENERACION_OPTIONS, TIPO_RAM_OPTIONS, RESOLUCION_OPTIONS, ANIO_OPTIONS, esEstadoML, generarCodigoSiguiente, buscarSku, buscarPorSku, aprenderSku, derivarModeloComercial } from '../utils/inventario';
import { getTemplate, FIELD_GROUPS } from '../utils/formTemplates';
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
};

export default function Inventario() {
  useDocumentTitle('Entrada de equipos');
  const { inventario } = useInventario();
  const { notify } = useNotify();
  const [params] = useSearchParams();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [skuManual, setSkuManual] = useState(false);

  const tmpl = useMemo(() => getTemplate(form.categoria), [form.categoria]);

  const hasField = (fieldKey) => tmpl.step2.includes(fieldKey) || tmpl.step3.includes(fieldKey) || tmpl.ficha.condicion.includes(fieldKey) || tmpl.ficha.bateria.includes(fieldKey) || tmpl.ficha.checklist.includes(fieldKey);

  const generarSku = (modelo, marca, procesador) => {
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
  };

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
        checklistPruebas: { ...prev.fichaV2.checklistPruebas, [test]: prev.fichaV2.checklistPruebas[test] === 'OK' ? null : 'OK' },
      },
    }));
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
      setForm(f => ({ ...f, codigo: generarCodigoSiguiente(inventario), fichaV2: { ...f.fichaV2, fechaRevision: hoy } }));
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
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    setForm({ ...emptyForm, codigo: nextCodigo, fichaV2: { ...emptyFichaV2, fechaRevision: hoy } });
    setStep(1);
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">{editing ? '✏️ Modificando Ficha' : 'Entrada de equipos'}</h2>
          <p className="text-slate-500 text-sm">Registro en 4 pasos</p>
        </div>
{editing && (
  <>
  <a href={`/ficha-v2/${form.codigo}`} target="_blank" className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
    <i className="fa-solid fa-file-lines" /> Ficha
  </a>
  <a href={`/galeria/${form.codigo}`} target="_blank" className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
    <i className="fa-solid fa-camera" /> Galería
  </a>
  <a href={`/documentos/${form.codigo}`} target="_blank" className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
    <i className="fa-solid fa-folder-open" /> Documentos
  </a>
  <a href={`/etiquetas/${form.codigo}`} target="_blank" className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
    <i className="fa-solid fa-tag" /> Etiqueta
  </a>
  </>
)}
      </div>

      <div className="flex items-center gap-2 animate-fade-in">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className="flex items-center flex-1 last:flex-none last:gap-0">
            <div className={`flex items-center gap-2 ${s < 4 ? 'flex-1' : ''}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                step === s ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30 scale-110' :
                step > s ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
              }`}>
                {step > s ? <i className="fa-solid fa-check" /> : s}
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider ${
                step === s ? 'text-brand-600' : step > s ? 'text-emerald-600' : 'text-slate-400'
              }`}>
                {s === 1 ? 'Identificación' : s === 2 ? 'Hardware' : s === 3 ? 'Estado y técnico' : 'Ficha técnica'}
              </span>
            </div>
            {s < 4 && (
              <div className={`flex-1 h-0.5 mx-3 rounded transition-all duration-500 ${
                step > s ? 'bg-emerald-400' : 'bg-slate-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {form.categoria && step > 1 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 text-sm animate-fade-in">
          <i className={`fa-solid ${tmpl.icon}`} />
          <span className="font-bold">{tmpl.label}</span>
          <span className="text-brand-500">—</span>
          <span>{tmpl.description}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleSubmit(e); } }} className="panel overflow-hidden animate-fade-in">
        {step === 1 && (
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div><label className="form-label">Código (Auto) *</label><input className="form-input font-mono font-bold" value={form.codigo} readOnly title="Código generado automáticamente" /></div>
            <div><label className="form-label">Categoría *</label>
              <select className="form-input" value={form.categoria} onChange={e => markDirty('categoria', e.target.value)} required>
                <option value="">Selecciona...</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select></div>
            <div><label className="form-label">Marca *</label><input className="form-input uppercase" value={form.marca} onChange={e => markDirty('marca', e.target.value)} required title="Ej: HP, LENOVO, DELL" /></div>
            <div><label className="form-label">Modelo *</label><input className="form-input uppercase" value={form.modelo} onChange={e => markDirty('modelo', e.target.value)} required title="Ej: PROBOOK 450 G10" /></div>
            <div><label className="form-label">Número de serie *</label><input className="form-input font-mono uppercase" value={form.serie} onChange={e => markDirty('serie', e.target.value)} required title="S/N grabado en el equipo" /></div>
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
            }} title="Escribí el SKU y al salir del campo se auto-rellena" /></div>
            <div><label className="form-label">Año</label>
              <select className="form-input" value={form.anio} onChange={e => markDirty('anio', e.target.value)}>
                {ANIO_OPTIONS.map(a => <option key={a}>{a}</option>)}
              </select></div>
          </div>
        )}

        {step === 2 && (
          <div className="p-6 md:p-8 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {tmpl.step2.includes('procesador') && <div><label className="form-label">Procesador *</label><input className="form-input uppercase" value={form.procesador} onChange={e => markDirty('procesador', e.target.value)} required title="Ej: INTEL CORE I5-12400F" /></div>}
              {tmpl.step2.includes('generacion') && <div><label className="form-label">Generación</label>
                <select className="form-input" value={form.generacion} onChange={e => markDirty('generacion', e.target.value)}>
                  <option value="">Selecciona...</option>
                  {GENERACION_OPTIONS.map(g => <option key={g}>{g}</option>)}
                </select></div>}
              {tmpl.step2.includes('ram') && <div><label className="form-label">RAM *</label>
                <select className="form-input" value={form.ram} onChange={e => markDirty('ram', e.target.value)}>{RAM_OPTIONS.map(r => <option key={r}>{r}</option>)}</select></div>}
              {tmpl.step2.includes('tipoRam') && <div><label className="form-label">Tipo de RAM</label>
                <select className="form-input" value={form.tipoRam} onChange={e => markDirty('tipoRam', e.target.value)}>{TIPO_RAM_OPTIONS.map(t => <option key={t}>{t}</option>)}</select></div>}
              {tmpl.step2.includes('almacenamiento') && <div><label className="form-label">Almacenamiento *</label>
                <select className="form-input" value={form.almacenamiento} onChange={e => markDirty('almacenamiento', e.target.value)}>{STORAGE_OPTIONS.map(s => <option key={s}>{s}</option>)}</select></div>}
              {tmpl.step2.includes('tipoDisco') && <div><label className="form-label">Tipo de disco *</label><input className="form-input uppercase" value={form.tipoDisco} onChange={e => markDirty('tipoDisco', e.target.value)} required title="Ej: M.2 NVME, SSD SATA, HDD" /></div>}
              {tmpl.step2.includes('grafica') && <div><label className="form-label">Gráfica</label><input className="form-input uppercase" value={form.grafica} onChange={e => markDirty('grafica', e.target.value)} title="Ej: GTX 1650, INTEGRADA" /></div>}
              {tmpl.step2.includes('resolucion') && <div><label className="form-label">Resolución</label>
                <select className="form-input" value={form.resolucion} onChange={e => markDirty('resolucion', e.target.value)}>
                  <option value="">Selecciona...</option>
                  {RESOLUCION_OPTIONS.map(r => <option key={r}>{r}</option>)}
                </select></div>}
            </div>

            {(() => {
              const connFields = CONECTIVIDAD_OPTIONS.filter(o => tmpl.step2.includes(o.key));
              if (connFields.length === 0) return null;
              return (
                <div className="border-t border-slate-200 pt-5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Conectividad y Extras</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
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
                </div>
              );
            })()}
          </div>
        )}

        {step === 3 && (
          <div className="p-6 md:p-8 space-y-5">
            <div className={`grid grid-cols-1 gap-5 ${tmpl.step3.includes('bateria') && tmpl.step3.includes('cargador') ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
              <div><label className="form-label">Técnico *</label>
                <select className="form-input" value={form.tecnico} onChange={e => markDirty('tecnico', e.target.value)} required>
                  <option value="">Selecciona...</option>{TECNICOS.map(t => <option key={t}>{t}</option>)}
                </select></div>
              {tmpl.step3.includes('bateria') && <div><label className="form-label">Batería *</label><input className="form-input uppercase" value={form.bateria} onChange={e => markDirty('bateria', e.target.value)} required title="Ej: 100%, 80%, SIN BATERÍA" /></div>}
              {tmpl.step3.includes('cargador') && <div><label className="form-label">Cargador</label><input className="form-input uppercase" value={form.cargador} onChange={e => markDirty('cargador', e.target.value)} title="Ej: ORIGINAL 65W, GENÉRICO" /></div>}
              <div><label className="form-label">Estado *</label>
                <select className="form-input font-semibold" value={form.estado} onChange={e => markDirty('estado', e.target.value)}>
                  {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select></div>
            </div>
            {esEstadoML(form.estado) && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="form-label text-emerald-800">Fecha envío ML *</label><input type="date" className="form-input" value={form.mlFechaEnvio} onChange={e => markDirty('mlFechaEnvio', e.target.value)} required /></div>
                <div><label className="form-label text-emerald-800">ID Publicación</label><input className="form-input uppercase" value={form.mlPublicacionId} onChange={e => markDirty('mlPublicacionId', e.target.value)} title="ID de la publicación en ML" /></div>
                <div><label className="form-label text-emerald-800">Enviado por *</label><select className="form-input" value={form.mlEnviadoPor} onChange={e => markDirty('mlEnviadoPor', e.target.value)} required>
                  <option value="">Selecciona...</option>
                  {TECNICOS.filter(t => t !== 'VALERIA BARRUETA').map(t => <option key={t}>{t}</option>)}
                </select></div>
              </div>
            )}
            <div><label className="form-label">Observaciones</label><textarea className="form-input uppercase min-h-[80px]" value={form.observaciones} onChange={e => markDirty('observaciones', e.target.value)} title="Detalles adicionales del equipo" /></div>
          </div>
        )}

        {step === 4 && (
          <div className="p-6 md:p-8 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div><label className="form-label">Sistema Operativo</label>
                <input className="form-input uppercase" value={form.fichaV2.sistemaOperativo} onChange={e => markFichaV2('sistemaOperativo', e.target.value)} placeholder="Ej: WINDOWS 11 PRO" /></div>
              <div><label className="form-label">Color</label>
                <input className="form-input uppercase" value={form.fichaV2.color} onChange={e => markFichaV2('color', e.target.value)} placeholder="Ej: NEGRO, PLATA, GRIS" /></div>
              <div><label className="form-label">Pantalla</label>
                <input className="form-input uppercase" value={form.fichaV2.pantalla} onChange={e => markFichaV2('pantalla', e.target.value)} placeholder='Ej: 15.6" FHD IPS' /></div>
              <div><label className="form-label">Modelo Comercial</label>
                <input className="form-input uppercase" value={form.fichaV2.modeloComercial} onChange={e => markFichaV2('modeloComercial', e.target.value)} placeholder="Ej: THINKPAD X1 CARBON G10" /></div>
              <div><label className="form-label">Fecha de Revisión</label>
                <input type="date" className="form-input" value={form.fichaV2.fechaRevision} onChange={e => markFichaV2('fechaRevision', e.target.value)} /></div>
            </div>

            {tmpl.ficha.condicion.length > 0 && (
              <div className="border-t border-slate-200 pt-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Condición Estética</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {tmpl.ficha.condicion.map(parte => (
                    <div key={parte}>
                      <label className="form-label">{CONDICION_LABELS[parte] || parte}</label>
                      <select className="form-input" value={form.fichaV2.condicionEstetica[parte] || ''} onChange={e => markFichaV2('condicionEstetica.' + parte, e.target.value)}>
                        {ESTADOS_CONDICION.map(o => <option key={o} value={o}>{o || '—'}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tmpl.ficha.bateria.length > 0 && (
              <div className="border-t border-slate-200 pt-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Batería (detalle)</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="form-label">Porcentaje</label>
                    <select className="form-input" value={form.fichaV2.bateriaDetalle.porcentaje} onChange={e => markFichaV2('bateriaDetalle.porcentaje', e.target.value)}>
                      <option value="">—</option>
                      {['100%', '90%', '80%', '70%', '60%', '50%', '40%', '30%', '20%', 'SIN BATERÍA'].map(o => <option key={o}>{o}</option>)}
                    </select></div>
                  <div><label className="form-label">Ciclos</label>
                    <input type="number" className="form-input" min="0" value={form.fichaV2.bateriaDetalle.ciclos} onChange={e => markFichaV2('bateriaDetalle.ciclos', e.target.value)} placeholder="Ej: 150" /></div>
                  <div><label className="form-label">Condición</label>
                    <select className="form-input" value={form.fichaV2.bateriaDetalle.condicion} onChange={e => markFichaV2('bateriaDetalle.condicion', e.target.value)}>
                      {ESTADOS_BATERIA.map(o => <option key={o} value={o}>{o || '—'}</option>)}
                    </select></div>
                </div>
              </div>
            )}

            {tmpl.ficha.checklist.length > 0 && (
              <div className="border-t border-slate-200 pt-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Checklist de Pruebas</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {tmpl.ficha.checklist.map(test => (
                    <button key={test} type="button" onClick={() => toggleChecklist(test)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                        form.fichaV2.checklistPruebas[test] === 'OK'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}>
                      <i className={`fa-solid ${form.fichaV2.checklistPruebas[test] === 'OK' ? 'fa-circle-check text-emerald-500' : 'fa-circle text-slate-300'}`} />
                      {test}
                    </button>
                  ))}
                </div>
              </div>
            )}


          </div>
        )}

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between">
          {step > 1 ? <button type="button" onClick={() => setStep(s => s - 1)} className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-600">Anterior</button> : <div />}
          {step < 4 ? (
            <button type="button" onClick={() => setStep(s => s + 1)} className="btn-brand px-6 py-2.5 rounded-xl text-white text-sm font-bold">Siguiente</button>
          ) : (
            <div className="flex gap-2">
              {editing && <button type="button" onClick={cancelar} className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold">Cancelar</button>}
              <button type="submit" className="btn-brand px-6 py-2.5 rounded-xl text-white text-sm font-bold">{editing ? 'Guardar Cambios' : 'Guardar Registro'}</button>
            </div>
          )}
        </div>
      </form>
    </section>
  );
}
