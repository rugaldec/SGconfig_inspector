import { useNavigate, useSearchParams } from 'react-router-dom'
import { useHallazgos } from '../hooks/useHallazgos'
import { hallazgosApi } from '../api'
import EstadoBadge from '../components/EstadoBadge'
import CriticidadBadge from '../components/CriticidadBadge'
import HallazgoCard from '../components/HallazgoCard'
import Spinner from '../../../shared/components/ui/Spinner'
import { Download } from 'lucide-react'

const ESTADOS = ['ABIERTO', 'EN_GESTION', 'PENDIENTE_CIERRE', 'CERRADO', 'RECHAZADO']
const CRITICIDADES = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA']

export default function HallazgosPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  const estado = params.get('estado') || ''
  const criticidad = params.get('criticidad') || ''
  const page = Number(params.get('page') || 1)

  function setFiltro(key, val) {
    const p = new URLSearchParams(params)
    val ? p.set(key, val) : p.delete(key)
    p.set('page', '1')
    setParams(p)
  }

  const { data, isLoading } = useHallazgos({
    ...(estado && { estado }),
    ...(criticidad && { criticidad }),
    page,
    limit: 20,
  })

  const items = data?.data ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Hallazgos</h1>
        <button
          onClick={() => hallazgosApi.exportarCsv({ estado, criticidad })}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-700 border rounded-lg px-3 py-1.5 transition-colors"
        >
          <Download size={15} /> Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={estado}
          onChange={(e) => setFiltro('estado', e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>{e.replace('_', ' ')}</option>
          ))}
        </select>
        <select
          value={criticidad}
          onChange={(e) => setFiltro('criticidad', e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Toda criticidad</option>
          {CRITICIDADES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <>
          {/* Tabla — desktop */}
          <div className="hidden md:block bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Aviso', 'Ubicación', 'Estado', 'Criticidad', 'Inspector', 'Fecha'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((h) => (
                  <tr
                    key={h.id}
                    onClick={() => navigate(`/supervisor/hallazgos/${h.id}`)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{h.numero_aviso}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{h.ubicacion_tecnica.codigo}</td>
                    <td className="px-4 py-3"><EstadoBadge estado={h.estado} /></td>
                    <td className="px-4 py-3"><CriticidadBadge criticidad={h.criticidad} /></td>
                    <td className="px-4 py-3 text-gray-600">{h.inspector.nombre}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(h.fecha_creacion).toLocaleDateString('es-CL')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!items.length && (
              <p className="text-center py-12 text-gray-400">Sin hallazgos para los filtros seleccionados</p>
            )}
          </div>

          {/* Cards — móvil */}
          <div className="md:hidden space-y-3">
            {items.map((h) => (
              <HallazgoCard
                key={h.id}
                hallazgo={h}
                onClick={() => navigate(`/supervisor/hallazgos/${h.id}`)}
              />
            ))}
            {!items.length && (
              <p className="text-center py-12 text-gray-400">Sin hallazgos</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
