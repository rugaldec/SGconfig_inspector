// Utilidades para cálculo de semanas ISO (lunes a domingo)

// Devuelve el string "YYYY-Www" de la semana ISO que contiene `date`
function toSemanaISO(date) {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  // Ajustar al jueves de la semana (criterio ISO 8601)
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

// Devuelve { inicio: Date (lunes 00:00 UTC), fin: Date (domingo 23:59:59 UTC) }
function rangoSemana(semanaISO) {
  const [year, weekPart] = semanaISO.split('-W')
  const week = parseInt(weekPart, 10)
  // Primer jueves del año
  const jan4 = new Date(Date.UTC(parseInt(year, 10), 0, 4))
  const dayOfWeek = jan4.getUTCDay() || 7
  // Lunes de la semana 1
  const lunes1 = new Date(jan4)
  lunes1.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1)
  // Lunes de la semana pedida
  const inicio = new Date(lunes1)
  inicio.setUTCDate(lunes1.getUTCDate() + (week - 1) * 7)
  const fin = new Date(inicio)
  fin.setUTCDate(inicio.getUTCDate() + 6)
  fin.setUTCHours(23, 59, 59, 999)
  return { inicio, fin }
}

// Devuelve la semana ISO actual
function semanaActual() {
  return toSemanaISO(new Date())
}

module.exports = { toSemanaISO, rangoSemana, semanaActual }
