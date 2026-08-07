import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { useNotify } from './Notification';
import { useInventario } from '../context/InventarioContext';
import { fechaRegistroTs } from '../utils/inventario';
import OfflineBanner from './OfflineBanner';
import SearchModal from './SearchModal';
import QRScanner from './QRScanner';
import ScrollToTop from './ScrollToTop';
import useBrowserNotifications from '../utils/useBrowserNotifications';

const menuGroups = [
  { label: 'Operación', items: [
    { to: '/', icon: 'fa-chart-pie', label: 'Dashboard', end: true },
  ]},
  { label: 'Movimientos', items: [
      { to: '/ventas', icon: 'fa-store', label: 'Venta Local', perm: 'ver_ventas' },
      { to: '/mercadolibre', icon: 'fa-warehouse', label: 'Venta ML', perm: 'ver_ventas' },
      { to: '/publicar-catalogo', icon: 'fa-bullhorn', label: 'Publicar catálogo', perm: 'publicar_catalogo' },
    { to: '/devoluciones', icon: 'fa-rotate-left', label: 'Devoluciones', perm: 'ver_ventas' },
    { to: '/prestamos', icon: 'fa-hand-holding', label: 'Préstamos', perm: 'ver_prestamos' },
    { to: 'http://192.168.100.198:5175', icon: 'fa-battery-three-quarters', label: 'Cargadores', external: true, perm: 'ver_inventario' },
  ]},
  { label: 'Servicio', items: [
    { to: '/reparaciones', icon: 'fa-toolbox', label: 'Reparaciones', perm: 'ver_reparaciones' },
    { to: '/centro-reparaciones', icon: 'fa-screwdriver-wrench', label: 'Centro Reparaciones', perm: 'ver_reparaciones' },
    { to: '/tickets', icon: 'fa-ticket', label: 'Tickets', perm: 'ver_tickets' },
    { to: '/etiquetas', icon: 'fa-tag', label: 'Etiquetas', perm: 'generar_qr' },
    { to: '/modelos', icon: 'fa-images', label: 'Fotos por Modelo' },
  ]},
    { label: 'Control', items: [
      { to: '/reportes', icon: 'fa-chart-simple', label: 'Reportes', perm: 'ver_reportes' },
      { to: '/garantias', icon: 'fa-shield-halved', label: 'Garantías / Mantenimiento', perm: 'ver_garantias' },
      { to: '/alertas', icon: 'fa-triangle-exclamation', label: 'Alertas', perm: 'ver_inventario' },
    { to: '/actividad', icon: 'fa-clock-rotate-left', label: 'Historial', perm: 'ver_auditoria' },
    { to: '/base-datos', icon: 'fa-table-list', label: 'Base de Datos', perm: 'base_datos' },
  ]},
  { label: 'Admin', items: [
    { to: '/usuarios', icon: 'fa-users-gear', label: 'Usuarios', perm: 'admin_usuarios' },
    { to: '/configuracion', icon: 'fa-gear', label: 'Configuración', perm: 'config_sistema' },
  ]},
];

const ROUTE_LABELS = {
  '/': 'Dashboard',
  '/inventario': 'Entrada / Triage',
  '/ventas': 'Venta Local',
  '/mercadolibre': 'Venta ML',
  '/devoluciones': 'Devoluciones',
  '/prestamos': 'Préstamos',
  '/reparaciones': 'Reparaciones',
  '/centro-reparaciones': 'Centro Reparaciones',
  '/tickets': 'Tickets',
  '/etiquetas': 'Etiquetas',
  '/modelos': 'Fotos por Modelo',
  '/reportes': 'Reportes',
  '/garantias': 'Garantías y Mantenimientos',
  '/alertas': 'Alertas',
  '/actividad': 'Historial',
  '/base-datos': 'Base de Datos',
  '/usuarios': 'Usuarios',
  '/configuracion': 'Configuración',
  '/perfil': 'Mi Cuenta',
};

