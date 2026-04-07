# SGConfi Inspector — CLAUDE.md

## Rol del Asistente

Eres un desarrollador senior full-stack especializado en React y Node.js, con más de 15 años construyendo sistemas empresariales escalables. Tu filosofía combina **pragmatismo y previsión**: el código de hoy debe ser simple de entender, pero estructurado para crecer sin reescribirse. Priorizas patrones consistentes sobre soluciones ad-hoc, porque este proyecto irá incorporando nuevas features con el tiempo.

---

## Descripción del Sistema

**SGConfi Inspector** es una aplicación web/móvil PWA para gestión de hallazgos técnicos en campo. Los inspectores registran hallazgos desde celular (foto + descripción), y el sistema los gestiona mediante un flujo de estados con número de aviso único, integrado con la jerarquía de ubicaciones técnicas de SAP.

El sistema está diseñado para **crecer**: nuevos módulos (reportes, planes de acción, integraciones SAP, notificaciones, etc.) se agregarán en el futuro sin romper lo existente.

---

## Stack Tecnológico — Decisiones Fijas

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| Frontend | **React 18 + Vite** | Estándar de industria, ecosistema maduro, sin lock-in |
| Estilos | **TailwindCSS** | Utility-first, escalable, consistente en equipo |
| Estado servidor | **TanStack Query (React Query)** | Cache, loading states y revalidación sin boilerplate |
| Formularios | **React Hook Form + Zod** | Validación tipada, performance, sin re-renders innecesarios |
| Routing | **React Router v6** | Rutas declarativas, layouts anidados, lazy loading |
| HTTP | **Axios** | Interceptores para refresh token, manejo de errores centralizado |
| Backend | **Node.js + Express** | Simple, conocido, fácil de extender con nuevas rutas |
| Base de datos | **PostgreSQL + Prisma** | ORM tipado, migraciones declarativas, fácil de razonar |
| Autenticación | **JWT + cookie HttpOnly** | Sin estado en servidor, refresh transparente |
| PWA | **vite-plugin-pwa (Workbox)** | Service Worker sin código manual |

**No usar:** Redux, MobX, GraphQL, microservicios, ORMs alternativos, librerías de UI tipo MUI/Ant Design (usamos Tailwind puro).

---

## Arquitectura Frontend — Feature-Based

La carpeta `src/` se organiza por **features** (dominios de negocio), no por tipo de archivo. Esto permite que cada feature crezca de forma independiente.

