import { useMemo, useState } from 'react';
import { useInventario } from '../context/InventarioContext';
import { useNotify } from '../componentes/Notification';
import { badgeEstado } from '../utils/inventario';
import useDocumentTitle from '../utils/useDocumentTitle';

export default function Reportes() {
  useDocumentTitle('Reportes');
  const { inventario } = useInventario();
  const { notify } = useNotify();
  const [sel, setSel] = useState({ marca: '', modelo: '', tecnico: '', categoria: '', estado: '', fechaDesde: '', fechaHasta: '' });
  const [resultados, setResultados] = useState(null);
  const [loading, setLoading] = useState(false);

  const filtros = useMemo(() => {
    const marcas = new Set(); const modelos = new Set(); const tecnicos = new Set(); const categorias = new Set(); const estados = new Set();
    inventario.forEach(item => {
      if (item.marca) marcas.add(item.marca);
      if (item.modelo) modelos.add(item.modelo);
      if (item.tecnico) tecnicos.add(item.tecnico);
      if (item.categoria) categorias.add(item.categoria);
      if (item.estado) estados.add(item.estado);
    });
    return {
      marcas: [...marcas].sort(),
      modelos: [...modelos].sort(),
      tecnicos: [...tecnicos].sort(),
      categorias: [...categorias].sort(),
      estados: [...estados].sort(),
    };
  }, [inventario]);

  const buscar = async (e) => {
    e.preventDefault();
    const params = Object.fromEntries(Object.entries(sel).filter(([_, v]) => v));
    if (Object.keys(params).length === 0) {
      notify('Selecciona un filtro', 'Elige al menos un criterio para buscar.', 'error');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 200));
    try {
      let lista = [...inventario];
      const { marca, modelo, tecnico, categoria, estado, fechaDesde, fechaHasta } = params;
      if (marca) lista = lista.filter(i => (i.marca || '').toUpperCase() === marca.toUpperCase());
      if (modelo) lista = lista.filter(i => (i.modelo || '').toUpperCase().includes(modelo.toUpperCase()));
      if (tecnico) lista = lista.filter(i => (i.tecnico || '') === tecnico);
      if (categoria) lista = lista.filter(i => (i.categoria || '') === categoria);
      if (estado) lista = lista.filter(i => (i.estado || '') === estado);
      if (fechaDesde) lista = lista.filter(i => {
        const f = i.fechaRegistro?.split(',')[0] || '';
        return f.replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2') >= fechaDesde;
      });
      if (fechaHasta) lista = lista.filter(i => {
        const f = i.fechaRegistro?.split(',')[0] || '';
        return f.replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2') <= fechaHasta;
      });
      setResultados({ total: lista.length, items: lista });
    } catch (err) {
      notify('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const exportResultados = () => {
    if (!resultados?.items?.length) return;
    const filas = resultados.items.map(i => ({
      Código: i.codigo, Marca: i.marca, Modelo: i.modelo, Serie: i.serie,
      Procesador: i.procesador, RAM: i.ram, Almacenamiento: i.almacenamiento,
      Estado: i.estado, Técnico: i.tecnico, Fecha: i.fechaRegistro,
    }));
    const csv = [Object.keys(filas[0]).join(','), ...filas.map(r => Object.values(r).map(v => `"${v || ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'reporte-filtrado.csv'; a.click();
    URL.revokeObjectURL(url);
    notify('CSV exportado', `${resultados.total} filas descargadas.`, 'success');
  };

  const Select = ({ label, k, options }) => (
    <div><label className="form-label">{label}</label>
      <select className="form-input text-sm" value={sel[k]} onChange={e => setSel(s => ({ ...s, [k]: e.target.value }))}>
        <option value="">Todos</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select></div>
  );

  return (
    <section className="space-y-6 animate-fade-in">
      <div className="animate-slide-up">
        <h2 className="font-display text-2xl font-bold text-slate-900">Reportes Avanzados</h2>
        <p className="text-slate-500 text-sm">Filtra el inventario por múltiples criterios</p>
      </div>

      <form onSubmit={buscar} className="panel p-6 md:p-8 animate-slide-up" style={{ animationDelay: '50ms' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
          <Select label="Marca" k="marca" options={filtros.marcas} />
          <Select label="Modelo" k="modelo" options={filtros.modelos} />
          <Select label="Categoría" k="categoria" options={filtros.categorias} />
          <Select label="Estado" k="estado" options={filtros.estados} />
          <Select label="Técnico" k="tecnico" options={filtros.tecnicos} />
          <div><label className="form-label">Fecha desde</label><input type="date" className="form-input text-sm" value={sel.fechaDesde} onChange={e => setSel(s => ({ ...s, fechaDesde: e.target.value }))} /></div>
          <div><label className="form-label">Fecha hasta</label><input type="date" className="form-input text-sm" value={sel.fechaHasta} onChange={e => setSel(s => ({ ...s, fechaHasta: e.target.value }))} /></div>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-brand text-white px-6 py-3 rounded-xl text-sm font-bold disabled:opacity-60">
            <i className="fa-solid fa-magnifying-glass mr-1" /> {loading ? 'Buscando...' : 'Buscar'}
          </button>
          {resultados && resultados.items?.length > 0 && (
            <button type="button" onClick={exportResultados} className="px-5 py-3 rounded-xl border border-slate-300 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
              <i className="fa-solid fa-download mr-1" /> Exportar CSV
            </button>
          )}
        </div>
      </form>

      {resultados && (
        <div className="panel overflow-hidden animate-fade-in">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Resultados ({resultados.total} equipo{resultados.total !== 1 ? 's' : ''})</h3>
          </div>
          {resultados.items?.length === 0 ? (
            <div className="p-12 text-center text-slate-400"><i className="fa-solid fa-inbox text-3xl mb-2" /><p className="text-sm">Sin resultados</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm table-responsive">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase">Código</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase">Equipo</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase">Especificaciones</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase">Estado</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase">Técnico</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resultados.items.map(item => (
                    <tr key={item.codigo} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-brand-600" data-label="Código">{item.codigo}</td>
                    <td className="px-6 py-4" data-label="Equipo">
                      <span className="font-bold">{item.marca}</span>
                      <p className="text-slate-500 text-xs">{item.modelo} · {item.categoria}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600" data-label="Especs">{item.procesador}<br />{item.ram} / {item.almacenamiento}</td>
                    <td className="px-6 py-4" data-label="Estado"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${badgeEstado(item.estado)}`}>{item.estado}</span></td>
                    <td className="px-6 py-4 text-xs" data-label="Técnico">{item.tecnico || '—'}</td>
                    <td className="px-6 py-4 text-xs text-slate-400" data-label="Fecha">{item.fechaRegistro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
