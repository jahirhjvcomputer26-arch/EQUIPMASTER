import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_BASE_URL = 'http://192.168.100.198:3001/api';

let baseURL = DEFAULT_BASE_URL;

async function getBaseUrl() {
  const saved = await AsyncStorage.getItem('api_url');
  if (saved) baseURL = saved;
  return baseURL;
}

async function getToken() {
  return await AsyncStorage.getItem('token');
}

async function request(endpoint, options = {}) {
  const url = `${await getBaseUrl()}${endpoint}`;
  const token = await getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    await AsyncStorage.removeItem('token');
    throw new Error('Sesion expirada');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
  }

  return response.json();
}

export const api = {
  async setBaseUrl(url) {
    baseURL = url;
    await AsyncStorage.setItem('api_url', url);
  },

  async getBaseUrl() {
    return getBaseUrl();
  },

  async login(usuario, password) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usuario, password }),
    });
    if (data.token) {
      await AsyncStorage.setItem('token', data.token);
    }
    return data;
  },

  async logout() {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  },

  async me() {
    return request('/auth/me');
  },

  async getInventario(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/inventario${query ? `?${query}` : ''}`);
  },

  async getEquipo(codigo) {
    return request(`/inventario/${encodeURIComponent(codigo)}`);
  },

  async dashboard() {
    return request('/dashboard');
  },

  async getTickets(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/tickets${query ? `?${query}` : ''}`);
  },
};

export default api;
