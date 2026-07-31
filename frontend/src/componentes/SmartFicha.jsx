import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotify } from './Notification';
import { api } from '../services/api';
import { ESTADOS, badgeEstado, formatearFechaRegistro, nombreEquipo } from '../utils/inventario';

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3 text-sm py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="text-slate-800 text-right font-medium">{value || 'N/A'}</span>
    </div>
  );
}

function Seccion({ icon, title, children }) {
  return (
    <div>
      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
        <i className={`fa-solid ${icon} text-brand-500`} /> {title}
      </h4>
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
        {children}
      </div>
    </div>
  );
}

export default function SmartFicha({ item, onClose }) {
  const navigate = useNavigate();
  const { notify } = useNotify();
  const [estado, setEstado] = useState(item.estado || '');
  const [guardando, setGuardando] = useState(false);
  const [verHistorial, setVerHistorial] = useState(false);

  const foto = item.fotos?.frente;
  const titulo = nombreEquipo(item.marca, item.modelo) || item.codigo;

  const ram = item.ram && item.ram !== 'N/A' ? `${item.ram}${item.tipoRam && item.tipoRam !== 'NO APLICA' ? ` · ${item.tipoRam}` : ''}` : '';
  const disco = item.almacenamiento && item.almacenamiento !== 'N/A' ? `${item.almacenamiento}${item.tipoDisco ? ` · ${item.tipoDisco}` : ''}` : '';
  const specs = [
    { label: 'Procesador', value: item.procesador },
    { label: 'Memoria RAM', value: ram },
    { label: 'Disco duro', value: disco },
    { label: 'Gráfica', value: item.grafica },
    { label: 'Generación', value: item.generacion },
    { label: 'Sistema operativo', value: item.sistemaOperativo },
    { label: 'Resolución', value: item.resolucion },
    { label: 'Color', value: item.color },
  ].filter(s => s.value);

  const observaciones = (item.observaciones || '')
    .split('\n').map(l => l.trim()).filter(Boolean)
    .filter(l => !/^SIN OBSERVACIONES/i.test(l));

  const lineasResumen = [
    titulo,
    `SKU: ${item.sku || 'N/A'}`,
    `Tipo: ${item.categoria || 'N/A'}`,
    `Serie: ${item.serie || 'N/A'}`,
    ...specs.map(s => `${s.label}: ${s.value}`),
    `Estado: ${estado || 'N/A'}`,
  ];

  const ir = (path) => {
    onClose();
    navigate(path);
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(lineasResumen.join('\n'));
      notify('Copiado', 'Especificaciones copiadas al portapapeles.', 'success');
    } catch {
      notify('Error', 'No se pudo copiar el contenido.', 'error');
    }
  };

  const guardarEstado = async () => {
    if (estado === item.estado) return;
    setGuardando(true);
    try {
      await api.saveEquipo(item.codigo, { ...item, estado });
      notify('Estado actualizado', `${item.codigo} ahora está: ${estado}`, 'success');
    } catch (err) {
      notify('Error', err.message || 'No se pudo actualizar el estado.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const acciones = [
    { icon: 'fa-file-lines', label: 'Ficha completa', fn: () => ir(`/ficha-v2/${item.codigo}`) },
    { icon: 'fa-pen-to-square', label: 'Editar', fn: () => ir(`/inventario?editar=${item.codigo}`) },
    { icon: 'fa-print', label: 'Etiqueta', fn: () => ir(`/etiquetas/${item.codigo}`) },
    { icon: 'fa-copy', label: 'Copiar specs', fn: copiar },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col animate-fade-in dark:bg-slate-900 dark:border dark:border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-200 flex items-center justify-between dark:border-slate-700">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 dark:text-white">
            <i className="fa-solid fa-bolt text-brand-500" /> Ficha rápida
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition dark:hover:bg-slate-800">
            <i className="fa-solid fa-xmark text-slate-500" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-4">
          <div className="flex gap-3">
            {foto ? (
              <img src={foto} alt={item.codigo} className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-slate-200 shrink-0" />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 dark:bg-slate-800">
                <i className="fa-solid fa-laptop text-slate-300 text-2xl" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-bold text-slate-900 leading-tight dark:text-white">{titulo}</p>
              <p className="text-xs text-slate-500 mt-0.5">{item.categoria || 'Sin categoría'}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-[11px] font-mono font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md dark:bg-slate-800 dark:text-slate-300">{item.codigo}</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badgeEstado(estado)}`}>{estado || 'N/A'}</span>
              </div>
            </div>
          </div>

          <Seccion icon="fa-address-card" title="Información general">
            <Row label="Marca" value={item.marca} />
            <Row label="Modelo" value={item.modelo} />
            <Row label="SKU" value={item.sku} />
            <Row label="Serie" value={item.serie} />
          </Seccion>

          <Seccion icon="fa-microchip" title="Especificaciones">
            {specs.length > 0 ? specs.map(s => <Row key={s.label} label={s.label} value={s.value} />) : (
              <p className="text-sm text-slate-400 py-1">Sin especificaciones registradas.</p>
            )}
          </Seccion>

          <Seccion icon="fa-shield-halved" title="Estado del equipo">
            <div className="py-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  className="form-input !py-1.5 !text-sm flex-1 min-w-[140px]"
                  value={estado}
                  onChange={e => setEstado(e.target.value)}
                >
                  {!ESTADOS.some(o => o.value === estado) && estado && <option value={estado}>{estado}</option>}
                  {ESTADOS.map(o => <option key={o.value} value={o.value}>{o.value}</option>)}
                </select>
                <button
                  onClick={guardarEstado}
                  disabled={guardando || estado === item.estado}
                  className="btn-brand !py-1.5 !text-sm"
                >
                  <i className="fa-solid fa-floppy-disk" /> {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
            <Row label="Fecha de ingreso" value={formatearFechaRegistro(item.fechaRegistro)} />
            <Row label="Técnico" value={item.tecnico} />
            {item.garantia && <Row label="Garantía" value={item.garantia} />}
          </Seccion>

          {observaciones.length > 0 && (
            <Seccion icon="fa-clipboard-list" title="Observaciones">
              <ul className="py-1 space-y-1">
                {observaciones.map((l, i) => (
                  <li key={i} className="text-sm text-slate-700 flex gap-2 dark:text-slate-200">
                    <i className="fa-solid fa-angle-right text-brand-400 mt-0.5" /> {l}
                  </li>
                ))}
              </ul>
            </Seccion>
          )}

          {item.historial && item.historial.length > 0 && (
            <div>
              <button
                onClick={() => setVerHistorial(v => !v)}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1.5 dark:text-brand-400"
              >
                <i className={`fa-solid fa-clock-rotate-left ${verHistorial ? 'text-brand-600' : ''}`} />
                Ver historial ({item.historial.length})
                <i className={`fa-solid fa-chevron-${verHistorial ? 'up' : 'down'} text-[10px]`} />
              </button>
              {verHistorial && (
                <div className="mt-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 dark:bg-slate-800 dark:border-slate-700">
                  {item.historial.slice(-8).reverse().map((h, i) => (
                    <div key={i} className="py-1.5 border-b border-slate-100 last:border-0 dark:border-slate-700">
                      <p className="text-xs text-slate-500">
                        {formatearFechaRegistro(h.fecha)} · <span className="font-semibold text-slate-600 dark:text-slate-300">{h.usuario || 'SISTEMA'}</span>
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-200">{h.cambios}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-slate-200 grid grid-cols-4 gap-2 dark:border-slate-700">
          {acciones.map(a => (
            <button
              key={a.label}
              onClick={a.fn}
              className="flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-200 text-slate-700 hover:text-brand-700 transition-all dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 dark:text-slate-200"
              title={a.label}
            >
              <i className={`fa-solid ${a.icon} text-lg`} />
              <span className="text-[10px] font-semibold leading-tight text-center">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
