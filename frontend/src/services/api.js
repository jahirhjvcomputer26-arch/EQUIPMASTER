const API = import.meta.env.VITE_API_URL || '/api';

const AUTH_KEYS = ['equipmaster_token', 'equipmaster_nombre', 'equipmaster_rol', 'equipmaster_permisos', 'equipmaster_nivel'];

function cerrarSesionLocal() {
  AUTH_KEYS.forEach(k => localStorage.removeItem(k));
  window.dispatchEvent(new Event('equipmaster:unauthorized'));
}

function headers() {
  const token = localStorage.getItem('equipmaster_token');
  const dispositivo = localStorage.getItem('equipmaster_dispositivo');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(dispositivo ? { 'X-Device-ID': dispositivo } : {}),
  };
}

function dispositivoId() {
  let d = localStorage.getItem('equipmaster_dispositivo');
  if (!d) {
    d = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
    localStorage.setItem('equipmaster_dispositivo', d);
  }
  return d;
}

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, { ...options, headers: { ...headers(), ...options.headers } });
  if (res.status === 401 && !path.startsWith('/usuarios/login') && !path.startsWith('/usuarios/logout')) cerrarSesionLocal();
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Error en la solicitud');
  return data;
}

export const api = {
  register: (body) => request('/usuarios/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/usuarios/login', { method: 'POST', body: JSON.stringify({ ...body, dispositivo: dispositivoId() }) }),
  logout: () => request('/usuarios/logout', { method: 'POST' }),
  me: () => request('/usuarios/me'),
  getInventario: () => request('/inventario'),
  buscarInventario: (params = {}) => request(`/inventario/buscar?${new URLSearchParams(params)}`),
  getEquipo: (codigo) => request(`/inventario/${encodeURIComponent(codigo)}`),
  consultaPublica: async (q) => {
    const res = await fetch(`${API}/inventario/public/consulta?q=${encodeURIComponent(q)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Equipo no encontrado');
    return data;
  },
  catalogoPublico: () => fetch(`${API}/inventario/public/catalogo`).then(async r => { const data = await r.json(); if (!r.ok) throw new Error(data.error || 'Error al cargar catálogo'); return data; }),
  productoPublico: (codigo) => fetch(`${API}/inventario/public/catalogo/${encodeURIComponent(codigo)}`).then(async r => { const data = await r.json(); if (!r.ok) throw new Error(data.error || 'Producto no disponible'); return data; }),
  getCatalogoPublicables: () => request('/catalogo-publicacion'),
  publicarCatalogo: (codigo, body) => request(`/catalogo-publicacion/${encodeURIComponent(codigo)}`, { method: 'PUT', body: JSON.stringify(body) }),
  getSolicitudesVenta: () => request('/solicitudes-venta'),
  actualizarSolicitudVenta: (id, body) => request(`/solicitudes-venta/${id}`, { method: 'PUT', body: JSON.stringify(typeof body === 'string' ? { estado: body } : body) }),
  crearSolicitudVenta: (body) => fetch(`${API}/solicitudes-venta`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(async r => { const data = await r.json(); if (!r.ok) throw new Error(data.error || 'No se pudo enviar la solicitud'); return data; }),
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
  getCentroReparaciones: () => request('/centro-reparaciones'),
  crearCentroReparacion: (body) => request('/centro-reparaciones', { method: 'POST', body: JSON.stringify(body) }),
  updateCentroReparacion: (id, body) => request(`/centro-reparaciones/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  finalizarCentroReparacion: (id) => request(`/centro-reparaciones/${id}/finalizar`, { method: 'POST' }),
  deleteCentroReparacion: (id) => request(`/centro-reparaciones/${id}`, { method: 'DELETE' }),
  importarCentroReparaciones: (body) => request('/centro-reparaciones/importar', { method: 'POST', body: JSON.stringify(body) }),
  descargarPlantillaCentro: async () => {
    const token = localStorage.getItem('equipmaster_token');
    const res = await fetch(`${API}/centro-reparaciones/plantilla`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) cerrarSesionLocal();
    if (!res.ok) throw new Error('Error al descargar plantilla');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Plantilla_Centro_Reparaciones.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  },
  getUsuarios: () => request('/usuarios/list'),
  crearUsuario: (body) => request('/usuarios/register', { method: 'POST', body: JSON.stringify(body) }),
  actualizarUsuario: (body) => request('/usuarios/update', { method: 'PUT', body: JSON.stringify(body) }),
  resetPassword: (body) => request('/usuarios/reset-password', { method: 'POST', body: JSON.stringify(body) }),
  getPermisosRoles: () => request('/usuarios/roles'),
  updateRol: (body) => request('/usuarios/rol', { method: 'PUT', body: JSON.stringify(body) }),
  updateRolPermisos: (rol, body) => request(`/usuarios/roles/${rol}`, { method: 'PUT', body: JSON.stringify(body) }),
  eliminarUsuario: (usuario) => request(`/usuarios/${usuario}`, { method: 'DELETE' }),
  downloadBackup: async () => {
    const token = localStorage.getItem('equipmaster_token');
    const res = await fetch(`${API}/backup`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) cerrarSesionLocal();
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
  getReporteVentas: () => request('/reportes/ventas'),
  getReporteReparaciones: () => request('/reportes/reparaciones'),
  getConfiguracion: () => request('/configuracion'),
  getCatalogos: () => request('/catalogos'),
  saveCatalogo: (tipo, valores) => request(`/catalogos/${tipo}`, { method: 'PUT', body: JSON.stringify({ valores }) }),
  getGarantias: () => request('/garantias'),
  crearGarantia: (body) => request('/garantias', { method: 'POST', body: JSON.stringify(body) }),
  actualizarGarantia: (id, body) => request(`/garantias/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  eliminarGarantia: (id) => request(`/garantias/${id}`, { method: 'DELETE' }),
  getMantenimientos: () => request('/mantenimientos'),
  crearMantenimiento: (body) => request('/mantenimientos', { method: 'POST', body: JSON.stringify(body) }),
  actualizarMantenimiento: (id, body) => request(`/mantenimientos/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  eliminarMantenimiento: (id) => request(`/mantenimientos/${id}`, { method: 'DELETE' }),
  saveConfiguracion: (body) => request('/configuracion', { method: 'PUT', body: JSON.stringify(body) }),
  getConfigPublic: () => fetch(`${API}/configuracion/public`).then(r => r.json()),
  uploadFile: (body) => request('/storage/upload', { method: 'POST', body: JSON.stringify(body) }),
  deleteFile: (path) => request(`/storage/delete?path=${encodeURIComponent(path)}`, { method: 'DELETE' }),
  cleanupStorage: () => request('/storage/cleanup', { method: 'POST' }),
  modelosFotos: () => request('/modelos-fotos'),
  getModeloFotos: (clave) => request(`/modelos-fotos/${clave}`),
  subirFotoModelo: (body) => request('/modelos-fotos', { method: 'POST', body: JSON.stringify(body) }),
  borrarFotoModelo: (clave, fotoId) => request(`/modelos-fotos/${clave}/${fotoId}`, { method: 'DELETE' }),
  borrarModelo: (clave) => request(`/modelos-fotos/${clave}`, { method: 'DELETE' }),
  getTickets: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/tickets${qs ? '?' + qs : ''}`);
  },
  getTicket: (id) => request(`/tickets/${id}`),
  getTecnicos: () => request('/tickets/tecnicos'),
  crearTicket: (body) => request('/tickets', { method: 'POST', body: JSON.stringify(body) }),
  actualizarTicket: (id, body) => request(`/tickets/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  agregarNotaTicket: (id, texto) => request(`/tickets/${id}/nota`, { method: 'POST', body: JSON.stringify({ texto }) }),
  reabrirTicket: (id) => request(`/tickets/${id}/reabrir`, { method: 'POST' }),
  eliminarTicket: (id) => request(`/tickets/${id}`, { method: 'DELETE' }),
  detectHardware: () => request('/hardware/detect'),
  sendReportEmail: (body) => request('/reportes/email', { method: 'POST', body: JSON.stringify(body) }),
  getNotificaciones: () => request('/notificaciones'),
  crearNotificacion: (body) => request('/notificaciones', { method: 'POST', body: JSON.stringify(body) }),
  marcarLeidaNotificacion: (id) => request(`/notificaciones/${id}`, { method: 'PUT' }),
  downloadExcel: async () => {
    const token = localStorage.getItem('equipmaster_token');
    const res = await fetch(`${API}/reportes/excel`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) cerrarSesionLocal();
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
