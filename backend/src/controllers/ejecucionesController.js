const prisma = require('../db/client')
const { ok, fail } = require('../utils/responseHelper')
const storage = require('../utils/storageService')
const { generarPdfEjecucion } = require('../utils/pdfEjecucion')
const { relanzarEjecucion } = require('../utils/relanzarPauta')

// Guarda: modelos no existen hasta aplicar la migración add_pautas_inspeccion
const MIGRACION_OK = !!prisma.ejecucionPauta
const PLANTILLAS_OK = !!prisma.plantillaVerificacion
function migracionPendiente(res) {
  return fail(res, 'MIGRACION_PENDIENTE', 'Función no disponible hasta aplicar la migración de pautas', 503)
}

function calcularEstado(ejecucion) {
  if (ejecucion.estado === 'COMPLETADA')   return 'COMPLETADA'
  if (ejecucion.estado === 'NO_EJECUTADA') return 'NO_EJECUTADA'
  if (new Date(ejecucion.fecha_fin) < new Date()) return 'VENCIDA'
  return ejecucion.estado
}

// GET /api/ejecuciones/activas — ejecuciones activas para las disciplinas del inspector
async function ejecucionesActivas(req, res) {
  if (!MIGRACION_OK) return ok(res, [])   // sin migración → lista vacía (no rompe la UI)

  const esAdmin = req.user.rol === 'ADMINISTRADOR'

  // Inspector: filtra por sus disciplinas. Admin: ve todas.
  let whereEjecucion = { estado: { in: ['PENDIENTE', 'EN_CURSO'] } }
  if (!esAdmin) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      select: { disciplinas: { select: { disciplina_id: true } } },
    })
    const disciplinaIds = usuario?.disciplinas.map(d => d.disciplina_id) ?? []
    if (!disciplinaIds.length) return ok(res, [])
    whereEjecucion.pauta = { disciplina_id: { in: disciplinaIds }, activo: true }
  } else {
    whereEjecucion.pauta = { activo: true }
  }

  const ejecuciones = await prisma.ejecucionPauta.findMany({
    where: whereEjecucion,
    include: {
      pauta: {
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          disciplina: { select: { id: true, nombre: true } },
          zona_funcional: { select: { id: true, codigo: true, descripcion: true } },
        },
      },
      _count: { select: { items: true } },
      items: {
        select: { inspeccionado: true, ejecutado_por_id: true },
      },
    },
    orderBy: { fecha_fin: 'asc' },
  })

  const enriched = ejecuciones.map(e => {
    const total = e._count.items
    const inspeccionados = e.items.filter(i => i.inspeccionado).length
    const mios = e.items.filter(i => i.ejecutado_por_id === req.user.id && i.inspeccionado).length
    return {
      ...e,
      items: undefined,
      estado: calcularEstado(e),
      cobertura: { inspeccionados, total, mios },
    }
  })

  const enrichedConCiclo = enriched.map(e => {
    const raw = ejecuciones.find(r => r.id === e.id)
    return {
      ...e,
      relanzamiento_auto: raw?.relanzamiento_auto ?? false,
      frecuencia_tipo:    raw?.frecuencia_tipo ?? null,
      max_ejecuciones:    raw?.max_ejecuciones ?? null,
      numero_ronda:       raw?.numero_ronda ?? 1,
      origen:             raw?.origen ?? 'MANUAL',
    }
  })

  return ok(res, enrichedConCiclo)
}

