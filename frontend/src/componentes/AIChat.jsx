import { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';

export default function AIChat() {
  const [open, setOpen] = useState(false);
  const [mensajes, setMensajes] = useState([{ rol: 'ia', texto: '¡Hola! Soy el asistente de EquipMaster. Pregúntame sobre el inventario, estadísticas, o necesitas un diagnóstico.' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 100); }, [open]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [mensajes]);

  const enviar = async (e) => {
    e?.preventDefault();
    const txt = input.trim();
    if (!txt || loading) return;
    setInput('');
    setMensajes(m => [...m, { rol: 'user', texto: txt }]);
    setLoading(true);
    try {
      const res = await fetch('/api/ia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('equipmaster_token')}` },
        body: JSON.stringify({ mensaje: txt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMensajes(m => [...m, { rol: 'ia', texto: data.respuesta }]);
    } catch (err) {
      setMensajes(m => [...m, { rol: 'ia', texto: 'Lo siento, ocurrió un error. ¿Está configurada GEMINI_API_KEY?' }]);
    }
    setLoading(false);
  };

  const diagnosticoRapido = async () => {
    const txt = input.trim();
    if (!txt || loading) return;
    setInput('');
    setMensajes(m => [...m, { rol: 'user', texto: `Diagnóstico: ${txt}` }]);
    setLoading(true);
    try {
      const res = await fetch('/api/ia/diagnostico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('equipmaster_token')}` },
        body: JSON.stringify({ sintomas: txt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMensajes(m => [...m, { rol: 'ia', texto: data.diagnostico }]);
    } catch {
      setMensajes(m => [...m, { rol: 'ia', texto: 'Error al obtener diagnóstico.' }]);
    }
    setLoading(false);
  };

  return (
    <>
      <button onClick={() => setOpen(!open)} className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-brand-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center text-xl" title="Asistente IA">
        <i className={`fa-solid ${open ? 'fa-xmark' : 'fa-robot'}`} />
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-80 sm:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-slide-up">
          <div className="bg-gradient-to-r from-brand-600 to-indigo-600 px-4 py-3 flex items-center gap-3">
            <i className="fa-solid fa-robot text-white text-lg" />
            <div>
              <p className="text-white font-bold text-sm">Asistente IA</p>
              <p className="text-brand-100 text-[10px]">EquipMaster · Gemini</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {mensajes.map((m, i) => (
              <div key={i} className={`flex ${m.rol === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${m.rol === 'user' ? 'bg-brand-600 text-white rounded-br-md' : 'bg-slate-100 text-slate-800 rounded-bl-md'}`}>
                  {m.texto}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 px-4 py-2 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={enviar} className="border-t border-slate-200 p-3 flex gap-2">
            <button type="button" onClick={diagnosticoRapido} title="Diagnóstico rápido" className="shrink-0 w-9 h-9 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 flex items-center justify-center text-sm transition" disabled={loading}>
              <i className="fa-solid fa-stethoscope" />
            </button>
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} placeholder="Pregunta algo..." className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400" disabled={loading} />
            <button type="submit" className="shrink-0 w-9 h-9 rounded-xl bg-brand-600 text-white hover:bg-brand-700 flex items-center justify-center text-sm transition" disabled={loading || !input.trim()}>
              <i className="fa-solid fa-paper-plane" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
