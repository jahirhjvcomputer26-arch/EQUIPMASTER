import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('equipmaster_token');
    const nombre = localStorage.getItem('equipmaster_nombre');
    const rol = localStorage.getItem('equipmaster_rol');
    if (token && nombre) {
      setUser({ nombre, rol: rol || 'tecnico' });
      api.me().then(data => {
        localStorage.setItem('equipmaster_rol', data.rol);
        setUser({ nombre: data.nombre, rol: data.rol });
      }).catch(() => logout()).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (usuario, password) => {
    const data = await api.login({ usuario, password });
    localStorage.setItem('equipmaster_token', data.token);
    localStorage.setItem('equipmaster_nombre', data.nombre);
    localStorage.setItem('equipmaster_rol', data.rol || 'tecnico');
    setUser({ nombre: data.nombre, rol: data.rol || 'tecnico' });
    return data;
  };

  const register = async (usuario, password, confirmPassword) => {
    return api.register({ usuario, password, confirmPassword });
  };

  const logout = () => {
    localStorage.removeItem('equipmaster_token');
    localStorage.removeItem('equipmaster_nombre');
    localStorage.removeItem('equipmaster_rol');
    setUser(null);
  };

  const setNombre = (nombre) => {
    localStorage.setItem('equipmaster_nombre', nombre);
    setUser(prev => ({ ...prev, nombre }));
  };

  const hasRole = (role) => user?.rol === role;

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setNombre, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
