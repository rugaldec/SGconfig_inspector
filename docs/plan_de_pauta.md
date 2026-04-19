# Plan de Pauta — Especificación Funcional y Técnica

**SGConfi Inspector · Módulo de Inspección por Rondas**
Versión 1.0 · Abril 2026

---

## 1. Visión General

El módulo de **Pautas de Inspección** permite organizar, ejecutar y registrar rondas de inspección sobre componentes técnicos (ubicaciones nivel 4 de la jerarquía SAP). Está compuesto por dos vistas complementarias:

| Vista | Perfil | Propósito |
|-------|--------|-----------|
| **Plan de Pauta** | Administrador | Maestro de plantillas de pautas. CRUD de plantillas y programación de ejecuciones. |
| **Pautas en Ruta** | Administrador, Inspector | Ejecuciones activas y completadas. Vista operativa del inspector en campo. |

---

## 2. Plan de Pauta — Maestro de Plantillas

### 2.1 Concepto

El **Plan de Pauta** es el repositorio de **plantillas maestras** que definen qué componentes deben inspeccionarse y bajo qué disciplina. Una plantilla es permanente y reutilizable: no tiene estado propio ni período de vigencia. Puede lanzarse tantas veces como se necesite.

### 2.2 Composición de una Plantilla

```
PautaInspeccion (plantilla)
  ├── nombre              → Nombre descriptivo de la pauta
  ├── descripcion         → Detalle opcional del objetivo
  ├── disciplina_id       → Disciplina técnica asignada (Correas, Eléctrico, etc.)
  └── ubts[]              → Lista de componentes a inspeccionar (ubicaciones nivel 4)
                            ordenados por recorrido (campo `orden`)
```

### 2.3 Reglas de Plantilla

- Una plantilla puede contener componentes de **distintas áreas y plantas** — no está restringida a una zona funcional.
- La lista de componentes puede **modificarse** en cualquier momento desde el detalle de la plantilla. Los cambios se aplican a las futuras ejecuciones; las ejecuciones ya iniciadas no se ven afectadas.
- Solo el **Administrador** puede crear, editar y eliminar plantillas.
- Una plantilla solo puede tener **una ejecución activa** a la vez (estado PENDIENTE o EN_CURSO). Si ya tiene una activa, no se puede programar otra hasta que termine o venza.

### 2.4 Flujo de creación

```
Administrador
  → Menú "Plan de Pauta"
  → "Nueva Pauta"
  → Define nombre + disciplina
  → Agrega componentes desde el árbol de ubicaciones (multi-selección)
  → Guarda → Plantilla creada
  → Desde el detalle: "Programar ejecución" → define fecha inicio y fecha fin
  → Ejecución creada con estado PENDIENTE → aparece en "Pautas en Ruta"
```

---

## 3. Pautas en Ruta — Ejecuciones Operativas

### 3.1 Concepto

**Pautas en Ruta** es la vista operativa donde se visualizan y ejecutan las rondas de inspección. Muestra:

- **Rondas activas** (estado PENDIENTE o EN_CURSO) — el inspector las ejecuta en campo.
- **Rondas finalizadas** (estado COMPLETADA o VENCIDA) — historial accesible desde "Plan de Pauta".

### 3.2 Ciclo de vida de una Ejecución

```
PENDIENTE ──────► EN_CURSO ──────► COMPLETADA
    │                                   (todos los ítems inspeccionados)
    │
    └──────► VENCIDA
             (fecha_fin < hoy y no COMPLETADA)
```

| Estado | Descripción |
|--------|-------------|
| **PENDIENTE** | Creada, aún no se registró ningún ítem |
| **EN_CURSO** | Al menos un ítem inspeccionado |
| **COMPLETADA** | Todos los ítems inspeccionados |
| **VENCIDA** | Fecha de fin superada sin completarse |

### 3.3 Registro de un Ítem (Inspector en Campo)

Al marcar un componente como inspeccionado el inspector debe completar:

| Campo | Obligatoriedad | Descripción |
|-------|---------------|-------------|
| **Observación** | ✅ Obligatorio | Descripción de lo observado durante la inspección |
| **Foto de evidencia** | ✅ Obligatorio | Foto tomada en campo (comprimida automáticamente, max 2000px, JPEG 0.82) |
| Hallazgo vinculado | Opcional | Si se detecta un problema, el inspector puede crear un hallazgo desde esta misma vista |

