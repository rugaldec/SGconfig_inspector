import { useNavigate, useSearchParams } from 'react-router-dom'
import { useHallazgos } from '../hooks/useHallazgos'
import { hallazgosApi } from '../api'
import EstadoBadge from '../components/EstadoBadge'
import CriticidadBadge from '../components/CriticidadBadge'
import HallazgoCard from '../components/HallazgoCard'
import Spinner from '../../../shared/components/ui/Spinner'
import { useUsuarios } from '../../usuarios/hooks/useUsuarios'
import { Download, MessageSquare, GitBranch } from 'lucide-react'

function UltimoComentarioTooltip({ hallazgo }) {
  const count = hallazgo._count?.comentarios ?? 0
  const ultimo = hallazgo.comentarios?.[0]

  return (
    <span className="relative group flex items-center gap-1 text-xs text-gray-500 cursor-default">
      <MessageSquare size={12} className="text-emerald-400" />
      {count}
      {ultimo && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-56 pointer-events-none">
          <div className="bg-gray-900 text-white text-xs rounded-xl p-3 shadow-lg">
            <p className="font-medium text-gray-300 mb-1">
              {ultimo.autor.nombre} · {new Date(ultimo.fecha_creacion ?? Date.now()).toLocaleDateString('es-CL')}
            </p>
            <p className="line-clamp-3 leading-relaxed">{ultimo.texto}</p>
          </div>
          <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1" />
        </div>
      )}
    </span>
  )
}

const ESTADOS = ['ABIERTO', 'EN_GESTION', 'PENDIENTE_CIERRE', 'CERRADO', 'RECHAZADO']
const CRITICIDADES = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA']

export default function HallazgosPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  const estado = params.get('estado') || ''
  const criticidad = params.get('criticidad') || ''
  const inspector_id = params.get('inspector_id') || ''
  const page = Number(params.get('page') || 1)

  const { data: usuarios } = useUsuarios()

  function setFiltro(key, val) {
    const p = new URLSearchParams(params)
    val ? p.set(key, val) : p.delete(key)
    p.set('page', '1')
    setParams(p)
  }

  const { data, isLoading } = useHallazgos({
    ...(estado && { estado }),
    ...(criticidad && { criticidad }),
    ...(inspector_id && { inspector_id }),
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
        <select
          value={inspector_id}
          onChange={(e) => setFiltro('inspector_id', e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Todo inspector</option>
          {(usuarios ?? []).map((u) => (
            <option key={u.id} value={u.id}>{u.nombre}</option>
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
                  {['Foto', 'Aviso', 'Ubicación', 'Estado', 'Criticidad', 'Inspector', 'Actividad', 'Fecha'].map((h) => (
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
                    <td className="px-2 py-1.5">
                      {h.foto_url
                        ? <img src={h.foto_url} alt="foto" className="w-12 h-12 object-cover rounded-lg border border-gray-200" />
                        : <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-xs">—</div>
                      }
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{h.numero_aviso}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{h.ubicacion_tecnica.codigo}</td>
                    <td className="px-4 py-3"><EstadoBadge estado={h.estado} /></td>
                    <td className="px-4 py-3"><CriticidadBadge criticidad={h.criticidad} /></td>
                    <td className="px-4 py-3 text-gray-600">{h.inspector.nombre}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-xs text-gray-500" title="Cambios de estado">
                          <GitBranch size={12} className="text-blue-400" />
                          {h._count?.cambios_estado ?? 0}
                        </span>
                        <UltimoComentarioTooltip hallazgo={h} />
                      </div>
                    </td>
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
