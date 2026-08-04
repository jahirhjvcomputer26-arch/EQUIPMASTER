# Plan de Migración: Firebase → SQL Server Express + Windows Server

**Proyecto:** EquipMaster · **Fecha:** 2026-08-04
**Estimación:** 5–8 días a tiempo parcial (3–4 h/día)

---

## Estado actual

| Etapa | Estado |
|---|---|
| 0 — Preparación del servidor | ✔ SQL Express en 192.168.100.182 (TCP 1433, login `equipmaster` sysadmin, Mixed Mode) |
| 1 — Capa de datos SQL (`db.js`) | ✔ 12 tablas + `ModelosFotos`; pruebas unitarias y E2E SQL pasando |
| 2 — Fotos GCS → disco | ✔ 225 archivos → `backend/public/archivos/`; URLs reescritas a `/archivos/...` |
| 2b — Almacenamiento dual (upload local) | ✔ `storage.js` con modo local (`DB_SERVER` sin `USE_FIREBASE`): subir/borrar/listar van a `backend/public/archivos/`; URLs `/archivos/...`; proxy de Vite para `/archivos`; verificado con upload → disco → servir → delete (fotos y modelosFotos) |
| 3 — Migración de datos | ✔ 701 registros (actividad 467, inventario 152, permisos 31, notifs 18, usuarios 13, préstamos 12, roles 7, tickets 1); verificado contra RTDB y API E2E |
| 4 — Despliegue en Windows Server | ✔ desplegado en `C:\EquipMaster\backend` (servicio/Tarea Programada) y verificado: login, 152 equipos, fotos `/archivos/...` (200 image/jpeg), tickets, respaldo diario 02:30 en `C:\Backups\EquipMaster` |
| 5 — QA y corte | ⬜ pendiente |

> **Nota:** `configuracion`, `reparaciones`, `centroReparaciones`, `ventas` y `modelosFotos` **no existen** en la RTDB (módulos sin datos); las tablas ya están creadas para su uso futuro.

---

## 1. Estado actual (lo que tenemos)

| Componente | Actual | Notas |
|---|---|---|
| Base de datos | Firebase **Realtime Database** (`inventarioequip-default-rtdb.firebaseio.com`) | Árbol JSON por nodos: `inventario`, `usuarios`, `roles`, `tickets`, `reparaciones`, `centroReparaciones`, `prestamos`, `ventas`, `actividad`, `configuracion`, `notificaciones` |
| Fotos / documentos | Google Cloud Storage (bucket `inventarioequip.firebasestorage.app`) | Rutas `fotos/{CODIGO}/{categoria}.{ext}` y `documentos/{CODIGO}/{categoria}.{ext}`; la URL se guarda en el registro |
| Backend | Node.js (Express), **~2,500 líneas**, 13 rutas | Toda la lógica depende de `firebase.js` (get/set/update/delete por path) |
| Auth | JWT (`jwt.verify`) con `JWT_SECRET` | Contraseñas como SHA-256 hex (sin salt) |
| Frontend | React + Vite | **No cambia**: la API conserva exactamente la misma forma |

**Conclusión clave:** el frontend llama a la API; el backend es la única pieza que toca Firebase. Si reescribimos solo la **capa de datos** del backend manteniendo idénticos los endpoints y la forma de los JSON, el frontend queda intacto.

---

## 2. Estrategia

1. Crear un **nuevo módulo de datos SQL** (`db.js`) con las mismas funciones que `firebase.js` usa (`firebaseGet`, `firebaseSet`, `firebaseUpdate`, `firebaseDelete`), implementadas contra SQL Server.
2. Cada ruta se mantiene **idéntica en lógica**: solo cambia de dónde lee. Los objetos anidados (fotos, historial, flujos, fichaV2, checklist) se guardan como **JSON en columnas NVARCHAR(MAX)** y la capa de datos los **serializa/deserializa** para que las rutas y el frontend sigan recibiendo objetos, nunca strings.
3. Los reportes que calculan en memoria (`dashboard`, `avanzado`, `ventas`, `reparaciones`, `excel`, `email`) se dejan igual: el volumen es pequeño (cientos de filas) y un `SELECT *` rinde igual.
4. Fotos: se descargan de GCS a **disco local** y se reescriben las URLs almacenadas a rutas relativas (`/archivos/...`) servidas por el propio backend.
5. Despliegue: Node como **servicio de Windows** apuntando a SQL Express, con **backup diario vía Task Scheduler** (Express no trae SQL Agent).

