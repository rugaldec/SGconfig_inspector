const { v4: uuidv4 } = require('uuid')
const prisma = require('../db/client')
const { ok, fail } = require('../utils/responseHelper')
const { guardar } = require('../utils/storageService')
const { rangoSemana, semanaActual, toSemanaISO } = require('../utils/semanaISO')
const { generarPdfBitacora } = require('../utils/pdfBitacora')
const { MIMES_FOTO } = require('../middleware/upload')

const EXT_MIME = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
}

// Obtiene array de disciplina_ids para el usuario actual (null = admin, sin filtro)
async function getDisciplinaIds(user) {
  if (user.rol === 'ADMINISTRADOR' || user.rolReal === 'ADMINISTRADOR') return null
  const registros = await prisma.usuarioDisciplina.findMany({
    where: { usuario_id: user.id },
    select: { disciplina_id: true },
  })
  return registros.map(r => r.disciplina_id)
}

// Construye el where de disciplina para Prisma
function disciplinaWhere(disciplinaIds, campo = 'disciplina_id') {
  if (!disciplinaIds) return {}
  return { [campo]: { in: disciplinaIds } }
}

// Formatea un item unificado para la lista
function fmtItem(origen, fecha, autor, ubicacion, titulo, resumen, meta, extra = {}) {
  const d = new Date(fecha)
  return {
    id: meta.id || meta.entrada_id || meta.hallazgo_id || meta.ejecucion_id,
    origen,
    fecha: d,
    hora: d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }),
    titulo,
    resumen,
    autor,
    ubicacion,
    foto_url: meta.foto_url || null,
    meta,
    ...extra,
  }
}

function ubicacionTexto(ub) {
  if (!ub) return ''
  const partes = []
  let cur = ub
  while (cur) {
    partes.unshift(cur.descripcion)
    cur = cur.padre
  }
  return partes.join(' > ')
}

