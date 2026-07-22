import { useMemo, useRef, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useInventario } from '../context/InventarioContext';
import { useNotify } from '../componentes/Notification';
import { badgeEstado, ESTADOS } from '../utils/inventario';
import useDocumentTitle from '../utils/useDocumentTitle';
import { SkeletonTable } from '../componentes/Skeleton';

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const btnRef = useRef(null);
  const { notify } = useNotify();
  const handle = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }).catch(() => copiarFallback());
    } else {
      copiarFallback();
    }
  };
  const copiarFallback = () => {
    if (btnRef.current) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        notify('Error', 'No se pudo copiar al portapapeles', 'error');
      }
      document.body.removeChild(textarea);
    }
  };
  return (
    <button ref={btnRef} onClick={handle} title="Copiar al portapapeles"
      className="inline-flex items-center gap-1 text-slate-400 hover:text-emerald-500 transition ml-1 text-xs">
      <i className={`fa-solid ${copied ? 'fa-check text-emerald-500' : 'fa-copy'}`} />
    </button>
  );
}

const QUICK_FILTERS = [
  { key: 'sin_fotos', label: 'Sin fotos', icon: 'fa-camera', color: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200' },
  { key: 'sin_serie', label: 'Sin serie', icon: 'fa-barcode', color: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200' },
  { key: 'antiguedad_30', label: '30+ días', icon: 'fa-clock', color: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200' },
  { key: 'antiguedad_60', label: '60+ días', icon: 'fa-clock', color: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200' },
  { key: 'antiguedad_90', label: '90+ días', icon: 'fa-clock', color: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200' },
];

const PAGE_SIZE = 15;

export default function BaseDatos() {
  useDocumentTitle('Base de Datos');
  const { inventario, loading } = useInventario();
  const { notify } = useNotify();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [sortKey, setSortKey] = useState('codigo');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [compact, setCompact] = useState(() => localStorage.getItem('equipmaster_compact_table') === 'true');
  const [selected, setSelected] = useState([]);
  const [bulkEstado, setBulkEstado] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [quickFilter, setQuickFilter] = useState('');

  const exportExcel = async () => {
    try {
      await api.downloadExcel();
      notify('Excel descargado', 'Base unificada lista en tu computadora.', 'success');
    } catch (err) {
      notify('Error', err.message, 'error');
    }
  };

  const toggleSelect = (codigo) => {
    setSelected(prev => prev.includes(codigo) ? prev.filter(c => c !== codigo) : [...prev, codigo]);
  };

  const toggleSelectAll = () => {
    const pageItems = paginated.map(i => i.codigo);
    if (selected.length === pageItems.length) setSelected([]);
    else setSelected(pageItems);
  };

  const handleBulkEstado = async () => {
    if (!bulkEstado || selected.length === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all(selected.map(codigo => {
        const item = inventario.find(i => i.codigo === codigo);
        if (!item) return Promise.resolve();
        return api.saveEquipo(codigo, { ...item, estado: bulkEstado });
      }));
      notify('Estado actualizado', `${selected.length} equipo(s) actualizados a "${bulkEstado}"`, 'success');
      setSelected([]);
      setBulkEstado('');
    } catch (err) {
      notify('Error', err.message, 'error');
    }
    setBulkLoading(false);
  };

  const handleBulkExport = () => {
    const items = inventario.filter(i => selected.includes(i.codigo));
    const filas = items.map(i => ({
      Código: i.codigo, Marca: i.marca, Modelo: i.modelo, Serie: i.serie, SKU: i.sku,
      Procesador: i.procesador, RAM: i.ram, Almacenamiento: i.almacenamiento,
      Estado: i.estado, Técnico: i.tecnico, Fecha: i.fechaRegistro,
    }));
    const csv = [Object.keys(filas[0]).join(','), ...filas.map(r => Object.values(r).map(v => `"${v || ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seleccion_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify('CSV exportado', `${items.length} equipos descargados.`, 'success');
  };

  const handleBulkDelete = async () => {
    setBulkLoading(true);
    try {
      await Promise.all(selected.map(codigo => api.eliminarEquipo(codigo)));
      notify('Eliminados', `${selected.length} equipo(s) eliminados.`, 'success');
      setSelected([]);
      setShowBulkModal(false);
    } catch (err) {
      notify('Error', err.message, 'error');
    }
    setBulkLoading(false);
  };

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ k }) => (
    <span className="ml-1 inline-block w-3 text-slate-400">
      {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let items = q
      ? inventario.filter(i =>
          (i.codigo || '').toLowerCase().includes(q) ||
          (i.marca || '').toLowerCase().includes(q) ||
          (i.modelo || '').toLowerCase().includes(q) ||
          (i.serie || '').toLowerCase().includes(q) ||
          (i.sku || '').toLowerCase().includes(q) ||
          (i.tecnico || '').toLowerCase().includes(q) ||
          (i.estado || '').toLowerCase().includes(q)
        )
      : [...inventario];

    if (quickFilter) {
      const hoy = new Date();
      items = items.filter(i => {
        if (quickFilter === 'sin_fotos') {
          const fotos = i.fotos;
          return !fotos || Object.keys(fotos).length === 0;
        }
        if (quickFilter === 'sin_serie') return !i.serie || i.serie.trim() === '' || i.serie === 'N/A';
        if (quickFilter === 'antiguedad_30' || quickFilter === 'antiguedad_60' || quickFilter === 'antiguedad_90') {
          if (!i.fechaRegistro) return false;
          const dias = Math.floor((hoy - new Date(i.fechaRegistro)) / 86400000);
          const min = quickFilter === 'antiguedad_30' ? 30 : quickFilter === 'antiguedad_60' ? 60 : 90;
          return dias >= min;
        }
        return true;
      });
    }

    if (sortKey) {
      items.sort((a, b) => {
        let va = (a[sortKey] || '').toString().toLowerCase();
        let vb = (b[sortKey] || '').toString().toLowerCase();
        if (sortKey === 'codigo') {
          const na = parseInt(va.replace('inv-', ''), 10) || 0;
          const nb = parseInt(vb.replace('inv-', ''), 10) || 0;
          return sortDir === 'asc' ? na - nb : nb - na;
        }
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    }
    return items;
  }, [inventario, search, sortKey, sortDir, quickFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const Th = ({ k, children }) => (
    <th className="px-6 py-4 text-xs font-bold uppercase cursor-pointer select-none hover:text-brand-600 transition-colors" onClick={() => toggleSort(k)}>
      {children}<SortIcon k={k} />
    </th>
  );

  if (loading) return (
    <section className="space-y-6 animate-fade-in">
      <div className="panel p-6"><h2 className="text-xl font-bold text-slate-900">Inventario General Compartido</h2><p className="text-slate-500 text-sm">Cargando datos...</p></div>
      <div className="panel overflow-hidden"><SkeletonTable rows={8} cols={8} /></div>
    </section>
  );

  return (
    <section className="space-y-6 animate-fade-in">
      <div className="panel p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-slide-up">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Inventario General Compartido</h2>
          <p className="text-slate-500 text-sm">{filtered.length} equipo{filtered.length !== 1 ? 's' : ''} · {inventario.length} totales{quickFilter && <span className="ml-1 font-bold text-brand-600">(filtro activo)</span>}</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input className="form-input pl-9 py-2.5 text-sm w-full sm:w-56" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar código, marca, serie..." />
          </div>
          <button onClick={exportExcel} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all hover:scale-[1.02]">
            <i className="fa-solid fa-file-excel" /> Excel
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 animate-slide-up" style={{ animationDelay: '50ms' }}>
        <span className="text-[11px] font-bold text-slate-400 uppercase self-center mr-1">Filtros rápidos:</span>
        {QUICK_FILTERS.map(f => (
          <button key={f.key} onClick={() => { setQuickFilter(q => q === f.key ? '' : f.key); setPage(1); }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
              quickFilter === f.key
                ? 'bg-brand-500 text-white border-brand-500 shadow scale-105'
                : f.color
            }`}>
            <i className={`fa-solid ${f.icon} text-[10px]`} /> {f.label}
          </button>
        ))}
        {quickFilter && (
          <button onClick={() => { setQuickFilter(''); setPage(1); }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-slate-500 hover:text-slate-700 transition">
            <i className="fa-solid fa-xmark" /> Limpiar
          </button>
        )}
      </div>

      {selected.length > 0 && (
        <div className="panel p-4 flex flex-wrap items-center gap-3 animate-fade-in">
          <span className="text-sm font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-full">
            {selected.length} seleccionado{selected.length > 1 ? 's' : ''}
          </span>
          <select value={bulkEstado} onChange={e => setBulkEstado(e.target.value)} className="form-input text-sm py-1.5 w-48">
            <option value="">Cambiar estado a...</option>
            {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
          <button onClick={handleBulkEstado} disabled={!bulkEstado || bulkLoading} className="px-4 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-bold disabled:opacity-40 hover:bg-brand-700 transition">
            <i className="fa-solid fa-check mr-1" /> Aplicar
          </button>
          <button onClick={handleBulkExport} className="px-4 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
            <i className="fa-solid fa-download mr-1" /> CSV
          </button>
          <button onClick={() => setShowBulkModal(true)} className="px-4 py-1.5 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition">
            <i className="fa-solid fa-trash mr-1" /> Eliminar
          </button>
          <button onClick={() => setSelected([])} className="ml-auto text-xs font-bold text-slate-400 hover:text-slate-600">
            Limpiar
          </button>
        </div>
      )}

      <div className="panel overflow-hidden animate-slide-up" style={{ animationDelay: '50ms' }}>
        <div className="flex justify-end px-6 pt-3 pb-0">
          <button onClick={() => { setCompact(v => { localStorage.setItem('equipmaster_compact_table', !v); return !v; }); }}
            className={"flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition " + (compact ? 'bg-brand-100 text-brand-700' : 'text-slate-400 hover:text-slate-600')}
            title="Modo compacto">
            <i className="fa-solid fa-compress" /> Compacto
          </button>
        </div>
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <i className={`fa-solid text-3xl ${search ? 'fa-search text-slate-300' : 'fa-box-open text-slate-300'}`} />
            </div>
            <p className="text-base font-bold text-slate-500">{search ? 'Sin resultados' : 'No hay equipos aún'}</p>
            <p className="text-sm text-slate-400 mt-1">{search ? 'Intenta con otro término de búsqueda' : 'Los equipos aparecerán aquí cuando sean registrados'}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={"min-w-full text-left text-sm table-responsive " + (compact ? 'table-compact' : '')}>
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-4 w-10">
                      <input type="checkbox" checked={selected.length === paginated.length && paginated.length > 0} onChange={toggleSelectAll} className="rounded border-slate-300" />
                    </th>
                    <Th k="codigo">Código</Th>
                    <Th k="sku">SKU</Th>
                    <Th k="marca">Equipo</Th>
                    <th className="px-6 py-4 text-xs font-bold uppercase">Hardware</th>
                    <Th k="estado">Estado</Th>
                    <Th k="tecnico">Técnico</Th>
                    <th className="px-6 py-4 text-xs font-bold uppercase">Flujo / Venta</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {paginated.map((item, idx) => (
                    <tr key={item.codigo} className="hover:bg-slate-50 transition-colors table-row-enter" style={{ animationDelay: `${idx * 30}ms` }}>
                    <td className="px-3 py-4" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.includes(item.codigo)} onChange={() => toggleSelect(item.codigo)} className="rounded border-slate-300" />
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-brand-600" data-label="Código">{item.codigo}<CopyBtn text={item.codigo} /></td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500" data-label="SKU">{item.sku || '—'}<CopyBtn text={item.sku} /></td>
                    <td className="px-6 py-4" data-label="Equipo">
                      <span className="font-bold">{item.marca}</span>
                      <p className="text-slate-500 text-xs">{item.modelo} · {item.categoria}</p>
                      <p className="text-slate-400 text-[10px] font-mono">S/N: {item.serie}<CopyBtn text={item.serie} /></p>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600" data-label="Hardware">{item.procesador}<br />{item.ram} / {item.almacenamiento}</td>
                    <td className="px-6 py-4" data-label="Estado"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${badgeEstado(item.estado)}`}>{item.estado}</span></td>
                    <td className="px-6 py-4 text-xs text-slate-500" data-label="Técnico">{item.tecnico || '—'}</td>
                    <td className="px-6 py-4 text-xs text-slate-500" data-label="Flujo">
                      {item.flujoSalida && <p>Venta: {item.flujoSalida.cliente} · {item.flujoSalida.precio}</p>}
                      {item.flujoVentaML && <p>ML: {item.flujoVentaML.fechaVenta}</p>}
                      {item.flujoMercadoLibre && !item.flujoVentaML && <p>En ML desde {item.flujoMercadoLibre.fechaEnvio}</p>}
                      {item.flujoDevolucion && <p className="text-orange-600">Devolución: {item.flujoDevolucion.motivo}</p>}
                    </td>
                    <td className="px-6 py-4 text-center" data-label="">
                      <div className="flex items-center justify-center gap-2">
                        <Link to={`/inventario?editar=${item.codigo}`} title="Editar equipo" className="text-brand-600 hover:text-brand-800 font-bold text-xs transition-colors">
                          <i className="fa-solid fa-pen-to-square" />
                        </Link>
                        <a href={`/ficha/${item.codigo}`} target="_blank" title="Ficha imprimible" className="text-slate-400 hover:text-slate-600 text-xs transition-colors">
                          <i className="fa-solid fa-print" />
                        </a>
                        <button onClick={() => {
                          if (window.confirm(`¿Eliminar ${item.codigo} (${item.marca} ${item.modelo})?`)) {
                            api.eliminarEquipo(item.codigo).then(() => notify('Eliminado', 'Equipo eliminado correctamente.', 'success')).catch(err => notify('Error', err.message, 'error'));
                          }
                        }} title="Eliminar equipo" className="text-red-400 hover:text-red-600 text-xs transition-colors">
                          <i className="fa-solid fa-trash-can" />
                        </button>
                      </div>
                    </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <p className="text-xs text-slate-500">Página {safePage} de {totalPages}</p>
                <div className="flex gap-2">
                  <button disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition">Anterior</button>
                  <button disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition">Siguiente</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowBulkModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                <i className="fa-solid fa-triangle-exclamation text-red-500 text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Eliminar equipos</h3>
                <p className="text-sm text-slate-500">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">¿Eliminar <strong>{selected.length}</strong> equipo{selected.length > 1 ? 's' : ''} del inventario?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowBulkModal(false)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">Cancelar</button>
              <button onClick={handleBulkDelete} disabled={bulkLoading} className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-60 transition">
                {bulkLoading ? 'Eliminando...' : `Eliminar ${selected.length}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