---

## 3. Esquema SQL Server

> El script canónico ejecutable está en **`backend/scripts/schema.sql`** (crea la BD y las 12 tablas, incluye columna `Extra` en las tablas planas para no perder campos desconocidos). Abajo el esquema de referencia:

```sql
CREATE DATABASE EquipMaster;
GO
USE EquipMaster;
GO

-- Configuración de la empresa y SMTP (JSON por clave)
CREATE TABLE dbo.Configuracion (
    Clave NVARCHAR(64) NOT NULL PRIMARY KEY,   -- 'empresa' | 'smtp'
    Valor NVARCHAR(MAX) NOT NULL,              -- JSON
    ActualizadoEn DATETIME2 DEFAULT SYSDATETIME()
);

-- Catálogo de permisos (idéntico a permisosCatalog de Firebase)
CREATE TABLE dbo.PermisosCatalog (
    Clave NVARCHAR(64) NOT NULL PRIMARY KEY,
    Label NVARCHAR(150) NOT NULL,
    Grupo NVARCHAR(64) NOT NULL,
    Descripcion NVARCHAR(300) NULL
);

-- Roles
CREATE TABLE dbo.Roles (
    Rol NVARCHAR(32) NOT NULL PRIMARY KEY,
    Nivel INT NOT NULL,
    Nombre NVARCHAR(100) NOT NULL,
    Color NVARCHAR(16) NULL,
    Descripcion NVARCHAR(500) NULL,
    Permisos NVARCHAR(MAX) NULL                -- JSON
);

-- Usuarios
CREATE TABLE dbo.Usuarios (
    Clave NVARCHAR(64) NOT NULL PRIMARY KEY,   -- claveUsuario() ya normaliza
    Nombre NVARCHAR(150) NOT NULL,
    PasswordHash NVARCHAR(128) NOT NULL,       -- SHA-256 hex (se migra tal cual)
    Rol NVARCHAR(32) NOT NULL DEFAULT 'usuario',
    Nivel INT NULL,
    Activo BIT NOT NULL DEFAULT 1,
    Permisos NVARCHAR(MAX) NULL,               -- JSON (overrides por usuario)
    Creado NVARCHAR(64) NULL,
    SesionActiva NVARCHAR(MAX) NULL            -- JSON
);
CREATE INDEX IX_Usuarios_Rol ON dbo.Usuarios(Rol);

-- Inventario (tabla principal, columnas planas + JSON anidados)
CREATE TABLE dbo.Inventario (
    Codigo NVARCHAR(32) NOT NULL PRIMARY KEY,
    Categoria NVARCHAR(64) NULL,
    Marca NVARCHAR(100) NULL,
    Modelo NVARCHAR(200) NULL,
    Serie NVARCHAR(128) NULL,
    Sku NVARCHAR(64) NULL,
    Procesador NVARCHAR(200) NULL,
    Ram NVARCHAR(32) NULL,
    Almacenamiento NVARCHAR(32) NULL,
    TipoDisco NVARCHAR(32) NULL,
    Grafica NVARCHAR(200) NULL,
    Tecnico NVARCHAR(150) NULL,
    Bateria NVARCHAR(32) NULL,
    Cargador NVARCHAR(32) NULL,
    Estado NVARCHAR(64) NULL,
    Observaciones NVARCHAR(MAX) NULL,
    Anio NVARCHAR(8) NULL,
    Generacion NVARCHAR(32) NULL,
    TipoRam NVARCHAR(32) NULL,
    Resolucion NVARCHAR(64) NULL,
    PantallaTactil BIT NULL,
    Retroiluminacion BIT NULL,
    LectorHuellas BIT NULL,
    CamaraIR BIT NULL,
    Wifi NVARCHAR(64) NULL,
    Bluetooth NVARCHAR(64) NULL,
    SistemaOperativo NVARCHAR(200) NULL,
    Color NVARCHAR(64) NULL,
    Pantalla NVARCHAR(128) NULL,
    ModeloComercial NVARCHAR(200) NULL,
    CondicionEstetica NVARCHAR(MAX) NULL,      -- JSON
    BateriaDetalle NVARCHAR(MAX) NULL,         -- JSON
    ChecklistPruebas NVARCHAR(MAX) NULL,       -- JSON
    FechaRevision NVARCHAR(32) NULL,
    Fotos NVARCHAR(MAX) NULL,                  -- JSON { categoria: url }
    Historial NVARCHAR(MAX) NULL,              -- JSON array
    FlujoSalida NVARCHAR(MAX) NULL,            -- JSON
    FlujoVentaML NVARCHAR(MAX) NULL,           -- JSON
    FlujoDevolucion NVARCHAR(MAX) NULL,        -- JSON
    FlujoMercadoLibre NVARCHAR(MAX) NULL,      -- JSON
    FechaRegistro NVARCHAR(64) NULL
);
CREATE INDEX IX_Inventario_Marca ON dbo.Inventario(Marca);
CREATE INDEX IX_Inventario_Estado ON dbo.Inventario(Estado);
CREATE INDEX IX_Inventario_Serie ON dbo.Inventario(Serie);
CREATE INDEX IX_Inventario_Sku ON dbo.Inventario(Sku);

-- Ventas (referencia para reportes; JSON para el resto)
CREATE TABLE dbo.Ventas (
    Id NVARCHAR(64) NOT NULL PRIMARY KEY,
    Fecha NVARCHAR(32) NULL,
    Datos NVARCHAR(MAX) NULL                   -- JSON
);

-- Préstamos
CREATE TABLE dbo.Prestamos (
    Id NVARCHAR(64) NOT NULL PRIMARY KEY,
    Serie NVARCHAR(128) NULL,
    Modelo NVARCHAR(200) NULL,
    Procesador NVARCHAR(200) NULL,
    Responsable NVARCHAR(150) NULL,
    Area NVARCHAR(100) NULL,
    FechaSalida NVARCHAR(32) NULL,
    Notas NVARCHAR(MAX) NULL,
    Activo BIT NOT NULL DEFAULT 1,
    FechaRegistro NVARCHAR(64) NULL,
    FechaDevolucion NVARCHAR(32) NULL
);

-- Órdenes de reparación (nodo 'reparaciones')
CREATE TABLE dbo.Reparaciones (
    Id NVARCHAR(64) NOT NULL PRIMARY KEY,
    CreatedAt NVARCHAR(64) NULL,
    UpdatedAt NVARCHAR(64) NULL,
    Datos NVARCHAR(MAX) NULL                   -- JSON (cliente, equipoMarca, equipoModelo, estado, fotos...)
);

-- Centro de Reparaciones (nodo 'centroReparaciones')
CREATE TABLE dbo.CentroReparaciones (
    Id NVARCHAR(64) NOT NULL PRIMARY KEY,
    Marca NVARCHAR(100) NULL,
    Modelo NVARCHAR(200) NULL,
    Serie NVARCHAR(128) NULL,
    Categoria NVARCHAR(100) NULL,
    Prioridad NVARCHAR(16) NULL,
    Falla NVARCHAR(MAX) NULL,
    Tecnico NVARCHAR(150) NULL,
    Estado NVARCHAR(32) NULL,
    Fecha NVARCHAR(64) NULL,
    FechaFin NVARCHAR(64) NULL,
    Origen NVARCHAR(16) NULL,
    FechaRegistro NVARCHAR(64) NULL,
    Fotos NVARCHAR(MAX) NULL                   -- JSON
);
CREATE INDEX IX_CentroReparaciones_Serie ON dbo.CentroReparaciones(Serie);
CREATE INDEX IX_CentroReparaciones_Estado ON dbo.CentroReparaciones(Estado);

-- Tickets (arrays como JSON)
CREATE TABLE dbo.Tickets (
    Id NVARCHAR(64) NOT NULL PRIMARY KEY,
    Asunto NVARCHAR(300) NULL,
    Descripcion NVARCHAR(MAX) NULL,
    Prioridad NVARCHAR(16) NULL,
    Estado NVARCHAR(32) NULL,
    CreadoPor NVARCHAR(150) NULL,
    CreadoPorClave NVARCHAR(64) NULL,
    CreadoEn NVARCHAR(64) NULL,
    Timestamp BIGINT NULL,
    TecnicoAsignado NVARCHAR(64) NULL,
    TecnicoAsignadoNombre NVARCHAR(150) NULL,
    FechaAsignacion NVARCHAR(64) NULL,
    FechaEstimadaEntrega NVARCHAR(64) NULL,
    NotasInternas NVARCHAR(MAX) NULL,
    ModificadoEn NVARCHAR(64) NULL,
    Notas NVARCHAR(MAX) NULL,                  -- JSON array
    Historial NVARCHAR(MAX) NULL,              -- JSON array
    Diagnosticos NVARCHAR(MAX) NULL,           -- JSON array
    Reparaciones NVARCHAR(MAX) NULL,           -- JSON array
    Piezas NVARCHAR(MAX) NULL,                 -- JSON array
    Fotografias NVARCHAR(MAX) NULL             -- JSON array
);
CREATE INDEX IX_Tickets_Estado ON dbo.Tickets(Estado);
CREATE INDEX IX_Tickets_Timestamp ON dbo.Tickets(Timestamp DESC);

-- Auditoría (nodo 'actividad')
CREATE TABLE dbo.Actividad (
    Id NVARCHAR(64) NOT NULL PRIMARY KEY,
    Usuario NVARCHAR(150) NOT NULL,
    Accion NVARCHAR(64) NOT NULL,
    Detalle NVARCHAR(MAX) NULL,
    Fecha NVARCHAR(64) NULL,
    Timestamp BIGINT NULL
);
CREATE INDEX IX_Actividad_Timestamp ON dbo.Actividad(Timestamp DESC);

-- Notificaciones (si se usan; por seguridad se migra el nodo completo)
CREATE TABLE dbo.Notificaciones (
    Id NVARCHAR(64) NOT NULL PRIMARY KEY,
    Datos NVARCHAR(MAX) NULL                   -- JSON
);
GO
```