// GET /api/bitacora
async function listar(req, res) {
  try {
    const { semana, disciplina_id, autor_id, tipo, origen } = req.query
    const semanaKey = semana || semanaActual()
    const { inicio, fin } = rangoSemana(semanaKey)

    const disciplinaIds = await getDisciplinaIds(req.user)
    // Si el request filtra por disciplina específica, validar acceso
    const dIds = disciplina_id
      ? (disciplinaIds === null || disciplinaIds.includes(disciplina_id) ? [disciplina_id] : [])
      : disciplinaIds

    const incluirOrigen = (o) => !origen || origen === o

    const [entradas, hallazgos, ejecuciones] = await Promise.all([
      // 1. Entradas manuales
      incluirOrigen('ENTRADA') ? prisma.bitacoraEntrada.findMany({
        where: {
          fecha: { gte: inicio, lte: fin },
          ...(dIds ? { disciplina_id: { in: dIds } } : {}),
          ...(autor_id ? { autor_id } : {}),
          ...(tipo ? { tipo } : {}),
        },
        include: {
          autor: { select: { id: true, nombre: true, foto_url: true, rol: true } },
          ubicacion: { select: { id: true, descripcion: true, padre: { select: { descripcion: true, padre: { select: { descripcion: true, padre: { select: { descripcion: true } } } } } } } },
          fotos: { orderBy: { orden: 'asc' } },
          archivos: true,
        },
        orderBy: { fecha: 'asc' },
      }) : [],

      // 2. Hallazgos por disciplina del inspector
      incluirOrigen('HALLAZGO') ? prisma.hallazgo.findMany({
        where: {
          fecha_creacion: { gte: inicio, lte: fin },
          ...(dIds ? {
            inspector: {
              disciplinas: { some: { disciplina_id: { in: dIds } } },
            },
          } : {}),
          ...(autor_id ? { inspector_id: autor_id } : {}),
        },
        include: {
          inspector: { select: { id: true, nombre: true, foto_url: true, rol: true } },
          ubicacion_tecnica: { select: { descripcion: true, padre: { select: { descripcion: true, padre: { select: { descripcion: true, padre: { select: { descripcion: true } } } } } } } },
        },
        orderBy: { fecha_creacion: 'asc' },
      }) : [],

      // 3. Ejecuciones de pauta
      incluirOrigen('INSPECCION') ? prisma.ejecucionPauta.findMany({
        where: {
          created_at: { gte: inicio, lte: fin },
          ...(dIds ? { pauta: { disciplina_id: { in: dIds } } } : {}),
        },
        include: {
          pauta: { select: { nombre: true, disciplina_id: true, zona_funcional: { select: { descripcion: true } } } },
          creado_por: { select: { id: true, nombre: true, foto_url: true, rol: true } },
          _count: { select: { items: true } },
        },
        orderBy: { created_at: 'asc' },
      }) : [],
    ])

    // Obtener conteo de ítems ejecutados para ejecuciones
    const ejecIds = ejecuciones.map(e => e.id)
    const ejecutadosMap = {}
    if (ejecIds.length) {
      const counts = await prisma.itemEjecucion.groupBy({
        by: ['ejecucion_id'],
        where: { ejecucion_id: { in: ejecIds }, inspeccionado: true },
        _count: { id: true },
      })
      counts.forEach(c => { ejecutadosMap[c.ejecucion_id] = c._count.id })
    }

    // Normalizar a formato unificado
    const result = []

    for (const e of entradas) {
      result.push(fmtItem(
        'ENTRADA',
        new Date(e.fecha.toISOString().slice(0, 10) + 'T' + (e.created_at.toISOString().slice(11, 16)) + ':00Z'),
        e.autor,
        ubicacionTexto(e.ubicacion),
        e.titulo,
        e.descripcion.slice(0, 200),
        {
          id: e.id,
          tipo: e.tipo,
          fotos_count: e.fotos.length,
          archivos_count: e.archivos.length,
          entrada_id: e.id,
          foto_url: e.fotos[0]?.foto_url || null,
          editable: (
            req.user.rol === 'ADMINISTRADOR' ||
            (e.autor_id === req.user.id && (Date.now() - new Date(e.created_at).getTime()) < 86400000)
          ),
          eliminable: (
            req.user.rol === 'ADMINISTRADOR' ||
            (e.autor_id === req.user.id && (Date.now() - new Date(e.created_at).getTime()) < 86400000 && toSemanaISO(e.fecha) === semanaActual())
          ),
        },
        { _fotos: e.fotos, _archivos: e.archivos },
      ))
    }

    for (const h of hallazgos) {
      result.push(fmtItem(
        'HALLAZGO',
        h.fecha_creacion,
        h.inspector,
        ubicacionTexto(h.ubicacion_tecnica),
        h.descripcion.slice(0, 100),
        `${h.numero_aviso} · ${h.estado}`,
        {
          numero_aviso: h.numero_aviso,
          estado: h.estado,
          criticidad: h.criticidad,
          categoria: h.categoria,
          hallazgo_id: h.id,
          foto_url: h.foto_url,
        },
      ))
    }

    for (const ej of ejecuciones) {
      const ejec = ejecutadosMap[ej.id] || 0
      const total = ej._count.items
      result.push(fmtItem(
        'INSPECCION',
        ej.created_at,
        ej.creado_por,
        ej.pauta?.zona_funcional?.descripcion || '',
        `${ej.pauta?.nombre || 'Pauta'} — Ronda ${ej.numero_ronda}`,
        `${ejec}/${total} ítems ejecutados`,
        {
          pauta_nombre: ej.pauta?.nombre || '',
          items_total: total,
          items_ejecutados: ejec,
          estado: ej.estado,
          ejecucion_id: ej.id,
          pauta_id: ej.pauta_id,
        },
      ))
    }

    // Ordenar por fecha descendente
    result.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

    return ok(res, {
      semana: semanaKey,
      items: result,
      sin_novedades_confirmado: entradas.some(e => e.tipo === 'SIN_NOVEDADES'),
    })
  } catch (e) {
    console.error(e)
    return fail(res, 'ERROR', e.message, 500)
  }
}

