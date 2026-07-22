export const ESTADOS = [
  { value: '🔵 OK', label: '🔵 OK (Stock local / Venta directa)' },
  { value: '🟢 FULL', label: '🟢 FULL (Enviado a Mercado Libre)' },
  { value: '🟡 Detalles', label: '🟡 Detalles (Fallas menores)' },
  { value: '🟠 Revisión', label: '🟠 En Revisión / Triage' },
  { value: '🔴 TKF', label: '🔴 TKF (Sin Reparación / No funciona)' },
];

export const CATEGORIAS = ['LAPTOP', 'MINI PC', 'ALL-IN-ONE', 'DESKTOP', 'TABLET', 'OTRO'];
export const RAM_OPTIONS = ['N/A', '4 GB', '8 GB', '16 GB', '32 GB', '64 GB', '128 GB'];
export const STORAGE_OPTIONS = ['N/A', '128 GB', '256 GB', '512 GB', '1 TB', '2 TB', '4 TB'];
export const TECNICOS = ['JAHIR HERNANDEZ', 'JOSE LUIS', 'VALERIA BARRUETA'];
export const METODOS_PAGO = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA DE CRÉDITO', 'TARJETA DE DÉBITO', 'MIXTO'];
export const GENERACION_OPTIONS = ['5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th', '13th', '14th', '15th', 'M1', 'M2', 'M3', 'M4', 'SERIE 1000', 'SERIE 2000', 'SERIE 3000', 'SERIE 4000', 'SERIE 5000', 'SERIE 6000', 'SERIE 7000', 'SERIE 8000', 'SERIE 9000', 'SNAPDRAGON', 'NO APLICA'];
export const TIPO_RAM_OPTIONS = ['DDR3', 'DDR4', 'DDR5', 'LPDDR3', 'LPDDR4', 'LPDDR4X', 'LPDDR5', 'LPDDR5X', 'NO APLICA'];
export const RESOLUCION_OPTIONS = ['HD', 'HD+', 'FHD', 'FHD+', 'QHD', 'QHD+', '4K', 'NO APLICA'];
export const ANIO_OPTIONS = ['NO APLICA', ...Array.from({ length: 20 }, (_, i) => String(2010 + i)).reverse()];

export function esEstadoML(estado) {
  return estado?.includes('🟢');
}

export function generarCodigoSiguiente(inventario) {
  let maxNum = 1000;
  inventario.forEach(item => {
    if (item.codigo?.startsWith('INV-')) {
      const num = parseInt(item.codigo.replace('INV-', ''), 10);
      if (num > maxNum) maxNum = num;
    }
  });
  return `INV-${maxNum + 1}`;
}

export function normalizarSerie(serie) {
  return (serie || '').toUpperCase().trim().replace(/\s+/g, '');
}

export function badgeEstado(estado) {
  if (estado?.includes('🟢')) return 'bg-emerald-100 text-emerald-800';
  if (estado?.includes('🔵')) return 'bg-blue-100 text-blue-800';
  if (estado?.includes('🟡')) return 'bg-amber-100 text-amber-800';
  if (estado?.includes('🟠')) return 'bg-orange-100 text-orange-800';
  if (estado?.includes('🔴 VENDIDO')) return 'bg-rose-100 text-rose-800';
  if (estado?.includes('🔴 TKF')) return 'bg-red-600 text-white';
  return 'bg-slate-100 text-slate-700';
}

export const COLORES_ESTADO = {
  '🟢 FULL (ML)': '#10b981',
  '🔵 OK': '#0018B0',
  '🟡 Detalles': '#FF9100',
  '🟠 Revisión': '#f97316',
  '🔴 TKF': '#ef4444',
};

export const ESTADOS_STOCK = ['🟢 FULL (ML)', '🔵 OK', '🟡 Detalles', '🟠 Revisión', '🔴 TKF'];

