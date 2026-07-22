import { useMemo, useState } from 'react';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, Legend, LinearScale, Tooltip, LineElement, PointElement, Filler } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { api } from '../services/api';
import { useNotify } from '../componentes/Notification';
import { useInventario } from '../context/InventarioContext';
import { COLORES_ESTADO, ESTADOS_STOCK, TECNICOS } from '../utils/inventario';
import useDocumentTitle from '../utils/useDocumentTitle';
import { SkeletonCards, SkeletonChart } from '../componentes/Skeleton';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Filler, Tooltip, Legend);

function StatCard({ icon, color, label, value, sub, bgGlow }) {
  return (
    <div className="panel p-4 flex items-center gap-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group relative overflow-hidden cursor-default">
      <div className={`relative z-10 w-11 h-11 rounded-xl flex items-center justify-center text-lg shadow-sm ${color} group-hover:scale-110 transition-transform duration-300`}>
        <i className={`fa-solid ${icon}`} />
      </div>
      <div className="relative z-10 min-w-0">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">{label}</p>
        <h4 className="text-2xl font-extrabold text-slate-800">{value}</h4>
        {sub && <p className="text-[10px] text-slate-400 font-medium">{sub}</p>}
      </div>
      {bgGlow && <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-[0.06] ${bgGlow} group-hover:opacity-[0.12] transition-opacity`} />}
      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
        style={{ background: `radial-gradient(600px circle at var(--mouse-x,50%) var(--mouse-y,50%), rgba(255,255,255,0.06), transparent 40%)` }} />
    </div>
  );
}

function inicioSemana() {
  const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().slice(0, 10);
}
function inicioMes() {
  const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10);
}

const PRESETS = [
  { label: 'Hoy', fn: () => new Date().toISOString().slice(0, 10) },
  { label: 'Semana', fn: inicioSemana },
  { label: 'Mes', fn: inicioMes },
  { label: 'Todos', fn: () => '' },
];

export default function Dashboard() {
  useDocumentTitle('Dashboard');
  const { inventario, loading } = useInventario();
  const { notify } = useNotify();
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const stats = useMemo(() => {
    const desde = fechaDesde ? new Date(fechaDesde) : null;
    const hasta = fechaHasta ? new Date(fechaHasta + 'T23:59:59') : null;
    const filtrado = desde || hasta ? inventario.filter(item => {
      const f = item.fechaRegistro ? new Date(item.fechaRegistro) : null;
      if (!f) return true;
      if (desde && f < desde) return false;
      if (hasta && f > hasta) return false;
      return true;
    }) : inventario;

    let equiposVentaStock = 0, equiposMercadoLibre = 0, equiposRevisionTriage = 0, mermasTKF = 0, totalVendidos = 0;
    let totalVendidoEnPesos = 0;
    const conteoEstados = { '🟢 FULL (ML)': 0, '🔵 OK': 0, '🟡 Detalles': 0, '🟠 Revisión': 0, '🔴 TKF': 0, '🔴 VENDIDO': 0 };
    const conteoModelosPorEstado = {};
    const conteoMetodosPago = {};
    const tecStats = {};

    filtrado.forEach(item => {
      const est = item.estado || '';
      if (est === '🔵 OK') equiposVentaStock++;
      if (est.includes('🟢')) equiposMercadoLibre++;
      if (est === '🟡 Detalles' || est === '🟠 Revisión') equiposRevisionTriage++;
      if (est === '🔴 TKF') mermasTKF++;

      const tec = (item.tecnico || '').toUpperCase();
      if (tec) {
        if (!tecStats[tec]) tecStats[tec] = { total: 0, ok: 0, detalles: 0, revision: 0, tkf: 0, vendido: 0, full: 0 };
        tecStats[tec].total++;
        if (est === '🔵 OK') tecStats[tec].ok++;
        else if (est.includes('🟢')) tecStats[tec].full++;
        else if (est === '🟡 Detalles') tecStats[tec].detalles++;
        else if (est === '🟠 Revisión') tecStats[tec].revision++;
        else if (est === '🔴 TKF') tecStats[tec].tkf++;
        else if (est.includes('🔴 VENDIDO')) tecStats[tec].vendido++;
      }

      if ((item.flujoSalida || item.flujoVentaML) && !item.flujoDevolucion) {
        totalVendidos++;
        if (item.flujoSalida?.precio) {
          const precioNum = parseInt(item.flujoSalida.precio.replace(/[^0-9]/g, ''), 10);
          if (!isNaN(precioNum)) totalVendidoEnPesos += precioNum;
        }
        if (item.flujoVentaML) conteoMetodosPago['MERCADO LIBRE'] = (conteoMetodosPago['MERCADO LIBRE'] || 0) + 1;
        else if (item.flujoSalida?.metodoPago) conteoMetodosPago[item.flujoSalida.metodoPago] = (conteoMetodosPago[item.flujoSalida.metodoPago] || 0) + 1;
      }

      if (est.includes('🟢')) conteoEstados['🟢 FULL (ML)']++;
      else if (est.includes('🔵')) conteoEstados['🔵 OK']++;
      else if (est.includes('🟡')) conteoEstados['🟡 Detalles']++;
      else if (est.includes('🟠')) conteoEstados['🟠 Revisión']++;
      else if (est.includes('🔴 TKF')) conteoEstados['🔴 TKF']++;
      else if (est.includes('🔴 VENDIDO')) conteoEstados['🔴 VENDIDO']++;

      if (!est.includes('🔴 VENDIDO')) {
        const modelo = item.modelo?.toUpperCase().trim() || 'SIN MODELO';
        let estadoStock = null;
        if (est.includes('🟢')) estadoStock = '🟢 FULL (ML)';
        else if (est.includes('🔵')) estadoStock = '🔵 OK';
        else if (est.includes('🟡')) estadoStock = '🟡 Detalles';
        else if (est.includes('🟠')) estadoStock = '🟠 Revisión';
        else if (est.includes('🔴 TKF')) estadoStock = '🔴 TKF';
        if (estadoStock) {
          if (!conteoModelosPorEstado[modelo]) conteoModelosPorEstado[modelo] = {};
          conteoModelosPorEstado[modelo][estadoStock] = (conteoModelosPorEstado[modelo][estadoStock] || 0) + 1;
        }
      }
    });

    let topPago = 'Ninguno';
    let maxPago = 0;
    Object.entries(conteoMetodosPago).forEach(([m, c]) => { if (c > maxPago) { maxPago = c; topPago = m; } });

    const modelosOrdenados = Object.entries(conteoModelosPorEstado)
      .map(([modelo, estados]) => ({ modelo, total: Object.values(estados).reduce((a, b) => a + b, 0), estados }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    const meses = {};
    const mesesNombres = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    inventario.forEach(item => {
      if (!item.fechaRegistro) return;
      const d = new Date(item.fechaRegistro);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (!meses[key]) meses[key] = 0;
      meses[key]++;
    });
    const sortedMeses = Object.keys(meses).sort();

    // Charts data: by brand
    const marcaCount = {};
    filtrado.forEach(item => {
      const m = (item.marca || 'OTRA').toUpperCase().trim();
      marcaCount[m] = (marcaCount[m] || 0) + 1;
    });
    const marcaSorted = Object.entries(marcaCount).sort((a, b) => b[1] - a[1]);
    const porMarca = { labels: marcaSorted.map(e => e[0]), data: marcaSorted.map(e => e[1]) };

    // Charts data: by processor (top 10)
    const procCount = {};
    filtrado.forEach(item => {
      const p = (item.procesador || 'SIN PROCESADOR').toUpperCase().trim();
      procCount[p] = (procCount[p] || 0) + 1;
    });
    const procSorted = Object.entries(procCount).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const porProcesador = { labels: procSorted.map(e => e[0]), data: procSorted.map(e => e[1]) };

    // Charts data: by RAM
    const ramCount = {};
    filtrado.forEach(item => {
      const r = item.ram || 'N/A';
      ramCount[r] = (ramCount[r] || 0) + 1;
    });
    const ramSorted = Object.entries(ramCount).sort((a, b) => {
      const na = parseInt(a[0]) || 0, nb = parseInt(b[0]) || 0;
      return na - nb;
    });
    const porRam = { labels: ramSorted.map(e => e[0]), data: ramSorted.map(e => e[1]) };

    // Charts data: by storage
    const storCount = {};
    filtrado.forEach(item => {
      const s = item.almacenamiento || 'N/A';
      storCount[s] = (storCount[s] || 0) + 1;
    });
    const storSorted = Object.entries(storCount).sort((a, b) => {
      const parseSize = (s) => { const n = parseInt(s); if (s.includes('TB')) return n * 1024; return n || 0; };
      return parseSize(a[0]) - parseSize(b[0]);
    });
    const porAlmacenamiento = { labels: storSorted.map(e => e[0]), data: storSorted.map(e => e[1]) };

    // Charts data: by year
    const anioCount = {};
    filtrado.forEach(item => {
      const a = item.anio || 'SIN AÑO';
      if (a && a !== 'NO APLICA') anioCount[a] = (anioCount[a] || 0) + 1;
    });
    const anioSorted = Object.entries(anioCount).sort((a, b) => {
      const na = parseInt(a[0]) || 0, nb = parseInt(b[0]) || 0;
      return na - nb;
    });
    const porAnio = { labels: anioSorted.map(e => e[0]), data: anioSorted.map(e => e[1]) };

    let totalIngresos = 0;
    inventario.forEach(item => {
      if (item.flujoSalida?.precio) {
        const precio = parseInt(String(item.flujoSalida.precio).replace(/[^0-9]/g, ''), 10);
        if (!isNaN(precio)) totalIngresos += precio;
      }
    });

    const activos = inventario.filter(i => !i.estado?.includes('🔴 VENDIDO')).length;
    const tasaConversion = activos > 0 ? Math.round((totalVendidos / (totalVendidos + activos)) * 100) : 0;

    const ventasPorMes = {};
    inventario.forEach(item => {
      const fecha = item.flujoSalida?.fechaSalida || item.flujoVentaML?.fechaVenta;
      if (!fecha) return;
      const d = new Date(fecha);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      ventasPorMes[key] = (ventasPorMes[key] || 0) + 1;
    });

    const ingresosPorMes = {};
    inventario.forEach(item => {
      if (!item.flujoSalida?.precio) return;
      const fecha = item.flujoSalida.fechaSalida;
      if (!fecha) return;
      const d = new Date(fecha);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const precio = parseInt(String(item.flujoSalida.precio).replace(/[^0-9]/g, ''), 10);
      if (!isNaN(precio)) ingresosPorMes[key] = (ingresosPorMes[key] || 0) + precio;
    });

    const antiguos = inventario
      .filter(i => !i.estado?.includes('🔴 VENDIDO') && i.fechaRegistro)
      .map(i => ({
        ...i,
        diasEnInventario: Math.floor((Date.now() - new Date(i.fechaRegistro).getTime()) / (1000*60*60*24))
      }))
      .sort((a, b) => b.diasEnInventario - a.diasEnInventario)
      .slice(0, 10);

    const catCount = {};
    filtrado.forEach(item => {
      const c = (item.categoria || 'OTRA').toUpperCase().trim();
      catCount[c] = (catCount[c] || 0) + 1;
    });

    return {
      totalEntradasHistorico: filtrado.length,
      filtrados: filtrado.length !== inventario.length,
      equiposVentaStock, equiposMercadoLibre, equiposRevisionTriage, mermasTKF,
      totalVendidos, totalVendidoEnPesos, topPago, conteoEstados, modelosOrdenados,
      tecStats: Object.entries(tecStats).sort((a, b) => b[1].total - a[1].total),
      mesesLabels: sortedMeses.map(k => { const [y,m] = k.split('-'); return `${mesesNombres[parseInt(m)-1]} ${y}`; }),
      mesesData: sortedMeses.map(k => meses[k]),
      porMarca, porProcesador, porRam, porAlmacenamiento, porAnio,
      totalIngresos, tasaConversion,
      ventasMesLabels: sortedMeses.map(k => { const [y,m] = k.split('-'); return `${mesesNombres[parseInt(m)-1]} ${y}`; }),
      ventasMesData: sortedMeses.map(k => ventasPorMes[k] || 0),
      ingresosMesData: sortedMeses.map(k => ingresosPorMes[k] || 0),
      antiguos,
      porCategoria: { labels: Object.keys(catCount), data: Object.values(catCount) },
    };
  }, [inventario, fechaDesde, fechaHasta]);

  const doughnutData = {
    labels: Object.keys(stats.conteoEstados),
    datasets: [{ data: Object.values(stats.conteoEstados), backgroundColor: ['#10b981', '#0018B0', '#FF9100', '#f97316', '#ef4444', '#cbd5e1'], borderWidth: 1.5 }],
  };

  const barData = {
    labels: stats.modelosOrdenados.length ? stats.modelosOrdenados.map(m => m.modelo) : ['Sin stock activo'],
    datasets: ESTADOS_STOCK.map(estado => ({
      label: estado,
      data: stats.modelosOrdenados.map(m => m.estados[estado] || 0),
      backgroundColor: COLORES_ESTADO[estado],
      borderRadius: 4,
    })).filter(ds => ds.data.some(v => v > 0)),
  };

  if (loading) return (
    <section className="space-y-6 animate-fade-in">
      <div><h2 className="font-display text-2xl font-bold text-slate-900">Dashboard de Control</h2><p className="text-slate-500 text-sm">Cargando métricas...</p></div>
      <SkeletonCards count={5} /><SkeletonCards count={2} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><SkeletonChart /><SkeletonChart /></div>
    </section>
  );

  return (
    <section className="space-y-6 animate-fade-in">
      <div className="animate-slide-up flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Dashboard de Control</h2>
          <p className="text-slate-500 text-sm">Métricas en tiempo real desde Firebase</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xs">
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => { const v = p.fn(); setFechaDesde(v); setFechaHasta(''); }}
              className={"px-2.5 py-1 rounded-lg text-xs font-bold transition " + (fechaDesde === p.fn() ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-100')}>
              {p.label}
            </button>
          ))}
          <span className="w-px h-5 bg-slate-200 mx-1" />
          <label className="flex items-center gap-1 text-[11px] text-slate-400">
            <i className="fa-regular fa-calendar" />
            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
              className="w-28 border border-slate-200 rounded px-1 py-0.5 text-xs text-slate-600" />
          </label>
          <span className="text-[11px] text-slate-300">→</span>
          <label className="flex items-center gap-1 text-[11px] text-slate-400">
            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
              className="w-28 border border-slate-200 rounded px-1 py-0.5 text-xs text-slate-600" />
          </label>
          {(fechaDesde || fechaHasta) && (
            <button onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
              className="px-2 py-1 rounded-lg text-xs text-red-500 hover:bg-red-50 font-bold">
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-slide-up" style={{ animationDelay: '50ms' }}>
        <StatCard icon="fa-boxes-stacked" color="bg-brand-50 text-brand-600" label="Total entradas" value={stats.totalEntradasHistorico} bgGlow="bg-brand-500" />
        <StatCard icon="fa-circle-check" color="bg-blue-50 text-blue-600" label="Stock local OK" value={stats.equiposVentaStock} sub="Solo 🔵 OK" bgGlow="bg-blue-500" />
        <StatCard icon="fa-warehouse" color="bg-emerald-50 text-emerald-600" label="En Mercado Libre" value={stats.equiposMercadoLibre} sub="🟢 FULL en ML" bgGlow="bg-emerald-500" />
        <StatCard icon="fa-screwdriver-wrench" color="bg-amber-50 text-amber-600" label="Revisión / Triage" value={stats.equiposRevisionTriage} bgGlow="bg-amber-500" />
        <StatCard icon="fa-trash-can" color="bg-red-50 text-red-600" label="Mermas TKF" value={stats.mermasTKF} bgGlow="bg-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '150ms' }}>
        <div className="panel p-6 min-h-[380px] flex flex-col hover:shadow-lg transition-shadow duration-300 lg:col-span-2">
          <h4 className="text-sm font-bold text-slate-700 uppercase mb-2">
            <i className="fa-solid fa-chart-line text-brand-500 mr-1" /> Entradas por Mes
          </h4>
          <p className="text-[11px] text-slate-400 mb-3">Tendencia mensual de equipos registrados</p>
          <div className="flex-1 min-h-[260px] relative">
            <Line data={{
              labels: stats.mesesLabels,
              datasets: [{
                label: 'Equipos',
                data: stats.mesesData,
                borderColor: '#0018B0',
                backgroundColor: 'rgba(0,24,176,0.08)',
                fill: true,
                tension: 0.35,
                pointRadius: 4,
                pointBackgroundColor: '#0018B0',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 6,
                borderWidth: 2.5,
              }]
            }} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { x: { grid: { display: false }, ticks: { font: { size: 10 } } }, y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } } } },
            }} />
          </div>
        </div>
        <div className="panel p-6 min-h-[380px] flex flex-col hover:shadow-lg transition-shadow duration-300">
          <h4 className="text-sm font-bold text-slate-700 uppercase mb-4">
            <i className="fa-solid fa-pie-chart text-emerald-500 mr-1" /> Distribución Global
          </h4>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-[220px]">
              <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } } }} />
            </div>
          </div>
        </div>
      </div>

      <div className="panel p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
        <h4 className="text-sm font-bold text-slate-700 uppercase mb-2">
          <i className="fa-solid fa-bar-chart text-blue-500 mr-1" /> Stock Activo: Modelos por Estado
        </h4>
        <p className="text-[11px] text-slate-400 mb-3">Cada barra = modelo; colores = estados distintos</p>
        <div className="h-[280px] relative">
          <Bar data={barData} options={{
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } },
            scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } } },
          }} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
        <div className="panel p-6 min-h-[320px] flex flex-col hover:shadow-lg transition-shadow duration-300">
          <h4 className="text-sm font-bold text-slate-700 uppercase mb-2">
            <i className="fa-solid fa-building text-brand-500 mr-1" /> Inventario por Marca
          </h4>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-[240px]">
              <Doughnut data={{
                labels: stats.porMarca.labels,
                datasets: [{ data: stats.porMarca.data, backgroundColor: ['#0018B0', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1', '#f59e0b', '#ef4444', '#64748b'], borderWidth: 1.5 }]
              }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 9 } } } } }} />
            </div>
          </div>
        </div>
        <div className="panel p-6 min-h-[320px] flex flex-col hover:shadow-lg transition-shadow duration-300">
          <h4 className="text-sm font-bold text-slate-700 uppercase mb-2">
            <i className="fa-solid fa-microchip text-blue-500 mr-1" /> Inventario por Procesador
          </h4>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-[240px]">
              <Doughnut data={{
                labels: stats.porProcesador.labels,
                datasets: [{ data: stats.porProcesador.data, backgroundColor: ['#0018B0', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1', '#f59e0b', '#ef4444', '#64748b'], borderWidth: 1.5 }]
              }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 9 } } } } }} />
            </div>
          </div>
        </div>
        <div className="panel p-6 min-h-[320px] flex flex-col hover:shadow-lg transition-shadow duration-300">
          <h4 className="text-sm font-bold text-slate-700 uppercase mb-2">
            <i className="fa-solid fa-memory text-purple-500 mr-1" /> Distribución RAM
          </h4>
          <div className="flex-1 min-h-[240px] relative">
            <Bar data={{
              labels: stats.porRam.labels,
              datasets: [{ label: 'Equipos', data: stats.porRam.data, backgroundColor: '#0018B0', borderRadius: 6 }]
            }} options={{ responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } }, y: { grid: { display: false } } } }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '225ms' }}>
        <div className="panel p-6 min-h-[320px] flex flex-col hover:shadow-lg transition-shadow duration-300">
          <h4 className="text-sm font-bold text-slate-700 uppercase mb-2">
            <i className="fa-solid fa-hard-drive text-emerald-500 mr-1" /> Distribución Almacenamiento
          </h4>
          <div className="flex-1 min-h-[240px] relative">
            <Bar data={{
              labels: stats.porAlmacenamiento.labels,
              datasets: [{ label: 'Equipos', data: stats.porAlmacenamiento.data, backgroundColor: '#10b981', borderRadius: 6 }]
            }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } }, y: { grid: { display: false } } } }} />
          </div>
        </div>
        <div className="panel p-6 min-h-[320px] flex flex-col hover:shadow-lg transition-shadow duration-300">
          <h4 className="text-sm font-bold text-slate-700 uppercase mb-2">
            <i className="fa-solid fa-layer-group text-orange-500 mr-1" /> Distribución por Año
          </h4>
          <div className="flex-1 min-h-[240px] relative">
            <Bar data={{
              labels: stats.porAnio.labels,
              datasets: [{ label: 'Equipos', data: stats.porAnio.data, backgroundColor: '#f97316', borderRadius: 6 }]
            }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } }, y: { grid: { display: false } } } }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '242ms' }}>
        <div className="panel p-6 min-h-[320px] flex flex-col hover:shadow-lg transition-shadow duration-300">
          <h4 className="text-sm font-bold text-slate-700 uppercase mb-2">
            <i className="fa-solid fa-tags text-orange-500 mr-1" /> Distribución por Categoría
          </h4>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-[240px]">
              <Doughnut data={{
                labels: stats.porCategoria.labels,
                datasets: [{ data: stats.porCategoria.data, backgroundColor: ['#0018B0', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1', '#f59e0b'], borderWidth: 1.5 }]
              }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 9 } } } } }} />
            </div>
          </div>
        </div>
        <div className="panel p-6 min-h-[320px] flex flex-col hover:shadow-lg transition-shadow duration-300">
          <h4 className="text-sm font-bold text-slate-700 uppercase mb-2">
            <i className="fa-solid fa-hourglass-half text-red-500 mr-1" /> Equipos Más Antiguos en Stock
          </h4>
          <div className="flex-1 min-h-[240px] relative">
            {stats.antiguos.length > 0 ? (
              <Bar data={{
                labels: stats.antiguos.map(i => `${i.codigo}`),
                datasets: [{ label: 'Días', data: stats.antiguos.map(i => i.diasEnInventario), backgroundColor: stats.antiguos.map(i => i.diasEnInventario > 60 ? '#ef4444' : i.diasEnInventario > 30 ? '#f97316' : '#f59e0b'), borderRadius: 4 }]
              }} options={{ responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { font: { size: 9 } } }, y: { grid: { display: false }, ticks: { font: { size: 9 } } } } }} />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">Sin datos</div>
            )}
          </div>
        </div>
      </div>

      <div className="panel p-6 animate-slide-up" style={{ animationDelay: '250ms' }}>
        <h4 className="text-sm font-bold text-slate-700 uppercase mb-4 flex items-center gap-2">
          <i className="fa-solid fa-user-gear text-brand-500" /> Rendimiento por Técnico
        </h4>
        {stats.tecStats.length === 0 ? (
          <p className="text-sm text-slate-400">No hay equipos asignados a técnicos aún</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.tecStats.map(([nombre, data]) => (
              <div key={nombre} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition">
                <p className="font-bold text-sm text-slate-800 mb-2 truncate">{nombre}</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl font-extrabold text-brand-600">{data.total}</span>
                  <span className="text-xs text-slate-400">equipos</span>
                </div>
                <div className="space-y-1.5">
                  {[
                    { label: '🟢 FULL', value: data.full, color: 'bg-emerald-500' },
                    { label: '🔵 OK', value: data.ok, color: 'bg-blue-600' },
                    { label: '🟡 Detalles', value: data.detalles, color: 'bg-amber-500' },
                    { label: '🟠 Revisión', value: data.revision, color: 'bg-orange-500' },
                    { label: '🔴 TKF', value: data.tkf, color: 'bg-red-500' },
                    { label: '💲 Vendido', value: data.vendido, color: 'bg-purple-500' },
                  ].map(s => s.value > 0 && (
                    <div key={s.label} className="flex items-center gap-2 text-xs">
                      <div className={"w-2 h-2 rounded-full " + s.color} />
                      <span className="text-slate-500 flex-1">{s.label}</span>
                      <span className="font-bold">{s.value}</span>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={"h-full " + s.color + " rounded-full transition-all duration-500"}
                          style={{ width: (s.value / data.total) * 100 + '%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel p-5 animate-slide-up flex flex-wrap items-center justify-between gap-4" style={{ animationDelay: '300ms' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg">
            <i className="fa-solid fa-database" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Respaldo de Base de Datos</h4>
            <p className="text-[11px] text-slate-400">Exporta toda la información en formato JSON</p>
          </div>
        </div>
        <button onClick={async () => {
          try {
            await api.downloadBackup();
            notify('Respaldo descargado', 'Archivo JSON listo en tu computadora.', 'success');
          } catch (err) {
            notify('Error', err.message, 'error');
          }
        }} className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold transition-all hover:scale-[1.02]">
          <i className="fa-solid fa-download" /> Descargar Respaldo
        </button>
      </div>
    </section>
  );
}
