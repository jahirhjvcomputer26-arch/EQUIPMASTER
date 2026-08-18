# EquipMaster v2.0

Sistema de inventario TI reconstruido con arquitectura modular (React + Node.js), usando la **misma base Firebase** que `INVEQUP2.html`.

## Estructura

```
EquipMaster/
├── frontend/          React + Vite + Tailwind
│   ├── src/pages/     Login, Dashboard, Inventario, Ventas, MercadoLibre, Devoluciones
│   └── src/componentes/
├── backend/           Node.js + Express
│   └── src/routes/    usuarios, inventario, ventas, reportes
└── INVEQUP2.html      (original intacto en carpeta padre)
```

## Requisitos

- Node.js 18+
- Misma conexión Firebase: `inventarioequip-default-rtdb.firebaseio.com`

## Instalación

```bash
cd EquipMaster
npm run install:all
```

## Ejecutar en desarrollo

Abre **dos terminales** o usa:

```bash
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

## Módulos

| Módulo | Ruta frontend | API backend |
|--------|---------------|-------------|
| Login / Registro | `/login` | `POST /api/usuarios/login`, `/register` |
| Dashboard | `/` | Tiempo real Firebase + gráficas |
| Entrada / Triage | `/inventario` | `PUT /api/inventario/:codigo` |
| Venta Local | `/ventas` | `POST /api/ventas/local` |
| Venta ML | `/mercadolibre` | `POST /api/ventas/mercadolibre` |
| Devoluciones | `/devoluciones` | `POST /api/ventas/devolucion` |
| Base de Datos | `/base-datos` | `GET /api/reportes/excel` |

## Firebase

Los usuarios se guardan en `usuarios/` y el inventario en `inventario/` — igual que el HTML original.

Ver en consola: https://console.firebase.google.com → Realtime Database → proyecto **inventarioequip**

## JVBOT

JVBOT está disponible para usuarios con el permiso `ver_inventario` desde el botón flotante del frontend. Sus consultas de inventario usan herramientas controladas sobre la API y no permiten SQL generado por el modelo. El script `Iniciar Backend.bat` activa Ollama local (`llama3.2:latest`) para conversación natural sin enviar datos a terceros. También admite proveedores compatibles mediante `AI_API_KEY`, `AI_BASE_URL` y `AI_MODEL` desde `backend/.env.example`.

La primera fase es de solo lectura: inventario, búsqueda por texto/SKU, stock bajo, agotados, valor estimado y antigüedad. Las acciones de escritura y confirmaciones quedan fuera de esta fase.

La memoria de JVBOT es independiente por usuario y solo guarda instrucciones explícitas, como `recuerda que prefiero respuestas cortas`. No aprende ni altera automáticamente datos del inventario. La memoria se puede borrar con el endpoint autenticado `DELETE /api/jvbot/memory`.

Cuando Ollama o un proveedor compatible está configurado, JVBOT usa tool-calling: el modelo interpreta la intención y selecciona capacidades generales (`searchProducts`, `getInventory`, `getProduct`, `aggregateInventory`, `getInventorySummary` y `getSalesSummary`). No existe una ruta distinta para cada redacción de la pregunta. Si el proveedor tarda o falla, se usa un fallback de solo lectura con respuestas verificables.

## Nota

El archivo `INVEQUP2.html` **no fue modificado** por esta migración. Ambos sistemas pueden coexistir y comparten los mismos datos en Firebase.