> **Nota:** La foto y la observación son obligatorias para garantizar trazabilidad completa de cada inspección registrada.

### 3.4 Visibilidad por Rol

| Rol | Ve en "Pautas en Ruta" |
|-----|------------------------|
| **Inspector** | Solo ejecuciones activas de su disciplina asignada |
| **Administrador** | Todas las ejecuciones activas de todas las disciplinas |

---

## 4. Reporte y Registro Histórico (Plan de Pauta)

Una vez que una ejecución pasa a estado COMPLETADA o VENCIDA, queda disponible permanentemente en el **Plan de Pauta** (sección de historial) y puede:

- Verse en formato de **reporte formateado** con métricas de cobertura, inspectores participantes e ítems con foto y observación inline.
- **Exportarse como PDF** con: encabezado corporativo, metadata de la ejecución, tabla completa de ítems, sección de registro fotográfico con imágenes embebidas y resumen final.

---

## 5. Frecuencia y Relanzamiento Automático *(Feature Planificada)*

### 5.1 Objetivo

Permitir que una plantilla se **relance automáticamente** al finalizar la ejecución actual, respetando la frecuencia definida por el administrador al momento de programar. Esto elimina la necesidad de reprogramar manualmente cada ronda.

### 5.2 Modelo de Frecuencia

Al programar una ejecución, el administrador define:

| Parámetro | Descripción | Ejemplo |
|-----------|-------------|---------|
| `frecuencia_tipo` | Tipo de ciclo | `DIARIA`, `SEMANAL`, `QUINCENAL`, `MENSUAL`, `PERSONALIZADA` |
| `frecuencia_dias` | Días entre rondas (usado en PERSONALIZADA) | `14` |
| `duracion_dias` | Cuántos días dura cada ronda | `5` |
| `relanzamiento_auto` | Flag para activar el ciclo automático | `true / false` |
| `max_ejecuciones` | Límite de rondas (null = sin límite) | `12` |

### 5.3 Lógica de Relanzamiento

```
Al completarse una ejecución (todos los ítems OK) o al llegar a VENCIDA:

  si relanzamiento_auto = true
    Y ejecuciones_generadas < max_ejecuciones (o max = null)
    Y la pauta sigue activa:

      nueva_fecha_inicio = fecha_fin_anterior + 1 día
      nueva_fecha_fin    = nueva_fecha_inicio + duracion_dias - 1

      crear EjecucionPauta(
        pauta_id         = misma plantilla,
        fecha_inicio     = nueva_fecha_inicio,
        fecha_fin        = nueva_fecha_fin,
        estado           = 'PENDIENTE',
        origen           = 'AUTO'   ← trazabilidad
      )
```

### 5.4 Cambios de Modelo de Datos (pendiente de migración)

```prisma
model EjecucionPauta {
  // ... campos existentes ...
  frecuencia_tipo    String?   // DIARIA | SEMANAL | QUINCENAL | MENSUAL | PERSONALIZADA
  frecuencia_dias    Int?      // solo para PERSONALIZADA
  duracion_dias      Int?      // duración de cada ronda en días
  relanzamiento_auto Boolean   @default(false)
  max_ejecuciones    Int?      // null = sin límite
  ejecuciones_generadas Int    @default(0)
  origen             String    @default("MANUAL") // MANUAL | AUTO
  ejecucion_padre_id String?   // referencia a la ejecución que la generó
  ejecucion_padre    EjecucionPauta? @relation("CicloEjecucion", fields: [ejecucion_padre_id], references: [id])
  ejecuciones_hijas  EjecucionPauta[] @relation("CicloEjecucion")
}
```

### 5.5 Pantallas afectadas

**Formulario "Programar ejecución"** — nuevos campos:
```
┌─────────────────────────────────────────────┐
│  Fecha inicio    [____/____/________]        │
│  Fecha fin       [____/____/________]        │
│                                              │
│  ☐ Relanzamiento automático al finalizar    │
│                                              │
│  Frecuencia      [Semanal        ▼]          │
│  Duración ronda  [5] días                    │
│  Máx. ejecuciones [12]  (dejar vacío = ∞)   │
└─────────────────────────────────────────────┘
```

**Vista "Pautas en Ruta"** — indicador de ciclo:
- Badge "🔄 Auto" en tarjetas generadas automáticamente
- Contador "Ronda 3 de 12" visible en la tarjeta

