import { useState } from 'react'
import { CheckCircle, XCircle, Mail, RefreshCw } from 'lucide-react'
import { useLogsCorreo } from '../hooks/useLogsCorreo'
import Spinner from '../../../shared/components/ui/Spinner'

const CRITICIDAD_CONFIG = {
  BAJA:    { label: 'Baja',    bg: 'bg-green-100',  text: 'text-green-700' },
  MEDIA:   { label: 'Media',   bg: 'bg-yellow-100', text: 'text-yellow-700' },
  ALTA:    { label: 'Alta',    bg: 'bg-orange-100', text: 'text-orange-700' },
  CRITICA: { label: 'Crítica', bg: 'bg-red-100',    text: 'text-red-700' },
}

function EstadoBadge({ estado }) {
  if (estado === 'ENVIADO') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
        <CheckCircle size={12} /> Enviado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
      <XCircle size={12} /> Error
    </span>
  )
}

export default function LogsCorreoPage() {
  const [filtroEstado, setFiltroEstado] = useState('')
  const { data, isLoading, refetch, isFetching } = useLogsCorreo(
    filtroEstado ? { estado: filtroEstado } : {}
  )

  const items = data?.items ?? []
  const total = data?.total ?? 0

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Mail size={20} className="text-blue-700" />
          <h1 className="text-xl font-bold text-gray-900">Historial de Correos</h1>
          {total > 0 && (
            <span className="text-sm text-gray-400 font-normal">({total} registros)</span>
          )}
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {['', 'ENVIADO', 'ERROR'].map(e => (
          <button
            key={e}
            onClick={() => setFiltroEstado(e)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filtroEstado === e
                ? 'bg-blue-700 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {e === '' ? 'Todos' : e === 'ENVIADO' ? 'Enviados' : 'Errores'}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Mail size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay registros de correos enviados aún.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Hallazgo</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Zona Funcional</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Destinatarios</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map(log => {
                const crit = CRITICIDAD_CONFIG[log.hallazgo?.criticidad]
                return (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    {/* Fecha */}
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(log.fecha_creacion).toLocaleString('es-CL', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>

                    {/* Hallazgo */}
                    <td className="px-4 py-3">
                      {log.hallazgo ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono font-semibold text-gray-800 text-xs">
                            {log.hallazgo.numero_aviso}
                          </span>
                          {crit && (
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full w-fit ${crit.bg} ${crit.text}`}>
                              {crit.label}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Eliminado</span>
                      )}
                    </td>

                    {/* Zona funcional */}
                    <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                      {log.zona_funcional
                        ? `${log.zona_funcional.codigo} — ${log.zona_funcional.descripcion}`
                        : <span className="text-gray-400 italic text-xs">—</span>
                      }
                    </td>

                    {/* Destinatarios */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {log.destinatarios.map(email => (
                          <span key={email} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full truncate max-w-[180px]" title={email}>
                            {email}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <EstadoBadge estado={log.estado} />
                        {log.error_mensaje && (
                          <span className="text-xs text-red-500 max-w-[200px] truncate" title={log.error_mensaje}>
                            {log.error_mensaje}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
