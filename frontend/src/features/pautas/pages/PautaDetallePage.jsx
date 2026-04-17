import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  MapPin, Calendar, ClipboardCheck, History, PlayCircle,
  ToggleLeft, ToggleRight, Pencil, ChevronDown, ChevronRight,
  Building2, Layers, Cpu, X, RefreshCw, ClipboardList,
} from 'lucide-react'
import { usePautaDetalle, useActualizarPauta, useProgramarEjecucion } from '../hooks/usePautas'
import { useArbolUbicaciones } from '../../ubicaciones/hooks/useUbicaciones'
import { usePlantillas } from '../../plantillas/hooks/usePlantillas'
import { programarEjecucionSchema } from '../schemas'
import HistorialEjecuciones from '../components/HistorialEjecuciones'
import SelectorUBTMulti from '../components/SelectorUBTMulti'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Spinner from '../../../shared/components/ui/Spinner'

const TABS = [
  { id: 'definicion', label: 'Definición', icon: ClipboardCheck },
  { id: 'historial',  label: 'Historial',  icon: History },
]

// ── Helpers para agrupar por jerarquía ───────────────────────────────────────

function buildNodeMap(arbol) {
  const map = {}
  function traverse(node) {
    map[node.id] = node
    node.hijos?.forEach(traverse)
  }
  arbol?.forEach(traverse)
  return map
}

function groupUbts(ubts, nodeMap) {
  // Agrupa: { plantaId → { node, areas: { areaId → { node, activos: { activoId → { node, componentes: [] } } } } } }
  const grouped = {}
  for (const ubt of ubts) {
    const node = nodeMap[ubt.ubicacion_tecnica_id] ?? ubt.ubicacion_tecnica
    const nivel = node?.nivel ?? ubt.ubicacion_tecnica?.nivel ?? 4

    let n3, n2, n1
    if (nivel >= 4) {
      // Componente nivel 4: su padre es el activo
      const n4 = node
      n3 = nodeMap[n4?.padre_id]
      n2 = nodeMap[n3?.padre_id]
      n1 = nodeMap[n2?.padre_id]
    } else {
      // Activo nivel 3: él mismo es el "activo" de la agrupación
      n3 = node
      n2 = nodeMap[n3?.padre_id]
      n1 = nodeMap[n2?.padre_id]
    }

    const k1 = n1?.id ?? '__sin_planta__'
    const k2 = n2?.id ?? '__sin_area__'
    const k3 = n3?.id ?? '__sin_activo__'

    if (!grouped[k1]) grouped[k1] = { node: n1, areas: {} }
    if (!grouped[k1].areas[k2]) grouped[k1].areas[k2] = { node: n2, activos: {} }
    if (!grouped[k1].areas[k2].activos[k3]) grouped[k1].areas[k2].activos[k3] = { node: n3, componentes: [] }
    grouped[k1].areas[k2].activos[k3].componentes.push({
      ...ubt,
      ubicacion_tecnica: node ?? ubt.ubicacion_tecnica,
      plantilla_verif: ubt.plantilla_verif,
      isNivel3: nivel < 4,
    })
  }
  return grouped
}

// ── Árbol agrupado de componentes ─────────────────────────────────────────────