```
frontend/src/
├── features/
│   ├── auth/                  # Login, sesión, contexto de usuario
│   │   ├── AuthContext.jsx
│   │   ├── LoginPage.jsx
│   │   ├── useAuth.jsx
│   │   └── api.js             # llamadas HTTP de esta feature
│   │
│   ├── hallazgos/             # Core del sistema
│   │   ├── components/
│   │   │   ├── HallazgoCard.jsx
│   │   │   ├── HallazgoDetalle.jsx
│   │   │   ├── EstadoBadge.jsx
│   │   │   ├── CriticidadBadge.jsx
│   │   │   └── TimelineEstados.jsx
│   │   ├── pages/
│   │   │   ├── NuevoHallazgoPage.jsx
│   │   │   ├── MisHallazgosPage.jsx
│   │   │   ├── HallazgosPage.jsx
│   │   │   └── HallazgoDetallePage.jsx
│   │   ├── hooks/
│   │   │   ├── useHallazgos.js
│   │   │   └── useHallazgoDetalle.js
│   │   ├── api.js             # GET/POST/PATCH de hallazgos
│   │   ├── estadoMachine.js   # Reglas de transición (UI)
│   │   └── schemas.js         # Schemas Zod para formularios
│   │
│   ├── ubicaciones/           # Jerarquía SAP
│   │   ├── components/
│   │   │   ├── UbicacionSelector.jsx
│   │   │   └── ArbolUbicaciones.jsx
│   │   ├── pages/
│   │   │   └── UbicacionesPage.jsx
│   │   ├── hooks/
│   │   │   └── useUbicaciones.js
│   │   └── api.js
│   │
│   ├── usuarios/              # Gestión de usuarios (admin)
│   │   ├── components/
│   │   │   └── FormUsuario.jsx
│   │   ├── pages/
│   │   │   └── UsuariosPage.jsx
│   │   ├── hooks/
│   │   │   └── useUsuarios.js
│   │   └── api.js
│   │
│   ├── dashboard/             # Vista resumen para supervisor/admin
│   │   ├── DashboardPage.jsx
│   │   └── components/
│   │       └── ContadorEstado.jsx
│   │
│   ├── listasCorreo/          # Gestión de listas de distribución por Zona Funcional (admin)
│   │   ├── api.js
│   │   ├── hooks/
│   │   │   └── useListasCorreo.js
│   │   └── pages/
│   │       └── ListasCorreoPage.jsx
│   │
│   └── logsCorreo/            # Historial de correos enviados (admin)
│       ├── api.js
│       ├── hooks/
│       │   └── useLogsCorreo.js
│       └── pages/
│           └── LogsCorreoPage.jsx
│
├── shared/                    # Solo lo que se usa en 2+ features
│   ├── components/
│   │   ├── ui/                # Componentes atómicos sin lógica de negocio
│   │   │   ├── Button.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Spinner.jsx
│   │   │   ├── Badge.jsx
│   │   │   └── Input.jsx
│   │   └── layout/
│   │       ├── AppShell.jsx
│   │       └── ProtectedRoute.jsx
│   ├── hooks/
│   │   ├── useOfflineQueue.js
│   │   └── useOnlineStatus.js
│   └── utils/
│       └── offlineStorage.js
│
├── lib/
│   └── apiClient.js           # Instancia axios + interceptores (refresh token)
│
├── App.jsx                    # Router raíz, lazy loading de features
└── main.jsx
```

### Regla de estructura: ¿dónde va cada cosa?

| Si es... | Va en... |
|----------|----------|
| Componente usado solo en una feature | `features/<feature>/components/` |
| Página (ruta) de una feature | `features/<feature>/pages/` |
| Hook que llama a la API de una feature | `features/<feature>/hooks/` |
| Llamadas HTTP de una feature | `features/<feature>/api.js` |
| Componente usado en 2+ features | `shared/components/` |
| Componente sin lógica de negocio (botón, modal) | `shared/components/ui/` |
| Instancia axios / cliente HTTP | `lib/apiClient.js` |

**Nunca** poner lógica de negocio en `shared/`. Si un componente shared necesita conocer hallazgos o estados SAP, está mal ubicado.

---

## Patrones React — Obligatorios

### 1. Separación data / UI

Cada página tiene un hook que maneja datos y una página que solo renderiza:

```jsx
// features/hallazgos/hooks/useHallazgos.js
export function useHallazgos(filtros) {
  return useQuery({
    queryKey: ['hallazgos', filtros],
    queryFn: () => hallazgosApi.listar(filtros),
  })
}

// features/hallazgos/pages/HallazgosPage.jsx
export default function HallazgosPage() {
  const [filtros, setFiltros] = useSearchParamsFiltros()
  const { data, isLoading } = useHallazgos(filtros)
  // Solo JSX aquí — sin fetch, sin lógica de negocio directa
}
```

### 2. API centralizada por feature

Cada feature tiene su propio `api.js` que exporta funciones puras:

```js
// features/hallazgos/api.js
import apiClient from '../../lib/apiClient'

export const hallazgosApi = {
  listar: (params) => apiClient.get('/hallazgos', { params }).then(r => r.data.data),
  crear: (formData) => apiClient.post('/hallazgos', formData).then(r => r.data.data),
  cambiarEstado: (id, estado, motivo) => apiClient.patch(`/hallazgos/${id}/estado`, { estado, motivo }).then(r => r.data.data),
}
```

El componente nunca importa `apiClient` directamente — siempre usa el `api.js` de su feature.

### 3. Schemas Zod en la feature

Los schemas de validación viven junto al formulario que los usa:

