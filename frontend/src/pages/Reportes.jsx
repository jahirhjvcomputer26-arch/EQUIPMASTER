import { useMemo, useState, useEffect } from 'react';
import { useInventario } from '../context/InventarioContext';
import { useNotify } from '../componentes/Notification';
import { badgeEstado } from '../utils/inventario';
import { api } from '../services/api';
import useDocumentTitle from '../utils/useDocumentTitle';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const TABS = [
  { key: 'inventario', label: 'Inventario', icon: 'fa-boxes-stacked' },
  { key: 'ventas', label: 'Ventas', icon: 'fa-tag' },
  { key: 'reparaciones', label: 'Reparaciones', icon: 'fa-wrench' },
  { key: 'metricas', label: 'Métricas', icon: 'fa-chart-line' },
];

function generarPDF({ title, subtitle, headers, rows, fileName }) {
  const doc = new jsPDF('l', 'mm', 'letter');

  doc.setFillColor(0, 24, 176);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('JV COMPUTER · Centro de Servicio TI', 10, 8);
  doc.text(title, 10, 14);

  doc.setTextColor(80, 80, 80);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, 10, 24);
  doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, 10, 28);

  doc.autoTable({
    startY: 32,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [0, 24, 176], fontSize: 7, fontStyle: 'bold' },
    bodyStyles: { fontSize: 6.5 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 10, right: 10 },
  });

  doc.save(fileName);
}

function generarPDFMetricas({ title, metrics, fileName }) {
  const doc = new jsPDF('l', 'mm', 'letter');

  doc.setFillColor(0, 24, 176);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('JV COMPUTER · Centro de Servicio TI', 10, 8);
  doc.text(title, 10, 14);

  doc.setTextColor(80, 80, 80);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, 10, 24);

  let y = 34;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 24, 176);
  doc.text('MÉTRICAS CLAVE', 10, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(8);
  metrics.forEach(({ label, value }) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, 12, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), 80, y);
    y += 6;
  });

  doc.save(fileName);
}

