import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../componentes/Notification';
import useDocumentTitle from '../utils/useDocumentTitle';

export default function Login() {
  useDocumentTitle('Iniciar sesión');
  const { user, login } = useAuth();
  const { notify } = useNotify();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(usuario, password);
      notify('Bienvenido', `Sesión iniciada`, 'success');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const particles = [10, 20, 30, 40, 60, 70, 80, 90].map((left, i) => ({
    id: i, size: [10, 8, 6, 12, 12, 6, 8, 10][i], left, delay: i * 0.9, duration: [6, 7, 8, 9, 9, 8, 7, 6][i],
  }));

  return (
    <div className="login-screen login-grid min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {particles.map(p => (
        <div key={p.id} className="absolute rounded-full bg-white/8 animate-float"
          style={{ width: p.size, height: p.size, left: `${p.left}%`, bottom: '-10%', animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s` }} />
      ))}
      <div className="w-full max-w-md bg-white/95 rounded-3xl border border-white/20 p-8 sm:p-10 text-center shadow-2xl relative">
        <div className="flex justify-center mb-6">
          <img src="/logo-empresa.png" alt="JV COMPUTER" className="max-h-24 object-contain" />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent-500 mb-2">Control de Inventario TI</p>
        <h1 className="font-display text-3xl font-extrabold text-slate-900">EquipMaster</h1>
        <p className="text-slate-500 text-sm mt-2">React + Node.js · Misma base Firebase</p>

        <form onSubmit={handleSubmit} className="text-left space-y-4 mt-6">
          <div>
            <label className="form-label">Usuario</label>
            <input className="form-input" value={usuario} onChange={e => setUsuario(e.target.value)} required autoComplete="username" placeholder="Tu nombre de usuario" />
          </div>
          <div>
            <label className="form-label">Contraseña</label>
            <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required minLength={4} autoComplete="current-password" placeholder="••••••••" />
          </div>
          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
              <i className={`fa-solid fa-triangle-exclamation mt-0.5 ${error.includes('desactivada') ? 'fa-ban' : ''}`} />
              <span>{error}</span>
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-brand w-full text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-60">
            <i className="fa-solid fa-arrow-right-to-bracket mr-1" />
            {loading ? 'Procesando...' : 'Entrar al sistema'}
          </button>
        </form>
        <p className="text-[11px] text-slate-400 mt-6">JV COMPUTER · EquipMaster v3.0</p>
      </div>
    </div>
  );
}
