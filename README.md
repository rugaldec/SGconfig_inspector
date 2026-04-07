# SGConfi Inspector

Sistema de gestión de hallazgos técnicos con jerarquía SAP, roles de usuario y soporte móvil PWA.

## Requisitos

- Node.js 20+
- Docker Desktop (para PostgreSQL)
- npm

## Levantar el entorno de desarrollo

### 1. Iniciar la base de datos

```bash
docker-compose up -d
```

PostgreSQL disponible en `localhost:5432`.  
pgAdmin disponible en `http://localhost:5050` — email: `admin@sgconfi.local` / pass: `admin123`

### 2. Backend

```bash
cd backend
npm install
# Crear la base de datos y ejecutar migraciones
npm run db:migrate
# Cargar datos iniciales
npm run db:seed
# Iniciar servidor de desarrollo
npm run dev
```

API disponible en `http://localhost:3001`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App disponible en `http://localhost:5173`

## Usuarios de prueba (seed)

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@sgconfi.local | Admin1234! | Administrador |
| supervisor@sgconfi.local | Super1234! | Supervisor |
| inspector@sgconfi.local | Inspector1234! | Inspector |

## Importar ubicaciones SAP desde Excel

Desde el panel Admin → Ubicaciones → botón "Importar Excel".

El archivo debe tener las columnas: `codigo`, `descripcion`, `nivel`, `codigo_padre`

Ejemplo:
| codigo | descripcion | nivel | codigo_padre |
|--------|-------------|-------|--------------|
| PLANTA-01 | Planta Norte | 1 | |
| SIS-MECAN | Sistema Mecánico | 2 | PLANTA-01 |
| SUB-BOMBA | Subsistema Bombas | 3 | SIS-MECAN |
| EQ-B01 | Bomba Centrífuga B-01 | 4 | SUB-BOMBA |

## Estructura del proyecto

```
SGConfi_Inspector/
├── backend/          Node.js + Express + Prisma
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── db/
│   └── uploads/      Fotos almacenadas localmente
├── frontend/         React + Vite + TailwindCSS (PWA)
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── hooks/
│       └── api/
├── docker-compose.yml
└── CLAUDE.md
```

## Build de producción

```bash
cd frontend
npm run build
# El backend servirá el frontend compilado
cd ../backend
npm start
```

Todo corre en el puerto 3001.
