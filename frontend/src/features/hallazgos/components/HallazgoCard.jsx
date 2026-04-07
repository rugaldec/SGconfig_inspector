import EstadoBadge from './EstadoBadge'
import CriticidadBadge from './CriticidadBadge'
import { CATEGORIA_CONFIG } from '../estadoMachine'

export default function HallazgoCard({ hallazgo, onClick, pendiente = false }) {
  const fotoUrl = hallazgo.foto_url ?? hallazgo.foto?.url

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden ${
        pendiente ? 'border-amber-200' : 'border-gray-200'
      }`}
    >
      <div className="flex items-stretch gap-0">
        {fotoUrl && (
          <img
            src={fotoUrl}
            alt="foto"
            className="w-20 h-20 object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0 p-3">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              {pendiente ? (
                <p className="text-xs text-amber-600 font-medium mb-0.5">Pendiente sincronización</p>
              ) : (
                <p className="text-xs font-mono text-gray-400">{hallazgo.numero_aviso}</p>
              )}
              <p className="text-sm font-medium text-gray-800 truncate">
                {hallazgo.ubicacion_tecnica?.codigo ?? hallazgo.ubicacion?.codigo}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              {!pendiente && <EstadoBadge estado={hallazgo.estado} />}
              <CriticidadBadge criticidad={hallazgo.criticidad} />
            </div>
          </div>
          {hallazgo.categoria && (() => {
            const cfg = CATEGORIA_CONFIG[hallazgo.categoria]
            return cfg ? (
              <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-1 ${cfg.bg} ${cfg.text}`}>
                {cfg.label}
              </span>
            ) : null
          })()}
          <p className="text-sm text-gray-600 line-clamp-2">{hallazgo.descripcion}</p>
          {!pendiente && (
            <p className="text-xs text-gray-400 mt-1">
              {new Date(hallazgo.fecha_creacion).toLocaleDateString('es-CL')}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}
