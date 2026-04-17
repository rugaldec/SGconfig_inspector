# Plan: Pautas de Inspección

## Concepto General

Una **pauta de inspección** es un recorrido planificado por un conjunto de ubicaciones técnicas (UBT) que una disciplina debe ejecutar periódicamente. A diferencia del flujo actual —donde el inspector crea hallazgos de forma espontánea desde el campo— las pautas estructuran el trabajo: los inspectores saben de antemano qué equipos deben revisar, los van marcando como inspeccionados, y pueden crear hallazgos directamente sobre ellos durante el recorrido.

### Plantilla vs. Ejecución

El modelo central distingue dos conceptos que no deben confundirse:

- **Pauta (plantilla):** define *qué* se inspecciona — nombre, disciplina, zona funcional y lista fija de UBTs. Es permanente y reutilizable. Un supervisor la crea una sola vez.
- **Ejecución:** representa *cuándo* se realizó — un período concreto (fecha inicio/fin), el estado de avance y quiénes participaron. Cada vez que se programa una nueva ronda de la misma pauta, se crea una nueva ejecución sobre la misma plantilla.

Esto permite que la pauta "Ronda Semanal Correas Área Norte" exista una sola vez, pero tenga un historial de 52 ejecuciones anuales, cada una con sus participantes, fechas y hallazgos.

---

## Problema que Resuelve

Hoy el sistema registra hallazgos, pero no tiene memoria de qué fue inspeccionado y qué no. Un supervisor no puede saber si la ausencia de hallazgos en una zona significa que todo está bien o que simplemente nadie fue a mirar. Las pautas resuelven esto: cada ejecución queda registrada con quién inspeccionó cada componente, independientemente de si se encontró algo o no.

---

## Entidades Principales

### Disciplina

Categoría técnica a la que pertenecen los inspectores. Determina qué pautas pueden ver y ejecutar.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | |
| `nombre` | texto | Ej: "Correas", "Eléctrico", "Estructural", "Instrumentación" |
| `descripcion` | texto (opcional) | |
| `activo` | boolean | Si aparece disponible para asignar |

> La disciplina es un catálogo administrado por el Administrador, no un enum fijo en código.

### Usuario — extensión

El modelo `Usuario` existente agrega una relación opcional a `Disciplina`:

| Campo nuevo | Tipo | Descripción |
|-------------|------|-------------|
| `disciplina_id` | FK → Disciplina (nullable) | Solo aplica a inspectores. Null para SUPERVISOR y ADMINISTRADOR. |

### Pauta (Plantilla)

Define el *qué*: los equipos a inspeccionar y la disciplina responsable. No cambia entre ejecuciones.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | |
| `nombre` | texto | Ej: "Ronda Semanal Correas Área Norte" |
| `descripcion` | texto (opcional) | Instrucciones o contexto para el equipo |
| `disciplina_id` | FK → Disciplina | Equipo responsable |
| `zona_funcional_id` | FK → UBT nivel 2 | Área de referencia |
| `activo` | boolean | Si puede programarse para nuevas ejecuciones |
| `created_by` | FK → Usuario | Quien la creó |
| `created_at` | timestamp | |

### UBT de Pauta

Tabla de unión entre la plantilla y sus ubicaciones técnicas. Define la lista fija de componentes y el orden de recorrido.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | |
| `pauta_id` | FK → Pauta | Plantilla a la que pertenece |
| `ubicacion_tecnica_id` | FK → UBT nivel 4 | Componente a inspeccionar |
| `orden` | integer | Orden sugerido de recorrido |

### Ejecución de Pauta

Representa *cuándo* se realiza la ronda. Cada ejecución es una instancia de la plantilla en un período concreto.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | |
| `pauta_id` | FK → Pauta | Plantilla ejecutada |
| `fecha_inicio` | date | Inicio del período |
| `fecha_fin` | date | Fecha límite para completarla |
| `estado` | enum | `PENDIENTE` / `EN_CURSO` / `COMPLETADA` / `VENCIDA` |
| `fecha_completada` | timestamp (nullable) | Cuándo se marcó el último ítem |
| `created_by` | FK → Usuario | Supervisor que programó esta ejecución |
| `created_at` | timestamp | |

