# ============================================================
#  EquipMaster - Instalacion en Windows Server (Etapa 4)
#  Ejecutar COMO ADMINISTRADOR en el servidor:
#    powershell -ExecutionPolicy Bypass -File instalar-servidor.ps1
# ============================================================
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

$BASE      = 'C:\EquipMaster'
$BACKEND   = "$BASE\backend"
$LOGS      = "$BASE\logs"
$ZIP       = Join-Path $PSScriptRoot 'EquipMaster-backend.zip'
$NODE_MSI  = 'https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi'
$NSSM_URL  = 'https://nssm.cc/release/nssm-2.24.zip'
$DB_SERVER = '127.0.0.1'
$DB_PORT   = '1433'
$DB_DATABASE = 'EquipMaster'
$DB_USER   = 'equipmaster'
$DB_PASS   = 'JVCOMPUTER2026@'

function Info($m)  { Write-Host "[INFO] $m" -ForegroundColor Cyan }
function OK($m)    { Write-Host "[OK]   $m" -ForegroundColor Green }
function Warn($m)  { Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Fail($m)  { Write-Host "[FALLO] $m" -ForegroundColor Red; exit 1 }

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Fail 'Ejecuta PowerShell como ADMINISTRADOR.'
}

if (-not (Test-Path $ZIP)) { Fail "No encuentro EquipMaster-backend.zip junto a este script." }