export default function Layout() {
  const { user, logout, can } = useAuth();
  const { dark, toggle: toggleDark } = useDarkMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('equipmaster_sidebar_collapsed') === 'true');
  const [connected, setConnected] = useState(true);
  const mainRef = useRef(null);
  const notify = useBrowserNotifications();
  const { notify: toast } = useNotify();
  const { inventario } = useInventario();
  const inventarioRef = useRef(inventario);
  useEffect(() => { inventarioRef.current = inventario; }, [inventario]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notificacionesLocales, setNotificacionesLocales] = useState([]);
  const notifRef = useRef(null);

  useEffect(() => {
    let alive = true;
    const ping = async () => {
      try {
        const r = await fetch('/api/health', { cache: 'no-store' });
        if (alive) setConnected(r.ok);
      } catch { if (alive) setConnected(false); }
    };
    ping();
    const id = setInterval(ping, 30000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  useEffect(() => {
    localStorage.setItem('equipmaster_sidebar_collapsed', collapsed);
  }, [collapsed]);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  function contarDiasHabiles(desde) {
    let count = 0;
    const d = new Date(desde);
    const hoy = new Date();
    while (d < hoy) {
      const dia = d.getDay();
      if (dia !== 0 && dia !== 6) count++;
      d.setDate(d.getDate() + 1);
    }
    return count;
  }

  useEffect(() => {
    const check = async () => {
      try {
        const hoyKey = new Date().toISOString().split('T')[0];
        const ahora = Date.now();

        // Préstamos
        const prestamos = await api.getPrestamos();
        prestamos.forEach(p => {
          if (!p.activo) return;
          const salida = new Date(p.fechaSalida);
          if (isNaN(salida)) return;
          const diasHabiles = contarDiasHabiles(p.fechaSalida);
          if (diasHabiles >= 5 && diasHabiles < 8) {
            api.crearNotificacion({ id: `prestamo-atencion-${p.id}-${hoyKey}`, mensaje: '🔔 Préstamo requiere atención', detalle: `${p.serie} · ${p.responsable} · ${diasHabiles} días hábiles` }).catch(() => {});
          } else if (diasHabiles >= 8) {
            api.crearNotificacion({ id: `prestamo-vencido-${p.id}-${hoyKey}`, mensaje: '🔔 Préstamo vencido', detalle: `${p.serie} · ${p.responsable} · ${diasHabiles} días hábiles sin devolver` }).catch(() => {});
          }
        });

        // Tickets atrasados
        try {
          const tickets = await api.getTickets();
          tickets.forEach(t => {
            const finales = ['entregado','cerrado','cancelado','reparado'];
            if (finales.includes(t.estado)) return;
            const tsMod = new Date(t.modificadoEn || t.creadoEn || 0).getTime();
            const dias = Math.floor((ahora - tsMod) / 86400000);
            if (dias >= 3) {
              api.crearNotificacion({ id: `ticket-atrasado-${t.id}-${hoyKey}`, mensaje: '🎫 Ticket sin actualizar', detalle: `${t.id}: ${t.asunto} · ${dias}d sin cambios` }).catch(() => {});
            }
          });
        } catch {}

        // Equipos estancados en revisión
        inventarioRef.current.forEach(i => {
          if (!i.estado?.includes('🟠') && !i.estado?.includes('🟡')) return;
          const fTs = fechaRegistroTs(i.fechaRegistro);
          if (isNaN(fTs)) return;
          const dias = Math.floor((ahora - fTs) / 86400000);
          if (dias >= 7) {
            api.crearNotificacion({ id: `equipo-estancado-${i.codigo}-${hoyKey}`, mensaje: '⏳ Equipo estancado', detalle: `${i.codigo} · ${i.marca} ${i.modelo} · ${dias}d en ${i.estado}` }).catch(() => {});
          }
        });
      } catch {}
    };
    check();
    const id = setInterval(check, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const poll = async () => {
      try {
        const notifs = await api.getNotificaciones();
        notifs.forEach(n => {
          toast(n.mensaje, n.detalle, 'info');
          api.marcarLeidaNotificacion(n.id).catch(() => {});
        });
      } catch {}
    };
    poll();
    const id = setInterval(poll, 10000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!inventario || inventario.length === 0) return;
    const alertas = [];
    inventario.forEach(item => {
      if (!item.estado?.includes('🔴 VENDIDO')) {
        if (!item.fotos || Object.keys(item.fotos).length === 0) {
          alertas.push({ id: `${item.codigo}-sin-fotos`, mensaje: `${item.codigo} sin fotos`, detalle: `${item.marca} ${item.modelo}`, icon: 'fa-camera', color: 'text-amber-500', prioridad: 'critica' });
        }
        if (!item.serie || item.serie === 'N/A') {
          alertas.push({ id: `${item.codigo}-sin-serie`, mensaje: `${item.codigo} sin serie`, detalle: `${item.marca} ${item.modelo}`, icon: 'fa-barcode', color: 'text-red-500', prioridad: 'critica' });
        }
        if (!item.checklistPruebas || Object.keys(item.checklistPruebas).length === 0) {
          alertas.push({ id: `${item.codigo}-sin-diagnostico`, mensaje: `${item.codigo} sin diagnóstico`, detalle: `${item.marca} ${item.modelo}`, icon: 'fa-stethoscope', color: 'text-purple-500', prioridad: 'pendiente' });
        }
        if (!item.cargador || item.cargador === 'N/A') {
          alertas.push({ id: `${item.codigo}-sin-cargador`, mensaje: `${item.codigo} sin cargador`, detalle: `${item.marca} ${item.modelo}`, icon: 'fa-plug', color: 'text-blue-500', prioridad: 'pendiente' });
        }
        if (item.estado?.includes('🟠') || item.estado?.includes('🟡')) {
          alertas.push({ id: `${item.codigo}-pendiente`, mensaje: `${item.codigo} pendiente`, detalle: `${item.estado} · ${item.marca} ${item.modelo}`, icon: 'fa-clock', color: 'text-orange-500', prioridad: 'pendiente' });
        }
          const fTs = fechaRegistroTs(item.fechaRegistro);
          if (item.tecnico && !isNaN(fTs)) {
            const dias = Math.floor((Date.now() - fTs) / (1000 * 60 * 60 * 24));
            if (dias > 30 && !item.flujoSalida && !item.flujoVentaML) {
            alertas.push({ id: `${item.codigo}-antiguo`, mensaje: `${item.codigo} 30+ días`, detalle: `${item.marca} ${item.modelo} · ${dias} días`, icon: 'fa-hourglass-half', color: 'text-cyan-500', prioridad: 'aviso' });
          }
        }
      }
    });
    setNotificacionesLocales(alertas);
  }, [inventario]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    if (notifOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const asideW = collapsed ? 'w-20' : 'w-68';
  const mlW = collapsed ? 'lg:ml-20' : 'lg:ml-[17rem]';

  return (
    <div className="flex min-h-screen">
      <OfflineBanner />
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-brand-900/55 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 ${asideW} flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} no-print`}>
        <div className={`p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 ${collapsed ? 'flex-col' : ''}`}>
          <div className="bg-white border border-slate-200 dark:border-slate-600 rounded-xl p-1.5 shrink-0">
            <img src="/logo-empresa.png" alt="JV" className="h-8 w-8 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
          {!collapsed && <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-widest text-center">EquipMaster v3.0</p>}
          <button onClick={() => setCollapsed(c => !c)} title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-white text-brand-700 border border-slate-200 shadow-md flex items-center justify-center text-xs hover:scale-110 transition hidden lg:flex">
            <i className={`fa-solid ${collapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`} />
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {!collapsed && (
            <NavLink to="/inventario"
              className="flex items-center justify-center gap-2 w-full py-2.5 mb-2 rounded-xl bg-brand-600 text-white text-sm font-extrabold shadow-sm hover:bg-brand-700 transition-all"
              onClick={() => setSidebarOpen(false)}>
              <i className="fa-solid fa-plus-circle" /> Registrar equipo
            </NavLink>
          )}
          {collapsed && (
            <NavLink to="/inventario" title="Registrar equipo"
              className="flex items-center justify-center w-full py-2.5 mb-2 rounded-xl bg-brand-600 text-white shadow-sm hover:bg-brand-700 transition-all"
              onClick={() => setSidebarOpen(false)}>
              <i className="fa-solid fa-plus-circle text-lg" />
            </NavLink>
          )}
          {menuGroups
            .map(group => ({ ...group, items: group.items.filter(l => !l.perm || can(l.perm)) }))
            .filter(group => group.items.length > 0)
            .map(group => (
            <div key={group.label}>
              {!collapsed && (
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 pt-2.5 pb-1">{group.label}</p>
              )}
              {collapsed && <div className="border-t border-slate-100 dark:border-slate-800 my-1.5" />}
              {group.items.map(l => (
                l.external ? (
                  <a key={l.to} href={l.to} target="_blank" rel="noopener noreferrer" title={l.label}
                    className={`sidebar-nav-btn ${collapsed ? 'justify-center px-0' : ''}`}>
                    <i className={`fa-solid ${l.icon} ${collapsed ? 'text-lg' : 'w-5 text-center'}`} />
                    {!collapsed && <span className="truncate">{l.label}</span>}
                  </a>
                ) : (
                  <NavLink key={l.to} to={l.to} end={l.end} title={l.label}
                    className={({ isActive }) => `sidebar-nav-btn ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
                    onClick={() => setSidebarOpen(false)}>
                    <i className={`fa-solid ${l.icon} ${collapsed ? 'text-lg' : 'w-5 text-center'}`} />
                    {!collapsed && <span className="truncate">{l.label}</span>}
                  </NavLink>
                )
              ))}
            </div>
          ))}
        </nav>

        <div className={`p-3 border-t border-slate-100 dark:border-slate-800 space-y-2 ${collapsed ? 'flex flex-col items-center' : ''}`}>
          <NavLink to="/perfil" title="Mi Cuenta"
            className={({ isActive }) => `sidebar-nav-btn ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : 'text-xs'}`}
            onClick={() => setSidebarOpen(false)}>
            <i className={`fa-solid fa-user ${collapsed ? 'text-lg' : 'w-5 text-center'}`} />
            {!collapsed && (user?.nombre || 'Mi Cuenta')}
          </NavLink>

          <div className={`flex ${collapsed ? 'flex-col' : 'items-center'} gap-2`}>
            <button onClick={toggleDark} title={dark ? 'Modo claro' : 'Modo oscuro'}
              className={`${collapsed ? 'w-full' : 'flex-1'} py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1`}>
              <i className={`fa-solid ${dark ? 'fa-sun' : 'fa-moon'}`} />
              {!collapsed && (dark ? 'Claro' : 'Oscuro')}
            </button>
            <button onClick={handleLogout} title="Cerrar sesión"
              className={`py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition flex items-center justify-center ${collapsed ? 'w-full' : ''}`}>
              <i className="fa-solid fa-right-from-bracket" />
            </button>
          </div>
        </div>
      </aside>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <QRScanner />
      <ScrollToTop />

      <div className={`flex-1 flex flex-col min-w-0 ${mlW} transition-all duration-300`}>
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 no-print">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-brand-600 lg:hidden">
            <i className="fa-solid fa-bars text-lg" />
          </button>
          <div className="hidden lg:flex items-center gap-2">
            <span className={"w-2.5 h-2.5 rounded-full transition-colors " + (connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500')} title={connected ? 'Conectado al servidor' : 'Sin conexión al servidor'} />
            <h1 className="font-display font-bold text-brand-900">EquipMaster</h1>
            <span className="text-[10px] text-slate-400">JV COMPUTER</span>
          </div>
          <div className="flex-1" />
          <div className="relative" ref={notifRef}>
            <button onClick={() => setNotifOpen(!notifOpen)}
              className="relative h-9 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 transition flex items-center justify-center">
              <i className="fa-solid fa-bell text-sm" />
              {notificacionesLocales.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {notificacionesLocales.filter(n => n.prioridad === 'critica').length || notificacionesLocales.length}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 animate-slide-up overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800">
                    <i className="fa-solid fa-bell text-brand-500 mr-2" />Alertas
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{notificacionesLocales.length}</span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notificacionesLocales.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-sm">
                      <i className="fa-solid fa-check-circle text-emerald-400 text-2xl mb-2 block" />
                      Todo en orden
                    </div>
                  ) : (
                    <>
                      {['critica', 'pendiente', 'aviso'].map(prio => {
                        const items = notificacionesLocales.filter(n => n.prioridad === prio);
                        if (items.length === 0) return null;
                        const labels = { critica: 'Crítica', pendiente: 'Pendiente', aviso: 'Aviso' };
                        const colors = { critica: 'text-red-600 bg-red-50', pendiente: 'text-amber-600 bg-amber-50', aviso: 'text-blue-600 bg-blue-50' };
                        return (
                          <div key={prio}>
                            <div className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider ${colors[prio]}`}>
                              {labels[prio]} ({items.length})
                            </div>
                            {items.slice(0, 10).map(n => (
                              <div key={n.id} className="px-4 py-2.5 border-b border-slate-50 hover:bg-slate-50 transition flex items-start gap-3">
                                <i className={`fa-solid ${n.icon} ${n.color} mt-0.5 text-sm`} />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-700 truncate">{n.mensaje}</p>
                                  <p className="text-[11px] text-slate-400 truncate">{n.detalle}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          <button onClick={() => setSearchOpen(true)} className="flex items-center gap-2 h-9 px-3 rounded-xl border border-slate-200 text-xs text-slate-400 hover:border-slate-300 hover:text-slate-500 transition">
            <i className="fa-solid fa-search" /> Buscar <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono font-bold">Ctrl+K</kbd>
          </button>
        </header>

        <main ref={mainRef} className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto pb-24 lg:pb-8">
          {location.pathname !== '/' && (
            <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
              <NavLink to="/" className="hover:text-brand-600 transition"><i className="fa-solid fa-house text-[10px]" /> Inicio</NavLink>
              <i className="fa-solid fa-chevron-right text-[8px]" />
              <span className="font-bold text-slate-600">
                {ROUTE_LABELS[location.pathname] || (location.pathname.startsWith('/inventario') ? 'Entrada / Triage' : location.pathname.startsWith('/ficha-v2/') ? 'Ficha Técnica' : location.pathname.startsWith('/galeria/') ? 'Galería' : location.pathname.startsWith('/etiquetas/') ? 'Etiquetas' : location.pathname.startsWith('/documentos/') ? 'Documentos' : location.pathname.split('/').filter(Boolean).pop() || '')}
              </span>
            </nav>
          )}
          <div className="animate-fade-in" key={location.pathname}>
            <Outlet />
          </div>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-around items-center px-1 py-1 shadow-lg">
          {[
            { to: '/', icon: 'fa-chart-pie', label: 'Inicio' },
            { to: '/inventario', icon: 'fa-plus-circle', label: 'Registrar', accent: true, perm: 'ver_inventario' },
            { to: '/base-datos', icon: 'fa-table-list', label: 'Buscar', perm: 'base_datos' },
            { to: '/alertas', icon: 'fa-triangle-exclamation', label: 'Alertas', perm: 'ver_inventario', badge: notificacionesLocales.length },
          ].filter(l => !l.perm || can(l.perm)).map(l => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'}
              className={({ isActive }) => `flex flex-col items-center px-2 py-1.5 rounded-xl text-[10px] font-bold transition ${l.accent ? 'text-white bg-brand-600 shadow-md -mt-3 px-3' : isActive ? 'text-brand-600' : 'text-slate-400'}`}>
              <div className="relative">
                <i className={`fa-solid ${l.icon} ${l.accent ? 'text-lg' : 'text-base'} mb-0.5`} />
                {l.badge > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                    {l.badge > 9 ? '9+' : l.badge}
                  </span>
                )}
              </div>
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
