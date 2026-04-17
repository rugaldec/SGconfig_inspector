import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Navigation, AlertCircle, CheckCircle2, Clock, ChevronRight,
  Wrench, RefreshCw, List, CalendarDays, CalendarRange,
  ChevronLeft,
} from 'lucide-react'
import { useEjecucionesActivas } from '../hooks/usePautas'
import { useAuth } from '../../auth/useAuth'
import EstadoEjecucionBadge from '../components/EstadoEjecucionBadge'
import Spinner from '../../../shared/components/ui/Spinner'

// ── Helpers ──────────────────────────────────────────────────────────────────

const DIAS_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate()
}

function ejecucionEnDia(e, dia) {
  const inicio = new Date(e.fecha_inicio)
  const fin    = new Date(e.fecha_fin)
  inicio.setHours(0, 0, 0, 0)
  fin.setHours(23, 59, 59, 999)
  return dia >= inicio && dia <= fin
}

function colorEstado(estado) {
  if (estado === 'COMPLETADA') return 'bg-emerald-500'
  if (estado === 'VENCIDA')    return 'bg-red-500'
  return 'bg-blue-500'
}

function inicioSemana(date) {
  const d = new Date(date)
  const dia = d.getDay() === 0 ? 6 : d.getDay() - 1 // lunes = 0
  d.setDate(d.getDate() - dia)
  d.setHours(0, 0, 0, 0)
  return d
}

function agruparPorSemana(ejecuciones) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const lunesActual = inicioSemana(hoy)

  const semanas = [
    { label: 'Esta semana',    items: [] },
    { label: 'Próxima semana', items: [] },
    { label: 'Sem +2',         items: [] },
    { label: 'Más adelante',   items: [] },
  ]

  ejecuciones.forEach(e => {
    const fin = new Date(e.fecha_fin)
    fin.setHours(0, 0, 0, 0)
    const inicio = new Date(e.fecha_inicio)
    inicio.setHours(0, 0, 0, 0)

    // Usar la fecha más relevante: si ya empezó, fecha_fin; si no, fecha_inicio
    const ref = inicio <= hoy ? fin : inicio

    const lunesRef = inicioSemana(ref)
    const diff = Math.round((lunesRef - lunesActual) / (1000 * 60 * 60 * 24 * 7))

    if (diff <= 0)      semanas[0].items.push(e)
    else if (diff === 1) semanas[1].items.push(e)
    else if (diff === 2) semanas[2].items.push(e)
    else                 semanas[3].items.push(e)
  })

  return semanas.filter(s => s.items.length > 0)
}

// ── Barra de progreso ─────────────────────────────────────────────────────────

