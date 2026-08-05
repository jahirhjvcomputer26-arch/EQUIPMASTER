# ============================================================
#  EquipMaster - Generar certificado auto-firmado para HTTPS
#  Ejecutar COMO ADMINISTRADOR en el servidor.
# ============================================================
$ErrorActionPreference = 'Stop'
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Write-Host "[ERROR] Ejecuta PowerShell como ADMINISTRADOR." -ForegroundColor Red; exit 1
}

Write-Host "[INFO] Generando certificado auto-firmado (valido 5 años)..." -ForegroundColor Cyan
$cert = New-SelfSignedCertificate `
  -DnsName "EquipMaster", "192.168.100.182", "localhost" `
  -CertStoreLocation "Cert:\LocalMachine\My" `
  -KeyExportPolicy Exportable `
  -NotAfter (Get-Date).AddYears(5)

$pwd = ConvertTo-SecureString -String "equipmaster" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath "C:\EquipMaster\cert.pfx" -Password $pwd
Export-Certificate -Cert $cert -FilePath "C:\EquipMaster\cert.cer"

Write-Host "[OK] cert.pfx  → C:\EquipMaster\cert.pfx" -ForegroundColor Green
Write-Host "[OK] cert.cer  → C:\EquipMaster\cert.cer" -ForegroundColor Green
Write-Host ""
Write-Host "Ahora configura el archivo .env del backend:" -ForegroundColor Cyan
Write-Host "  Agrega al final de C:\EquipMaster\backend\.env:" -ForegroundColor White
Write-Host "    HTTPS_PFX=cert.pfx" -ForegroundColor White
Write-Host "    HTTPS_PASSPHRASE=equipmaster" -ForegroundColor White
Write-Host ""
Write-Host "En CADA PC cliente de la red, COMO ADMINISTRADOR:" -ForegroundColor Yellow
Write-Host "  1. Copia cert.cer a la PC (USB o red)"
Write-Host "  2. Ejecuta: certutil -addstore -f Root cert.cer"
Write-Host ""
Write-Host "Tras instalar el certificado en los clientes, abre https://192.168.100.182:3001" -ForegroundColor Cyan
Write-Host "Si ves el candado verde, todo listo." -ForegroundColor Cyan
