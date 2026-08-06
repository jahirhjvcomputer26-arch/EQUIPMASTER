# ============================================================
# EquipMaster - Respaldo diario SQL + archivos
# ============================================================
$ErrorActionPreference = 'Stop'
$Base = 'C:\EquipMaster'
$EnvFile = "$Base\backend\.env"
$Dest = 'C:\Backups\EquipMaster'
$ArcOrigen = "$Base\backend\public\archivos"
$KeepBaks = 7
$Log = "$Dest\ultimo-respaldo.log"

function Read-EnvFile($path) {
  $values = @{}
  if (-not (Test-Path $path)) { throw ".env no encontrado: $path" }
  foreach ($line in Get-Content -LiteralPath $path) {
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$') {
      $values[$matches[1]] = $matches[2].Trim().Trim('"').Trim("'")
    }
  }
  return $values
}

function SqlQuote($value) { return $value.Replace("'", "''") }

$conn = $null
$mensaje = $null
$exitCode = 0
try {
  $envValues = Read-EnvFile $EnvFile
  $server = $envValues.DB_SERVER
  if (-not $server) { throw 'DB_SERVER no está configurado en .env' }
  if (-not $server.Contains('\')) { $server = "$server,$($envValues.DB_PORT | ForEach-Object { if ($_){$_}else{'1433'} })" }
  $db = if ($envValues.DB_DATABASE) { $envValues.DB_DATABASE } else { 'EquipMaster' }
  $user = $envValues.DB_USER
  $password = $envValues.DB_PASSWORD
  if (-not $user -or -not $password) { throw 'DB_USER o DB_PASSWORD no están configurados en .env' }

  New-Item -ItemType Directory -Path $Dest -Force | Out-Null
  New-Item -ItemType Directory -Path "$Dest\archivos" -Force | Out-Null
  icacls $Dest /grant "Everyone:(OI)(CI)M" /T | Out-Null

  Add-Type -AssemblyName System.Data
  $bak = "{0}\{1}_DB_{2:yyyyMMdd_HHmmss}.bak" -f $Dest, $db, (Get-Date)
  $connectionString = "Server=$server;Initial Catalog=master;User ID=$user;Password=$password;Encrypt=False;TrustServerCertificate=True"
  $conn = New-Object System.Data.SqlClient.SqlConnection $connectionString
  $conn.Open()
  $cmd = $conn.CreateCommand()
  $cmd.CommandTimeout = 600
  $cmd.CommandText = "BACKUP DATABASE [$($db.Replace(']', ']]'))] TO DISK=N'$(SqlQuote $bak)' WITH INIT"
  $cmd.ExecuteNonQuery() | Out-Null
  $conn.Close(); $conn = $null

  if (-not (Test-Path $bak) -or (Get-Item $bak).Length -lt 1MB) { throw "El backup no se creó correctamente: $bak" }

  # Validación interna del archivo sin modificar bases de datos.
  $conn = New-Object System.Data.SqlClient.SqlConnection $connectionString
  $conn.Open()
  $cmd = $conn.CreateCommand()
  $cmd.CommandTimeout = 600
  $cmd.CommandText = "RESTORE VERIFYONLY FROM DISK=N'$(SqlQuote $bak)'"
  $cmd.ExecuteNonQuery() | Out-Null
  $conn.Close(); $conn = $null

  $arcOk = $false
  if (Test-Path $ArcOrigen) {
    robocopy $ArcOrigen "$Dest\archivos" /E /R:1 /W:1 /NFL /NDL /NJH /NJS | Out-Null
    if ($LASTEXITCODE -le 7) { $arcOk = $true } else { throw "Robocopy falló con código $LASTEXITCODE" }
  }
  if (-not $arcOk) { throw "No existe la carpeta de archivos: $ArcOrigen" }

  Get-ChildItem "$Dest\*_DB_*.bak" -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending | Select-Object -Skip $KeepBaks |
    Remove-Item -Force -ErrorAction SilentlyContinue

  $size = [math]::Round((Get-Item $bak).Length / 1MB, 2)
  $mensaje = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] OK DB=$bak (${size}MB), VERIFYONLY=OK, archivos=OK"
} catch {
  $exitCode = 1
  $mensaje = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ERROR: $($_.Exception.Message)"
  try { if ($conn) { $conn.Close() } } catch {}
}

New-Item -ItemType Directory -Path $Dest -Force | Out-Null
$mensaje | Out-File -FilePath $Log -Encoding UTF8
Write-Host $mensaje
exit $exitCode