// GET /api/ejecuciones/:id — detalle completo de una ejecución
async function detalleEjecucion(req, res) {
  if (!MIGRACION_OK) return migracionPendiente(res)
  const { id } = req.params
  const ejecucion = await prisma.ejecucionPauta.findUnique({
    where: { id },
    include: {
      pauta: {
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          disciplina: { select: { id: true, nombre: true } },
          zona_funcional: { select: { id: true, codigo: true, descripcion: true } },
        },
      },
      creado_por: { select: { id: true, nombre: true } },
      items: {
        orderBy: { orden: 'asc' },
        include: {
          ubicacion_tecnica: {
            select: {
              id: true, codigo: true, descripcion: true, padre_id: true, nivel: true,
              padre: { select: { id: true, codigo: true, descripcion: true } },
            },
          },
          ejecutado_por: { select: { id: true, nombre: true } },
          hallazgo: {
            select: { id: true, numero_aviso: true, estado: true, criticidad: true },
          },
          ...(PLANTILLAS_OK && {
            plantilla_verif: {
              include: {
                campos: {
                  select: { id: true, etiqueta: true, tipo: true, orden: true, es_obligatorio: true, unidad_medida: true },
                  orderBy: { orden: 'asc' },
                },
              },
            },
            respuestas: {
              include: { campo: { select: { id: true, etiqueta: true, tipo: true, unidad_medida: true } } },
            },
          }),
        },
      },
    },
  })
  if (!ejecucion) return fail(res, 'NO_ENCONTRADO', 'Ejecución no encontrada', 404)

  const estado = calcularEstado(ejecucion)

  // Desglose por inspector
  const inspMap = new Map()
  ejecucion.items.filter(i => i.ejecutado_por).forEach(i => {
    if (!inspMap.has(i.ejecutado_por_id)) {
      inspMap.set(i.ejecutado_por_id, { ...i.ejecutado_por, count: 0 })
    }
    inspMap.get(i.ejecutado_por_id).count++
  })

  return ok(res, {
    ...ejecucion,
    estado,
    inspectores_desglose: Array.from(inspMap.values()),
    cobertura: {
      inspeccionados: ejecucion.items.filter(i => i.inspeccionado).length,
      total: ejecucion.items.length,
      hallazgos: ejecucion.items.filter(i => i.hallazgo_id).length,
    },
  })
}

// PATCH /api/ejecuciones/:id/items/:itemId — marcar ítem como inspeccionado
async function marcarItem(req, res) {
  if (!MIGRACION_OK) return migracionPendiente(res)
  const { id: ejecucionId, itemId } = req.params
  const { observacion, hallazgo_id } = req.body
  const respuestas = req.body.respuestas ? JSON.parse(req.body.respuestas) : []
  const fotoFile = req.file || null

  const [usuario, item] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id: req.user.id },
      select: { disciplinas: { select: { disciplina_id: true } } },
    }),
    prisma.itemEjecucion.findUnique({
      where: { id: itemId },
      include: {
        ejecucion: {
          include: { pauta: { select: { disciplina_id: true } } },
        },
        ejecutado_por: { select: { id: true, nombre: true } },
        ...(PLANTILLAS_OK && { plantilla_verif: { select: { id: true } } }),
      },
    }),
  ])

  if (!item || item.ejecucion_id !== ejecucionId)
    return fail(res, 'NO_ENCONTRADO', 'Ítem no encontrado', 404)

  // Admin puede marcar cualquier ítem; inspector solo si pertenece a la disciplina
  if (req.user.rol !== 'ADMINISTRADOR') {
    const discIds = usuario?.disciplinas.map(d => d.disciplina_id) ?? []
    if (!discIds.includes(item.ejecucion.pauta.disciplina_id))
      return fail(res, 'SIN_PERMISO', 'No perteneces a la disciplina de esta pauta', 403)
  }

  if (item.inspeccionado) {
    return res.status(409).json({
      data: null,
      error: 'YA_INSPECCIONADO',
      message: `Este ítem ya fue inspeccionado por ${item.ejecutado_por?.nombre ?? 'otro inspector'}`,
    })
  }

  // Validar hallazgo_id si viene
  if (hallazgo_id) {
    const hallazgo = await prisma.hallazgo.findUnique({ where: { id: hallazgo_id }, select: { id: true } })
    if (!hallazgo) return fail(res, 'HALLAZGO_NO_ENCONTRADO', 'Hallazgo no encontrado', 404)
  }

  // Validar campos obligatorios de la plantilla si aplica
  if (PLANTILLAS_OK && item.plantilla_verif_id) {
    const plantilla = await prisma.plantillaVerificacion.findUnique({
      where: { id: item.plantilla_verif_id },
      include: { campos: true },
    })
    if (plantilla) {
      const campObligs = plantilla.campos.filter(c => c.es_obligatorio)
      const faltantes = campObligs.filter(c => {
        const r = respuestas.find(r => r.campo_id === c.id)
        return !r || r.valor === '' || r.valor === null || r.valor === undefined
      })
      if (faltantes.length > 0) {
        return fail(res, 'CHECKLIST_INCOMPLETO',
          `Faltan ${faltantes.length} campo(s) obligatorio(s) del checklist`, 400)
      }
    }
  }

  // Guardar foto si viene
  let foto_url = null
  if (fotoFile) {
    const nombre = `inspeccion-${itemId}-${Date.now()}`
    foto_url = await storage.guardar(fotoFile.buffer, fotoFile.mimetype, nombre)
  }

  const itemActualizado = await prisma.itemEjecucion.update({
    where: { id: itemId },
    data: {
      inspeccionado: true,
      ejecutado_por_id: req.user.id,
      fecha_inspeccion: new Date(),
      observacion: observacion?.trim() || null,
      ...(foto_url && { foto_url }),
      ...(hallazgo_id && { hallazgo_id }),
      ...(PLANTILLAS_OK && respuestas.length > 0 && {
        respuestas: {
          upsert: respuestas.map(r => ({
            where: { item_ejecucion_id_campo_id: { item_ejecucion_id: itemId, campo_id: r.campo_id } },
            create: { campo_id: r.campo_id, valor: String(r.valor) },
            update: { valor: String(r.valor) },
          })),
        },
      }),
    },
    include: {
      ejecutado_por: { select: { id: true, nombre: true } },
      hallazgo: { select: { id: true, numero_aviso: true, estado: true } },
      ubicacion_tecnica: { select: { id: true, codigo: true, descripcion: true } },
    },
  })

  // Actualizar estado de la ejecución
  const ejecucion = await prisma.ejecucionPauta.findUnique({
    where: { id: ejecucionId },
    include: { items: { select: { inspeccionado: true } } },
  })

  const todosInspeccionados = ejecucion.items.every(i => i.inspeccionado)
  const esPrimero = ejecucion.estado === 'PENDIENTE'

  const ejecucionActualizada = await prisma.ejecucionPauta.update({
    where: { id: ejecucionId },
    data: {
      ...(todosInspeccionados && { estado: 'COMPLETADA', fecha_completada: new Date() }),
      ...(!todosInspeccionados && esPrimero && { estado: 'EN_CURSO' }),
    },
  })

  // Relanzamiento automático: fire & forget si se completó
  if (todosInspeccionados && ejecucionActualizada.relanzamiento_auto) {
    relanzarEjecucion(ejecucionActualizada).catch(err =>
      console.error('[RelanzarPauta] Error al generar próxima ronda:', err.message)
    )
  }

  return ok(res, itemActualizado)
}

