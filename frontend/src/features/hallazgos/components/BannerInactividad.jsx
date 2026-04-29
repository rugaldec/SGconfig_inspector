import { Clock } from 'lucide-react'

function colorClass(dias) {
  if (dias >= 30) return 'bg-red-50 border-red-200 text-red-700'
  if (dias >= 15) return 'bg-orange-50 border-orange-200 text-orange-700'
  return 'bg-yellow-50 border-yellow-200 text-yellow-700'
}

function iconColor(dias) {
  if (dias >= 30) return 'text-red-500'
  if (dias >= 15) return 'text-orange-500'
  return 'text-yellow-500'
}

export default function BannerInactividad({ dias, onConfirmar }) {
  return (
    <div className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-3 ${colorClass(dias)}`}>
      <div className="flex items-center gap-2">
        <Clock size={16} className={iconColor(dias)} />
        <span className="text-sm font-medium">
          Sin actividad hace <strong>{dias} día{dias !== 1 ? 's' : ''}</strong>
        </span>
      </div>
      <button
        onClick={onConfirmar}
        className="text-sm font-semibold shrink-0 underline underline-offset-2 hover:opacity-75"
      >
        Confirmar condición
      </button>
    </div>
  )
}
