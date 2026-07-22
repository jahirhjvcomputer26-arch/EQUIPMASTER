import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref as dbRef, get } from 'firebase/database';
import { db } from '../services/firebase';
import { api } from '../services/api';
import { useNotify } from '../componentes/Notification';
import useDocumentTitle from '../utils/useDocumentTitle';

const DOC_CATEGORIES = [
  { key: 'compra', label: 'Compra / Factura', icon: 'fa-file-invoice-dollar', accept: '.pdf,.jpg,.png' },
  { key: 'venta', label: 'Venta / Nota de Venta', icon: 'fa-receipt', accept: '.pdf,.jpg,.png' },
  { key: 'garantia', label: 'Garantía', icon: 'fa-shield-halved', accept: '.pdf,.jpg,.png' },
  { key: 'reparacion', label: 'Orden de Reparación', icon: 'fa-wrench', accept: '.pdf,.jpg,.png' },
  { key: 'diagnostico', label: 'Diagnóstico', icon: 'fa-stethoscope', accept: '.pdf,.jpg,.png' },
  { key: 'devolucion', label: 'Devolución', icon: 'fa-rotate-left', accept: '.pdf,.jpg,.png' },
  { key: 'fichaTecnica', label: 'Ficha Técnica', icon: 'fa-file-lines', accept: '.pdf,.jpg,.png' },
  { key: 'otro', label: 'Otro Documento', icon: 'fa-file', accept: '.pdf,.jpg,.png,.doc,.docx' },
];

