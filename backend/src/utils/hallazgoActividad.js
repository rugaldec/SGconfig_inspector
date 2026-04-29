const SEGUIMIENTO_DIAS = parseInt(process.env.SEGUIMIENTO_DIAS ?? '7')

function ultimaActividad(hallazgo) {
  const fechas = [new Date(hallazgo.fecha_creacion)]
  if (hallazgo.cambios_estado?.length)
    fechas.push(new Date(hallazgo.cambios_estado.at(-1).fecha))
  if (hallazgo.comentarios?.length)
    fechas.push(new Date(hallazgo.comentarios.at(-1).fecha_creacion))
  if (hallazgo.seguimientos?.length)
    fechas.push(new Date(hallazgo.seguimientos.at(-1).created_at))
  return new Date(Math.max(...fechas.map(f => f.getTime())))
}

function diasSinActividad(hallazgo) {
  const diff = Date.now() - ultimaActividad(hallazgo).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function requiereSeguimiento(hallazgo) {
  const estadosActivos = ['ABIERTO', 'EN_GESTION']
  if (!estadosActivos.includes(hallazgo.estado)) return false
  return diasSinActividad(hallazgo) >= SEGUIMIENTO_DIAS
}

module.exports = { ultimaActividad, diasSinActividad, requiereSeguimiento, SEGUIMIENTO_DIAS }
