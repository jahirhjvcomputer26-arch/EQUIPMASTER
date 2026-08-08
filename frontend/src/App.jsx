import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DarkModeProvider } from './context/DarkModeContext';
import { InventarioProvider } from './context/InventarioContext';
import { NotifyProvider } from './componentes/Notification';
import Layout from './componentes/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventario from './pages/Inventario';
import Ventas from './pages/Ventas';
import MercadoLibre from './pages/MercadoLibre';
import Devoluciones from './pages/Devoluciones';
import Prestamos from './pages/Prestamos';
import Perfil from './pages/Perfil';
import Reportes from './pages/Reportes';
import Actividad from './pages/Actividad';
import NotFound from './pages/NotFound';
import BaseDatos from './pages/BaseDatos';
import Reparaciones from './pages/Reparaciones';
import CentroReparaciones from './pages/CentroReparaciones';
import ConsultaPublica from './pages/ConsultaPublica';
import FichaEquipo from './pages/FichaEquipo';
import FichaTecnicaV2 from './pages/FichaTecnicaV2';
import Galeria from './pages/Galeria';
import GaleriaModelos from './pages/GaleriaModelos';
import Etiquetas from './pages/Etiquetas';
import Usuarios from './pages/Usuarios';
import CentroDocumentacion from './pages/CentroDocumentacion';
import Configuracion from './pages/Configuracion';
import GarantiasMantenimiento from './pages/GarantiasMantenimiento';
import CatalogoPublico from './pages/CatalogoPublico';
import PublicarCatalogo from './pages/PublicarCatalogo';
import SolicitudesVenta from './pages/SolicitudesVenta';
import AlertasPanel from './pages/AlertasPanel';
import Tickets from './pages/Tickets';
import LoadingScreen from './componentes/LoadingScreen';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Cargando...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function Guard({ perm, children }) {
  const { can } = useAuth();
  if (!can(perm)) {
    return (
      <section className="space-y-6 animate-fade-in">
        <div className="panel p-12 text-center">
          <i className="fa-solid fa-shield-halved text-4xl text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-bold">Acceso denegado (403)</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">No tienes permiso para ver esta sección.</p>
        </div>
      </section>
    );
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <LoadingScreen />
      <AuthProvider>
        <DarkModeProvider>
        <NotifyProvider>
          <InventarioProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="inventario" element={<Guard perm="ver_inventario"><Inventario /></Guard>} />
                <Route path="ventas" element={<Guard perm="ver_ventas"><Ventas /></Guard>} />
                <Route path="mercadolibre" element={<Guard perm="ver_ventas"><MercadoLibre /></Guard>} />
                <Route path="devoluciones" element={<Guard perm="ver_ventas"><Devoluciones /></Guard>} />
                <Route path="prestamos" element={<Guard perm="ver_prestamos"><Prestamos /></Guard>} />
                <Route path="perfil" element={<Perfil />} />
                <Route path="reportes" element={<Guard perm="ver_reportes"><Reportes /></Guard>} />
                <Route path="alertas" element={<Guard perm="ver_inventario"><AlertasPanel /></Guard>} />
                <Route path="actividad" element={<Guard perm="ver_auditoria"><Actividad /></Guard>} />
                <Route path="base-datos" element={<Guard perm="base_datos"><BaseDatos /></Guard>} />
                <Route path="reparaciones" element={<Guard perm="ver_reparaciones"><Reparaciones /></Guard>} />
                <Route path="centro-reparaciones" element={<Guard perm="ver_reparaciones"><CentroReparaciones /></Guard>} />
                <Route path="usuarios" element={<Guard perm="admin_usuarios"><Usuarios /></Guard>} />
                 <Route path="configuracion" element={<Guard perm="config_sistema"><Configuracion /></Guard>} />
                 <Route path="garantias" element={<Guard perm="ver_garantias"><GarantiasMantenimiento /></Guard>} />
                 <Route path="publicar-catalogo" element={<Guard perm="publicar_catalogo"><PublicarCatalogo /></Guard>} />
                 <Route path="solicitudes-venta" element={<Guard perm="gestionar_solicitudes"><SolicitudesVenta /></Guard>} />
                <Route path="tickets" element={<Guard perm="ver_tickets"><Tickets /></Guard>} />
                <Route path="etiquetas" element={<Guard perm="generar_qr"><Etiquetas /></Guard>} />
                <Route path="etiquetas/:codigo" element={<Guard perm="generar_qr"><Etiquetas /></Guard>} />
                <Route path="modelos" element={<GaleriaModelos />} />
              </Route>
              <Route path="consulta" element={<ConsultaPublica />} />
              <Route path="catalogo" element={<CatalogoPublico />} />
              <Route path="catalogo/:codigo" element={<CatalogoPublico />} />
              <Route path="ficha/:codigo" element={<FichaEquipo />} />
              <Route path="ficha-v2/:codigo" element={<FichaTecnicaV2 />} />
              <Route path="/galeria/:codigo" element={<Galeria />} />
              <Route path="/documentos/:codigo" element={<CentroDocumentacion />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </InventarioProvider>
        </NotifyProvider>
        </DarkModeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
