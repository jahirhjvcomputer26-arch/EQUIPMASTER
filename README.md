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

## Nota

El archivo `INVEQUP2.html` **no fue modificado** por esta migración. Ambos sistemas pueden coexistir y comparten los mismos datos en Firebase.
