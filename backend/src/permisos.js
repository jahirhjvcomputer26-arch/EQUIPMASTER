import { firebaseGet, firebaseSet } from './firebase.js';

export const PERMISOS_CATALOGO = [
  { key: 'ver_inventario', label: 'Ver Inventario', grupo: 'Inventario', desc: 'Consultar inventario y base de datos de equipos' },
  { key: 'crear_equipos', label: 'Crear Equipos', grupo: 'Inventario', desc: 'Registrar equipos nuevos' },
  { key: 'editar_equipos', label: 'Editar Equipos', grupo: 'Inventario', desc: 'Modificar equipos existentes' },
  { key: 'eliminar_equipos', label: 'Eliminar Equipos', grupo: 'Inventario', desc: 'Eliminar equipos del inventario' },

  { key: 'ver_fichas', label: 'Ver Fichas Técnicas', grupo: 'Fichas', desc: 'Consultar fichas técnicas' },
  { key: 'editar_fichas', label: 'Editar Fichas Técnicas', grupo: 'Fichas', desc: 'Modificar fichas técnicas' },

  { key: 'generar_qr', label: 'Generar QR / Etiquetas', grupo: 'QR', desc: 'Generar códigos QR y etiquetas' },
  { key: 'escanear_qr', label: 'Escanear QR', grupo: 'QR', desc: 'Escaneo de códigos QR' },

  { key: 'ver_reparaciones', label: 'Ver Reparaciones', grupo: 'Reparaciones', desc: 'Consultar órdenes y centro de reparaciones' },
  { key: 'registrar_reparaciones', label: 'Registrar Reparaciones', grupo: 'Reparaciones', desc: 'Crear y actualizar reparaciones y diagnósticos' },
  { key: 'aprobar_reparaciones', label: 'Aprobar Reparaciones', grupo: 'Reparaciones', desc: 'Aprobar o finalizar reparaciones' },
  { key: 'diagnostico_hardware', label: 'Detección de Hardware', grupo: 'Reparaciones', desc: 'Usar detección automática de hardware' },

  { key: 'ver_ventas', label: 'Ver Ventas', grupo: 'Ventas', desc: 'Consultar ventas' },
  { key: 'registrar_ventas', label: 'Registrar Ventas', grupo: 'Ventas', desc: 'Registrar ventas locales y ML' },
  { key: 'editar_ventas', label: 'Editar Ventas', grupo: 'Ventas', desc: 'Editar ventas registradas' },
  { key: 'eliminar_ventas', label: 'Eliminar / Anular Ventas', grupo: 'Ventas', desc: 'Anular ventas y registrar devoluciones' },

  { key: 'ver_prestamos', label: 'Ver Préstamos', grupo: 'Préstamos', desc: 'Consultar préstamos' },
  { key: 'gestionar_prestamos', label: 'Gestionar Préstamos', grupo: 'Préstamos', desc: 'Crear y devolver préstamos' },

  { key: 'ver_reportes', label: 'Ver Reportes', grupo: 'Reportes', desc: 'Consultar reportes y estadísticas' },
  { key: 'exportar_excel', label: 'Exportar Excel', grupo: 'Reportes', desc: 'Descargar exportaciones Excel' },

  { key: 'ver_tickets', label: 'Ver Tickets', grupo: 'Tickets', desc: 'Consultar tickets y solicitudes' },
  { key: 'registrar_tickets', label: 'Crear Tickets', grupo: 'Tickets', desc: 'Levantar solicitudes de servicio' },
  { key: 'gestionar_tickets', label: 'Gestionar Tickets', grupo: 'Tickets', desc: 'Asignar, priorizar y cerrar tickets' },
  { key: 'atender_tickets', label: 'Atender Tickets', grupo: 'Tickets', desc: 'Trabajar tickets asignados: diagnóstico, reparación, comentarios y estados' },

  { key: 'admin_usuarios', label: 'Administrar Usuarios', grupo: 'Usuarios', desc: 'Crear, editar, desactivar usuarios y roles' },
  { key: 'ver_auditoria', label: 'Ver Auditoría', grupo: 'Usuarios', desc: 'Consultar el historial de actividad' },

  { key: 'config_sistema', label: 'Configuración del Sistema', grupo: 'Sistema', desc: 'Configuración general de la empresa' },
  { key: 'base_datos', label: 'Base de Datos', grupo: 'Sistema', desc: 'Administrar la base de datos' },
  { key: 'respaldos', label: 'Respaldos', grupo: 'Sistema', desc: 'Descargar respaldos del sistema' },
  { key: 'subir_archivos', label: 'Subir / Eliminar Archivos', grupo: 'Sistema', desc: 'Subir fotografías y documentos' },
  { key: 'gestionar_modelos', label: 'Fotos por Modelo', grupo: 'Inventario', desc: 'Subir y eliminar fotografías del catálogo de modelos (marca/modelo)' },
  { key: 'publicar_catalogo', label: 'Publicar en Catálogo', grupo: 'Ventas', desc: 'Publicar equipos OK con precio y descripción pública sin editar la ficha interna' },
  { key: 'gestionar_solicitudes', label: 'Gestionar Solicitudes de Compra', grupo: 'Ventas', desc: 'Consultar y actualizar solicitudes del catálogo público' },
  { key: 'ver_marketing', label: 'Panel de Marketing', grupo: 'Ventas', desc: 'Consultar equipos OK y sus especificaciones comerciales' },
  { key: 'ver_garantias', label: 'Ver Garantías y Mantenimientos', grupo: 'Mantenimiento', desc: 'Consultar garantías y mantenimientos' },
  { key: 'gestionar_garantias', label: 'Gestionar Garantías y Mantenimientos', grupo: 'Mantenimiento', desc: 'Registrar y actualizar garantías y mantenimientos' },
];

