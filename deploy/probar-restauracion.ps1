# EquipMaster - prueba de restauracion en base temporal
$ErrorActionPreference = 'Stop'
$Base = 'C:\EquipMaster'
$BackupDir = 'C:\Backups\EquipMaster'
$TestDb = 'EquipMaster_RestoreTest'
$TestDir = "$BackupDir\restore-test"
$EnvFile = "$Base\backend\.env"

function Read-Env($Path) {
  $r = @{}
  foreach ($line in (Get-Content -LiteralPath $Path)) {
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$') {
      $r[$matches[1]] = $matches[2].Trim().Trim([char]34).Trim([char]39)
    }
  }
  return $r
}
function Q([string]$Value) { return $Value.Replace([string][char]39, ([string][char]39) + [string][char]39) }

$v = Read-Env $EnvFile
$server = $v.DB_SERVER
$port = $v.DB_PORT
if (-not $port) { $port = '1433' }
if (-not $server.Contains('\')) { $server = "$server,$port" }
$connection = "Server=$server;Initial Catalog=master;User ID=$($v.DB_USER);Password=$($v.DB_PASSWORD);Encrypt=False;TrustServerCertificate=True"
$latest = Get-ChildItem "$BackupDir\*_DB_*.bak" -ErrorAction Stop | Sort-Object Name -Descending | Select-Object -First 1
if (-not $latest) { throw "No hay backups en $BackupDir" }

Add-Type -AssemblyName System.Data
New-Item -ItemType Directory -Path $TestDir -Force | Out-Null
icacls $TestDir /grant 'Everyone:(OI)(CI)M' /T | Out-Null
$conn = New-Object System.Data.SqlClient.SqlConnection $connection
try {
  $conn.Open()
  $cmd = $conn.CreateCommand()
  $cmd.CommandTimeout = 600
  $backupPath = Q $latest.FullName
  $cmd.CommandText = "RESTORE FILELISTONLY FROM DISK=N'$backupPath'"
  $reader = $cmd.ExecuteReader()
  $files = @()
  while ($reader.Read()) {
    $files += [pscustomobject]@{ Logical = $reader['LogicalName'].ToString(); Type = $reader['Type'].ToString() }
  }
  $reader.Close()
  if ($files.Count -eq 0) { throw 'El backup no contiene archivos SQL.' }

  $cmd.CommandText = "IF DB_ID(N'$TestDb') IS NOT NULL BEGIN ALTER DATABASE [$TestDb] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [$TestDb]; END"
  $cmd.ExecuteNonQuery() | Out-Null

  $moves = @()
  $n = 0
  foreach ($f in $files) {
    if ($f.Type -eq 'L') { $ext = 'ldf' } elseif ($n -eq 0) { $ext = 'mdf' } else { $ext = "ndf$n" }
    $target = "$TestDir\${TestDb}_$ext"
    $moves += "MOVE N'$(Q $f.Logical)' TO N'$(Q $target)'"
    $n++
  }
  $moveText = $moves -join ', '
  $cmd.CommandText = "RESTORE DATABASE [$TestDb] FROM DISK=N'$backupPath' WITH $moveText, REPLACE, RECOVERY"
  $cmd.ExecuteNonQuery() | Out-Null
  $cmd.CommandText = "USE [$TestDb]; SELECT COUNT(*) FROM dbo.Inventario"
  $count = $cmd.ExecuteScalar()
  Write-Host "RESTAURACION OK: $($latest.Name)" -ForegroundColor Green
  Write-Host "Inventario restaurado: $count registros" -ForegroundColor Green
  $cmd.CommandText = "USE master; ALTER DATABASE [$TestDb] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [$TestDb]"
  $cmd.ExecuteNonQuery() | Out-Null
  Write-Host 'Base temporal eliminada correctamente.' -ForegroundColor Green
} finally {
  if ($conn) { $conn.Close() }
  Remove-Item $TestDir -Recurse -Force -ErrorAction SilentlyContinue
}