export const SKU_TABLE = [
  { modelo: 'ALIENWARE 15 R4', procesador: 'INTEL I7-8750H', ram: '16 GB', almacenamiento: '1 TB', sku: 'LAP00001' },
  { modelo: 'APPLE MAC MINI LATE 2014', procesador: 'INTEL I5 4GB', ram: '', almacenamiento: '500 GB', sku: 'LAP00002' },
  { modelo: 'APPLE MAC MINI LATE 2014', procesador: 'INTEL I5 8GB', ram: '', almacenamiento: '1 TB', sku: 'LAP00003' },
  { modelo: 'ASUS EXPERTBOOK P2451F', procesador: 'INTEL I5-10210U', ram: '8 GB', almacenamiento: '512 GB', sku: 'LAP00004' },
  { modelo: 'ASUS ROG ZEPHYRUS', procesador: 'M15', ram: '16 GB', almacenamiento: '', sku: 'LAP00005' },
  { modelo: 'ASUS VIVOBOOK S 14 OLED', procesador: 'INTEL I5-12500H', ram: '16 GB', almacenamiento: '', sku: 'LAP00006' },
  { modelo: 'DELL GAMER G3 3590', procesador: 'I7-9750H', ram: '16 GB', almacenamiento: '', sku: 'LAP00007' },
  { modelo: 'DELL INSPIRON 15 3511', procesador: 'INTEL I7-1165G7', ram: '16 GB', almacenamiento: '', sku: 'LAP00008' },
  { modelo: 'DELL INSPIRON GAMER 7559', procesador: 'I5-6300HQ', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00010' },
  { modelo: 'DELL LATITUDE 5430', procesador: 'INTEL I5-1245U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00013' },
  { modelo: 'DELL LATITUDE 7410', procesador: 'INTEL I5-10310U', ram: '8 GB', almacenamiento: '512 GB', sku: 'LAP00014' },
  { modelo: 'DELL LATITUDE 7420', procesador: 'INTEL I5-1135G7', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00015' },
  { modelo: 'DELL LATITUDE 9510', procesador: 'INTEL I7-10710U', ram: '16 GB', almacenamiento: '256 GB', sku: 'LAP00016' },
  { modelo: 'DELL PRECISION 3541', procesador: 'INTEL I7-9850H', ram: '16 GB', almacenamiento: '', sku: 'LAP00017' },
  { modelo: 'DELL PRECISION 3560', procesador: 'INTEL I7-1165G7', ram: '16 GB', almacenamiento: '', sku: 'LAP00018' },
  { modelo: 'DELL PRECISION 5560', procesador: 'INTEL I7-11850H', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00019' },
  { modelo: 'DELL PRECISION 5560', procesador: 'INTEL I7-11850H', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00020' },
  { modelo: 'DELL PRECISION 5570', procesador: 'CORE I7-12800H', ram: '32 GB', almacenamiento: '', sku: 'LAP00021' },
  { modelo: 'DELL PRECISION 7550', procesador: 'INTEL I7-10857H', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00022' },
  { modelo: 'DELL PRECISION 7560', procesador: 'INTEL I9-11950H', ram: '64 GB', almacenamiento: '1 TB', sku: 'LAP00023' },
  { modelo: 'DELL XPS 15 7590', procesador: 'INTEL I9-9980HK', ram: '32 GB', almacenamiento: '', sku: 'LAP00025' },
  { modelo: 'HP ELITEBOOK 840 G5', procesador: 'INTEL I7-7600U', ram: '16 GB', almacenamiento: '', sku: 'LAP00029' },
  { modelo: 'HP ELITEBOOK 840 G7', procesador: 'INTEL I7-10610U', ram: '16 GB', almacenamiento: '', sku: 'LAP00030' },
  { modelo: 'HP ELITEBOOK X360 G8', procesador: 'INTEL I7-1185G7', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00031' },
  { modelo: 'HP PAVILION AERO 13', procesador: 'RYZEN 5-5600U', ram: '8 GB', almacenamiento: '512 GB', sku: 'LAP00033' },
  { modelo: 'HP PROBOOK 650 G1', procesador: 'INTEL I7-4700MQ', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00034' },
  { modelo: 'HP SPECTRE PRO X360', procesador: 'INTEL I5-6300U', ram: '8 GB', almacenamiento: '512 GB', sku: 'LAP00035' },
  { modelo: 'HP SPECTRE X360', procesador: 'INTEL I7-10510U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00036' },
  { modelo: 'HP ZBOOK 15 G6', procesador: 'INTEL I5-9300H', ram: '32 GB', almacenamiento: '', sku: 'LAP00037' },
  { modelo: 'HP ZBOOK FIREFLY 14 G8', procesador: 'INTEL I5-1135G7', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00039' },
  { modelo: 'HP ZBOOK STUDIO G5', procesador: 'INTEL I7-9750H', ram: '32 GB', almacenamiento: '', sku: 'LAP00040' },
  { modelo: 'LENOVO THINKPAD A485', procesador: 'RYZEN 7-2700U', ram: '16 GB', almacenamiento: '', sku: 'LAP00041' },
  { modelo: 'LENOVO THINKPAD E14 GEN 3', procesador: 'RYZEN 5-5500U', ram: '16 GB', almacenamiento: '', sku: 'LAP00042' },
  { modelo: 'LENOVO THINKPAD L13', procesador: 'INTEL I5-10210U', ram: '8 GB', almacenamiento: '', sku: 'LAP00043' },
  { modelo: 'LENOVO THINKPAD L14', procesador: 'INTEL I5-10210U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00044' },
  { modelo: 'LENOVO THINKPAD L14', procesador: 'INTEL I5-10310U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00045' },
  { modelo: 'LENOVO THINKPAD L14', procesador: 'RYZEN 5-4500U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00046' },
  { modelo: 'LENOVO THINKPAD L15 GEN 3', procesador: 'INTEL I7-1265U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00047' },
  { modelo: 'LENOVO THINKPAD L460', procesador: 'INTEL I5-6200U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00048' },
  { modelo: 'LENOVO THINKPAD L460', procesador: 'INTEL I5-6200U', ram: '8 GB', almacenamiento: '256 GB', sku: 'LAP00049' },
  { modelo: 'LENOVO THINKPAD L470', procesador: 'INTEL I5-7200U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00050' },
  { modelo: 'LENOVO THINKPAD L480', procesador: 'INTEL I5-8250U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00051' },
  { modelo: 'LENOVO THINKPAD L490', procesador: 'INTEL I5-8265U', ram: '16 GB', almacenamiento: '', sku: 'LAP00052' },
  { modelo: 'LENOVO THINKPAD P14S TOUCH', procesador: 'INTEL I7-10610U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00053' },
  { modelo: 'LENOVO THINKPAD T14 GEN 1', procesador: 'INTEL I5-10610U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00054' },
  { modelo: 'LENOVO THINKPAD T14 GEN 2', procesador: 'INTEL I5-10610U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00055' },
  { modelo: 'LENOVO THINKPAD T14 GEN 3', procesador: 'INTEL I5-1245U', ram: '32 GB', almacenamiento: '', sku: 'LAP00056' },
  { modelo: 'LENOVO THINKPAD T14', procesador: 'RYZEN 5-4650U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00057' },
  { modelo: 'LENOVO THINKPAD T450', procesador: 'INTEL I5-5300U', ram: '8 GB', almacenamiento: '256 GB', sku: 'LAP00058' },
  { modelo: 'LENOVO THINKPAD T470S TOUCH', procesador: 'INTEL I7-7600U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00059' },
  { modelo: 'LENOVO THINKPAD T490', procesador: 'INTEL I5-8265U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00060' },
  { modelo: 'LENOVO THINKPAD T495S', procesador: 'RYZEN 7-3700U', ram: '16 GB', almacenamiento: '', sku: 'LAP00062' },
  { modelo: 'LENOVO THINKPAD X1 EXTREME', procesador: 'INTEL I7-9850H', ram: '32 GB', almacenamiento: '512 GB', sku: 'LAP00063' },
  { modelo: 'LENOVO THINKPAD X1 TAB GEN 2', procesador: 'CORE I7-7Y75', ram: '16 GB', almacenamiento: '', sku: 'LAP00064' },
  { modelo: 'LENOVO THINKPAD X1 TAB GEN 3', procesador: 'CORE I7-8650U', ram: '16 GB', almacenamiento: '', sku: 'LAP00065' },
  { modelo: 'LENOVO THINKPAD X13 GEN 2 TOUCH', procesador: 'INTEL I5-1165G7', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00066' },
  { modelo: 'LENOVO THINKPAD X390', procesador: 'INTEL I5-8265U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00068' },
  { modelo: 'LENOVO THINKPAD YOGA X1', procesador: 'INTEL I7-8665U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00069' },
  { modelo: 'LENOVO THINKPAD YOGA X13', procesador: 'INTEL I5-10310U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00070' },
  { modelo: 'LENOVO THINKPAD YOGA X13', procesador: 'INTEL I7-10510U', ram: '16 GB', almacenamiento: '', sku: 'LAP00071' },
  { modelo: 'LENOVO THINKPAD YOGA X370', procesador: 'INTEL I5-7200U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00072' },
  { modelo: 'LENOVO THINKPAD YOGA X380', procesador: 'INTEL I5-8350U', ram: '8 GB', almacenamiento: '512 GB', sku: 'LAP00073' },
  { modelo: 'LENOVO THINKPAD YOGA X390', procesador: 'INTEL I5-8365U', ram: '16 GB', almacenamiento: '', sku: 'LAP00074' },
  { modelo: 'LENOVO WORKSTATION 15P GEN 2', procesador: 'I7-11800H', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00075' },
  { modelo: 'LENOVO WORKSTATION P1', procesador: 'XEON W-10855M', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00076' },
  { modelo: 'LENOVO WORKSTATION P15 GEN 2', procesador: 'I7-11850H', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00077' },
  { modelo: 'LENOVO WORKSTATION P17', procesador: 'I7-10850H', ram: '32 GB', almacenamiento: '', sku: 'LAP00078' },
  { modelo: 'LENOVO WORKSTATION P51', procesador: 'INTEL I7-7820HQ', ram: '32 GB', almacenamiento: '', sku: 'LAP00079' },
  { modelo: 'LENOVO WORKSTATION P52', procesador: 'I7-8850H', ram: '32 GB', almacenamiento: '512 GB', sku: 'LAP00080' },
  { modelo: 'LENOVO WORKSTATION P53', procesador: 'I7-9850H', ram: '32 GB', almacenamiento: '512 GB', sku: 'LAP00081' },
  { modelo: 'LENOVO WORKSTATION T15P GEN 2', procesador: 'I7-11850H', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00082' },
  { modelo: 'LENOVO WORKSTATION T15P GEN 3', procesador: 'I7-12800H', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00083' },
  { modelo: 'MACBOOK 12 RETINA EARLY 2016', procesador: 'M3', ram: '8 GB', almacenamiento: '256 GB', sku: 'LAP00084' },
  { modelo: 'MACBOOK AIR 11 EARLY 2011', procesador: 'INTEL I7 4GB', ram: '', almacenamiento: '256 GB', sku: 'LAP00087' },
  { modelo: 'MACBOOK AIR 11 EARLY 2013', procesador: 'INTEL I5 8GB', ram: '128 GB', almacenamiento: '', sku: 'LAP00088' },
  { modelo: 'MACBOOK AIR 11 EARLY 2014', procesador: 'INTEL I5 4GB', ram: '', almacenamiento: '256 GB', sku: 'LAP00089' },
  { modelo: 'MACBOOK AIR 11 MID 2011', procesador: 'INTEL I5 2GB', ram: '128 GB', almacenamiento: '', sku: 'LAP00090' },
  { modelo: 'MACBOOK AIR 11 MID 2011', procesador: 'INTEL I5 4GB', ram: '128 GB', almacenamiento: '', sku: 'LAP00091' },
  { modelo: 'MACBOOK AIR 11 MID 2011', procesador: 'INTEL I5 4GB', ram: '60 GB', almacenamiento: '', sku: 'LAP00092' },
  { modelo: 'MACBOOK AIR 11 MID 2012', procesador: 'INTEL I5 4GB', ram: '128 GB', almacenamiento: '', sku: 'LAP00093' },
  { modelo: 'MACBOOK AIR 11 MID 2012', procesador: 'INTEL I7 8GB', ram: '', almacenamiento: '256 GB', sku: 'LAP00094' },
  { modelo: 'MACBOOK AIR 11 MID 2013', procesador: 'INTEL I5 8GB', ram: '', almacenamiento: '256 GB', sku: 'LAP00095' },
  { modelo: 'MACBOOK AIR 11 MID 2013', procesador: 'INTEL I7 8GB', ram: '', almacenamiento: '256 GB', sku: 'LAP00096' },
  { modelo: 'MACBOOK AIR 12 MID 2016', procesador: 'M3', ram: '8 GB', almacenamiento: '256 GB', sku: 'LAP00097' },
  { modelo: 'MACBOOK AIR 13 2017', procesador: 'INTEL I5 8GB', ram: '', almacenamiento: '256 GB', sku: 'LAP00099' },
  { modelo: 'MACBOOK AIR 13 2017', procesador: 'INTEL I7 8GB', ram: '', almacenamiento: '256 GB', sku: 'LAP00100' },
  { modelo: 'MACBOOK AIR 13 EARLY 2012', procesador: 'INTEL I5 4GB', ram: '128 GB', almacenamiento: '', sku: 'LAP00101' },
  { modelo: 'MACBOOK AIR 13 EARLY 2013', procesador: 'INTEL I5 8GB', ram: '', almacenamiento: '512 GB', sku: 'LAP00102' },
  { modelo: 'MACBOOK AIR 13 EARLY 2013', procesador: 'INTEL I7 8GB', ram: '', almacenamiento: '256 GB', sku: 'LAP00103' },
  { modelo: 'MACBOOK AIR 13 EARLY 2014', procesador: 'INTEL I5 4GB', ram: '128 GB', almacenamiento: '', sku: 'LAP00104' },
  { modelo: 'MACBOOK AIR 13 EARLY 2014', procesador: 'INTEL I5 8GB', ram: '', almacenamiento: '256 GB', sku: 'LAP00106' },
  { modelo: 'MACBOOK AIR 13 MID 2011', procesador: 'INTEL I7 4GB', ram: '128 GB', almacenamiento: '', sku: 'LAP00107' },
  { modelo: 'MACBOOK AIR 13 MID 2011', procesador: 'INTEL I7 4GB', ram: '', almacenamiento: '256 GB', sku: 'LAP00108' },
  { modelo: 'MACBOOK AIR 13 MID 2012', procesador: 'INTEL I5 4GB', ram: '', almacenamiento: '256 GB', sku: 'LAP00109' },
  { modelo: 'MACBOOK AIR 13 MID 2012', procesador: 'INTEL I5 8GB', ram: '', almacenamiento: '256 GB', sku: 'LAP00110' },
  { modelo: 'MACBOOK AIR 13 MID 2013', procesador: 'INTEL I5 4GB', ram: '', almacenamiento: '256 GB', sku: 'LAP00111' },
  { modelo: 'MACBOOK AIR 13 MID 2013', procesador: 'INTEL I5 8GB', ram: '', almacenamiento: '256 GB', sku: 'LAP00112' },
  { modelo: 'MACBOOK AIR 13 MID 2014', procesador: 'INTEL I5 8GB', ram: '', almacenamiento: '256 GB', sku: 'LAP00113' },
  { modelo: 'MACBOOK AIR 13 MID 2015', procesador: 'INTEL I5 8GB', ram: '128 GB', almacenamiento: '', sku: 'LAP00114' },
  { modelo: 'MACBOOK AIR 13 MID 2015', procesador: 'INTEL I5 8GB', ram: '', almacenamiento: '256 GB', sku: 'LAP00115' },
  { modelo: 'MACBOOK AIR 13 MID 2015', procesador: 'INTEL I7 8GB', ram: '128 GB', almacenamiento: '', sku: 'LAP00116' },
  { modelo: 'MACBOOK AIR 13 MID 2015', procesador: 'INTEL I7 8GB', ram: '', almacenamiento: '256 GB', sku: 'LAP00117' },
  { modelo: 'MACBOOK AIR 13 MID 2017', procesador: 'INTEL I5 8GB', ram: '', almacenamiento: '', sku: 'LAP00118' },
  { modelo: 'MACBOOK AIR 13 MID 2017', procesador: 'INTEL I7 8GB', ram: '', almacenamiento: '256 GB', sku: 'LAP00119' },
  { modelo: 'MACBOOK PRO 13 MID 2010', procesador: 'INTEL I5 8GB', ram: '', almacenamiento: '256 GB', sku: 'LAP00123' },
  { modelo: 'MACBOOK PRO 13 MID 2011', procesador: 'INTEL I5 10GB', ram: '', almacenamiento: '256 GB', sku: 'LAP00124' },
  { modelo: 'MACBOOK PRO 13 MID 2012', procesador: 'INTEL I5 10GB', ram: '', almacenamiento: '256 GB', sku: 'LAP00125' },
  { modelo: 'MACBOOK PRO 13 MID 2012', procesador: 'INTEL I5 4GB', ram: '', almacenamiento: '500 GB', sku: 'LAP00126' },
  { modelo: 'MACBOOK PRO 15 MID 2011', procesador: 'INTEL I7 8GB', ram: '', almacenamiento: '512 GB', sku: 'LAP00138' },
  { modelo: 'MACBOOK PRO 15 MID 2012', procesador: 'INTEL I7 8GB', ram: '', almacenamiento: '250 GB', sku: 'LAP00139' },
  { modelo: 'MACBOOK PRO 15 MID 2012', procesador: 'INTEL I7 8GB', ram: '', almacenamiento: '512 GB', sku: 'LAP00140' },
  { modelo: 'MACBOOK PRO RETINA 13 2016', procesador: 'INTEL I5 16GB', ram: '', almacenamiento: '512 GB', sku: 'LAP00145' },
  { modelo: 'MACBOOK PRO RETINA 13 2016', procesador: 'INTEL I5 8GB', ram: '', almacenamiento: '256 GB', sku: 'LAP00146' },
  { modelo: 'MACBOOK PRO RETINA 13 2017', procesador: 'INTEL I5 8GB', ram: '', almacenamiento: '256 GB', sku: 'LAP00147' },
  { modelo: 'MACBOOK PRO RETINA 13 2017', procesador: 'INTEL I5 8GB', ram: '', almacenamiento: '512 GB', sku: 'LAP00148' },
  { modelo: 'MACBOOK PRO RETINA 13 2018', procesador: 'INTEL I5 8GB', ram: '', almacenamiento: '512 GB', sku: 'LAP00149' },
  { modelo: 'MACBOOK PRO RETINA 13 2019', procesador: 'INTEL I5 8GB', ram: '', almacenamiento: '256 GB', sku: 'LAP00150' },
  { modelo: 'MACBOOK PRO RETINA 15 MID 2012', procesador: 'INTEL I7 8GB', ram: '', almacenamiento: '250 GB', sku: 'LAP00151' },
  { modelo: 'MACBOOK PRO RETINA 15 MID 2013', procesador: 'INTEL I7 16GB', ram: '', almacenamiento: '500 GB', sku: 'LAP00153' },
  { modelo: 'MACBOOK PRO RETINA 15 MID 2013', procesador: 'INTEL I7 8GB', ram: '', almacenamiento: '500 GB', sku: 'LAP00154' },
  { modelo: 'MACBOOK PRO RETINA 15 MID 2014', procesador: 'INTEL I7 16GB', ram: '', almacenamiento: '500 GB', sku: 'LAP00155' },
  { modelo: 'MACBOOK PRO RETINA 15 MID 2016', procesador: 'INTEL I7 16GB', ram: '', almacenamiento: '256 GB', sku: 'LAP00157' },
  { modelo: 'MACBOOK RETINA 13 TOUCH BAR 2016', procesador: 'INTEL I7 16GB', ram: '', almacenamiento: '1 TB', sku: 'LAP00158' },
  { modelo: 'MACBOOK RETINA 13 TOUCH BAR 2019', procesador: 'INTEL I5 8GB', ram: '', almacenamiento: '256 GB', sku: 'LAP00159' },
  { modelo: 'MACBOOK RETINA 15 TOUCH BAR 2016', procesador: 'INTEL I7 16GB', ram: '', almacenamiento: '', sku: 'LAP00160' },
  { modelo: 'MACBOOK RETINA 15 TOUCH BAR 2017', procesador: 'INTEL I7 16GB', ram: '', almacenamiento: '', sku: 'LAP00161' },
  { modelo: 'MACBOOK RETINA 15 TOUCH BAR 2018', procesador: 'CORE I7 32GB', ram: '', almacenamiento: '1 TB', sku: 'LAP00162' },
  { modelo: 'MACBOOK RETINA 15 TOUCH BAR 2018', procesador: 'CORE I9 16GB', ram: '', almacenamiento: '', sku: 'LAP00163' },
  { modelo: 'MACBOOK RETINA 15 TOUCH BAR 2018', procesador: 'CORE I9 32GB', ram: '', almacenamiento: '', sku: 'LAP00164' },
  { modelo: 'MACBOOK RETINA 15 TOUCH BAR 2019', procesador: 'CORE I7 32GB', ram: '', almacenamiento: '512 GB', sku: 'LAP00165' },
  { modelo: 'MACBOOK RETINA 15 TOUCH BAR 2019', procesador: 'INTEL I9 16GB', ram: '', almacenamiento: '512 GB', sku: 'LAP00166' },
  { modelo: 'MACBOOK RETINA 16 TOUCH BAR 2019', procesador: 'INTEL I7 16GB', ram: '', almacenamiento: '', sku: 'LAP00167' },
  { modelo: 'MACBOOK RETINA 16 TOUCH BAR 2019', procesador: 'INTEL I7 32GB', ram: '', almacenamiento: '', sku: 'LAP00168' },
  { modelo: 'MACBOOK RETINA 16 TOUCH BAR 2019', procesador: 'INTEL I9 16GB', ram: '', almacenamiento: '', sku: 'LAP00169' },
  { modelo: 'MACBOOK RETINA 16 TOUCH BAR 2019', procesador: 'INTEL I9 32GB', ram: '', almacenamiento: '1 TB', sku: 'LAP00170' },
  { modelo: 'MACBOOK RETINA 16 TOUCH BAR 2019', procesador: 'INTEL I9 64GB', ram: '', almacenamiento: '2 TB', sku: 'LAP00171' },
  { modelo: 'SURFACE GO', procesador: 'INTEL I5-10TH', ram: '4 GB', almacenamiento: '64 GB', sku: 'LAP00173' },
  { modelo: 'SURFACE LAPTOP STUDIO', procesador: 'INTEL I5-11300H', ram: '16 GB', almacenamiento: '256 GB', sku: 'LAP00174' },
  { modelo: 'SURFACE PRO 4', procesador: 'INTEL I5-6300U', ram: '4 GB', almacenamiento: '128 GB', sku: 'LAP00175' },
  { modelo: 'LENOVO THINKPAD E14', procesador: 'INTEL I5-1135G7', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00176' },
  { modelo: 'THINKPAD L14', procesador: 'INTEL I5-1135G7', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00177' },
  { modelo: 'THINKPAD L14', procesador: 'INTEL I5-1250P', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00178' },
  { modelo: 'LENOVO THINKPAD T14S', procesador: 'INTEL I5-1250P', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00179' },
  { modelo: 'LENOVO THINKPAD T14', procesador: 'INTEL I5-1145G7', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00180' },
  { modelo: 'LENOVO THINKPAD L15 GEN 3', procesador: 'INTEL I7-1255U', ram: '16 GB', almacenamiento: '1 TB', sku: 'LAP00181' },
  { modelo: 'LENOVO THINKPAD T14S', procesador: 'RYZEN 7-4750U', ram: '32 GB', almacenamiento: '', sku: 'LAP00182' },
  { modelo: 'LENOVO THINKPAD YOGA X1 GEN 4', procesador: 'INTEL I7-8665U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00183' },
  { modelo: 'HP ENVY X360 1030', procesador: 'INTEL I5-7200U', ram: '8 GB', almacenamiento: '512 GB', sku: 'LAP00184' },
  { modelo: 'MSI WS75 WORKSTATION', procesador: 'I7-10875H', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00185' },
  { modelo: 'LENOVO CARBON X1 8� GEN', procesador: 'INTEL I7-10510U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00186' },
  { modelo: 'DELL LATITUDE 7430', procesador: 'INTEL I5-1245U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00187' },
  { modelo: 'LENOVO THINKPAD T16 GEN 1', procesador: 'RYZEN 7-6850U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00188' },
  { modelo: 'LENOVO WORKSTATION P15V TOUCH', procesador: 'I7-10750H', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00189' },
  { modelo: 'HP ELITEBOOK 745 G5', procesador: 'RYZEN 7-2700U', ram: '16 GB', almacenamiento: '', sku: 'LAP00190' },
  { modelo: 'SAMSUNG GALAXY BOOK FLEX2 ALPHA', procesador: 'I7-1165G', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00191' },
  { modelo: 'MACBOOK AIR 13 EARLY 2015', procesador: 'INTEL I7 8GB', ram: '', almacenamiento: '256 GB', sku: 'LAP00192' },
  { modelo: 'MACBOOK AIR 13 MID 2013', procesador: 'INTEL I7 8GB', ram: '', almacenamiento: '256 GB', sku: 'LAP00193' },
  { modelo: 'MSI CROSSHAIR 15', procesador: 'INTEL I7-11800H', ram: '32 GB', almacenamiento: '512 GB', sku: 'LAP00194' },
  { modelo: 'DELL GAMER G3 3590', procesador: 'I7-9750H', ram: '20 GB', almacenamiento: '1 TB', sku: 'LAP00195' },
  { modelo: 'DELL PRECISION 7550', procesador: 'INTEL I9-10885H', ram: '64 GB', almacenamiento: '1 TB', sku: 'LAP00196' },
  { modelo: 'LENOVO THINKPAD P53 TOUCH', procesador: 'I9-9880H', ram: '64 GB', almacenamiento: '1 TB', sku: 'LAP00197' },
  { modelo: 'LENOVO THINKPAD P1 GEN 3', procesador: 'INTEL I7-10750H', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00198' },
  { modelo: 'LENOVO THINKPAD X1 EXTREME', procesador: 'I7-10850H', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00199' },
  { modelo: 'LENOVO THINKPAD P1 GEN 4', procesador: 'INTEL I7-11800H', ram: '32 GB', almacenamiento: '512 GB', sku: 'LAP00200' },
  { modelo: 'DELL INSPIRON 16 PLUS 7630', procesador: 'INTEL I7-13700H', ram: '16 GB', almacenamiento: '2 TB', sku: 'LAP00201' },
  { modelo: 'LENOVO THINKPAD E14', procesador: 'INTEL I7-1145G7', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00202' },
  { modelo: 'HP ELITEBOOK 840 G3', procesador: 'INTEL I7-6600U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00203' },
  { modelo: 'LENOVO THINKPAD T14 GEN 3', procesador: 'INTEL I7-1245U', ram: '16 GB', almacenamiento: '', sku: 'LAP00204' },
  { modelo: 'LENOVO THINKPAD T14 GEN 2 TOUCH', procesador: 'INTEL I7-11350U', ram: '16 GB', almacenamiento: '', sku: 'LAP00205' },
  { modelo: 'DELL LATITUDE 5440', procesador: 'INTEL I7-1370P', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00206' },
  { modelo: 'HP SPECTRE X360 TOUCH', procesador: 'INTEL I7-13700H', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00207' },
  { modelo: 'HP ELITEBOOK 640 G9', procesador: 'INTEL I7-1255U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00208' },
  { modelo: 'LENOVO WORKSTATION P16', procesador: 'I7-1285HX', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00209' },
  { modelo: 'LENOVO THINKPAD P16S TOUCH', procesador: 'I7-1260P', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00210' },
  { modelo: 'ALIENWARE', procesador: 'M15', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00211' },
  { modelo: 'LENOVO YOGA 7I TOUCH', procesador: 'INTEL I7-1260P', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00212' },
  { modelo: 'LENOVO THINKPAD X1 EXTREME', procesador: 'I7-8750H', ram: '32 GB', almacenamiento: '512 GB', sku: 'LAP00213' },
  { modelo: 'RAZER BLADE 15', procesador: 'INTEL I7-11800H', ram: '32 GB', almacenamiento: '512 GB', sku: 'LAP00214' },
  { modelo: 'LENOVO WORKSTATION P16S', procesador: 'INTEL I7-1260P', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00215' },
  { modelo: 'LENOVO THINKPAD YOGA L13', procesador: 'INTEL I5-1145G7', ram: '16 GB', almacenamiento: '', sku: 'LAP00216' },
  { modelo: 'DELL LATITUDE 5490 TOUCH', procesador: 'INTEL I5-7300U', ram: '16 GB', almacenamiento: '', sku: 'LAP00217' },
  { modelo: 'LENOVO THINKPAD P16 GEN 2', procesador: 'I7-13700HX', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00218' },
  { modelo: 'LENOVO THINKPAD P16V', procesador: 'INTEL I7-13700H', ram: '16 GB', almacenamiento: '1 TB', sku: 'LAP00219' },
  { modelo: 'LENOVO WORKSTATION P15 GEN 2', procesador: 'I7-11800H', ram: '32 GB', almacenamiento: '512 GB', sku: 'LAP00220' },
  { modelo: 'DELL PRECISION 7670', procesador: 'INTEL I7-12850HX', ram: '32 GB', almacenamiento: '', sku: 'LAP00221' },
  { modelo: 'ASUS TUF A15 GAMER', procesador: 'RYZEN 7-6800HS', ram: '16 GB', almacenamiento: '', sku: 'LAP00222' },
  { modelo: 'LENOVO THINKPAD T480S', procesador: 'INTEL I7-8650U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00224' },
  { modelo: 'LENOVO THINKPAD E14 GEN 2', procesador: 'RYZEN 5-4500U', ram: '16 GB', almacenamiento: '', sku: 'LAP00225' },
  { modelo: 'DELL LATITUDE 3410', procesador: 'INTEL I5-10210U', ram: '16 GB', almacenamiento: '256 GB', sku: 'LAP00226' },
  { modelo: 'HP PROBOOK 440 G7', procesador: 'INTEL I5-10210U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00227' },
  { modelo: 'HP ELITEBOOK 745 G6', procesador: 'RYZEN 5-3500U', ram: '16 GB', almacenamiento: '', sku: 'LAP00228' },
  { modelo: 'HP PROBOOK 455 G6', procesador: 'INTEL I7-8565U', ram: '16 GB', almacenamiento: '', sku: 'LAP00229' },
  { modelo: 'HP PROBOOK 455 G7', procesador: 'RYZEN 5-4500U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00230' },
  { modelo: 'HP NOTEBOOK 15 TOUCH', procesador: 'INTEL I5-1035G1', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00231' },
  { modelo: 'HP ELITEBOOK 840 G5 TOUCH', procesador: 'I5-8250U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00232' },
  { modelo: 'HP ELITEBOOK 840 G8', procesador: 'INTEL I7-1165G7', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00233' },
  { modelo: 'LENOVO THINKPAD P1 GEN 3', procesador: 'INTEL I7-10750H', ram: '32 GB', almacenamiento: '512 GB', sku: 'LAP00235' },
  { modelo: 'LENOVO THINKPAD P16S', procesador: 'INTEL I7-1360P', ram: '16 GB', almacenamiento: '', sku: 'LAP00236' },
  { modelo: 'LENOVO WORKSTATION P14S', procesador: 'INTEL I7-10610U', ram: '16 GB', almacenamiento: '', sku: 'LAP00237' },
  { modelo: 'LENOVO THINKPAD P1 GEN 3', procesador: 'INTEL I7-10750H', ram: '64 GB', almacenamiento: '1 TB', sku: 'LAP00238' },
  { modelo: 'LENOVO THINKPAD P1 G4', procesador: 'INTEL I7-11800H', ram: '32 GB', almacenamiento: '512 GB', sku: 'LAP00239' },
  { modelo: 'HP ELITEBOOK 840 G8', procesador: 'INTEL I7-1165G7', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00240' },
  { modelo: 'LENOVO WORKSTATION P14S', procesador: 'INTEL I7-10510U', ram: '16 GB', almacenamiento: '', sku: 'LAP00241' },
  { modelo: 'LENOVO THINKPAD P1 G5', procesador: 'INTEL I7-12800H', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00242' },
  { modelo: 'SURFACE PRO 7 PLUS', procesador: 'INTEL I7-1165G7', ram: '16 GB', almacenamiento: '256 GB', sku: 'LAP00243' },
  { modelo: 'DELL PRECISION 5560', procesador: 'INTEL I7-11850H', ram: '64 GB', almacenamiento: '512 GB', sku: 'LAP00244' },
  { modelo: 'LENOVO THINKPAD P15 G2', procesador: 'I7-11800H', ram: '32 GB', almacenamiento: '512 GB', sku: 'LAP00245' },
  { modelo: 'MACBOOK RETINA 16 TOUCH BAR 2019', procesador: 'CORE I7 32GB', ram: '', almacenamiento: '1 TB', sku: 'LAP00246' },
  { modelo: 'LENOVO WORKSTATION P16', procesador: 'I7-12850HX', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00247' },
  { modelo: 'DELL LATITUDE 5590', procesador: 'INTEL I5-7300U', ram: '16 GB', almacenamiento: '', sku: 'LAP00248' },
  { modelo: 'LENOVO THINKPAD E14', procesador: 'INTEL I5-1135G7', ram: '8 GB', almacenamiento: '', sku: 'LAP00249' },
  { modelo: 'SURFACE STUDIO 2', procesador: 'INTEL I7-13800H', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00250' },
  { modelo: 'LENOVO THINKPAD X13 GEN 2', procesador: 'INTEL I7-1185G7', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00251' },
  { modelo: 'LENOVO THINKPAD YOGA X1 6� GEN', procesador: 'I5-1135G', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00252' },
  { modelo: 'LENOVO WORKSTATION P16', procesador: 'I9-12900HX', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00253' },
  { modelo: 'LENOVO WORKSTATION P16', procesador: 'I9-12900HX', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00254' },
  { modelo: 'LENOVO WORKSTATION P16 GEN 1', procesador: 'INTEL I9-12900HX', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00255' },
  { modelo: 'DELL LATITUDE 3590', procesador: 'INTEL I7-8550U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00257' },
  { modelo: 'DELL LATITUDE 3490', procesador: 'INTEL I5-8250U', ram: '8 GB', almacenamiento: '256 GB', sku: 'LAP00258' },
  { modelo: 'DELL INSPIRON 16 7610', procesador: 'INTEL I5-11400H', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00259' },
  { modelo: 'LENOVO THINKPAD T480', procesador: 'INTEL I5-8250U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00260' },
  { modelo: 'MACBOOK PRO 15 RETINA MID 2015 I7 16GB 512 SSD RADEON', procesador: 'M370', ram: '', almacenamiento: '', sku: 'LAP00261' },
  { modelo: 'LENOVO THINKPAD P1 G6', procesador: 'INTEL I7-13800H', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00262' },
  { modelo: 'DELL PRECISION 7750', procesador: 'INTEL I7-10750H', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00263' },
  { modelo: 'HP ENVY 16 TOUCH', procesador: 'INTEL I9-13900H', ram: '32 GB', almacenamiento: '2 TB', sku: 'LAP00264' },
  { modelo: 'LENOVO THINKPAD E14', procesador: 'INTEL I5-1135G7', ram: '16 GB', almacenamiento: '', sku: 'LAP00265' },
  { modelo: 'LENOVO THINKPAD T14 G4 TOUCH', procesador: 'INTEL I7-1365U', ram: '16 GB', almacenamiento: '', sku: 'LAP00266' },
  { modelo: 'HP ZBOOK FIREFLY 14', procesador: 'INTEL I7-1365U', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00267' },
  { modelo: 'DELL PRECISION 5470', procesador: 'INTEL I7-12800H', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00268' },
  { modelo: 'DELL LATITUDE 7480', procesador: 'INTEL I7-7600U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00269' },
  { modelo: 'LENOVO THINKPAD L14 G4', procesador: 'RYZEN 7-7730U', ram: '16 GB', almacenamiento: '256 GB', sku: 'LAP00270' },
  { modelo: 'LENOVO THINKPAD E14', procesador: 'INTEL I5-10210U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00271' },
  { modelo: 'LENOVO THINKPAD P15 G2', procesador: 'I7-11800H', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00272' },
  { modelo: 'DELL OPTIPLEX MICRO 7010', procesador: 'INTEL I5-13600T', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00273' },
  { modelo: 'DELL PRECISION 7560 TOUCH', procesador: 'INTEL I7-11850H', ram: '32 GB', almacenamiento: '2 TB', sku: 'LAP00274' },
  { modelo: 'LENOVO THINKPAD P1 GEN 3 TOUCH', procesador: 'I7-10850H', ram: '32 GB', almacenamiento: '512 GB', sku: 'LAP00276' },
  { modelo: 'DELL PRECISION 5560', procesador: 'INTEL I7-11850H', ram: '32 GB', almacenamiento: '512 GB', sku: 'LAP00277' },
  { modelo: 'DELL XPS 15 9500 TOUCH', procesador: 'INTEL I7-10750H', ram: '32 GB', almacenamiento: '512 GB', sku: 'LAP00278' },
  { modelo: 'SURFACE STUDIO', procesador: 'INTEL I7-11370H', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00279' },
  { modelo: 'MACBOOK RETINA 15 TOUCH BAR 2018', procesador: 'CORE I7 32GB', ram: '', almacenamiento: '512 GB', sku: 'LAP00280' },
  { modelo: 'MACBOOK RETINA 15 TOUCH BAR 2017', procesador: 'INTEL I7 16GB', ram: '', almacenamiento: '', sku: 'LAP00281' },
  { modelo: 'MACBOOK AIR RETINA 13 2018', procesador: 'INTEL I5 16GB', ram: '', almacenamiento: '256 GB', sku: 'LAP00282' },
  { modelo: 'MACBOOK AIR RETINA 13 2020', procesador: 'INTEL I5 16GB', ram: '', almacenamiento: '512 GB', sku: 'LAP00283' },
  { modelo: 'HP ZBOOK 17 FURY G8', procesador: 'XEON W-11955M', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00284' },
  { modelo: 'DELL XPS 15 9520 TOUCH', procesador: 'INTEL I7-12700H', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00285' },
  { modelo: 'HP OMEN 16 GAMER', procesador: 'INTEL I9-12900H', ram: '32 GB', almacenamiento: '2 TB', sku: 'LAP00286' },
  { modelo: 'MACBOOK RETINA 15 TOUCH BAR 2018', procesador: 'CORE I7 32GB', ram: '', almacenamiento: '256 GB', sku: 'LAP00287' },
  { modelo: 'MACBOOK RETINA 15 TOUCH BAR 2019', procesador: 'CORE I7 32GB', ram: '', almacenamiento: '256 GB', sku: 'LAP00288' },
  { modelo: 'DELL OPTIPLEX SMALL 7020', procesador: 'INTEL I5-14500T', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00289' },
  { modelo: 'LENOVO THINKPAD T14S G4', procesador: 'INTEL I7-1365U', ram: '32 GB', almacenamiento: '512 GB', sku: 'LAP00290' },
  { modelo: 'HP ZBOOK 15 G8', procesador: 'INTEL I7-11800H', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00291' },
  { modelo: 'ASUS ROG ZEPHYRUS G14', procesador: 'RYZEN 7-5800HS', ram: '24 GB', almacenamiento: '1 TB', sku: 'LAP00292' },
  { modelo: 'LENOVO THINKBOOK 14 G6', procesador: 'INTEL I5-1335U', ram: '16 GB', almacenamiento: '256 GB', sku: 'LAP00293' },
  { modelo: 'LENOVO THINKPAD E14 G5', procesador: 'INTEL I7-1355U', ram: '24 GB', almacenamiento: '512 GB', sku: 'LAP00294' },
  { modelo: 'DELL PRECISION 7560', procesador: 'INTEL I7-11850H', ram: '32 GB', almacenamiento: '512 GB', sku: 'LAP00295' },
  { modelo: 'LENOVO THINKPAD L14 G4', procesador: 'INTEL I5-1335U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00296' },
  { modelo: 'LENOVO THINKPAD T14 G4', procesador: 'INTEL I7-1355U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00297' },
  { modelo: 'DELL LATITUDE 7440', procesador: 'INTEL I5-1335U', ram: '8 GB', almacenamiento: '512 GB', sku: 'LAP00298' },
  { modelo: 'DELL LATITUDE 7440', procesador: 'INTEL I5-1345U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00299' },
  { modelo: 'HP ZBOOK FIREFLY 14 G11', procesador: 'ULTRA 7-165H', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00300' },
  { modelo: 'DELL PRECISION 7550', procesador: 'INTEL I7-10750H', ram: '32 GB', almacenamiento: '512 GB', sku: 'LAP00301' },
  { modelo: 'ASUS TUF FX517Z', procesador: 'INTEL I5-1245H', ram: '16 GB', almacenamiento: '', sku: 'LAP00302' },
  { modelo: 'LENOVO THINKBOOK 14 G4', procesador: 'INTEL I5-1235U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00303' },
  { modelo: 'HP ZBOOK STUDIO 16 G9', procesador: 'INTEL I9-12900H', ram: '64 GB', almacenamiento: '1 TB', sku: 'LAP00304' },
  { modelo: 'HP ZBOOK STUDIO 16 G9', procesador: 'INTEL I9-12900H', ram: '64 GB', almacenamiento: '1 TB', sku: 'LAP00305' },
  { modelo: 'DELL PRECISION 3581', procesador: 'INTEL I7-13800H', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00306' },
  { modelo: 'HP SPECTRE X360 TOUCH', procesador: 'INTEL I7-13700H', ram: '16 GB', almacenamiento: '1 TB', sku: 'LAP00307' },
  { modelo: 'LENOVO THINKPAD T14S TOUCH', procesador: 'RYZEN 7-4750U', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00308' },
  { modelo: 'MSI STEALTH 16', procesador: 'INTEL I7-13800H', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00309' },
  { modelo: 'DELL LATITUDE E5570', procesador: 'INTEL I7-6600U', ram: '16 GB', almacenamiento: '256 GB', sku: 'LAP00310' },
  { modelo: 'DELL PRECISION 7520 XEON E3-1545M 32GB 512GB 4K 15.6', procesador: 'M1200', ram: '', almacenamiento: '', sku: 'LAP00311' },
  { modelo: 'DELL PRECISION 7510', procesador: 'INTEL I7-6820HQ', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00312' },
  { modelo: 'DELL INSPIRON G5 5500', procesador: 'INTEL I7-10750H', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00313' },
  { modelo: 'DELL G15 5510', procesador: 'INTEL I7-10870H', ram: '32 GB', almacenamiento: '512 GB', sku: 'LAP00314' },
  { modelo: 'MACBOOK AIR RETINA 13 2019', procesador: 'INTEL I5 16GB', ram: '', almacenamiento: '256 GB', sku: 'LAP00315' },
  { modelo: 'DELL INSPIRON 16 PLUS 7630', procesador: 'INTEL I7-13620H', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00316' },
  { modelo: 'LENOVO THIKPAD E16 G1', procesador: 'INTEL I7-1355U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00317' },
  { modelo: 'LENOVO THINKPAD P50', procesador: 'INTEL I7-6820HQ', ram: '32 GB', almacenamiento: '512 GB', sku: 'LAP00318' },
  { modelo: 'DELL LATITUDE E5550', procesador: 'INTEL I7-5600U', ram: '12 GB', almacenamiento: '256 GB', sku: 'LAP00319' },
  { modelo: 'DELL LATITUDE 5580', procesador: 'INTEL I7-7820HQ', ram: '16 GB', almacenamiento: '', sku: 'LAP00320' },
  { modelo: 'DELL INSPIRON G5 5500', procesador: 'INTEL I7-10750H', ram: '32 GB', almacenamiento: '512 GB', sku: 'LAP00321' },
  { modelo: 'MSI CREATORPRO 16 AI STUDIO', procesador: 'ULTRA 9-185H', ram: '64 GB', almacenamiento: '2 TB', sku: 'LAP00322' },
  { modelo: 'DELL PRECISION 7670', procesador: 'INTEL I9-12950HX', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00323' },
  { modelo: 'LENOVO THINKPAD L14 G4', procesador: 'INTEL I7-1355U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00324' },
  { modelo: 'LENOVO THINKPAD T14 G2', procesador: 'INTEL I7-1165G7', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00325' },
  { modelo: 'LENOVO THINKPAD T14 G3', procesador: 'INTEL I7-1255U', ram: '24 GB', almacenamiento: '512 GB', sku: 'LAP00326' },
  { modelo: 'DELL LATITUDE 5450', procesador: 'INTEL ULTRA 7-155U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00327' },
  { modelo: 'LENOVO THINKPAD P16S G1', procesador: 'INTEL I7-1260P', ram: '32 GB', almacenamiento: '512 GB', sku: 'LAP00328' },
  { modelo: 'HP PAVILION PLUS 14T', procesador: 'INTEL I7-1355U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00329' },
  { modelo: 'DELL PRECISION 5770 TOUCH', procesador: 'I9-12900H', ram: '64 GB', almacenamiento: '1 TB', sku: 'LAP00330' },
  { modelo: 'DELL PRECISION 7770', procesador: 'INTEL I9-12950HX', ram: '64 GB', almacenamiento: '1 TB', sku: 'LAP00331' },
  { modelo: 'HP ZBOOK 17 G6', procesador: 'INTEL I9-9880H', ram: '64 GB', almacenamiento: '512 GB', sku: 'LAP00332' },
  { modelo: 'LENOVO THINKPAD P15V G2', procesador: 'INTEL I7-11800H', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00333' },
  { modelo: 'LENOVO THINKPAD L15 GEN 4', procesador: 'INTEL I7-1355U', ram: '32 GB', almacenamiento: '512 GB', sku: 'LAP00334' },
  { modelo: 'ACER ASPIRE 5', procesador: 'INTEL I7-1355U', ram: '16 GB', almacenamiento: '1 TB', sku: 'LAP00335' },
  { modelo: 'LENOVO LOQ 16', procesador: 'RYZEN 5-7640HS', ram: '32 GB', almacenamiento: '512 GB', sku: 'LAP00336' },
  { modelo: 'LENOVO IDEAPAD SLIM 3', procesador: 'INTEL I7-13620H', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00337' },
  { modelo: 'LENOVO THINKPAD T14 G2', procesador: 'RYZEN 5-5650U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00338' },
  { modelo: 'LENOVO THINKPAD T14 G2', procesador: 'RYZEN 5-5650U', ram: '40 GB', almacenamiento: '512 GB', sku: 'LAP00339' },
  { modelo: 'LENOVO THINKPAD T14S G2', procesador: 'INTEL I7-1185G7', ram: '32 GB', almacenamiento: '512 GB', sku: 'LAP00340' },
  { modelo: 'LENOVO THINKPAD YOGA X13 G2', procesador: 'INTEL I5-1145G7', ram: '16 GB', almacenamiento: '', sku: 'LAP00341' },
  { modelo: 'LENOVO THINKPAD P1 GEN 3 TOUCH', procesador: 'I9-10850H', ram: '64 GB', almacenamiento: '512 GB', sku: 'LAP00342' },
  { modelo: 'PANASONIC TOUGHBOOK FZ-55 TOUCH', procesador: 'INTEL I5-1145G7', ram: '16 GB', almacenamiento: '', sku: 'LAP00343' },
  { modelo: 'DELL LATITUDE 3420', procesador: 'INTEL I5-1135G7', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00344' },
  { modelo: 'DELL LATITUDE 3420', procesador: 'INTEL I5-1135G7', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00345' },
  { modelo: 'LENOVO THINKPAD T14S G2', procesador: 'INTEL I5-1145G7', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00346' },
  { modelo: 'LENOVO THINKPAD T490S', procesador: 'INTEL I7-8665U', ram: '16 GB', almacenamiento: '', sku: 'LAP00347' },
  { modelo: 'LENOVO THINKPAD YOGA X1 5� GEN', procesador: 'I7-10610U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00348' },
  { modelo: 'HP ELITEBOOK FOLIO 9480M', procesador: 'INTEL I7-4600U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00349' },
  { modelo: 'HP ZBOOK 15 POWER G10', procesador: 'INTEL I7-13800H', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00350' },
  { modelo: 'LENOVO YOGA PRO 9I', procesador: 'INTEL ULTRA 9-185H', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00351' },
  { modelo: 'ALIENWARE', procesador: 'M16', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00352' },
  { modelo: 'HP ZBOOK X G1I', procesador: 'INTEL ULTRA 9-285H', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00353' },
  { modelo: 'LENOVO THINKPAD X1 2 EN 1 G10', procesador: 'INTEL ULTRA 7-268V', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00354' },
  { modelo: 'DELL PRECISION 3581', procesador: 'INTEL I7-13800H', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00355' },
  { modelo: 'DELL PRECISION 5570', procesador: 'CORE I7-12800H', ram: '32 GB', almacenamiento: '512 GB', sku: 'LAP00356' },
  { modelo: 'LENOVO THINKPAD L14 GEN 5', procesador: 'INTEL ULTRA 7-155U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00357' },
  { modelo: 'DELL PRO MAX 14', procesador: 'INTEL ULTRA 5-235H', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00358' },
  { modelo: 'ASUS ZENBOOK DUO', procesador: 'INTEL ULTRA 9-185H', ram: '32 GB', almacenamiento: '2 TB', sku: 'LAP00359' },
  { modelo: 'HP SPECTRE X360 TOUCH', procesador: 'INTEL I7-13700H', ram: '16 GB', almacenamiento: '1 TB', sku: 'LAP00361' },
  { modelo: 'DELL LATITUDE 5420', procesador: 'INTEL I7-1185G7', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00362' },
  { modelo: 'DELL LATITUDE 5520', procesador: 'INTEL I7-1185G7', ram: '16 GB', almacenamiento: '256 GB', sku: 'LAP00363' },
  { modelo: 'DELL LATITUDE 5420', procesador: 'INTEL I5-1135G7', ram: '16 GB', almacenamiento: '256 GB', sku: 'LAP00364' },
  { modelo: 'DELL PRO 14 PLUS', procesador: 'INTEL ULTRA 5-235U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00365' },
  { modelo: 'DELL PRO 14 TOUCH', procesador: 'INTEL ULTRA 5-235U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00366' },
  { modelo: 'HP ZBOOK FIREFLY 16 G11', procesador: 'ULTRA 7-155H', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00367' },
  { modelo: 'DELL PRECISION 5690', procesador: 'INTEL ULTRA 7-165H', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00368' },
  { modelo: 'DELL PRECISION 5680', procesador: 'INTEL I9-13900H', ram: '64 GB', almacenamiento: '1 TB', sku: 'LAP00369' },
  { modelo: 'DELL PRECISION 5680', procesador: 'INTEL I7-13800H', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00370' },
  { modelo: 'DELL PRECISION 3590', procesador: 'INTEL ULTRA 7-165H', ram: '64 GB', almacenamiento: '1 TB', sku: 'LAP00371' },
  { modelo: 'DELL PRECISION 7550', procesador: 'INTEL I7-10875H', ram: '32 GB', almacenamiento: '512 GB', sku: 'LAP00372' },
  { modelo: 'SURFACE PRO 7', procesador: 'INTEL I7-1065G7', ram: '16 GB', almacenamiento: '256 GB', sku: 'LAP00373' },
  { modelo: 'DELL PRECISION 3490', procesador: 'INTEL ULTRA 7-155H', ram: '32 GB', almacenamiento: '512 GB', sku: 'LAP00374' },
  { modelo: 'SURFACE PRO 11', procesador: 'SNAPDRAGON X ELITE', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00375' },
  { modelo: 'APPLE MACBOOK PRO 16 2021 CHIP', procesador: 'M1 PRO', ram: '16 GB', almacenamiento: '1 TB', sku: 'LAP00376' },
  { modelo: 'DELL LATITUDE RUGGED 5430', procesador: 'INTEL I5-1145G7', ram: '16 GB', almacenamiento: '256 GB', sku: 'LAP00377' },
  { modelo: 'DELL PRECISION 7750', procesador: 'INTEL I7-10875H', ram: '64 GB', almacenamiento: '2 TB', sku: 'LAP00378' },
  { modelo: 'CYBERPOWERPC TRACERV', procesador: 'INTEL I7-11800H', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00379' },
  { modelo: 'DELL PRECISION 7680', procesador: 'INTEL I7-13850HX', ram: '64 GB', almacenamiento: '1 TB', sku: 'LAP00380' },
  { modelo: 'MSI THIN GF63', procesador: 'INTEL I5-12450H', ram: '16 GB', almacenamiento: '1 TB', sku: 'LAP00382' },
  { modelo: 'DELL PRECISION 3591', procesador: 'INTEL ULTRA 7-165H', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00383' },
  { modelo: 'LENOVO LOQ 15', procesador: 'RYZEN 5-7235HS', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00384' },
  { modelo: 'HP PAVILION 15 TOUCH', procesador: 'INTEL I7-1355U', ram: '16 GB', almacenamiento: '1 TB', sku: 'LAP00385' },
  { modelo: 'DELL LATITUDE 5410', procesador: 'INTEL I5-10210U', ram: '16 GB', almacenamiento: '256 GB', sku: 'LAP00386' },
  { modelo: 'DELL PRECISION 5550', procesador: 'INTEL I7-10750H', ram: '32 GB', almacenamiento: '512 GB', sku: 'LAP00387' },
  { modelo: 'DELL LATITUDE 7410', procesador: 'INTEL I7-10610U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00390' },
  { modelo: 'DELL LATITUDE 7420', procesador: 'INTEL I7-1185G7', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00391' },
  { modelo: 'LENOVO THINKPAD T470', procesador: 'INTEL I5-6300U', ram: '8 GB', almacenamiento: '256 GB', sku: 'LAP00392' },
  { modelo: 'ACER NITRO 17', procesador: 'RYZEN 7-7735HS', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00393' },
  { modelo: 'DELL XPS 13 9345 TOUCH', procesador: 'SNAPDRAGON X ELITE', ram: '16 GB', almacenamiento: '1 TB', sku: 'LAP00394' },
  { modelo: 'SURFACE PRO 9', procesador: 'INTEL I5-1235U', ram: '8 GB', almacenamiento: '256 GB', sku: 'LAP00395' },
  { modelo: 'SURFACE PRO 7', procesador: 'INTEL I5-1035G4', ram: '8 GB', almacenamiento: '256 GB', sku: 'LAP00396' },
  { modelo: 'SURFACE PRO 8', procesador: 'INTEL I7-1185G7', ram: '16 GB', almacenamiento: '256 GB', sku: 'LAP00397' },
  { modelo: 'DELL PRECISION 7680', procesador: 'INTEL I7-13850HX', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00398' },
  { modelo: 'DELL PRO MAX 16 PLUS', procesador: 'ULTRA 7-265HX', ram: '32 GB', almacenamiento: '512 GB', sku: 'LAP00399' },
  { modelo: 'DELL PRO RUGGED 14', procesador: 'INTEL ULTRA 5-125U', ram: '32 GB', almacenamiento: '512 GB', sku: 'LAP00400' },
  { modelo: 'DELL INSPIRON 16 5630', procesador: 'INTEL I7-1360P', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00401' },
  { modelo: 'DELL XPS 15 9530 TOUCH', procesador: 'INTEL I9-13900H', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00402' },
  { modelo: 'LENOVO THINKPAD T14S GEN 6 TOUCH', procesador: 'ULTRA 5-235U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00403' },
  { modelo: 'DELL PRO 14', procesador: 'INTEL ULTRA 7-235U', ram: '32 GB', almacenamiento: '512 GB', sku: 'LAP00404' },
  { modelo: 'DELL PRECISION 7780', procesador: 'INTEL I7-13850HX', ram: '64 GB', almacenamiento: '1 TB', sku: 'LAP00405' },
  { modelo: 'HP ZBOOK FIREFLY 16 G11', procesador: 'ULTRA 7-165H', ram: '32 GB', almacenamiento: '512 GB', sku: 'LAP00406' },
  { modelo: 'LENOVO THINKPAD T14 GEN 3', procesador: 'INTEL I5-1235U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00407' },
  { modelo: 'LENOVO THINKPAD YOGA X13 GEN 3', procesador: 'INTEL I7-1265U', ram: '32 GB', almacenamiento: '512 GB', sku: 'LAP00408' },
  { modelo: 'LENOVO THINKPAD T14 G3', procesador: 'RYZEN 7-6850U', ram: '32 GB', almacenamiento: '512 GB', sku: 'LAP00409' },
  { modelo: 'HP ENVY X360 TOUCH', procesador: 'RYZEN 5-8640HS', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00410' },
  { modelo: 'ASUS TUF GAMING A16', procesador: 'RYZEN 7-7735HS', ram: '32 GB', almacenamiento: '2 TB', sku: 'LAP00411' },
  { modelo: 'LENOVO THINKPAD P1 G6', procesador: 'INTEL I7-13800H', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00412' },
  { modelo: 'DELL INSPIRON 16 PLUS 7630', procesador: 'INTEL I7-13700H', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00413' },
  { modelo: 'SURFACE STUDIO', procesador: 'INTEL I7-11370H', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00414' },
  { modelo: 'LENOVO LEGION PRO 7', procesador: 'INTEL I9-14900HX', ram: '32 GB', almacenamiento: '2 TB', sku: 'LAP00415' },
  { modelo: 'ALIENWARE', procesador: 'M18', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00416' },
  { modelo: 'LENOVO LEGION 5', procesador: 'RYZEN 7-5800H', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00417' },
  { modelo: 'SURFACE BOOK 3 TOUCH', procesador: 'INTEL I7-1065G7', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00418' },
  { modelo: 'SURFACE BOOK 2 TOUCH', procesador: 'INTEL I7-8650U', ram: '16 GB', almacenamiento: '256 GB', sku: 'LAP00419' },
  { modelo: 'LENOVO THINKPAD P16S G3', procesador: 'INTEL ULTRA 7-165H', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00420' },
  { modelo: 'LENOVO THINKPAD X1 CARBON G12', procesador: 'ULTRA 7-165H', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00421' },
  { modelo: 'APPLE MACBOOK AIR 13 CHIP', procesador: 'M4', ram: '16 GB', almacenamiento: '256 GB', sku: 'LAP00422' },
  { modelo: 'PANASONIC TOUGHBOOK CF-33 TOUCH', procesador: 'INTEL I5-1245U', ram: '16 GB', almacenamiento: '', sku: 'LAP00423' },
  { modelo: 'LENOVO THINKPAD P1 G7', procesador: 'INTEL ULTRA 7-155H', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00424' },
  { modelo: 'HP OMEN 16 GAMER', procesador: 'INTEL I7-1362H', ram: '16 GB', almacenamiento: '1 TB', sku: 'LAP00425' },
  { modelo: 'DELL PRECISION 7670', procesador: 'INTEL I9-12950HX', ram: '64 GB', almacenamiento: '2 TB', sku: 'LAP00426' },
  { modelo: 'SURFACE PRO 9', procesador: 'INTEL I7-1255U', ram: '16 GB', almacenamiento: '256 GB', sku: 'LAP00427' },
  { modelo: 'SURFACE PRO 9', procesador: 'INTEL I7-1255U', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00428' },
  { modelo: 'SURFACE PRO 11', procesador: 'SNAPDRAGON X PLUS', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00429' },
  { modelo: 'LENOVO THINKPAD X1 CARBON G8 TOUCH', procesador: 'INTEL I7-10610U', ram: '16 GB', almacenamiento: '', sku: 'LAP00430' },
  { modelo: 'LENOVO THINKPAD X1 CARBON G9', procesador: 'INTEL I7-1165G7', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00431' },
  { modelo: 'LENOVO THINKPAD T14 GEN 2', procesador: 'INTEL I5-1145G7', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00432' },
  { modelo: 'LENOVO THINKPAD X1 CARBON G10 TOUCH', procesador: 'INTEL I7-1260P', ram: '16 GB', almacenamiento: '1 TB', sku: 'LAP00433' },
  { modelo: 'LENOVO THINKPAD T14 G1', procesador: 'INTEL I5-10310U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00434' },
  { modelo: 'LENOVO THINKPAD T14 G3', procesador: 'INTEL I5-1245U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00435' },
  { modelo: 'LENOVO THINKPAD T14 G3', procesador: 'INTEL I7-1270P', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00436' },
  { modelo: 'LENOVO THINKPAD P14S GEN 2', procesador: 'INTEL I7-1185G7', ram: '32 GB', almacenamiento: '1 TB', sku: 'LAP00437' },
  { modelo: 'LENOVO THINKPAD T590', procesador: 'INTEL I7-8665U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00438' },
  { modelo: 'LENOVO THINKPAD X1 CARBON G6', procesador: 'INTEL I5-8350U', ram: '8 GB', almacenamiento: '256 GB', sku: 'LAP00439' },
  { modelo: 'LENOVO THINKPAD X1 CARBON G7', procesador: 'INTEL I7-8565U', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00440' },
  { modelo: 'LENOVO THINKPAD X1 YOGA G3', procesador: 'INTEL I5-8250U', ram: '8 GB', almacenamiento: '256 GB', sku: 'LAP00441' },
  { modelo: 'DELL XPS X13 PLUS', procesador: 'ULTRA 5-226V', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00442' },
  { modelo: 'APPLE MACBOOK AIR 13 CHIP', procesador: 'M4', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00443' },
  { modelo: 'SURFACE PRO 10', procesador: 'INTEL ULTRA 5-135U', ram: '16 GB', almacenamiento: '256 GB', sku: 'LAP00444' },
  { modelo: 'HP ZBOOK FURY 16 G1I', procesador: 'ULTRA 9-285HX', ram: '64 GB', almacenamiento: '1 TB', sku: 'LAP00445' },
  { modelo: 'HP OMNIBOOK 5', procesador: 'SNAPDRAGON X PLUS', ram: '16 GB', almacenamiento: '512 GB', sku: 'LAP00446' },
  { modelo: 'MINI PC INTEL NUC KIT NUC8BEK', procesador: 'I3-8109U', ram: '16 GB', almacenamiento: '512 GB', sku: 'PCM00001' },
  { modelo: 'MINI PC INTEL NUC KIT NUC8BEH', procesador: 'I3-8109U', ram: '16 GB', almacenamiento: '512 GB', sku: 'PCM00002' },
  { modelo: 'MINI PC INTEL NUC KIT NUC7I5BNH', procesador: 'I5-7260U', ram: '16 GB', almacenamiento: '512 GB', sku: 'PCM00003' },
  { modelo: 'DELL OPTIPLEX MICRO 7000', procesador: 'INTEL I7-12700T', ram: '16 GB', almacenamiento: '512 GB', sku: 'PCM00004' },
  { modelo: 'DELL OPTIPLEX MICRO 7020', procesador: 'INTEL I5-14500T', ram: '16 GB', almacenamiento: '512 GB', sku: 'PCM00005' },
  { modelo: 'MINI PC INTEL NUC KIT NUC8BEK', procesador: 'I3-8109U', ram: '16 GB', almacenamiento: '1 TB', sku: 'PCM00006' },
  { modelo: 'MINI PC INTEL NUC KIT NUC8BEH', procesador: 'I3-8109U', ram: '16 GB', almacenamiento: '1 TB', sku: 'PCM00007' },
  { modelo: 'HP ELITE MINI 600 G9', procesador: 'INTEL I5-12500T', ram: '16 GB', almacenamiento: '512 GB', sku: 'PCM00008' },
  { modelo: 'LENOVO THINKCENTRE', procesador: 'M70', ram: '16 GB', almacenamiento: '512 GB', sku: 'PCM00009' },
  { modelo: 'HP ELITE MINI 800 G9', procesador: 'INTEL I5-14500T', ram: '16 GB', almacenamiento: '512 GB', sku: 'PCM00010' },
  { modelo: 'DELL OPTIPLEX MICRO 7060', procesador: 'INTEL I5-8500T', ram: '8 GB', almacenamiento: '256 GB', sku: 'PCM00011' },
  { modelo: 'HP ELITE MINI 800 G9', procesador: 'INTEL I5-12500T', ram: '16 GB', almacenamiento: '512 GB', sku: 'PCM00012' },
  { modelo: 'HP ELITEDESK 8 MINI G1I', procesador: 'INTEL ULTRA 5-245T', ram: '32 GB', almacenamiento: '512 GB', sku: 'PCM00013' },
];

const LS_KEY = 'equipmaster_skus_aprendidos';

function getSkusAprendidos() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; }
}

function guardarSkusAprendidos(lista) {
  localStorage.setItem(LS_KEY, JSON.stringify(lista));
}

function cargarSkusAprendidos() {
  const aprendidos = getSkusAprendidos();
  if (aprendidos.length > 0) {
    const existentes = new Set(SKU_TABLE.map(e => e.sku));
    for (const item of aprendidos) {
      if (!existentes.has(item.sku)) {
        SKU_TABLE.push(item);
        existentes.add(item.sku);
      }
    }
  }
}

cargarSkusAprendidos();

export function aprenderSku(sku, modelo, procesador, ram, almacenamiento) {
  const s = sku.toUpperCase().trim();
  if (SKU_TABLE.some(e => e.sku === s)) return;
  const entry = { modelo: modelo.toUpperCase().trim(), procesador: procesador.toUpperCase().trim(), ram: ram || '', almacenamiento: almacenamiento || '', sku: s };
  SKU_TABLE.push(entry);
  const aprendidos = getSkusAprendidos();
  aprendidos.unshift(entry);
  guardarSkusAprendidos(aprendidos);
}

export function buscarSku(modelo, procesador) {
  if (!modelo) return null;
  const m = modelo.toUpperCase().trim();
  if (procesador) {
    const p = procesador.toUpperCase().trim();
    const exacto = SKU_TABLE.find(e => e.modelo === m && e.procesador === p);
    if (exacto) return exacto.sku;
  }
  const soloModelo = SKU_TABLE.find(e => e.modelo === m);
  if (soloModelo) return soloModelo.sku;
  return null;
}

export function buscarPorSku(sku) {
  if (!sku) return null;
  const s = sku.toUpperCase().trim();
  const match = SKU_TABLE.find(e => e.sku === s);
  if (!match) return null;
  const marca = match.modelo.split(' ')[0];
  return { modelo: match.modelo, procesador: match.procesador, marca, ram: match.ram || '', almacenamiento: match.almacenamiento || '' };
}

export function derivarModeloComercial(marca, modelo) {
  if (!modelo) return '';
  const m = modelo.toUpperCase().trim();
  const brand = (marca || '').toUpperCase().trim();

  // Buscar en SKU_TABLE entradas que terminen con nuestro modelo limpio
  const match = SKU_TABLE.find(e => {
    const full = e.modelo.toUpperCase().trim();
    // Ej: full="THINKPAD T14 GEN 1", m="T14 GEN 1"
    if (full.endsWith(m) && full !== m) return true;
    // Ej: full="LENOVO THINKPAD T14 GEN 1", m="T14 GEN 1"
    if (full.includes(' ') && full.endsWith(' ' + m)) return true;
    return false;
  });

  if (match) {
    const full = match.modelo.toUpperCase().trim();
    // Extraer la parte comercial: todo lo que está antes de la base del modelo
    const baseIdx = full.toUpperCase().lastIndexOf(m);
    if (baseIdx > 0) return full.slice(0, baseIdx + m.length);
    return full;
  }

  // Si no hay match, intentar con prefijos conocidos por marca
  const PREFIJOS_POR_MARCA = {
    'LENOVO': ['THINKPAD', 'THINKBOOK', 'YOGA', 'LEGION', 'IDEAPAD', 'LOQ'],
    'HP': ['ELITEBOOK', 'PROBOOK', 'PAVILION', 'SPECTRE', 'ENVY', 'OMEN', 'ZBOOK'],
    'DELL': ['LATITUDE', 'PRECISION', 'INSPIRON', 'XPS', 'OPTIPLEX'],
    'ASUS': ['VIVOBOOK', 'EXPERTBOOK', 'ROG', 'TUF', 'ZENBOOK'],
    'ACER': ['NITRO', 'ASPIRE'],
    'MSI': ['CREATOR', 'STEALTH', 'THIN', 'CROSSHAIR'],
    'APPLE': ['MACBOOK'],
    'SAMSUNG': ['GALAXY'],
    'PANASONIC': ['TOUGHBOOK'],
    'RAZER': ['BLADE'],
  };

  const prefijos = PREFIJOS_POR_MARCA[brand];
  if (prefijos) {
    // Ver si el modelo ya empieza con algún prefijo conocido
    for (const p of prefijos) {
      if (m.startsWith(p)) return m;
    }
    // Si no, asumir el primer prefijo de la lista
    return `${prefijos[0]} ${m}`;
  }

  return m;
}
