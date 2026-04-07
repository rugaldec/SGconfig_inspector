import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHallazgos } from '../hallazgos/hooks/useHallazgos'
import { useArbolUbicaciones } from '../ubicaciones/hooks/useUbicaciones'
import { ESTADO_CONFIG, CRITICIDAD_CONFIG } from '../hallazgos/estadoMachine'
import ContadorEstado from './components/ContadorEstado'
import Spinner from '../../shared/components/ui/Spinner'

const ESTADO_COLORES = {
  ABIERTO:          'bg-blue-50 border-blue-200 text-blue-800',
  EN_GESTION:       'bg-amber-50 border-amber-200 text-amber-800',
  PENDIENTE_CIERRE: 'bg-violet-50 border-violet-200 text-violet-800',
  CERRADO:          'bg-emerald-50 border-emerald-200 text-emerald-800',
  RECHAZADO:        'bg-red-50 border-red-200 text-red-800',
}

// Recoge todos los IDs de un nodo y sus descendientes
function recogerIds(nodo) {
  const ids = [nodo.id]
  if (nodo.hijos?.length) {
    for (const hijo of nodo.hijos) ids.push(...recogerIds(hijo))
  }
  return ids
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [plantaId, setPlantaId] = useState('')
  const [areaId, setAreaId] = useState('')

  const { data, isLoading } = useHallazgos({ limit: 500 })
  const { data: arbol = [] } = useArbolUbicaciones()

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  const todosLosHallazgos = data?.data ?? []

  // Plantar = nivel 1, Áreas = nivel 2 hijos de la planta seleccionada
  const plantas = arbol.filter(n => n.nivel === 1)
  const plantaSeleccionada = plantas.find(p => p.id === plantaId)
  const areas = plantaSeleccionada?.hijos?.filter(n => n.nivel === 2) ?? []
  const areaSeleccionada = areas.find(a => a.id === areaId)

  // Filtrar hallazgos según el alcance seleccionado
  let hallazgos = todosLosHallazgos
  if (areaId && areaSeleccionada) {
    const ids = new Set(recogerIds(areaSeleccionada))
    hallazgos = todosLosHallazgos.filter(h => ids.has(h.ubicacion_tecnica_id))
  } else if (plantaId && plantaSeleccionada) {
    const ids = new Set(recogerIds(plantaSeleccionada))
    hallazgos = todosLosHallazgos.filter(h => ids.has(h.ubicacion_tecnica_id))
  }

  const total = hallazgos.length
  const porEstado = Object.fromEntries(
    Object.keys(ESTADO_CONFIG).map((k) => [k, hallazgos.filter((h) => h.estado === k).length])
  )
  const porCriticidad = Object.fromEntries(
    Object.keys(CRITICIDAD_CONFIG).map((k) => [k, hallazgos.filter((h) => h.criticidad === k).length])
  )

  // Parámetro de ubicación para navegar a hallazgos filtrados
  const ubicacionParam = areaId || plantaId
    ? `&ubicacion_id=${areaId || plantaId}`
    : ''

  function handlePlantaChange(e) {
    setPlantaId(e.target.value)
    setAreaId('')
  }

  const selectCls = 'border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>

        {/* Filtro de alcance */}
        <div className="flex flex-wrap items-center gap-2">
          <select value={plantaId} onChange={handlePlantaChange} className={selectCls}>
            <option value="">Todas las plantas</option>
            {plantas.map(p => (
              <option key={p.id} value={p.id}>{p.codigo} — {p.descripcion}</option>
            ))}
          </select>

          {plantaId && (
            <select value={areaId} onChange={e => setAreaId(e.target.value)} className={selectCls}>
              <option value="">Todas las áreas</option>
              {areas.map(a => (
                <option key={a.id} value={a.id}>{a.codigo} — {a.descripcion}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Contadores por estado */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {Object.entries(ESTADO_CONFIG).map(([key, cfg]) => (
          <ContadorEstado
            key={key}
            label={cfg.label}
            count={porEstado[key] ?? 0}
            color={ESTADO_COLORES[key]}
            onClick={() => navigate(`/supervisor/hallazgos?estado=${key}${ubicacionParam}`)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Barra de criticidad */}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Por Criticidad</h2>
          <div className="space-y-3">
            {Object.entries(CRITICIDAD_CONFIG).map(([key, cfg]) => {
              const count = porCriticidad[key] ?? 0
              const pct = total > 0 ? (count / total) * 100 : 0
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className={`text-sm font-medium w-16 ${cfg.text}`}>{cfg.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${cfg.bg.replace('bg-', 'bg-').replace('-100', '-400')}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-6 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Resumen */}
        <div className="bg-white rounded-xl border p-5 flex flex-col justify-between">
          <div>
            <h2 className="font-semibold text-gray-700 mb-2">Resumen General</h2>
            <p className="text-5xl font-bold text-gray-800">{total}</p>
            <p className="text-sm text-gray-500 mt-1">
              {areaSeleccionada
                ? `Hallazgos en ${areaSeleccionada.descripcion}`
                : plantaSeleccionada
                  ? `Hallazgos en ${plantaSeleccionada.descripcion}`
                  : 'Hallazgos totales en el sistema'}
            </p>
          </div>
          <button
            onClick={() => navigate(`/supervisor/hallazgos${ubicacionParam ? '?' + ubicacionParam.slice(1) : ''}`)}
            className="mt-4 text-sm text-blue-600 hover:text-blue-800 hover:underline text-left"
          >
            Ver todos los hallazgos →
          </button>
        </div>
      </div>
    </div>
  )
}
