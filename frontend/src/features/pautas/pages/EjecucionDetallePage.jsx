import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Users, AlertTriangle } from 'lucide-react'
import { useEjecucionDetalle, useMarcarItem } from '../hooks/usePautas'
import { useAuth } from '../../auth/useAuth'
import ItemEjecucionRow from '../components/ItemEjecucionRow'
import EstadoEjecucionBadge from '../components/EstadoEjecucionBadge'
import ProgresoPauta from '../components/ProgresoPauta'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Spinner from '../../../shared/components/ui/Spinner'

export default function EjecucionDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: ejecucion, isLoading } = useEjecucionDetalle(id)
  const marcar = useMarcarItem()

  const [itemAMarcar, setItemAMarcar] = useState(null)
  const [observacion, setObservacion] = useState('')
  const [cargandoItem, setCargandoItem] = useState(null)
  const [conflicto, setConflicto] = useState(null)

  const esInspector = user?.rol === 'INSPECTOR'
  // El inspector puede ejecutar solo si pertenece a la disciplina
  // (el backend lo valida; aquí mostramos los botones si es inspector)
  const puedeEjecutar = esInspector

  const rutaVolver = esInspector ? '/inspector/pautas' : `/supervisor/pautas/${ejecucion?.pauta?.id}`

  function confirmarMarcar() {
    if (!itemAMarcar) return
    setCargandoItem(itemAMarcar.id)
    marcar.mutate(
      { ejecucionId: id, itemId: itemAMarcar.id, datos: { observacion: observacion || null } },
      {
        onSuccess: () => {
          setItemAMarcar(null)
          setObservacion('')
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

  function irACrearHallazgo(item) {
    const base = esInspector ? '/inspector/nuevo' : '/supervisor/nuevo'
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
              {ejecucion.pauta?.zona_funcional?.descripcion}
              <span className="mx-1">·</span>
              <span className="bg-indigo-100 text-indigo-700 text-xs font-medium px-1.5 py-0.5 rounded-full">
                {ejecucion.pauta?.disciplina?.nombre}
              </span>
            </div>
          </div>
          <ProgresoPauta
            inspeccionados={cobertura?.inspeccionados ?? 0}
            total={cobertura?.total ?? 0}
          />
        </div>

        {/* Desglose inspectores */}
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

      {/* Items */}
      <div className="space-y-2">
        {ejecucion.items?.map((item, i) => (
          <ItemEjecucionRow
            key={item.id}
            item={item}
            index={i}
            usuarioId={user?.id}
            puedeEjecutar={puedeEjecutar}
            onMarcar={(it) => { setObservacion(''); setItemAMarcar(it) }}
            onCrearHallazgo={irACrearHallazgo}
            cargando={cargandoItem}
          />
        ))}
      </div>

      {/* Modal confirmar OK */}
      <Modal
        open={!!itemAMarcar}
        onClose={() => { setItemAMarcar(null); setObservacion('') }}
        title="Marcar como inspeccionado"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Confirma que inspeccionaste:
            <span className="block font-semibold text-gray-800 mt-1">
              {itemAMarcar?.ubicacion_tecnica?.codigo} — {itemAMarcar?.ubicacion_tecnica?.descripcion}
            </span>
          </p>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Observación (opcional)</label>
            <textarea
              rows={3}
              placeholder="Nota sobre la inspección..."
              value={observacion}
              onChange={e => setObservacion(e.target.value)}
              className="border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="full"
              onClick={() => { setItemAMarcar(null); setObservacion('') }}
            >
              Cancelar
            </Button>
            <Button size="full" loading={!!cargandoItem} onClick={confirmarMarcar}>
              Confirmar OK
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
