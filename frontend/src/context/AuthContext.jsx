import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

const PERMISOS_KEY = 'equipmaster_permisos';
const NIVEL_KEY = 'equipmaster_nivel';

function normalizarPermisos(p) {
  if (!p) return {};
  if (Array.isArray(p)) {
    const o = {};
    p.forEach(k => { o[k] = true; });
    return o;
  }
  return p;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('equipmaster_token');
    const nombre = localStorage.getItem('equipmaster_nombre');
    if (token && nombre) {
      const cached = {
        rol: localStorage.getItem('equipmaster_rol') || 'usuario',
        nivel: parseInt(localStorage.getItem(NIVEL_KEY) || '0', 10) || undefined,
        permisos: normalizarPermisos((() => { try { return JSON.parse(localStorage.getItem(PERMISOS_KEY) || '{}'); } catch { localStorage.removeItem(PERMISOS_KEY); return {}; } })()),
      };
      setUser({ nombre, clave: '', ...cached });
      api.me().then(data => {
        const perms = normalizarPermisos(data.permisos);
        localStorage.setItem('equipmaster_rol', data.rol || 'usuario');
        if (data.nivel !== undefined) localStorage.setItem(NIVEL_KEY, String(data.nivel));
        localStorage.setItem(PERMISOS_KEY, JSON.stringify(perms));
        setUser({
          nombre: data.nombre,
          clave: data.clave || '',
          rol: data.rol || 'usuario',
          nivel: data.nivel !== undefined ? Number(data.nivel) : undefined,
          activo: data.activo,
          permisos: perms,
        });
      }).catch(() => logout()).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (usuario, password) => {
    const data = await api.login({ usuario, password });
    localStorage.setItem('equipmaster_token', data.token);
    const me = await api.me();
    const perms = normalizarPermisos(me.permisos);
    localStorage.setItem('equipmaster_nombre', me.nombre);
    localStorage.setItem('equipmaster_rol', me.rol || 'usuario');
    if (me.nivel !== undefined) localStorage.setItem(NIVEL_KEY, String(me.nivel));
    localStorage.setItem(PERMISOS_KEY, JSON.stringify(perms));
    setUser({
      nombre: me.nombre,
      clave: me.clave || '',
      rol: me.rol || 'usuario',
      nivel: me.nivel !== undefined ? Number(me.nivel) : undefined,
      activo: me.activo,
      permisos: perms,
    });
    return data;
  };

  const register = async (body) => {
    return api.crearUsuario(body);
  };

  const logout = () => {
    api.logout().catch(() => {});
    ['equipmaster_token', 'equipmaster_nombre', 'equipmaster_rol', PERMISOS_KEY, NIVEL_KEY].forEach(k => localStorage.removeItem(k));
    setUser(null);
  };

  useEffect(() => {
    const onUnauthorized = () => logout();
    window.addEventListener('equipmaster:unauthorized', onUnauthorized);
    return () => window.removeEventListener('equipmaster:unauthorized', onUnauthorized);
  }, []);

  const setNombre = (nombre) => {
    localStorage.setItem('equipmaster_nombre', nombre);
    setUser(prev => ({ ...prev, nombre }));
  };

  const can = (perm) => {
    if (!user) return false;
    if (user.rol === 'superadmin' || Number(user.nivel) >= 100) return true;
    if (user.permisos?.all) return true;
    return !!user.permisos?.[perm];
  };

  const canAny = (...perms) => perms.some(can);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setNombre, can, canAny }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
