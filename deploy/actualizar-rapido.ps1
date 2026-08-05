# ============================================================
#  EquipMaster - Actualizacion RAPIDA (solo archivos, sin npm)
#  Usalo cuando solo hay cambios de codigo, NO nuevas librerias.
#  Ejecutar como Administrador en el servidor.
# ============================================================
$ErrorActionPreference = 'Stop'

$nssm = "C:\EquipMaster\tools\nssm-2.24\nssm-2.24\win64\nssm.exe"
$backend = "C:\EquipMaster\backend"

# Detener
if (Test-Path $nssm) { & $nssm stop EquipMasterAPI 2>$null } else { schtasks /End /TN "EquipMaster API" 2>$null }
Start-Sleep 2
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Copiar archivos nuevos (src + public + package.json)
$deploy = "C:\deploy\EquipMaster-backend.zip"
$tmp = "$env:TEMP\equipmaster-update"
Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
Expand-Archive -Path $deploy -DestinationPath $tmp -Force

Copy-Item "$tmp\src\*" "$backend\src" -Recurse -Force
Copy-Item "$tmp\public\*" "$backend\public" -Recurse -Force
Copy-Item "$tmp\package.json" $backend -Force

Remove-Item $tmp -Recurse -Force

# Arrancar
if (Test-Path $nssm) { & $nssm start EquipMasterAPI } else { schtasks /Run /TN "EquipMaster API" }
Start-Sleep 3

try {
  $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3001/api/health' -UseBasicParsing -TimeoutSec 5
  Write-Host "LISTO - API OK" -ForegroundColor Green
} catch {
  Write-Host "La API no arranco, revisa C:\EquipMaster\logs\api-error.log" -ForegroundColor Red
}
pause
