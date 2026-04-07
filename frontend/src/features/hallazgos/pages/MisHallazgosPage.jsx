import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMisHallazgos } from '../hooks/useHallazgos'
import { useOfflineQueue } from '../../../shared/hooks/useOfflineQueue'
import { ESTADO_CONFIG } from '../estadoMachine'
import HallazgoCard from '../components/HallazgoCard'
import Spinner from '../../../shared/components/ui/Spinner'
import Button from '../../../shared/components/ui/Button'
import { PlusCircle } from 'lucide-react'

const ESTADOS = Object.entries(ESTADO_CONFIG)

export default function MisHallazgosPage() {
  const navigate = useNavigate()
  const { data: hallazgos, isLoading, isError } = useMisHallazgos()
  const { pendientes } = useOfflineQueue()
  const [filtro, setFiltro] = useState(null)

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  if (isError) return <p className="text-center py-10 text-red-500">Error al cargar hallazgos</p>

  const hallazgosFiltrados = filtro
    ? hallazgos?.filter(h => h.estado === filtro)
    : hallazgos

  const sinRegistros = !pendientes.length && !hallazgosFiltrados?.length

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Mis Hallazgos</h1>
        <Button size="sm" onClick={() => navigate('/inspector/nuevo')}>
          <PlusCircle size={15} /> Nuevo
        </Button>
      </div>

      {/* Filtro por estado */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        <button
          onClick={() => setFiltro(null)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
            filtro === null
              ? 'bg-gray-800 text-white border-gray-800'
              : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
          }`}
        >
          Todos {hallazgos?.length ? `(${hallazgos.length})` : ''}
        </button>
        {ESTADOS.map(([estado, cfg]) => {
          const count = hallazgos?.filter(h => h.estado === estado).length ?? 0
          if (count === 0) return null
          return (
            <button
              key={estado}
              onClick={() => setFiltro(filtro === estado ? null : estado)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                filtro === estado
                  ? `${cfg.bg} ${cfg.text} border-current`
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              {cfg.label} ({count})
            </button>
          )
        })}
      </div>

      {sinRegistros && (
        <div className="text-center py-16 text-gray-400">
          {filtro
            ? <p className="text-sm">Sin hallazgos con estado "{ESTADO_CONFIG[filtro]?.label}"</p>
            : <><p className="text-lg font-medium">Sin hallazgos aún</p><p className="text-sm mt-1">Registra tu primer hallazgo con el botón Nuevo</p></>
          }
        </div>
      )}

      <div className="space-y-3">
        {!filtro && pendientes.map((p) => (
          <HallazgoCard key={p.id} hallazgo={p} pendiente />
        ))}
        {hallazgosFiltrados?.map((h) => (
          <HallazgoCard key={h.id} hallazgo={h} onClick={() => navigate(`/inspector/hallazgos/${h.id}`)} />
        ))}
      </div>
    </div>
  )
}
