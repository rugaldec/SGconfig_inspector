import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '../../../features/auth/useAuth'

export default function InspeccionCard({ item }) {
  const { rolEfectivo } = useAuth()
  const prefix = rolEfectivo === 'INSPECTOR' ? '/inspector' : '/supervisor'
  const to = `${prefix}/ejecuciones/${item.meta.ejecucion_id}`
  const pct = item.meta.items_total > 0
    ? Math.round((item.meta.items_ejecutados / item.meta.items_total) * 100)
    : 0

  return (
    <div className="bg-white rounded-xl shadow-sm border-l-4 border-purple-500 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">INSPECCIÓN</span>
              <span className="text-xs text-gray-500">{item.hora}</span>
            </div>
            <p className="font-semibold text-gray-900 text-sm truncate">{item.titulo}</p>
            <p className="text-gray-600 text-sm mt-0.5">{item.resumen}</p>
          </div>
          <Link to={to} className="flex-shrink-0 flex items-center gap-1 text-xs text-blue-600 hover:underline">
            ver <ArrowRight size={13} />
          </Link>
        </div>

        {/* Barra de progreso */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{item.meta.items_ejecutados}/{item.meta.items_total} ítems</span>
            <span>{pct}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2">
          {item.autor.foto_url
            ? <img src={item.autor.foto_url} alt="" className="w-5 h-5 rounded-full object-cover" />
            : <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-500">{item.autor.nombre[0]}</div>
          }
          <span className="text-xs text-gray-500">{item.autor.nombre}</span>
        </div>
      </div>
    </div>
  )
}
