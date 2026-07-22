import { useEffect, useState } from 'react';

export default function LoadingScreen() {
  const [show, setShow] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 1200);
    const hide = setTimeout(() => setShow(false), 1500);
    return () => { clearTimeout(timer); clearTimeout(hide); };
  }, []);

  if (!show) return null;

  return (
    <div className={"fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 " + (fadeOut ? 'opacity-0' : 'opacity-100')}
      style={{ background: 'linear-gradient(135deg, #000856 0%, #0018B0 50%, #000856 100%)' }}>
      <div className="relative flex flex-col items-center">
        <img src="/splash.png" alt="JV COMPUTER" className="max-h-48 w-auto object-contain mb-8 animate-fade-in" />
        <div className="flex justify-center gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-3 h-3 rounded-full bg-accent-500 animate-ping-dot"
              style={{ animationDelay: i * 0.2 + 's' }} />
          ))}
        </div>
      </div>
      <p className="text-white/60 text-sm mt-8 font-medium tracking-wider">Cargando...</p>
    </div>
  );
}