// POST /api/bitacora/entrada
async function crear(req, res) {
  try {
    const { titulo, descripcion, tipo, disciplina_id, fecha, ubicacion_id } = req.body
    if (!titulo?.trim() || !descripcion?.trim() || !tipo || !disciplina_id || !fecha) {
      return fail(res, 'DATOS_INCOMPLETOS', 'título, descripción, tipo, disciplina_id y fecha son obligatorios', 400)
    }

    const TIPOS_VALIDOS = ['NOVEDAD', 'INCIDENTE', 'TRABAJO_REALIZADO', 'CONDICION_AREA', 'REUNION', 'OTRO']
    if (!TIPOS_VALIDOS.includes(tipo)) return fail(res, 'TIPO_INVALIDO', 'Tipo de entrada no válido', 400)

    // Validar semana actual
    const semanaEntrada = toSemanaISO(new Date(fecha))
    if (semanaEntrada !== semanaActual()) {
      return fail(res, 'FECHA_FUERA_DE_RANGO', 'Solo se pueden registrar entradas de la semana actual', 400)
    }

    // Validar acceso a disciplina
    const disciplinaIds = await getDisciplinaIds(req.user)
    if (disciplinaIds !== null && !disciplinaIds.includes(disciplina_id)) {
      return fail(res, 'SIN_ACCESO', 'No tienes acceso a esta disciplina', 403)
    }

    const disciplina = await prisma.disciplina.findUnique({ where: { id: disciplina_id } })
    if (!disciplina || !disciplina.activo) return fail(res, 'DISCIPLINA_INVALIDA', 'Disciplina no encontrada', 404)

    // Guardar fotos
    const fotosFiles = req.files?.fotos ?? []
    const archivosFiles = req.files?.archivos ?? []

    const fotoUrls = await Promise.all(
      fotosFiles.map(f => guardar(f.buffer, f.mimetype, uuidv4()))
    )

    // Guardar archivos (documentos)
    const archivosData = await Promise.all(
      archivosFiles.map(async (f, i) => {
        const ext = EXT_MIME[f.mimetype] || ''
        const nombre = f.originalname || `archivo-${i}${ext}`
        const url = await guardar(f.buffer, f.mimetype, uuidv4())
        return { nombre, archivo_url: url, mime_type: f.mimetype, tamanio: f.size }
      })
    )

    const entrada = await prisma.bitacoraEntrada.create({
      data: {
        fecha: new Date(fecha),
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        tipo,
        autor_id: req.user.id,
        disciplina_id,
        ubicacion_id: ubicacion_id || null,
        fotos: {
          create: fotoUrls.map((url, i) => ({ foto_url: url, orden: i })),
        },
        archivos: {
          create: archivosData,
        },
      },
      include: {
        autor: { select: { id: true, nombre: true, foto_url: true, rol: true } },
        fotos: true,
        archivos: true,
      },
    })

    return ok(res, entrada, 'Entrada creada', 201)
  } catch (e) {
    console.error(e)
    return fail(res, 'ERROR', e.message, 500)
  }
}

