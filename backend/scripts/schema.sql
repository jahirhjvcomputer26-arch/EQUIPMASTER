-- ============================================================
-- EquipMaster · Esquema SQL Server Express
-- Idempotente: se puede ejecutar varias veces.
-- Ejecutar: sqlcmd -S SERVER -i schema.sql
-- (c) 2026
-- ============================================================
CREATE DATABASE EquipMaster;
GO
USE EquipMaster;
GO

-- Configuración de la empresa y SMTP (JSON por clave)
IF OBJECT_ID(N'dbo.Configuracion', N'U') IS NULL
CREATE TABLE dbo.Configuracion (
    Clave NVARCHAR(64) NOT NULL PRIMARY KEY,   -- 'empresa' | 'smtp'
    Valor NVARCHAR(MAX) NOT NULL,              -- JSON
    ActualizadoEn DATETIME2 DEFAULT SYSDATETIME()
);

-- Catálogo de permisos (permisosCatalog)
IF OBJECT_ID(N'dbo.PermisosCatalog', N'U') IS NULL
CREATE TABLE dbo.PermisosCatalog (
    Clave NVARCHAR(64) NOT NULL PRIMARY KEY,
    Label NVARCHAR(150) NOT NULL,
    Grupo NVARCHAR(64) NOT NULL,
    Descripcion NVARCHAR(300) NULL,
    Extra NVARCHAR(MAX) NULL
);

-- Roles
IF OBJECT_ID(N'dbo.Roles', N'U') IS NULL
CREATE TABLE dbo.Roles (
    Rol NVARCHAR(32) NOT NULL PRIMARY KEY,
    Nivel INT NOT NULL,
    Nombre NVARCHAR(100) NOT NULL,
    Color NVARCHAR(16) NULL,
    Descripcion NVARCHAR(500) NULL,
    Permisos NVARCHAR(MAX) NULL,               -- JSON
    Extra NVARCHAR(MAX) NULL
);

-- Usuarios
IF OBJECT_ID(N'dbo.Usuarios', N'U') IS NULL
CREATE TABLE dbo.Usuarios (
    Clave NVARCHAR(64) NOT NULL PRIMARY KEY,   -- claveUsuario() ya normaliza
    Nombre NVARCHAR(150) NOT NULL,
    PasswordHash NVARCHAR(128) NOT NULL,       -- SHA-256 hex
    Rol NVARCHAR(32) NOT NULL DEFAULT 'usuario',
    Nivel INT NULL,
    Activo BIT NOT NULL DEFAULT 1,
    Permisos NVARCHAR(MAX) NULL,               -- JSON (overrides)
    Creado NVARCHAR(64) NULL,
    SesionActiva NVARCHAR(MAX) NULL,           -- JSON
    Extra NVARCHAR(MAX) NULL
);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Usuarios_Rol' AND object_id = OBJECT_ID(N'dbo.Usuarios'))
CREATE INDEX IX_Usuarios_Rol ON dbo.Usuarios(Rol);

-- Inventario
IF OBJECT_ID(N'dbo.Inventario', N'U') IS NULL
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
    FechaRegistro NVARCHAR(64) NULL,
    Extra NVARCHAR(MAX) NULL
);
IF OBJECT_ID(N'dbo.InventarioCodigoSeq', N'U') IS NULL
CREATE TABLE dbo.InventarioCodigoSeq (
    Id TINYINT NOT NULL PRIMARY KEY,
    Ultimo INT NOT NULL
);
IF NOT EXISTS (SELECT 1 FROM dbo.InventarioCodigoSeq WHERE Id = 1)
INSERT INTO dbo.InventarioCodigoSeq (Id, Ultimo)
SELECT 1, ISNULL(MAX(TRY_CONVERT(INT, SUBSTRING(Codigo, 5, 20))), 1000)
FROM dbo.Inventario WHERE Codigo LIKE 'INV-%';
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Inventario_Marca' AND object_id = OBJECT_ID(N'dbo.Inventario'))
CREATE INDEX IX_Inventario_Marca ON dbo.Inventario(Marca);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Inventario_Estado' AND object_id = OBJECT_ID(N'dbo.Inventario'))
CREATE INDEX IX_Inventario_Estado ON dbo.Inventario(Estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Inventario_Serie' AND object_id = OBJECT_ID(N'dbo.Inventario'))
CREATE INDEX IX_Inventario_Serie ON dbo.Inventario(Serie);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Inventario_Sku' AND object_id = OBJECT_ID(N'dbo.Inventario'))
CREATE INDEX IX_Inventario_Sku ON dbo.Inventario(Sku);

-- Ventas (referencia para reportes; Datos JSON con el resto)
IF OBJECT_ID(N'dbo.Ventas', N'U') IS NULL
CREATE TABLE dbo.Ventas (
    Id NVARCHAR(64) NOT NULL PRIMARY KEY,
    Fecha NVARCHAR(32) NULL,
    Datos NVARCHAR(MAX) NOT NULL               -- JSON
);

-- Préstamos
IF OBJECT_ID(N'dbo.Prestamos', N'U') IS NULL
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
    FechaDevolucion NVARCHAR(32) NULL,
    Extra NVARCHAR(MAX) NULL
);

