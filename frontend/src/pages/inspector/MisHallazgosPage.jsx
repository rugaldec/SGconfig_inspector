import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'
import EstadoBadge from '../../components/hallazgo/EstadoBadge'
import CriticidadBadge from '../../components/hallazgo/CriticidadBadge'
import Spinner from '../../components/ui/Spinner'
import { useOfflineQueue } from '../../hooks/useOfflineQueue'
import { useNavigate } from 'react-router-dom'
import { PlusCircle } from 'lucide-react'

export default function MisHallazgosPage() {
  const navigate = useNavigate()
  const { pendientes } = useOfflineQueue()

  const { data, isLoading, error } = useQuery({
    queryKey: ['hallazgos-mios'],
    queryFn: () => api.get('/hallazgos/mios').then(r => r.data.data),
  })

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  if (error) return <p className="text-red-500 text-center py-8">Error al cargar hallazgos</p>

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-800">Mis Hallazgos</h1>
        <button
          onClick={() => navigate('/inspector/nuevo')}
          className="flex items-center gap-1.5 bg-blue-800 text-white text-sm px-3 py-2 rounded-xl hover:bg-blue-900">
          <PlusCircle size={16} /> Nuevo
        </button>
      </div>

      {/* Pendientes offline */}
      {pendientes.map(p => (
        <div key={p.id} className="bg-white border border-amber-200 rounded-xl p-4 mb-3 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-amber-600 font-medium mb-1">Pendiente sincronización</p>
              <p className="text-sm font-medium text-gray-800 truncate">{p.ubicacion?.codigo} — {p.ubicacion?.descripcion}</p>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{p.descripcion}</p>
            </div>
            <CriticidadBadge criticidad={p.criticidad} />
          </div>
        </div>
      ))}

      {/* Hallazgos del servidor */}
      {data?.length === 0 && pendientes.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">Sin hallazgos aún</p>
          <p className="text-sm mt-1">Registra tu primer hallazgo con el botón Nuevo</p>
        </div>
      )}

      <div className="space-y-3">
        {data?.map(h => (
          <button
            key={h.id}
            onClick={() => navigate(`/inspector/hallazgos/${h.id}`)}
            className="w-full text-left bg-white rounded-xl border shadow-sm p-4 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-mono">{h.numero_aviso}</p>
                <p className="text-sm font-medium text-gray-800 truncate">{h.ubicacion_tecnica.codigo}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <EstadoBadge estado={h.estado} />
                <CriticidadBadge criticidad={h.criticidad} />
              </div>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">{h.descripcion}</p>
            <p className="text-xs text-gray-400 mt-2">{new Date(h.fecha_creacion).toLocaleDateString('es-CL')}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