### Item de Ejecución

Copia de cada UBT para una ejecución específica. Registra quién inspeccionó cada componente en esta ronda.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | |
| `ejecucion_id` | FK → Ejecucion | Ejecución a la que pertenece |
| `ubicacion_tecnica_id` | FK → UBT nivel 4 | Componente a inspeccionar (copia del orden de la plantilla) |
| `orden` | integer | Orden en esta ejecución (copiado de la plantilla al crear) |
| `inspeccionado` | boolean | Fue marcado como visitado |
| `ejecutado_por_id` | FK → Usuario (nullable) | Inspector que lo marcó |
| `fecha_inspeccion` | timestamp (nullable) | Cuándo fue marcado |
| `observacion` | texto (nullable) | Nota libre |
| `hallazgo_id` | FK → Hallazgo (nullable, único) | Hallazgo generado desde este ítem |

> Al crear una ejecución, el backend copia automáticamente todas las UBTs de `PautaUBT` a `ItemEjecucion`. El inspector nunca ve la distinción — simplemente ejecuta la lista.

---

## Relación entre Entidades

```
Disciplina
    │
    ├── tiene muchos Usuarios (inspectores)
    └── tiene muchas Pautas (plantillas)
                │
                ├── tiene muchas PautaUBT (lista fija de componentes)
                └── tiene muchas Ejecuciones
                            │
                            └── tiene muchos ItemsEjecucion
                                        │
                                        ├── ejecutado_por → Usuario
                                        └── hallazgo_id  → Hallazgo (opcional)
```

---

## Flujo de Trabajo

### Administrador — Gestión de Disciplinas

1. Crea y mantiene el catálogo de disciplinas.
2. Asigna disciplina a cada inspector en gestión de usuarios.

### Supervisor / Admin — Gestión de Plantillas

1. Crea la plantilla una sola vez: nombre, disciplina, zona y lista de UBTs.
2. La plantilla queda disponible para programar ejecuciones indefinidamente.
3. Puede editar la lista de UBTs (agrega o quita componentes) para que las próximas ejecuciones reflejen cambios en planta. Las ejecuciones pasadas conservan sus ítems sin cambios.

### Supervisor / Admin — Programar una Ejecución

1. Desde el detalle de la plantilla, presiona "Programar nueva ejecución".
2. Define solo el período (fecha inicio y fin).
3. El sistema crea la ejecución y copia los ítems desde la plantilla.
4. Los inspectores de esa disciplina la ven disponible al instante.

### Inspector — Ejecución de Pautas

1. Ve las ejecuciones **activas** de su disciplina (estado PENDIENTE o EN_CURSO dentro del período vigente).
2. Cada ejecución muestra progreso del equipo: cuántos ítems completó el equipo en total.
3. Al abrir una ejecución ve la lista de UBTs con indicación de cuáles tomó un compañero (nombre + hora).
4. Para cada ítem **pendiente** puede:
   - **Marcar como inspeccionado**: registra su nombre y timestamp.
   - **Crear hallazgo**: abre el formulario con la UBT pre-cargada; al guardar vincula el hallazgo al ítem y lo marca como inspeccionado.
   - **Agregar observación**: nota libre sin hallazgo formal.
5. Ítems marcados por otro compañero son visibles pero no re-inspeccionables.
6. Al marcar todos los ítems, la ejecución pasa a `COMPLETADA` automáticamente.

---

## Historial de Ejecuciones

Al ver el detalle de una plantilla, el supervisor encuentra una sección **"Historial de ejecuciones"** con todas las rondas pasadas y en curso.

### Vista de Historial (listado)

Cada fila del historial muestra:

