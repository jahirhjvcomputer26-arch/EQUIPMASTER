import { createAIProvider } from './aiProvider.js';
import { publicProduct, tools } from './tools.js';
import { getMemory, remember } from './memory.js';
import { runToolConversation } from './orchestrator.js';

const money = value => `$${Number(value || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`;
const list = items => items.slice(0, 10).map((item, index) => `${index + 1}. ${item.marca || ''} ${item.modelo || ''} · ${item.sku || item.codigo || 'sin SKU'}${item.diasAlmacenado !== undefined ? ` · ${item.diasAlmacenado} días` : ''}`).join('\n');
const safeData = data => Array.isArray(data)
  ? data.map(publicProduct)
  : data?.lowStockItems
    ? { ...data, lowStockItems: data.lowStockItems.map(publicProduct) }
     : data;
const extractContextProducts = history => history.slice().reverse().map(item => {
  const prefix = '[Datos verificados de este turno: ';
  const marker = String(item?.content || '').indexOf(prefix);
  if (marker < 0) return null;
  try { return JSON.parse(String(item.content).slice(marker + prefix.length, -1)); } catch { return null; }
}).flatMap(value => Array.isArray(value) ? value : value?.codigo || value?.sku ? [value] : []).slice(0, 100) || [];
const price = item => Number(String(item?.precio || '').replace(/[$,\s]/g, '')) || 0;
const ram = item => Number.parseInt(String(item?.ram || '').replace(/[^0-9]/g, ''), 10) || 0;

