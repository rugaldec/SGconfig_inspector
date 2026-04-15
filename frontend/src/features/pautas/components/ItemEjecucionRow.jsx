import { CheckCircle2, Circle, AlertTriangle, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../../shared/components/ui/Button'

const CRITICIDAD_COLOR = {
  BAJA: 'text-green-600',
  MEDIA: 'text-yellow-600',
  ALTA: 'text-orange-600',
  CRITICA: 'text-red-600',
}

export default function ItemEjecucionRow({
  item,
  index,
  usuarioId,
  onMarcar,
  onCrearHallazgo,
  puedeEjecutar,
  cargando,
}) {
  const esPropio = item.ejecutado_por_id === usuarioId
  const rutaHallazgo = item.hallazgo?.id
    ? `/supervisor/hallazgos/${item.hallazgo.id}`
    : null

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
      item.inspeccionado
        ? esPropio ? 'bg-blue-50 border-blue-100' : 'bg-emerald-50 border-emerald-100'
        : 'bg-white border-gray-200'
    }`}>
      {/* Ícono de estado */}
      <div className="flex-shrink-0 mt-0.5">
        {item.inspeccionado ? (
          <CheckCircle2 size={18} className={esPropio ? 'text-blue-500' : 'text-emerald-500'} />
        ) : (
          <Circle size={18} className="text-gray-300" />
        )}
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-gray-400">#{index + 1}</span>
          <span className="text-xs font-medium bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
            {item.ubicacion_tecnica?.codigo}
          </span>
          <span className="text-sm font-medium text-gray-800 truncate">
            {item.ubicacion_tecnica?.descripcion}
          </span>
        </div>

        {/* Quién y cuándo */}
        {item.inspeccionado && (
          <div className="mt-1 text-xs text-gray-500">
            {item.ejecutado_por?.nombre}
            {item.fecha_inspeccion && (
              <span className="ml-1.5 text-gray-400">
                · {new Date(item.fecha_inspeccion).toLocaleString('es-CL', {
                  dateStyle: 'short', timeStyle: 'short',
                })}
              </span>
            )}
          </div>
        )}

        {/* Observación */}
        {item.observacion && (
          <p className="mt-1 text-xs text-gray-600 italic">"{item.observacion}"</p>
        )}

        {/* Hallazgo vinculado */}
        {item.hallazgo && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <AlertTriangle size={12} className={CRITICIDAD_COLOR[item.hallazgo.criticidad] ?? 'text-gray-500'} />
            <span className="text-xs text-gray-500">Hallazgo:</span>
            <Link
              to={rutaHallazgo}
              className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-0.5"
              onClick={e => e.stopPropagation()}
            >
              {item.hallazgo.numero_aviso}
              <ExternalLink size={10} />
            </Link>
          </div>
        )}
      </div>

      {/* Acciones (solo si puede ejecutar y no está inspeccionado) */}
      {puedeEjecutar && !item.inspeccionado && (
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <Button
            size="sm"
            onClick={() => onMarcar(item)}
            loading={cargando === item.id}
          >
            OK
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onCrearHallazgo(item)}
          >
            Hallazgo
          </Button>
        </div>
      )}
    </div>
  )
}
