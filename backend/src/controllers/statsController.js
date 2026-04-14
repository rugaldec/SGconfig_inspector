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

module.exports = { stats }
