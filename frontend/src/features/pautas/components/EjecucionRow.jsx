import { useNavigate } from 'react-router-dom'
import { ChevronRight, AlertCircle } from 'lucide-react'
import EstadoEjecucionBadge from './EstadoEjecucionBadge'
import ProgresoPauta from './ProgresoPauta'

export default function EjecucionRow({ ejecucion, pautaId }) {
  const navigate = useNavigate()
  const { cobertura, inspectores, hallazgos_count, estado } = ejecucion
  const venceProximo = estado === 'EN_CURSO' || estado === 'PENDIENTE'
    ? (new Date(ejecucion.fecha_fin) - new Date()) / (1000 * 60 * 60 * 24) <= 2
    : false

  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer"
      onClick={() => navigate(`/supervisor/ejecuciones/${ejecucion.id}`)}
    >
      <td className="px-4 py-3 text-sm text-gray-700">
        <div className="flex items-center gap-1.5">
          {venceProximo && <AlertCircle size={13} className="text-amber-500 flex-shrink-0" />}
          {new Date(ejecucion.fecha_inicio).toLocaleDateString('es-CL')}
          {' — '}
          {new Date(ejecucion.fecha_fin).toLocaleDateString('es-CL')}
        </div>
        {ejecucion.fecha_completada && (
          <div className="text-xs text-gray-400 mt-0.5">
            Cerrada: {new Date(ejecucion.fecha_completada).toLocaleString('es-CL')}
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <EstadoEjecucionBadge estado={estado} />
      </td>
      <td className="px-4 py-3">
        <ProgresoPauta
          inspeccionados={cobertura?.inspeccionados ?? 0}
          total={cobertura?.total ?? 0}
          size="sm"
        />
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {inspectores?.length > 0
          ? inspectores.map(i => i.nombre).join(', ')
          : <span className="text-gray-300">—</span>}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {hallazgos_count > 0
          ? <span className="text-amber-600 font-medium">{hallazgos_count}</span>
          : <span className="text-gray-300">—</span>}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {ejecucion.creado_por?.nombre}
      </td>
      <td className="px-4 py-3">
        <ChevronRight size={15} className="text-gray-400" />
      </td>
    </tr>
  )
}
