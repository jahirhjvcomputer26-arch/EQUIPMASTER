import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotify } from './Notification';

export default function QRScanner() {
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const { notify } = useNotify();

  const startScanner = async () => {
    if (!containerRef.current) return;
    setScanning(true);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          handleResult(decodedText);
        },
        () => {}
      );
    } catch (err) {
      setScanning(false);
      notify('Error cámara', 'No se pudo acceder a la cámara. Verifica permisos.', 'error');
      setOpen(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleResult = async (text) => {
    await stopScanner();
    setOpen(false);

    const code = text.trim().toUpperCase();

    if (code.startsWith('INV-')) {
      navigate(`/inventario?editar=${code}`);
      notify('Equipo encontrado', `Abriendo ${code}...`, 'success');
      return;
    }

    if (code.includes('/consulta?q=')) {
      const url = new URL(code.startsWith('http') ? code : window.location.origin + code);
      const q = url.searchParams.get('q');
      if (q) {
        navigate(`/base-de-datos?search=${encodeURIComponent(q)}`);
        notify('Búsqueda', `Buscando serie: ${q}`, 'success');
        return;
      }
    }

    navigate(`/base-de-datos?search=${encodeURIComponent(code)}`);
    notify('Búsqueda', `Buscando: ${code}`, 'success');
  };

  useEffect(() => {
    if (open) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => { stopScanner(); };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 sm:bottom-8 sm:right-8 z-40 w-14 h-14 rounded-full bg-brand-600 hover:bg-brand-700 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-110 flex items-center justify-center"
        title="Escanear código QR"
      >
        <i className="fa-solid fa-qrcode text-xl" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <i className="fa-solid fa-qrcode text-brand-600" /> Escanear QR
              </h3>
              <button onClick={() => setOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg transition">
                <i className="fa-solid fa-xmark text-slate-500" />
              </button>
            </div>

            <div className="relative bg-black aspect-square">
              <div id="qr-reader" ref={containerRef} className="w-full h-full" />
              {scanning && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-brand-500 animate-pulse rounded-full" />
                </div>
              )}
              {!scanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white/70">
                    <i className="fa-solid fa-camera text-4xl mb-3 block" />
                    <p className="text-sm">Iniciando cámara...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 text-center">
              <p className="text-xs text-slate-500">Apunta la cámara al código QR de la etiqueta del equipo</p>
              <p className="text-[10px] text-slate-400 mt-1">Se detectará automáticamente y abrirá el equipo</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
