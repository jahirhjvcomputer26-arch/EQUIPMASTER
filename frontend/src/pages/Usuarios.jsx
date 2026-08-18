import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../componentes/Notification';
import useDocumentTitle from '../utils/useDocumentTitle';

const inputCls = 'w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:!text-slate-100 text-sm focus:ring-2 focus:ring-brand-300 focus:border-brand-300 outline-none';
const labelCls = 'block text-xs font-bold text-slate-600 dark:!text-slate-300 mb-1';
const btnPrimary = 'px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl shadow transition disabled:opacity-50';
const btnGhost = 'px-4 py-2 rounded-xl text-sm font-bold text-slate-500 dark:!text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition';
const crearInicial = { nombre: '', usuario: '', password: '', confirmPassword: '', rol: 'tecnico', nivel: '', activo: true, perms: {} };

function Switch({ checked, onChange, disabled }) {
  return (
    <button type="button" disabled={disabled} onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function PermisosGrid({ grupos, perms, onChange, roleBase, readonly }) {
  return (
    <div className="space-y-4">
      {grupos.map(g => (
        <div key={g.nombre}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:!text-slate-500 mb-2">{g.nombre}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {g.permisos.map(p => {
              const on = !!perms[p.key];
              const base = roleBase ? !!roleBase[p.key] : null;
              return (
                <div key={p.key} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-700 dark:!text-slate-200 truncate">{p.label}</p>
                    <p className="text-[10px] text-slate-400 dark:!text-slate-500 truncate">
                      {base !== null ? (base ? 'Incluido en el rol' : 'No incluido en el rol') : p.desc || p.key}
                    </p>
                  </div>
                  <Switch checked={on} onChange={v => onChange(p.key, v)} disabled={readonly} />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Usuarios() {
  useDocumentTitle('Administración de Usuarios y Permisos');
  const { user: authUser, can } = useAuth();
  const { notify } = useNotify();

  const esSuper = can('all');
  const esSelf = (u) => u.usuario === authUser?.clave;
  const esSuperUser = (u) => (u.nivel ?? 0) >= 100 || u.rol === 'superadmin';

  const [tab, setTab] = useState('usuarios');
  const [usuarios, setUsuarios] = useState([]);
  const [cat, setCat] = useState([]);
  const [roles, setRoles] = useState({});
  const [loading, setLoading] = useState(true);

  const [crear, setCrear] = useState(false);
  const [crearForm, setCrearForm] = useState(crearInicial);
  const [editForm, setEditForm] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmSesiones, setConfirmSesiones] = useState(null);
  const [saving, setSaving] = useState(false);
  const [roleForms, setRoleForms] = useState({});
  const [savingRol, setSavingRol] = useState(null);

  const grupos = useMemo(() => {
    const g = [];
    (cat || []).forEach(p => {
      let gr = g.find(x => x.nombre === p.grupo);
      if (!gr) { gr = { nombre: p.grupo, permisos: [] }; g.push(gr); }
      gr.permisos.push(p);
    });
    return g;
  }, [cat]);

  const basePerms = (rol) => (roles[rol]?.permisos) || {};

  const cargarTodo = async () => {
    try {
      const [usrs, data] = await Promise.all([api.getUsuarios(), api.getPermisosRoles()]);
      setUsuarios(usrs);
      setCat(data.permisosCatalog || []);
      setRoles(data.roles || {});
    } catch (err) {
      notify('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarTodo(); }, []);

  useEffect(() => {
    if (tab === 'roles' && Object.keys(roles).length > 0 && Object.keys(roleForms).length === 0) {
      const rf = {};
      Object.entries(roles).forEach(([k, r]) => {
        const perms = {};
        cat.forEach(p => { perms[p.key] = !!r.permisos?.[p.key]; });
        rf[k] = { nombre: r.nombre || k, nivel: r.nivel !== undefined ? r.nivel : '', perms };
      });
      setRoleForms(rf);
    }
  }, [tab, roles, cat, roleForms]);

  const handleCrear = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const nombre = crearForm.nombre.trim();
      const usuario = crearForm.usuario.trim() || nombre.toLowerCase().replace(/[.#$/[\]]/g, '_');
      const permisos = {};
      Object.entries(crearForm.perms).forEach(([k, v]) => { if (v) permisos[k] = true; });
      await api.crearUsuario({
        usuario,
        nombre,
        password: crearForm.password,
        confirmPassword: crearForm.confirmPassword,
        rol: crearForm.rol,
        nivel: crearForm.nivel === '' ? undefined : Number(crearForm.nivel),
        permisos,
      });
      notify('Usuario creado', `${nombre} fue creado correctamente`, 'success');
      setCrear(false);
      setCrearForm(crearInicial);
      cargarTodo();
    } catch (err) {
      notify('Error', err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const abrirEdicion = (u) => {
    const base = basePerms(u.rol);
    const perms = {};
    cat.forEach(p => { perms[p.key] = !!base[p.key]; });
    Object.entries(u.permisos || {}).forEach(([k, v]) => { if (k !== 'all') perms[k] = !!v; });
    setEditForm({
      usuario: u.usuario,
      nombre: u.nombre,
      rol: u.rol,
      nivel: u.nivel !== undefined ? String(u.nivel) : '',
      activo: u.activo !== false,
      permisos: perms,
    });
  };

  const cambiarRolEdicion = (nuevoRol) => {
    setEditForm(f => {
      const oldBase = basePerms(f.rol);
      const newBase = basePerms(nuevoRol);
      const overrides = {};
      Object.keys(f.permisos).forEach(k => {
        const before = !!oldBase[k];
        const after = !!f.permisos[k];
        if (before !== after) overrides[k] = after;
      });
      const nextPerms = {};
      cat.forEach(p => { nextPerms[p.key] = !!newBase[p.key]; });
      Object.entries(overrides).forEach(([k, v]) => { nextPerms[k] = v; });
      return { ...f, rol: nuevoRol, permisos: nextPerms };
    });
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const overrides = {};
      cat.forEach(p => {
        const base = !!basePerms(editForm.rol)[p.key];
        if (editForm.permisos[p.key] !== base) overrides[p.key] = editForm.permisos[p.key];
      });
      await api.actualizarUsuario({
        usuario: editForm.usuario,
        nombre: editForm.nombre.trim(),
        rol: editForm.rol,
        nivel: editForm.nivel === '' ? undefined : Number(editForm.nivel),
        activo: editForm.activo,
        permisos: overrides,
      });
      notify('Usuario actualizado', `${editForm.nombre} se guardó correctamente`, 'success');
      setEditForm(null);
      cargarTodo();
    } catch (err) {
      notify('Error', err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActivo = async (u) => {
    try {
      await api.actualizarUsuario({ usuario: u.usuario, activo: !u.activo });
      notify('Estado actualizado', u.activo ? `${u.usuario} fue desactivado` : `${u.usuario} fue activado`, 'success');
      cargarTodo();
    } catch (err) {
      notify('Error', err.message, 'error');
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.resetPassword({ usuario: resetUser.usuario, nueva: resetUser.nueva, confirmar: resetUser.confirmar });
      notify('Contraseña restablecida', `La contraseña de ${resetUser.usuario} fue actualizada`, 'success');
      setResetUser(null);
    } catch (err) {
      notify('Error', err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetSesiones = async (usuario) => {
    setSaving(true);
    try {
      await api.resetSesiones({ usuario });
      notify('Sesiones cerradas', `Todas las sesiones de ${usuario} fueron cerradas. Ya puede volver a iniciar sesión.`, 'success');
      setConfirmSesiones(null);
      cargarTodo();
    } catch (err) {
      notify('Error', err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (usuario) => {
    setSaving(true);
    try {
      await api.eliminarUsuario(usuario);
      notify('Usuario eliminado', `${usuario} fue eliminado`, 'success');
      setConfirmDelete(null);
      cargarTodo();
    } catch (err) {
      notify('Error', err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleGuardarRol = async (key) => {
    setSavingRol(key);
    try {
      const rf = roleForms[key];
      const permisos = {};
      cat.forEach(p => { permisos[p.key] = !!rf.perms[p.key]; });
      await api.updateRolPermisos(key, { nivel: rf.nivel === '' ? undefined : Number(rf.nivel), permisos });
      notify('Rol actualizado', `${rf.nombre} se guardó correctamente`, 'success');
      cargarTodo();
    } catch (err) {
      notify('Error', err.message, 'error');
    } finally {
      setSavingRol(null);
    }
  };

  const tabBtn = (k) =>
    `px-4 py-2 rounded-lg text-sm font-bold transition ${tab === k ? 'bg-white dark:bg-slate-700 text-brand-700 dark:!text-slate-100 shadow-sm' : 'text-slate-500 dark:!text-slate-400 hover:text-slate-700'}`;

  const accionBtn = 'px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:!text-slate-300 text-xs font-bold hover:bg-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <section className="space-y-6 animate-fade-in">
      <div className="animate-slide-up flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:!text-slate-100">Administración de Usuarios y Permisos</h2>
          <p className="text-slate-500 dark:!text-slate-400 text-sm">Gestiona cuentas, roles y permisos del sistema</p>
        </div>
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
          <button onClick={() => setTab('usuarios')} className={tabBtn('usuarios')}>Usuarios</button>
          <button onClick={() => setTab('roles')} className={tabBtn('roles')}>Roles y permisos</button>
        </div>
      </div>

      {tab === 'usuarios' && (
        <div className="panel overflow-hidden animate-slide-up" style={{ animationDelay: '50ms' }}>
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:!text-slate-100">Cuentas ({usuarios.length})</h3>
              <p className="text-[11px] text-slate-400">Cada usuario hereda los permisos de su rol y puede tener ajustes personalizados.</p>
            </div>
            <button onClick={() => setCrear(true)} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl shadow transition flex items-center gap-2">
              <i className="fa-solid fa-user-plus" /> Nuevo usuario
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400"><i className="fa-solid fa-spinner fa-spin text-2xl" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left px-4 py-3 font-bold text-slate-600 dark:!text-slate-300">Usuario</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-600 dark:!text-slate-300">Rol</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-600 dark:!text-slate-300 hidden md:table-cell">Permisos</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-600 dark:!text-slate-300 hidden sm:table-cell">Estado</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-600 dark:!text-slate-300 hidden md:table-cell">Sesiones</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-600 dark:!text-slate-300 hidden lg:table-cell">Creado</th>
                    <th className="text-right px-4 py-3 font-bold text-slate-600 dark:!text-slate-300">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(u => {
                    const self = esSelf(u);
                    const protegido = !esSuper && esSuperUser(u);
                    const bloqueado = self || protegido;
                    return (
                      <tr key={u.usuario} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 dark:!text-slate-100">{u.nombre}</p>
                              <p className="text-[11px] text-slate-400 font-mono">@{u.usuario}</p>
                            </div>
                            {(self || esSuperUser(u)) && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${self ? 'bg-cyan-100 text-cyan-700' : 'bg-purple-100 text-purple-700'}`}>
                                {self ? 'TÚ' : 'SUPER'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${roles[u.rol]?.color || 'bg-slate-100 text-slate-600'}`}>
                            {roles[u.rol]?.nombre || u.rol}
                          </span>
                          {u.nivel !== undefined && (
                            <span className="ml-1.5 text-[10px] font-mono text-slate-400">nivel {u.nivel}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {Object.keys(u.permisos || {}).filter(k => k !== 'all').length > 0 ? (
                            <span title={Object.entries(u.permisos).filter(([k]) => k !== 'all').map(([k, v]) => `${k}: ${v ? 'SÍ' : 'NO'}`).join(' · ')}
                              className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                              Personalizados ({Object.keys(u.permisos).filter(k => k !== 'all').length})
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Por rol</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          {u.activo ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">Activo</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700">Desactivado</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {u.sesionesActivas > 0 ? (
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${u.sesionesActivas >= 2 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:!text-slate-300'}`}>
                              {u.sesionesActivas}/2 sesiones
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Sin sesiones</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:!text-slate-400 text-xs hidden lg:table-cell">
                          {u.creado ? new Date(u.creado).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {confirmDelete === u.usuario ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs text-red-600 dark:!text-red-400 font-bold">¿Eliminar?</span>
                              <button onClick={() => handleDelete(u.usuario)} disabled={saving} className="px-2 py-1 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition">
                                <i className="fa-solid fa-check" />
                              </button>
                              <button onClick={() => setConfirmDelete(null)} className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:!text-slate-300 text-xs font-bold hover:bg-slate-200 transition">
                                <i className="fa-solid fa-xmark" />
                              </button>
                            </div>
                          ) : confirmSesiones === u.usuario ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs text-amber-600 dark:!text-amber-400 font-bold">¿Cerrar sesiones?</span>
                              <button onClick={() => handleResetSesiones(u.usuario)} disabled={saving} className="px-2 py-1 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition">
                                <i className="fa-solid fa-check" />
                              </button>
                              <button onClick={() => setConfirmSesiones(null)} className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:!text-slate-300 text-xs font-bold hover:bg-slate-200 transition">
                                <i className="fa-solid fa-xmark" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => abrirEdicion(u)} disabled={bloqueado} className={accionBtn} title={bloqueado ? (self ? 'No puedes editar tu propia cuenta' : 'No puedes modificar a un Super Administrador') : 'Editar'}>
                                <i className="fa-solid fa-pen" />
                              </button>
                              <button onClick={() => setResetUser({ usuario: u.usuario, nueva: '', confirmar: '' })} disabled={bloqueado} className={accionBtn} title="Restablecer contraseña">
                                <i className="fa-solid fa-key" />
                              </button>
                              <button onClick={() => handleToggleActivo(u)} disabled={bloqueado} className={accionBtn} title={u.activo ? 'Desactivar cuenta' : 'Activar cuenta'}>
                                <i className={`fa-solid ${u.activo ? 'fa-user-slash' : 'fa-user-check'} ${u.activo ? 'text-amber-600 dark:!text-amber-400' : 'text-emerald-600 dark:!text-emerald-400'}`} />
                              </button>
                              <button onClick={() => setConfirmSesiones(u.usuario)} disabled={bloqueado} className={accionBtn} title="Cerrar todas las sesiones de este usuario">
                                <i className="fa-solid fa-arrow-right-from-bracket text-slate-500 dark:!text-slate-400" />
                              </button>
                              <button onClick={() => setConfirmDelete(u.usuario)} disabled={bloqueado} className={`${accionBtn} bg-red-50 dark:bg-red-900/30 text-red-600 dark:!text-red-400 hover:bg-red-100`} title="Eliminar usuario">
                                <i className="fa-solid fa-trash" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {usuarios.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400 text-sm">Sin usuarios registrados</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'roles' && (
        <div className="space-y-4 animate-slide-up">
          {!esSuper && (
            <div className="panel px-4 py-3 text-sm text-slate-500 dark:!text-slate-400">
              <i className="fa-solid fa-shield-halved text-amber-500 mr-2" />
              Solo el Super Administrador puede modificar roles. Actualmente puedes ver esta información en solo lectura.
            </div>
          )}
          {Object.entries(roles).map(([key, r]) => {
            const rf = roleForms[key];
            return (
              <div key={key} className="panel overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${r.color || 'bg-slate-100 text-slate-600'}`}>{rf?.nombre || r.nombre || key}</span>
                    <span className="text-[10px] font-mono text-slate-400">nivel {r.nivel}</span>
                    {key === 'superadmin' && <span className="text-[10px] font-bold text-purple-600">ACCESO TOTAL</span>}
                  </div>
                  {rf && (
                    <div className="flex items-center gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:!text-slate-500 uppercase mb-0.5">Nivel</label>
                        <input type="number" min={0} max={100} value={rf.nivel} onChange={e => setRoleForms(f => ({ ...f, [key]: { ...f[key], nivel: e.target.value } }))}
                          disabled={!esSuper} className={`${inputCls} w-24 py-1.5`} />
                      </div>
                      <button onClick={() => handleGuardarRol(key)} disabled={!esSuper || savingRol === key}
                        className="mt-4 px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow transition disabled:opacity-40 disabled:cursor-not-allowed">
                        {savingRol === key ? <i className="fa-solid fa-spinner fa-spin mr-1" /> : <i className="fa-solid fa-floppy-disk mr-1" />}Guardar
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-4 max-h-[28rem] overflow-y-auto">
                  {rf && (
                    <PermisosGrid grupos={grupos} perms={rf.perms} roleBase={null} readonly={!esSuper}
                      onChange={(pkey, v) => setRoleForms(f => ({ ...f, [key]: { ...f[key], perms: { ...f[key].perms, [pkey]: v } } }))} />
                  )}
                </div>
              </div>
            );
          })}
          {Object.keys(roles).length === 0 && !loading && (
            <div className="panel p-10 text-center text-slate-400"><i className="fa-solid fa-ghost text-3xl mb-2 block" />No hay roles definidos</div>
          )}
        </div>
      )}

      {crear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setCrear(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 dark:!text-slate-100">
                <i className="fa-solid fa-user-plus text-brand-500 mr-2" />Nuevo Usuario
              </h3>
              <button onClick={() => setCrear(false)} className="text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark text-lg" /></button>
            </div>
            <form onSubmit={handleCrear} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Nombre completo *</label>
                  <input type="text" required value={crearForm.nombre} onChange={e => setCrearForm(f => ({ ...f, nombre: e.target.value }))}
                    className={inputCls} placeholder="Ej: Juan Pérez" />
                </div>
                <div>
                  <label className={labelCls}>Usuario (clave de acceso)</label>
                  <input type="text" value={crearForm.usuario} onChange={e => setCrearForm(f => ({ ...f, usuario: e.target.value }))}
                    className={inputCls} placeholder="Vacío = derivada del nombre" />
                </div>
                <div>
                  <label className={labelCls}>Contraseña *</label>
                  <input type="password" required minLength={4} value={crearForm.password} onChange={e => setCrearForm(f => ({ ...f, password: e.target.value }))}
                    className={inputCls} placeholder="Mínimo 4 caracteres" />
                </div>
                <div>
                  <label className={labelCls}>Confirmar contraseña *</label>
                  <input type="password" required minLength={4} value={crearForm.confirmPassword} onChange={e => setCrearForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    className={inputCls} placeholder="Repite la contraseña" />
                </div>
                <div>
                  <label className={labelCls}>Rol</label>
                  <select value={crearForm.rol} onChange={e => setCrearForm(f => ({ ...f, rol: e.target.value }))} className={inputCls}>
                    {Object.keys(roles).map(k => <option key={k} value={k}>{roles[k]?.nombre || k} (nivel {roles[k]?.nivel ?? '—'})</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Nivel (opcional)</label>
                  <input type="number" min={0} max={100} value={crearForm.nivel} onChange={e => setCrearForm(f => ({ ...f, nivel: e.target.value }))}
                    className={inputCls} placeholder="Vacío = usa el del rol" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelCls + ' !mb-0'}>Permisos adicionales (opcional)</label>
                  <button type="button" onClick={() => setCrearForm(f => ({ ...f, activo: !f.activo }))}
                    className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:!text-slate-400">
                    Cuenta activa
                    <Switch checked={crearForm.activo} onChange={v => setCrearForm(f => ({ ...f, activo: v }))} />
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">Por defecto hereda los permisos de su rol. Activa aquí permisos adicionales.</p>
                <div className="max-h-64 overflow-y-auto border border-slate-100 dark:border-slate-700 rounded-xl p-3">
                  <PermisosGrid grupos={grupos} perms={crearForm.perms} roleBase={null} readonly={false}
                    onChange={(pkey, v) => setCrearForm(f => ({ ...f, perms: { ...f.perms, [pkey]: v } }))} />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setCrear(false)} className={btnGhost}>Cancelar</button>
                <button type="submit" disabled={saving} className={btnPrimary}>
                  {saving ? <i className="fa-solid fa-spinner fa-spin mr-1" /> : <i className="fa-solid fa-check mr-1" />}Crear usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditForm(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 dark:!text-slate-100">
                <i className="fa-solid fa-pen text-brand-500 mr-2" />Editar {editForm.nombre}
              </h3>
              <button onClick={() => setEditForm(null)} className="text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark text-lg" /></button>
            </div>
            <form onSubmit={handleGuardarEdicion} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Nombre completo</label>
                  <input type="text" required value={editForm.nombre} onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Rol</label>
                  <select value={editForm.rol} onChange={e => cambiarRolEdicion(e.target.value)} className={inputCls}>
                    {Object.keys(roles).map(k => <option key={k} value={k}>{roles[k]?.nombre || k} (nivel {roles[k]?.nivel ?? '—'})</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Nivel</label>
                  <input type="number" min={0} max={100} value={editForm.nivel} onChange={e => setEditForm(f => ({ ...f, nivel: e.target.value }))} className={inputCls} placeholder="Vacío = del rol" />
                </div>
              </div>

              <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:!text-slate-200">Cuenta activa</p>
                  <p className="text-[10px] text-slate-400">Un usuario desactivado no puede iniciar sesión.</p>
                </div>
                <Switch checked={editForm.activo} onChange={v => setEditForm(f => ({ ...f, activo: v }))} />
              </div>

              <div>
                <label className={labelCls}>Permisos efectivos</label>
                <p className="text-[11px] text-slate-400 mb-3">Muestran los permisos del rol combinados con ajustes personalizados del usuario.</p>
                <div className="max-h-64 overflow-y-auto border border-slate-100 dark:border-slate-700 rounded-xl p-3">
                  <PermisosGrid grupos={grupos} perms={editForm.permisos} roleBase={basePerms(editForm.rol)} readonly={false}
                    onChange={(pkey, v) => setEditForm(f => ({ ...f, permisos: { ...f.permisos, [pkey]: v } }))} />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditForm(null)} className={btnGhost}>Cancelar</button>
                <button type="submit" disabled={saving} className={btnPrimary}>
                  {saving ? <i className="fa-solid fa-spinner fa-spin mr-1" /> : <i className="fa-solid fa-floppy-disk mr-1" />}Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setResetUser(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 dark:!text-slate-100">
                <i className="fa-solid fa-key text-brand-500 mr-2" />Restablecer contraseña
              </h3>
              <button onClick={() => setResetUser(null)} className="text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark text-lg" /></button>
            </div>
            <form onSubmit={handleReset} className="p-6 space-y-4">
              <p className="text-sm text-slate-500 dark:!text-slate-400">
                Nueva contraseña para <span className="font-bold text-slate-700 dark:!text-slate-200">@{resetUser.usuario}</span>
              </p>
              <div>
                <label className={labelCls}>Nueva contraseña *</label>
                <input type="password" required minLength={4} value={resetUser.nueva} onChange={e => setResetUser(r => ({ ...r, nueva: e.target.value }))} className={inputCls} autoFocus />
              </div>
              <div>
                <label className={labelCls}>Confirmar *</label>
                <input type="password" required minLength={4} value={resetUser.confirmar} onChange={e => setResetUser(r => ({ ...r, confirmar: e.target.value }))} className={inputCls} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setResetUser(null)} className={btnGhost}>Cancelar</button>
                <button type="submit" disabled={saving} className={btnPrimary}>
                  {saving ? <i className="fa-solid fa-spinner fa-spin mr-1" /> : <i className="fa-solid fa-check mr-1" />}Restablecer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
