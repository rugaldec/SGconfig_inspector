import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStats } from './hooks/useStats'
import { useArbolUbicaciones } from '../ubicaciones/hooks/useUbicaciones'
import { ESTADO_CONFIG, CRITICIDAD_CONFIG } from '../hallazgos/estadoMachine'
import ContadorEstado from './components/ContadorEstado'
import Spinner from '../../shared/components/ui/Spinner'
import { Trophy, MapPin, TrendingUp } from 'lucide-react'

const ESTADO_COLORES = {
  ABIERTO:          'bg-blue-50 border-blue-200 text-blue-800',
  EN_GESTION:       'bg-amber-50 border-amber-200 text-amber-800',
  PENDIENTE_CIERRE: 'bg-violet-50 border-violet-200 text-violet-800',
  CERRADO:          'bg-emerald-50 border-emerald-200 text-emerald-800',
  RECHAZADO:        'bg-red-50 border-red-200 text-red-800',
}

const CATEGORIA_COLORS = {
  SEGURIDAD:     { bg: 'bg-red-400',    label: 'Seguridad' },
  MANTENIMIENTO: { bg: 'bg-blue-400',   label: 'Mantenimiento' },
  OPERACIONES:   { bg: 'bg-amber-400',  label: 'Operaciones' },
}

const MEDALLA = ['🥇', '🥈', '🥉']

function BarraHorizontal({ label, count, total, color = 'bg-blue-400', sublabel }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-700 w-32 truncate" title={label}>{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-right w-16">
        <span className="text-sm font-semibold text-gray-700">{count}</span>
        {sublabel && <span className="text-xs text-gray-400 block">{sublabel}</span>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [plantaId, setPlantaId] = useState('')
  const [areaId, setAreaId] = useState('')

  const { data: arbol = [] } = useArbolUbicaciones()

  const filtros = {}
  if (areaId) filtros.area_id = areaId
  else if (plantaId) filtros.planta_id = plantaId

  const { data: stats, isLoading } = useStats(filtros)

  const plantas = arbol.filter(n => n.nivel === 1)
  const plantaSeleccionada = plantas.find(p => p.id === plantaId)
  const areas = plantaSeleccionada?.hijos?.filter(n => n.nivel === 2) ?? []
  const areaSeleccionada = areas.find(a => a.id === areaId)

  const selectCls = 'border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'

  function handlePlantaChange(e) {
    setPlantaId(e.target.value)
    setAreaId('')
  }

  const ubicacionParam = areaId || plantaId ? `&ubicacion_id=${areaId || plantaId}` : ''

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  const total = stats?.total ?? 0
  const porEstado = stats?.porEstado ?? {}
  const porCriticidad = stats?.porCriticidad ?? {}
  const porCategoria = stats?.porCategoria ?? {}
  const rankingInspectores = stats?.rankingInspectores ?? []
  const rankingAreas = stats?.rankingAreas ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select value={plantaId} onChange={handlePlantaChange} className={selectCls}>
            <option value="">Todas las plantas</option>
            {plantas.map(p => <option key={p.id} value={p.id}>{p.codigo} — {p.descripcion}</option>)}
          </select>
          {plantaId && (
            <select value={areaId} onChange={e => setAreaId(e.target.value)} className={selectCls}>
              <option value="">Todas las áreas</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.codigo} — {a.descripcion}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Contadores por estado */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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

      {/* Fila 1: Criticidad + Categoría */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Por Criticidad */}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Por Criticidad</h2>
          <div className="space-y-3">
            {Object.entries(CRITICIDAD_CONFIG).map(([key, cfg]) => {
              const count = porCriticidad[key] ?? 0
              const colorBarra = cfg.bg.replace('-100', '-400')
              return (
                <BarraHorizontal
                  key={key}
                  label={cfg.label}
                  count={count}
                  total={total}
                  color={colorBarra}
                />
              )
            })}
          </div>
        </div>

        {/* Por Categoría */}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-gray-400" /> Por Categoría
          </h2>
          <div className="space-y-3">
            {Object.entries(CATEGORIA_COLORS).map(([key, cfg]) => (
              <BarraHorizontal
                key={key}
                label={cfg.label}
                count={porCategoria[key] ?? 0}
                total={total}
                color={cfg.bg}
              />
            ))}
          </div>
          <div className="mt-4 pt-4 border-t flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-gray-800">{total}</p>
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
              className="text-sm text-blue-600 hover:underline"
            >
              Ver todos →
            </button>
          </div>
        </div>
      </div>

      {/* Fila 2: Ranking inspectores + Ranking áreas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Ranking Inspectores */}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Trophy size={16} className="text-amber-400" /> Ranking Inspectores
          </h2>
          {rankingInspectores.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {rankingInspectores.map((ins, i) => (
                <div key={ins.id} className="flex items-center gap-3">
                  <span className="text-lg w-7 text-center">{MEDALLA[i] ?? `${i + 1}.`}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{ins.nombre}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-blue-400 transition-all"
                          style={{ width: `${rankingInspectores[0]?.total > 0 ? (ins.total / rankingInspectores[0].total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-700">{ins.total}</p>
                    {ins.activos > 0 && (
                      <p className="text-xs text-amber-600">{ins.activos} activos</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ranking Áreas */}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <MapPin size={16} className="text-blue-400" /> Áreas con más Hallazgos
          </h2>
          {rankingAreas.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {rankingAreas.map((area, i) => (
                <div key={area.id} className="flex items-center gap-3">
                  <span className="text-lg w-7 text-center">{MEDALLA[i] ?? `${i + 1}.`}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate" title={area.descripcion}>
                      {area.codigo}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{area.descripcion}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-emerald-400 transition-all"
                          style={{ width: `${rankingAreas[0]?.total > 0 ? (area.total / rankingAreas[0].total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-700">{area.total}</p>
                    {area.activos > 0 && (
                      <p className="text-xs text-amber-600">{area.activos} activos</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
