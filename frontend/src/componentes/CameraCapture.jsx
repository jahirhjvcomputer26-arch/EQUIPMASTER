import { useState, useRef, useEffect } from 'react';

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileRef = useRef(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Tu navegador no soporta acceso a cámara o la página no está en un contexto seguro (HTTPS).');
      return;
    }
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled && !streamRef.current) {
        setError('La cámara no respondió. Revisa que no esté siendo usada por otra aplicación.');
      }
    }, 10000);

    navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1920 }, height: { ideal: 1080 } } })
      .then(stream => {
        clearTimeout(timeout);
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(e => {
        clearTimeout(timeout);
        if (!cancelled) setError('No se pudo abrir la cámara. ' + (e.name === 'NotAllowedError' ? 'Permiso denegado. Concede acceso a la cámara e intenta de nuevo.' : e.name === 'NotFoundError' ? 'No se encontró una cámara.' : 'Asegúrate de tener una cámara conectada y permisos concedidos.'));
      });
    return () => { cancelled = true; clearTimeout(timeout); };
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], `foto_${Date.now()}.jpg`, { type: 'image/jpeg' });
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      onCapture(file);
    }, 'image/jpeg', 0.85);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-black rounded-2xl overflow-hidden shadow-2xl">
        {error ? (
          <div className="flex flex-col items-center gap-4 p-8 text-white text-center">
            <i className="fa-solid fa-camera-slash text-5xl text-red-400" />
            <p className="text-sm">{error}</p>
            <div className="flex gap-3 mt-2">
              <button type="button" onClick={() => fileRef.current?.click()} className="px-5 py-2 bg-white/20 rounded-xl text-sm font-bold hover:bg-white/30 transition flex items-center gap-2">
                <i className="fa-solid fa-image" /> Subir archivo
              </button>
              <button type="button" onClick={onClose} className="px-5 py-2 bg-white/10 rounded-xl text-sm font-bold hover:bg-white/20 transition">Cerrar</button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => {
              if (e.target.files?.length) onCapture(e.target.files[0]);
            }} />
          </div>
        ) : (
          <div className="relative">
            {!ready && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-white/60 bg-black">
                <div className="animate-spin w-10 h-10 border-4 border-white/30 border-t-white rounded-full" />
                <p className="text-sm">Abriendo cámara...</p>
              </div>
            )}
            <video ref={videoRef} autoPlay playsInline muted
              className="w-full aspect-[4/3] object-cover bg-black"
              onPlaying={() => setReady(true)}
              onCanPlay={() => setReady(true)}
            />
            <div className="absolute bottom-0 inset-x-0 p-4 flex items-center justify-center gap-6 bg-gradient-to-t from-black/60 to-transparent">
              <button type="button" onClick={capture} disabled={!ready} className={`w-16 h-16 rounded-full border-4 border-white flex items-center justify-center transition ${ready ? 'bg-white/20 hover:bg-white/30' : 'bg-white/5 opacity-40 cursor-not-allowed'}`}>
                <div className={`w-12 h-12 rounded-full ${ready ? 'bg-white' : 'bg-white/30'}`} />
              </button>
            </div>
            <button type="button" onClick={onClose} className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition z-10">
              <i className="fa-solid fa-xmark text-xl" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
