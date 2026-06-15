import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStats } from './hooks/useStats'
import { useArbolUbicaciones } from '../ubicaciones/hooks/useUbicaciones'
import { ESTADO_CONFIG, CRITICIDAD_CONFIG } from '../hallazgos/estadoMachine'
import ContadorEstado from './components/ContadorEstado'
import Spinner from '../../shared/components/ui/Spinner'
import { Trophy, MapPin, TrendingUp, ClipboardCheck, Activity, AlertTriangle, CheckCircle2, BarChart2, Layers, ChevronDown, ChevronRight, Building2 } from 'lucide-react'

const ESTADO_COLORES = {
  ABIERTO:          'bg-blue-50 border-blue-200 text-blue-800',
  EN_GESTION:       'bg-amber-50 border-amber-200 text-amber-800',
  PENDIENTE_CIERRE: 'bg-violet-50 border-violet-200 text-violet-800',
  CERRADO:          'bg-emerald-50 border-emerald-200 text-emerald-800',
  RECHAZADO:        'bg-red-50 border-red-200 text-red-800',
}

const CATEGORIA_COLORS = {
  SEGURIDAD:     { bg: 'bg-red-400',   label: 'Seguridad' },
  MANTENIMIENTO: { bg: 'bg-blue-400',  label: 'Mantenimiento' },
  OPERACIONES:   { bg: 'bg-amber-400', label: 'Operaciones' },
}

const MEDALLA_STYLE = [
  'bg-amber-100 text-amber-700 border border-amber-300',
  'bg-gray-100 text-gray-600 border border-gray-300',
  'bg-orange-100 text-orange-700 border border-orange-200',
]

// ── KPI card ────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color = 'text-gray-800', onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border p-4 flex items-start gap-3 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${color}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ── Gráfico barras diarias ──────────────────────────────────────────────────
function GraficoBarrasDiarias({ datos = [] }) {
  const W = 600, H = 120
  const PAD_L = 28, PAD_R = 8, PAD_T = 10, PAD_B = 28
  const maxVal = Math.max(...datos.map(d => d.total), 1)
  const barW = (W - PAD_L - PAD_R) / datos.length
  const alturaMax = H - PAD_T - PAD_B

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 140 }}>
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
      {datos.map((d, i) => {
        const x = PAD_L + i * barW
        const h = d.total > 0 ? Math.max((d.total / maxVal) * alturaMax, 3) : 0
        const y = PAD_T + alturaMax - h
        const esMesInicio = d.dia.endsWith('-01')
        const isHoy = i === datos.length - 1
        return (
          <g key={d.dia}>
            <rect x={x + barW * 0.15} y={y} width={barW * 0.7} height={h} rx="2"
              fill={isHoy ? '#3b82f6' : '#93c5fd'} opacity={d.total === 0 ? 0.3 : 1} />
            {d.total > 0 && (
              <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize="8" fill="#6b7280">{d.total}</text>
            )}
            {(i % 5 === 0 || esMesInicio || isHoy) && (
              <text x={x + barW / 2} y={H - 4} textAnchor="middle" fontSize="8"
                fill={isHoy ? '#3b82f6' : '#9ca3af'} fontWeight={isHoy ? 'bold' : 'normal'}>
                {isHoy ? 'hoy' : d.dia.slice(5)}
              </text>
            )}
          </g>
        )
      })}
      <line x1={PAD_L} y1={PAD_T + alturaMax} x2={W - PAD_R} y2={PAD_T + alturaMax} stroke="#e5e7eb" strokeWidth="1" />
    </svg>
  )
}

// ── Barra horizontal ────────────────────────────────────────────────────────
function BarraHorizontal({ label, count, total, color = 'bg-blue-400' }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-700 w-32 truncate" title={label}>{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold text-gray-700 w-8 text-right">{count}</span>
    </div>
  )
}

