# ============================================================
#  EquipMaster - Respaldo diario (SQL .bak + archivos)
#  Ejecutado por la Tarea Programada "EquipMaster Respaldo".
# ============================================================
$ErrorActionPreference = 'Stop'
$Server   = '127.0.0.1,1433'
$DbUser   = 'equipmaster'
$DbPass   = 'JVCOMPUTER2026@'
$DbName   = 'EquipMaster'
$Dest     = 'C:\Backups\EquipMaster'
$ArcOrigen = 'C:\EquipMaster\backend\public\archivos'
$KeepBaks = 7
$Log      = "$Dest\ultimo-respaldo.log"

try {
  New-Item -ItemType Directory -Path $Dest -Force | Out-Null
  # El BACKUP lo ejecuta la cuenta del servicio SQL; darle escritura a la carpeta
  icacls $Dest /grant "Everyone:(OI)(CI)M" /T | Out-Null

  # --- 1) Backup de la base de datos ---
  Add-Type -AssemblyName System.Data
  $bak = "{0}\EquipMaster_DB_{1:yyyyMMdd_HHmm}.bak" -f $Dest, (Get-Date)
  $conn = New-Object System.Data.SqlClient.SqlConnection ("Server=$Server;Initial Catalog=master;User ID=$DbUser;Password=$DbPass;Encrypt=False;TrustServerCertificate=True")
  $conn.Open()
  $cmd = $conn.CreateCommand()
  $cmd.CommandText = "BACKUP DATABASE [$DbName] TO DISK='$bak' WITH INIT"
  $cmd.ExecuteNonQuery() | Out-Null
  $conn.Close()
  $bakOk = $true

  # --- 2) Copia de archivos (fotos/documentos) ---
  if (Test-Path $ArcOrigen) {
    robocopy $ArcOrigen "$Dest\archivos" /E /R:1 /W:1 /NFL /NDL /NJH | Out-Null
    $arcOk = $true
  } else { $arcOk = $false }

  # --- 3) Limpiar backups viejos ---
  Get-ChildItem "$Dest\EquipMaster_DB_*.bak" -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending | Select-Object -Skip $KeepBaks | Remove-Item -Force -ErrorAction SilentlyContinue

  $msg = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm')] OK  DB: $bak  archivos: $(if ($arcOk) { 'SI' } else { 'no existe' })"
} catch {
  $msg = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm')] ERROR: $($_.Exception.Message)"
  try { if ($conn) { $conn.Close() } } catch {}
}

$msg | Out-File -FilePath $Log -Encoding UTF8
