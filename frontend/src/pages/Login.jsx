import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../componentes/Notification';
import useDocumentTitle from '../utils/useDocumentTitle';

export default function Login() {
  useDocumentTitle('Iniciar sesión');
  const { user, login, register } = useAuth();
  const { notify } = useNotify();
  const [modo, setModo] = useState('login');
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (modo === 'register') {
        await register(usuario, password, confirm);
        notify('Cuenta creada', 'Ya puedes iniciar sesión.', 'success');
        setModo('login');
        setPassword('');
        setConfirm('');
      } else {
        await login(usuario, password);
        notify('Bienvenido', `Hola, ${usuario}`, 'success');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i, size: 6 + (i % 3) * 4, left: 10 + (i * 13) % 80, delay: i * 1.2, duration: 6 + (i % 4) * 2,
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

        <div className="flex rounded-xl bg-slate-100 p-1 mt-6 mb-6">
          <button type="button" onClick={() => { setModo('login'); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${modo === 'login' ? 'bg-white shadow-sm text-brand-700' : 'text-slate-500'}`}>
            Iniciar sesión
          </button>
          <button type="button" onClick={() => { setModo('register'); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${modo === 'register' ? 'bg-white shadow-sm text-brand-700' : 'text-slate-500'}`}>
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit} className="text-left space-y-4">
          <div>
            <label className="form-label">Usuario</label>
            <input className="form-input" value={usuario} onChange={e => setUsuario(e.target.value)} required autoComplete="username" placeholder="Tu nombre de usuario" />
          </div>
          <div>
            <label className="form-label">Contraseña</label>
            <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required minLength={4} autoComplete={modo === 'login' ? 'current-password' : 'new-password'} placeholder="••••••••" />
          </div>
          {modo === 'register' && (
            <div>
              <label className="form-label">Confirmar contraseña</label>
              <input type="password" className="form-input" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={4} placeholder="Repite la contraseña" />
            </div>
          )}
          {error && <p className="text-rose-600 text-sm font-medium">{error}</p>}
          <button type="submit" disabled={loading} className="btn-brand w-full text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-60">
            <i className={`fa-solid ${modo === 'login' ? 'fa-arrow-right-to-bracket' : 'fa-user-plus'} mr-1`} />
            {loading ? 'Procesando...' : modo === 'login' ? 'Entrar al sistema' : 'Crear cuenta'}
          </button>
        </form>
        <p className="text-[11px] text-slate-400 mt-6">JV COMPUTER · Sistema de inventario</p>
      </div>
    </div>
  );
}
