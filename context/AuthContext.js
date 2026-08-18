import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as api from '../services/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'equipmaster_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        const data = await api.me();
        setUser(data.user || data);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(usuario, password) {
    const data = await api.login(usuario, password);
    const userData = data.user || data.usuario || data;
    setUser(userData);
    return data;
  }

  async function logout() {
    await api.logout();
    setUser(null);
  }

  function can(permission) {
    if (!user) return false;
    if (user.rol === 'admin') return true;
    if (user.permisos && Array.isArray(user.permisos)) {
      return user.permisos.includes(permission);
    }
    return false;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, can, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
