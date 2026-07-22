import { useMemo, useState } from 'react';
import { useInventario } from '../context/InventarioContext';
import { Link } from 'react-router-dom';
import useDocumentTitle from '../utils/useDocumentTitle';

const ALERT_CATEGORIES = [
  { key: 'sinFotos', label: 'Sin Fotografías', icon: 'fa-camera', color: 'text-amber-500', bgColor: 'bg-amber-50' },
  { key: 'sinDiagnostico', label: 'Sin Diagnóstico', icon: 'fa-stethoscope', color: 'text-purple-500', bgColor: 'bg-purple-50' },
  { key: 'sinSerie', label: 'Sin Número de Serie', icon: 'fa-barcode', color: 'text-red-500', bgColor: 'bg-red-50' },
  { key: 'sinCargador', label: 'Sin Cargador', icon: 'fa-plug', color: 'text-blue-500', bgColor: 'bg-blue-50' },
  { key: 'pendientes', label: 'Equipos Pendientes', icon: 'fa-clock', color: 'text-orange-500', bgColor: 'bg-orange-50' },
  { key: 'sinRevision', label: 'Sin Revisión Asignada', icon: 'fa-user-slash', color: 'text-slate-400', bgColor: 'bg-slate-50' },
];

export default function AlertasPanel() {
  useDocumentTitle('Centro de Alertas');
  const { inventario } = useInventario();
  const [activeFilter, setActiveFilter] = useState('');
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('equipmaster_dismissed_alerts') || '{}'); } catch { return {}; }
  });

  const alertas = useMemo(() => {
    const result = { sinFotos: [], sinDiagnostico: [], sinSerie: [], sinCargador: [], pendientes: [], sinRevision: [] };

    inventario.forEach(item => {
      if (item.estado?.includes('🔴 VENDIDO')) return;

      if (!item.fotos || Object.keys(item.fotos).length === 0)
        result.sinFotos.push(item);

      if (!item.checklistPruebas || Object.keys(item.checklistPruebas).length === 0)
        result.sinDiagnostico.push(item);

      if (!item.serie || item.serie === 'N/A')
        result.sinSerie.push(item);

      if (!item.cargador || item.cargador === 'N/A')
        result.sinCargador.push(item);

      if (item.estado?.includes('🟠') || item.estado?.includes('🟡'))
        result.pendientes.push(item);

      if (!item.tecnico || item.tecnico === '')
        result.sinRevision.push(item);
    });

    return result;
  }, [inventario]);

  const totalAlertas = Object.values(alertas).reduce((acc, arr) => acc + arr.length, 0);
  const filteredItems = activeFilter ? alertas[activeFilter] || [] : [];
  const activeCategory = ALERT_CATEGORIES.find(c => c.key === activeFilter);

  const dismissAlert = (codigo) => {
    const next = { ...dismissed, [codigo]: Date.now() };
    setDismissed(next);
    localStorage.setItem('equipmaster_dismissed_alerts', JSON.stringify(next));
  };

  const isDismissed = (codigo) => {
    if (!dismissed[codigo]) return false;
    const hoursSince = (Date.now() - dismissed[codigo]) / (1000 * 60 * 60);
    return hoursSince < 24;
  };

  return (
    <section className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900">Centro de Alertas</h2>
        <p className="text-slate-500 text-sm">{totalAlertas} alerta{totalAlertas !== 1 ? 's' : ''} activa{totalAlertas !== 1 ? 's' : ''} en el sistema</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {ALERT_CATEGORIES.map(cat => {
          const count = alertas[cat.key]?.length || 0;
          return (
            <button key={cat.key} onClick={() => setActiveFilter(activeFilter === cat.key ? '' : cat.key)}
              className={`panel p-4 text-left transition-all hover:scale-[1.02] ${activeFilter === cat.key ? 'ring-2 ring-brand-500 border-brand-300' : ''}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cat.bgColor}`}>
                  <i className={`fa-solid ${cat.icon} ${cat.color} text-sm`} />
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">{cat.label}</p>
              <p className={`text-2xl font-extrabold mt-1 ${count > 0 ? 'text-slate-800' : 'text-slate-200'}`}>{count}</p>
            </button>
          );
        })}
      </div>

      {activeFilter && (
        <div className="panel overflow-hidden animate-fade-in">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <i className={`fa-solid ${activeCategory?.icon} ${activeCategory?.color}`} />
              {activeCategory?.label} ({filteredItems.length})
            </h3>
            <button onClick={() => setActiveFilter('')} className="text-xs font-bold text-slate-400 hover:text-slate-600">Cerrar</button>
          </div>
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {filteredItems.filter(i => !isDismissed(i.codigo)).length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <i className="fa-solid fa-check-circle text-emerald-400 text-3xl mb-2 block" />
                <p className="text-sm">Sin alertas en esta categoría</p>
              </div>
            ) : (
              filteredItems.filter(i => !isDismissed(i.codigo)).map(item => (
                <div key={item.codigo} className="px-5 py-3 flex items-center gap-4 hover:bg-slate-50 transition">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeCategory?.bgColor} shrink-0`}>
                    <i className={`fa-solid ${activeCategory?.icon} ${activeCategory?.color} text-sm`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link to={`/ficha-v2/${item.codigo}`} className="font-mono font-bold text-brand-600 text-xs hover:underline">{item.codigo}</Link>
                      <span className="text-sm font-bold text-slate-800 truncate">{item.marca} {item.modelo}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{item.serie} · {item.categoria} · {item.tecnico || 'Sin técnico'}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link to={`/inventario?editar=${item.codigo}`} className="p-2 rounded-lg hover:bg-white text-slate-400 hover:text-brand-600 transition text-xs" title="Editar">
                      <i className="fa-solid fa-pen" />
                    </Link>
                    <button onClick={() => dismissAlert(item.codigo)} className="p-2 rounded-lg hover:bg-white text-slate-400 hover:text-slate-600 transition text-xs" title="Ocultar 24h">
                      <i className="fa-solid fa-eye-slash" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {!activeFilter && totalAlertas > 0 && (
        <div className="text-center py-8 text-slate-400">
          <i className="fa-solid fa-arrow-pointer text-3xl mb-2 block" />
          <p className="text-sm">Selecciona una categoría arriba para ver los detalles</p>
        </div>
      )}

      {!activeFilter && totalAlertas === 0 && (
        <div className="text-center py-12 text-slate-400">
          <i className="fa-solid fa-check-double text-emerald-400 text-4xl mb-3 block" />
          <p className="text-sm font-bold">Todo en orden — Sin alertas</p>
        </div>
      )}
    </section>
  );
}
