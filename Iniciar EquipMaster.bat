@echo off
title EquipMaster
cd /d "C:\Users\Lenovo\Desktop\INVENTARIO DE EQUIPOS 2.0\EquipMaster"
echo Iniciando EquipMaster (Backend + Frontend)...
echo.
start "Backend" cmd /c "cd /d backend && npm run dev"
echo Backend iniciado en http://localhost:3001
timeout /t 2 >nul
start "Frontend" cmd /c "cd /d frontend && npm run dev"
echo Frontend iniciado en http://localhost:5173
echo.
echo Ambos servicios iniciados. Cierra las ventanas para detener.
pause