// GET /api/bitacora/entrada/:id
async function detalle(req, res) {
  try {
    const entrada = await prisma.bitacoraEntrada.findUnique({
      where: { id: req.params.id },
      include: {
        autor: { select: { id: true, nombre: true, foto_url: true, rol: true } },
        disciplina: { select: { id: true, nombre: true } },
        ubicacion: { select: { id: true, descripcion: true, padre: { select: { descripcion: true, padre: { select: { descripcion: true, padre: { select: { descripcion: true } } } } } } } },
        fotos: { orderBy: { orden: 'asc' } },
        archivos: true,
      },
    })
    if (!entrada) return fail(res, 'NO_ENCONTRADO', 'Entrada no encontrada', 404)

    // Verificar acceso a disciplina
    const disciplinaIds = await getDisciplinaIds(req.user)
    if (disciplinaIds !== null && !disciplinaIds.includes(entrada.disciplina_id)) {
      return fail(res, 'SIN_ACCESO', 'Sin acceso', 403)
    }

    const ahora = Date.now()
    const editable = req.user.rol === 'ADMINISTRADOR' ||
      (entrada.autor_id === req.user.id && (ahora - new Date(entrada.created_at).getTime()) < 86400000)
    const eliminable = req.user.rol === 'ADMINISTRADOR' ||
      (entrada.autor_id === req.user.id && (ahora - new Date(entrada.created_at).getTime()) < 86400000 && toSemanaISO(entrada.fecha) === semanaActual())

    return ok(res, { ...entrada, editable, eliminable })
  } catch (e) {
    return fail(res, 'ERROR', e.message, 500)
  }
}

// PATCH /api/bitacora/entrada/:id
async function actualizar(req, res) {
  try {
    const entrada = await prisma.bitacoraEntrada.findUnique({
      where: { id: req.params.id },
      include: { fotos: true, archivos: true },
    })
    if (!entrada) return fail(res, 'NO_ENCONTRADO', 'Entrada no encontrada', 404)

    // Permisos: autor < 24h o admin
    const esAutor = entrada.autor_id === req.user.id
    const dentro24h = (Date.now() - new Date(entrada.created_at).getTime()) < 86400000
    if (req.user.rol !== 'ADMINISTRADOR' && !(esAutor && dentro24h)) {
      return fail(res, 'SIN_PERMISO', 'No puedes editar esta entrada', 403)
    }

    // No editar semanas pasadas
    if (req.user.rol !== 'ADMINISTRADOR' && toSemanaISO(entrada.fecha) !== semanaActual()) {
      return fail(res, 'SEMANA_PASADA', 'No se puede editar entradas de semanas pasadas', 403)
    }

    const { titulo, descripcion, tipo, ubicacion_id } = req.body

    const TIPOS_VALIDOS = ['NOVEDAD', 'INCIDENTE', 'TRABAJO_REALIZADO', 'CONDICION_AREA', 'REUNION', 'OTRO']
    if (tipo && !TIPOS_VALIDOS.includes(tipo)) return fail(res, 'TIPO_INVALIDO', 'Tipo no válido', 400)

    const fotosFiles = req.files?.fotos ?? []
    const archivosFiles = req.files?.archivos ?? []

    const nuevasFotoUrls = await Promise.all(fotosFiles.map(f => guardar(f.buffer, f.mimetype, uuidv4())))
    const nuevosArchivos = await Promise.all(
      archivosFiles.map(async (f, i) => {
        const ext = EXT_MIME[f.mimetype] || ''
        const nombre = f.originalname || `archivo-${i}${ext}`
        const url = await guardar(f.buffer, f.mimetype, uuidv4())
        return { nombre, archivo_url: url, mime_type: f.mimetype, tamanio: f.size }
      })
    )

    const actualizada = await prisma.bitacoraEntrada.update({
      where: { id: req.params.id },
      data: {
        ...(titulo ? { titulo: titulo.trim() } : {}),
        ...(descripcion ? { descripcion: descripcion.trim() } : {}),
        ...(tipo ? { tipo } : {}),
        ...(ubicacion_id !== undefined ? { ubicacion_id: ubicacion_id || null } : {}),
        ...(nuevasFotoUrls.length ? {
          fotos: {
            create: nuevasFotoUrls.map((url, i) => ({ foto_url: url, orden: entrada.fotos.length + i })),
          },
        } : {}),
        ...(nuevosArchivos.length ? {
          archivos: { create: nuevosArchivos },
        } : {}),
      },
      include: {
        autor: { select: { id: true, nombre: true, foto_url: true, rol: true } },
        fotos: { orderBy: { orden: 'asc' } },
        archivos: true,
      },
    })

    return ok(res, actualizada)
  } catch (e) {
    return fail(res, 'ERROR', e.message, 500)
  }
}

