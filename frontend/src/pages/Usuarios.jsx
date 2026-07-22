import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../componentes/Notification';
import useDocumentTitle from '../utils/useDocumentTitle';

const rolLabels = { admin: 'Administrador', tecnico: 'Técnico', ventas: 'Ventas' };
const rolColors = { admin: 'bg-blue-100 text-blue-700', tecnico: 'bg-emerald-100 text-emerald-700', ventas: 'bg-amber-100 text-amber-700' };

export default function Usuarios() {
  useDocumentTitle('Gestión de Usuarios');
  const { user } = useAuth();
  const { notify } = useNotify();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [nuevoRol, setNuevoRol] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const cargar = async () => {
    try {
      const data = await api.getUsuarios();
      setUsuarios(data);
    } catch (err) {
      notify('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const handleUpdateRol = async (usuario) => {
    try {
      await api.updateRol({ usuario, rol: nuevoRol });
      notify('Rol actualizado', `${usuario} ahora es ${rolLabels[nuevoRol]}`, 'success');
      setEditando(null);
      cargar();
    } catch (err) {
      notify('Error', err.message, 'error');
    }
  };

  const handleDelete = async (usuario) => {
    try {
      await api.eliminarUsuario(usuario);
      notify('Usuario eliminado', `${usuario} fue eliminado`, 'success');
      setConfirmDelete(null);
      cargar();
    } catch (err) {
      notify('Error', err.message, 'error');
    }
  };

  if (user?.rol !== 'admin') {
    return (
      <section className="space-y-6 animate-fade-in">
        <div className="panel p-12 text-center">
          <i className="fa-solid fa-shield-halved text-4xl text-slate-300 mb-3" />
          <p className="text-slate-500 font-bold">No tienes permiso para acceder a esta sección</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6 animate-fade-in">
      <div className="animate-slide-up">
        <h2 className="font-display text-2xl font-bold text-slate-900">Gestión de Usuarios</h2>
        <p className="text-slate-500 text-sm">Administrar roles y cuentas del sistema</p>
      </div>

      <div className="panel overflow-hidden animate-slide-up" style={{ animationDelay: '50ms' }}>
        {loading ? (
          <div className="p-12 text-center text-slate-400"><i className="fa-solid fa-spinner fa-spin text-2xl" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-bold text-slate-600">Usuario</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600">Nombre</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600">Rol</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600 hidden md:table-cell">Creado</th>
                  <th className="text-right px-4 py-3 font-bold text-slate-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.usuario} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-bold text-slate-800">{u.usuario}</td>
                    <td className="px-4 py-3 text-slate-600">{u.nombre}</td>
                    <td className="px-4 py-3">
                      {editando === u.usuario ? (
                        <div className="flex items-center gap-2">
                          <select className="form-input py-1 text-xs" value={nuevoRol} onChange={e => setNuevoRol(e.target.value)}>
                            <option value="admin">Administrador</option>
                            <option value="tecnico">Técnico</option>
                            <option value="ventas">Ventas</option>
                          </select>
                          <button onClick={() => handleUpdateRol(u.usuario)} className="px-2 py-1 rounded-lg bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition">
                            <i className="fa-solid fa-check" />
                          </button>
                          <button onClick={() => setEditando(null)} className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition">
                            <i className="fa-solid fa-xmark" />
                          </button>
                        </div>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${rolColors[u.rol] || rolColors.tecnico}`}>
                          {rolLabels[u.rol] || 'Técnico'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">
                      {u.creado ? new Date(u.creado).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {confirmDelete === u.usuario ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-red-600 font-bold">¿Eliminar?</span>
                          <button onClick={() => handleDelete(u.usuario)} className="px-2 py-1 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition">
                            <i className="fa-solid fa-check" />
                          </button>
                          <button onClick={() => setConfirmDelete(null)} className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition">
                            <i className="fa-solid fa-xmark" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setEditando(u.usuario); setNuevoRol(u.rol); }} className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition" title="Cambiar rol">
                            <i className="fa-solid fa-user-pen" />
                          </button>
                          <button onClick={() => setConfirmDelete(u.usuario)} className="px-2 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition" title="Eliminar usuario">
                            <i className="fa-solid fa-trash" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
