@echo off
title EquipMaster - Iniciando...
cd /d "%~dp0"
start "EquipMaster Backend" cmd /c "npm run dev --prefix backend"
start "EquipMaster Frontend" cmd /c "npm run dev --prefix frontend"
echo.
echo EquipMaster iniciado en modo LAN
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3001
echo.
echo Red LAN:  http://192.168.100.198:5173
echo.
pause
