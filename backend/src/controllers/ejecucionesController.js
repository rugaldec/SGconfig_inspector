const prisma = require('../db/client')
const { ok, fail } = require('../utils/responseHelper')

function calcularEstado(ejecucion) {
  if (ejecucion.estado === 'COMPLETADA') return 'COMPLETADA'
  if (new Date(ejecucion.fecha_fin) < new Date()) return 'VENCIDA'
  return ejecucion.estado
}

// GET /api/ejecuciones/activas — ejecuciones activas para la disciplina del inspector
async function ejecucionesActivas(req, res) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.user.id },
    select: { disciplina_id: true },
  })
  if (!usuario?.disciplina_id) return ok(res, [])

  const ejecuciones = await prisma.ejecucionPauta.findMany({
    where: {
      estado: { in: ['PENDIENTE', 'EN_CURSO'] },
      pauta: { disciplina_id: usuario.disciplina_id, activo: true },
    },
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

  return ok(res, enriched)
}

// GET /api/ejecuciones/:id — detalle completo de una ejecución
async function detalleEjecucion(req, res) {
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
            select: { id: true, codigo: true, descripcion: true, padre_id: true },
          },
          ejecutado_por: { select: { id: true, nombre: true } },
          hallazgo: {
            select: { id: true, numero_aviso: true, estado: true, criticidad: true },
          },
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
  const { id: ejecucionId, itemId } = req.params
  const { observacion, hallazgo_id } = req.body

  const [usuario, item] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id: req.user.id },
      select: { disciplina_id: true },
    }),
    prisma.itemEjecucion.findUnique({
      where: { id: itemId },
      include: {
        ejecucion: {
          include: { pauta: { select: { disciplina_id: true } } },
        },
        ejecutado_por: { select: { id: true, nombre: true } },
      },
    }),
  ])

  if (!item || item.ejecucion_id !== ejecucionId)
    return fail(res, 'NO_ENCONTRADO', 'Ítem no encontrado', 404)

  if (!usuario?.disciplina_id || usuario.disciplina_id !== item.ejecucion.pauta.disciplina_id)
    return fail(res, 'SIN_PERMISO', 'No perteneces a la disciplina de esta pauta', 403)

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

  const itemActualizado = await prisma.itemEjecucion.update({
    where: { id: itemId },
    data: {
      inspeccionado: true,
      ejecutado_por_id: req.user.id,
      fecha_inspeccion: new Date(),
      observacion: observacion?.trim() || null,
      ...(hallazgo_id && { hallazgo_id }),
    },
    include: {
      ejecutado_por: { select: { id: true, nombre: true } },
      hallazgo: { select: { id: true, numero_aviso: true, estado: true } },
    },
  })

  // Actualizar estado de la ejecución
  const ejecucion = await prisma.ejecucionPauta.findUnique({
    where: { id: ejecucionId },
    include: { items: { select: { inspeccionado: true } } },
  })

  const todosInspeccionados = ejecucion.items.every(i => i.inspeccionado)
  const esPrimero = ejecucion.estado === 'PENDIENTE'

  await prisma.ejecucionPauta.update({
    where: { id: ejecucionId },
    data: {
      ...(todosInspeccionados && { estado: 'COMPLETADA', fecha_completada: new Date() }),
      ...(!todosInspeccionados && esPrimero && { estado: 'EN_CURSO' }),
    },
  })

  return ok(res, itemActualizado)
}

module.exports = { ejecucionesActivas, detalleEjecucion, marcarItem }
