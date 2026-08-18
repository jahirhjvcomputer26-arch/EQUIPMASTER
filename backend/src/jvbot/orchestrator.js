import { publicProduct, tools } from './tools.js';

const definitions = [
  { type: 'function', function: { name: 'searchProducts', description: 'Busca productos del inventario por texto, categoría, marca, modelo, estado o especificaciones. Úsala para listar coincidencias.', parameters: { type: 'object', properties: { query: { type: 'string' }, category: { type: 'string' }, brand: { type: 'string' }, model: { type: 'string' }, state: { type: 'string' }, available: { type: 'boolean' }, minRam: { type: 'number' }, minDays: { type: 'number' }, maxPrice: { type: 'number' }, limit: { type: 'number' } }, additionalProperties: false } } },
  { type: 'function', function: { name: 'getInventory', description: 'Obtiene el inventario filtrado y sus registros reales. Úsala para contar, revisar o combinar filtros.', parameters: { type: 'object', properties: { query: { type: 'string' }, category: { type: 'string' }, brand: { type: 'string' }, model: { type: 'string' }, state: { type: 'string' }, available: { type: 'boolean' }, minRam: { type: 'number' }, minDays: { type: 'number' }, maxPrice: { type: 'number' }, limit: { type: 'number' } }, additionalProperties: false } } },
  { type: 'function', function: { name: 'getProduct', description: 'Obtiene un producto exacto por código, SKU o serie.', parameters: { type: 'object', properties: { identifier: { type: 'string' } }, required: ['identifier'], additionalProperties: false } } },
  { type: 'function', function: { name: 'aggregateInventory', description: 'Agrupa y cuenta inventario por modelo, marca, categoría o estado; permite aplicar filtros. Úsala para preguntas del tipo "qué modelos/marcas/categorías/estados hay" o "cuántos hay por X".', parameters: { type: 'object', properties: { groupBy: { type: 'string', enum: ['modelo', 'marca', 'categoria', 'estado'] }, query: { type: 'string' }, category: { type: 'string' }, brand: { type: 'string' }, state: { type: 'string' }, available: { type: 'boolean' }, limit: { type: 'number' } }, required: ['groupBy'], additionalProperties: false } } },
  { type: 'function', function: { name: 'getInventorySummary', description: 'Calcula totales actuales, disponibles, stock bajo y valor estimado del inventario.', parameters: { type: 'object', properties: {}, additionalProperties: false } } },
  { type: 'function', function: { name: 'getSalesSummary', description: 'Resume ventas reales registradas en EquipMaster. Usa period month, year o all.', parameters: { type: 'object', properties: { period: { type: 'string', enum: ['month', 'year', 'all'] } }, additionalProperties: false } } },
];

function filters(args = {}) {
  return { query: args.query, category: args.category, brand: args.brand, model: args.model, state: args.state, available: args.available, minRam: args.minRam, minDays: args.minDays, maxPrice: args.maxPrice, limit: Math.min(100, Math.max(1, Number(args.limit) || 50)) };
}

async function execute(name, args) {
  if (name === 'searchProducts' || name === 'getInventory') {
    const items = (await tools.getInventory(filters(args))).map(publicProduct);
    return { total: items.length, items };
  }
  if (name === 'getProduct') {
    const exact = await tools.getProductExact(args.identifier);
    if (exact) return publicProduct(exact);
    const matches = (await tools.getInventory({ query: args.identifier, limit: 20 })).map(publicProduct);
    return { total: matches.length, items: matches };
  }
  if (name === 'aggregateInventory') {
    const groups = await tools.aggregateInventory({ ...filters(args), limit: 10000, groupBy: args.groupBy });
    return { total: groups.reduce((sum, group) => sum + group.cantidad, 0), groups };
  }
  if (name === 'getInventorySummary') {
    const summary = await tools.getInventorySummary();
    return { ...summary, lowStockItems: summary.lowStockItems.map(publicProduct) };
  }
  if (name === 'getSalesSummary') return await tools.getSalesSummary(args.period || 'all');
  return { error: 'Herramienta no disponible' };
}