export const ROLES_DEFECTO = {
  superadmin: {
    nivel: 100, nombre: 'Super Administrador', color: '#7c3aed',
    descripcion: 'Acceso total al sistema. Administra usuarios, roles, configuración, respaldos y auditoría.',
    permisos: {},
  },
  admin: {
    nivel: 80, nombre: 'Administrador', color: '#2563eb',
    descripcion: 'Administra inventario, reparaciones, QR, reportes y usuarios.',
    permisos: {
      ver_inventario: true, crear_equipos: true, editar_equipos: true, eliminar_equipos: true,
      ver_fichas: true, editar_fichas: true,
      generar_qr: true, escanear_qr: true,
      ver_reparaciones: true, registrar_reparaciones: true, aprobar_reparaciones: true, diagnostico_hardware: true,
      ver_ventas: true, registrar_ventas: true, editar_ventas: true, eliminar_ventas: true,
      ver_prestamos: true, gestionar_prestamos: true,
      ver_reportes: true, exportar_excel: true,
      ver_tickets: true, registrar_tickets: true, gestionar_tickets: true, atender_tickets: true,
      admin_usuarios: true, ver_auditoria: true,
      subir_archivos: true, gestionar_modelos: true,
      ver_garantias: true, gestionar_garantias: true,
      publicar_catalogo: true, gestionar_solicitudes: true, ver_marketing: true,
    },
  },
  supervisor: {
    nivel: 60, nombre: 'Supervisor', color: '#d97706',
    descripcion: 'Aprueba reparaciones, asigna equipos y revisa reportes.',
    permisos: {
      ver_inventario: true, editar_equipos: true,
      ver_fichas: true, editar_fichas: true,
      generar_qr: true, escanear_qr: true,
      ver_reparaciones: true, aprobar_reparaciones: true,
      ver_prestamos: true, gestionar_prestamos: true,
      ver_reportes: true,
      ver_tickets: true, registrar_tickets: true, gestionar_tickets: false,
      subir_archivos: true,
    },
  },
  ventas: {
    nivel: 60, nombre: 'Ventas', color: '#0d9488',
    descripcion: 'Gestión de ventas locales y Mercado Libre.',
    permisos: {
      ver_inventario: true, ver_fichas: true, escanear_qr: true, generar_qr: true,
      ver_ventas: true, registrar_ventas: true, editar_ventas: true,
      ver_reportes: true, exportar_excel: true, publicar_catalogo: true, gestionar_solicitudes: true, ver_marketing: true,
      ver_tickets: true, registrar_tickets: true,
    },
  },
  tecnico: {
    nivel: 40, nombre: 'Técnico', color: '#059669',
    descripcion: 'Escanea QR, registra diagnósticos, actualiza estados de reparación y sube fotografías.',
    permisos: {
      ver_inventario: true, ver_fichas: true,
      escanear_qr: true,
      ver_reparaciones: true, registrar_reparaciones: true, diagnostico_hardware: true,
      ver_tickets: true, registrar_tickets: true, atender_tickets: true,
      subir_archivos: true,
    },
  },
  marketing: {
    nivel: 50, nombre: 'Marketing', color: '#db2777',
    descripcion: 'Sube y administra las fotografías por marca y modelo de los equipos.',
    permisos: {
      ver_inventario: true, ver_fichas: true, ver_reportes: true,
      gestionar_modelos: true,
    },
  },
  usuario: {
    nivel: 20, nombre: 'Usuario', color: '#64748b',
    descripcion: 'Consulta equipos, escanea QR y levanta solicitudes.',
    permisos: {
      ver_inventario: true, ver_fichas: true,
      escanear_qr: true,
      ver_reparaciones: true,
      ver_tickets: true, registrar_tickets: true,
    },
  },
};

