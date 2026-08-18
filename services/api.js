import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL_KEY = 'equipmaster_api_url';
const TOKEN_KEY = 'equipmaster_token';
const DEFAULT_URL = 'http://192.168.100.182:3001/api';

export async function getApiUrl() {
  try {
    const url = await AsyncStorage.getItem(API_URL_KEY);
    return url || DEFAULT_URL;
  } catch {
    return DEFAULT_URL;
  }
}

export async function setApiUrl(url) {
  await AsyncStorage.setItem(API_URL_KEY, url);
}

async function request(endpoint, options = {}) {
  const baseUrl = await getApiUrl();
  const token = await AsyncStorage.getItem(TOKEN_KEY);

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    await AsyncStorage.removeItem(TOKEN_KEY);
    throw new Error('Sesion expirada');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Error del servidor');
  }

  return data;
}

export async function login(usuario, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ usuario, password }),
  });
  if (data.token) {
    await AsyncStorage.setItem(TOKEN_KEY, data.token);
  }
  return data;
}

export async function logout() {
  try {
    await request('/auth/logout', { method: 'POST' });
  } catch {}
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function me() {
  return request('/auth/me');
}

export async function getInventario(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/inventario${query ? `?${query}` : ''}`);
}

export async function getEquipo(codigo) {
  return request(`/inventario/${encodeURIComponent(codigo)}`);
}

export async function dashboard() {
  return request('/dashboard');
}

export async function getTickets(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/tickets${query ? `?${query}` : ''}`);
}
