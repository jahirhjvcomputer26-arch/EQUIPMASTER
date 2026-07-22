import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../componentes/Notification';
import useDocumentTitle from '../utils/useDocumentTitle';

export default function Perfil() {
  useDocumentTitle('Mi Cuenta');
  const { user, logout, setNombre } = useAuth();
  const { notify } = useNotify();
  const navigate = useNavigate();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState(null);
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nombreInput, setNombreInput] = useState('');

  useEffect(() => {
    api.me().then(setInfo).catch(() => {});
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.cambiarPassword({ actual, nueva, confirmar });
      notify('Contraseña actualizada', 'Tu contraseña se cambió correctamente.', 'success');
      setActual(''); setNueva(''); setConfirmar('');
    } catch (err) {
      notify('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeName = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.cambiarNombre({ nombre: nombreInput });
      localStorage.setItem('equipmaster_token', res.token);
      setNombre(res.nombre);
      notify('Nombre actualizado', 'Tu nombre de usuario se cambió correctamente.', 'success');
      setEditandoNombre(false);
    } catch (err) {
      notify('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <section className="space-y-6 animate-fade-in max-w-2xl">
      <div className="animate-slide-up">
        <h2 className="font-display text-2xl font-bold text-slate-900">Mi Cuenta</h2>
        <p className="text-slate-500 text-sm">Información y seguridad</p>
      </div>

      <div className="panel p-6 md:p-8 space-y-4 animate-slide-up" style={{ animationDelay: '50ms' }}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {(user?.nombre || '?')[0]}
          </div>
          <div className="flex-1">
            {editandoNombre ? (
              <form onSubmit={handleChangeName} className="flex items-center gap-2">
                <input className="form-input py-1.5 text-sm flex-1" value={nombreInput} onChange={e => setNombreInput(e.target.value)} required minLength={3} autoFocus />
                <button type="submit" disabled={loading} className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition"><i className="fa-solid fa-check" /></button>
                <button type="button" onClick={() => setEditandoNombre(false)} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition"><i className="fa-solid fa-xmark" /></button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-900">{user?.nombre || 'Usuario'}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${user?.rol === 'admin' ? 'bg-blue-100 text-blue-700' : user?.rol === 'ventas' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{user?.rol === 'admin' ? 'Administrador' : user?.rol === 'ventas' ? 'Ventas' : 'Técnico'}</span>
                  </div>
                  <p className="text-sm text-slate-500">
                    {info?.creado ? `Usuario desde ${new Date(info.creado).toLocaleDateString()}` : 'Miembro del sistema'}
                  </p>
                </div>
                <button onClick={() => { setNombreInput(user?.nombre || ''); setEditandoNombre(true); }} className="text-slate-400 hover:text-brand-600 text-sm transition-colors ml-2" title="Editar nombre">
                  <i className="fa-solid fa-pen" />
                </button>
              </div>
            )}
          </div>
        </div>
        <button onClick={handleLogout} className="px-5 py-2.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 text-sm font-bold transition">
          <i className="fa-solid fa-right-from-bracket mr-1" /> Cerrar sesión
        </button>
      </div>

      <div className="panel p-6 md:p-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <h3 className="text-lg font-bold text-slate-900 mb-5"><i className="fa-solid fa-lock mr-1" /> Cambiar contraseña</h3>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div><label className="form-label">Contraseña actual *</label>
            <input type="password" className="form-input" value={actual} onChange={e => setActual(e.target.value)} required placeholder="••••••••" /></div>
          <div><label className="form-label">Nueva contraseña *</label>
            <input type="password" className="form-input" value={nueva} onChange={e => setNueva(e.target.value)} required minLength={4} placeholder="Mínimo 4 caracteres" /></div>
          <div><label className="form-label">Confirmar nueva *</label>
            <input type="password" className="form-input" value={confirmar} onChange={e => setConfirmar(e.target.value)} required minLength={4} placeholder="Repite la contraseña" /></div>
          <button type="submit" disabled={loading} className="btn-brand text-white px-6 py-3 rounded-xl text-sm font-bold disabled:opacity-60">
            {loading ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </form>
      </div>
    </section>
  );
}
