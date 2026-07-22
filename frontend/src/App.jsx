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
import ConsultaPublica from './pages/ConsultaPublica';
import FichaEquipo from './pages/FichaEquipo';
import FichaTecnicaV2 from './pages/FichaTecnicaV2';
import Galeria from './pages/Galeria';
import Etiquetas from './pages/Etiquetas';
import Usuarios from './pages/Usuarios';
import CentroDocumentacion from './pages/CentroDocumentacion';
import Configuracion from './pages/Configuracion';
import LoadingScreen from './componentes/LoadingScreen';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Cargando...</div>;
  return user ? children : <Navigate to="/login" replace />;
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
                <Route path="inventario" element={<Inventario />} />
                <Route path="ventas" element={<Ventas />} />
                <Route path="mercadolibre" element={<MercadoLibre />} />
                <Route path="devoluciones" element={<Devoluciones />} />
                <Route path="prestamos" element={<Prestamos />} />
                <Route path="perfil" element={<Perfil />} />
                <Route path="reportes" element={<Reportes />} />
                <Route path="actividad" element={<Actividad />} />
                <Route path="base-datos" element={<BaseDatos />} />
                <Route path="reparaciones" element={<Reparaciones />} />
                <Route path="usuarios" element={<Usuarios />} />
                <Route path="configuracion" element={<Configuracion />} />
              </Route>
              <Route path="consulta" element={<ConsultaPublica />} />
              <Route path="ficha/:codigo" element={<FichaEquipo />} />
              <Route path="ficha-v2/:codigo" element={<FichaTecnicaV2 />} />
              <Route path="/galeria/:codigo" element={<Galeria />} />
              <Route path="/etiquetas" element={<Etiquetas />} />
              <Route path="/etiquetas/:codigo" element={<Etiquetas />} />
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
