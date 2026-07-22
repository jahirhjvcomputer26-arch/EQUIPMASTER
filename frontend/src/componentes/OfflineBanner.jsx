import { useEffect, useState } from 'react';

export default function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    const handleOnline = () => { setOnline(true); setShowRestored(true); setTimeout(() => setShowRestored(false), 3000); };
    const handleOffline = () => { setOnline(false); setShowRestored(false); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  if (online && !showRestored) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-[100] px-4 py-2 text-center text-sm font-bold transition-all duration-300 ${
      online ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
    }`}>
      <i className={`fa-solid ${online ? 'fa-wifi' : 'fa-plane'} mr-2`} />
      {online ? 'Conexión restaurada' : 'Sin conexión — Modo offline activo'}
    </div>
  );
}
