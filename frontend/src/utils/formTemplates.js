export const FIELD_GROUPS = {
  identificacion: ['codigo', 'categoria', 'marca', 'modelo', 'serie', 'sku', 'anio'],
  hardware_core: ['procesador', 'generacion', 'ram', 'tipoRam', 'almacenamiento', 'tipoDisco'],
  grafica: ['grafica'],
  pantalla_hw: ['resolucion'],
  conectividad_full: ['pantallaTactil', 'wifi', 'bluetooth', 'retroiluminacion', 'lectorHuellas', 'camaraIR'],
  conectividad_basica: ['wifi', 'bluetooth'],
  conectividad_plus: ['wifi', 'bluetooth', 'retroiluminacion', 'lectorHuellas', 'camaraIR'],
  estado_core: ['tecnico', 'estado', 'observaciones'],
  bateria_cargador: ['bateria', 'cargador'],
  bateria_solo: ['bateria'],
  ficha_info: ['sistemaOperativo', 'color', 'pantalla', 'modeloComercial', 'fechaRevision'],
  condicion_laptop: ['exterior', 'pantalla', 'carcasaInferior', 'teclado', 'touchpad', 'bisagras', 'puertos', 'camara', 'bocinas', 'microfono'],
  condicion_mini: ['exterior', 'carcasaInferior', 'puertos'],
  condicion_desktop: ['exterior', 'carcasaInferior', 'puertos', 'ventiladores'],
  condicion_aio: ['exterior', 'pantalla', 'carcasaInferior', 'puertos'],
  condicion_tablet: ['exterior', 'pantalla', 'carcasaInferior', 'touchpad', 'camara', 'bocinas', 'microfono'],
  condicion_monitor: ['exterior', 'pantalla', 'puertos', 'base'],
  condicion_accesorio: ['exterior', 'puertos'],
  condicion_generic: ['exterior', 'puertos'],
  bateria_detalle: ['porcentaje', 'ciclos', 'condicion'],
  checklist_laptop: ['Pantalla', 'Teclado', 'Touchpad', 'WiFi', 'Bluetooth', 'Audio', 'Puertos USB', 'Camara', 'Bateria', 'Cargador', 'Microfono', 'Lector Huella'],
  checklist_mini: ['WiFi', 'Bluetooth', 'Audio', 'Puertos USB'],
  checklist_desktop: ['Pantalla', 'Teclado', 'WiFi', 'Bluetooth', 'Audio', 'Puertos USB'],
  checklist_aio: ['Pantalla', 'Teclado', 'Touchpad', 'WiFi', 'Bluetooth', 'Audio', 'Puertos USB', 'Camara', 'Bateria', 'Cargador', 'Microfono', 'Lector Huella'],
  checklist_tablet: ['Pantalla', 'Touchpad', 'WiFi', 'Bluetooth', 'Audio', 'Camara', 'Bateria', 'Cargador', 'Microfono'],
  checklist_monitor: ['Pantalla', 'Puertos USB'],
  checklist_accesorio: [],
  checklist_generic: ['WiFi', 'Bluetooth', 'Audio', 'Puertos USB'],
};

export const CHECKLIST_ICONS = {
  'Pantalla': { icon: 'fa-desktop', color: 'text-blue-500' },
  'Teclado': { icon: 'fa-keyboard', color: 'text-slate-500' },
  'Touchpad': { icon: 'fa-hand-pointer', color: 'text-purple-500' },
  'WiFi': { icon: 'fa-wifi', color: 'text-emerald-500' },
  'Bluetooth': { icon: 'fa-bluetooth-b', color: 'text-blue-400' },
  'Audio': { icon: 'fa-volume-high', color: 'text-amber-500' },
  'Puertos USB': { icon: 'fa-plug', color: 'text-slate-500' },
  'Camara': { icon: 'fa-camera', color: 'text-pink-500' },
  'Bateria': { icon: 'fa-battery-three-quarters', color: 'text-green-500' },
  'Cargador': { icon: 'fa-plug-circle-bolt', color: 'text-orange-500' },
  'Microfono': { icon: 'fa-microphone', color: 'text-indigo-500' },
  'Lector Huella': { icon: 'fa-fingerprint', color: 'text-teal-500' },
};