// DELETE /api/bitacora/entrada/:id
async function eliminar(req, res) {
  try {
    const entrada = await prisma.bitacoraEntrada.findUnique({ where: { id: req.params.id } })
    if (!entrada) return fail(res, 'NO_ENCONTRADO', 'Entrada no encontrada', 404)

    const esAutor = entrada.autor_id === req.user.id
    const dentro24h = (Date.now() - new Date(entrada.created_at).getTime()) < 86400000
    const semanaOk = toSemanaISO(entrada.fecha) === semanaActual()

    if (req.user.rol !== 'ADMINISTRADOR' && !(esAutor && dentro24h && semanaOk)) {
      return fail(res, 'SIN_PERMISO', 'No puedes eliminar esta entrada', 403)
    }

    await prisma.bitacoraEntrada.delete({ where: { id: req.params.id } })
    return ok(res, null, 'Entrada eliminada')
  } catch (e) {
    return fail(res, 'ERROR', e.message, 500)
  }
}

// POST /api/bitacora/sin-novedades
async function confirmarSinNovedades(req, res) {
  try {
    const { disciplina_id, semana } = req.body
    if (req.user.rol === 'INSPECTOR') return fail(res, 'SIN_PERMISO', 'Solo supervisores y administradores pueden confirmar sin novedades', 403)

    const semanaKey = semana || semanaActual()
    if (semanaKey !== semanaActual()) {
      return fail(res, 'SEMANA_INVALIDA', 'Solo se puede confirmar la semana actual', 400)
    }

    const disciplinaIds = await getDisciplinaIds(req.user)
    if (disciplinaIds !== null && !disciplinaIds.includes(disciplina_id)) {
      return fail(res, 'SIN_ACCESO', 'Sin acceso a esta disciplina', 403)
    }

    // Verificar que no haya entradas manuales reales esa semana
    const { inicio, fin } = rangoSemana(semanaKey)
    const entradasReales = await prisma.bitacoraEntrada.count({
      where: {
        disciplina_id,
        fecha: { gte: inicio, lte: fin },
        tipo: { not: 'SIN_NOVEDADES' },
      },
    })
    if (entradasReales > 0) {
      return fail(res, 'HAY_ENTRADAS', 'Ya existen entradas manuales esta semana', 409)
    }

    // Verificar unicidad
    const existente = await prisma.bitacoraEntrada.findFirst({
      where: { disciplina_id, fecha: { gte: inicio, lte: fin }, tipo: 'SIN_NOVEDADES' },
    })
    if (existente) return ok(res, existente, 'Ya estaba confirmado')

    const entrada = await prisma.bitacoraEntrada.create({
      data: {
        fecha: new Date(),
        titulo: 'Sin novedades',
        descripcion: `Sin novedades registradas — confirmado por ${req.user.nombre}`,
        tipo: 'SIN_NOVEDADES',
        autor_id: req.user.id,
        disciplina_id,
      },
    })
    return ok(res, entrada, 'Sin novedades confirmado', 201)
  } catch (e) {
    return fail(res, 'ERROR', e.message, 500)
  }
}