| Columna | Contenido |
|---------|-----------|
| Período | "01/04/2026 — 07/04/2026" |
| Estado | Badge (completada / vencida / en curso) |
| Cobertura | "12/12 ítems" o "10/12 ítems (83%)" |
| Inspectores | Avatares/nombres de quienes participaron |
| Hallazgos | Cantidad de hallazgos generados en esa ronda |
| Fecha de cierre | Cuándo se marcó el último ítem (si está completada) |

El historial se ordena del más reciente al más antiguo, paginado.

### Vista de Detalle de una Ejecución Pasada

Al hacer clic en una fila del historial:

- Lista completa de ítems con: UBT, quién lo inspeccionó, hora, observación y link al hallazgo si lo generó.
- Sección de hallazgos generados en esa ronda.
- Resumen por inspector: "Juan Pérez inspeccionó 8 ítems · María López inspeccionó 4 ítems".

---

## Estados de la Ejecución

```
PENDIENTE → EN_CURSO → COMPLETADA
               ↓
            VENCIDA  (calculado: fecha_fin < hoy AND estado != COMPLETADA)
```

- `VENCIDA` no se almacena, se calcula al consultar.
- Una ejecución vencida puede seguir ejecutándose (registro tardío); `fecha_completada` refleja la fecha real.

---

## Impacto en la UI

### Inspector — Pantalla Principal

Sección **"Pautas de mi Disciplina"**:
- Solo muestra ejecuciones activas (PENDIENTE o EN_CURSO con `fecha_fin >= hoy`).
- Tarjeta con nombre de la plantilla, período, barra de progreso del equipo.
- Subtexto: "X inspeccionados por ti · Y en total por el equipo".
- Badge de urgencia si vence en ≤ 2 días.

### Supervisor — Vista de Plantilla

Dos pestañas:
1. **Definición**: nombre, disciplina, zona y lista de UBTs configuradas.
2. **Historial**: tabla de ejecuciones pasadas y en curso con los datos de la sección anterior.

Botón permanente: "Programar nueva ejecución" (abre modal con solo las fechas).

### Supervisor — Listado de Pautas

Página `/pautas` con listado de **plantillas** filtrable por disciplina, zona y estado (activa/inactiva).

### Supervisor — Ejecuciones en Curso

Vista `/pautas/ejecuciones` o sección en el dashboard: todas las ejecuciones activas de todas las disciplinas, con su estado de avance. Permite supervisar el trabajo de campo en tiempo real.

---

## Integración con Features Existentes

- **Usuarios**: `FormUsuario` agrega selector de disciplina para rol INSPECTOR.
- **UbicacionSelector**: se reutiliza en el formulario de plantilla, extendido para multi-selección en nivel 4.
- **Hallazgos**: `NuevoHallazgoPage` acepta `?ejecucionItemId=` en la URL para vincular el hallazgo al ítem al guardar.
- **Dashboard**: panel de cobertura — % de ejecuciones completadas a tiempo en el período activo, por disciplina.

---

## Consideraciones de Offline

- Al abrir la app, las ejecuciones activas de la disciplina se cachean en IndexedDB.
- Las marcas se encolan en `offlineQueue` con `{ ejecucionItemId, observacion, timestamp }`.
- Al sincronizar, el servidor valida que el ítem siga pendiente; si otro inspector lo tomó primero devuelve 409 con el nombre del compañero.
- La creación de hallazgos offline sigue el mecanismo existente.

---

## Estructura de Archivos Nueva