export function esSuperAdmin(record) {
  return record?.rol === 'superadmin' || Number(record?.nivel) >= 100;
}

export function resolverPermisos(record, roles) {
  if (esSuperAdmin(record)) return { all: true };
  const role = roles?.[record?.rol] || {};
  const base = role.permisos || {};
  const overrides = record?.permisos || {};
  const perms = {};
  for (const k of Object.keys(base)) perms[k] = !!base[k];
  for (const k of Object.keys(overrides)) perms[k] = !!overrides[k];
  return perms;
}

export function tienePermiso(req, ...permisos) {
  if (esSuperAdmin(req.userRecord)) return true;
  const p = req.permisos || {};
  return permisos.some(k => p.all || p[k]);
}

export function loadPermisos() {
  return async (req, res, next) => {
    try {
      const [roles, record] = await Promise.all([
        firebaseGet('roles'),
        firebaseGet(`usuarios/${req.user.usuario}`),
      ]);
      if (!record) return res.status(401).json({ error: 'Usuario no encontrado' });
      if (record.activo === false) return res.status(403).json({ error: 'Tu cuenta está desactivada. Contacta al administrador.' });
      req.userRecord = record;
      req.permisos = resolverPermisos(record, roles);
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function requirePerm(...permisos) {
  return (req, res, next) => {
    if (!tienePermiso(req, ...permisos)) {
      return res.status(403).json({ error: 'Acceso denegado: no tienes permiso para esta acción' });
    }
    next();
  };
}

export async function seedPermisos() {
  try {
    const [rolesActuales, catalogActual] = await Promise.all([
      firebaseGet('roles'),
      firebaseGet('permisosCatalog'),
    ]);

    if (!rolesActuales) {
      await firebaseSet('roles', ROLES_DEFECTO);
    } else {
      const merged = {};
      for (const [key, def] of Object.entries(ROLES_DEFECTO)) {
        const actual = rolesActuales[key] || {};
        const pMerged = { ...(def.permisos || {}), ...(actual.permisos || {}) };
        for (const [k, v] of Object.entries(def.permisos || {})) {
          if (v === false) delete pMerged[k];
        }
        merged[key] = {
          ...def,
          ...actual,
          permisos: pMerged,
        };
      }
      for (const [key, val] of Object.entries(rolesActuales)) {
        if (!merged[key]) merged[key] = val;
      }
      await firebaseSet('roles', merged);
    }

    const catObj = {};
    PERMISOS_CATALOGO.forEach(p => { catObj[p.key] = p; });
    if (!catalogActual) {
      await firebaseSet('permisosCatalog', catObj);
    } else {
      await firebaseSet('permisosCatalog', { ...catObj, ...catalogActual });
    }

    const users = await firebaseGet('usuarios');
    if (users) {
      const haySuper = Object.values(users).some(u => u.rol === 'superadmin' || Number(u.nivel) >= 100);
      if (!haySuper) {
        const admins = Object.entries(users)
          .filter(([, u]) => u.rol === 'admin')
          .sort(([, a], [, b]) => new Date(a.creado || 0) - new Date(b.creado || 0));
        if (admins.length > 0) {
          const [firstKey, firstUser] = admins[0];
          firstUser.rol = 'superadmin';
          await firebaseSet(`usuarios/${firstKey}`, firstUser);
        }
      }
    }
  } catch (err) {
    console.error('Seed permisos error:', err.message);
  }
}
