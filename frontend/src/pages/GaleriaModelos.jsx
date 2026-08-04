import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../componentes/Notification';
import useDocumentTitle from '../utils/useDocumentTitle';

const MARCAS = ['LENOVO', 'HP', 'DELL', 'APPLE', 'ACER', 'ASUS', 'SAMSUNG', 'MSI', 'TOSHIBA', 'MICROSOFT', 'SURFACE', 'GIGABYTE', 'XIAOMI', 'HUAWEI', 'CHUWI', 'INTEL', 'RAZER', 'LG', 'SONY', 'HONOR', 'GOOGLE', 'MOTOROLA'];

const MAX_SIZE = 1200;
function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error al leer archivo'));
    reader.onload = e => {
      const img = new Image();
      img.onerror = () => reject(new Error('Error al decodificar imagen'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > MAX_SIZE || h > MAX_SIZE) {
          if (w > h) { h = Math.round(h * MAX_SIZE / w); w = MAX_SIZE; }
          else { w = Math.round(w * MAX_SIZE / h); h = MAX_SIZE; }
        }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function titulo(str) {
  if (!str) return '';
  const s = str.trim();
  if (/^[A-Z0-9-]+$/.test(s)) return s;
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function parsearCarpeta(nombre) {
  const tokens = (nombre || '').trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return { marca: '', modelo: '' };
  const upper = tokens.map(t => t.toUpperCase());
  let marcaIdx = 0;
  for (let len = Math.min(3, upper.length); len >= 1; len--) {
    const cand = upper.slice(0, len).join(' ');
    if (MARCAS.includes(cand)) { marcaIdx = len; break; }
  }
  const marca = titulo(upper.slice(0, marcaIdx).join(' ')) || titulo(upper[0]);
  const modelo = tokens.slice(marcaIdx).join(' ');
  return { marca, modelo };
}

export default function GaleriaModelos() {
  useDocumentTitle('Fotos por Modelo');
  const { can } = useAuth();
  const { notify } = useNotify();

  const [grupos, setGrupos] = useState([]);
  const [carga, setCarga] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [marcaFiltro, setMarcaFiltro] = useState('');
  const [sel, setSel] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  const [upload, setUpload] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const carpetaRef = useRef(null);
  const sueltasRef = useRef(null);

  const puedeSubir = can('gestionar_modelos');

  const cargar = useCallback(async () => {
    setCarga(true);
    try {
      const data = await api.modelosFotos();
      setGrupos(data || []);
    } catch (err) {
      notify('Error', err.message, 'error');
    } finally {
      setCarga(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const marcas = useMemo(() => {
    const map = {};
    grupos.forEach(g => { map[g.marca] = (map[g.marca] || 0) + g.cantidad; });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [grupos]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return grupos.filter(g =>
      (!marcaFiltro || g.marca === marcaFiltro) &&
      (!q || `${g.marca} ${g.modelo}`.toLowerCase().includes(q))
    );
  }, [grupos, busqueda, marcaFiltro]);

  const elegirCarpeta = (e) => {
    const files = Array.from(e.target.files || []);
    const imgs = files.filter(f => f.type.startsWith('image/'));
    if (imgs.length === 0) { notify('Sin imágenes', 'La carpeta no contiene imágenes.', 'error'); e.target.value = ''; return; }
    const carpeta = files[0].webkitRelativePath?.split('/')[0] || '';
    const parsed = parsearCarpeta(carpeta);
    setUpload({ archivos: imgs, carpeta, marca: parsed.marca, modelo: parsed.modelo, suelto: false });
    e.target.value = '';
  };

  const elegirSueltas = (e) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) { notify('Sin imágenes', 'Selecciona archivos de imagen.', 'error'); e.target.value = ''; return; }
    setUpload({ archivos: files, carpeta: '', marca: '', modelo: '', suelto: true });
    e.target.value = '';
  };

  const subir = async () => {
    if (!upload || !upload.marca.trim() || !upload.modelo.trim()) {
      notify('Faltan datos', 'Escribe la marca y el modelo.', 'error');
      return;
    }
    setSubiendo(true);
    let ok = 0, fallas = 0;
    for (let i = 0; i < upload.archivos.length; i++) {
      const file = upload.archivos[i];
      try {
        const archivo = await resizeImage(file);
        await api.subirFotoModelo({ marca: upload.marca.trim(), modelo: upload.modelo.trim(), archivo, nombre: file.name });
        ok++;
      } catch (err) {
        fallas++;
        console.error('Error al subir', file.name, err);
      }
    }
    setSubiendo(false);
    setUpload(null);
    notify('Subida terminada', ok > 0 ? `Se subieron ${ok} fotos${fallas ? ` (${fallas} fallaron)` : ''}.` : `Fallaron las ${fallas} fotos.`, fallas === 0 ? 'success' : 'error');
    cargar();
  };

  const borrarFoto = async (g, foto) => {
    if (!window.confirm(`¿Eliminar ${foto.nombre || 'esta foto'} de ${g.marca} ${g.modelo}?`)) return;
    try {
      await api.borrarFotoModelo(g.clave, foto.id);
      notify('Foto eliminada', `${g.marca} ${g.modelo}.`, 'success');
      if (sel?.clave === g.clave) {
        const recargado = await api.modelosFotos();
        setGrupos(recargado || []);
        setSel(recargado?.find(x => x.clave === g.clave) || null);
      } else {
        cargar();
      }
    } catch (err) {
      notify('Error', err.message, 'error');
    }
  };

  const borrarModelo = async (g) => {
    if (!window.confirm(`¿Eliminar TODAS las fotos de ${g.marca} ${g.modelo} (${g.cantidad})?`)) return;
    try {
      await api.borrarModelo(g.clave);
      notify('Modelo eliminado', `${g.marca} ${g.modelo}.`, 'success');
      setSel(null);
      cargar();
    } catch (err) {
      notify('Error', err.message, 'error');
    }
  };

  if (sel) {
    const g = sel;
    return (
      <section className="space-y-4 pb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setSel(null)} className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
              <i className="fa-solid fa-arrow-left" />
            </button>
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">{g.marca} <span className="text-slate-400">·</span> {g.modelo}</h2>
              <p className="text-sm text-slate-400">{g.cantidad} foto{g.cantidad === 1 ? '' : 's'}</p>
            </div>
          </div>
          {puedeSubir && (
            <button onClick={() => borrarModelo(g)}
              className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 text-sm font-bold hover:bg-rose-50 transition flex items-center gap-2">
              <i className="fa-solid fa-trash text-xs" /> Eliminar modelo
            </button>
          )}
        </div>

        {g.fotos.length === 0 ? (
          <div className="panel p-10 text-center text-slate-400">Sin fotos.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {g.fotos.map(foto => (
              <div key={foto.id} className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 aspect-[4/3]">
                <img src={foto.url} alt={foto.nombre || 'foto'} loading="lazy"
                  onClick={() => setLightbox(foto.url)}
                  className="w-full h-full object-cover cursor-zoom-in transition group-hover:scale-105" />
                {puedeSubir && (
                  <button onClick={() => borrarFoto(g, foto)} title="Eliminar foto"
                    className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/55 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-rose-600 transition">
                    <i className="fa-solid fa-trash" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {lightbox && (
          <div className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
            <img src={lightbox} alt="Foto" className="max-w-full max-h-full rounded-xl shadow-2xl" />
            <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/25 transition">
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="space-y-4 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Fotos por Modelo</h2>
          <p className="text-sm text-slate-400">Catálogo fotográfico por marca y modelo de los equipos.</p>
        </div>
        {puedeSubir && (
          <div className="flex items-center gap-2">
            <input ref={carpetaRef} type="file" webkitdirectory="" multiple className="hidden" onChange={elegirCarpeta} />
            <input ref={sueltasRef} type="file" multiple accept="image/*" className="hidden" onChange={elegirSueltas} />
            <button onClick={() => carpetaRef.current?.click()}
              className="btn-brand flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold">
              <i className="fa-solid fa-folder-open text-xs" /> Subir carpeta
            </button>
            <button onClick={() => sueltasRef.current?.click()} title="Subir fotos individuales"
              className="w-10 h-10 rounded-xl border border-slate-300 text-slate-500 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition">
              <i className="fa-solid fa-images" />
            </button>
          </div>
        )}
      </div>

      {puedeSubir && upload && (
        <div className="panel p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Marca</label>
              <input value={upload.marca} onChange={e => setUpload(u => ({ ...u, marca: e.target.value }))}
                className="input-brand" placeholder="Ej. DELL" />
            </div>
            <div className="flex-1 min-w-52">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Modelo</label>
              <input value={upload.modelo} onChange={e => setUpload(u => ({ ...u, modelo: e.target.value }))}
                className="input-brand w-full" placeholder="Ej. Inspiron 15 3511" />
            </div>
            <button onClick={subir} disabled={subiendo}
              className="btn-brand px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 flex items-center gap-2">
              {subiendo ? <><i className="fa-solid fa-spinner fa-spin" /> Subiendo…</> : <><i className="fa-solid fa-cloud-arrow-up" /> Subir {upload.archivos.length} foto{upload.archivos.length === 1 ? '' : 's'}</>}
            </button>
          </div>
          {upload.carpeta && <p className="mt-2 text-xs text-slate-400">Carpeta: <b>{upload.carpeta}</b>{!upload.suelto && ' (marca/modelo detectados del nombre, edítalos si es necesario)'}</p>}
          <p className="mt-1 text-xs text-slate-400">{upload.archivos.length} archivo{upload.archivos.length === 1 ? '' : 's'} listo{upload.archivos.length === 1 ? '' : 's'}.</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por marca o modelo…"
          className="input-brand flex-1 min-w-52" />
        <select value={marcaFiltro} onChange={e => setMarcaFiltro(e.target.value)} className="input-brand">
          <option value="">Todas las marcas</option>
          {marcas.map(([m]) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {marcas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {marcas.map(([m, n]) => (
            <button key={m} onClick={() => setMarcaFiltro(marcaFiltro === m ? '' : m)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${marcaFiltro === m ? 'bg-brand-600 text-white border-brand-600' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              {m} · {n}
            </button>
          ))}
        </div>
      )}

      {carga ? (
        <div className="panel p-16 text-center text-slate-400"><i className="fa-solid fa-spinner fa-spin text-2xl" /></div>
      ) : filtrados.length === 0 ? (
        <div className="panel p-12 text-center text-slate-400">
          {puedeSubir ? 'Aún no hay fotos. Sube una carpeta con el nombre "Marca Modelo" para comenzar.' : 'Aún no hay fotos por modelo.'}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtrados.map(g => (
            <button key={g.clave} onClick={() => setSel(g)}
              className="group text-left rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition">
              <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                {g.miniatura ? (
                  <img src={g.miniatura} alt={g.modelo} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition" />
                ) : (
                  <i className="fa-solid fa-image text-3xl text-slate-300 dark:text-slate-700" />
                )}
              </div>
              <div className="p-3">
                <p className="text-xs font-bold text-brand-700 uppercase">{g.marca}</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{g.modelo}</p>
                <p className="text-xs text-slate-400 mt-0.5">{g.cantidad} foto{g.cantidad === 1 ? '' : 's'}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