function ArbolComponentes({ ubts, nodeMap, onQuitar }) {
  const [colapsadas, setColapsadas] = useState({})

  const grouped = useMemo(() => groupUbts(ubts, nodeMap), [ubts, nodeMap])

  function toggleColapso(key) {
    setColapsadas(p => ({ ...p, [key]: !p[key] }))
  }

  if (ubts.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-gray-400 text-sm">
        Sin componentes configurados
      </div>
    )
  }

  return (
    <div className="divide-y">
      {Object.entries(grouped).map(([k1, { node: planta, areas }]) => (
        <div key={k1}>
          {/* Planta (nivel 1) */}
          <button
            onClick={() => toggleColapso(k1)}
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-left transition-colors"
          >
            {colapsadas[k1] ? <ChevronRight size={13} className="text-gray-400 shrink-0" /> : <ChevronDown size={13} className="text-gray-400 shrink-0" />}
            <Building2 size={13} className="text-gray-500 shrink-0" />
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              {planta ? `${planta.codigo} — ${planta.descripcion}` : 'Sin planta'}
            </span>
          </button>

          {!colapsadas[k1] && Object.entries(areas).map(([k2, { node: area, activos }]) => (
            <div key={k2}>
              {/* Área (nivel 2) */}
              <button
                onClick={() => toggleColapso(k2)}
                className="w-full flex items-center gap-2 px-4 py-2 pl-8 bg-blue-50/40 hover:bg-blue-50 text-left transition-colors"
              >
                {colapsadas[k2] ? <ChevronRight size={12} className="text-blue-300 shrink-0" /> : <ChevronDown size={12} className="text-blue-300 shrink-0" />}
                <Layers size={12} className="text-blue-400 shrink-0" />
                <span className="text-xs font-medium text-blue-700">
                  {area ? `${area.codigo} — ${area.descripcion}` : 'Sin área'}
                </span>
              </button>

              {!colapsadas[k2] && Object.entries(activos).map(([k3, { node: activo, componentes }]) => {
                // Detectar si es un ítem nivel 3 directo (el activo mismo es la UBT)
                const isNivel3Leaf = componentes.length > 0 && componentes.every(c => c.isNivel3)

                if (isNivel3Leaf) {
                  // Activo nivel 3 como hoja: sin children, con quitar directo
                  const comp = componentes[0]
                  return (
                    <div key={k3} className="flex items-center gap-2 px-4 py-2 pl-14 hover:bg-amber-50 group">
                      <Cpu size={11} className="text-amber-500 shrink-0" />
                      <span className="text-xs font-medium text-amber-700">
                        {activo ? `${activo.codigo} — ${activo.descripcion}` : 'Sin activo'}
                      </span>
                      <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1 py-0.5 rounded shrink-0">
                        EQUIPO
                      </span>
                      {comp.plantilla_verif && (
                        <span className="flex items-center gap-0.5 text-[10px] font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-full shrink-0">
                          <ClipboardList size={10} />
                          {comp.plantilla_verif.nombre}
                        </span>
                      )}
                      {onQuitar && (
                        <button
                          onClick={() => onQuitar(comp.ubicacion_tecnica_id)}
                          className="ml-auto opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all shrink-0"
                          title="Quitar equipo"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  )
                }

                // Activo normal: expandable con componentes nivel 4
                const checklistsActivo = [...new Set(componentes.map(c => c.plantilla_verif?.nombre).filter(Boolean))]
                return (
                  <div key={k3}>
                    {/* Activo (nivel 3) */}
                    <button
                      onClick={() => toggleColapso(k3)}
                      className="w-full flex items-center gap-2 px-4 py-2 pl-14 hover:bg-amber-50 text-left transition-colors"
                    >
                      {colapsadas[k3] ? <ChevronRight size={11} className="text-amber-300 shrink-0" /> : <ChevronDown size={11} className="text-amber-300 shrink-0" />}
                      <Cpu size={11} className="text-amber-500 shrink-0" />
                      <span className="text-xs font-medium text-amber-700">
                        {activo ? `${activo.codigo} — ${activo.descripcion}` : 'Sin activo'}
                      </span>
                      {checklistsActivo.map(nombre => (
                        <span key={nombre} className="flex items-center gap-0.5 text-[10px] font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-full shrink-0">
                          <ClipboardList size={10} />
                          {nombre}
                        </span>
                      ))}
                      <span className="ml-auto text-xs text-gray-400 mr-2 shrink-0">{componentes.length}</span>
                    </button>

                    {!colapsadas[k3] && componentes.map(comp => (
                      <div
                        key={comp.ubicacion_tecnica_id}
                        className="flex items-center gap-2 pl-20 pr-4 py-2 hover:bg-gray-50 group"
                      >
                        <MapPin size={11} className="text-blue-400 shrink-0" />
                        <span className="text-xs font-mono text-gray-400 shrink-0">
                          {comp.ubicacion_tecnica?.codigo}
                        </span>
                        <span className="text-xs text-gray-700 flex-1 truncate">
                          {comp.ubicacion_tecnica?.descripcion}
                        </span>
                        {comp.plantilla_verif && (
                          <span className="flex items-center gap-0.5 text-[10px] font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-full shrink-0">
                            <ClipboardList size={10} />
                            {comp.plantilla_verif.nombre}
                          </span>
                        )}
                        {onQuitar && (
                          <button
                            onClick={() => onQuitar(comp.ubicacion_tecnica_id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all shrink-0"
                            title="Quitar componente"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function PautaDetallePage() {
  const { id } = useParams()
  const [tab, setTab] = useState('definicion')
  const [modalEjecucion, setModalEjecucion] = useState(false)
  const [editandoUbts, setEditandoUbts] = useState(false)
  const [ubtsEditadas, setUbtsEditadas] = useState([])
  const [ubtError, setUbtError] = useState(null)
  const [ubtPlantillas, setUbtPlantillas] = useState({})        // { [ubicacion_tecnica_id]: plantillaId | '' }
  const [equipoPlantillas, setEquipoPlantillas] = useState({})  // { [grupoKey]: plantillaId } — solo para el selector visual del equipo

  const { data: pauta, isLoading } = usePautaDetalle(id)
  const { data: arbol = [] } = useArbolUbicaciones()
  const { data: plantillas } = usePlantillas(pauta?.disciplina?.id ? { disciplina_id: pauta.disciplina.id } : undefined)
  const actualizar = useActualizarPauta()
  const programar = useProgramarEjecucion()

  const nodeMap = useMemo(() => buildNodeMap(arbol), [arbol])

  // ── helpers checklist ──────────────────────────────────────────────────────
  function getGrupoKey(u) {
    if (u.activo_id) return u.activo_id
    const partes = u.codigo?.split('-') ?? []
    return partes.length > 1 ? partes.slice(0, -1).join('-') : u.codigo ?? '__sin_activo__'
  }
  function gruposPorActivo(lista) {
    const map = new Map()
    lista.forEach(u => {
      const key = getGrupoKey(u)
      if (!map.has(key)) map.set(key, { grupoKey: key, activo_codigo: u.activo_codigo ?? key, activo_descripcion: u.activo_descripcion ?? null, items: [] })
      map.get(key).items.push(u)
    })
    return Array.from(map.values())
  }
  // Cambiar componente individual
  function setPlantillaUbt(ubtId, val) {
    setUbtPlantillas(p => ({ ...p, [ubtId]: val }))
  }
  // Cambiar equipo: actualiza el selector visual Y actualiza TODOS los componentes del grupo
  function setPlantillaEquipo(grupoKey, val, grupoItems = []) {
    setEquipoPlantillas(p => ({ ...p, [grupoKey]: val || null }))
    setUbtPlantillas(prev => {
      const next = { ...prev }
      grupoItems.forEach(ubt => {
        next[ubt.ubicacion_tecnica_id] = val  // sobreescribe todos: '' o uuid
      })
      return next
    })
  }

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    resolver: zodResolver(programarEjecucionSchema),
    defaultValues: {
      relanzamiento_auto: false,
      fecha_inicio: new Date().toISOString().slice(0, 10),
      fecha_fin:    new Date().toISOString().slice(0, 10),
    },
  })
  const relanzamientoAuto = useWatch({ control, name: 'relanzamiento_auto' })
  const frecuenciaTipo    = useWatch({ control, name: 'frecuencia_tipo' })

  function toggleActivo() {
    actualizar.mutate({ id, datos: { activo: !pauta.activo } })
  }

  function onProgramar(data) {
    programar.mutate(
      { pautaId: id, datos: data },
      {
        onSuccess: () => {
          setModalEjecucion(false)
          reset()
          setTab('historial')
        },
      },
    )
  }

  function abrirEdicion() {
    const ubtsActuales = pauta.ubts?.map(u => {
      const padreId = u.ubicacion_tecnica?.padre_id ?? null
      const padreNode = nodeMap[padreId]
      return {
        ubicacion_tecnica_id: u.ubicacion_tecnica_id,
        codigo: u.ubicacion_tecnica?.codigo ?? '',
        descripcion: u.ubicacion_tecnica?.descripcion ?? '',
        orden: u.orden,
        activo_id: padreId,
        activo_codigo: padreNode?.codigo ?? null,
        activo_descripcion: padreNode?.descripcion ?? null,
      }
    }) ?? []
    // Pre-cargar plantillas: todos los componentes ('' si no tienen)
    const initPlantillas = {}
    pauta.ubts?.forEach(u => {
      initPlantillas[u.ubicacion_tecnica_id] = u.plantilla_verif_id ?? ''
    })
    setUbtsEditadas(ubtsActuales)
    setUbtPlantillas(initPlantillas)
    setEquipoPlantillas({})
    setUbtError(null)
    setEditandoUbts(true)
  }

  function guardarUbts() {
    if (ubtsEditadas.length === 0) { setUbtError('Agrega al menos una UBT'); return }
    setUbtError(null)
    const ubtsFinal = ubtsEditadas.map(u => ({
      ...u,
      // ubtPlantillas siempre tiene el valor correcto: '' → null, uuid → uuid
      plantilla_verif_id: ubtPlantillas[u.ubicacion_tecnica_id] || null,
    }))
    actualizar.mutate(
      { id, datos: { ubts: ubtsFinal } },
      { onSuccess: () => setEditandoUbts(false) },
    )
  }

  function quitarUbt(ubicacion_tecnica_id) {
    setUbtsEditadas(prev =>
      prev
        .filter(u => u.ubicacion_tecnica_id !== ubicacion_tecnica_id)
        .map((u, i) => ({ ...u, orden: i + 1 }))
    )
  }

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  if (!pauta) return <p className="text-center text-gray-400 py-16">Pauta no encontrada</p>

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {pauta.disciplina?.nombre}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              pauta.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {pauta.activo ? 'Activa' : 'Inactiva'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-800">{pauta.nombre}</h1>
          {pauta.descripcion && <p className="text-sm text-gray-500 mt-1">{pauta.descripcion}</p>}
          <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
            <MapPin size={12} />
            <span>{pauta._count?.ubts ?? 0} componentes · {pauta._count?.ejecuciones ?? 0} ejecuciones</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          <Button
            size="sm"
            onClick={() => { reset(); setModalEjecucion(true) }}
            disabled={!pauta.activo}
          >
            <PlayCircle size={15} /> Programar ejecución
          </Button>
          <button
            onClick={toggleActivo}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            {pauta.activo
              ? <><ToggleRight size={16} className="text-emerald-500" /> Desactivar</>
              : <><ToggleLeft size={16} /> Activar</>}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b mb-4">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Definición */}
      {tab === 'definicion' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="bg-gray-50 px-4 py-2.5 border-b flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Componentes a inspeccionar ({pauta.ubts?.length ?? 0})
              </span>
              {!editandoUbts && (
                <button
                  onClick={abrirEdicion}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  <Pencil size={12} /> Editar
                </button>
              )}
            </div>

            {editandoUbts ? (
              <div className="p-4 space-y-4">
                {/* Árbol de los ya seleccionados con botón quitar */}
                {ubtsEditadas.length > 0 && (
                  <div className="border rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b">
                      Seleccionados ({ubtsEditadas.length}) — hover para quitar
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      <ArbolComponentes
                        ubts={ubtsEditadas.map(u => ({
                          ubicacion_tecnica_id: u.ubicacion_tecnica_id,
                          ubicacion_tecnica: nodeMap[u.ubicacion_tecnica_id] ?? { codigo: u.codigo, descripcion: u.descripcion },
                        }))}
                        nodeMap={nodeMap}
                        onQuitar={quitarUbt}
                      />
                    </div>
                  </div>
                )}

                {/* Selector para agregar más */}
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">Agregar más componentes:</p>
                  <SelectorUBTMulti
                    value={ubtsEditadas}
                    onChange={setUbtsEditadas}
                    error={ubtError}
                  />
                </div>

                {/* Asignación de checklist por equipo / componente */}
                {ubtsEditadas.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck size={14} className="text-indigo-500" />
                      <p className="text-xs font-medium text-gray-700">
                        Checklist por equipo / componente
                        <span className="ml-1.5 font-normal text-gray-400">— opcional</span>
                      </p>
                    </div>
                    {!plantillas?.length ? (
                      <p className="text-xs text-gray-400 italic px-1">No hay plantillas activas para esta disciplina.</p>
                    ) : (
                      <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                        {gruposPorActivo(ubtsEditadas).map(grupo => (
                          <div key={grupo.grupoKey}>
                            <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50">
                              <div className="flex-1 min-w-0 flex items-center gap-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Equipo</span>
                                <span className="text-xs font-mono text-indigo-600 font-semibold">{grupo.activo_codigo}</span>
                                {grupo.activo_descripcion && (
                                  <span className="text-xs text-gray-700 font-medium truncate">{grupo.activo_descripcion}</span>
                                )}
                              </div>
                              <select
                                value={equipoPlantillas[grupo.grupoKey] ?? ''}
                                onChange={e => setPlantillaEquipo(grupo.grupoKey, e.target.value, grupo.items)}
                                className="text-xs border border-indigo-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white max-w-[180px] font-medium text-indigo-700"
                              >
                                <option value="">Sin checklist</option>
                                {plantillas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                              </select>
                            </div>
                            {grupo.items
                              .filter(ubt => ubt.activo_id !== ubt.ubicacion_tecnica_id) // omitir items nivel 3 (ya tienen selector en la cabecera)
                              .map(ubt => (
                              <div key={ubt.ubicacion_tecnica_id} className="flex items-center gap-3 px-3 py-2 pl-7 border-t border-gray-100">
                                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                                  <span className="text-xs font-mono text-gray-400">{ubt.codigo}</span>
                                  <span className="text-xs text-gray-600 truncate">{ubt.descripcion}</span>
                                </div>
                                <select
                                  value={ubtPlantillas[ubt.ubicacion_tecnica_id] ?? ''}
                                  onChange={e => setPlantillaUbt(ubt.ubicacion_tecnica_id, e.target.value)}
                                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white max-w-[180px]"
                                >
                                  <option value="">Sin checklist</option>
                                  {plantillas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                </select>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {actualizar.error && (
                  <p className="text-sm text-red-500">
                    {actualizar.error?.response?.data?.message || 'Error al guardar'}
                  </p>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    size="full"
                    onClick={() => { setEditandoUbts(false); actualizar.reset() }}
                    disabled={actualizar.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="full"
                    onClick={guardarUbts}
                    loading={actualizar.isPending}
                  >
                    Guardar cambios
                  </Button>
                </div>
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto">
                <ArbolComponentes
                  ubts={pauta.ubts?.map(u => ({
                    ubicacion_tecnica_id: u.ubicacion_tecnica_id,
                    ubicacion_tecnica: u.ubicacion_tecnica,
                    plantilla_verif: u.plantilla_verif,
                    orden: u.orden,
                  })) ?? []}
                  nodeMap={nodeMap}
                />
              </div>
            )}
          </div>

          <div className="text-xs text-gray-400">
            Creada por {pauta.creado_por?.nombre} · {new Date(pauta.created_at).toLocaleDateString('es-CL')}
          </div>
        </div>
      )}

      {/* Tab: Historial */}
      {tab === 'historial' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <HistorialEjecuciones pautaId={id} />
        </div>
      )}

      {/* Modal programar ejecución */}
      <Modal open={modalEjecucion} onClose={() => setModalEjecucion(false)} title="Programar Ejecución">
        <form onSubmit={handleSubmit(onProgramar)} className="space-y-4">
          <p className="text-sm text-gray-500">
            Se creará una nueva ronda de <span className="font-semibold text-gray-700">{pauta.nombre}</span>.
            Los {pauta._count?.ubts ?? 0} componentes serán copiados automáticamente.
          </p>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Fecha de inicio</label>
              <input
                type="date"
                className={`border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.fecha_inicio ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
                {...register('fecha_inicio')}
              />
              {errors.fecha_inicio && <p className="text-xs text-red-500">{errors.fecha_inicio.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Fecha límite</label>
              <input
                type="date"
                className={`border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.fecha_fin ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
                {...register('fecha_fin')}
              />
              {errors.fecha_fin && <p className="text-xs text-red-500">{errors.fecha_fin.message}</p>}
            </div>
          </div>

          {/* Relanzamiento automático */}
          <div className="border rounded-xl overflow-hidden">
            <label className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2">
                <RefreshCw size={15} className="text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Relanzamiento automático</p>
                  <p className="text-xs text-gray-400">Genera la siguiente ronda al finalizar esta</p>
                </div>
              </div>
              <input
                type="checkbox"
                className="w-4 h-4 rounded accent-blue-600"
                {...register('relanzamiento_auto')}
              />
            </label>

            {relanzamientoAuto && (
              <div className="border-t px-4 py-3 bg-blue-50 space-y-3">
                {/* Frecuencia */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">Frecuencia entre rondas</label>
                  <select
                    className={`border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                      errors.frecuencia_tipo ? 'border-red-400' : 'border-gray-300'
                    }`}
                    {...register('frecuencia_tipo')}
                  >
                    <option value="">Seleccionar frecuencia...</option>
                    <option value="DIARIA">Diaria (cada 1 día)</option>
                    <option value="SEMANAL">Semanal (cada 7 días)</option>
                    <option value="QUINCENAL">Quincenal (cada 15 días)</option>
                    <option value="MENSUAL">Mensual (cada 30 días)</option>
                    <option value="PERSONALIZADA">Personalizada...</option>
                  </select>
                  {errors.frecuencia_tipo && <p className="text-xs text-red-500">{errors.frecuencia_tipo.message}</p>}
                </div>

                {/* Días personalizados */}
                {frecuenciaTipo === 'PERSONALIZADA' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">Días entre rondas</label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      placeholder="ej: 14"
                      className={`border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.frecuencia_dias ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      }`}
                      {...register('frecuencia_dias')}
                    />
                    {errors.frecuencia_dias && <p className="text-xs text-red-500">{errors.frecuencia_dias.message}</p>}
                  </div>
                )}

                {/* Máximo de ejecuciones */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">
                    Máximo de rondas <span className="text-gray-400 font-normal">(dejar vacío = sin límite)</span>
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="999"
                    placeholder="∞"
                    className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register('max_ejecuciones')}
                  />
                </div>
              </div>
            )}
          </div>

          {programar.error && (
            <p className="text-sm text-red-500">
              {programar.error?.response?.data?.message || 'Error al programar la ejecución'}
            </p>
          )}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" size="full" onClick={() => setModalEjecucion(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="full" loading={programar.isPending}>
              <Calendar size={15} /> Programar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
