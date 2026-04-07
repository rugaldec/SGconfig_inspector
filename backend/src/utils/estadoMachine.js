const TRANSICIONES_VALIDAS = {
  ABIERTO:          ['EN_GESTION', 'RECHAZADO'],
  EN_GESTION:       ['PENDIENTE_CIERRE', 'RECHAZADO'],
  PENDIENTE_CIERRE: ['CERRADO', 'EN_GESTION'],
  CERRADO:          [],
  RECHAZADO:        [],
}

function puedeTransicionar(estadoActual, estadoNuevo) {
  const permitidos = TRANSICIONES_VALIDAS[estadoActual] || []
  return permitidos.includes(estadoNuevo)
}

module.exports = { puedeTransicionar, TRANSICIONES_VALIDAS }