# ---------- 1) Node.js ----------
$nodeExe = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $nodeExe) {
  Info 'Node.js no esta instalado. Descargando v20.18.0 LTS...'
  $msi = "$env:TEMP\node-v20.18.0-x64.msi"
  Invoke-WebRequest -Uri $NODE_MSI -OutFile $msi -UseBasicParsing
  Start-Process msiexec -ArgumentList "/i `"$msi`" /qn /norestart" -Wait
  $env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
  $nodeExe = (Get-Command node -ErrorAction SilentlyContinue).Source
  if (-not $nodeExe) { Fail 'Node.js no se instalo correctamente.' }
}
$nodeVersion = & $nodeExe -v
OK "Node.js: $nodeVersion ($nodeExe)"

# ---------- 2) Descomprimir backend ----------
if (-not (Test-Path $BACKEND)) {
  New-Item -ItemType Directory -Path $BASE -Force | Out-Null
  Info "Extrayendo $ZIP -> $BACKEND"
  Expand-Archive -Path $ZIP -DestinationPath $BACKEND -Force
} else {
  Warn "Ya existe $BACKEND, se conserva tal cual. (Borra la carpeta si quieres reinstalar limpio.)"
}
New-Item -ItemType Directory -Path $LOGS -Force | Out-Null
if (-not (Test-Path "$BACKEND\src\index.js")) { Fail "El zip no contiene el backend (falta src\index.js)." }

# ---------- 3) npm install ----------
if (-not (Test-Path "$BACKEND\node_modules")) {
  Info 'Instalando dependencias (npm install)...'
  Push-Location $BACKEND
  cmd /c "npm install --omit=dev 2>&1"
  $npmOk = $LASTEXITCODE -eq 0
  Pop-Location
  if (-not $npmOk) { Fail 'npm install fallo. Verifica que el servidor tenga acceso a registry.npmjs.org o copia manualmente node_modules.' }
  OK 'Dependencias instaladas.'
} else {
  Warn 'node_modules ya existe, se omite npm install.'
}

# ---------- 4) .env ----------
$envFile = "$BACKEND\.env"
if (-not (Test-Path $envFile)) {
  $secret = -join ((48..57)+(65..90)+(97..122) | Get-Random -Count 48 | ForEach-Object { [char]$_ })
  @"
PORT=3001
JWT_SECRET=$secret
FIREBASE_DB_URL=https://inventarioequip-default-rtdb.firebaseio.com
DB_SERVER=$DB_SERVER
DB_PORT=$DB_PORT
DB_DATABASE=$DB_DATABASE
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASS
"@ | Set-Content -Path $envFile -Encoding ASCII
  OK ".env creado en $envFile (JWT_SECRET generado)."
} else {
  Warn "$envFile ya existe, no se sobreescribe. Verifica DB_* y PORT=3001."
}

# ---------- 4b) Aplicar cambios idempotentes del esquema ----------
Info 'Aplicando esquema SQL idempotente...'
Push-Location $BACKEND
cmd /c "node scripts/init-sql.mjs 2>&1"
$schemaOk = $LASTEXITCODE -eq 0
Pop-Location
if (-not $schemaOk) { Fail 'No se pudo aplicar el esquema SQL.' }
OK 'Esquema SQL actualizado.'

# ---------- 5) Firewall ----------
$rule = netsh advfirewall firewall show rule name="EquipMaster API 3001"
if ($LASTEXITCODE -ne 0 -or $rule -notmatch 'EquipMaster') {
  netsh advfirewall firewall add rule name="EquipMaster API 3001" dir=in action=allow protocol=TCP localport=3001 | Out-Null
  OK 'Regla de firewall creada (TCP 3001).'
} else {
  OK 'Regla de firewall ya existente.'
}

# ---------- 6) Servicio ----------
$nssm = Join-Path $BASE 'tools\nssm-2.24\nssm-2.24\win64\nssm.exe'
$serviceName = 'EquipMasterAPI'
$existing = Get-Service -Name $serviceName -ErrorAction SilentlyContinue

if (-not $existing) {
  if (-not (Test-Path $nssm)) {
    Info 'Descargando NSSM (para servicio con reinicio automatico)...'
    try {
      $zip = "$env:TEMP\nssm-2.24.zip"
      Invoke-WebRequest -Uri $NSSM_URL -OutFile $zip -UseBasicParsing
      Expand-Archive -Path $zip -DestinationPath (Join-Path $BASE 'tools') -Force
    } catch {
      Warn "No se pudo descargar NSSM: $($_.Exception.Message)"
    }
  }
  if (Test-Path $nssm) {
    & $nssm install $serviceName "$nodeExe" "$BACKEND\src\index.js" | Out-Null
    & $nssm set $serviceName AppDirectory "$BACKEND" | Out-Null
    & $nssm set $serviceName AppStdout "$LOGS\api.log" | Out-Null
    & $nssm set $serviceName AppStderr "$LOGS\api-error.log" | Out-Null
    & $nssm set $serviceName AppRotateFiles 1 | Out-Null
    & $nssm set $serviceName AppRotateBytes 10485760 | Out-Null
    & $nssm set $serviceName ObjectName LocalSystem | Out-Null
    OK "Servicio $serviceName creado con NSSM."
  } else {
    Warn 'NSSM no disponible; usando Tarea Programada al arranque.'
    $cmd = "$BASE\iniciar-api.cmd"
    "@echo off`r`ncd /d `"$BACKEND`"`r`n`"$nodeExe`" src\index.js`r`n" | Set-Content -Path $cmd -Encoding ASCII
    schtasks /Create /TN "EquipMaster API" /TR "`"$cmd`"" /SC ONSTART /RU SYSTEM /RL HIGHEST /F | Out-Null
    OK 'Tarea Programada "EquipMaster API" creada (arranque).'
  }
} else {
  Warn "Servicio $serviceName ya existe. (nssm restart para reconfigurar)"
}

# ---------- 7) Respaldo diario ----------
$bakScript = "$BASE\respaldo-sql.ps1"
Copy-Item (Join-Path $PSScriptRoot 'respaldo-sql.ps1') $bakScript -Force
Copy-Item (Join-Path $PSScriptRoot 'probar-restauracion.ps1') "$BASE\probar-restauracion.ps1" -Force
schtasks /Create /TN "EquipMaster Respaldo" /TR "powershell -NoProfile -ExecutionPolicy Bypass -File `"$bakScript`"" /SC DAILY /ST 02:30 /RU SYSTEM /RL HIGHEST /F | Out-Null
OK 'Respaldo diario programado (02:30): SQL .bak + VERIFYONLY + copia de archivos.'
OK "Prueba manual de restauración disponible en $BASE\probar-restauracion.ps1"

# ---------- 8) Arrancar y verificar ----------
if ($existing) { Restart-Service -Name $serviceName -ErrorAction SilentlyContinue }
elseif (Test-Path $nssm) { & $nssm start $serviceName | Out-Null }
else { schtasks /Run /TN "EquipMaster API" | Out-Null }

Start-Sleep 3
$health = $false
for ($i = 0; $i -lt 10; $i++) {
  try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3001/api/health' -UseBasicParsing -TimeoutSec 3; if ($r.StatusCode -eq 200) { $health = $true; break } } catch {}
  Start-Sleep 3
}

if ($health) {
  OK "API respondiendo: http://127.0.0.1:3001/api/health"
  $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notmatch '^127\.' -and $_.IPAddress -notmatch '^169\.254' } | Select-Object -First 1).IPAddress
  if ($ip) { OK "Acceso desde la red: http://$ip`:3001" }
} else {
  Warn "La API no respondio aun. Revisa:"
  Warn "  - Logs:  $LOGS"
  Warn "  - SQL:   $DB_SERVER puerto $DB_PORT, usuario $DB_USER"
  Warn "  - Prueba manual: & `"$nodeExe`" `"$BACKEND\src\index.js`""
}

Write-Host ""
Write-Host "Resumen: $BASE" -ForegroundColor Green
Write-Host "  Backend:      $BACKEND"
Write-Host "  Logs:         $LOGS"
  Write-Host "  Respaldo:     C:\Backups\EquipMaster (tarea diaria 02:30)"
  Write-Host "  URL LAN:      http://$(if ($ip) { $ip } else { '192.168.100.182' }):3001"
  Write-Host ""
