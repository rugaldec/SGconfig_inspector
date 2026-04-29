import { CheckCircle } from 'lucide-react'

export default function SinNovedadesCard({ item }) {
  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 border-l-4 border-l-gray-300 p-4 flex items-center gap-3">
      <CheckCircle size={18} className="text-gray-400 flex-shrink-0" />
      <div>
        <p className="text-sm font-semibold text-gray-600">Sin novedades confirmado</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Confirmado por {item.autor.nombre} · {item.hora}
        </p>
      </div>
    </div>
  )
}
