import { firebaseGet } from '../firebase.js';

const number = value => Number(String(value ?? '').replace(/[$,\s]/g, '')) || 0;
const isSold = item => String(item.estado || '').includes('VENDIDO') || item.flujoSalida || item.flujoVentaML;
const daysSince = value => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
};
const fieldText = value => String(value || '').trim().toLowerCase();
const sales = async () => (await inventory()).filter(item => item.flujoSalida || item.flujoVentaML).map(item => ({
  codigo: item.codigo, sku: item.sku, marca: item.marca, modelo: item.modelo,
  fecha: item.flujoSalida?.fechaSalida || item.flujoVentaML?.fechaVenta || null,
  precio: number(item.flujoSalida?.precio || item.precioPublico || item.precio),
  canal: item.flujoVentaML ? 'Mercado Libre' : 'Venta local',
}));

async function inventory() {
  const data = await firebaseGet('inventario');
  return data ? Object.values(data) : [];
}

export const tools = {
  async getInventory(options = {}) {
    const items = await inventory();
    const query = fieldText(options.query).replace(/s$/, '');
    const queryTerms = query.split(/\s+/).filter(term => term.length > 1);
    const result = items.filter(item => {
      if (options.available === true && isSold(item)) return false;
      if (options.available === false && !isSold(item)) return false;
      if (options.category && !fieldText(item.categoria).includes(fieldText(options.category).replace(/s$/, ''))) return false;
      if (options.brand && !fieldText(item.marca).includes(fieldText(options.brand))) return false;
      if (options.model && !fieldText(item.modelo).includes(fieldText(options.model))) return false;
      if (options.state && !fieldText(item.estado).includes(fieldText(options.state))) return false;
      if (options.minRam && (Number.parseInt(String(item.ram || '').replace(/[^0-9]/g, ''), 10) || 0) < Number(options.minRam)) return false;
      if (options.minDays && (daysSince(item.fechaRegistro) || 0) < Number(options.minDays)) return false;
      if (options.maxPrice && number(item.precioPublico || item.precio) > Number(options.maxPrice)) return false;
      const searchable = ['codigo', 'sku', 'serie', 'marca', 'modelo', 'categoria', 'procesador', 'ram', 'almacenamiento', 'grafica', 'sistemaOperativo', 'estado'].map(field => fieldText(item[field])).join(' ');
      if (query && !queryTerms.every(term => searchable.includes(term))) return false;
      return true;
    });
    return result.slice(0, Math.min(10000, Math.max(1, Number(options.limit) || 50)));
  },
  async searchProducts(query, limit = 25) {
    const q = String(query || '').trim().toLowerCase();
    if (['laptop', 'laptops', 'portatil', 'portátiles'].includes(q)) return this.getInventory({ category: 'laptop', limit });
    const items = await inventory();
    return items.filter(item => !q || ['codigo', 'sku', 'serie', 'marca', 'modelo', 'categoria', 'procesador', 'ram', 'almacenamiento', 'grafica', 'sistemaOperativo'].some(field => String(item[field] || '').toLowerCase().includes(q))).slice(0, limit);
  },
  async getInventorySummary() {
    const items = await inventory();
    const available = items.filter(item => !isSold(item));
    const lowStock = available.filter(item => item.stock !== undefined ? number(item.stock) <= 2 : item.estado?.includes('BAJO STOCK'));
    const value = available.reduce((total, item) => total + number(item.precioPublico || item.precio), 0);
    return { total: items.length, disponibles: available.length, lowStock: lowStock.length, value, lowStockItems: lowStock.slice(0, 15) };
  },
  async getProductsByStock(kind) {
    const items = (await inventory()).filter(item => !isSold(item));
    return items.filter(item => kind === 'out' ? number(item.stock) === 0 || item.estado?.includes('AGOTADO') : number(item.stock) > 0 && number(item.stock) <= 2 || item.estado?.includes('BAJO STOCK')).slice(0, 25);
  },
  async getOldestProducts(limit = 10) {
    const items = (await inventory()).filter(item => !isSold(item)).map(item => ({ ...item, diasAlmacenado: daysSince(item.fechaRegistro) })).filter(item => item.diasAlmacenado !== null).sort((a, b) => b.diasAlmacenado - a.diasAlmacenado);
    return items.slice(0, limit);
  },
  async getProductBySku(sku) {
    const result = await this.searchProducts(sku);
    return result.find(item => String(item.sku || '').toLowerCase() === String(sku).toLowerCase()) || result[0] || null;
  },
  async getProductExact(identifier) {
    const value = String(identifier || '').trim().toLowerCase();
    return (await inventory()).find(item => [item.codigo, item.sku, item.serie].some(field => String(field || '').trim().toLowerCase() === value)) || null;
  },
  async getTopModels(limit = 10) {
    const counts = new Map();
    for (const item of await inventory()) {
      if (isSold(item) || !item.modelo) continue;
      const key = String(item.modelo).trim();
      const current = counts.get(key) || { modelo: key, marca: item.marca || '', cantidad: 0 };
      current.cantidad += 1;
      counts.set(key, current);
    }
    return [...counts.values()].sort((a, b) => b.cantidad - a.cantidad).slice(0, limit);
  },
  async getTopBrands(limit = 10) {
    const counts = new Map();
    for (const item of await inventory()) {
      if (isSold(item) || !item.marca) continue;
      const key = String(item.marca).trim();
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return [...counts.entries()].map(([marca, cantidad]) => ({ marca, cantidad })).sort((a, b) => b.cantidad - a.cantidad).slice(0, limit);
  },
  async getStateSummary() {
    const counts = new Map();
    for (const item of await inventory()) {
      const estado = String(item.estado || 'SIN ESTADO').trim();
      counts.set(estado, (counts.get(estado) || 0) + 1);
    }
    return [...counts.entries()].map(([estado, cantidad]) => ({ estado, cantidad })).sort((a, b) => b.cantidad - a.cantidad);
  },
  async getProductsByState(state) {
    const query = String(state || '').trim().toLowerCase();
    return (await inventory()).filter(item => String(item.estado || '').toLowerCase().includes(query)).slice(0, 50);
  },
  async aggregateInventory({ groupBy = 'modelo', limit = 10, ...options } = {}) {
    const counts = new Map();
    for (const item of await this.getInventory({ ...options, limit: 10000 })) {
      const value = String(item[groupBy] || 'SIN REGISTRAR').trim();
      counts.set(value, (counts.get(value) || 0) + 1);
    }
    return [...counts.entries()].map(([value, cantidad]) => ({ [groupBy]: value, cantidad })).sort((a, b) => b.cantidad - a.cantidad).slice(0, Math.min(50, Number(limit) || 10));
  },
  async getSalesSummary(period = 'all') {
    const now = new Date();
    const records = (await sales()).filter(item => {
      if (period === 'all' || !item.fecha) return period === 'all' || !item.fecha;
      const date = new Date(item.fecha);
      return !Number.isNaN(date.getTime()) && (period === 'year' ? date.getFullYear() === now.getFullYear() : date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear());
    });
    return { totalVentas: records.length, importe: records.reduce((sum, item) => sum + item.precio, 0), ventas: records.slice(0, 100) };
  },
};

export function publicProduct(item) {
  if (!item) return null;
  return { codigo: item.codigo, sku: item.sku, serie: item.serie, marca: item.marca, modelo: item.modelo, categoria: item.categoria, procesador: item.procesador, generacion: item.generacion, ram: item.ram, tipoRam: item.tipoRam, almacenamiento: item.almacenamiento, tipoDisco: item.tipoDisco, grafica: item.grafica, pantalla: item.pantalla, resolucion: item.resolucion, sistemaOperativo: item.sistemaOperativo, color: item.color, estado: item.estado, precio: item.precioPublico || item.precio, stock: item.stock, fechaRegistro: item.fechaRegistro };
}
