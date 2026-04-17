import { useState } from 'react'
import { History } from 'lucide-react'
import { useHistorialEjecuciones } from '../hooks/usePautas'
import EjecucionRow from './EjecucionRow'
import Spinner from '../../../shared/components/ui/Spinner'
import Button from '../../../shared/components/ui/Button'

export default function HistorialEjecuciones({ pautaId }) {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useHistorialEjecuciones(pautaId, { page, limit: 10 })

  if (isLoading) return <div className="flex justify-center py-8"><Spinner size="md" /></div>

  const { ejecuciones = [], total = 0, limit = 10 } = data ?? {}
  const totalPages = Math.ceil(total / limit)

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
        <History size={32} />
        <p className="text-sm">No hay ejecuciones registradas para esta pauta</p>
      </div>
    )
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Período', 'Estado', 'Cobertura', 'Inspectores', 'Hallazgos', 'Programada por', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ejecuciones.map(e => (
              <EjecucionRow key={e.id} ejecucion={e} pautaId={pautaId} />
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-500">
          <span>{total} ejecuciones en total</span>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
              Anterior
            </Button>
            <span className="flex items-center px-2">
              {page} / {totalPages}
            </span>
            <Button size="sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
