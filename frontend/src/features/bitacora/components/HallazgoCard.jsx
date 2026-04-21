import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { CRITICIDAD_COLOR } from '../schemas'
import { useAuth } from '../../../features/auth/useAuth'

const ESTADO_COLOR = {
  ABIERTO:           'text-red-700 bg-red-50',
  EN_GESTION:        'text-orange-700 bg-orange-50',
  PENDIENTE_CIERRE:  'text-yellow-700 bg-yellow-50',
  CERRADO:           'text-green-700 bg-green-50',
  RECHAZADO:         'text-gray-700 bg-gray-100',
}

export default function HallazgoCard({ item }) {
  const { rolEfectivo } = useAuth()
  const prefix = rolEfectivo === 'INSPECTOR' ? '/inspector' : '/supervisor'
  const to = `${prefix}/hallazgos/${item.meta.hallazgo_id}`
  const cc = CRITICIDAD_COLOR[item.meta.criticidad] || {}
  const ec = ESTADO_COLOR[item.meta.estado] || ''

  return (
    <div className="bg-white rounded-xl shadow-sm border-l-4 border-red-500 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">HALLAZGO</span>
              <span className="text-xs text-gray-500">{item.hora}</span>
            </div>
            <p className="font-semibold text-gray-900 text-sm">{item.meta.numero_aviso}</p>
            <p className="text-gray-600 text-sm line-clamp-2 mt-0.5">{item.titulo}</p>
          </div>
          <Link to={to} className="flex-shrink-0 flex items-center gap-1 text-xs text-blue-600 hover:underline">
            ver <ArrowRight size={13} />
          </Link>
        </div>

        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cc.bg} ${cc.text}`}>
            {item.meta.criticidad}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ec}`}>
            {item.meta.estado?.replace(/_/g, ' ')}
          </span>
          <span className="text-xs text-gray-400">{item.meta.categoria}</span>
        </div>

        <div className="mt-2 flex items-center gap-2">
          {item.autor.foto_url
            ? <img src={item.autor.foto_url} alt="" className="w-5 h-5 rounded-full object-cover" />
            : <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-500">{item.autor.nombre[0]}</div>
          }
          <span className="text-xs text-gray-500">{item.autor.nombre}</span>
          {item.ubicacion && <span className="text-xs text-gray-400 truncate">· {item.ubicacion}</span>}
        </div>
      </div>
    </div>
  )
}
