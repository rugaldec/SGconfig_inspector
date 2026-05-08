// Contenido de ayuda por ruta. Cada entrada define título, descripción, acciones clave y tips.
// La clave es un patrón de ruta (string o regex-like prefix) que se compara con location.pathname.

export const HELP_SECTIONS = [
  // ── INSPECTOR ───────────────────────────────────────────────────────────────
  {
    id: 'inspector-dashboard',
    titulo: 'Dashboard — Mi Disciplina',
    icono: '📊',
    roles: ['INSPECTOR'],
    rutas: ['/inspector/dashboard'],
    descripcion: 'Vista de resumen de la disciplina asignada al inspector. Muestra las pautas activas, hallazgos pendientes y actividad reciente de tu área de trabajo.',
    acciones: [
      { accion: 'Pautas activas', detalle: 'Tarjetas con las rondas de inspección en curso o pendientes asignadas a tu disciplina.' },
      { accion: 'Hallazgos recientes', detalle: 'Lista de los últimos hallazgos registrados por ti y el estado actual de cada uno.' },
      { accion: 'Indicadores', detalle: 'Contadores de ítems inspeccionados, hallazgos abiertos y pautas completadas.' },
    ],
    tips: [
      'Si ves una pauta con estado VENCIDA (en rojo), la fecha de cierre ya pasó — contacta a tu supervisor para reprogramar.',
      'Los hallazgos en amarillo llevan más de 7 días sin actividad; agrega un seguimiento para mantenerlos al día.',
    ],
  },
  {
    id: 'mis-hallazgos',
    titulo: 'Mis Hallazgos',
    icono: '📋',
    roles: ['INSPECTOR'],
    rutas: ['/inspector/hallazgos'],
    descripcion: 'Listado de todos los hallazgos que has registrado. Puedes filtrar por estado y ver el detalle de cada uno.',
    acciones: [
      { accion: 'Filtrar por estado', detalle: 'Usa las pastillas (pills) en la parte superior para mostrar solo los hallazgos en un estado específico: ABIERTO, EN_GESTION, PENDIENTE_CIERRE o CERRADO.' },
      { accion: 'Ver detalle', detalle: 'Haz clic en cualquier hallazgo de la lista para abrir su ficha completa con fotos, historial de estados y comentarios.' },
      { accion: 'Nuevo hallazgo', detalle: 'Usa el botón "Nuevo Hallazgo" o el ítem del menú para registrar uno nuevo desde campo.' },
    ],
    tips: [
      'Los hallazgos marcados con un ícono de alerta (🔔) requieren tu atención: falta información o el supervisor te solicitó una acción.',
      'Una vez enviado, no puedes modificar el hallazgo — solo agregar seguimientos o comentarios.',
    ],
  },
  {
    id: 'nuevo-hallazgo',
    titulo: 'Nuevo Hallazgo',
    icono: '➕',
    roles: ['INSPECTOR', 'SUPERVISOR', 'ADMINISTRADOR'],
    rutas: ['/inspector/nuevo', '/supervisor/nuevo', '/admin/nuevo'],
    descripcion: 'Formulario para registrar un hallazgo técnico desde campo. Incluye selección de ubicación, categoría, criticidad, descripción y hasta 5 fotos.',
    acciones: [
      { accion: '1. Seleccionar ubicación', detalle: 'Elige en cascada: Planta → Área → Activo → Componente. Solo puedes registrar en nivel Componente (nivel 4).' },
      { accion: '2. Categoría', detalle: 'Elige entre SEGURIDAD, MANTENIMIENTO u OPERACIONES según la naturaleza del problema encontrado.' },
      { accion: '3. Criticidad', detalle: 'BAJA, MEDIA, ALTA o CRÍTICA según el impacto potencial del hallazgo.' },
      { accion: '4. Descripción', detalle: 'Describe el problema con al menos 10 caracteres. Sé específico: qué observas, dónde exactamente, desde cuándo.' },
      { accion: '5. Fotos', detalle: 'Agrega entre 1 y 5 fotos del problema. La primera foto es la imagen principal. Las fotos se comprimen automáticamente antes de subir.' },
      { accion: '6. Enviar', detalle: 'Al confirmar se genera el número de aviso AV-YYYY-NNNNNN automáticamente y se notifica al supervisor por correo.' },
    ],
    tips: [
      'Toma la foto antes de llenar el formulario — en campo es más fácil.',
      'Si tienes mala señal, la app guarda el borrador localmente y lo envía cuando recuperes conexión.',
      'El número de aviso SAP se asigna posteriormente por el supervisor — el tuyo es el número interno.',
    ],
  },
  {
    id: 'hallazgo-detalle',
    titulo: 'Detalle del Hallazgo',
    icono: '🔍',
    roles: ['INSPECTOR', 'SUPERVISOR', 'ADMINISTRADOR'],
    rutas: ['/inspector/hallazgos/', '/supervisor/hallazgos/', '/admin/hallazgos/'],
    descripcion: 'Ficha completa del hallazgo: datos, fotos, historial de estados, comentarios y seguimientos. El contenido visible varía según tu rol.',
    acciones: [
      { accion: 'Galería de fotos', detalle: 'Haz clic en cualquier foto para verla en lightbox. Usa las flechas para navegar entre fotos. Las fotos de cierre aparecen en una sección separada.' },
      { accion: 'Historial de estados', detalle: 'Timeline cronológico con cada cambio de estado, quién lo realizó, cuándo y el motivo indicado.' },
      { accion: 'Comentarios', detalle: 'Agrega notas o actualizaciones al hallazgo. Los comentarios son inmutables (no se pueden borrar — son parte del registro de auditoría).' },
      { accion: 'Seguimientos (Inspector)', detalle: 'Botón "Confirmar condición" para registrar que verificaste el estado del hallazgo. Requiere mínimo 1 foto.' },
      { accion: 'Cambiar estado (Supervisor)', detalle: 'El supervisor puede mover el hallazgo entre estados del flujo. Al cerrar, debe agregar fotos de cierre.' },
      { accion: 'Exportar PDF', detalle: 'Genera un PDF con todos los datos del hallazgo, fotos y historial. El botón está en la cabecera de la ficha.' },
    ],
    tips: [
      'El banner de color en la parte superior indica la urgencia: amarillo (7-14 días sin actividad), naranja (15-29 días), rojo (30+ días).',
      'Los hallazgos CERRADOS no se pueden reabrir — si el problema persiste, registra uno nuevo.',
    ],
  },
  {
    id: 'inspector-pautas',
    titulo: 'Pautas en Ruta',
    icono: '✅',
    roles: ['INSPECTOR', 'SUPERVISOR', 'ADMINISTRADOR'],
    rutas: ['/inspector/pautas', '/supervisor/ruta-pautas', '/admin/ruta-pautas'],
    descripcion: 'Lista de rondas de inspección activas (PENDIENTE o EN_CURSO) asignadas a tu disciplina. Aquí ejecutas las inspecciones ítem por ítem.',
    acciones: [
      { accion: 'Ver ejecución activa', detalle: 'Haz clic en una pauta para ver el listado de equipos y componentes a inspeccionar en esta ronda.' },
      { accion: 'Registrar ítem', detalle: 'Toca el botón de check en cada fila para registrar la inspección: puedes llenar un checklist, agregar observación y hasta 5 fotos.' },
      { accion: 'Registrar equipo (batch)', detalle: 'Si todos los componentes de un equipo tienen el mismo checklist, aparece un botón para registrarlos todos de una vez.' },
    ],
    tips: [
      'Las pautas en rojo (VENCIDAS) ya superaron la fecha de cierre — igual puedes completarlas pero avisa al supervisor.',
      'Si otro inspector de tu disciplina ya marcó un ítem, aparece con su nombre y no puedes re-inspeccionarlo.',
      'Puedes trabajar offline: los registros se guardan localmente y sincronizan al recuperar señal.',
    ],
  },
  {
    id: 'ejecucion-detalle',
    titulo: 'Detalle de Ejecución',
    icono: '📝',
    roles: ['INSPECTOR', 'SUPERVISOR', 'ADMINISTRADOR'],
    rutas: ['/inspector/ejecuciones/', '/supervisor/ejecuciones/', '/admin/ejecuciones/'],
    descripcion: 'Vista detallada de una ronda de inspección en curso. Muestra los equipos agrupados con sus componentes, el estado de cada ítem y quién lo inspeccionó.',
    acciones: [
      { accion: 'Inspeccionar ítem', detalle: 'Haz clic en el ícono de check en la fila del componente. Se abre un modal con: checklist si aplica, campo de observación y cámara para fotos.' },
      { accion: 'Registrar equipo', detalle: 'Botón al lado del nombre del equipo (si todos los ítems comparten checklist). Completa el formulario una vez y se aplica a todos.' },
      { accion: 'Ver fotos de ítem', detalle: 'Las filas con inspección registrada muestran miniaturas. Haz clic para abrir el lightbox de fotos de ese ítem.' },
      { accion: 'Generar hallazgo', detalle: 'Si detectas un problema, usa el botón "+" en la fila para registrar un hallazgo directamente vinculado a esa ubicación.' },
    ],
    tips: [
      'Completa el checklist antes de agregar fotos — es obligatorio si la UBT tiene plantilla asignada.',
      'Las observaciones quedan en el reporte PDF de la ejecución. Sé descriptivo.',
    ],
  },
  {
    id: 'historial-pautas',
    titulo: 'Historial de Pautas',
    icono: '📚',
    roles: ['INSPECTOR', 'SUPERVISOR', 'ADMINISTRADOR'],
    rutas: ['/inspector/historial-pautas', '/supervisor/historial-pautas', '/admin/historial-pautas'],
    descripcion: 'Registro de todas las rondas de inspección completadas (FINALIZADA o CERRADA). Puedes ver los reportes de cada ejecución pasada.',
    acciones: [
      { accion: 'Filtrar', detalle: 'Filtra por disciplina, estado o rango de fechas para encontrar rondas específicas.' },
      { accion: 'Ver reporte', detalle: 'Haz clic en una ronda para ver el resumen completo: cobertura, inspectores participantes, hallazgos generados.' },
      { accion: 'Exportar PDF', detalle: 'Desde el detalle de cada ejecución puedes generar el reporte PDF completo de esa ronda.' },
    ],
    tips: [
      'El porcentaje de cobertura indica cuántos ítems fueron inspeccionados sobre el total de la ronda.',
    ],
  },

  // ── BITÁCORA ─────────────────────────────────────────────────────────────────
  {
    id: 'bitacora',
    titulo: 'Bitácora de Novedades',
    icono: '📔',
    roles: ['INSPECTOR', 'SUPERVISOR', 'ADMINISTRADOR'],
    rutas: ['/inspector/bitacora', '/supervisor/bitacora', '/admin/bitacora'],
    descripcion: 'Registro cronológico de novedades del turno. Combina entradas manuales con hallazgos registrados e inspecciones ejecutadas en la semana actual. Organizado por día.',
    acciones: [
      { accion: 'Ver semana actual', detalle: 'Por defecto muestra la semana ISO en curso. Usa el navegador de semanas para ver semanas anteriores.' },
      { accion: 'Nueva entrada', detalle: 'Botón "+" para registrar una novedad manual: tipo de evento, descripción, fotos (hasta 5) y documentos adjuntos.' },
      { accion: 'Confirmar sin novedades', detalle: '(Solo Supervisor/Admin) Botón para confirmar formalmente que no hubo novedades en la semana. Solo se puede hacer una vez por semana por disciplina.' },
      { accion: 'Ver detalle de entrada', detalle: 'Haz clic en cualquier entrada para ver el contenido completo, adjuntos y fotos.' },
      { accion: 'Reporte PDF semanal', detalle: 'Botón "Reporte PDF" para generar el resumen ejecutivo de la semana completa con todas las entradas.' },
    ],
    tips: [
      'Solo puedes editar o eliminar entradas creadas en los últimos 60 minutos (ventana de edición).',
      'Las entradas de tipo SIN_NOVEDADES aparecen en verde y bloquean el botón de confirmación para esa semana.',
      'Los documentos adjuntos admiten PDF, Word y Excel hasta 20 MB cada uno.',
    ],
  },
  {
    id: 'nueva-entrada',
    titulo: 'Nueva Entrada de Bitácora',
    icono: '✏️',
    roles: ['INSPECTOR', 'SUPERVISOR', 'ADMINISTRADOR'],
    rutas: ['/inspector/bitacora/nueva', '/supervisor/bitacora/nueva', '/admin/bitacora/nueva'],
    descripcion: 'Formulario para registrar una nueva novedad en la bitácora de turno.',
    acciones: [
      { accion: 'Tipo de novedad', detalle: 'Selecciona la categoría: INCIDENTE, ANOMALIA, MANTENIMIENTO, INTERRUPCION, OBSERVACION, COMUNICACION u otra.' },
      { accion: 'Descripción', detalle: 'Texto libre describiendo la novedad. Se recomienda incluir hora, equipo afectado y acción tomada.' },
      { accion: 'Fotos', detalle: 'Hasta 5 fotos de evidencia. Se comprimen automáticamente.' },
      { accion: 'Adjuntos', detalle: 'Hasta 10 archivos (PDF, Word, Excel) de hasta 20 MB cada uno.' },
    ],
    tips: [
      'Las entradas solo pueden crearse para la semana actual. No se puede registrar novedades para semanas pasadas.',
    ],
  },

  // ── SUPERVISOR ───────────────────────────────────────────────────────────────
  {
    id: 'dashboard',
    titulo: 'Dashboard General',
    icono: '📊',
    roles: ['SUPERVISOR', 'ADMINISTRADOR'],
    rutas: ['/supervisor/dashboard'],
    descripcion: 'Panel de control con métricas globales de hallazgos. Muestra contadores por estado, distribución por criticidad, ranking de inspectores y áreas con más actividad.',
    acciones: [
      { accion: 'Filtrar por planta/área', detalle: 'Los selectores en la cabecera filtran todas las métricas del dashboard para esa planta o área específica.' },
      { accion: 'Contadores por estado', detalle: 'Haz clic en cualquier contador (ABIERTO, EN_GESTION, etc.) para ir directo a la lista de hallazgos filtrada por ese estado.' },
      { accion: 'Ranking inspectores', detalle: 'Top 5 inspectores con más hallazgos registrados en el período. Las medallas indican posición.' },
      { accion: 'Áreas críticas', detalle: 'Top 5 áreas con más hallazgos activos — útil para priorizar recorridos.' },
    ],
    tips: [
      'El dashboard se actualiza en tiempo real (React Query revalida cada 30 segundos).',
      'Los contadores vacíos (cero) también son clicables — llevan a la lista vacía con los filtros aplicados.',
    ],
  },
  {
    id: 'hallazgos-supervisor',
    titulo: 'Hallazgos (Vista Supervisor)',
    icono: '📋',
    roles: ['SUPERVISOR', 'ADMINISTRADOR'],
    rutas: ['/supervisor/hallazgos', '/admin/hallazgos'],
    descripcion: 'Listado completo de todos los hallazgos del sistema con filtros avanzados. Permite gestionar el flujo de estados y ver la actividad de cada hallazgo.',
    acciones: [
      { accion: 'Filtros', detalle: 'Filtra por estado, criticidad, categoría, inspector, planta y área. Los filtros se combinan y persisten en la URL.' },
      { accion: 'Columna Actividad', detalle: 'Muestra el número de cambios de estado + comentarios. Al hacer hover aparece el último comentario registrado.' },
      { accion: 'Thumbnail de foto', detalle: 'La miniatura de la primera foto permite identificar rápidamente el hallazgo sin abrir el detalle.' },
      { accion: 'Ver detalle', detalle: 'Haz clic en cualquier fila para abrir la ficha completa del hallazgo y gestionar su estado.' },
    ],
    tips: [
      'Ordena por "Actividad" (columna de contadores) para ver los hallazgos que más movimientos han tenido.',
      'El filtro de inspector es útil para hacer seguimiento a los hallazgos de un operario específico.',
    ],
  },
  {
    id: 'mi-disciplina',
    titulo: 'Mi Disciplina',
    icono: '🔧',
    roles: ['SUPERVISOR'],
    rutas: ['/supervisor/mi-disciplina'],
    descripcion: 'Dashboard específico de la disciplina(s) asignada al supervisor. Muestra las pautas activas, cobertura de inspección y estado de los hallazgos del área.',
    acciones: [
      { accion: 'Pautas activas', detalle: 'Rondas en curso o pendientes de las disciplinas bajo tu supervisión.' },
      { accion: 'Cobertura', detalle: 'Porcentaje de ítems inspeccionados sobre el total en las rondas activas.' },
      { accion: 'Hallazgos del área', detalle: 'Hallazgos abiertos de tu disciplina, ordenados por criticidad y antigüedad.' },
    ],
    tips: [
      'Si la cobertura lleva varios días sin subir, puede indicar que los inspectores tienen problemas para acceder a ciertos equipos.',
    ],
  },

  // ── ADMIN ────────────────────────────────────────────────────────────────────
  {
    id: 'usuarios',
    titulo: 'Gestión de Usuarios',
    icono: '👥',
    roles: ['ADMINISTRADOR'],
    rutas: ['/admin/usuarios'],
    descripcion: 'CRUD completo de usuarios del sistema. Permite crear, editar, activar/desactivar y asignar roles y disciplinas.',
    acciones: [
      { accion: 'Crear usuario', detalle: 'Botón "+ Nuevo Usuario". Campos: nombre, email, contraseña, rol y disciplina (obligatoria para INSPECTOR).' },
      { accion: 'Editar', detalle: 'Haz clic en el ícono de lápiz en la fila. Puedes cambiar nombre, rol, disciplina y estado activo/inactivo.' },
      { accion: 'Foto de perfil', detalle: 'Al crear, se asigna un avatar por defecto según el rol. El usuario puede cambiarlo desde su perfil.' },
      { accion: 'Activar/Desactivar', detalle: 'Toggle en la fila. Los usuarios inactivos no pueden iniciar sesión pero sus datos se conservan.' },
    ],
    tips: [
      'La contraseña debe tener mínimo 8 caracteres, 1 mayúscula, 1 número y 1 carácter especial.',
      'No se puede eliminar un usuario que tiene hallazgos o pautas registradas — solo desactivarlo.',
      'Los SUPERVISOR no tienen disciplina asignada; los INSPECTOR sí (obligatorio).',
    ],
  },
  {
    id: 'disciplinas',
    titulo: 'Disciplinas',
    icono: '🔧',
    roles: ['ADMINISTRADOR'],
    rutas: ['/admin/disciplinas'],
    descripcion: 'Catálogo de disciplinas técnicas (ej: Correas, Eléctrico, Estructural). Las disciplinas agrupan inspectores y pautas.',
    acciones: [
      { accion: 'Crear disciplina', detalle: 'Nombre y descripción. Una vez creada, puedes asignarla a inspectores y vincularla en las pautas de inspección.' },
      { accion: 'Editar', detalle: 'Cambia nombre o descripción. No afecta las pautas o usuarios ya asignados.' },
      { accion: 'Desactivar', detalle: 'Las disciplinas inactivas no aparecen en los selectores al crear usuarios o pautas.' },
    ],
    tips: [
      'Crea primero las disciplinas antes de dar de alta a los inspectores.',
    ],
  },
  {
    id: 'pautas-admin',
    titulo: 'Pautas de Inspección',
    icono: '📌',
    roles: ['ADMINISTRADOR'],
    rutas: ['/admin/pautas'],
    descripcion: 'Gestión de plantillas de pautas de inspección. Cada pauta define qué UBTs (ubicaciones técnicas) deben inspeccionarse en cada ronda.',
    acciones: [
      { accion: 'Crear pauta', detalle: 'Botón "+ Nueva Pauta". Define nombre, disciplina asignada y la lista de UBTs (equipos/componentes) en orden de recorrido.' },
      { accion: 'Ver detalle', detalle: 'Haz clic en la pauta para ver sus UBTs, historial de ejecuciones y el botón para programar una nueva ronda.' },
      { accion: 'Programar ejecución', detalle: 'Desde el detalle, define fechas de inicio y fin para una nueva ronda. Se copian automáticamente las UBTs como ítems de ejecución.' },
    ],
    tips: [
      'Solo puede haber una ejecución PENDIENTE o EN_CURSO por pauta a la vez.',
      'Puedes editar el orden de UBTs en la plantilla sin afectar las ejecuciones en curso.',
    ],
  },
  {
    id: 'pauta-detalle-admin',
    titulo: 'Detalle de Pauta',
    icono: '📌',
    roles: ['ADMINISTRADOR'],
    rutas: ['/admin/pautas/'],
    descripcion: 'Vista de configuración de una pauta: UBTs incluidas, orden de recorrido y plantillas de checklist. También muestra el historial completo de ejecuciones.',
    acciones: [
      { accion: 'Agregar UBTs', detalle: 'Busca y agrega equipos (nivel 3) o componentes (nivel 4) a la pauta. Define el orden de inspección.' },
      { accion: 'Asignar checklist', detalle: 'Para cada UBT, puedes asignar una plantilla de verificación (checklist) que el inspector debe completar.' },
      { accion: 'Historial de ejecuciones', detalle: 'Lista de todas las rondas pasadas: período, estado, cobertura e inspectores participantes.' },
      { accion: 'Programar ronda', detalle: 'Botón para crear una nueva ejecución con fechas de inicio y fin.' },
    ],
    tips: [
      'Si asignas un checklist a nivel de equipo, se hereda a todos sus componentes (salvo que tengan asignación individual).',
    ],
  },
  {
    id: 'plantillas',
    titulo: 'Plantillas de Verificación',
    icono: '☑️',
    roles: ['ADMINISTRADOR'],
    rutas: ['/admin/plantillas'],
    descripcion: 'Biblioteca de checklists reutilizables. Cada plantilla define los campos que el inspector debe completar al inspeccionar una UBT.',
    acciones: [
      { accion: 'Crear plantilla', detalle: 'Nombre y lista de campos. Tipos disponibles: CHECKBOX, NUMÉRICO, TEXTO, SELECCIÓN, FECHA.' },
      { accion: 'Importar CSV', detalle: 'Sube un CSV con el formato: etiqueta,tipo,obligatorio[,unidad]. Las líneas con * se ignoran como comentarios.' },
      { accion: 'Editar campos', detalle: 'Agrega, elimina o reordena campos. Los cambios afectan futuras ejecuciones, no las pasadas.' },
    ],
    tips: [
      'Formato CSV: `Temperatura motor,NUMERICO,si,°C`. Tipos aceptados: CHECKBOX/SI_NO, NUMERICO/NUM, TEXTO, SELECCION, FECHA.',
      'Los campos obligatorios bloquean el registro del ítem si no se completan.',
    ],
  },
  {
    id: 'ubicaciones',
    titulo: 'Ubicaciones Técnicas',
    icono: '📍',
    roles: ['ADMINISTRADOR'],
    rutas: ['/admin/ubicaciones'],
    descripcion: 'Jerarquía SAP de ubicaciones técnicas: Planta → Área → Activo → Componente. Los hallazgos solo se pueden registrar en nivel Componente (4).',
    acciones: [
      { accion: 'Árbol de ubicaciones', detalle: 'Vista jerárquica con 4 filtros en cascada. Los badges muestran cuántos hallazgos totales y activos tiene cada nodo.' },
      { accion: 'Crear ubicación', detalle: 'Botón "+ Nueva". Selecciona el nivel (1-4), el padre y asigna un código único y descripción.' },
      { accion: 'Importar Excel/CSV', detalle: 'Sube un archivo con columnas: codigo,descripcion,nivel,codigo_padre. Los duplicados son rechazados.' },
      { accion: 'Exportar CSV', detalle: 'Botón "Exportar CSV" para descargar el árbol completo en formato plano.' },
    ],
    tips: [
      'El código debe ser único en todo el sistema — si intentas crear uno duplicado recibirás un error 409.',
      'Los badges de hallazgos en el árbol se propagan recursivamente: el número del Área incluye los de todos sus Activos y Componentes.',
      'La importación no hace upsert — si un código ya existe, la línea es rechazada sin afectar las demás.',
    ],
  },
  {
    id: 'listas-correo',
    titulo: 'Listas de Correo',
    icono: '📧',
    roles: ['ADMINISTRADOR'],
    rutas: ['/admin/listas-correo'],
    descripcion: 'Configuración de destinatarios para notificaciones automáticas por correo. Cada lista se vincula a un Área (nivel 2) y se activa cuando hay nuevos hallazgos en esa zona.',
    acciones: [
      { accion: 'Crear lista', detalle: 'Selecciona Planta → Área y agrega los emails separados por comas. Puedes agregar una descripción.' },
      { accion: 'Activar/Desactivar', detalle: 'Toggle en la fila. Si una lista está inactiva, no se envían correos para esa zona.' },
      { accion: 'Editar emails', detalle: 'Haz clic en editar para agregar, quitar o modificar los destinatarios.' },
    ],
    tips: [
      'Si el SMTP no está configurado en el servidor, los correos se omiten silenciosamente (el hallazgo igual se registra).',
      'Solo puede haber una lista activa por Área. Si creas otra, la anterior queda inactiva.',
    ],
  },
  {
    id: 'logs-correo',
    titulo: 'Historial de Correos',
    icono: '📨',
    roles: ['ADMINISTRADOR'],
    rutas: ['/admin/logs-correo'],
    descripcion: 'Registro de todos los intentos de envío de correo del sistema. Permite auditar qué notificaciones se enviaron y detectar errores de SMTP.',
    acciones: [
      { accion: 'Filtrar por estado', detalle: 'ENVIADO (verde) o ERROR (rojo). Los errores incluyen el mensaje del servidor SMTP.' },
      { accion: 'Ver destinatarios', detalle: 'Expande cada registro para ver la lista de emails a los que se intentó enviar.' },
      { accion: 'Reenvío manual', detalle: 'Actualmente no hay reenvío automático. Si falla, verifica la config SMTP y crea el hallazgo nuevamente o usa otra vía de notificación.' },
    ],
    tips: [
      'Los errores más comunes son: SMTP no configurado, credenciales inválidas, o destinatario rechazado por el servidor de correo.',
    ],
  },
  {
    id: 'logs-acceso',
    titulo: 'Log de Accesos',
    icono: '🔐',
    roles: ['ADMINISTRADOR'],
    rutas: ['/admin/logs-acceso'],
    descripcion: 'Auditoría de todos los intentos de inicio de sesión al sistema. Registra IP, email, resultado (éxito/fallo) y motivo.',
    acciones: [
      { accion: 'Filtrar por resultado', detalle: 'EXITOSO (verde) o FALLIDO (rojo). Los intentos fallidos pueden indicar ataques o contraseñas incorrectas.' },
      { accion: 'Filtrar por email', detalle: 'Busca todos los intentos de un usuario específico para detectar accesos inusuales.' },
      { accion: 'Ver IP', detalle: 'La columna IP muestra la dirección del cliente. En producción con Nginx, la IP real se captura via X-Forwarded-For.' },
    ],
    tips: [
      'El rate limit es de 5 intentos por IP cada 15 minutos. Después de eso, los intentos son bloqueados aunque las credenciales sean correctas.',
      'Este log no bloquea el sistema — solo registra. Para bloquear un usuario, desactívalo desde Gestión de Usuarios.',
    ],
  },

  // ── PERFIL ───────────────────────────────────────────────────────────────────
  {
    id: 'perfil',
    titulo: 'Mi Perfil',
    icono: '👤',
    roles: ['INSPECTOR', 'SUPERVISOR', 'ADMINISTRADOR'],
    rutas: ['/perfil'],
    descripcion: 'Tu información personal y configuración de cuenta. Disponible para todos los roles.',
    acciones: [
      { accion: 'Foto de perfil', detalle: 'Haz clic en el ícono de cámara sobre tu avatar para subir o cambiar tu foto. Formatos: JPEG, PNG, WEBP. Máx 10 MB.' },
      { accion: 'Cambiar nombre', detalle: 'Edita tu nombre en el campo correspondiente y guarda los cambios.' },
      { accion: 'Cambiar contraseña', detalle: 'Ingresa tu contraseña actual y la nueva (mínimo 8 caracteres, 1 mayúscula, 1 número, 1 especial).' },
    ],
    tips: [
      'Tu foto de perfil aparece en los comentarios de hallazgos, en el historial de ejecuciones y en el top bar.',
      'No puedes cambiar tu propio rol desde el perfil — eso lo gestiona el administrador.',
    ],
  },
]

// Encuentra la sección de ayuda correspondiente al pathname actual
export function findHelpSection(pathname) {
  // Orden de prioridad: rutas más específicas primero
  const sorted = [...HELP_SECTIONS].sort((a, b) => {
    const maxA = Math.max(...a.rutas.map(r => r.length))
    const maxB = Math.max(...b.rutas.map(r => r.length))
    return maxB - maxA
  })

  return sorted.find(section =>
    section.rutas.some(ruta => pathname.startsWith(ruta))
  ) || null
}

// Devuelve secciones filtradas por rol
export function getSectionsForRole(rol) {
  return HELP_SECTIONS.filter(s => s.roles.includes(rol))
}
