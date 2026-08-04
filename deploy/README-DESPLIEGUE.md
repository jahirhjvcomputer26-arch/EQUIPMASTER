# Despliegue de EquipMaster en el Windows Server (Etapa 4)

Este paquete instala el backend completo (API + frontend + fotos) en el servidor
`192.168.100.182`, apuntando a su SQL Server Express local, y lo deja corriendo
como servicio con respaldo diario automático.

## Qué incluye

| Archivo | Descripción |
|---|---|
| `EquipMaster-backend.zip` | Código del backend (src, public con el frontend compilado, scripts, 225 fotos) — sin node_modules |
| `instalar-servidor.ps1` | Script de instalación (ejecutar como administrador) |
| `respaldo-sql.ps1` | Respaldo diario de SQL + archivos (lo instala el script) |

## Pasos

1. Copia la carpeta `deploy` al servidor, p. ej. a `C:\EquipMaster-deploy`
   (por red: `\\192.168.100.182\C$\EquipMaster-deploy` o por USB).
2. En el servidor, abre **PowerShell como Administrador** y ejecuta:

   ```powershell
   powershell -ExecutionPolicy Bypass -File C:\EquipMaster-deploy\instalar-servidor.ps1
   ```

3. El script hace todo automáticamente:
   - Instala **Node.js v20.18.0 LTS** si no está.
   - Descomprime el backend en `C:\EquipMaster\backend`.
   - `npm install` (requiere internet del servidor).
   - Crea `.env` con `DB_SERVER=127.0.0.1`, base `EquipMaster`, usuario `equipmaster`
     y un `JWT_SECRET` nuevo generado.
   - Abre el **puerto 3001** en el firewall.
   - Instala **NSSM** y crea el servicio `EquipMasterAPI` (reinicio automático).
     Si no puede descargar NSSM, crea una Tarea Programada al arranque.
   - Programa el **respaldo diario a las 02:30** (`C:\Backups\EquipMaster`).

## Verificación

- En el servidor: `http://127.0.0.1:3001/api/health` → `{"ok":true,...}`
- Desde cualquier PC de la red: `http://192.168.100.182:3001` → login `ocadmin` / `1234`

## Notas

- **Datos**: la base `EquipMaster` ya existe y tiene los 701 registros migrados.
  El backend solo la usa; si faltara la crea (tablas mediante el arranque/seed).
- **Reinstalar**: borra `C:\EquipMaster\backend` y `.env` antes de volver a ejecutar,
  o edita `.env` si solo cambias credenciales.
- **Logs**: `C:\EquipMaster\logs\api.log` y `api-error.log` (rotan a 10 MB).
- **Respaldo**: último resultado en `C:\Backups\EquipMaster\ultimo-respaldo.log`;
  se conservan 7 `.bak` y un espejo de las fotos en `C:\Backups\EquipMaster\archivos`.
- **Desinstalar** (si algo falla y quieres limpiar):
  ```powershell
  nssm remove EquipMasterAPI confirm   # o: schtasks /Delete /TN "EquipMaster API" /F
  netsh advfirewall firewall delete rule name="EquipMaster API 3001"
  schtasks /Delete /TN "EquipMaster Respaldo" /F
  ```
