import { useState, useRef, useEffect } from 'react';

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } })
      .then(stream => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setError('No se pudo abrir la cámara. Asegúrate de tener una cámara conectada y permisos concedidos.'));
    return () => { cancelled = true; };
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
            <button type="button" onClick={onClose} className="px-6 py-2 bg-white/20 rounded-xl text-sm font-bold hover:bg-white/30 transition">Cerrar</button>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-[4/3] object-cover bg-black" />
            <div className="absolute bottom-0 inset-x-0 p-4 flex items-center justify-center gap-6 bg-gradient-to-t from-black/60 to-transparent">
              <button type="button" onClick={capture} className="w-16 h-16 rounded-full border-4 border-white bg-white/20 flex items-center justify-center hover:bg-white/30 transition">
                <div className="w-12 h-12 rounded-full bg-white" />
              </button>
            </div>
            <button type="button" onClick={onClose} className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition z-10">
              <i className="fa-solid fa-xmark text-xl" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
