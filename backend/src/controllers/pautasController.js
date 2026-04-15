const prisma = require('../db/client')
const { ok, fail } = require('../utils/responseHelper')

// ── Helpers ──────────────────────────────────────────────────────────────────

function calcularEstadoEjecucion(ejecucion) {
  if (ejecucion.estado === 'COMPLETADA') return 'COMPLETADA'
  if (new Date(ejecucion.fecha_fin) < new Date()) return 'VENCIDA'
  return ejecucion.estado
}

function enrichEjecucion(e) {
  const inspeccionados = e.items?.filter(i => i.inspeccionado).length ?? 0
  const totalItems = e._count?.items ?? e.items?.length ?? 0
  const hallazgos = e.items?.filter(i => i.hallazgo_id).length ?? 0

  const inspMap = new Map()
  e.items?.filter(i => i.ejecutado_por).forEach(i => {
    inspMap.set(i.ejecutado_por_id, i.ejecutado_por)
  })

  return {
    ...e,
    items: undefined,
    estado: calcularEstadoEjecucion(e),
    cobertura: { inspeccionados, total: totalItems },
    hallazgos_count: hallazgos,
    inspectores: Array.from(inspMap.values()),
  }
}

// ── Plantillas ────────────────────────────────────────────────────────────────

async function listar(req, res) {
  const { disciplina_id, zona_id, activo, page = 1, limit = 20 } = req.query
  const where = {}
  if (disciplina_id) where.disciplina_id = disciplina_id
  if (zona_id) where.zona_funcional_id = zona_id
  if (activo !== undefined) where.activo = activo === 'true'

  const [total, pautas] = await Promise.all([
    prisma.pautaInspeccion.count({ where }),
    prisma.pautaInspeccion.findMany({
      where,
      include: {
        disciplina: { select: { id: true, nombre: true } },
        zona_funcional: { select: { id: true, codigo: true, descripcion: true } },
        creado_por: { select: { id: true, nombre: true } },
        _count: { select: { ubts: true, ejecuciones: true } },
      },
      orderBy: { created_at: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
  ])
  return ok(res, { pautas, total, page: Number(page), limit: Number(limit) })
}

async function crear(req, res) {
  const { nombre, descripcion, disciplina_id, zona_funcional_id, ubts } = req.body

  if (!nombre?.trim() || !disciplina_id || !zona_funcional_id || !ubts?.length) {
    return fail(res, 'DATOS_INCOMPLETOS', 'Nombre, disciplina, zona funcional y al menos una UBT son requeridos', 400)
  }

  const [disciplina, zona] = await Promise.all([
    prisma.disciplina.findUnique({ where: { id: disciplina_id } }),
    prisma.ubicacionTecnica.findUnique({ where: { id: zona_funcional_id } }),
  ])
  if (!disciplina || !disciplina.activo)
    return fail(res, 'DISCIPLINA_INVALIDA', 'Disciplina no encontrada o inactiva', 404)
  if (!zona || zona.nivel !== 2)
    return fail(res, 'ZONA_INVALIDA', 'La zona funcional debe ser un Área (nivel 2)', 400)

  const ubtIds = ubts.map(u => u.ubicacion_tecnica_id)
  const ubtNodes = await prisma.ubicacionTecnica.findMany({ where: { id: { in: ubtIds } } })
  if (ubtNodes.length !== ubtIds.length)
    return fail(res, 'UBT_NO_ENCONTRADA', 'Algunas UBTs no existen', 404)
  if (ubtNodes.some(n => n.nivel !== 4))
    return fail(res, 'UBT_INVALIDA', 'Todas las UBTs deben ser Componentes (nivel 4)', 400)

  const pauta = await prisma.pautaInspeccion.create({
    data: {
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || null,
      disciplina_id,
      zona_funcional_id,
      created_by: req.user.id,
      ubts: {
        create: ubts.map((u, i) => ({
          ubicacion_tecnica_id: u.ubicacion_tecnica_id,
          orden: u.orden ?? i + 1,
        })),
      },
    },
    include: {
      disciplina: { select: { id: true, nombre: true } },
      zona_funcional: { select: { id: true, codigo: true, descripcion: true } },
      ubts: {
        include: {
          ubicacion_tecnica: { select: { id: true, codigo: true, descripcion: true } },
        },
        orderBy: { orden: 'asc' },
      },
    },
  })
  return ok(res, pauta, 'Pauta creada', 201)
}

async function detalle(req, res) {
  const { id } = req.params
  const pauta = await prisma.pautaInspeccion.findUnique({
    where: { id },
    include: {
      disciplina: { select: { id: true, nombre: true } },
      zona_funcional: { select: { id: true, codigo: true, descripcion: true } },
      creado_por: { select: { id: true, nombre: true } },
      ubts: {
        include: {
          ubicacion_tecnica: {
            select: { id: true, codigo: true, descripcion: true, padre_id: true },
          },
        },
        orderBy: { orden: 'asc' },
      },
      _count: { select: { ubts: true, ejecuciones: true } },
    },
  })
  if (!pauta) return fail(res, 'NO_ENCONTRADO', 'Pauta no encontrada', 404)
  return ok(res, pauta)
}

async function actualizar(req, res) {
  const { id } = req.params
  const { nombre, descripcion, activo, ubts } = req.body

  const existe = await prisma.pautaInspeccion.findUnique({ where: { id } })
  if (!existe) return fail(res, 'NO_ENCONTRADO', 'Pauta no encontrada', 404)

  if (ubts !== undefined) {
    const activeEjecucion = await prisma.ejecucionPauta.findFirst({
      where: { pauta_id: id, estado: { in: ['PENDIENTE', 'EN_CURSO'] } },
    })
    if (activeEjecucion)
      return fail(res, 'EJECUCION_ACTIVA', 'No se pueden cambiar las UBTs mientras hay una ejecución activa', 409)

    const ubtIds = ubts.map(u => u.ubicacion_tecnica_id)
    const ubtNodes = await prisma.ubicacionTecnica.findMany({ where: { id: { in: ubtIds } } })
    if (ubtNodes.some(n => n.nivel !== 4))
      return fail(res, 'UBT_INVALIDA', 'Todas las UBTs deben ser Componentes (nivel 4)', 400)

    await prisma.$transaction([
      prisma.pautaUBT.deleteMany({ where: { pauta_id: id } }),
      prisma.pautaUBT.createMany({
        data: ubts.map((u, i) => ({
          pauta_id: id,
          ubicacion_tecnica_id: u.ubicacion_tecnica_id,
          orden: u.orden ?? i + 1,
        })),
      }),
    ])
  }

  const updateData = {}
  if (nombre !== undefined) updateData.nombre = nombre.trim()
  if (descripcion !== undefined) updateData.descripcion = descripcion?.trim() || null
  if (activo !== undefined) updateData.activo = activo

  const pauta = await prisma.pautaInspeccion.update({ where: { id }, data: updateData })
  return ok(res, pauta)
}

// ── Ejecuciones (anidadas en /pautas/:id/ejecuciones) ────────────────────────

async function programarEjecucion(req, res) {
  const { id } = req.params
  const { fecha_inicio, fecha_fin } = req.body

  if (!fecha_inicio || !fecha_fin)
    return fail(res, 'DATOS_INCOMPLETOS', 'Fecha de inicio y fin son requeridas', 400)

  const pauta = await prisma.pautaInspeccion.findUnique({
    where: { id },
    include: { ubts: { orderBy: { orden: 'asc' } } },
  })
  if (!pauta) return fail(res, 'NO_ENCONTRADO', 'Pauta no encontrada', 404)
  if (!pauta.activo) return fail(res, 'PAUTA_INACTIVA', 'La pauta está inactiva', 409)
  if (!pauta.ubts.length) return fail(res, 'SIN_UBTS', 'La pauta no tiene UBTs configuradas', 409)

  const activa = await prisma.ejecucionPauta.findFirst({
    where: { pauta_id: id, estado: { in: ['PENDIENTE', 'EN_CURSO'] } },
  })
  if (activa)
    return fail(res, 'EJECUCION_ACTIVA', 'Ya existe una ejecución activa para esta pauta', 409)

  const ejecucion = await prisma.ejecucionPauta.create({
    data: {
      pauta_id: id,
      fecha_inicio: new Date(fecha_inicio),
      fecha_fin: new Date(fecha_fin),
      created_by: req.user.id,
      items: {
        create: pauta.ubts.map(u => ({
          ubicacion_tecnica_id: u.ubicacion_tecnica_id,
          orden: u.orden,
        })),
      },
    },
    include: { _count: { select: { items: true } } },
  })
  return ok(res, ejecucion, 'Ejecución programada', 201)
}

async function historialEjecuciones(req, res) {
  const { id } = req.params
  const { page = 1, limit = 10 } = req.query

  const pauta = await prisma.pautaInspeccion.findUnique({ where: { id }, select: { id: true } })
  if (!pauta) return fail(res, 'NO_ENCONTRADO', 'Pauta no encontrada', 404)

  const [total, ejecuciones] = await Promise.all([
    prisma.ejecucionPauta.count({ where: { pauta_id: id } }),
    prisma.ejecucionPauta.findMany({
      where: { pauta_id: id },
      orderBy: { created_at: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      include: {
        creado_por: { select: { id: true, nombre: true } },
        _count: { select: { items: true } },
        items: {
          select: {
            inspeccionado: true,
            ejecutado_por_id: true,
            ejecutado_por: { select: { id: true, nombre: true } },
            hallazgo_id: true,
          },
        },
      },
    }),
  ])

  return ok(res, {
    ejecuciones: ejecuciones.map(enrichEjecucion),
    total,
    page: Number(page),
    limit: Number(limit),
  })
}

module.exports = { listar, crear, detalle, actualizar, programarEjecucion, historialEjecuciones }