```
frontend/src/features/pautas/
├── api.js
├── schemas.js
├── hooks/
│   ├── usePautas.js               # listado de plantillas
│   ├── usePautaDetalle.js         # plantilla + historial de ejecuciones
│   ├── useEjecucionDetalle.js     # detalle de una ejecución
│   └── useEjecutarPauta.js        # marcar ítems
├── pages/
│   ├── PautasPage.jsx             # listado plantillas (supervisor/admin)
│   ├── NuevaPautaPage.jsx         # crear plantilla
│   ├── PautaDetallePage.jsx       # definición + historial + programar ejecución
│   ├── EjecucionDetallePage.jsx   # ejecutar o ver detalle de una ronda
│   └── MisPautasPage.jsx          # ejecuciones activas del inspector
└── components/
    ├── PautaCard.jsx
    ├── EjecucionRow.jsx            # fila del historial
    ├── ItemEjecucionRow.jsx        # ítem dentro de una ejecución
    ├── HistorialEjecuciones.jsx    # tabla del historial con paginación
    ├── ResumenInspectores.jsx      # desglose de participantes
    ├── ProgresoPauta.jsx
    └── SelectorUBTMulti.jsx

frontend/src/features/disciplinas/
├── api.js
├── hooks/
│   └── useDisciplinas.js
└── pages/
    └── DisciplinasPage.jsx

backend/src/
├── routes/
│   ├── pautas.js
│   └── disciplinas.js
└── controllers/
    ├── pautasController.js
    └── disciplinasController.js

# Nuevas tablas en schema.prisma:
# Disciplina
# PautaInspeccion (plantilla)
# PautaUBT (UBTs de la plantilla)
# EjecucionPauta
# ItemEjecucion
# + campo disciplina_id en Usuario
```

---

## Modelo de Datos Prisma (esquema)

```prisma
model Disciplina {
  id          String            @id @default(uuid())
  nombre      String            @unique
  descripcion String?
  activo      Boolean           @default(true)
  usuarios    Usuario[]
  pautas      PautaInspeccion[]
  created_at  DateTime          @default(now())
}

// En el modelo Usuario existente, agregar:
// disciplina    Disciplina? @relation(fields: [disciplina_id], references: [id])
// disciplina_id String?

model PautaInspeccion {
  id                String           @id @default(uuid())
  nombre            String
  descripcion       String?
  disciplina        Disciplina       @relation(fields: [disciplina_id], references: [id])
  disciplina_id     String
  zona_funcional    UbicacionTecnica @relation(fields: [zona_funcional_id], references: [id])
  zona_funcional_id String
  activo            Boolean          @default(true)
  creado_por        Usuario          @relation("PautasCreadas", fields: [created_by], references: [id])
  created_by        String
  ubts              PautaUBT[]
  ejecuciones       EjecucionPauta[]
  created_at        DateTime         @default(now())
  updated_at        DateTime         @updatedAt
}

model PautaUBT {
  id                   String           @id @default(uuid())
  pauta                PautaInspeccion  @relation(fields: [pauta_id], references: [id])
  pauta_id             String
  ubicacion_tecnica    UbicacionTecnica @relation(fields: [ubicacion_tecnica_id], references: [id])
  ubicacion_tecnica_id String
  orden                Int

  @@unique([pauta_id, ubicacion_tecnica_id])
}

model EjecucionPauta {
  id               String          @id @default(uuid())
  pauta            PautaInspeccion @relation(fields: [pauta_id], references: [id])
  pauta_id         String
  fecha_inicio     DateTime
  fecha_fin        DateTime
  estado           EstadoPauta     @default(PENDIENTE)
  fecha_completada DateTime?
  creado_por       Usuario         @relation("EjecucionesCreadas", fields: [created_by], references: [id])
  created_by       String
  items            ItemEjecucion[]
  created_at       DateTime        @default(now())
}

model ItemEjecucion {
  id                   String         @id @default(uuid())
  ejecucion            EjecucionPauta @relation(fields: [ejecucion_id], references: [id])
  ejecucion_id         String
  ubicacion_tecnica    UbicacionTecnica @relation(fields: [ubicacion_tecnica_id], references: [id])
  ubicacion_tecnica_id String
  orden                Int
  inspeccionado        Boolean        @default(false)
  ejecutado_por        Usuario?       @relation("ItemsEjecutados", fields: [ejecutado_por_id], references: [id])
  ejecutado_por_id     String?
  fecha_inspeccion     DateTime?
  observacion          String?
  hallazgo             Hallazgo?      @relation(fields: [hallazgo_id], references: [id])
  hallazgo_id          String?        @unique
}

enum EstadoPauta {
  PENDIENTE
  EN_CURSO
  COMPLETADA
}
```

---

## Endpoints Backend