> **Nota de diseño:** las fechas se migran como NVARCHAR para conservar exactamente los valores ISO actuales (evita cambios de zona horaria). El ordenamiento de actividad/tickets usa `Timestamp` (BIGINT), igual que hoy.

---

## 4. Plan por etapas

### Etapa 0 — Preparación del servidor (0.5 día)
- Confirmar credenciales SQL Server Express (instancia, `sa` o SQL auth, TCP/IP habilitado en puerto 1433).
- Instalar Node.js LTS en Windows Server.
- Verificar que `service-account.json` del backend permite leer GCS (ya existe localmente).
- Crear la BD con `schema.sql` (`sqlcmd -S SRV -i schema.sql`).

### Etapa 1 — Capa de datos SQL (`db.js`) (2–3 días)
- Dependencia: `mssql` (driver tedious) con pool.
- Implementar: `dbGetAll(path)`, `dbGetOne(path, id)`, `dbUpsert(path, id, obj)`, `dbDelete(path, id)`, `dbUpdate(path, obj)`.
- Mapeo path → tabla (la tabla `Configuracion` y `Datos`/JSON absorben nodos como `reparaciones`, `ventas`, `notificaciones`).
- Serializar columnas JSON al escribir y **deserializar a objetos** al leer (para que rutas y frontend no vean strings).
- Cambiar en `firebase.js` la implementación (mantener los mismos nombres de export) o crear `db.js` y cambiar los imports de las 13 rutas.
- `permisos.js` (`seedPermisos`) pasa a sembrar `Roles` y `PermisosCatalog` desde el código.
- Probar con datos de prueba en una instancia SQL local.