const MAX_DOC_SIZE = 10 * 1024 * 1024;

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function CentroDocumentacion() {
  useDocumentTitle('Centro de Documentos');
  const { codigo } = useParams();
  const navigate = useNavigate();
  const { notify: toast } = useNotify();
  const [item, setItem] = useState(null);
  const [docs, setDocs] = useState({});
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);

  const loadItem = useCallback(async () => {
    if (!codigo) return;
    try {
      const snap = await get(dbRef(db, `inventario/${codigo.toUpperCase()}`));
      if (snap.exists()) {
        const data = snap.val();
        setItem(data);
        setDocs(data.documentos || {});
      } else setError('Equipo no encontrado');
    } catch { setError('Error al cargar'); }
  }, [codigo]);

  useEffect(() => { loadItem(); }, [loadItem]);

  const handleUpload = async (categoria, files) => {
    if (!files?.length) return;
    const file = files[0];
    if (file.size > MAX_DOC_SIZE) {
      toast('Archivo muy grande', 'El máximo es 10 MB.', 'error');
      return;
    }
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      let docData;
      try {
        const result = await api.uploadFile({ codigo: codigo.toUpperCase(), categoria, archivo: base64, esDocumento: true });
        docData = { nombre: file.name, tipo: file.type, tamano: file.size, fecha: new Date().toISOString(), url: result.url };
      } catch {
        docData = { nombre: file.name, tipo: file.type, tamano: file.size, fecha: new Date().toISOString(), base64 };
      }
      const newDocs = { ...docs, [categoria]: [...(docs[categoria] || []), docData] };
      setDocs(newDocs);
      await api.saveEquipo(codigo.toUpperCase(), { ...item, documentos: newDocs });
      toast('Documento guardado', `${file.name} guardado.`, 'success');
    } catch {
      toast('Error', 'No se pudo guardar el documento.', 'error');
    }
    setUploading(false);
  };

  const handleDelete = async (categoria, idx) => {
    if (!window.confirm('¿Eliminar este documento?')) return;
    const doc = docs[categoria]?.[idx];
    try {
      if (doc?.url && (doc.url.includes('storage.googleapis.com') || doc.url.includes('firebasestorage'))) {
        try { await api.deleteFile(doc.path || `documentos/${codigo.toUpperCase()}/${doc.nombre}`); } catch {}
      }
      const updated = { ...docs };
      updated[categoria] = updated[categoria].filter((_, i) => i !== idx);
      if (updated[categoria].length === 0) delete updated[categoria];
      setDocs(updated);
      await api.saveEquipo(codigo.toUpperCase(), { ...item, documentos: updated });
      toast('Eliminado', 'Documento eliminado.', 'success');
      setPreviewDoc(null);
    } catch {
      toast('Error', 'No se pudo eliminar.', 'error');
    }
  };

  const getDocUrl = (doc) => doc.url || doc.base64;

  const totalDocs = Object.values(docs).reduce((acc, arr) => acc + (arr?.length || 0), 0);

  if (error) return <div className="min-h-screen flex items-center justify-center text-slate-500"><p>{error}</p></div>;
  if (!item) return <div className="min-h-screen flex items-center justify-center"><i className="fa-solid fa-spinner fa-spin text-2xl text-slate-400" /></div>;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-200 transition"><i className="fa-solid fa-arrow-left text-slate-600" /></button>
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900">Centro de Documentos</h2>
            <p className="text-slate-500 text-sm">{item.marca} {item.modelo} · {item.codigo} · {totalDocs} documento{totalDocs !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {DOC_CATEGORIES.map(cat => {
          const count = docs[cat.key]?.length || 0;
          return (
            <button key={cat.key} onClick={() => setActiveCategory(activeCategory === cat.key ? '' : cat.key)}
              className={`panel p-4 text-left transition-all hover:scale-[1.02] ${
                activeCategory === cat.key ? 'ring-2 ring-brand-500 border-brand-300' : ''
              }`}>
              <div className="flex items-center gap-2 mb-1">
                <i className={`fa-solid ${cat.icon} ${count > 0 ? 'text-brand-500' : 'text-slate-300'}`} />
                <span className="text-xs font-bold text-slate-700 truncate">{cat.label}</span>
              </div>
              <p className={`text-2xl font-extrabold ${count > 0 ? 'text-brand-600' : 'text-slate-200'}`}>{count}</p>
            </button>
          );
        })}
      </div>

      {activeCategory && (
        <div className="panel p-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800">
              <i className={`fa-solid ${DOC_CATEGORIES.find(c => c.key === activeCategory)?.icon} text-brand-500 mr-2`} />
              {DOC_CATEGORIES.find(c => c.key === activeCategory)?.label}
            </h3>
            <label className="btn-brand px-4 py-2 rounded-xl text-white text-xs font-bold cursor-pointer">
              <i className="fa-solid fa-upload mr-1" /> Subir
              <input type="file" className="hidden" accept={DOC_CATEGORIES.find(c => c.key === activeCategory)?.accept}
                onChange={e => { handleUpload(activeCategory, e.target.files); e.target.value = ''; }} disabled={uploading} />
            </label>
          </div>

          {docs[activeCategory]?.length > 0 ? (
            <div className="space-y-2">
              {docs[activeCategory].map((doc, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition">
                  <i className={`fa-solid ${doc.tipo?.includes('pdf') ? 'fa-file-pdf text-red-500' : 'fa-file-image text-blue-500'} text-lg`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700 truncate">{doc.nombre}</p>
                    <p className="text-[11px] text-slate-400">{new Date(doc.fecha).toLocaleString('es-MX')} · {(doc.tamano / 1024).toFixed(0)} KB</p>
                  </div>
                  <button onClick={() => setPreviewDoc({ ...doc, categoria: activeCategory })} className="p-2 rounded-lg hover:bg-white text-slate-400 hover:text-brand-600 transition">
                    <i className="fa-solid fa-eye" />
                  </button>
                  <button onClick={() => handleDelete(activeCategory, idx)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition">
                    <i className="fa-solid fa-trash" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <i className="fa-solid fa-cloud-arrow-up text-3xl mb-2 block" />
              <p className="text-sm">No hay documentos en esta categoría</p>
            </div>
          )}
        </div>
      )}

      {!activeCategory && (
        <div className="text-center py-12 text-slate-400">
          <i className="fa-solid fa-folder-open text-4xl mb-3 block" />
          <p className="text-sm">Selecciona una categoría arriba para ver o subir documentos</p>
        </div>
      )}

      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl max-h-[90vh] w-full overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-700 truncate">{previewDoc.nombre}</h4>
              <div className="flex items-center gap-2">
                <a href={getDocUrl(previewDoc)} download={previewDoc.nombre} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                  <i className="fa-solid fa-download" />
                </a>
                <button onClick={() => setPreviewDoc(null)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
            </div>
            <div className="overflow-auto max-h-[75vh] p-4">
              {previewDoc.tipo?.includes('pdf') ? (
                <iframe src={getDocUrl(previewDoc)} className="w-full h-[70vh] rounded-lg border" title={previewDoc.nombre} />
              ) : (
                <img src={getDocUrl(previewDoc)} alt={previewDoc.nombre} className="max-w-full mx-auto rounded-lg" />
              )}
            </div>
          </div>
        </div>
      )}

      {uploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 shadow-2xl text-center">
            <div className="animate-spin w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">Subiendo documento...</p>
          </div>
        </div>
      )}
    </section>
  );
}
