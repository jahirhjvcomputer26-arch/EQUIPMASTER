# ============================================================
#  EquipMaster - Actualizacion completa del servidor
#  Copia la carpeta deploy a C:\deploy en el servidor y
#  ejecuta ESTE script como Administrador.
# ============================================================
$ErrorActionPreference = 'Stop'
$host.UI.RawUI.WindowTitle = 'EquipMaster - Actualizacion'

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Write-Host "ERROR: Ejecuta PowerShell como ADMINISTRADOR." -ForegroundColor Red
  Write-Host "Click derecho sobre este archivo -> Ejecutar con PowerShell (Administrador)" -ForegroundColor Yellow
  pause; exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " EquipMaster - Actualizacion de servidor" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Detener servicio
Write-Host "[1/5] Deteniendo servicio..." -ForegroundColor Yellow
$nssm = "C:\EquipMaster\tools\nssm-2.24\nssm-2.24\win64\nssm.exe"
if (Test-Path $nssm) {
  & $nssm stop EquipMasterAPI 2>$null
  Write-Host "  NSSM: EquipMasterAPI detenido." -ForegroundColor Green
} else {
  schtasks /End /TN "EquipMaster API" 2>$null
  Write-Host "  Tarea Programada: detenida." -ForegroundColor Green
}
Start-Sleep 3

# 2. Matar procesos node
Write-Host "[2/5] Cerrando procesos..." -ForegroundColor Yellow
$killed = 0
Get-Process node -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.Id -Force; $killed++ }
if ($killed -gt 0) { Write-Host "  $killed proceso(s) node cerrado(s)." -ForegroundColor Green } else { Write-Host "  Ningun proceso node corriendo." -ForegroundColor Green }
Start-Sleep 2

# 3. Borrar backend viejo
Write-Host "[3/5] Borrando backend anterior..." -ForegroundColor Yellow
if (Test-Path "C:\EquipMaster\backend") {
  Remove-Item "C:\EquipMaster\backend" -Recurse -Force
  Write-Host "  C:\EquipMaster\backend eliminado." -ForegroundColor Green
} else {
  Write-Host "  No existe, se omite." -ForegroundColor Green
}

# 4. Instalar
Write-Host "[4/5] Instalando nueva version..." -ForegroundColor Yellow
$instalador = "C:\deploy\instalar-servidor.ps1"
if (-not (Test-Path $instalador)) {
  Write-Host "ERROR: No encuentro $instalador. Copia la carpeta deploy a C:\deploy" -ForegroundColor Red
  pause; exit 1
}
powershell -ExecutionPolicy Bypass -File $instalador

# 5. Verificar
Write-Host "[5/5] Verificando..." -ForegroundColor Yellow
Start-Sleep 2
try {
  $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3001/api/health' -UseBasicParsing -TimeoutSec 5
  Write-Host "  API respondiendo: OK" -ForegroundColor Green
  Write-Host ""
  Write-Host "========================================" -ForegroundColor Green
  Write-Host "  LISTO. Abre http://192.168.100.182:3001" -ForegroundColor Green
  Write-Host "========================================" -ForegroundColor Green
} catch {
  Write-Host "  La API no responde aun. Revisa:" -ForegroundColor Red
  Write-Host "    - C:\EquipMaster\logs\api-error.log" -ForegroundColor White
}

Write-Host ""
Write-Host "Presiona cualquier tecla para cerrar..." -ForegroundColor Cyan
$null = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
