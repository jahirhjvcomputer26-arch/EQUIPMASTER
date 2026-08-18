import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../componentes/Notification';
import useDocumentTitle from '../utils/useDocumentTitle';
import CameraCapture from '../componentes/CameraCapture';
import { fotosList, pathFromFotoUrl } from '../utils/inventario';

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
  const { user } = useAuth();
  const { notify: toast } = useNotify();
  const multiRef = useRef(null);
  const [item, setItem] = useState(null);
  const [fotos, setFotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadInfo, setUploadInfo] = useState('');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);

  const loadItem = useCallback(async () => {
    try {
      const data = user ? await api.getEquipo(codigo?.toUpperCase()) : await api.getEquipoPublico(codigo?.toUpperCase());
      setItem(data);
      setFotos(fotosList(data.fotos));
    } catch { setError('Equipo no encontrado'); }
  }, [codigo, user]);

  useEffect(() => { if (codigo) loadItem(); }, [codigo, loadItem]);

  const handleUpload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    let ok = 0;
    const lista = Array.from(files);
    for (let i = 0; i < lista.length; i++) {
      setUploadInfo(`Subiendo ${i + 1} de ${lista.length}...`);
      try {
        const base64 = await resizeImage(lista[i]);
        const result = await api.uploadFile({ codigo: codigo.toUpperCase(), archivo: base64, esDocumento: false, nombre: lista[i].name });
        const newFotos = [...fotosList(fotos), { url: result.url, path: result.path, nombre: result.nombre || lista[i].name }];
        setFotos(newFotos);
        await api.saveEquipo(codigo.toUpperCase(), { ...item, fotos: newFotos });
        ok++;
      } catch (err) {
        toast('Error', `${lista[i].name}: ${err.message}`, 'error');
      }
    }
    setUploadInfo('');
    setUploading(false);
    if (ok) toast('Fotos subidas', `${ok} foto${ok === 1 ? '' : 's'} guardada${ok === 1 ? '' : 's'}.`, 'success');
  };

  const handleDelete = async (foto) => {
    if (!window.confirm('¿Eliminar esta foto?')) return;
    try {
      const path = foto?.path || pathFromFotoUrl(foto?.url);
      if (path) {
        try { await api.deleteFile(path); } catch {}
      }
      const newFotos = fotosList(fotos).filter(f => f.url !== foto.url);
      setFotos(newFotos);
      await api.saveEquipo(codigo.toUpperCase(), { ...item, fotos: newFotos });
      toast('Foto eliminada', 'Eliminada de la galería.', 'success');
    } catch (err) {
      toast('Error', err.message, 'error');
    }
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
          <p className="text-slate-500 text-sm">{item.marca} {item.modelo} · {item.codigo} · {fotos.length} foto(s)</p>
        </div>
        <div className="flex gap-2">
          {user && (
            <>
              <button onClick={() => multiRef.current?.click()} disabled={uploading} className="px-4 py-2 border border-dashed border-brand-300 text-brand-600 rounded-xl text-sm font-bold hover:bg-brand-50 transition flex items-center gap-2 disabled:opacity-50">
                <i className="fa-solid fa-images" /> Cargar fotos
              </button>
              <button onClick={async () => {
                if (navigator.mediaDevices?.getUserMedia) {
                  try {
                    const tmp = await navigator.mediaDevices.getUserMedia({ video: true });
                    tmp.getTracks().forEach(t => t.stop());
                  } catch {}
                }
                setCameraOpen(true);
              }} disabled={uploading} className="px-4 py-2 border border-dashed border-brand-300 text-brand-600 rounded-xl text-sm font-bold hover:bg-brand-50 transition flex items-center gap-2 disabled:opacity-50">
                <i className="fa-solid fa-camera" /> Cámara
              </button>
            </>
          )}
          <button onClick={() => navigate(-1)} className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">
            <i className="fa-solid fa-arrow-left mr-1" /> Volver
          </button>
        </div>
        <input ref={multiRef} type="file" accept="image/*" multiple className="hidden" onChange={e => { handleUpload(e.target.files); e.target.value = ''; }} />
      </div>

      {fotos.length === 0 ? (
        <div className="panel p-12 text-center rounded-2xl border-2 border-dashed border-slate-200">
          <i className="fa-solid fa-camera-retro text-4xl text-slate-300 mb-4 block" />
          <p className="text-slate-400 text-sm">Este equipo aún no tiene fotos. Sube las que quieras (daños, etiquetas, pantalla...).</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {fotos.map((f, i) => (
            <div key={f.url || `f${i}`} className="panel overflow-hidden hover:shadow-lg transition-all duration-300 animate-slide-up group">
              <div className="relative aspect-video bg-slate-100 flex items-center justify-center overflow-hidden">
                <img src={f.url} alt={f.nombre || 'foto'} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                  <button onClick={() => setPreview({ url: f.url, label: f.nombre || `Foto ${i + 1}` })}
                    className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center text-brand-600 hover:scale-110 transition shadow-lg">
                    <i className="fa-solid fa-expand" />
                  </button>
                  {user && (
                    <button onClick={() => handleDelete(f)}
                      className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center text-red-500 hover:scale-110 transition shadow-lg">
                      <i className="fa-solid fa-trash" />
                    </button>
                  )}
                </div>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-image text-brand-500 text-sm" />
                  <span className="text-sm font-bold text-slate-700">{f.nombre || `Foto ${i + 1}`}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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

      {cameraOpen && (
        <CameraCapture
          onCapture={file => {
            handleUpload([file]);
            setCameraOpen(false);
          }}
          onClose={() => setCameraOpen(false)}
        />
      )}
    </section>
  );
}
