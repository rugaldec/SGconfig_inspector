import { useNavigate } from 'react-router-dom'
import { ClipboardCheck, AlertCircle } from 'lucide-react'
import { useEjecucionesActivas } from '../hooks/usePautas'
import EstadoEjecucionBadge from '../components/EstadoEjecucionBadge'
import ProgresoPauta from '../components/ProgresoPauta'
import Spinner from '../../../shared/components/ui/Spinner'

export default function MisPautasPage() {
  const navigate = useNavigate()
  const { data: ejecuciones, isLoading } = useEjecucionesActivas()

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  if (!ejecuciones?.length) {
    return (
      <div>
        <h1 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
          <ClipboardCheck size={20} /> Mis Pautas
        </h1>
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
          <ClipboardCheck size={40} className="text-gray-200" />
          <p className="text-sm">No tienes ejecuciones activas en tu disciplina</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
        <ClipboardCheck size={20} /> Mis Pautas
      </h1>

      <div className="space-y-3">
        {ejecuciones.map(e => {
          const diasRestantes = Math.ceil(
            (new Date(e.fecha_fin) - new Date()) / (1000 * 60 * 60 * 24),
          )
          const urgente = (e.estado === 'EN_CURSO' || e.estado === 'PENDIENTE') && diasRestantes <= 2

          return (
            <div
              key={e.id}
              className={`bg-white rounded-xl border p-4 cursor-pointer hover:shadow-sm transition-shadow ${
                urgente ? 'border-amber-300' : ''
              }`}
              onClick={() => navigate(`/inspector/ejecuciones/${e.id}`)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <EstadoEjecucionBadge estado={e.estado} />
                    {urgente && (
                      <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                        <AlertCircle size={12} />
                        {diasRestantes <= 0 ? 'Vence hoy' : `Vence en ${diasRestantes}d`}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-gray-800">{e.pauta?.nombre}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-medium">
                      {e.pauta?.disciplina?.nombre}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(e.fecha_inicio).toLocaleDateString('es-CL')}
                      {' — '}
                      {new Date(e.fecha_fin).toLocaleDateString('es-CL')}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400 flex gap-3 flex-wrap">
                    <span>{e.cobertura?.mios ?? 0} inspeccionados por ti</span>
                    <span>{e.cobertura?.inspeccionados ?? 0}/{e.cobertura?.total ?? 0} total del equipo</span>
                  </div>
                </div>
                <ProgresoPauta
                  inspeccionados={e.cobertura?.inspeccionados ?? 0}
                  total={e.cobertura?.total ?? 0}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
