import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Users, AlertTriangle, Camera, X, ClipboardCheck, XCircle, ClipboardList, Plus } from 'lucide-react'
import { useEjecucionDetalle, useMarcarItem, useCerrarEjecucion } from '../hooks/usePautas'
import { useAuth } from '../../auth/useAuth'
import { comprimirImagen } from '../../../shared/utils/comprimirImagen'
import ItemEjecucionRow from '../components/ItemEjecucionRow'
import EstadoEjecucionBadge from '../components/EstadoEjecucionBadge'
import ProgresoPauta from '../components/ProgresoPauta'
import ChecklistDinamico from '../components/ChecklistDinamico'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Spinner from '../../../shared/components/ui/Spinner'

function FotosInput({ fotos, onAdd, onQuitar, error, fileRef, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        Evidencia fotográfica <span className="text-red-500">*</span>
        {fotos.length > 0 && <span className="text-gray-400 font-normal ml-1">({fotos.length}/5)</span>}
      </label>

      {fotos.length > 0 && (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-white">
          <img src={fotos[0].preview} alt="Foto principal" className="w-full max-h-48 object-contain" />
          <button
            type="button"
            onClick={() => onQuitar(0)}
            className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {fotos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {fotos.slice(1).map((f, i) => (
            <div key={i} className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
              <img src={f.preview} alt={`Foto ${i + 2}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onQuitar(i + 1)}
                className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70 transition-colors"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {fotos.length < 5 && (
        <button
          type="button"
          onClick={onAdd}
          className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-4 transition-colors ${
            error
              ? 'border-red-400 bg-red-50 text-red-400'
              : 'border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-400'
          }`}
        >
          {fotos.length === 0 ? <Camera size={24} /> : <Plus size={20} />}
          <span className="text-xs">{fotos.length === 0 ? 'Tomar foto o seleccionar imagen' : 'Agregar otra foto'}</span>
        </button>
      )}

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertTriangle size={11} /> {error}
        </p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        multiple
        className="hidden"
        onChange={onChange}
      />
    </div>
  )
}

export default function EjecucionDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: ejecucion, isLoading } = useEjecucionDetalle(id)
  const marcar = useMarcarItem()
  const cerrar = useCerrarEjecucion()

  const [itemAMarcar, setItemAMarcar] = useState(null)
  const [grupoAMarcar, setGrupoAMarcar] = useState(null)  // { padre, items[], checklist }
  const [modalCerrar, setModalCerrar] = useState(false)
  const [motivoCierre, setMotivoCierre] = useState('')
  const [observacion, setObservacion] = useState('')
  const [fotos, setFotos] = useState([])          // [{ file: File, preview: string }]
  const [cargandoItem, setCargandoItem] = useState(null)
  const [conflicto, setConflicto] = useState(null)
  const [erroresForm, setErroresForm] = useState({})
  const [respuestas, setRespuestas] = useState({})         // { [campo_id]: string }
  const [erroresChecklist, setErroresChecklist] = useState({})  // { [campo_id]: string }
  const fileRef = useRef(null)

  const esInspector = user?.rol === 'INSPECTOR'
  const esAdmin = user?.rol === 'ADMINISTRADOR'
  const puedeEjecutar = esInspector || esAdmin

  const rutaVolver = esInspector
    ? '/inspector/pautas'
    : `/admin/ruta-pautas`

  function resetForm() {
    setObservacion('')
    setFotos([])
    setErroresForm({})
    setRespuestas({})
    setErroresChecklist({})
    if (fileRef.current) fileRef.current.value = ''
  }

  function defaultsNumericos(campos = {}) {
    const defaults = {}
    campos.forEach?.(c => { if (c.tipo === 'NUMERICO') defaults[c.id] = '0' })
    return defaults
  }

  function abrirMarcar(item) {
    resetForm()
    setRespuestas(defaultsNumericos(item.plantilla_verif?.campos))
    setItemAMarcar(item)
  }

  function abrirMarcarGrupo(g) {
    const noInspeccionados = g.items.filter(({ item }) => !item.inspeccionado).map(({ item }) => item)
    const checklist = noInspeccionados[0]?.plantilla_verif ?? null
    resetForm()
    setRespuestas(defaultsNumericos(checklist?.campos))
    setGrupoAMarcar({ padre: g.padre, items: noInspeccionados, checklist })
  }

  async function onFotosChange(e) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const disponible = 5 - fotos.length
    const nuevos = files.slice(0, disponible)
    const procesados = await Promise.all(nuevos.map(async file => {
      let comprimido = file
      try { comprimido = await comprimirImagen(file) } catch {}
      return new Promise(resolve => {
        const reader = new FileReader()
        reader.onload = ev => resolve({ file: comprimido, preview: ev.target.result })
        reader.readAsDataURL(comprimido)
      })
    }))
    setFotos(prev => [...prev, ...procesados])
    setErroresForm(p => ({ ...p, fotos: undefined }))
    if (fileRef.current) fileRef.current.value = ''
  }

  function quitarFoto(idx) {
    setFotos(prev => prev.filter((_, i) => i !== idx))
  }

  function confirmarMarcar() {
    if (!itemAMarcar) return

    // Validación: foto y comentario obligatorios
    const errores = {}
    if (!observacion.trim()) errores.observacion = 'La observación es obligatoria'
    if (!fotos.length) errores.fotos = 'La foto de evidencia es obligatoria'
    if (Object.keys(errores).length > 0) {
      setErroresForm(errores)
      return
    }
    setErroresForm({})

    // Validar checklist si aplica
    if (itemAMarcar.plantilla_verif?.campos?.length) {
      const camposObligs = itemAMarcar.plantilla_verif.campos.filter(c => c.es_obligatorio)
      const errs = {}
      camposObligs.forEach(c => {
        const v = respuestas[c.id]
        if (!v && v !== 0) errs[c.id] = 'Campo obligatorio'
      })
      if (Object.keys(errs).length > 0) {
        setErroresChecklist(errs)
        return
      }
    }
    setErroresChecklist({})

    const respuestasArray = Object.entries(respuestas).map(([campo_id, valor]) => ({
      campo_id,
      valor: String(valor),
    }))

    setCargandoItem(itemAMarcar.id)
    marcar.mutate(
      {
        ejecucionId: id,
        itemId: itemAMarcar.id,
        datos: {
          observacion: observacion || null,
          fotos: fotos.map(f => f.file),
          respuestas: respuestasArray,
        },
      },
      {
        onSuccess: () => {
          setItemAMarcar(null)
          resetForm()
          setCargandoItem(null)
        },
        onError: (err) => {
          setCargandoItem(null)
          setItemAMarcar(null)
          if (err?.response?.status === 409) {
            setConflicto(err?.response?.data?.message)
          }
        },
      },
    )
  }

  async function confirmarMarcarGrupo() {
    if (!grupoAMarcar) return

    const errores = {}
    if (!observacion.trim()) errores.observacion = 'La observación es obligatoria'
    if (!fotos.length) errores.fotos = 'La foto de evidencia es obligatoria'
    if (Object.keys(errores).length > 0) { setErroresForm(errores); return }
    setErroresForm({})

    if (grupoAMarcar.checklist?.campos?.length) {
      const errs = {}
      grupoAMarcar.checklist.campos.filter(c => c.es_obligatorio).forEach(c => {
        if (!respuestas[c.id] && respuestas[c.id] !== 0) errs[c.id] = 'Campo obligatorio'
      })
      if (Object.keys(errs).length > 0) { setErroresChecklist(errs); return }
    }
    setErroresChecklist({})

    const respuestasArray = Object.entries(respuestas).map(([campo_id, valor]) => ({
      campo_id, valor: String(valor),
    }))

    setCargandoItem('grupo')
    try {
      for (const item of grupoAMarcar.items) {
        await marcar.mutateAsync({
          ejecucionId: id,
          itemId: item.id,
          datos: { observacion: observacion || null, fotos: fotos.map(f => f.file), respuestas: respuestasArray },
        })
      }
      setGrupoAMarcar(null)
      resetForm()
    } catch (err) {
      if (err?.response?.status === 409) setConflicto(err?.response?.data?.message)
      setGrupoAMarcar(null)
    }
    setCargandoItem(null)
  }

  function confirmarCierre() {
    cerrar.mutate(
      { ejecucionId: id, motivo: motivoCierre },
      {
        onSuccess: () => {
          setModalCerrar(false)
          setMotivoCierre('')
        },
      }
    )
  }

  function irACrearHallazgo(item) {
    const base = esInspector ? '/inspector/nuevo' : (esAdmin ? '/admin/nuevo' : '/supervisor/nuevo')
    navigate(`${base}?ejecucionId=${id}&itemId=${item.id}&ubicacionId=${item.ubicacion_tecnica_id}`)
  }

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  if (!ejecucion) return <p className="text-center text-gray-400 py-16">Ejecución no encontrada</p>

  const { cobertura, inspectores_desglose = [] } = ejecucion

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate(rutaVolver)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
      >
        <ArrowLeft size={16} /> Volver
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border p-4 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 mb-0.5">{ejecucion.pauta?.nombre}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <EstadoEjecucionBadge estado={ejecucion.estado} />
              <span className="text-sm text-gray-600">
                {new Date(ejecucion.fecha_inicio).toLocaleDateString('es-CL')}
                {' — '}
                {new Date(ejecucion.fecha_fin).toLocaleDateString('es-CL')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-400">
              <MapPin size={11} />
              <span className="bg-indigo-100 text-indigo-700 text-xs font-medium px-1.5 py-0.5 rounded-full">
                {ejecucion.pauta?.disciplina?.nombre}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <ProgresoPauta
              inspeccionados={cobertura?.inspeccionados ?? 0}
              total={cobertura?.total ?? 0}
            />
            {['PENDIENTE', 'EN_CURSO', 'VENCIDA'].includes(ejecucion.estado) && puedeEjecutar && (
              <button
                onClick={() => setModalCerrar(true)}
                className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-2.5 py-1.5 rounded-lg transition-colors border border-orange-200"
              >
                <XCircle size={13} />
                Cerrar sin ejecutar
              </button>
            )}
          </div>
        </div>

        {inspectores_desglose.length > 0 && (
          <div className="mt-3 pt-3 border-t flex items-center gap-2 flex-wrap">
            <Users size={13} className="text-gray-400" />
            {inspectores_desglose.map(ins => (
              <span key={ins.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {ins.nombre} ({ins.count})
              </span>
            ))}
          </div>
        )}

        {cobertura?.hallazgos > 0 && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
            <AlertTriangle size={12} />
            {cobertura.hallazgos} hallazgo{cobertura.hallazgos !== 1 ? 's' : ''} generado{cobertura.hallazgos !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Items agrupados por equipo (activo, nivel 3) */}
      {(() => {
        const items = ejecucion.items ?? []
        // Agrupar manteniendo el orden original
        const grupos = []
        const grupoMap = new Map()
        items.forEach((item, i) => {
          const nivel = item.ubicacion_tecnica?.nivel ?? 4
          // Nivel 3: el ítem ES el activo → grupo propio sin cabecera (padre=null)
          // Nivel 4: agrupar por activo padre
          const padreId = nivel < 4
            ? `__equipo__${item.ubicacion_tecnica_id}`
            : (item.ubicacion_tecnica?.padre_id ?? '__sin_padre__')
          const padre = nivel < 4
            ? null
            : (item.ubicacion_tecnica?.padre ?? null)
          if (!grupoMap.has(padreId)) {
            const g = { padreId, padre, items: [] }
            grupoMap.set(padreId, g)
            grupos.push(g)
          }
          grupoMap.get(padreId).items.push({ item, globalIndex: i })
        })

        return (
          <div className="space-y-4">
            {grupos.map(g => (
              <div key={g.padreId}>
                {/* Cabecera equipo */}
                {g.padre && (() => {
                  const noInsp = g.items.filter(({ item }) => !item.inspeccionado)
                  // Checklist común: solo si TODOS los ítems tienen el mismo checklist
                  const primerChecklist = g.items[0]?.item?.plantilla_verif
                  const checklistComun = primerChecklist && g.items.every(({ item }) =>
                    item.plantilla_verif?.id === primerChecklist.id
                  ) ? primerChecklist : null
                  return (
                    <div className="flex items-center gap-2 px-1 mb-2 flex-wrap">
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-mono">
                        {g.padre.codigo}
                      </span>
                      <span className="text-xs font-medium text-gray-600">{g.padre.descripcion}</span>
                      <span className="text-xs text-gray-400">
                        ({g.items.filter(({ item }) => item.inspeccionado).length}/{g.items.length})
                      </span>
                      {checklistComun && (
                        <span className="flex items-center gap-0.5 text-[10px] font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-full">
                          <ClipboardList size={10} />
                          {checklistComun.nombre}
                        </span>
                      )}
                      {puedeEjecutar && noInsp.length > 0 && checklistComun && (
                        <button
                          onClick={() => abrirMarcarGrupo(g)}
                          className="ml-auto flex items-center gap-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg transition-colors"
                        >
                          <ClipboardCheck size={12} />
                          Registrar equipo
                        </button>
                      )}
                    </div>
                  )
                })()}
                <div className="space-y-2">
                  {g.items.map(({ item, globalIndex }) => (
                    <ItemEjecucionRow
                      key={item.id}
                      item={item}
                      index={globalIndex}
                      usuarioId={user?.id}
                      puedeEjecutar={puedeEjecutar}
                      onMarcar={abrirMarcar}
                      onCrearHallazgo={irACrearHallazgo}
                      cargando={cargandoItem}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      })()}

      {/* Modal marcar ítem */}
      <Modal
        open={!!itemAMarcar}
        onClose={() => { setItemAMarcar(null); resetForm() }}
        title="Marcar como inspeccionado"
      >
        <div className="space-y-4">
          {/* Ubicación */}
          <div className="bg-blue-50 rounded-xl px-3 py-2.5">
            <p className="text-xs text-blue-400 mb-0.5">Componente</p>
            <p className="text-sm font-semibold text-blue-800">
              {itemAMarcar?.ubicacion_tecnica?.codigo} — {itemAMarcar?.ubicacion_tecnica?.descripcion}
            </p>
          </div>

          {/* Observación */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Observación <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Describe lo observado durante la inspección..."
              value={observacion}
              onChange={e => { setObservacion(e.target.value); setErroresForm(p => ({ ...p, observacion: undefined })) }}
              className={`border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                erroresForm.observacion ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {erroresForm.observacion && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle size={11} /> {erroresForm.observacion}
              </p>
            )}
          </div>

          {/* Checklist dinámico */}
          {itemAMarcar?.plantilla_verif?.campos?.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <ClipboardCheck size={14} className="text-indigo-500" />
                {itemAMarcar.plantilla_verif.nombre}
              </p>
              <ChecklistDinamico
                campos={itemAMarcar.plantilla_verif.campos}
                respuestas={respuestas}
                onChange={(campoId, valor) => {
                  setRespuestas(prev => ({ ...prev, [campoId]: valor }))
                  setErroresChecklist(prev => ({ ...prev, [campoId]: undefined }))
                }}
                errores={erroresChecklist}
              />
            </div>
          )}

          {/* Fotos evidencia */}
          <FotosInput
            fotos={fotos}
            onAdd={() => fileRef.current?.click()}
            onQuitar={quitarFoto}
            error={erroresForm.fotos}
            fileRef={fileRef}
            onChange={onFotosChange}
          />

          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="full"
              onClick={() => { setItemAMarcar(null); resetForm() }}
            >
              Cancelar
            </Button>
            <Button size="full" loading={!!cargandoItem} onClick={confirmarMarcar}>
              Registrar inspección
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal registrar equipo (batch) */}
      <Modal
        open={!!grupoAMarcar}
        onClose={() => { setGrupoAMarcar(null); resetForm() }}
        title={`Registrar equipo — ${grupoAMarcar?.padre?.codigo ?? ''}`}
      >
        <div className="space-y-4">
          <div className="bg-amber-50 rounded-xl px-3 py-2.5">
            <p className="text-xs text-amber-500 mb-0.5">
              Equipo · {grupoAMarcar?.items?.length} componente{grupoAMarcar?.items?.length !== 1 ? 's' : ''} sin registrar
            </p>
            <p className="text-sm font-semibold text-amber-800">
              {grupoAMarcar?.padre?.codigo} — {grupoAMarcar?.padre?.descripcion}
            </p>
          </div>

          {/* Observación */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Observación <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Describe lo observado durante la inspección..."
              value={observacion}
              onChange={e => { setObservacion(e.target.value); setErroresForm(p => ({ ...p, observacion: undefined })) }}
              className={`border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                erroresForm.observacion ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {erroresForm.observacion && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={11} /> {erroresForm.observacion}</p>}
          </div>

          {/* Checklist del equipo */}
          {grupoAMarcar?.checklist?.campos?.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <ClipboardCheck size={14} className="text-indigo-500" />
                {grupoAMarcar.checklist.nombre}
              </p>
              <ChecklistDinamico
                campos={grupoAMarcar.checklist.campos}
                respuestas={respuestas}
                onChange={(campoId, valor) => {
                  setRespuestas(prev => ({ ...prev, [campoId]: valor }))
                  setErroresChecklist(prev => ({ ...prev, [campoId]: undefined }))
                }}
                errores={erroresChecklist}
              />
            </div>
          )}

          {/* Fotos evidencia */}
          <FotosInput
            fotos={fotos}
            onAdd={() => fileRef.current?.click()}
            onQuitar={quitarFoto}
            error={erroresForm.fotos}
            fileRef={fileRef}
            onChange={onFotosChange}
          />

          <div className="flex gap-3">
            <Button variant="secondary" size="full" onClick={() => { setGrupoAMarcar(null); resetForm() }}>Cancelar</Button>
            <Button size="full" loading={cargandoItem === 'grupo'} onClick={confirmarMarcarGrupo}>
              Registrar {grupoAMarcar?.items?.length} componente{grupoAMarcar?.items?.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal cerrar sin ejecutar */}
      <Modal open={modalCerrar} onClose={() => { setModalCerrar(false); setMotivoCierre('') }} title="Cerrar sin ejecutar">
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-orange-50 rounded-xl px-3 py-2.5">
            <XCircle size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-orange-700">
              Esta acción cerrará la ronda de inspección sin completarla. Los componentes no inspeccionados quedarán sin registro.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Motivo <span className="text-gray-400 font-normal">(opcional)</span></label>
            <textarea
              rows={3}
              placeholder="Ej: Equipo fuera de servicio, área bloqueada, reprogramado..."
              value={motivoCierre}
              onChange={e => setMotivoCierre(e.target.value)}
              className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>
          {cerrar.error && (
            <p className="text-xs text-red-500">{cerrar.error?.response?.data?.message || 'Error al cerrar la ejecución'}</p>
          )}
          <div className="flex gap-3">
            <Button variant="secondary" size="full" onClick={() => { setModalCerrar(false); setMotivoCierre('') }}>
              Cancelar
            </Button>
            <Button variant="danger" size="full" loading={cerrar.isPending} onClick={confirmarCierre}>
              Confirmar cierre
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal conflicto */}
      <Modal open={!!conflicto} onClose={() => setConflicto(null)} title="Ítem ya inspeccionado">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">{conflicto}</p>
          <Button size="full" onClick={() => setConflicto(null)}>Entendido</Button>
        </div>
      </Modal>
    </div>
  )
}
