import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useNotify } from '../componentes/Notification';
import useDocumentTitle from '../utils/useDocumentTitle';
import CameraCapture from '../componentes/CameraCapture';

const CATEGORIAS = [
  { key: 'frente', label: 'Frente', icon: 'fa-laptop' },
  { key: 'posterior', label: 'Posterior', icon: 'fa-rotate-left' },
  { key: 'laterales', label: 'Laterales', icon: 'fa-arrows-left-right' },
  { key: 'pantalla', label: 'Pantalla', icon: 'fa-desktop' },
  { key: 'teclado', label: 'Teclado', icon: 'fa-keyboard' },
  { key: 'bios', label: 'BIOS', icon: 'fa-microchip' },
  { key: 'crystalDiskInfo', label: 'CrystalDiskInfo', icon: 'fa-hard-drive' },
  { key: 'bateria', label: 'Batería', icon: 'fa-battery-three-quarters' },
  { key: 'etiquetas', label: 'Etiquetas', icon: 'fa-tag' },
];

const MAX_SIZE = 800;
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

export default function Galeria() {
  useDocumentTitle('Galería Fotográfica');
  const { codigo } = useParams();
  const navigate = useNavigate();
  const { notify: toast } = useNotify();
  const multiRef = useRef(null);
  const [item, setItem] = useState(null);
  const [fotos, setFotos] = useState({});
  const [uploading, setUploading] = useState(false);
  const [uploadInfo, setUploadInfo] = useState('');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [cameraCat, setCameraCat] = useState(null);

  const loadItem = useCallback(async () => {
    try {
      const data = await api.getEquipo(codigo?.toUpperCase());
      setItem(data);
      setFotos(data.fotos || {});
    } catch { setError('Equipo no encontrado'); }
  }, [codigo]);

  useEffect(() => { if (codigo) loadItem(); }, [codigo, loadItem]);

  const handleUpload = async (categoria, files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const base64 = await resizeImage(files[0]);
      const result = await api.uploadFile({ codigo: codigo.toUpperCase(), categoria, archivo: base64, esDocumento: false });
      const newFotos = { ...fotos, [categoria]: result.url };
      setFotos(newFotos);
      await api.saveEquipo(codigo.toUpperCase(), { ...item, fotos: newFotos });
      toast('Foto guardada', `${categoria.toUpperCase()} subida a Storage.`, 'success');
    } catch (err) {
      toast('Error', err.message, 'error');
    }
    setUploading(false);
  };

  const handleDelete = async (categoria) => {
    if (!window.confirm(`¿Eliminar foto de ${categoria}?`)) return;
    try {
      const url = fotos[categoria];
      if (url?.includes('storage.googleapis.com') || url?.includes('firebasestorage')) {
        try {
          const ext = (url.split('.').pop()?.split('?')[0]) || 'jpg';
          await api.deleteFile(`fotos/${codigo.toUpperCase()}/${categoria}.${ext}`);
        } catch {}
      } else if (url?.startsWith('/archivos/')) {
        try { await api.deleteFile(url.slice('/archivos/'.length)); } catch {}
      }
      const newFotos = { ...fotos };
      delete newFotos[categoria];
      setFotos(newFotos);
      await api.saveEquipo(codigo.toUpperCase(), { ...item, fotos: newFotos });
      toast('Foto eliminada', `${categoria.toUpperCase()} eliminada.`, 'success');
    } catch (err) {
      toast('Error', err.message, 'error');
    }
  };

  const handleMultiUpload = async (files) => {
    if (!files?.length) return;
    const vacias = CATEGORIAS.filter(c => !fotos[c.key]);
    if (!vacias.length) { toast('Sin espacios', 'Todas las categorías ya tienen foto. Elimina alguna primero.', 'warning'); return; }
    setUploading(true);
    const toUpload = Math.min(files.length, vacias.length);
    let current = { ...fotos };
    for (let i = 0; i < toUpload; i++) {
      setUploadInfo(`Subiendo ${i + 1} de ${toUpload}...`);
      try {
        const base64 = await resizeImage(files[i]);
        const result = await api.uploadFile({ codigo: codigo.toUpperCase(), categoria: vacias[i].key, archivo: base64, esDocumento: false });
        current = { ...current, [vacias[i].key]: result.url };
        setFotos(current);
        await api.saveEquipo(codigo.toUpperCase(), { ...item, fotos: current });
      } catch (err) {
        toast('Error', `${vacias[i].label}: ${err.message}`, 'error');
      }
    }
    setUploadInfo('');
    setUploading(false);
    if (toUpload < files.length) toast('Algunas no se subieron', `Solo hay ${vacias.length} categorías vacías. Se subieron ${toUpload} de ${files.length} fotos.`, 'info');
    else toast('Fotos subidas', `${toUpload} fotos asignadas secuencialmente.`, 'success');
  };

  if (error) return (
    <section className="p-8 text-center">
      <i className="fa-solid fa-triangle-exclamation text-4xl text-red-400 mb-4 block" />
      <p className="text-slate-500">{error}</p>
      <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-bold">Volver</button>
    </section>
  );

  if (!item) return (
    <section className="p-8 text-center">
      <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full mx-auto" />
    </section>
  );

  return (
    <section className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">
            <i className="fa-solid fa-camera text-brand-500 mr-2" />Galería Fotográfica
          </h2>
          <p className="text-slate-500 text-sm">{item.marca} {item.modelo} · {item.codigo}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => multiRef.current?.click()} className="px-4 py-2 border border-dashed border-brand-300 text-brand-600 rounded-xl text-sm font-bold hover:bg-brand-50 transition flex items-center gap-2">
            <i className="fa-solid fa-layer-group" /> Cargar varias
          </button>
          <button onClick={() => navigate(-1)} className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">
            <i className="fa-solid fa-arrow-left mr-1" /> Volver
          </button>
        </div>
        <input ref={multiRef} type="file" accept="image/*" multiple className="hidden" onChange={e => { handleMultiUpload(e.target.files); e.target.value = ''; }} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {CATEGORIAS.map(cat => (
          <div key={cat.key} className="panel overflow-hidden hover:shadow-lg transition-all duration-300 animate-slide-up group">
            <div className="relative aspect-video bg-slate-100 flex items-center justify-center overflow-hidden">
              {fotos[cat.key] ? (
                <>
                  <img src={fotos[cat.key]} alt={cat.label} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                    <button onClick={() => setPreview({ url: fotos[cat.key], label: cat.label })}
                      className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center text-brand-600 hover:scale-110 transition shadow-lg">
                      <i className="fa-solid fa-expand" />
                    </button>
                    <button onClick={() => handleDelete(cat.key)}
                      className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center text-red-500 hover:scale-110 transition shadow-lg">
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                </>
              ) : (
                <button onClick={async () => {
                  if (!navigator.mediaDevices?.getUserMedia) { setCameraCat(cat.key); return; }
                  try {
                    const tmp = await navigator.mediaDevices.getUserMedia({ video: true });
                    tmp.getTracks().forEach(t => t.stop());
                  } catch {}
                  setCameraCat(cat.key);
                }} disabled={uploading} className="flex flex-col items-center gap-2 cursor-pointer w-full h-full justify-center hover:bg-slate-200/50 transition">
                  <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-400 flex items-center justify-center">
                    <i className="fa-solid fa-camera text-lg" />
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Sin foto</span>
                </button>
              )}
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <i className={`fa-solid ${cat.icon} text-brand-500 text-sm`} />
                <span className="text-sm font-bold text-slate-700">{cat.label}</span>
              </div>
              {fotos[cat.key] && (
                <button onClick={async () => {
                  if (!navigator.mediaDevices?.getUserMedia) { setCameraCat(cat.key); return; }
                  try {
                    const tmp = await navigator.mediaDevices.getUserMedia({ video: true });
                    tmp.getTracks().forEach(t => t.stop());
                  } catch {}
                  setCameraCat(cat.key);
                }} className="cursor-pointer px-3 py-1 rounded-lg bg-brand-50 text-brand-600 text-xs font-bold hover:bg-brand-100 transition">
                  <i className="fa-solid fa-refresh mr-1" /> Cambiar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-fade-in" onClick={() => setPreview(null)}>
          <div className="relative max-w-4xl max-h-[90vh] mx-4" onClick={e => e.stopPropagation()}>
            <img src={preview.url} alt={preview.label} className="rounded-2xl shadow-2xl max-h-[85vh] object-contain" />
            <button onClick={() => setPreview(null)} className="absolute -top-3 -right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg text-slate-600 hover:text-red-500 transition">
              <i className="fa-solid fa-xmark" />
            </button>
            <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-lg text-sm font-bold">{preview.label}</div>
          </div>
        </div>
      )}

      {uploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 shadow-2xl text-center">
            <div className="animate-spin w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">{uploadInfo || 'Subiendo imagen...'}</p>
          </div>
        </div>
      )}

      {cameraCat && (
        <CameraCapture
          onCapture={file => {
            handleUpload(cameraCat, [file]);
            setCameraCat(null);
          }}
          onClose={() => setCameraCat(null)}
        />
      )}
    </section>
  );
}