// GET /api/bitacora/reporte/semanal
async function reporteSemanal(req, res) {
  try {
    const { semana, disciplina_id, incluir_fotos, autor_id } = req.query
    const semanaKey = semana || semanaActual()
    const incluirFotos = incluir_fotos !== 'false'

    // Reutilizar listar con los mismos filtros pero sin paginación
    req.query.semana = semanaKey
    const disciplinaIds = await getDisciplinaIds(req.user)
    const dIds = disciplina_id
      ? (disciplinaIds === null || disciplinaIds.includes(disciplina_id) ? [disciplina_id] : null)
      : disciplinaIds

    // Nombre de disciplina
    let disciplinaNombre = 'Todas las disciplinas'
    if (disciplina_id) {
      const d = await prisma.disciplina.findUnique({ where: { id: disciplina_id }, select: { nombre: true } })
      if (d) disciplinaNombre = d.nombre
    }

    // Obtener items reutilizando la lógica de listar
    const fakeRes = {
      _data: null,
      json(d) { this._data = d },
      status(code) { return { json: (d) => { this._data = d } } },
    }
    await listar({ ...req, query: { semana: semanaKey, disciplina_id, autor_id } }, {
      json: (d) => { fakeRes._data = d },
      status: () => ({ json: (d) => {} }),
    })

    // Simplificado: hacer las queries directamente
    const { inicio, fin } = rangoSemana(semanaKey)
    const [entradas, hallazgos, ejecuciones] = await Promise.all([
      prisma.bitacoraEntrada.findMany({
        where: {
          fecha: { gte: inicio, lte: fin },
          ...(dIds ? { disciplina_id: { in: dIds } } : {}),
          ...(autor_id ? { autor_id } : {}),
        },
        include: {
          autor: { select: { id: true, nombre: true, foto_url: true, rol: true } },
          ubicacion: { select: { descripcion: true, padre: { select: { descripcion: true, padre: { select: { descripcion: true, padre: { select: { descripcion: true } } } } } } } },
          fotos: { orderBy: { orden: 'asc' } },
          archivos: true,
        },
        orderBy: { fecha: 'asc' },
      }),
      prisma.hallazgo.findMany({
        where: {
          fecha_creacion: { gte: inicio, lte: fin },
          ...(dIds ? { inspector: { disciplinas: { some: { disciplina_id: { in: dIds } } } } } : {}),
          ...(autor_id ? { inspector_id: autor_id } : {}),
        },
        include: {
          inspector: { select: { id: true, nombre: true, foto_url: true, rol: true } },
          ubicacion_tecnica: { select: { descripcion: true, padre: { select: { descripcion: true, padre: { select: { descripcion: true, padre: { select: { descripcion: true } } } } } } } },
        },
        orderBy: { fecha_creacion: 'asc' },
      }),
      prisma.ejecucionPauta.findMany({
        where: {
          created_at: { gte: inicio, lte: fin },
          ...(dIds ? { pauta: { disciplina_id: { in: dIds } } } : {}),
        },
        include: {
          pauta: { select: { nombre: true } },
          creado_por: { select: { id: true, nombre: true, foto_url: true, rol: true } },
          _count: { select: { items: true } },
        },
        orderBy: { created_at: 'asc' },
      }),
    ])

    const ejecIds = ejecuciones.map(e => e.id)
    const ejecutadosMap = {}
    if (ejecIds.length) {
      const counts = await prisma.itemEjecucion.groupBy({
        by: ['ejecucion_id'],
        where: { ejecucion_id: { in: ejecIds }, inspeccionado: true },
        _count: { id: true },
      })
      counts.forEach(c => { ejecutadosMap[c.ejecucion_id] = c._count.id })
    }

    const items = []
    for (const e of entradas) {
      items.push(fmtItem('ENTRADA', new Date(e.fecha.toISOString().slice(0,10) + 'T' + e.created_at.toISOString().slice(11,16) + ':00Z'),
        e.autor, ubicacionTexto(e.ubicacion), e.titulo, e.descripcion,
        { tipo: e.tipo, fotos_count: e.fotos.length, archivos_count: e.archivos.length },
        { _fotos: e.fotos, _archivos: e.archivos }))
    }
    for (const h of hallazgos) {
      items.push(fmtItem('HALLAZGO', h.fecha_creacion, h.inspector, ubicacionTexto(h.ubicacion_tecnica),
        h.descripcion.slice(0, 100), `${h.numero_aviso} · ${h.estado}`,
        { numero_aviso: h.numero_aviso, estado: h.estado, criticidad: h.criticidad }))
    }
    for (const ej of ejecuciones) {
      const ejec = ejecutadosMap[ej.id] || 0
      items.push(fmtItem('INSPECCION', ej.created_at, ej.creado_por, '',
        `${ej.pauta?.nombre || ''} — Ronda ${ej.numero_ronda}`, `${ejec}/${ej._count.items} ítems`,
        { pauta_nombre: ej.pauta?.nombre || '', items_total: ej._count.items, items_ejecutados: ejec, estado: ej.estado }))
    }
    items.sort((a, b) => new Date(a.fecha) - new Date(b.fecha))

    await generarPdfBitacora(res, {
      semana: semanaKey,
      disciplinaNombre,
      items,
      incluirFotos,
      generadoPor: req.user.nombre,
    })
  } catch (e) {
    console.error(e)
    if (!res.headersSent) return fail(res, 'ERROR', e.message, 500)
  }
}

