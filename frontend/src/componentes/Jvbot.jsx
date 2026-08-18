import { useState } from 'react';
import { api } from '../services/api';

const quickActions = [
  ['Analizar inventario', 'Analiza mi inventario'],
  ['Poco stock', '¿Qué productos tienen poco stock?'],
  ['Buscar producto', 'Busca ThinkPad'],
  ['Más antiguos', '¿Qué productos llevan más tiempo almacenados?'],
];

export default function Jvbot() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([]);

  async function send(value = message) {
    const text = value.trim();
    if (!text || busy) return;
    const history = messages.map(item => ({
      role: item.role,
      content: item.data ? `${item.content}\n[Datos verificados de este turno: ${JSON.stringify(item.data)}]` : item.content,
    }));
    setMessages(current => [...current, { role: 'user', content: text }]);
    setMessage(''); setBusy(true);
    try {
      const result = await api.jvbotChat(text, history);
      setMessages(current => [...current, { role: 'assistant', content: result.answer, tool: result.tool, data: result.data }]);
    } catch (error) {
      setMessages(current => [...current, { role: 'assistant', content: error.message || 'No pude consultar EquipMaster.' }]);
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 no-print">
      {open && (
        <section className="jvbot-window glass-panel animate-slide-up mb-3 flex h-[min(650px,calc(100vh-7rem))] w-[min(410px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-indigo-200 shadow-2xl dark:border-slate-700">
          <header className="flex items-center gap-3 bg-brand-900 px-5 py-4 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500 text-lg">✦</div>
            <div className="flex-1"><p className="font-display font-bold">JVBOT</p><p className="text-[10px] uppercase tracking-widest text-indigo-200">Capa inteligente de EquipMaster</p></div>
            <button onClick={() => setOpen(false)} aria-label="Minimizar JVBOT" className="rounded-lg px-2 py-1 text-indigo-200 hover:bg-white/10">−</button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && <div className="rounded-2xl bg-indigo-50 p-4 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200"><p className="font-bold">¿Qué quieres analizar?</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Consultaré los datos actuales y no inventaré información.</p><div className="mt-3 grid grid-cols-2 gap-2">{quickActions.map(([label, query]) => <button key={label} onClick={() => send(query)} className="rounded-xl border border-indigo-100 bg-white px-2 py-2 text-left text-[11px] font-bold text-brand-700 hover:border-brand-400 dark:border-slate-600 dark:bg-slate-900 dark:text-indigo-300">{label}</button>)}</div></div>}
            {messages.map((item, index) => <div key={index} className={`max-w-[92%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm ${item.role === 'user' ? 'ml-auto bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>{item.content}</div>)}
            {busy && <div className="text-xs text-slate-400">Consultando EquipMaster...</div>}
          </div>
          <form onSubmit={event => { event.preventDefault(); send(); }} className="flex gap-2 border-t border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/70">
            <input value={message} onChange={event => setMessage(event.target.value)} placeholder="Escribe una consulta..." className="form-input" maxLength={1000} aria-label="Mensaje para JVBOT" />
            <button disabled={busy || !message.trim()} className="btn-brand w-11 shrink-0 rounded-xl text-white disabled:opacity-50" aria-label="Enviar"><i className="fa-solid fa-arrow-up" /></button>
          </form>
        </section>
      )}
      {!open && <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-2xl bg-brand-900 px-4 py-3 font-bold text-white shadow-xl transition hover:-translate-y-1 hover:bg-brand-700" aria-label="Abrir JVBOT"><span className="text-lg text-accent-500">✦</span> JVBOT</button>}
    </div>
  );
}
