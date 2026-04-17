const { ok } = require('../utils/responseHelper')
const prisma = require('../db/client')

// Recoge todos los IDs descendientes de una ubicación
async function getDescendientes(raizId) {
  const todos = await prisma.ubicacionTecnica.findMany({ select: { id: true, padre_id: true } })
  function descendientes(id) {
    const result = [id]
    const hijos = todos.filter(u => u.padre_id === id)
    for (const hijo of hijos) result.push(...descendientes(hijo.id))
    return result
  }
  return descendientes(raizId)
}

async function stats(req, res) {
  const { planta_id, area_id } = req.query

  let ubicacionIds = undefined
  if (area_id || planta_id) {
    ubicacionIds = await getDescendientes(area_id || planta_id)
  }

  const where = ubicacionIds ? { ubicacion_tecnica_id: { in: ubicacionIds } } : {}

  const [
    porEstado,
    porCriticidad,
    porCategoria,
    rankingInspectores,
    totalHallazgos,
    hallazgosConUbicacion,
  ] = await Promise.all([
    prisma.hallazgo.groupBy({ by: ['estado'], where, _count: { id: true } }),
    prisma.hallazgo.groupBy({ by: ['criticidad'], where, _count: { id: true } }),
    prisma.hallazgo.groupBy({ by: ['categoria'], where, _count: { id: true } }),
    // Top 5 inspectores por total de hallazgos
    prisma.hallazgo.groupBy({
      by: ['inspector_id'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
    prisma.hallazgo.count({ where }),
    // Hallazgos con jerarquía completa para ranking de áreas
    prisma.hallazgo.findMany({
      where,
      select: {
        estado: true,
        ubicacion_tecnica: {
          select: {
            id: true, codigo: true, nivel: true,
            padre: {
              select: {
                id: true, codigo: true, nivel: true,
                padre: {
                  select: {
                    id: true, codigo: true, descripcion: true, nivel: true,
                  }
                }
              }
            }
          }
        }
      }
    }),
  ])

  // Enriquecer inspectores con nombre y activos
  const inspectorIds = rankingInspectores.map(r => r.inspector_id)
  const [inspectores, activosPorInspector] = await Promise.all([
    prisma.usuario.findMany({
      where: { id: { in: inspectorIds } },
      select: { id: true, nombre: true },
    }),
    prisma.hallazgo.groupBy({
      by: ['inspector_id'],
      where: { ...where, estado: { notIn: ['CERRADO', 'RECHAZADO'] } },
      _count: { id: true },
    }),
  ])

  const rankingInspectoresEnriquecido = rankingInspectores.map(r => ({
    id: r.inspector_id,
    nombre: inspectores.find(i => i.id === r.inspector_id)?.nombre ?? 'Desconocido',
    total: r._count.id,
    activos: activosPorInspector.find(a => a.inspector_id === r.inspector_id)?._count?.id ?? 0,
  }))

  // Calcular ranking de áreas (nivel 2) desde los hallazgos cargados
  const conteoAreas = {}
  for (const h of hallazgosConUbicacion) {
    // La ubicación es nivel 4, su padre es nivel 3, el padre del padre es nivel 2 (área)
    const area = h.ubicacion_tecnica?.padre?.padre
    if (!area || area.nivel !== 2) continue
    if (!conteoAreas[area.id]) {
      conteoAreas[area.id] = { id: area.id, codigo: area.codigo, descripcion: area.descripcion, total: 0, activos: 0 }
    }
    conteoAreas[area.id].total++
    if (!['CERRADO', 'RECHAZADO'].includes(h.estado)) {
      conteoAreas[area.id].activos++
    }
  }
  const rankingAreas = Object.values(conteoAreas)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  return ok(res, {
    total: totalHallazgos,
    porEstado: Object.fromEntries(porEstado.map(r => [r.estado, r._count.id])),
    porCriticidad: Object.fromEntries(porCriticidad.map(r => [r.criticidad, r._count.id])),
    porCategoria: Object.fromEntries(porCategoria.map(r => [r.categoria, r._count.id])),
    rankingInspectores: rankingInspectoresEnriquecido,
    rankingAreas,
  })
}

async function statsDisciplina(req, res) {
  const MIGRACION_OK = !!prisma.ejecucionPauta
  if (!MIGRACION_OK) {
    return ok(res, {
      disciplinas: [], inspecciones: { activas: 0, atrasadas: 0, completadas: 0 },
      hallazgos: { porEstado: {}, porCriticidad: {}, total: 0 }, ejecucionesActivas: [],
    })
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: req.user.id },
    select: { disciplinas: { select: { disciplina: { select: { id: true, nombre: true } } } } },
  })

  const disciplinas = usuario?.disciplinas.map(d => d.disciplina) ?? []
  const disciplinaIds = disciplinas.map(d => d.id)

  if (!disciplinaIds.length) {
    return ok(res, {
      disciplinas: [], inspecciones: { activas: 0, atrasadas: 0, completadas: 0 },
      hallazgos: { porEstado: {}, porCriticidad: {}, total: 0 }, ejecucionesActivas: [],
    })
  }

  const ahora = new Date()

  const [countActivas, countAtrasadas, countCompletadas, hallazgosEstado, hallazgosCriticidad, pautaUBTs, ejecuciones] =
    await Promise.all([
      prisma.ejecucionPauta.count({
        where: { pauta: { disciplina_id: { in: disciplinaIds } }, estado: { in: ['PENDIENTE', 'EN_CURSO'] }, fecha_fin: { gte: ahora } },
      }),
      prisma.ejecucionPauta.count({
        where: { pauta: { disciplina_id: { in: disciplinaIds } }, estado: { in: ['PENDIENTE', 'EN_CURSO'] }, fecha_fin: { lt: ahora } },
      }),
      prisma.ejecucionPauta.count({
        where: { pauta: { disciplina_id: { in: disciplinaIds } }, estado: 'COMPLETADA' },
      }),
      // hallazgos por estado: los que tienen ítems vinculados a pautas de la disciplina
      prisma.hallazgo.groupBy({
        by: ['estado'],
        where: { item_ejecucion: { ejecucion: { pauta: { disciplina_id: { in: disciplinaIds } } } } },
        _count: { _all: true },
      }),
      prisma.hallazgo.groupBy({
        by: ['criticidad'],
        where: { item_ejecucion: { ejecucion: { pauta: { disciplina_id: { in: disciplinaIds } } } } },
        _count: { _all: true },
      }),
      prisma.pautaUBT.findMany({
        where: { pauta: { disciplina_id: { in: disciplinaIds } } },
        select: { ubicacion_tecnica_id: true },
        distinct: ['ubicacion_tecnica_id'],
      }),
      prisma.ejecucionPauta.findMany({
        where: {
          pauta: { disciplina_id: { in: disciplinaIds } },
          estado: { in: ['PENDIENTE', 'EN_CURSO'] },
        },
        include: {
          pauta: { select: { id: true, nombre: true, disciplina: { select: { id: true, nombre: true } } } },
          _count: { select: { items: true } },
          items: { select: { inspeccionado: true } },
        },
        orderBy: { fecha_fin: 'asc' },
      }),
    ])

  const porEstado     = Object.fromEntries(hallazgosEstado.map(h => [h.estado, h._count._all]))
  const porCriticidad = Object.fromEntries(hallazgosCriticidad.map(h => [h.criticidad, h._count._all]))
  const total         = Object.values(porEstado).reduce((a, b) => a + b, 0)

  const ejecucionesEnriquecidas = ejecuciones.map(e => ({
    id:         e.id,
    fecha_fin:  e.fecha_fin,
    fecha_inicio: e.fecha_inicio,
    pauta:      e.pauta,
    estado:     new Date(e.fecha_fin) < ahora ? 'ATRASADA' : e.estado,
    cobertura:  {
      inspeccionados: e.items.filter(i => i.inspeccionado).length,
      total: e._count.items,
    },
  }))

  return ok(res, {
    disciplinas,
    inspecciones: { activas: countActivas, atrasadas: countAtrasadas, completadas: countCompletadas },
    hallazgos: { porEstado, porCriticidad, total },
    ejecucionesActivas: ejecucionesEnriquecidas,
  })
}

module.exports = { stats, statsDisciplina }