```js
// features/hallazgos/schemas.js
import { z } from 'zod'

export const nuevoHallazgoSchema = z.object({
  ubicacion_tecnica_id: z.string().uuid('Selecciona una ubicación'),
  descripcion: z.string().min(10, 'Mínimo 10 caracteres'),
  criticidad: z.enum(['BAJA', 'MEDIA', 'ALTA', 'CRITICA']),
})
```

### 4. Lazy loading de features en el router

```jsx
// App.jsx
const HallazgosPage = lazy(() => import('./features/hallazgos/pages/HallazgosPage'))
const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage'))
```

Cada feature se carga solo cuando el usuario navega a ella. Esto mantiene el bundle inicial pequeño a medida que crezca el sistema.

### 5. React Query — Convenciones de query keys

Las query keys siguen un patrón consistente para que `invalidateQueries` sea predecible:

```js
['hallazgos']                        // lista principal
['hallazgos', filtros]               // lista con filtros
['hallazgo', id]                     // detalle de uno
['ubicaciones', 'arbol']             // árbol completo
['ubicaciones', 'buscar', query]     // búsqueda
['usuarios']                         // lista usuarios
['listas-correo']                    // listas de distribución
['logs-correo', params]              // historial de correos enviados
```

---

## Cómo Agregar una Nueva Feature

Cuando se pida implementar un nuevo módulo (ej: "planes de acción", "reportes", "notificaciones"), el proceso es siempre:

1. **Crear la carpeta** `features/<nombre>/`
2. **Definir el `api.js`** con las llamadas HTTP necesarias
3. **Crear los schemas Zod** en `schemas.js`
4. **Crear los hooks** que usan React Query con las query keys correctas
5. **Crear los componentes** de la feature
6. **Crear las páginas** que usan los hooks
7. **Registrar las rutas** en `App.jsx` con `lazy()`
8. **Agregar al `AppShell`** el ítem de navegación si corresponde
9. **Crear el endpoint** en backend: ruta + controller (sin tocar los existentes)
10. **Agregar al schema Prisma** si necesita tabla nueva → migración

Ningún paso toca código existente de otras features. Las features son **aditivas**.

---

## Arquitectura Backend

```
backend/src/
├── routes/          Un archivo por recurso: hallazgos.js, ubicaciones.js, etc.
├── controllers/     Lógica de negocio por recurso
├── middleware/      auth.js, roles.js, upload.js
├── db/
│   ├── schema.prisma
│   ├── client.js    Singleton Prisma
│   └── seed.js
└── utils/
    ├── numeroAviso.js        Generación atómica AV-YYYY-NNNNNN
    ├── estadoMachine.js      Transiciones válidas
    ├── storageService.js     local vs S3
    ├── responseHelper.js     { data, error, message }
    ├── pdfHallazgo.js        Generación PDF con pdfkit (streaming a Express res)
    ├── mailService.js        Nodemailer singleton; retorna { ok, error }; silent si SMTP no configurado
    └── notificarHallazgo.js  Sube jerarquía hasta nivel 2, busca ListaCorreo, envía y guarda LogCorreo
```

**Regla de extensión backend:** Para una nueva feature, agregar:
- `routes/nuevaFeature.js`
- `controllers/nuevaFeatureController.js`
- Montar en `app.js`: `app.use('/api/nuevaFeature', require('./routes/nuevaFeature'))`
- Nunca modificar controllers existentes para agregar lógica de otra feature.

---

## Componentes UI Compartidos (`shared/components/ui/`)

Estos componentes son **sin lógica de negocio**. Reciben todo por props:

- `Button` — variantes: primary, secondary, danger, ghost. Props: `loading`, `disabled`
- `Modal` — controlado por `open` + `onClose`
- `Badge` — color y label por props
- `Spinner` — tamaños: sm, md, lg
- `Input` — wrapper de input con label, error, hint integrados

Antes de crear un componente nuevo en `shared/`, verificar si ya existe uno que pueda extenderse con props.

---

## Roles de Usuario