function BarraProgreso({ inspeccionados, mios, total }) {
  const pct    = total > 0 ? Math.round((inspeccionados / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{inspeccionados}/{total} completados</span>
        <span className="font-medium text-blue-600">{pct}%</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-200 rounded-full relative" style={{ width: `${pct}%` }}>
          <div
            className="h-full bg-blue-600 rounded-full absolute left-0 top-0"
            style={{ width: `${pct > 0 ? Math.round((mios / inspeccionados) * 100) : 0}%` }}
          />
        </div>
      </div>
      <p className="text-xs text-blue-500">{mios} inspeccionados por ti</p>
    </div>
  )
}

// ── Tarjeta de ejecución (vista lista) ───────────────────────────────────────

function TarjetaEjecucion({ e, onClick }) {
  const ahora         = new Date()
  const diasRestantes = Math.ceil((new Date(e.fecha_fin) - ahora) / (1000 * 60 * 60 * 24))
  const vencida       = e.estado === 'VENCIDA'
  const completada    = e.estado === 'COMPLETADA'
  const urgente       = !vencida && !completada && diasRestantes <= 2

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border cursor-pointer hover:shadow-md transition-all active:scale-[0.99] overflow-hidden ${
        vencida    ? 'border-red-200'     :
        urgente    ? 'border-amber-300'   :
        completada ? 'border-emerald-200' :
        'border-gray-200'
      }`}
    >
      <div className={`h-1 w-full ${
        completada ? 'bg-emerald-400' :
        vencida    ? 'bg-red-400'     :
        urgente    ? 'bg-amber-400'   :
        'bg-blue-500'
      }`} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          {e.pauta?.foto_url && (
            <img
              src={e.pauta.foto_url}
              alt=""
              className="w-12 h-12 rounded-xl object-cover border border-gray-100 flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 leading-tight truncate">{e.pauta?.nombre}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <Wrench size={10} /> {e.pauta?.disciplina?.nombre}
              </span>
              <EstadoEjecucionBadge estado={e.estado} />
              {e.relanzamiento_auto && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <RefreshCw size={9} />
                  {e.max_ejecuciones ? `Ronda ${e.numero_ronda}/${e.max_ejecuciones}` : `Ronda ${e.numero_ronda}`}
                </span>
              )}
              {e.origen === 'AUTO' && (
                <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">Auto</span>
              )}
            </div>
          </div>
          <ChevronRight size={18} className="text-gray-300 flex-shrink-0 mt-0.5" />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
          <Clock size={12} />
          <span>
            {new Date(e.fecha_inicio).toLocaleDateString('es-CL')}
            {' — '}
            {new Date(e.fecha_fin).toLocaleDateString('es-CL')}
          </span>
          {urgente && (
            <span className="flex items-center gap-1 text-amber-600 font-medium ml-1">
              <AlertCircle size={12} />
              {diasRestantes <= 0 ? 'Vence hoy' : `${diasRestantes}d restante${diasRestantes !== 1 ? 's' : ''}`}
            </span>
          )}
          {vencida && <span className="text-red-500 font-medium ml-1">Vencida</span>}
        </div>
        {completada ? (
          <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
            <CheckCircle2 size={16} />
            Ronda completada — {e.cobertura?.total ?? 0} componentes inspeccionados
          </div>
        ) : (
          <BarraProgreso
            inspeccionados={e.cobertura?.inspeccionados ?? 0}
            mios={e.cobertura?.mios ?? 0}
            total={e.cobertura?.total ?? 0}
          />
        )}
      </div>
    </div>
  )
}

// ── Chip de ejecución para el calendario ─────────────────────────────────────

function ChipEjecucion({ e, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left text-xs text-white px-1.5 py-0.5 rounded truncate font-medium ${colorEstado(e.estado)} hover:opacity-80 transition-opacity`}
    >
      {e.pauta?.nombre}
    </button>
  )
}

// ── Vista Semana ──────────────────────────────────────────────────────────────

