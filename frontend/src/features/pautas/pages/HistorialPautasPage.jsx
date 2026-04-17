import { useNavigate } from 'react-router-dom'
import { BookOpen, CheckCircle2, AlertTriangle, Clock, ChevronRight, Wrench, Search } from 'lucide-react'

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500',  'bg-cyan-500',  'bg-indigo-500',  'bg-teal-500',
]

function Avatar({ nombre, size = 'sm' }) {
  const initials = nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
  const colorIdx = nombre.charCodeAt(0) % AVATAR_COLORS.length
  const sizeClass = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs'
  return (
    <span className={`${AVATAR_COLORS[colorIdx]} ${sizeClass} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </span>
  )
}
import { useState, useMemo } from 'react'
import { useEjecucionesHistorial } from '../hooks/usePautas'
import { useAuth } from '../../auth/useAuth'
import EstadoEjecucionBadge from '../components/EstadoEjecucionBadge'
import Spinner from '../../../shared/components/ui/Spinner'

function TarjetaHistorial({ e, onClick }) {
  const completada = e.estado === 'COMPLETADA'
  const vencida    = e.estado === 'VENCIDA'
  const pct        = e.cobertura?.total > 0
    ? Math.round((e.cobertura.inspeccionados / e.cobertura.total) * 100)
    : 0

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border cursor-pointer hover:shadow-md transition-all active:scale-[0.99] overflow-hidden ${
        completada ? 'border-emerald-200' : vencida ? 'border-red-200' : 'border-gray-200'
      }`}
    >
      {/* Barra superior de color */}
      <div className={`h-1 w-full ${completada ? 'bg-emerald-500' : vencida ? 'bg-red-400' : 'bg-gray-300'}`} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Nombre + badges */}
            <p className="font-semibold text-gray-800 leading-tight">{e.pauta?.nombre}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <Wrench size={10} /> {e.pauta?.disciplina?.nombre}
              </span>
              <EstadoEjecucionBadge estado={e.estado} />
            </div>

            {/* Período */}
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-2">
              <Clock size={11} />
              <span>
                {new Date(e.fecha_inicio).toLocaleDateString('es-CL')}
                {' — '}
                {new Date(e.fecha_fin).toLocaleDateString('es-CL')}
              </span>
            </div>
          </div>

          {/* Métrica */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className={`text-2xl font-bold ${completada ? 'text-emerald-600' : vencida ? 'text-red-500' : 'text-gray-500'}`}>
              {pct}%
            </span>
            <span className="text-xs text-gray-400">{e.cobertura?.inspeccionados}/{e.cobertura?.total} ítems</span>
          </div>
        </div>

        {/* Inspectores */}
        {e.inspectores?.length > 0 && (
          <div className="mt-3 pt-3 border-t space-y-2">
            {e.inspectores.map(ins => (
              <div key={ins.id} className="flex items-center gap-2">
                <Avatar nombre={ins.nombre} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-gray-700">{ins.nombre}</span>
                    <span className="text-xs text-gray-400">{ins.count} ítem{ins.count !== 1 ? 's' : ''}</span>
                  </div>
                  {ins.primera && (
                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Clock size={9} />
                      {new Date(ins.primera).toLocaleDateString('es-CL')}
                      {ins.primera !== ins.ultima && (
                        <> — {new Date(ins.ultima).toLocaleDateString('es-CL')}</>
                      )}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Fotos de la inspección */}
        {e.fotos?.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex gap-1.5 flex-wrap">
              {e.fotos.slice(0, 8).map((foto, idx) => (
                <div key={idx} className="relative group flex-shrink-0">
                  <a
                    href={foto.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={ev => ev.stopPropagation()}
                    className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 hover:opacity-90 hover:scale-105 transition-all block"
                  >
                    <img
                      src={foto.url}
                      alt={`foto ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </a>
                  {foto.observacion && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10
                      hidden group-hover:block w-48 bg-gray-900 text-white text-xs rounded-lg
                      px-2.5 py-2 shadow-lg pointer-events-none leading-snug">
                      {foto.observacion}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                    </div>
                  )}
                </div>
              ))}
              {e.fotos.length > 8 && (
                <div className="w-14 h-14 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-xs text-gray-400 font-medium flex-shrink-0">
                  +{e.fotos.length - 8}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resumen pie */}
        <div className="mt-3 pt-3 border-t flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            {completada ? (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <CheckCircle2 size={13} /> Inspección realizada
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-red-500 font-medium">
                <AlertTriangle size={13} /> Ronda vencida
              </span>
            )}
            {e.cobertura?.hallazgos > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-600">
                <AlertTriangle size={11} />
                {e.cobertura.hallazgos} hallazgo{e.cobertura.hallazgos !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <span className="flex items-center gap-1 text-xs text-blue-500 font-medium">
            Ver reporte <ChevronRight size={13} />
          </span>
        </div>
      </div>
    </div>
  )
}

export default function HistorialPautasPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: ejecuciones, isLoading } = useEjecucionesHistorial()
  const [busqueda, setBusqueda] = useState('')
  const [inspectorFiltro, setInspectorFiltro] = useState('')

  const esInspector = user?.rol === 'INSPECTOR'
  const rutaReporte = (id) =>
    esInspector ? `/inspector/historial-pautas/${id}` : `/admin/historial-pautas/${id}`

  // Extraer lista única de inspectores de todas las ejecuciones
  const inspectoresUnicos = useMemo(() => {
    const map = new Map()
    ;(ejecuciones ?? []).forEach(e => {
      e.inspectores?.forEach(ins => {
        if (!map.has(ins.id)) map.set(ins.id, ins.nombre)
      })
    })
    return Array.from(map, ([id, nombre]) => ({ id, nombre })).sort((a, b) =>
      a.nombre.localeCompare(b.nombre)
    )
  }, [ejecuciones])

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  const lista = (ejecuciones ?? []).filter(e => {
    // Filtro por texto
    if (busqueda) {
      const q = busqueda.toLowerCase()
      if (
        !e.pauta?.nombre?.toLowerCase().includes(q) &&
        !e.pauta?.disciplina?.nombre?.toLowerCase().includes(q)
      ) return false
    }
    // Filtro por inspector
    if (inspectorFiltro) {
      if (!e.inspectores?.some(ins => ins.id === inspectorFiltro)) return false
    }
    return true
  })

  const completadas = lista.filter(e => e.estado === 'COMPLETADA')
  const vencidas    = lista.filter(e => e.estado === 'VENCIDA')

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <BookOpen size={20} className="text-blue-600" />
        <h1 className="text-xl font-bold text-gray-800">Historial de Pautas</h1>
      </div>

      {/* Filtros */}
      {(ejecuciones?.length ?? 0) > 0 && (
        <div className="flex gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por pauta o disciplina..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          {inspectoresUnicos.length > 1 && (
            <select
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={inspectorFiltro}
              onChange={e => setInspectorFiltro(e.target.value)}
            >
              <option value="">Todos los inspectores</option>
              {inspectoresUnicos.map(ins => (
                <option key={ins.id} value={ins.id}>{ins.nombre}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {lista.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <BookOpen size={32} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium">
            {busqueda ? 'Sin resultados para esa búsqueda' : 'No hay pautas finalizadas aún'}
          </p>
          <p className="text-xs text-gray-300">Las rondas completadas o vencidas aparecerán aquí</p>
        </div>
      ) : (
        <div className="space-y-6">
          {completadas.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Completadas · {completadas.length} ronda{completadas.length !== 1 ? 's' : ''}
              </p>
              <div className="space-y-3">
                {completadas.map(e => (
                  <TarjetaHistorial key={e.id} e={e} onClick={() => navigate(rutaReporte(e.id))} />
                ))}
              </div>
            </div>
          )}

          {vencidas.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Vencidas · {vencidas.length} ronda{vencidas.length !== 1 ? 's' : ''}
              </p>
              <div className="space-y-3">
                {vencidas.map(e => (
                  <TarjetaHistorial key={e.id} e={e} onClick={() => navigate(rutaReporte(e.id))} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
