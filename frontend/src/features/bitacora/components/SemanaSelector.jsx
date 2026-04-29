import { ChevronLeft, ChevronRight } from 'lucide-react'

// Obtiene el string "YYYY-Www" de la semana que contiene una fecha
function toSemanaISO(date) {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

// Rango lun-dom de una semana ISO
function rangoSemana(semanaISO) {
  const [year, weekPart] = semanaISO.split('-W')
  const week = parseInt(weekPart, 10)
  const jan4 = new Date(Date.UTC(parseInt(year, 10), 0, 4))
  const dayOfWeek = jan4.getUTCDay() || 7
  const lunes1 = new Date(jan4)
  lunes1.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1)
  const inicio = new Date(lunes1)
  inicio.setUTCDate(lunes1.getUTCDate() + (week - 1) * 7)
  const fin = new Date(inicio)
  fin.setUTCDate(inicio.getUTCDate() + 6)
  return { inicio, fin }
}

function moverSemana(semanaISO, delta) {
  const { inicio } = rangoSemana(semanaISO)
  inicio.setUTCDate(inicio.getUTCDate() + delta * 7)
  return toSemanaISO(inicio)
}

function formatRango(semanaISO) {
  const { inicio, fin } = rangoSemana(semanaISO)
  const opts = { day: 'numeric', month: 'short', timeZone: 'UTC' }
  const optsYear = { ...opts, year: 'numeric' }
  const s = inicio.toLocaleDateString('es-CL', opts)
  const e = fin.toLocaleDateString('es-CL', optsYear)
  return `${s} – ${e}`
}

export function semanaActual() {
  return toSemanaISO(new Date())
}

export default function SemanaSelector({ semana, onChange }) {
  const esActual = semana === semanaActual()

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(moverSemana(semana, -1))}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        title="Semana anterior"
      >
        <ChevronLeft size={18} />
      </button>

      <span className="text-sm font-medium text-gray-700 min-w-[180px] text-center">
        {formatRango(semana)}
        {esActual && <span className="ml-1.5 text-[10px] bg-blue-100 text-blue-700 rounded-full px-1.5 py-0.5 font-semibold">Actual</span>}
      </span>

      <button
        onClick={() => onChange(moverSemana(semana, 1))}
        disabled={esActual}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Semana siguiente"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
