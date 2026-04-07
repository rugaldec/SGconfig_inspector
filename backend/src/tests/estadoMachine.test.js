const { puedeTransicionar } = require('../utils/estadoMachine')

describe('Máquina de estados', () => {
  test('transiciones válidas desde ABIERTO', () => {
    expect(puedeTransicionar('ABIERTO', 'EN_GESTION')).toBe(true)
    expect(puedeTransicionar('ABIERTO', 'RECHAZADO')).toBe(true)
  })

  test('transiciones válidas desde EN_GESTION', () => {
    expect(puedeTransicionar('EN_GESTION', 'PENDIENTE_CIERRE')).toBe(true)
    expect(puedeTransicionar('EN_GESTION', 'RECHAZADO')).toBe(true)
  })

  test('transiciones válidas desde PENDIENTE_CIERRE', () => {
    expect(puedeTransicionar('PENDIENTE_CIERRE', 'CERRADO')).toBe(true)
    expect(puedeTransicionar('PENDIENTE_CIERRE', 'EN_GESTION')).toBe(true)
  })

  test('CERRADO es terminal — no puede reabrirse', () => {
    expect(puedeTransicionar('CERRADO', 'ABIERTO')).toBe(false)
    expect(puedeTransicionar('CERRADO', 'EN_GESTION')).toBe(false)
    expect(puedeTransicionar('CERRADO', 'RECHAZADO')).toBe(false)
  })

  test('RECHAZADO es terminal', () => {
    expect(puedeTransicionar('RECHAZADO', 'ABIERTO')).toBe(false)
    expect(puedeTransicionar('RECHAZADO', 'EN_GESTION')).toBe(false)
  })

  test('salto de estado no permitido', () => {
    expect(puedeTransicionar('ABIERTO', 'CERRADO')).toBe(false)
    expect(puedeTransicionar('ABIERTO', 'PENDIENTE_CIERRE')).toBe(false)
  })
})
