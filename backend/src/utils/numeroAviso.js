const prisma = require('../db/client')

/**
 * Genera el siguiente número de aviso único para el año dado.
 * Usa upsert atómico en PostgreSQL — nunca hay duplicados aunque haya concurrencia.
 * NOTA: El contador se incrementa aunque falle el insert del hallazgo. Esto es intencional:
 * los números de aviso nunca se reutilizan, incluso si el hallazgo no se llegó a crear.
 */
async function generarNumeroAviso(tx = prisma) {
  const anio = new Date().getFullYear()

  const resultado = await tx.$queryRaw`
    INSERT INTO contadores_aviso (anio, ultimo_numero)
    VALUES (${anio}, 1)
    ON CONFLICT (anio)
    DO UPDATE SET ultimo_numero = contadores_aviso.ultimo_numero + 1
    RETURNING anio, ultimo_numero
  `

  const { anio: a, ultimo_numero: n } = resultado[0]
  return `AV-${a}-${String(n).padStart(6, '0')}`
}

module.exports = { generarNumeroAviso }