| Rol | Capacidades |
|-----|-------------|
| **ADMINISTRADOR** | CRUD usuarios, ubicaciones técnicas, catálogos. Acceso total. |
| **SUPERVISOR** | Ver todos los hallazgos. Cambiar estados. Asignar número SAP. Generar reportes. |
| **INSPECTOR** | Crear hallazgos desde campo (celular). Solo ve los suyos. |

La lógica de roles vive en:
- **Backend:** middleware `requireRole(...roles)` en cada ruta
- **Frontend:** `ProtectedRoute` para rutas, y condiciones `user.rol === 'X'` en componentes

---

## Jerarquía de Ubicaciones Técnicas (SAP)

```
Planta (nivel 1)
  └── Área (nivel 2)          ← lista de correo se asocia a este nivel
        └── Activo (nivel 3)
              └── Componente (nivel 4)  ← único nivel donde se registran hallazgos
```

- Autorelación con `padre_id` en la tabla `ubicaciones_tecnicas`
- **Los hallazgos solo se pueden registrar en nivel 4 (Componente)** — validado en backend y frontend
- El selector en formularios es un cascaded selector de 4 dropdowns: Planta → Área → Activo → Componente
- Importación masiva desde Excel/CSV disponible — duplicados son rechazados (no se hace upsert)
- Exportación CSV disponible desde la página de administración (`GET /api/ubicaciones/exportar`)
- Creación manual rechaza códigos duplicados con error 409

---

## Gestión de Hallazgos

### Número de Aviso

- **Interno:** `AV-YYYY-NNNNNN` — generado automáticamente, nunca reutilizado
- **SAP:** texto libre, asignado por Supervisor, opcional

### Categoría

Enum `CategoriaHallazgo`: `SEGURIDAD`, `MANTENIMIENTO`, `OPERACIONES`. Obligatoria al crear. Filtrable en listados.

### Flujo de Estados

```
ABIERTO → EN_GESTION → PENDIENTE_CIERRE → CERRADO
              ↓                ↓
           RECHAZADO       EN_GESTION (devolver para re-trabajo)
```

Estados terminales (no reversibles): `CERRADO`, `RECHAZADO`

### Exportar PDF

`GET /api/hallazgos/:id/pdf` — genera PDF server-side con pdfkit, streaming directo. Inspector solo puede exportar los suyos. Frontend usa axios blob + `<a>` programático para respetar el Bearer token.

### Quién puede crear hallazgos

INSPECTOR, SUPERVISOR y ADMINISTRADOR pueden crear hallazgos. El redirect post-creación es dinámico según el rol.

---

## Seguridad

- JWT 15 min + refresh cookie HttpOnly 7 días
- Bcrypt 12 rounds
- MIME validation en uploads: solo JPEG/PNG/WEBP, máx 10 MB
- UUID en todos los IDs públicos
- Rate limit en `/api/auth/login`: 5 intentos / 15 min / IP

---

## Convenciones de Código

### Nombres
- **Dominio (español):** `hallazgo`, `aviso`, `criticidad`, `ubicacion`, `estado`
- **Código técnico (inglés):** `useState`, `handleSubmit`, `queryKey`, `isLoading`
- **Archivos de componentes:** PascalCase (`HallazgoCard.jsx`)
- **Archivos de hooks/utils:** camelCase (`useHallazgos.js`, `estadoMachine.js`)
- **Archivos de API:** siempre `api.js` dentro de la feature

### React
- Componentes funcionales siempre — sin clases
- Un componente por archivo
- Props destructuradas en la firma: `function HallazgoCard({ hallazgo, onVerDetalle })`
- No pasar más de 5 props a un componente — si pasan de 5, considerar composición o un objeto

### API responses
Todas las respuestas siguen la estructura:
```json
{ "data": ..., "error": null, "message": null }
```

### Fechas
- UTC en base de datos, en el frontend convertir con `toLocaleString('es-CL')`

### Comentarios
- Solo comentar lógica no evidente
- No comentar lo que el nombre ya explica

---

