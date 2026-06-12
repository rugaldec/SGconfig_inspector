import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStats } from './hooks/useStats'
import { useArbolUbicaciones } from '../ubicaciones/hooks/useUbicaciones'
import { ESTADO_CONFIG, CRITICIDAD_CONFIG } from '../hallazgos/estadoMachine'
import ContadorEstado from './components/ContadorEstado'
import Spinner from '../../shared/components/ui/Spinner'
import { Trophy, MapPin, TrendingUp, ClipboardCheck, Activity } from 'lucide-react'

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

function GraficoBarrasDiarias({ datos = [] }) {
  const W = 600
  const H = 120
  const PAD_L = 28
  const PAD_R = 8
  const PAD_T = 10
  const PAD_B = 28
  const maxVal = Math.max(...datos.map(d => d.total), 1)
  const barW = (W - PAD_L - PAD_R) / datos.length
  const alturaMax = H - PAD_T - PAD_B

  // Mostrar solo cada 5 días en el eje X para no saturar
  const labelCada = 5

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 140 }}>
      {/* Líneas guía horizontales */}
      {[0.25, 0.5, 0.75, 1].map(pct => {
        const y = PAD_T + alturaMax * (1 - pct)
        return (
          <g key={pct}>
            <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="#f0f0f0" strokeWidth="1" />
            <text x={PAD_L - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#aaa">
              {Math.round(maxVal * pct)}
            </text>
          </g>
        )
      })}

      {/* Barras */}
      {datos.map((d, i) => {
        const x = PAD_L + i * barW
        const h = d.total > 0 ? Math.max((d.total / maxVal) * alturaMax, 3) : 0
        const y = PAD_T + alturaMax - h
        const esMesInicio = d.dia.endsWith('-01')
        const isHoy = i === datos.length - 1

        return (
          <g key={d.dia}>
            <rect
              x={x + barW * 0.15}
              y={y}
              width={barW * 0.7}
              height={h}
              rx="2"
              fill={isHoy ? '#3b82f6' : '#93c5fd'}
              opacity={d.total === 0 ? 0.3 : 1}
            />
            {/* Valor encima de la barra si > 0 */}
            {d.total > 0 && (
              <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize="8" fill="#6b7280">
                {d.total}
              </text>
            )}
            {/* Etiqueta del eje X cada 5 días o primer día del mes */}
            {(i % labelCada === 0 || esMesInicio || isHoy) && (
              <text
                x={x + barW / 2}
                y={H - 4}
                textAnchor="middle"
                fontSize="8"
                fill={isHoy ? '#3b82f6' : '#9ca3af'}
                fontWeight={isHoy ? 'bold' : 'normal'}
              >
                {isHoy ? 'hoy' : d.dia.slice(5)} {/* MM-DD */}
              </text>
            )}
          </g>
        )
      })}

      {/* Eje base */}
      <line x1={PAD_L} y1={PAD_T + alturaMax} x2={W - PAD_R} y2={PAD_T + alturaMax} stroke="#e5e7eb" strokeWidth="1" />
    </svg>
  )
}

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
  const areasConInspecciones = stats?.areasConInspecciones ?? []
  const hallazgosPorDia = stats?.hallazgosPorDia ?? []
  const totalUltimos30 = hallazgosPorDia.reduce((s, d) => s + d.total, 0)

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

      {/* Gráfico: Hallazgos por día (últimos 30 días) */}
      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <Activity size={16} className="text-blue-400" /> Hallazgos por Día
            <span className="text-xs text-gray-400 font-normal">(últimos 30 días)</span>
          </h2>
          {totalUltimos30 > 0 && (
            <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {totalUltimos30} en el período
            </span>
          )}
        </div>
        {hallazgosPorDia.length > 0
          ? <GraficoBarrasDiarias datos={hallazgosPorDia} />
          : <p className="text-sm text-gray-400 text-center py-6">Sin datos para el período</p>
        }
      </div>

      {/* Fila 3: Áreas con Inspecciones */}
      {areasConInspecciones.length > 0 && (
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <ClipboardCheck size={16} className="text-indigo-400" /> Áreas con Inspecciones
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {areasConInspecciones.map(area => {
              const coberturaPct = area.items_total > 0
                ? Math.round((area.items_insp / area.items_total) * 100)
                : 0
              return (
                <div key={area.id} className="border border-gray-100 rounded-xl p-3 space-y-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 truncate" title={area.descripcion}>
                      {area.codigo}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{area.descripcion}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {area.activas > 0 && (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        {area.activas} activa{area.activas !== 1 ? 's' : ''}
                      </span>
                    )}
                    {area.completadas > 0 && (
                      <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                        {area.completadas} completada{area.completadas !== 1 ? 's' : ''}
                      </span>
                    )}
                    {area.vencidas > 0 && (
                      <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
                        {area.vencidas} vencida{area.vencidas !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {area.items_total > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Cobertura ítems</span>
                        <span className="font-medium">{coberturaPct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-400 rounded-full transition-all"
                          style={{ width: `${coberturaPct}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400">{area.items_insp}/{area.items_total} ítems inspeccionados</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