function safeToolAnswer(result, toolName) {
  if (!result) return 'No encontré datos verificables para esa consulta.';
  if (typeof result.total === 'number' && Array.isArray(result.items)) {
    if (!result.total) return 'No encontré productos que cumplan esos filtros.';
    const preview = result.items.slice(0, 8).map(item => `${item.marca || ''} ${item.modelo || ''} (${item.sku || item.codigo || 'sin identificador'})`).join(', ');
    return `Encontré ${result.total} producto${result.total === 1 ? '' : 's'} con esos criterios.${preview ? ` Algunos son: ${preview}.` : ''}`;
  }
  if (Array.isArray(result.groups)) {
    const first = result.groups[0];
    return first ? `El grupo principal es ${Object.values(first).find(value => typeof value === 'string') || 'sin nombre'} con ${first.cantidad} registros.` : 'No encontré agrupaciones para esos criterios.';
  }
  if (typeof result.total === 'number' && typeof result.disponibles === 'number') return `Tienes ${result.disponibles} equipos disponibles de ${result.total} registrados.`;
  return `La herramienta ${toolName} devolvió datos, pero no pudo resumirlos de forma segura.`;
}

export async function runToolConversation(provider, { message, history, memory }) {
  const system = `Eres JVBOT, un asistente general especializado en EquipMaster. Conversa naturalmente en español. Decide si la pregunta es general o requiere datos de EquipMaster. Para cualquier dato del inventario, SIEMPRE usa una herramienta antes de responder. Puedes encadenar herramientas y combinar filtros. Usa el campo total entregado por las herramientas; no hagas sumas mentales ni inventes conteos. No inventes productos, precios, stock, ventas, estados ni cifras. Si una herramienta no devuelve el dato, dilo claramente. Mantén el contexto de la conversación. La base actual es la única fuente de verdad. Esta versión es de solo lectura. Responde de forma breve y muestra listas solo cuando el usuario las pida. Preferencias explícitas: ${JSON.stringify(memory || [])}\n\nReglas de selección de herramienta:\n- Si preguntan qué MODELOS o MARCAS existen o cuántos hay por modelo/marca/categoría/estado, usa aggregateInventory con groupBy adecuado (modelo, marca, categoria o estado).\n- Si preguntan por un equipo específico (código, SKU o serie), usa getProduct.\n- Si preguntan cuántos equipos/laptops hay en total o disponibles, usa getInventory.\n- Si preguntan por VENTAS, usa getSalesSummary.\n- Si preguntan por el estado general del inventario (totales, stock bajo, valor), usa getInventorySummary.\n- NUNCA uses getSalesSummary ni respondas sobre ventas si la pregunta es sobre modelos, marcas, catálogo o especificaciones.`;
  const messages = [{ role: 'system', content: system }, ...(history || []).slice(-10), { role: 'user', content: message }];
  const usedTools = [];
  let lastResult = null;
  for (let turn = 0; turn < 4; turn += 1) {
    const assistant = await provider.generateWithTools(messages, definitions);
    const calls = assistant.tool_calls || [];
    messages.push(assistant);
    if (!calls.length) {
      const content = assistant.content?.trim() || '';
      const failedToUseData = /no tengo acceso|necesitar[ií]a utilizar|no puedo acceder|no se proporcionaron datos/i.test(content);
      return { answer: content && !failedToUseData ? content : safeToolAnswer(lastResult, usedTools.at(-1) || 'herramienta'), tool: usedTools.join(',') || 'llm', data: lastResult, usedTools };
    }
    for (const call of calls) {
      let args = {};
      try { args = JSON.parse(call.function?.arguments || '{}'); } catch { args = {}; }
      const result = await execute(call.function?.name, args);
      usedTools.push(call.function?.name);
      lastResult = result;
      messages.push({ role: 'tool', tool_call_id: call.id, name: call.function?.name, content: JSON.stringify(result) });
    }
  }
  return { answer: 'La consulta requiere demasiados pasos para resolverla de forma segura.', tool: usedTools.join(','), data: null, usedTools };
}

export { definitions };