-- Órdenes de reparación (nodo 'reparaciones'; Datos JSON)
IF OBJECT_ID(N'dbo.Reparaciones', N'U') IS NULL
CREATE TABLE dbo.Reparaciones (
    Id NVARCHAR(64) NOT NULL PRIMARY KEY,
    Datos NVARCHAR(MAX) NOT NULL               -- JSON
);

-- Centro de Reparaciones (nodo 'centroReparaciones')
IF OBJECT_ID(N'dbo.CentroReparaciones', N'U') IS NULL
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
    Fotos NVARCHAR(MAX) NULL,                  -- JSON
    Extra NVARCHAR(MAX) NULL
);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CentroReparaciones_Serie' AND object_id = OBJECT_ID(N'dbo.CentroReparaciones'))
CREATE INDEX IX_CentroReparaciones_Serie ON dbo.CentroReparaciones(Serie);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CentroReparaciones_Estado' AND object_id = OBJECT_ID(N'dbo.CentroReparaciones'))
CREATE INDEX IX_CentroReparaciones_Estado ON dbo.CentroReparaciones(Estado);

-- Tickets (arrays como JSON)
IF OBJECT_ID(N'dbo.Tickets', N'U') IS NULL
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
    Fotografias NVARCHAR(MAX) NULL,            -- JSON array
    Extra NVARCHAR(MAX) NULL
);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Tickets_Estado' AND object_id = OBJECT_ID(N'dbo.Tickets'))
CREATE INDEX IX_Tickets_Estado ON dbo.Tickets(Estado);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Tickets_Timestamp' AND object_id = OBJECT_ID(N'dbo.Tickets'))
CREATE INDEX IX_Tickets_Timestamp ON dbo.Tickets(Timestamp DESC);

-- Auditoría (nodo 'actividad')
IF OBJECT_ID(N'dbo.Actividad', N'U') IS NULL
CREATE TABLE dbo.Actividad (
    Id NVARCHAR(64) NOT NULL PRIMARY KEY,
    Usuario NVARCHAR(150) NULL,
    Accion NVARCHAR(64) NULL,
    Detalle NVARCHAR(MAX) NULL,
    Fecha NVARCHAR(64) NULL,
    Timestamp BIGINT NULL,
    Extra NVARCHAR(MAX) NULL
);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Actividad_Timestamp' AND object_id = OBJECT_ID(N'dbo.Actividad'))
CREATE INDEX IX_Actividad_Timestamp ON dbo.Actividad(Timestamp DESC);

-- Notificaciones (si se usan; Datos JSON)
IF OBJECT_ID(N'dbo.Notificaciones', N'U') IS NULL
CREATE TABLE dbo.Notificaciones (
    Id NVARCHAR(64) NOT NULL PRIMARY KEY,
    Datos NVARCHAR(MAX) NOT NULL               -- JSON
);

-- Fotos por Modelo (nodo 'modelosFotos'; Datos JSON)
IF OBJECT_ID(N'dbo.ModelosFotos', N'U') IS NULL
CREATE TABLE dbo.ModelosFotos (
    Id NVARCHAR(64) NOT NULL PRIMARY KEY,
    Datos NVARCHAR(MAX) NOT NULL               -- JSON
);

-- Garantías y mantenimientos ligados a inventario por Código
IF OBJECT_ID(N'dbo.Garantias', N'U') IS NULL
CREATE TABLE dbo.Garantias (
    Id NVARCHAR(64) NOT NULL PRIMARY KEY,
    Datos NVARCHAR(MAX) NOT NULL
);
IF OBJECT_ID(N'dbo.Mantenimientos', N'U') IS NULL
CREATE TABLE dbo.Mantenimientos (
    Id NVARCHAR(64) NOT NULL PRIMARY KEY,
    Datos NVARCHAR(MAX) NOT NULL
);
IF OBJECT_ID(N'dbo.SolicitudesVenta', N'U') IS NULL
CREATE TABLE dbo.SolicitudesVenta (
    Id NVARCHAR(64) NOT NULL PRIMARY KEY,
    Datos NVARCHAR(MAX) NOT NULL
);
GO
