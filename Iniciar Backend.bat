@echo off
title EquipMaster - Backend
cd /d "C:\Users\Lenovo\Desktop\INVENTARIO DE EQUIPOS 2.0\EquipMaster\backend"
echo Iniciando backend...
set LLM_PROVIDER=ollama
set LLM_BASE_URL=http://127.0.0.1:11434/v1
set LLM_MODEL=llama3.2:latest
set LLM_API_KEY=local
set AI_TIMEOUT_MS=30000
npm run dev