// ── Fila ranking ────────────────────────────────────────────────────────────
function FilaRanking({ item, idx, maxTotal, barColor }) {
  const pct = maxTotal > 0 ? (item.total / maxTotal) * 100 : 0
  const medallaStyle = MEDALLA_STYLE[idx] ?? 'bg-gray-50 text-gray-500 border border-gray-200'
  return (
    <div className="flex items-center gap-3">
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${medallaStyle}`}>
        {idx + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate" title={item.nombre ?? item.descripcion}>
          {item.nombre ?? item.codigo}
        </p>
        {item.descripcion && (
          <p className="text-xs text-gray-400 truncate">{item.descripcion}</p>
        )}
        <div className="flex-1 bg-gray-100 rounded-full h-1.5 mt-1">
          <div className={`h-1.5 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-gray-700">{item.total}</p>
        {item.activos > 0 && <p className="text-xs text-amber-600">{item.activos} activos</p>}
      </div>
    </div>
  )
}

// ── Resumen ubicaciones ─────────────────────────────────────────────────────
function BaraUbi({ activos, total, color }) {
  const pct = total > 0 ? Math.round((activos / total) * 100) : 0
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400 w-8 text-right flex-shrink-0">{pct}%</span>
    </div>
  )
}

function ResumenUbicaciones({ datos = [], navigate, ubicacionParam }) {
  const [abiertos, setAbiertos] = useState({})
  const totalGlobal = datos.reduce((s, p) => s + p.total, 0)

  function toggle(id) {
    setAbiertos(prev => ({ ...prev, [id]: !prev[id] }))
  }

  if (!datos.length) return (
    <div className="text-center py-8 text-gray-400">
      <Building2 size={32} className="mx-auto mb-2 text-gray-200" />
      <p className="text-sm">Sin datos de ubicaciones</p>
    </div>
  )

  return (
    <div className="space-y-2">
      {datos.map(planta => {
        const abierto = abiertos[planta.id]
        const pctActivos = planta.total > 0 ? Math.round((planta.activos / planta.total) * 100) : 0
        const pctPlanta  = totalGlobal > 0 ? Math.round((planta.total / totalGlobal) * 100) : 0

        return (
          <div key={planta.id} className="border border-gray-100 rounded-xl overflow-hidden">
            {/* Fila planta (nivel 1) */}
            <button
              onClick={() => toggle(planta.id)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
              {abierto ? <ChevronDown size={14} className="text-gray-400 flex-shrink-0" /> : <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{planta.codigo}</span>
                  <span className="text-sm font-semibold text-gray-800 truncate">{planta.descripcion}</span>
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <BaraUbi activos={planta.activos} total={planta.total} color="bg-blue-400" />
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-lg font-bold text-gray-800">{planta.total}</p>
                <p className="text-xs text-gray-400">{pctPlanta}% del total</p>
              </div>
              {planta.activos > 0 && (
                <span className="flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  {planta.activos} activos
                </span>
              )}
            </button>

            {/* Áreas (nivel 2) */}
            {abierto && (
              <div className="divide-y divide-gray-50">
                {planta.areas.map(area => {
                  const areaKey = `${planta.id}-${area.id}`
                  const areaAbierta = abiertos[areaKey]
                  return (
                    <div key={area.id}>
                      <button
                        onClick={() => toggle(areaKey)}
                        className="w-full flex items-center gap-3 px-6 py-2.5 hover:bg-gray-50 transition-colors text-left"
                      >
                        {areaAbierta ? <ChevronDown size={13} className="text-gray-300 flex-shrink-0" /> : <ChevronRight size={13} className="text-gray-300 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 font-medium">{area.codigo}</span>
                            <span className="text-sm text-gray-700 truncate">{area.descripcion}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <BaraUbi activos={area.activos} total={area.total} color="bg-indigo-300" />
                          </div>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-3">
                          {area.activos > 0 && (
                            <span className="text-xs text-amber-600 font-medium">{area.activos} activos</span>
                          )}
                          <span className="text-sm font-bold text-gray-700 w-6 text-right">{area.total}</span>
                        </div>
                      </button>

                      {/* Activos nivel 3 */}
                      {areaAbierta && (
                        <div className="bg-gray-50 border-t border-gray-100">
                          {area.activosN3.map(activo => (
                            <div
                              key={activo.id}
                              className="flex items-center gap-3 px-10 py-2 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-white transition-colors"
                              onClick={() => navigate(`/supervisor/hallazgos?ubicacion_id=${activo.id}${ubicacionParam ? '&' + ubicacionParam.slice(1) : ''}`)}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400">{activo.codigo}</span>
                                  <span className="text-xs text-gray-600 truncate">{activo.descripcion}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                {activo.activos > 0 && (
                                  <span className="text-xs text-amber-600">{activo.activos} activos</span>
                                )}
                                <span className="text-xs font-bold text-gray-600 w-5 text-right">{activo.total}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Dashboard principal ─────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate()
  const [plantaId, setPlantaId] = useState('')
  const [areaId, setAreaId]     = useState('')

  const { data: arbol = [] } = useArbolUbicaciones()
  const filtros = {}
  if (areaId) filtros.area_id = areaId
  else if (plantaId) filtros.planta_id = plantaId

  const { data: stats, isLoading } = useStats(filtros)

  const plantas = arbol.filter(n => n.nivel === 1)
  const plantaSeleccionada = plantas.find(p => p.id === plantaId)
  const areas = plantaSeleccionada?.hijos?.filter(n => n.nivel === 2) ?? []

  const selectCls = 'border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'

  function handlePlantaChange(e) { setPlantaId(e.target.value); setAreaId('') }

  const ubicacionParam = areaId || plantaId ? `&ubicacion_id=${areaId || plantaId}` : ''

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  const total           = stats?.total ?? 0
  const porEstado       = stats?.porEstado ?? {}
  const porCriticidad   = stats?.porCriticidad ?? {}
  const porCategoria    = stats?.porCategoria ?? {}
  const rankingInspectores   = stats?.rankingInspectores ?? []
  const rankingAreas         = stats?.rankingAreas ?? []
  const areasConInspecciones  = stats?.areasConInspecciones ?? []
  const resumenUbicaciones    = stats?.resumenUbicaciones ?? []
  const hallazgosPorDia      = stats?.hallazgosPorDia ?? []

  // KPIs calculados
  const activos        = (porEstado.ABIERTO ?? 0) + (porEstado.EN_GESTION ?? 0) + (porEstado.PENDIENTE_CIERRE ?? 0)
  const criticos       = porCriticidad.CRITICA ?? 0
  const cerrados       = porEstado.CERRADO ?? 0
  const tasaCierre     = total > 0 ? Math.round((cerrados / total) * 100) : 0
  const totalUltimos30 = hallazgosPorDia.reduce((s, d) => s + d.total, 0)

  return (
    <div className="space-y-5">

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

      {/* KPIs ejecutivos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={<Layers size={18} className="text-blue-500" />}
          label="Hallazgos activos"
          value={activos}
          sub={`de ${total} totales`}
          color="text-blue-700"
          onClick={() => navigate(`/supervisor/hallazgos?estado=ABIERTO${ubicacionParam}`)}
        />
        <KpiCard
          icon={<AlertTriangle size={18} className="text-red-500" />}
          label="Críticos"
          value={criticos}
          sub="criticidad CRÍTICA"
          color={criticos > 0 ? 'text-red-600' : 'text-gray-800'}
        />
        <KpiCard
          icon={<CheckCircle2 size={18} className="text-emerald-500" />}
          label="Cerrados"
          value={cerrados}
          sub="en total"
          color="text-emerald-700"
        />
        <KpiCard
          icon={<BarChart2 size={18} className="text-indigo-500" />}
          label="Tasa de cierre"
          value={`${tasaCierre}%`}
          sub={`${totalUltimos30} nuevos (30d)`}
          color={tasaCierre >= 70 ? 'text-emerald-700' : tasaCierre >= 40 ? 'text-amber-600' : 'text-red-600'}
        />
      </div>

      {/* Contadores por estado (clickeables) */}
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

      {/* Gráfico: Hallazgos por día */}
      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <Activity size={16} className="text-blue-400" /> Actividad diaria
            <span className="text-xs text-gray-400 font-normal">(últimos 30 días)</span>
          </h2>
          {totalUltimos30 > 0 && (
            <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {totalUltimos30} hallazgos en el período
            </span>
          )}
        </div>
        {hallazgosPorDia.length > 0
          ? <GraficoBarrasDiarias datos={hallazgosPorDia} />
          : <p className="text-sm text-gray-400 text-center py-6">Sin actividad en los últimos 30 días</p>
        }
      </div>

      {/* Criticidad + Categoría */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Por Criticidad</h2>
          <div className="space-y-3">
            {Object.entries(CRITICIDAD_CONFIG).map(([key, cfg]) => (
              <BarraHorizontal
                key={key}
                label={cfg.label}
                count={porCriticidad[key] ?? 0}
                total={total}
                color={cfg.bg.replace('-100', '-400')}
              />
            ))}
          </div>
        </div>

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
          <div className="mt-4 pt-4 border-t flex justify-end">
            <button
              onClick={() => navigate(`/supervisor/hallazgos${ubicacionParam ? '?' + ubicacionParam.slice(1) : ''}`)}
              className="text-sm text-blue-600 hover:underline"
            >
              Ver todos los hallazgos →
            </button>
          </div>
        </div>
      </div>

      {/* Ranking inspectores + Ranking áreas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Trophy size={16} className="text-amber-400" /> Top Inspectores
          </h2>
          {rankingInspectores.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Sin datos de inspectores</p>
          ) : (
            <div className="space-y-3">
              {rankingInspectores.map((ins, i) => (
                <FilaRanking key={ins.id} item={ins} idx={i} maxTotal={rankingInspectores[0]?.total ?? 1} barColor="bg-blue-400" />
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <MapPin size={16} className="text-blue-400" /> Áreas con más Hallazgos
          </h2>
          {rankingAreas.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Sin datos de áreas</p>
          ) : (
            <div className="space-y-3">
              {rankingAreas.map((area, i) => (
                <FilaRanking key={area.id} item={area} idx={i} maxTotal={rankingAreas[0]?.total ?? 1} barColor="bg-emerald-400" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resumen por Ubicaciones Técnicas */}
      <div className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Building2 size={16} className="text-gray-400" /> Resumen por Ubicación Técnica
          <span className="text-xs text-gray-400 font-normal">Planta → Área → Activo</span>
        </h2>
        <ResumenUbicaciones datos={resumenUbicaciones} navigate={navigate} ubicacionParam={ubicacionParam} />
      </div>

      {/* Cobertura de inspecciones */}
      <div className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <ClipboardCheck size={16} className="text-indigo-400" /> Cobertura de Inspecciones por Área
        </h2>
        {areasConInspecciones.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <ClipboardCheck size={32} className="mx-auto mb-2 text-gray-200" />
            <p className="text-sm">No hay rutas de inspección activas o completadas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {areasConInspecciones.map(area => {
              const coberturaPct = area.items_total > 0
                ? Math.round((area.items_insp / area.items_total) * 100)
                : 0
              const colorBarra = coberturaPct >= 80 ? 'bg-emerald-400' : coberturaPct >= 50 ? 'bg-amber-400' : 'bg-red-400'
              return (
                <div key={area.id} className="border border-gray-100 rounded-xl p-3 space-y-2.5">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 truncate" title={area.descripcion}>
                      {area.codigo}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{area.descripcion}</p>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
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
                        <span className={`font-semibold ${coberturaPct >= 80 ? 'text-emerald-600' : coberturaPct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                          {coberturaPct}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${colorBarra}`} style={{ width: `${coberturaPct}%` }} />
                      </div>
                      <p className="text-xs text-gray-400">{area.items_insp} / {area.items_total} ítems</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
