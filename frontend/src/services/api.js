const API = import.meta.env.VITE_API_URL || '/api';

function headers() {
  const token = localStorage.getItem('equipmaster_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, { ...options, headers: { ...headers(), ...options.headers } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Error en la solicitud');
  return data;
}

export const api = {
  register: (body) => request('/usuarios/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/usuarios/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/usuarios/me'),
  getInventario: () => request('/inventario'),
  saveEquipo: (codigo, body) => request(`/inventario/${codigo}`, { method: 'PUT', body: JSON.stringify(body) }),
  eliminarEquipo: (codigo) => request(`/inventario/${codigo}`, { method: 'DELETE' }),
  ventaLocal: (body) => request('/ventas/local', { method: 'POST', body: JSON.stringify(body) }),
  ventaML: (body) => request('/ventas/mercadolibre', { method: 'POST', body: JSON.stringify(body) }),
  devolucion: (body) => request('/ventas/devolucion', { method: 'POST', body: JSON.stringify(body) }),
  editarVentaLocal: (codigo, body) => request(`/ventas/local/${codigo}`, { method: 'PUT', body: JSON.stringify(body) }),
  eliminarVentaLocal: (codigo) => request(`/ventas/local/${codigo}`, { method: 'DELETE' }),
  dashboard: () => request('/reportes/dashboard'),
  getPrestamos: () => request('/prestamos'),
  crearPrestamo: (body) => request('/prestamos', { method: 'POST', body: JSON.stringify(body) }),
  devolverPrestamo: (id) => request(`/prestamos/${id}/devolver`, { method: 'POST' }),
  cambiarPassword: (body) => request('/usuarios/cambiar-password', { method: 'POST', body: JSON.stringify(body) }),
  cambiarNombre: (body) => request('/usuarios/cambiar-nombre', { method: 'PUT', body: JSON.stringify(body) }),
  getActividad: (page = 1) => request(`/actividad?page=${page}&limit=50`),
  getFiltrosReportes: () => request('/reportes/filtros'),
  getReporteAvanzado: (params) => request(`/reportes/avanzado?${new URLSearchParams(params)}`),
  getReparaciones: () => request('/reparaciones'),
  crearReparacion: (body) => request('/reparaciones', { method: 'POST', body: JSON.stringify(body) }),
  updateReparacion: (id, body) => request(`/reparaciones/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteReparacion: (id) => request(`/reparaciones/${id}`, { method: 'DELETE' }),
  downloadBackup: async () => {
    const token = localStorage.getItem('equipmaster_token');
    const res = await fetch(`${API}/backup`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Error al descargar respaldo');
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `respaldo_equipmaster_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return data;
  },
  downloadExcel: async () => {
    const token = localStorage.getItem('equipmaster_token');
    const res = await fetch(`${API}/reportes/excel`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Error al descargar Excel');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Reporte_General_TI_Master.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  },
};