// GET /api/ejecuciones/historial — ejecuciones COMPLETADAS o VENCIDAS
async function historialEjecuciones(req, res) {
  if (!MIGRACION_OK) return ok(res, [])

  const esAdmin = req.user.rol === 'ADMINISTRADOR'

  // Base: completadas, o pendiente/en_curso cuya fecha_fin ya pasó (VENCIDA computada)
  const estadosVencidos    = { estado: { in: ['PENDIENTE', 'EN_CURSO'] }, fecha_fin: { lt: new Date() } }
  const estadoCompletada   = { estado: 'COMPLETADA' }
  const estadoNoEjecutada  = { estado: 'NO_EJECUTADA' }

  let whereEjecucion = { OR: [estadoCompletada, estadoNoEjecutada, estadosVencidos] }

  if (!esAdmin) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      select: { disciplinas: { select: { disciplina_id: true } } },
    })
    const disciplinaIds = usuario?.disciplinas.map(d => d.disciplina_id) ?? []
    if (!disciplinaIds.length) return ok(res, [])
    whereEjecucion = {
      AND: [
        { OR: [estadoCompletada, estadoNoEjecutada, estadosVencidos] },
        { pauta: { disciplina_id: { in: disciplinaIds } } },
      ],
    }
  } else {
    whereEjecucion = {
      AND: [
        { OR: [estadoCompletada, estadoNoEjecutada, estadosVencidos] },
      ],
    }
  }

  const ejecuciones = await prisma.ejecucionPauta.findMany({
    where: whereEjecucion,
    include: {
      pauta: {
        select: {
          id: true,
          nombre: true,
          disciplina: { select: { id: true, nombre: true } },
        },
      },
      _count: { select: { items: true } },
      items: {
        select: {
          inspeccionado: true,
          hallazgo_id: true,
          ejecutado_por_id: true,
          fecha_inspeccion: true,
          foto_url: true,
          observacion: true,
          ejecutado_por: { select: { id: true, nombre: true } },
        },
      },
    },
    orderBy: { fecha_fin: 'desc' },
  })

  const enriched = ejecuciones.map(e => {
    const total          = e._count.items
    const inspeccionados = e.items.filter(i => i.inspeccionado).length
    const hallazgos      = e.items.filter(i => i.hallazgo_id).length

    // Desglose de inspectores con primera y última fecha de inspección
    const inspMap = new Map()
    e.items.filter(i => i.inspeccionado && i.ejecutado_por).forEach(i => {
      if (!inspMap.has(i.ejecutado_por_id)) {
        inspMap.set(i.ejecutado_por_id, {
          ...i.ejecutado_por,
          count: 0,
          primera: i.fecha_inspeccion,
          ultima: i.fecha_inspeccion,
        })
      }
      const entry = inspMap.get(i.ejecutado_por_id)
      entry.count++
      if (i.fecha_inspeccion < entry.primera) entry.primera = i.fecha_inspeccion
      if (i.fecha_inspeccion > entry.ultima)  entry.ultima  = i.fecha_inspeccion
    })

    const fotos = e.items
      .filter(i => i.foto_url)
      .map(i => ({ url: i.foto_url, observacion: i.observacion ?? null }))

    return {
      ...e,
      items: undefined,
      estado: calcularEstado(e),
      cobertura: { inspeccionados, total, hallazgos },
      inspectores: Array.from(inspMap.values()),
      fotos,
    }
  })

  return ok(res, enriched)
}