### Etapa 2 — Fotos de GCS a disco (1 día)
- Script que lista `fotos/` y `documentos/` del bucket y los descarga a `backend/public/archivos/{CODIGO}/{categoria}.{ext}`.
- Reescribir en SQL las URLs: `https://storage.googleapis.com/inventarioequip.../fotos/X/Y.jpg` → `/archivos/fotos/X/Y.jpg` (en `Inventario.Fotos`, `CentroReparaciones.Fotos`, `Reparaciones.Datos`, `Tickets.Fotografias`).
- El backend ya sirve `public/` como estático (`index.js`).
- Ajuste menor en `Galeria.jsx`/`Inventario.jsx`: el borrado de foto ya no debe llamar a GCS con rutas relativas (deja de ser obligatorio; se elimina la foto del JSON y del disco).

### Etapa 3 — Script de migración de datos (0.5–1 día)
- Descargar el árbol RTDB completo: `GET https://inventarioequip-default-rtdb.firebaseio.com/.json` (hoy la API lee sin auth, las reglas son abiertas).
- Por cada nodo, insertar en la tabla correspondiente con la transformación JSON del `db.js`.
- Verificación: conteos por tabla vs Firebase; muestreo de equipos, tickets y auditoría.
- **Idempotente:** truncar tablas y reinsertar en caso de repetir.