// DELETE /api/bitacora/fotos/:fotoId
async function eliminarFoto(req, res) {
  try {
    const foto = await prisma.bitacoraFoto.findUnique({ where: { id: req.params.fotoId } })
    if (!foto) return fail(res, 'NO_ENCONTRADO', 'Foto no encontrada', 404)

    const entrada = await prisma.bitacoraEntrada.findUnique({ where: { id: foto.entrada_id } })
    if (!entrada) return fail(res, 'NO_ENCONTRADO', 'Entrada no encontrada', 404)

    const esAutor = entrada.autor_id === req.user.id
    const dentro24h = (Date.now() - new Date(entrada.created_at).getTime()) < 86400000
    if (req.user.rol !== 'ADMINISTRADOR' && !(esAutor && dentro24h)) {
      return fail(res, 'SIN_PERMISO', 'Sin permiso', 403)
    }

    await prisma.bitacoraFoto.delete({ where: { id: req.params.fotoId } })
    return ok(res, null, 'Foto eliminada')
  } catch (e) {
    return fail(res, 'ERROR', e.message, 500)
  }
}

// DELETE /api/bitacora/archivos/:archivoId
async function eliminarArchivo(req, res) {
  try {
    const archivo = await prisma.bitacoraArchivo.findUnique({ where: { id: req.params.archivoId } })
    if (!archivo) return fail(res, 'NO_ENCONTRADO', 'Archivo no encontrado', 404)

    const entrada = await prisma.bitacoraEntrada.findUnique({ where: { id: archivo.entrada_id } })
    if (!entrada) return fail(res, 'NO_ENCONTRADO', 'Entrada no encontrada', 404)

    const esAutor = entrada.autor_id === req.user.id
    const dentro24h = (Date.now() - new Date(entrada.created_at).getTime()) < 86400000
    if (req.user.rol !== 'ADMINISTRADOR' && !(esAutor && dentro24h)) {
      return fail(res, 'SIN_PERMISO', 'Sin permiso', 403)
    }

    await prisma.bitacoraArchivo.delete({ where: { id: req.params.archivoId } })
    return ok(res, null, 'Archivo eliminado')
  } catch (e) {
    return fail(res, 'ERROR', e.message, 500)
  }
}

// GET /api/bitacora/disciplinas — disciplinas accesibles para el usuario actual
async function misDisciplinas(req, res) {
  try {
    const disciplinaIds = await getDisciplinaIds(req.user)
    const where = disciplinaIds ? { id: { in: disciplinaIds }, activo: true } : { activo: true }
    const disciplinas = await prisma.disciplina.findMany({ where, orderBy: { nombre: 'asc' }, select: { id: true, nombre: true } })
    return ok(res, disciplinas)
  } catch (e) {
    return fail(res, 'ERROR', e.message, 500)
  }
}

module.exports = { listar, crear, detalle, actualizar, eliminar, confirmarSinNovedades, reporteSemanal, eliminarFoto, eliminarArchivo, misDisciplinas }
