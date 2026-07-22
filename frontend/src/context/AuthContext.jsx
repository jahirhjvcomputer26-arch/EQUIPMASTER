import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('equipmaster_token');
    const nombre = localStorage.getItem('equipmaster_nombre');
    if (token && nombre) {
      setUser({ nombre });
      api.me().catch(() => logout()).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (usuario, password) => {
    const data = await api.login({ usuario, password });
    localStorage.setItem('equipmaster_token', data.token);
    localStorage.setItem('equipmaster_nombre', data.nombre);
    setUser({ nombre: data.nombre });
    return data;
  };

  const register = async (usuario, password, confirmPassword) => {
    return api.register({ usuario, password, confirmPassword });
  };

  const logout = () => {
    localStorage.removeItem('equipmaster_token');
    localStorage.removeItem('equipmaster_nombre');
    setUser(null);
  };

  const setNombre = (nombre) => {
    localStorage.setItem('equipmaster_nombre', nombre);
    setUser({ nombre });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setNombre }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
