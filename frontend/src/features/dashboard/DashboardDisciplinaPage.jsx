import { useNavigate } from 'react-router-dom'
import { useStatsDisciplina } from './hooks/useStatsDisciplina'
import { useAuth } from '../auth/useAuth'
import Spinner from '../../shared/components/ui/Spinner'
import {
  ClipboardCheck, AlertTriangle, CheckCircle2,
  ChevronRight, Activity,
} from 'lucide-react'

const ESTADO_CONFIG = {
  ABIERTO:          { label: 'Abierto',           color: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500'   },
  EN_GESTION:       { label: 'En Gestión',         color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  PENDIENTE_CIERRE: { label: 'Pendiente Cierre',   color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  CERRADO:          { label: 'Cerrado',            color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  RECHAZADO:        { label: 'Rechazado',          color: 'bg-red-100 text-red-700',     dot: 'bg-red-500'    },
}

const CRITICIDAD_CONFIG = {
  CRITICA: { label: 'Crítica', bar: 'bg-red-500',    text: 'text-red-700'    },
  ALTA:    { label: 'Alta',    bar: 'bg-orange-400', text: 'text-orange-700' },
  MEDIA:   { label: 'Media',   bar: 'bg-yellow-400', text: 'text-yellow-700' },
  BAJA:    { label: 'Baja',    bar: 'bg-blue-400',   text: 'text-blue-700'   },
}

function StatCard({ icon: Icon, label, value, color, subtext }) {
  return (
    <div className={`rounded-xl p-4 flex items-center gap-4 ${color}`}>
      <div className="p-2.5 bg-white/60 rounded-lg">
        <Icon size={22} />
      </div>
      <div>
        <p className="text-3xl font-bold leading-none">{value}</p>
        <p className="text-sm font-medium mt-0.5">{label}</p>
        {subtext && <p className="text-xs opacity-70 mt-0.5">{subtext}</p>}
      </div>
    </div>
  )
}

function BarraCriticidad({ label, value, max, colorBar, colorText }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs font-semibold w-14 text-right ${colorText}`}>{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${colorBar} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-6 text-right">{value}</span>
    </div>
  )
}

function BadgeEstado({ estado }) {
  if (estado === 'ATRASADA') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
        <AlertTriangle size={10} /> Atrasada
      </span>
    )
  }
  const map = { PENDIENTE: 'bg-gray-100 text-gray-600', EN_CURSO: 'bg-blue-100 text-blue-700' }
  const labelMap = { PENDIENTE: 'Pendiente', EN_CURSO: 'En Curso' }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[estado] ?? 'bg-gray-100 text-gray-600'}`}>
      {labelMap[estado] ?? estado}
    </span>
  )
}

export default function DashboardDisciplinaPage() {
  const { data, isLoading } = useStatsDisciplina()
  const { rolEfectivo } = useAuth()
  const navigate = useNavigate()

  const ejecucionPath = rolEfectivo === 'INSPECTOR'
    ? (id) => `/inspector/ejecuciones/${id}`
    : (id) => `/supervisor/ejecuciones/${id}`

  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  }

  if (!data?.disciplinas?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
        <Activity size={40} className="text-gray-300" />
        <p className="text-gray-500 font-medium">Sin disciplina asignada</p>
        <p className="text-sm text-gray-400">Un administrador debe asignarte una disciplina para ver este dashboard.</p>
      </div>
    )
  }

  const { disciplinas, inspecciones, hallazgos, ejecucionesActivas } = data
  const maxCriticidad = Math.max(0, ...Object.values(hallazgos.porCriticidad ?? {}))
  const estadosOrden = ['ABIERTO', 'EN_GESTION', 'PENDIENTE_CIERRE', 'CERRADO', 'RECHAZADO']

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-800">Dashboard de Disciplina</h1>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {disciplinas.map(d => (
            <span key={d.id} className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full font-semibold">
              {d.nombre}
            </span>
          ))}
        </div>
      </div>

      {/* Contadores de inspecciones */}
      <section>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Inspecciones</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard
            icon={ClipboardCheck}
            label="Activas"
            value={inspecciones.activas}
            color="bg-blue-50 text-blue-800"
            subtext="en curso o pendientes"
          />
          <StatCard
            icon={AlertTriangle}
            label="Atrasadas"
            value={inspecciones.atrasadas}
            color={inspecciones.atrasadas > 0 ? 'bg-red-50 text-red-800' : 'bg-gray-50 text-gray-600'}
            subtext="vencidas sin completar"
          />
          <StatCard
            icon={CheckCircle2}
            label="Completadas"
            value={inspecciones.completadas}
            color="bg-emerald-50 text-emerald-800"
            subtext="total histórico"
          />
        </div>
      </section>

      {/* Ejecuciones activas y atrasadas */}
      {ejecucionesActivas?.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
            Inspecciones en Curso
          </h2>
          <div className="bg-white rounded-xl border divide-y">
            {ejecucionesActivas.map(e => {
              const pct = e.cobertura.total > 0
                ? Math.round((e.cobertura.inspeccionados / e.cobertura.total) * 100)
                : 0
              const vence = new Date(e.fecha_fin)
              const diasRestantes = Math.ceil((vence - new Date()) / (1000 * 60 * 60 * 24))
              return (
                <button
                  key={e.id}
                  onClick={() => navigate(ejecucionPath(e.id))}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-800 truncate">{e.pauta.nombre}</p>
                      <BadgeEstado estado={e.estado} />
                    </div>
                    <div className="flex items-center gap-4 mt-1.5">
                      {/* Barra de progreso */}
                      <div className="flex items-center gap-1.5 flex-1">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {e.cobertura.inspeccionados}/{e.cobertura.total}
                        </span>
                      </div>
                      {/* Fecha */}
                      <span className={`text-xs whitespace-nowrap ${
                        e.estado === 'ATRASADA' ? 'text-red-600 font-semibold' :
                        diasRestantes <= 2 ? 'text-orange-600 font-medium' : 'text-gray-400'
                      }`}>
                        {e.estado === 'ATRASADA'
                          ? `Venció ${vence.toLocaleDateString('es-CL')}`
                          : diasRestantes === 0
                            ? 'Vence hoy'
                            : diasRestantes === 1
                              ? 'Vence mañana'
                              : `Vence ${vence.toLocaleDateString('es-CL')}`
                        }
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* Hallazgos de la disciplina */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            Hallazgos de la Disciplina
          </h2>
          <span className="text-xs text-gray-400">{hallazgos.total} total</span>
        </div>

        {hallazgos.total === 0 ? (
          <p className="text-sm text-gray-400 italic">Sin hallazgos registrados en la disciplina.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Por estado */}
            <div className="bg-white rounded-xl border p-4 space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Por Estado</p>
              {estadosOrden
                .filter(e => (hallazgos.porEstado[e] ?? 0) > 0)
                .map(e => {
                  const cfg = ESTADO_CONFIG[e] ?? { label: e, color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' }
                  const count = hallazgos.porEstado[e] ?? 0
                  const pct = hallazgos.total > 0 ? Math.round((count / hallazgos.total) * 100) : 0
                  return (
                    <div key={e} className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                      <span className="text-xs text-gray-600 flex-1">{cfg.label}</span>
                      <div className="w-24 bg-gray-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${cfg.dot}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-6 text-right">{count}</span>
                    </div>
                  )
                })}
            </div>

            {/* Por criticidad */}
            <div className="bg-white rounded-xl border p-4 space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Por Criticidad</p>
              {['CRITICA', 'ALTA', 'MEDIA', 'BAJA'].map(c => {
                const cfg = CRITICIDAD_CONFIG[c]
                const value = hallazgos.porCriticidad[c] ?? 0
                return (
                  <BarraCriticidad
                    key={c}
                    label={cfg.label}
                    value={value}
                    max={maxCriticidad}
                    colorBar={cfg.bar}
                    colorText={cfg.text}
                  />
                )
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