### Disciplinas

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| `GET` | `/api/disciplinas` | Listar disciplinas activas | Todos |
| `POST` | `/api/disciplinas` | Crear disciplina | ADMIN |
| `PATCH` | `/api/disciplinas/:id` | Editar | ADMIN |
| `DELETE` | `/api/disciplinas/:id` | Eliminar (solo si sin inspectores ni pautas) | ADMIN |

### Pautas (Plantillas)

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| `GET` | `/api/pautas` | Listar plantillas | SUPERVISOR, ADMIN |
| `POST` | `/api/pautas` | Crear plantilla con UBTs | SUPERVISOR, ADMIN |
| `GET` | `/api/pautas/:id` | Detalle de plantilla + historial de ejecuciones | SUPERVISOR, ADMIN |
| `PATCH` | `/api/pautas/:id` | Editar nombre/descripción/UBTs/activo | SUPERVISOR, ADMIN |

### Ejecuciones

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| `POST` | `/api/pautas/:id/ejecuciones` | Programar nueva ejecución (copia UBTs) | SUPERVISOR, ADMIN |
| `GET` | `/api/pautas/:id/ejecuciones` | Historial de ejecuciones de una plantilla | SUPERVISOR, ADMIN |
| `GET` | `/api/ejecuciones/activas` | Ejecuciones activas de la disciplina del inspector | INSPECTOR |
| `GET` | `/api/ejecuciones/:id` | Detalle de una ejecución con ítems y resumen | Todos |
| `PATCH` | `/api/ejecuciones/:id/items/:itemId` | Marcar ítem como inspeccionado | INSPECTOR |

#### Lógica de `POST /api/pautas/:id/ejecuciones`

1. Valida que la plantilla esté activa.
2. Valida que no haya otra ejecución activa (PENDIENTE o EN_CURSO) para la misma plantilla.
3. Copia todas las `PautaUBT` como `ItemEjecucion` con `inspeccionado: false`.
4. Retorna la ejecución creada.

#### Lógica de `PATCH /api/ejecuciones/:id/items/:itemId`

1. El inspector autenticado pertenece a la disciplina de la pauta.
2. El ítem está en `inspeccionado: false`.
3. Graba `ejecutado_por_id`, `fecha_inspeccion` y `observacion`.
4. Si todos los ítems quedan inspeccionados → `ejecucion.estado = COMPLETADA`, graba `fecha_completada`.
5. Si era el primer ítem → `ejecucion.estado = EN_CURSO`.
6. Retorna 409 si el ítem ya fue tomado (para conflicto offline).

---

## Query Keys React Query

```js
['disciplinas']                        // catálogo
['pautas']                             // listado plantillas supervisor
['pautas', filtros]                    // listado con filtros
['pauta', id]                          // detalle plantilla + últimas ejecuciones
['pauta', id, 'ejecuciones']           // historial completo paginado
['ejecuciones', 'activas']             // ejecuciones activas del inspector
['ejecucion', id]                      // detalle de una ejecución
```

---

## Orden de Implementación Sugerido

1. **Migración DB**: `Disciplina`, `disciplina_id` en `Usuario`, `PautaInspeccion`, `PautaUBT`, `EjecucionPauta`, `ItemEjecucion`.
2. **Backend — Disciplinas**: CRUD.
3. **Backend — Plantillas**: crear y editar plantillas con UBTs.
4. **Backend — Ejecuciones**: programar, listar historial y marcar ítems.
5. **Frontend — Admin**: página CRUD disciplinas + disciplina en formulario de usuario.
6. **Frontend — Inspector**: pantalla de ejecuciones activas y flujo de ejecución por ítem.
7. **Frontend — Supervisor**: crear plantilla, programar ejecución, historial con detalle.
8. **Offline**: encolar marcas, manejar 409 al sincronizar.
9. **Dashboard**: cobertura de inspección por disciplina.

Los pasos 5, 6 y 7 pueden desarrollarse en paralelo. El paso 8 puede diferirse sin romper el flujo principal.