// GET /api/ejecuciones/:id/pdf — reporte PDF de la ejecución
async function pdfEjecucion(req, res) {
  if (!MIGRACION_OK) return migracionPendiente(res)
  const { id } = req.params

  const ejecucion = await prisma.ejecucionPauta.findUnique({
    where: { id },
    include: {
      pauta: {
        select: {
          id: true, nombre: true, descripcion: true,
          disciplina: { select: { id: true, nombre: true } },
        },
      },
      items: {
        orderBy: { orden: 'asc' },
        include: {
          ubicacion_tecnica: { select: { id: true, codigo: true, descripcion: true } },
          ejecutado_por:     { select: { id: true, nombre: true } },
          hallazgo:          { select: { id: true, numero_aviso: true, estado: true, criticidad: true } },
        },
      },
    },
  })

  if (!ejecucion) return fail(res, 'NO_ENCONTRADO', 'Ejecución no encontrada', 404)

  const nombreArchivo = (ejecucion.pauta?.nombre ?? 'pauta')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/gi, '_').toLowerCase()
  const fechaStr = new Date().toISOString().slice(0, 10)

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="reporte_${nombreArchivo}_${fechaStr}.pdf"`)

  await generarPdfEjecucion({ ...ejecucion, estado: calcularEstado(ejecucion) }, res)
}

// PATCH /api/ejecuciones/:id/cerrar — cierra la ejecución como No Ejecutada
async function cerrarEjecucion(req, res) {
  if (!MIGRACION_OK) return migracionPendiente(res)
  const { id } = req.params
  const { motivo } = req.body

  const ejecucion = await prisma.ejecucionPauta.findUnique({
    where: { id },
    include: { pauta: { select: { disciplina_id: true } } },
  })

  if (!ejecucion) return fail(res, 'NO_ENCONTRADO', 'Ejecución no encontrada', 404)

  if (!['PENDIENTE', 'EN_CURSO'].includes(ejecucion.estado)) {
    return fail(res, 'ESTADO_INVALIDO', 'Solo se pueden cerrar ejecuciones en estado Pendiente o En Curso', 400)
  }

  // Inspector solo puede cerrar si pertenece a la disciplina
  if (req.user.rol !== 'ADMINISTRADOR') {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      select: { disciplinas: { select: { disciplina_id: true } } },
    })
    const discIds = usuario?.disciplinas.map(d => d.disciplina_id) ?? []
    if (!discIds.includes(ejecucion.pauta.disciplina_id))
      return fail(res, 'SIN_PERMISO', 'No perteneces a la disciplina de esta pauta', 403)
  }

  const actualizada = await prisma.ejecucionPauta.update({
    where: { id },
    data: {
      estado: 'NO_EJECUTADA',
      fecha_completada: new Date(),
      motivo_cierre: motivo?.trim() || null,
    },
  })

  return ok(res, actualizada)
}

module.exports = { ejecucionesActivas, detalleEjecucion, marcarItem, historialEjecuciones, pdfEjecucion, cerrarEjecucion }