function VistaSemana({ ejecuciones, onClickEjecucion, semanaOffset, setSemanaOffset }) {
  const hoy    = new Date()
  const lunes  = new Date(hoy)
  const diaSem = hoy.getDay() === 0 ? 6 : hoy.getDay() - 1
  lunes.setDate(hoy.getDate() - diaSem + semanaOffset * 7)
  lunes.setHours(0, 0, 0, 0)

  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes)
    d.setDate(lunes.getDate() + i)
    return d
  })

  const inicioSem = dias[0]
  const finSem    = dias[6]
  const mismoMes  = inicioSem.getMonth() === finSem.getMonth()

  const titulo = mismoMes
    ? `${inicioSem.getDate()} — ${finSem.getDate()} ${MESES[finSem.getMonth()]} ${finSem.getFullYear()}`
    : `${inicioSem.getDate()} ${MESES[inicioSem.getMonth()]} — ${finSem.getDate()} ${MESES[finSem.getMonth()]} ${finSem.getFullYear()}`

  return (
    <div>
      {/* Navegación */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setSemanaOffset(o => o - 1)} className="p-1.5 rounded-lg hover:bg-gray-100">
          <ChevronLeft size={18} className="text-gray-500" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700">{titulo}</p>
          {semanaOffset !== 0 && (
            <button onClick={() => setSemanaOffset(0)} className="text-xs text-blue-500 hover:underline mt-0.5">
              Volver a hoy
            </button>
          )}
        </div>
        <button onClick={() => setSemanaOffset(o => o + 1)} className="p-1.5 rounded-lg hover:bg-gray-100">
          <ChevronRight size={18} className="text-gray-500" />
        </button>
      </div>

      {/* Grid días */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DIAS_CORTO.map((d, i) => {
          const esHoy = isSameDay(dias[i], hoy)
          return (
            <div key={d} className="text-center">
              <p className="text-xs text-gray-400 mb-1">{d}</p>
              <div className={`mx-auto w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold ${
                esHoy ? 'bg-blue-600 text-white' : 'text-gray-700'
              }`}>
                {dias[i].getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Ejecuciones por día */}
      <div className="grid grid-cols-7 gap-1">
        {dias.map((dia, i) => {
          const ejecs = ejecuciones.filter(e => ejecucionEnDia(e, dia))
          return (
            <div key={i} className="min-h-[64px] border border-gray-100 rounded-lg p-1 space-y-1 bg-white">
              {ejecs.map(e => (
                <ChipEjecucion key={e.id} e={e} onClick={() => onClickEjecucion(e.id)} />
              ))}
            </div>
          )
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> En curso / Pendiente</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Completada</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Vencida</span>
      </div>
    </div>
  )
}

// ── Vista Mes ─────────────────────────────────────────────────────────────────

function VistaMes({ ejecuciones, onClickEjecucion, mesOffset, setMesOffset }) {
  const hoy     = new Date()
  const año     = new Date(hoy.getFullYear(), hoy.getMonth() + mesOffset, 1).getFullYear()
  const mes     = new Date(hoy.getFullYear(), hoy.getMonth() + mesOffset, 1).getMonth()
  const primer  = new Date(año, mes, 1)
  const ultimo  = new Date(año, mes + 1, 0)

  // Días del mes + relleno al inicio (lunes = 0)
  const diaInicio = primer.getDay() === 0 ? 6 : primer.getDay() - 1
  const totalCeldas = diaInicio + ultimo.getDate()
  const totalSemanas = Math.ceil(totalCeldas / 7)
  const celdas = Array.from({ length: totalSemanas * 7 }, (_, i) => {
    const n = i - diaInicio + 1
    if (n < 1 || n > ultimo.getDate()) return null
    return new Date(año, mes, n)
  })

  return (
    <div>
      {/* Navegación */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setMesOffset(o => o - 1)} className="p-1.5 rounded-lg hover:bg-gray-100">
          <ChevronLeft size={18} className="text-gray-500" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700">{MESES[mes]} {año}</p>
          {mesOffset !== 0 && (
            <button onClick={() => setMesOffset(0)} className="text-xs text-blue-500 hover:underline mt-0.5">
              Volver a hoy
            </button>
          )}
        </div>
        <button onClick={() => setMesOffset(o => o + 1)} className="p-1.5 rounded-lg hover:bg-gray-100">
          <ChevronRight size={18} className="text-gray-500" />
        </button>
      </div>

      {/* Cabecera días */}
      <div className="grid grid-cols-7 gap-px mb-1">
        {DIAS_CORTO.map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 pb-1">{d}</div>
        ))}
      </div>

      {/* Grid días */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-xl overflow-hidden border border-gray-200">
        {celdas.map((dia, i) => {
          if (!dia) return <div key={i} className="bg-gray-50 min-h-[70px]" />
          const esHoy   = isSameDay(dia, hoy)
          const ejecs   = ejecuciones.filter(e => ejecucionEnDia(e, dia))
          const esMesActual = dia.getMonth() === mes
          return (
            <div
              key={i}
              className={`bg-white min-h-[70px] p-1 ${!esMesActual ? 'opacity-30' : ''}`}
            >
              <div className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                esHoy ? 'bg-blue-600 text-white' : 'text-gray-600'
              }`}>
                {dia.getDate()}
              </div>
              <div className="space-y-0.5">
                {ejecs.slice(0, 2).map(e => (
                  <ChipEjecucion key={e.id} e={e} onClick={() => onClickEjecucion(e.id)} />
                ))}
                {ejecs.length > 2 && (
                  <p className="text-xs text-gray-400 pl-1">+{ejecs.length - 2} más</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> En curso / Pendiente</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Completada</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Vencida</span>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function MisPautasPage() {
  const navigate     = useNavigate()
  const { user }     = useAuth()
  const { data: ejecuciones, isLoading } = useEjecucionesActivas()

  const [vista,       setVista]       = useState('lista')
  const [semanaOffset, setSemanaOffset] = useState(0)
  const [mesOffset,    setMesOffset]    = useState(0)

  const rutaEjecucion = (id) => user?.rol === 'INSPECTOR'
    ? `/inspector/ejecuciones/${id}`
    : `/admin/ejecuciones/${id}`

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  const activas = ejecuciones?.filter(e => e.estado === 'PENDIENTE' || e.estado === 'EN_CURSO') ?? []
  const otras   = ejecuciones?.filter(e => e.estado !== 'PENDIENTE' && e.estado !== 'EN_CURSO') ?? []
  const todas   = ejecuciones ?? []

  // Agrupar activas por semana
  const gruposSemana = agruparPorSemana(activas)

  const VISTAS = [
    { id: 'lista',   icon: List,          label: 'Lista'   },
    { id: 'semana',  icon: CalendarDays,  label: 'Semana'  },
    { id: 'mes',     icon: CalendarRange, label: 'Mes'     },
  ]

  return (
    <div>
      {/* Header + toggle de vista */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Navigation size={20} className="text-blue-600" />
          <h1 className="text-xl font-bold text-gray-800">Pautas en Ruta</h1>
        </div>
        <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
          {VISTAS.map(v => (
            <button
              key={v.id}
              onClick={() => setVista(v.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                vista === v.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <v.icon size={13} />
              <span className="hidden sm:inline">{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sin ejecuciones */}
      {!ejecuciones?.length ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <Navigation size={32} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium">No tenés ejecuciones activas</p>
          <p className="text-xs text-gray-300">Cuando un administrador programe una ronda, aparecerá aquí</p>
        </div>
      ) : (
        <>
          {/* ── Vista Lista ─────────────────────────────── */}
          {vista === 'lista' && (
            <div className="space-y-6">
              {gruposSemana.map(grupo => (
                <div key={grupo.label}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    {grupo.label} · {grupo.items.length} ronda{grupo.items.length !== 1 ? 's' : ''}
                  </p>
                  <div className="space-y-3">
                    {grupo.items.map(e => (
                      <TarjetaEjecucion key={e.id} e={e} onClick={() => navigate(rutaEjecucion(e.id))} />
                    ))}
                  </div>
                </div>
              ))}
              {otras.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Finalizadas</p>
                  <div className="space-y-3">
                    {otras.map(e => (
                      <TarjetaEjecucion key={e.id} e={e} onClick={() => navigate(rutaEjecucion(e.id))} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Vista Semana ─────────────────────────────── */}
          {vista === 'semana' && (
            <VistaSemana
              ejecuciones={todas}
              onClickEjecucion={(id) => navigate(rutaEjecucion(id))}
              semanaOffset={semanaOffset}
              setSemanaOffset={setSemanaOffset}
            />
          )}

          {/* ── Vista Mes ─────────────────────────────────── */}
          {vista === 'mes' && (
            <VistaMes
              ejecuciones={todas}
              onClickEjecucion={(id) => navigate(rutaEjecucion(id))}
              mesOffset={mesOffset}
              setMesOffset={setMesOffset}
            />
          )}
        </>
      )}
    </div>
  )
}