export async function answer(message, history = [], userId = 'unknown') {
  const text = String(message || '').trim();
  const normalized = text.toLowerCase();
  if (!text) return { answer: 'Escribe una consulta sobre tu inventario.', tool: null, data: null };

  const memoryMatch = text.match(/^(?:recuerda que|recuerda|mi preferencia es|prefiero)\s+(.+)/i);
  if (memoryMatch) {
    const memoryText = memoryMatch[1].replace(/[.!?]+$/, '').trim();
    if (memoryText.length >= 3) {
      await remember(userId, memoryText);
      return { answer: `Entendido. Lo tendré en cuenta en tus próximas conversaciones: “${memoryText}”.`, tool: 'rememberPreference', data: null };
    }
  }

  let tool = 'searchProducts';
  let data;
  let answerText;
  const contextProducts = extractContextProducts(history);
  let memory = [];
  try { memory = await getMemory(userId); } catch (error) { console.warn('JVBOT memory unavailable:', error.message); }
  const provider = createAIProvider();
  const asksGeneralDefinition = /^(?:qu[eé]\s+es|para\s+qu[eé]\s+sirve|c[oó]mo\s+funciona)/.test(normalized) && !/equipmaster|inventario|tengo|tenemos/.test(normalized);
  const deterministicIntent = /por\s+qu[eé]\s+(?:no\s+)?sirves|no\s+funcionas|no\s+respondes|(?:qu[eé]\s+|cu[aá]l(?:es)?\s+)gr[aá]fica|gr[aá]ficas?\s+(?:tenemos|hay|manejamos)|tienen\s+gr[aá]fica|modelo[s]?\s+(?:m[aá]s|manejamos|registrad)|qu[eé]\s+modelo[s]?|marca[s]?\s+(?:tenemos|manejamos|vendemos|m[aá]s)|qu[eé]\s+marca[s]?|qu[eé]\s+estados|estados\s+(?:maneja|tiene|hay)|cu[aá]ntos\s+en\s+cada\s+estado|configuraci[oó]n|especificaciones|caracter[ií]stic|stock|stok|disponible[s]?|agotad|bajo\s+stock|poco\s+stock|antig|m[aá]s\s+(?:viejo|tiempo)|sku\b|analiza|resumen|valor.*inventario|vendim|\bventas?\b|cu[aá]nt[oa]s?\s+(?:laptop|equipo|producto)/.test(normalized);
  if (provider && !asksGeneralDefinition && !deterministicIntent) {
    try {
      const smart = await runToolConversation(provider, { message: text, history, memory });
      const requiresEquipData = !asksGeneralDefinition && /equipmaster|inventario|laptop|equipo|producto|stock|stok|sku|marca|modelo|precio|estado|venta|vendimos|almacen|ram|gr[aá]fica|procesador|ssd|disco/.test(normalized);
      const temaModelos = /modelo|marca|categor[ií]a|estado/.test(normalized);
      const temaVentas = /venta|vendim|vendid/.test(normalized);
      const temaEspecificaciones = /config|especificaciones|caracter[ií]stic|ram|procesador|gr[aá]fica|disco|ssd|almacenamiento|pantalla/.test(normalized);
      const toolsUsadas = smart.usedTools || [];
      const malCoincide = (temaVentas && !toolsUsadas.includes('getSalesSummary') && toolsUsadas.length > 0)
        || (temaModelos && toolsUsadas.includes('getSalesSummary'))
        || (temaEspecificaciones && ['getSalesSummary', 'getInventorySummary', 'aggregateInventory'].some(tool => toolsUsadas.includes(tool)));
      if (!requiresEquipData || (toolsUsadas.length && !malCoincide)) return smart;
    } catch (error) { console.warn('JVBOT orchestrator fallback:', error.message); }
  }

  if (asksGeneralDefinition) return { answer: 'Necesito un proveedor de IA activo para responder preguntas generales. La consulta de EquipMaster sí funciona con datos verificados.', tool: 'llm', data: null };
  const code = text.match(/\b[A-Z][A-Z0-9-]*\d[A-Z0-9-]*\b/i)?.[0];
  const asksCount = /cu[aá]nt[oa]s?|cantidad|n[uú]mero/.test(normalized);
  const technicalField = /gr[aá]fica|tarjeta gr[aá]fica|gpu/.test(normalized) ? ['gráfica', 'grafica']
    : /procesador|cpu/.test(normalized) ? ['procesador']
      : /ram|memoria/.test(normalized) ? ['ram']
        : /almacenamiento|disco|ssd/.test(normalized) ? ['almacenamiento']
          : /sistema operativo|windows|linux/.test(normalized) ? ['sistema operativo'] : null;
  const requestedState = normalized.match(/(?:estado|est[aá]n|estan|situaci[oó]n)\s+(?:en\s+)?([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)?)/i)?.[1]?.replace(/[?.!,].*$/, '').trim();
  const graphicsTerm = normalized.match(/\b(?:rtx|gtx|arc|radeon|iris|geforce|quadro|nvidia|amd)\w*/i)?.[0];
  if (/por\s+qu[eé]\s+(?:no\s+)?sirves|no\s+funcionas|no\s+respondes/.test(normalized)) {
    tool = 'llm'; data = null;
    answerText = 'Estoy operativo. Para responder preguntas sobre EquipMaster necesito consultar sus datos reales; si una consulta no coincide con la información registrada, te lo indicaré claramente. Prueba con “¿qué gráficas tenemos?” o “¿cuáles tienen RTX?”.';
  } else if (!code && graphicsTerm && (/gr[aá]fica|gpu|tienen|hay|cu[aá]les/.test(normalized))) {
    tool = 'getInventory'; data = await tools.getInventory({ query: graphicsTerm, available: true, limit: 10000 });
    answerText = data.length ? `Encontré ${data.length} equipos con ${graphicsTerm.toUpperCase()}:\n${list(data)}` : `No encontré equipos con gráfica ${graphicsTerm.toUpperCase()}.`;
  } else if (/qu[eé]\s+gr[aá]fica[s]?|gr[aá]fica[s]?\s+(tenemos|hay|manejamos)|cu[aá]les\s+tienen\s+gr[aá]fica/.test(normalized) && !code) {
    tool = 'aggregateInventory';
    const products = (await tools.getInventory({ available: true, limit: 10000 })).filter(item => item.grafica && !/no aplica|no especific|integrada sin/i.test(String(item.grafica)));
    const groups = new Map(); products.forEach(item => groups.set(item.grafica, (groups.get(item.grafica) || 0) + 1));
    data = [...groups.entries()].sort((a, b) => b[1] - a[1]).map(([grafica, cantidad]) => ({ grafica, cantidad }));
    answerText = data.length ? `Gráficas registradas en equipos disponibles:\n${data.slice(0, 15).map(item => `• ${item.grafica}: ${item.cantidad}`).join('\n')}` : 'No encontré gráficas registradas en los equipos. Prueba con "cuáles equipos tenemos" o "busca LENOVO".';
  } else if (/modelo[s]?.*(m[aá]s.*(registrad|manej)|m[aá]s\s+com[uú]n|manejamos|registrad)|qu[eé]\s+modelo[s]?\s+(tenemos|manejamos|hay)/.test(normalized)) {
    tool = 'getTopModels'; data = await tools.getTopModels(10);
    answerText = data.length ? `Los modelos más registrados son:\n${data.map((item, index) => `${index + 1}. ${item.marca ? `${item.marca} ` : ''}${item.modelo} · ${item.cantidad} registro${item.cantidad === 1 ? '' : 's'}`).join('\n')}` : 'No encontré modelos registrados.';
  } else if (/marca[s]?\s+(tenemos|manejamos|vendemos|m[aá]s)|qu[eé]\s+marca[s]?/.test(normalized)) {
    tool = 'getTopBrands'; data = await tools.getTopBrands(10);
    answerText = data.length ? `Las marcas principales son:\n${data.map((item, index) => `${index + 1}. ${item.marca} · ${item.cantidad} registro${item.cantidad === 1 ? '' : 's'}`).join('\n')}` : 'No encontré marcas registradas.';
  } else if (contextProducts.length && /estado|situaci[oó]n|c[oó]mo est[aá]/.test(normalized)) {
    tool = 'conversationContext'; data = [contextProducts[0]];
    const item = contextProducts[0];
    answerText = `${item.marca || ''} ${item.modelo || ''} (${item.sku || item.codigo || 'sin identificador'}): estado: ${item.estado || 'no registrado en EquipMaster'}.`;
  } else if (/qu[eé]\s+estados|estados\s+(?:maneja|tiene|hay)|cu[aá]ntos\s+en\s+cada\s+estado/.test(normalized)) {
    tool = 'getStateSummary'; data = await tools.getStateSummary();
    answerText = data.length ? `Estados actuales:\n${data.map(item => `• ${item.estado}: ${item.cantidad}`).join('\n')}` : 'No hay estados registrados.';
  } else if (requestedState && (/cu[aá]nt|qu[eé]\s+(?:equipos|productos)|quienes|qui[eé]nes/.test(normalized))) {
    tool = 'getProductsByState'; data = await tools.getProductsByState(requestedState);
    answerText = `Encontré ${data.length} registro${data.length === 1 ? '' : 's'} en estado ${requestedState.toUpperCase()}.`;
  } else if (contextProducts.length && /m[aá]s\s+(barat|econ[oó]mic)|menor precio/.test(normalized)) {
    tool = 'conversationContext'; data = contextProducts.slice().sort((a, b) => price(a) - price(b)).slice(0, 1);
    answerText = `La opción más barata es ${data[0].marca || ''} ${data[0].modelo || ''} (${data[0].sku || data[0].codigo || 'sin SKU'}), con precio ${data[0].precio || 'no registrado'}.`;
  } else if (contextProducts.length && /m[aá]s\s+car|mayor precio/.test(normalized)) {
    tool = 'conversationContext'; data = contextProducts.slice().sort((a, b) => price(b) - price(a)).slice(0, 1);
    answerText = `La opción más cara es ${data[0].marca || ''} ${data[0].modelo || ''} (${data[0].sku || data[0].codigo || 'sin SKU'}), con precio ${data[0].precio || 'no registrado'}.`;
  } else if (contextProducts.length && /m[aá]s\s+ram|mayor ram|m[aá]s memoria/.test(normalized)) {
    tool = 'conversationContext'; data = contextProducts.slice().sort((a, b) => ram(b) - ram(a)).slice(0, 1);
    answerText = `La opción con más RAM es ${data[0].marca || ''} ${data[0].modelo || ''} (${data[0].sku || data[0].codigo || 'sin SKU'}), con ${data[0].ram || 'RAM no registrada'}.`;
  } else if (technicalField && code) {
    tool = 'getProductBySku';
    const exact = await tools.getProductExact(code);
    data = exact ? [exact] : [];
    const field = technicalField[0] === 'gráfica' ? 'grafica' : technicalField[0] === 'sistema operativo' ? 'sistemaOperativo' : technicalField[0];
    const value = data[0]?.[field];
    answerText = data.length ? `${code}: ${technicalField[0]}: ${value || 'no registrada en EquipMaster'}.` : `No encontré productos con el código o SKU ${code}.`;
  } else if (/configuraci[oó]n|especificaciones|caracter[ií]sticas/.test(normalized)) {
    const stopWords = new Set(['cuál', 'cual', 'qué', 'que', 'configuración', 'configuracion', 'especificaciones', 'características', 'caracteristicas', 'tiene', 'tienen', 'del', 'de', 'la', 'el', 'los', 'las', 'producto', 'productos', 'equipo', 'equipos', 'todos', 'todo', 'inventario', 'actuales', 'disponibles', 'dime', 'muestra', 'muestrame', 'cuentame', 'del', 'de']);
    const query = text.replace(/[¿?!.,]/g, ' ').split(/\s+/).filter(token => !stopWords.has(token.toLowerCase())).join(' ').trim();
    const includeAll = /todos|todo el inventario|todos los equipos/.test(normalized);
    tool = 'getInventory'; data = await tools.getInventory({ query, available: includeAll ? undefined : true, limit: 10000 });
    if (data.length) {
      const p = publicProduct(data[0]);
      answerText = `Encontré ${data.length} equipo${data.length === 1 ? '' : 's'}${query ? ` con “${query.toUpperCase()}”` : ' en el inventario'}. Configuración de ${p.marca || ''} ${p.modelo || ''}:\n• Procesador: ${p.procesador || 'no registrado'}\n• RAM: ${p.ram || 'no registrada'}\n• Almacenamiento: ${p.almacenamiento || 'no registrado'}\n• Gráfica: ${p.grafica || 'no registrada'}\n• Sistema operativo: ${p.sistemaOperativo || 'no registrado'}\n• Pantalla: ${p.pantalla || 'no registrada'}${data.length > 1 ? `\n(Otras ${data.length - 1} unidad${data.length - 1 === 1 ? '' : 'es'} del mismo modelo pueden variar.)` : ''}`;
    } else {
      answerText = `No encontré equipos con esa configuración. Prueba con “busca X13” o “qué modelos tenemos”.`;
    }
  } else if (/^(hola|buenas?|buenos d[ií]as|buenas tardes|buenas noches|hey|qui[eé]n eres)[.!?\s]*$/i.test(normalized)) {
    answerText = 'Soy JVBOT, el asistente de EquipMaster. Puedo consultar tu inventario, analizar stock, buscar equipos y ayudarte a tomar decisiones con datos actuales.';
    data = null;
    tool = null;
  } else if (/^(gracias|muchas gracias|perfecto|entendido)[.!?\s]*$/i.test(normalized)) {
    answerText = 'Con gusto. Mantengo el contexto de esta conversación para la siguiente consulta.';
    data = null;
    tool = null;
  } else if (/equipos?.*(stock|stok)|en\s+stock|disponibles?/.test(normalized) && !/poco|bajo|agotad|sin/.test(normalized)) {
    if (/laptop|port[aá]til/.test(normalized)) {
      tool = 'getInventory'; data = await tools.getInventory({ category: 'laptop', available: true, limit: 10000 });
      answerText = `Tienes ${data.length} laptops disponibles.`;
    } else {
      tool = 'getInventorySummary'; data = await tools.getInventorySummary();
      answerText = `Tienes ${data.disponibles} equipos disponibles de ${data.total} registrados.`;
    }
  } else if (/laptop|port[aá]til/.test(normalized) && /tenemos|hay|actual|qu[eé]|cu[aá]les/.test(normalized)) {
    tool = 'getInventory'; data = await tools.getInventory({ category: 'laptop', available: true, limit: 10000 });
    answerText = data.length ? `Encontré ${data.length} laptops disponibles:\n${list(data)}` : 'No encontré laptops disponibles en el inventario.';
  } else if (asksCount && /estado\s+(ok|bueno)|disponible/.test(normalized)) {
    tool = 'searchProducts';
    data = (await tools.searchProducts('', 10000)).filter(item => String(item.estado || '').toUpperCase().includes('OK') && !String(item.estado || '').toUpperCase().includes('VENDIDO'));
    answerText = `Hay ${data.length} productos en estado OK.`;
  } else if (asksCount && code) {
    tool = 'getProductBySku';
    const exact = await tools.getProductExact(code);
    data = exact ? [exact] : [];
    const stockQuestion = /stock|stok|existencia|existencias/.test(normalized);
    const stock = data.length === 1 && data[0].stock !== undefined ? data[0].stock : null;
    answerText = data.length
      ? stockQuestion && stock !== null
        ? `Hay ${stock} unidad${Number(stock) === 1 ? '' : 'es'} de ${code} en stock.`
        : `${code} corresponde a ${data.length} producto${data.length === 1 ? '' : 's'} registrado${data.length === 1 ? '' : 's'} en EquipMaster.`
      : `No encontré productos con el código o SKU ${code}.`;
  } else if (asksCount && /laptop|equipo|producto/.test(normalized)) {
    tool = 'searchProducts';
    data = normalized.includes('laptop')
      ? await tools.getInventory({ category: 'laptop', available: !/vendid|salida/.test(normalized), limit: 10000 })
      : await tools.searchProducts('', 10000);
    answerText = `Hay ${data.length} producto${data.length === 1 ? '' : 's'} que coinciden con esa consulta.`;
  } else if (/analiza|resumen|valor.*inventario|cu[aá]nto.*inventario/.test(normalized)) {
    tool = 'getInventorySummary'; data = await tools.getInventorySummary();
    answerText = `Inventario actual:\n• ${data.total} productos registrados.\n• ${data.disponibles} disponibles.\n• ${data.lowStock} con stock bajo.\n• Valor estimado disponible: ${money(data.value)}.`;
  } else if (/\bventas?\b|vendimos|vendid/.test(normalized)) {
    tool = 'getSalesSummary'; data = await tools.getSalesSummary(/este mes|mensual/.test(normalized) ? 'month' : /este año|anual/.test(normalized) ? 'year' : 'all');
    answerText = `Ventas encontradas: ${data.totalVentas}. Importe registrado: ${money(data.importe)}.`;
  } else if (/agotad|sin stock/.test(normalized)) {
    tool = 'getProductsByStock'; data = await tools.getProductsByStock('out');
    answerText = data.length ? `Encontré ${data.length} productos agotados:\n${list(data)}` : 'No encontré productos agotados.';
  } else if (/poco stock|stock bajo|bajo stock/.test(normalized)) {
    tool = 'getProductsByStock'; data = await tools.getProductsByStock('low');
    answerText = data.length ? `Encontré ${data.length} productos con stock bajo:\n${list(data)}` : 'No encontré productos con stock bajo.';
  } else if (/antigü|antigu|estancad|m[aá]s tiempo|viejo/.test(normalized)) {
    tool = 'getOldestProducts'; data = await tools.getOldestProducts();
    answerText = data.length ? `Productos con mayor antigüedad:\n${list(data)}` : 'No hay fechas de registro válidas para calcular antigüedad.';
  } else if (/sku/.test(normalized)) {
    const sku = text.match(/sku\s+([\w-]+)/i)?.[1] || text.split(/\s+/).pop();
    tool = 'getProductBySku'; data = await tools.getProductBySku(sku);
    const p = publicProduct(data);
    answerText = p ? `Encontré ${p.marca || ''} ${p.modelo || ''} (${p.sku || p.codigo}).\nProcesador: ${p.procesador || 'no registrado'} · RAM: ${p.ram || 'no registrada'} · Almacenamiento: ${p.almacenamiento || 'no registrado'}\nEstado: ${p.estado || 'no registrado'} · Precio: ${p.precio || 'no registrado'} · Stock: ${p.stock ?? 'no registrado'}.` : `No encontré un producto con el SKU ${sku}.`;
  } else {
    data = await tools.searchProducts(text.replace(/busca|buscar|qué|que|tengo|productos|producto/gi, '').trim());
    answerText = data.length ? `Encontré ${data.length} coincidencias:\n${list(data)}` : 'No encontré productos que coincidan con esa búsqueda.';
  }

  return { answer: answerText, tool, data: safeData(data) };
}