export default function Reportes() {
  useDocumentTitle('Reportes');
  const { inventario } = useInventario();
  const { notify } = useNotify();
  const [tab, setTab] = useState('inventario');
  const [sel, setSel] = useState({ marca: '', modelo: '', tecnico: '', categoria: '', estado: '', fechaDesde: '', fechaHasta: '' });
  const [resultados, setResultados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ventasData, setVentasData] = useState(null);
  const [reparacionesData, setReparacionesData] = useState(null);
  const [metricasData, setMetricasData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

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

  useEffect(() => {
    if (tab === 'ventas' && !ventasData) cargarVentas();
    if (tab === 'reparaciones' && !reparacionesData) cargarReparaciones();
    if (tab === 'metricas' && !metricasData) cargarMetricas();
  }, [tab]);

  const cargarVentas = async () => {
    setReportLoading(true);
    try {
      const data = await api.getReporteVentas();
      setVentasData(data);
    } catch (err) {
      notify('Error', err.message, 'error');
    } finally {
      setReportLoading(false);
    }
  };

  const cargarReparaciones = async () => {
    setReportLoading(true);
    try {
      const data = await api.getReporteReparaciones();
      setReparacionesData(data);
    } catch (err) {
      notify('Error', err.message, 'error');
    } finally {
      setReportLoading(false);
    }
  };

  const cargarMetricas = async () => {
    setReportLoading(true);
    try {
      const data = await api.dashboard();
      setMetricasData(data);
    } catch (err) {
      notify('Error', err.message, 'error');
    } finally {
      setReportLoading(false);
    }
  };

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

  const pdfInventario = () => {
    if (!resultados?.items?.length) {
      notify('Sin datos', 'Realiza una búsqueda primero para exportar PDF.', 'error');
      return;
    }
    const filtrosActivos = Object.entries(sel)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' · ') || 'Sin filtros';
    generarPDF({
      title: 'Reporte de Inventario',
      subtitle: `Filtros: ${filtrosActivos} · Total: ${resultados.total} equipos`,
      headers: ['Código', 'Marca', 'Modelo', 'Categoría', 'Procesador', 'RAM', 'Almacenamiento', 'Estado', 'Técnico', 'Fecha'],
      rows: resultados.items.map(i => [
        i.codigo, i.marca, i.modelo, i.categoria,
        i.procesador || '-', i.ram || '-', i.almacenamiento || '-',
        i.estado, i.tecnico || '-', i.fechaRegistro || '-'
      ]),
      fileName: `Reporte_Inventario_${new Date().toISOString().slice(0, 10)}.pdf`
    });
    notify('PDF exportado', 'Reporte de inventario descargado.', 'success');
  };

  const pdfVentas = () => {
    if (!ventasData?.items?.length) {
      notify('Sin datos', 'No hay ventas para exportar.', 'error');
      return;
    }
    generarPDF({
      title: 'Reporte de Ventas',
      subtitle: `Total vendidos: ${ventasData.totalVendidos} · Local: $${ventasData.totalLocal.toLocaleString('es-MX')} · ML: $${ventasData.totalML.toLocaleString('es-MX')}`,
      headers: ['Código', 'Marca', 'Modelo', 'Estado', 'Precio', 'Método Pago', 'Cliente', 'Fecha'],
      rows: ventasData.items.map(i => [
        i.codigo, i.marca, i.modelo, i.estado,
        `$${Number(i.precio || 0).toLocaleString('es-MX')}`,
        i.metodo, i.cliente, i.fechaRegistro || '-'
      ]),
      fileName: `Reporte_Ventas_${new Date().toISOString().slice(0, 10)}.pdf`
    });
    notify('PDF exportado', 'Reporte de ventas descargado.', 'success');
  };

  const pdfReparaciones = () => {
    if (!reparacionesData?.items?.length) {
      notify('Sin datos', 'No hay reparaciones para exportar.', 'error');
      return;
    }
    generarPDF({
      title: 'Reporte de Reparaciones',
      subtitle: `Total: ${reparacionesData.total} · Estados: ${Object.entries(reparacionesData.conteoEstados || {}).map(([k, v]) => `${k}(${v})`).join(' · ')}`,
      headers: ['ID', 'Equipo', 'Cliente', 'Falla', 'Estado', 'Técnico', 'Costo', 'Fecha Ingreso'],
      rows: reparacionesData.items.map(r => [
        r.id || '-', r.equipo, r.cliente, r.falla || '-',
        r.estado, r.tecnico || '-',
        `$${Number(r.costo || 0).toLocaleString('es-MX')}`,
        r.fechaIngreso || '-'
      ]),
      fileName: `Reporte_Reparaciones_${new Date().toISOString().slice(0, 10)}.pdf`
    });
    notify('PDF exportado', 'Reporte de reparaciones descargado.', 'success');
  };

  const pdfMetricas = () => {
    if (!metricasData) {
      notify('Sin datos', 'Carga las métricas primero.', 'error');
      return;
    }
    const metrics = [
      { label: 'Total equipos en sistema', value: metricasData.totalEntradasHistorico || 0 },
      { label: 'Equipos en stock (OK)', value: metricasData.equiposVentaStock || 0 },
      { label: 'Equipos en Mercado Libre', value: metricasData.equiposMercadoLibre || 0 },
      { label: 'En revisión / triage', value: metricasData.equiposRevisionTriage || 0 },
      { label: 'TKF (sin reparación)', value: metricasData.mermasTKF || 0 },
      { label: 'Total vendidos', value: metricasData.totalVendidos || 0 },
      { label: 'Método de pago más usado', value: metricasData.topPago || 'Ninguno' },
    ];
    generarPDFMetricas({
      title: 'Dashboard de Métricas',
      metrics,
      fileName: `Reporte_Metricas_${new Date().toISOString().slice(0, 10)}.pdf`
    });
    notify('PDF exportado', 'Reporte de métricas descargado.', 'success');
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
      <div className="animate-slide-up flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Reportes</h2>
          <p className="text-slate-500 text-sm">Genera reportes de inventario, ventas y reparaciones</p>
        </div>
        <button
          onClick={() => api.downloadExcel()}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 text-sm font-bold hover:bg-emerald-100 transition"
        >
          <i className="fa-solid fa-file-excel" /> Descargar Excel
        </button>
      </div>

      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl animate-slide-up" style={{ animationDelay: '50ms' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${
              tab === t.key
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <i className={`fa-solid ${t.icon} text-xs`} />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'inventario' && (
        <>
          <form onSubmit={buscar} className="panel p-6 md:p-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
              <Select label="Marca" k="marca" options={filtros.marcas} />
              <Select label="Modelo" k="modelo" options={filtros.modelos} />
              <Select label="Categoría" k="categoria" options={filtros.categorias} />
              <Select label="Estado" k="estado" options={filtros.estados} />
              <Select label="Técnico" k="tecnico" options={filtros.tecnicos} />
              <div><label className="form-label">Fecha desde</label><input type="date" className="form-input text-sm" value={sel.fechaDesde} onChange={e => setSel(s => ({ ...s, fechaDesde: e.target.value }))} /></div>
              <div><label className="form-label">Fecha hasta</label><input type="date" className="form-input text-sm" value={sel.fechaHasta} onChange={e => setSel(s => ({ ...s, fechaHasta: e.target.value }))} /></div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={loading} className="btn-brand text-white px-6 py-3 rounded-xl text-sm font-bold disabled:opacity-60">
                <i className="fa-solid fa-magnifying-glass mr-1" /> {loading ? 'Buscando...' : 'Buscar'}
              </button>
              {resultados && resultados.items?.length > 0 && (
                <>
                  <button type="button" onClick={exportResultados} className="px-5 py-3 rounded-xl border border-slate-300 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
                    <i className="fa-solid fa-download mr-1" /> Exportar CSV
                  </button>
                  <button type="button" onClick={pdfInventario} className="px-5 py-3 rounded-xl border border-rose-300 bg-rose-50 text-rose-700 text-sm font-bold hover:bg-rose-100 transition">
                    <i className="fa-solid fa-file-pdf mr-1" /> Exportar PDF
                  </button>
                </>
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
        </>
      )}

      {tab === 'ventas' && (
        <div className="animate-fade-in space-y-4">
          <div className="panel p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Resumen de Ventas</h3>
              <button
                onClick={pdfVentas}
                disabled={!ventasData?.items?.length}
                className="px-5 py-3 rounded-xl border border-rose-300 bg-rose-50 text-rose-700 text-sm font-bold hover:bg-rose-100 transition disabled:opacity-40"
              >
                <i className="fa-solid fa-file-pdf mr-1" /> Exportar PDF
              </button>
            </div>
            {reportLoading ? (
              <div className="p-12 text-center text-slate-400"><i className="fa-solid fa-spinner fa-spin text-3xl mb-2" /><p className="text-sm">Cargando...</p></div>
            ) : ventasData ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-blue-700">{ventasData.totalVendidos}</p>
                    <p className="text-xs text-blue-500 font-bold mt-1">Total Vendidos</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-700">{ventasData.countLocal}</p>
                    <p className="text-xs text-emerald-500 font-bold mt-1">Venta Local</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-amber-700">{ventasData.countML}</p>
                    <p className="text-xs text-amber-500 font-bold mt-1">Mercado Libre</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-purple-700">${(ventasData.totalLocal + ventasData.totalML).toLocaleString('es-MX')}</p>
                    <p className="text-xs text-purple-500 font-bold mt-1">Ingresos Totales</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm table-responsive">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-3 text-xs font-bold uppercase">Código</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase">Equipo</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase">Estado</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase">Precio</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase">Método</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase">Cliente</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ventasData.items.map(item => (
                        <tr key={item.codigo} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-brand-600 text-xs">{item.codigo}</td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-sm">{item.marca}</span>
                            <p className="text-slate-500 text-xs">{item.modelo}</p>
                          </td>
                          <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${badgeEstado(item.estado)}`}>{item.estado}</span></td>
                          <td className="px-4 py-3 font-bold text-sm">${Number(item.precio || 0).toLocaleString('es-MX')}</td>
                          <td className="px-4 py-3 text-xs">{item.metodo}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{item.cliente}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-slate-400"><i className="fa-solid fa-tag text-3xl mb-2" /><p className="text-sm">Sin datos de ventas</p></div>
            )}
          </div>
        </div>
      )}

      {tab === 'reparaciones' && (
        <div className="animate-fade-in space-y-4">
          <div className="panel p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Resumen de Reparaciones</h3>
              <button
                onClick={pdfReparaciones}
                disabled={!reparacionesData?.items?.length}
                className="px-5 py-3 rounded-xl border border-rose-300 bg-rose-50 text-rose-700 text-sm font-bold hover:bg-rose-100 transition disabled:opacity-40"
              >
                <i className="fa-solid fa-file-pdf mr-1" /> Exportar PDF
              </button>
            </div>
            {reportLoading ? (
              <div className="p-12 text-center text-slate-400"><i className="fa-solid fa-spinner fa-spin text-3xl mb-2" /><p className="text-sm">Cargando...</p></div>
            ) : reparacionesData ? (
              <>
                <div className="flex flex-wrap gap-3 mb-6">
                  <div className="bg-slate-50 rounded-xl px-5 py-3 text-center">
                    <p className="text-xl font-bold text-slate-800">{reparacionesData.total}</p>
                    <p className="text-xs text-slate-500 font-bold">Total</p>
                  </div>
                  {Object.entries(reparacionesData.conteoEstados || {}).map(([estado, count]) => (
                    <div key={estado} className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-center">
                      <p className="text-lg font-bold text-slate-800">{count}</p>
                      <p className="text-xs text-slate-500 font-bold">{estado}</p>
                    </div>
                  ))}
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm table-responsive">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-3 text-xs font-bold uppercase">ID</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase">Equipo</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase">Cliente</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase">Falla</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase">Estado</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase">Técnico</th>
                        <th className="px-4 py-3 text-xs font-bold uppercase">Costo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reparacionesData.items.map(r => (
                        <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs font-bold text-brand-600">{r.id}</td>
                          <td className="px-4 py-3 text-sm font-bold">{r.equipo}</td>
                          <td className="px-4 py-3 text-xs">{r.cliente}</td>
                          <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px] truncate">{r.falla || '-'}</td>
                          <td className="px-4 py-3"><span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{r.estado}</span></td>
                          <td className="px-4 py-3 text-xs">{r.tecnico || '-'}</td>
                          <td className="px-4 py-3 text-sm font-bold">${Number(r.costo || 0).toLocaleString('es-MX')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-slate-400"><i className="fa-solid fa-wrench text-3xl mb-2" /><p className="text-sm">Sin datos de reparaciones</p></div>
            )}
          </div>
        </div>
      )}

      {tab === 'metricas' && (
        <div className="animate-fade-in space-y-4">
          <div className="panel p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900">Métricas del Dashboard</h3>
              <button
                onClick={pdfMetricas}
                disabled={!metricasData}
                className="px-5 py-3 rounded-xl border border-rose-300 bg-rose-50 text-rose-700 text-sm font-bold hover:bg-rose-100 transition disabled:opacity-40"
              >
                <i className="fa-solid fa-file-pdf mr-1" /> Exportar PDF
              </button>
            </div>
            {reportLoading ? (
              <div className="p-12 text-center text-slate-400"><i className="fa-solid fa-spinner fa-spin text-3xl mb-2" /><p className="text-sm">Cargando...</p></div>
            ) : metricasData ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-5 text-center">
                  <i className="fa-solid fa-boxes-stacked text-blue-500 text-2xl mb-2" />
                  <p className="text-3xl font-bold text-blue-700">{metricasData.totalEntradasHistorico}</p>
                  <p className="text-xs text-blue-500 font-bold mt-1">Total Equipos</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-5 text-center">
                  <i className="fa-solid fa-check-circle text-emerald-500 text-2xl mb-2" />
                  <p className="text-3xl font-bold text-emerald-700">{metricasData.equiposVentaStock}</p>
                  <p className="text-xs text-emerald-500 font-bold mt-1">Stock OK</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-5 text-center">
                  <i className="fa-solid fa-store text-amber-500 text-2xl mb-2" />
                  <p className="text-3xl font-bold text-amber-700">{metricasData.equiposMercadoLibre}</p>
                  <p className="text-xs text-amber-500 font-bold mt-1">Mercado Libre</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-5 text-center">
                  <i className="fa-solid fa-magnifying-glass text-orange-500 text-2xl mb-2" />
                  <p className="text-3xl font-bold text-orange-700">{metricasData.equiposRevisionTriage}</p>
                  <p className="text-xs text-orange-500 font-bold mt-1">En Revisión</p>
                </div>
                <div className="bg-red-50 rounded-xl p-5 text-center">
                  <i className="fa-solid fa-ban text-red-500 text-2xl mb-2" />
                  <p className="text-3xl font-bold text-red-700">{metricasData.mermasTKF}</p>
                  <p className="text-xs text-red-500 font-bold mt-1">TKF</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-5 text-center">
                  <i className="fa-solid fa-tag text-purple-500 text-2xl mb-2" />
                  <p className="text-3xl font-bold text-purple-700">{metricasData.totalVendidos}</p>
                  <p className="text-xs text-purple-500 font-bold mt-1">Vendidos</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-5 text-center md:col-span-2">
                  <i className="fa-solid fa-credit-card text-slate-500 text-2xl mb-2" />
                  <p className="text-lg font-bold text-slate-800">{metricasData.topPago}</p>
                  <p className="text-xs text-slate-500 font-bold mt-1">Método de Pago Más Usado</p>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400"><i className="fa-solid fa-chart-line text-3xl mb-2" /><p className="text-sm">Sin métricas disponibles</p></div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