### Etapa 4 — Despliegue en Windows Server (1 día)
- Copiar backend a `C:\EquipMaster\backend`; `.env` con `PORT`, `JWT_SECRET`, `DB_SERVER`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`.
- Instalar como servicio: **NSSM** (`nssm install EquipMaster "C:\Program Files\nodejs\node.exe" "C:\EquipMaster\backend\src\index.js"`) o `node-windows`.
- Firewall: abrir puerto del API (3001) o poner un reverse proxy IIS en 80/443.
- **Backup diario** (Express no tiene SQL Agent): Tarea Programada que ejecuta:
  `sqlcmd -S SRV -E -Q "BACKUP DATABASE EquipMaster TO DISK='D:\Backups\EquipMaster_%date%.bak'"` + copia de `backend/public/archivos`.
- `VITE_API_URL` apunta a la nueva URL; rebuild del frontend y servir desde el backend (ya lo hace) o desde IIS.

### Etapa 5 — QA y corte (0.5–1 día)
- Probar: login, sesión única, inventario, fotos, fichas, QR, ventas (local/ML/devolución), préstamos, tickets completos, centro de reparaciones, reportes, Excel, respaldo, auditoría.
- **Rollback:** dejar Render encendido hasta validar; el cambio es solo de URL de la app.
- Apagar Firebase una vez confirmado (revisar reglas del RTDB y bucket).

**Total: ~5–8 días.**

---

## 5. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Reglas de RTDB cambiadas a solo-admin | Generar token de consola para el dump, o usar la URL con `?auth=` |
| SQL Express (10 GB) | Datos son KB por fila; fotos van a disco, no a la BD. Irrelevante aquí |
| Express sin SQL Agent para backups | Task Scheduler + `sqlcmd` |
| TCP/IP deshabilitado en SQL | Habilitar en Configuración > TCP/IP > puerto 1433, reiniciar servicio |
| Contraseñas SHA-256 sin salt | Se migran tal cual (login sigue funcionando). Opcional: migrar a bcrypt en una 2ª fase |
| URLs de fotos viejas en los datos | El script de migración las reescribe a rutas relativas |
| `hardware/detect` (systeminformation) | Funciona igual en la red local; en Render estaba bloqueado, ahora es un beneficio |
| Cambios de zona horaria en fechas | Se migran como NVARCHAR con los ISO originales |
| Riesgo de corte en producción | Render sigue vivo durante la migración; el corte es solo cambiar la URL |

---

## 6. Qué se conserva intacto
- Frontend completo (React) y todos los endpoints de la API.
- Auth JWT, permisos, roles, sesión única, auditoría.
- Reportes y exportación Excel.
- La detección de hardware pasa a funcionar **también en la red local del taller** (beneficio).
