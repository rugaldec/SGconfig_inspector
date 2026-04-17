const prisma = require('../db/client')

// Días que corresponden a cada tipo de frecuencia
const FRECUENCIA_DIAS = {
  DIARIA:     1,
  SEMANAL:    7,
  QUINCENAL:  15,
  MENSUAL:    30,
}

/**
 * Genera la próxima ejecución automática cuando una ronda finaliza
 * (COMPLETADA o VENCIDA). Respeta max_ejecuciones y el intervalo definido.
 *
 * @param {object} ejecucion  Registro completo de EjecucionPauta
 * @returns {object|null}     Nueva ejecucion creada, o null si no corresponde relanzar
 */
async function relanzarEjecucion(ejecucion) {
  if (!ejecucion.relanzamiento_auto) return null

  // Verificar límite de rondas
  if (ejecucion.max_ejecuciones !== null && ejecucion.max_ejecuciones !== undefined) {
    if (ejecucion.numero_ronda >= ejecucion.max_ejecuciones) return null
  }

  // Calcular el intervalo en días entre rondas
  const intervaloDias = ejecucion.frecuencia_dias
    ?? FRECUENCIA_DIAS[ejecucion.frecuencia_tipo]
    ?? 7

  // Duración de cada ronda (heredada del campo o de la diferencia original)
  const duracionDias = ejecucion.duracion_dias ?? intervaloDias

  // Nueva ronda comienza un intervaloDias después del fin de esta
  const nuevaInicio = new Date(ejecucion.fecha_fin)
  nuevaInicio.setDate(nuevaInicio.getDate() + intervaloDias)

  const nuevaFin = new Date(nuevaInicio)
  nuevaFin.setDate(nuevaFin.getDate() + duracionDias - 1)

  // Obtener la pauta con sus UBTs actualizadas
  const pauta = await prisma.pautaInspeccion.findUnique({
    where: { id: ejecucion.pauta_id },
    include: { ubts: { orderBy: { orden: 'asc' } } },
  })

  if (!pauta?.activo || !pauta.ubts.length) return null

  // Crear la nueva ejecución
  const nueva = await prisma.ejecucionPauta.create({
    data: {
      pauta_id:          ejecucion.pauta_id,
      fecha_inicio:      nuevaInicio,
      fecha_fin:         nuevaFin,
      created_by:        ejecucion.created_by,
      relanzamiento_auto: true,
      frecuencia_tipo:   ejecucion.frecuencia_tipo,
      frecuencia_dias:   ejecucion.frecuencia_dias,
      duracion_dias:     ejecucion.duracion_dias,
      max_ejecuciones:   ejecucion.max_ejecuciones,
      numero_ronda:      ejecucion.numero_ronda + 1,
      origen:            'AUTO',
      ejecucion_padre_id: ejecucion.id,
      items: {
        create: pauta.ubts.map(u => ({
          ubicacion_tecnica_id: u.ubicacion_tecnica_id,
          orden: u.orden,
        })),
      },
    },
    include: { _count: { select: { items: true } } },
  })

  console.log(
    `[RelanzarPauta] Ronda ${nueva.numero_ronda} generada automáticamente` +
    ` para pauta ${ejecucion.pauta_id}` +
    ` (${nuevaInicio.toLocaleDateString('es-CL')} — ${nuevaFin.toLocaleDateString('es-CL')})`
  )

  return nueva
}

module.exports = { relanzarEjecucion, FRECUENCIA_DIAS }
