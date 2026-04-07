const { generarNumeroAviso } = require('../utils/numeroAviso')

// Este test requiere DATABASE_URL configurada en el entorno
// Ejecutar: DATABASE_URL=... npm test -- --testPathPattern=numeroAviso

describe('Generación de número de aviso', () => {
  const anio = new Date().getFullYear()

  test('formato correcto AV-YYYY-NNNNNN', async () => {
    const numero = await generarNumeroAviso()
    expect(numero).toMatch(new RegExp(`^AV-${anio}-\\d{6,}$`))
  })

  test('dos llamadas concurrentes devuelven números distintos', async () => {
    const [a, b] = await Promise.all([generarNumeroAviso(), generarNumeroAviso()])
    expect(a).not.toBe(b)
  })

  test('el número tiene al menos 6 dígitos de padding', async () => {
    const numero = await generarNumeroAviso()
    const partes = numero.split('-')
    expect(partes[2].length).toBeGreaterThanOrEqual(6)
  })
})
