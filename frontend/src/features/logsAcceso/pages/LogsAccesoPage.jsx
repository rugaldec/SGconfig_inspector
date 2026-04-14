import { useState } from 'react'
import { useLogsAcceso } from '../hooks/useLogsAcceso'
import Spinner from '../../../shared/components/ui/Spinner'
import { CheckCircle2, XCircle, Shield } from 'lucide-react'

const ROL_BADGE = {
  ADMINISTRADOR: 'bg-purple-100 text-purple-700',
  SUPERVISOR:    'bg-blue-100 text-blue-700',
  INSPECTOR:     'bg-green-100 text-green-700',
}

export default function LogsAccesoPage() {
  const [filtroExito, setFiltroExito] = useState('')
  const [page, setPage] = useState(1)

  const params = { page, limit: 50 }
  if (filtroExito !== '') params.exitoso = filtroExito

  const { data, isLoading } = useLogsAcceso(params)
  const logs = data?.logs ?? []
  const total = data?.total ?? 0

  const totalPages = Math.ceil(total / 50)

  const selectCls = 'border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'

  function handleFiltro(e) {
    setFiltroExito(e.target.value)
    setPage(1)
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-blue-600" />
          <h1 className="text-xl font-bold text-gray-800">Log de Accesos</h1>
          {total > 0 && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {total} registros
            </span>
          )}
        </div>
        <select value={filtroExito} onChange={handleFiltro} className={selectCls}>
          <option value="">Todos los intentos</option>
          <option value="true">Solo exitosos</option>
          <option value="false">Solo fallidos</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : logs.length === 0 ? (
        <p className="text-center py-12 text-sm text-gray-400">Sin registros de acceso</p>
      ) : (
        <>
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Fecha', 'Email', 'Usuario', 'Rol', 'IP', 'Estado', 'Motivo'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map(log => (
                    <tr key={log.id} className={`hover:bg-gray-50 ${!log.exitoso ? 'bg-red-50/40' : ''}`}>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap font-mono text-xs">
                        {new Date(log.fecha).toLocaleString('es-CL')}
                      </td>
                      <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate" title={log.email}>
                        {log.email}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {log.usuario?.nombre ?? <span className="text-gray-400 italic">Desconocido</span>}
                      </td>
                      <td className="px-4 py-3">
                        {log.usuario?.rol ? (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROL_BADGE[log.usuario.rol]}`}>
                            {log.usuario.rol}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs whitespace-nowrap">
                        {log.ip ?? '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {log.exitoso ? (
                          <span className="flex items-center gap-1 text-emerald-600 font-medium">
                            <CheckCircle2 size={14} /> Exitoso
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-500 font-medium">
                            <XCircle size={14} /> Fallido
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {log.motivo ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