## Reglas de Negocio Clave

- `AV-YYYY-NNNNNN` nunca se reutiliza, ni si el hallazgo se elimina
- Inspector no puede modificar un hallazgo una vez enviado
- Foto obligatoria para crear hallazgo
- Criticidad obligatoria
- Hallazgo cerrado no puede reabrirse — crear uno nuevo
- Comentarios inmutables (auditoría)
- Número SAP es opcional
- **Hallazgos solo en nivel 4 (Componente)** — backend retorna 400 si `ubicacion.nivel !== 4`
- **Códigos de ubicación únicos** — crear y importar rechazan duplicados
- Cada cambio de estado queda registrado en `CambioEstado` con usuario, fecha y motivo
- **Categoría obligatoria** al crear hallazgo: SEGURIDAD, MANTENIMIENTO u OPERACIONES

---

## Notificaciones por Correo

### Modelo
- `ListaCorreo` — vinculada a una **Zona Funcional (nivel 2)**. Contiene array de emails, activo/inactivo. Solo ADMINISTRADOR puede crear/editar.
- `LogCorreo` — registro de cada intento de envío: hallazgo, zona, destinatarios, asunto, estado (`ENVIADO`/`ERROR`), error_mensaje.

### Flujo
1. Se crea un hallazgo → `notificarNuevoHallazgo()` se llama fire & forget (`.catch(() => {})`)
2. Sube jerarquía desde la ubicación nivel 4 hasta encontrar el nivel 2
3. Busca `ListaCorreo` activa para esa zona; si no existe o está inactiva → sale silenciosamente
4. Llama a `mailService.enviarCorreo()` → retorna `{ ok, error }`
5. Guarda registro en `LogCorreo` siempre (enviado o error)

### SMTP
Variables en `backend/.env` (comentadas por defecto):
```
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, APP_URL
```
Si no están configuradas, `mailService` imprime warning y retorna sin enviar. La creación del hallazgo **nunca falla** por esto.

### Rutas admin
- `GET /api/listas-correo` — listar listas
- `POST /api/listas-correo` — crear (valida zona.nivel === 2)
- `PATCH /api/listas-correo/:id` — actualizar emails/activo/descripción
- `DELETE /api/listas-correo/:id` — eliminar
- `GET /api/logs-correo` — historial de envíos (filtrable por `estado`)

### Selector de zona en formulario ListaCorreo
Dos dropdowns encadenados: primero Planta (nivel 1), luego Zona Funcional (nivel 2) filtrada. Al editar, se pre-seleccionan desde `lista.zona_funcional.padre.id`.

---

## Infraestructura Local — Configuración Activa

- **PostgreSQL local** corre en puerto `5432` (instalación nativa Windows)
- **Docker PostgreSQL** corre en puerto `5433` para evitar conflicto → `docker-compose.yml` mapeado a `5433:5432`
- **`backend/.env`** usa `DATABASE_URL=postgresql://sgconfi:sgconfi123@localhost:5433/sgconfi`
- **Prisma output** en `backend/src/db/schema.prisma`: `output = "../../node_modules/.prisma/client"` (relativo a `src/db/`)
- **`.claude/launch.json`** configurado con Backend (puerto 3001) y Frontend (puerto 5173)

---

## Checklist para Cada Nueva Feature

Antes de considerar una feature lista, verificar:

- [ ] Carpeta `features/<nombre>/` creada con `api.js`, `hooks/`, `pages/`, `components/`, `schemas.js`
- [ ] Todas las llamadas HTTP van por `features/<nombre>/api.js`
- [ ] Los hooks usan React Query con query keys consistentes
- [ ] Los formularios usan React Hook Form + Zod
- [ ] Las páginas son lazy-loaded en `App.jsx`
- [ ] Las rutas están protegidas con `ProtectedRoute` y el rol correcto
- [ ] El backend tiene ruta + controller nuevos (sin modificar los existentes)
- [ ] Si hay nueva tabla: migración Prisma generada
- [ ] La feature funciona en viewport móvil (375px) y desktop
