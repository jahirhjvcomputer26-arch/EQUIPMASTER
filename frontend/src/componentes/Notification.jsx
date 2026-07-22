import { createContext, useContext, useEffect, useState } from 'react';

const NotifyContext = createContext(null);

export function NotifyProvider({ children }) {
  const [toast, setToast] = useState(null);

  const notify = (title, desc, type = 'success') => {
    setToast({ title, desc, type, time: Date.now() });
  };

  const dismiss = () => setToast(null);

  return (
    <NotifyContext.Provider value={{ notify }}>
      {children}
      {toast && <ToastItem toast={toast} onDone={dismiss} />}
    </NotifyContext.Provider>
  );
}

function ToastItem({ toast, onDone }) {
  const [progress, setProgress] = useState(100);
  const dur = 4000;

  useEffect(() => {
    setProgress(100);
    const start = performance.now();
    const id = requestAnimationFrame(function tick(now) {
      const elapsed = now - start;
      const pct = Math.max(0, 100 - (elapsed / dur) * 100);
      setProgress(pct);
      if (pct <= 0) { onDone(); return; }
      requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(id);
  }, [toast.time]);

  const isErr = toast.type === 'error';
  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-slide-in-right">
      <div className={`rounded-xl shadow-2xl px-5 py-4 border max-w-sm relative overflow-hidden ${
        isErr ? 'bg-rose-950 text-rose-100 border-rose-800' : 'bg-slate-900 text-white border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0 ${
            isErr ? 'bg-rose-800/50 text-rose-300' : 'bg-emerald-800/50 text-emerald-300'
          }`}>
            <i className={`fa-solid ${isErr ? 'fa-circle-exclamation' : 'fa-check'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">{toast.title}</p>
            <p className="text-xs opacity-80 truncate">{toast.desc}</p>
          </div>
          <button onClick={onDone} className="opacity-50 hover:opacity-100 transition">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div className={`h-full transition-none ${isErr ? 'bg-rose-400' : 'bg-emerald-400'}`}
            style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}

export function useNotify() {
  return useContext(NotifyContext);
}
