import EstadoBadge from './EstadoBadge'

export default function TimelineEstados({ cambios = [] }) {
  if (!cambios.length) return <p className="text-sm text-gray-400">Sin historial</p>

  return (
    <ol className="space-y-3">
      {cambios.map((c, i) => (
        <li key={c.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
            {i < cambios.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
          </div>
          <div className="pb-3 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              {c.estado_anterior && (
                <>
                  <EstadoBadge estado={c.estado_anterior} />
                  <span className="text-gray-400 text-xs">→</span>
                </>
              )}
              <EstadoBadge estado={c.estado_nuevo} />
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {c.usuario.nombre} · {new Date(c.fecha).toLocaleString('es-CL')}
            </p>
            {c.motivo && (
              <p className="text-sm text-gray-600 mt-1 italic">"{c.motivo}"</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