export const FORM_TEMPLATES = {
  'LAPTOP': {
    label: 'Laptop',
    prefix: 'LAP',
    icon: 'fa-laptop',
    description: 'Computadora portátil',
    stepLabels: ['Identificación', 'Hardware', 'Estado y Técnico', 'Ficha Técnica'],
    stepIcons: ['fa-id-card', 'fa-microchip', 'fa-clipboard-check', 'fa-file-lines'],
    step2: [...FIELD_GROUPS.hardware_core, ...FIELD_GROUPS.grafica, ...FIELD_GROUPS.pantalla_hw, ...FIELD_GROUPS.conectividad_full],
    step3: [...FIELD_GROUPS.estado_core, ...FIELD_GROUPS.bateria_cargador],
    ficha: { condicion: FIELD_GROUPS.condicion_laptop, bateria: FIELD_GROUPS.bateria_detalle, checklist: FIELD_GROUPS.checklist_laptop },
  },
  'MINI PC': {
    label: 'Mini PC',
    prefix: 'MIN',
    icon: 'fa-server',
    description: 'Computadora de escritorio compacta',
    stepLabels: ['Identificación', 'Hardware', 'Estado y Técnico', 'Ficha Técnica'],
    stepIcons: ['fa-id-card', 'fa-microchip', 'fa-clipboard-check', 'fa-file-lines'],
    step2: [...FIELD_GROUPS.hardware_core, ...FIELD_GROUPS.grafica, ...FIELD_GROUPS.conectividad_basica],
    step3: [...FIELD_GROUPS.estado_core],
    ficha: { condicion: FIELD_GROUPS.condicion_mini, bateria: [], checklist: FIELD_GROUPS.checklist_mini },
  },
  'DESKTOP': {
    label: 'Desktop / Torre',
    prefix: 'DES',
    icon: 'fa-desktop',
    description: 'Computadora de escritorio',
    stepLabels: ['Identificación', 'Hardware', 'Estado y Técnico', 'Ficha Técnica'],
    stepIcons: ['fa-id-card', 'fa-microchip', 'fa-clipboard-check', 'fa-file-lines'],
    step2: [...FIELD_GROUPS.hardware_core, ...FIELD_GROUPS.grafica, ...FIELD_GROUPS.conectividad_basica],
    step3: [...FIELD_GROUPS.estado_core],
    ficha: { condicion: FIELD_GROUPS.condicion_desktop, bateria: [], checklist: FIELD_GROUPS.checklist_desktop },
  },
  'ALL-IN-ONE': {
    label: 'All-in-One',
    prefix: 'AIO',
    icon: 'fa-tv',
    description: 'Computadora todo en uno',
    stepLabels: ['Identificación', 'Hardware', 'Estado y Técnico', 'Ficha Técnica'],
    stepIcons: ['fa-id-card', 'fa-microchip', 'fa-clipboard-check', 'fa-file-lines'],
    step2: [...FIELD_GROUPS.hardware_core, ...FIELD_GROUPS.grafica, ...FIELD_GROUPS.pantalla_hw, ...FIELD_GROUPS.conectividad_full],
    step3: [...FIELD_GROUPS.estado_core],
    ficha: { condicion: FIELD_GROUPS.condicion_aio, bateria: [], checklist: FIELD_GROUPS.checklist_aio },
  },
  'WORKSTATION': {
    label: 'Workstation',
    prefix: 'WRK',
    icon: 'fa-microchip',
    description: 'Estación de trabajo profesional',
    stepLabels: ['Identificación', 'Hardware', 'Estado y Técnico', 'Ficha Técnica'],
    stepIcons: ['fa-id-card', 'fa-microchip', 'fa-clipboard-check', 'fa-file-lines'],
    step2: [...FIELD_GROUPS.hardware_core, ...FIELD_GROUPS.grafica, ...FIELD_GROUPS.conectividad_basica],
    step3: [...FIELD_GROUPS.estado_core, ...FIELD_GROUPS.bateria_cargador],
    ficha: { condicion: FIELD_GROUPS.condicion_desktop, bateria: [], checklist: FIELD_GROUPS.checklist_desktop },
  },
  'TABLET': {
    label: 'Tablet',
    prefix: 'TAB',
    icon: 'fa-tablet-alt',
    description: 'Tableta digital',
    stepLabels: ['Identificación', 'Hardware', 'Estado y Técnico', 'Ficha Técnica'],
    stepIcons: ['fa-id-card', 'fa-microchip', 'fa-clipboard-check', 'fa-file-lines'],
    step2: [...FIELD_GROUPS.hardware_core, ...FIELD_GROUPS.pantalla_hw, ...FIELD_GROUPS.conectividad_basica],
    step3: [...FIELD_GROUPS.estado_core, ...FIELD_GROUPS.bateria_solo],
    ficha: { condicion: FIELD_GROUPS.condicion_tablet, bateria: FIELD_GROUPS.bateria_detalle, checklist: FIELD_GROUPS.checklist_tablet },
  },
  'MONITOR': {
    label: 'Monitor',
    prefix: 'MON',
    icon: 'fa-desktop',
    description: 'Monitor o pantalla externa',
    stepLabels: ['Identificación', 'Hardware', 'Estado y Técnico', 'Ficha Técnica'],
    stepIcons: ['fa-id-card', 'fa-microchip', 'fa-clipboard-check', 'fa-file-lines'],
    step2: ['resolucion', 'wifi', 'bluetooth'],
    step3: [...FIELD_GROUPS.estado_core],
    ficha: { condicion: FIELD_GROUPS.condicion_monitor, bateria: [], checklist: FIELD_GROUPS.checklist_monitor },
  },
  'ACCESORIO': {
    label: 'Accesorio',
    prefix: 'ACC',
    icon: 'fa-plug',
    description: 'Mouse, teclado, cargador, etc.',
    stepLabels: ['Identificación', 'Hardware', 'Estado y Técnico', 'Ficha Técnica'],
    stepIcons: ['fa-id-card', 'fa-microchip', 'fa-clipboard-check', 'fa-file-lines'],
    step2: [...FIELD_GROUPS.conectividad_basica],
    step3: [...FIELD_GROUPS.estado_core],
    ficha: { condicion: FIELD_GROUPS.condicion_accesorio, bateria: [], checklist: FIELD_GROUPS.checklist_accesorio },
  },
  'OTRO': {
    label: 'Otro',
    prefix: 'OTR',
    icon: 'fa-question-circle',
    description: 'Otro tipo de equipo',
    stepLabels: ['Identificación', 'Hardware', 'Estado y Técnico', 'Ficha Técnica'],
    stepIcons: ['fa-id-card', 'fa-microchip', 'fa-clipboard-check', 'fa-file-lines'],
    step2: [...FIELD_GROUPS.hardware_core, ...FIELD_GROUPS.grafica, ...FIELD_GROUPS.pantalla_hw, ...FIELD_GROUPS.conectividad_full],
    step3: [...FIELD_GROUPS.estado_core, ...FIELD_GROUPS.bateria_cargador],
    ficha: { condicion: FIELD_GROUPS.condicion_generic, bateria: FIELD_GROUPS.bateria_detalle, checklist: FIELD_GROUPS.checklist_generic },
  },
};

export function getTemplate(categoria) {
  return FORM_TEMPLATES[categoria] || FORM_TEMPLATES['OTRO'];
}

export function isFieldVisible(categoria, fieldKey) {
  const tmpl = getTemplate(categoria);
  if (FIELD_GROUPS.identificacion.includes(fieldKey)) return true;
  if (FIELD_GROUPS.ficha_info.includes(fieldKey)) return true;
  if (tmpl.step2.includes(fieldKey)) return true;
  if (tmpl.step3.includes(fieldKey)) return true;
  if (tmpl.ficha.condicion.includes(fieldKey)) return true;
  if (tmpl.ficha.bateria.includes(fieldKey)) return true;
  if (tmpl.ficha.checklist.includes(fieldKey)) return true;
  return false;
}
