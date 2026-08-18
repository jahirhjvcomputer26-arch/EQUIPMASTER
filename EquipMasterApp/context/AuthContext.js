import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverConfigured, setServerConfigured] = useState(false);

  useEffect(() => {
    checkInitialState();
  }, []);

  async function checkInitialState() {
    try {
      const apiUrl = await AsyncStorage.getItem('api_url');
      const savedToken = await AsyncStorage.getItem('token');
      const savedUser = await AsyncStorage.getItem('user');

      if (apiUrl) setServerConfigured(true);

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error('Error checking initial state:', e);
    } finally {
      setLoading(false);
    }
  }

  async function login(usuario, password) {
    const data = await api.login(usuario, password);
    const userData = data.user || data.usuario || data;
    setToken(data.token);
    setUser(userData);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    return data;
  }

  async function logout() {
    await api.logout();
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem('user');
  }

  async function setServerUrl(url) {
    await api.setBaseUrl(url);
    setServerConfigured(true);
  }

  async function can(permission) {
    if (!user) return false;
    if (user.rol === 'admin' || user.rol === 'administrador') return true;
    const perms = user.permisos || user.permissions || [];
    return perms.includes(permission);
  }

  const value = {
    user,
    token,
    loading,
    serverConfigured,
    login,
    logout,
    setServerUrl,
    can,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