**Plan de Pauta → Detalle de plantilla** — historial encadenado:
- Las ejecuciones generadas automáticamente aparecen agrupadas como "Ciclo" en el historial con su árbol de rondas.

### 5.6 Implementación sugerida

El relanzamiento puede manejarse de dos formas:

**Opción A — Trigger en el backend al marcar el último ítem:**
```js
// En marcarItem(), después de actualizar el estado a COMPLETADA:
if (todosInspeccionados && ejecucion.relanzamiento_auto) {
  await relanzarEjecucion(ejecucion)
}
```

**Opción B — Job periódico (cron):**
```js
// Cada hora, busca ejecuciones COMPLETADAS o VENCIDAS con relanzamiento_auto=true
// que no hayan generado aún su siguiente ronda
cron.schedule('0 * * * *', async () => {
  await procesarRelanzamientosPendientes()
})
```

> **Recomendación:** Opción A para el relanzamiento por COMPLETADA (instantáneo y sin delay). Opción B como respaldo para las VENCIDAS (verifica cada hora).

---

## 6. Arquitectura del Módulo

```
frontend/src/features/pautas/
├── api.js                    → Llamadas HTTP (pautas, ejecuciones, pdf)
├── schemas.js                → Validaciones Zod
├── hooks/
│   └── usePautas.js          → useQuery/useMutation para todas las operaciones
├── components/
│   ├── EstadoEjecucionBadge  → Badge de estado con colores
│   ├── ProgresoPauta         → Donut de cobertura %
│   └── ItemEjecucionRow      → Fila de ítem con acciones
└── pages/
    ├── PautasPage            → Lista de plantillas (admin)
    ├── NuevaPautaPage        → Formulario de nueva plantilla
    ├── PautaDetallePage      → Detalle + historial + programar ejecución
    ├── MisPautasPage         → "Pautas en Ruta" (inspector + admin)
    ├── EjecucionDetallePage  → Ejecución en campo con registro foto
    ├── HistorialPautasPage   → "Plan de Pauta" historial completadas/vencidas
    └── ReporteEjecucionPage  → Reporte formateado + exportar PDF

backend/src/
├── controllers/
│   ├── pautasController.js       → CRUD plantillas + programar ejecución
│   └── ejecucionesController.js  → Activas, historial, marcar ítem, PDF
├── routes/
│   ├── pautas.js                 → /api/pautas (solo ADMIN)
│   └── ejecuciones.js            → /api/ejecuciones
└── utils/
    └── pdfEjecucion.js           → Generación PDF con pdfkit
```

---

## 7. Endpoints API

### Plantillas (`/api/pautas` — solo ADMINISTRADOR)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/pautas` | Listar plantillas |
| POST | `/api/pautas` | Crear plantilla |
| GET | `/api/pautas/:id` | Detalle + historial de ejecuciones |
| PATCH | `/api/pautas/:id` | Actualizar nombre/descripción/ubts |
| POST | `/api/pautas/:id/ejecuciones` | Programar nueva ejecución |
| GET | `/api/pautas/:id/ejecuciones` | Historial de ejecuciones de la plantilla |

### Ejecuciones (`/api/ejecuciones`)

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/activas` | INSPECTOR, ADMIN | Ejecuciones en curso |
| GET | `/historial` | INSPECTOR, ADMIN, SUPERVISOR | Completadas + vencidas |
| GET | `/:id` | Autenticado | Detalle completo con ítems |
| GET | `/:id/pdf` | Autenticado | Exportar reporte PDF |
| PATCH | `/:id/items/:itemId` | INSPECTOR, ADMIN | Registrar inspección (foto + observación) |

---

## 8. Reglas de Negocio Clave

1. **Solo una ejecución activa por plantilla** — se valida en backend al programar.
2. **Foto y observación obligatorias** al marcar un ítem como inspeccionado.
3. **Un ítem ya inspeccionado no puede re-inspeccionarse** — retorna 409 con mensaje descriptivo.
4. **Inspector solo inspecciona su disciplina** — validación en backend; admin bypasea esta restricción.
5. **Ítem marcado por otro inspector** — visible con fondo verde, sin botones de acción.
6. **PDF incluye fotos embebidas** — si el storage es local lee el archivo; si es S3 hace fetch. WebP se omite por limitación de pdfkit.
7. **Ejecución COMPLETADA** → estado se actualiza automáticamente al marcar el último ítem.

---

*Documento generado para SGConfi Inspector · Sistema de Gestión de Hallazgos y Pautas de Inspección*
