import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../api/client'
import EstadoBadge from '../../components/hallazgo/EstadoBadge'
import CriticidadBadge from '../../components/hallazgo/CriticidadBadge'
import Spinner from '../../components/ui/Spinner'
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
    if (val) p.set(key, val); else p.delete(key)
    p.set('page', '1')
    setParams(p)
  }

  const queryStr = [
    estado && `estado=${estado}`,
    criticidad && `criticidad=${criticidad}`,
    `page=${page}`,
    'limit=20',
  ].filter(Boolean).join('&')

  const { data, isLoading } = useQuery({
    queryKey: ['hallazgos', queryStr],
    queryFn: () => api.get(`/hallazgos?${queryStr}`).then(r => r.data),
  })

  function exportar() {
    const q = [estado && `estado=${estado}`, criticidad && `criticidad=${criticidad}`].filter(Boolean).join('&')
    window.location.href = `/api/hallazgos/export?${q}`
  }

  const items = data?.data || []

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Hallazgos</h1>
        <button onClick={exportar} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-700 border rounded-lg px-3 py-1.5">
          <Download size={15} /> Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select value={estado} onChange={e => setFiltro('estado', e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => <option key={e} value={e}>{e.replace('_', ' ')}</option>)}
        </select>
        <select value={criticidad} onChange={e => setFiltro('criticidad', e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Toda criticidad</option>
          {CRITICIDADES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <>
          {/* Tabla desktop */}
          <div className="hidden md:block bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Aviso</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ubicación</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Criticidad</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Inspector</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map(h => (
                  <tr key={h.id} onClick={() => navigate(`/supervisor/hallazgos/${h.id}`)}
                    className="hover:bg-blue-50 cursor-pointer">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{h.numero_aviso}</td>
                    <td className="px-4 py-3 text-gray-800">{h.ubicacion_tecnica.codigo}</td>
                    <td className="px-4 py-3"><EstadoBadge estado={h.estado} /></td>
                    <td className="px-4 py-3"><CriticidadBadge criticidad={h.criticidad} /></td>
                    <td className="px-4 py-3 text-gray-600">{h.inspector.nombre}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(h.fecha_creacion).toLocaleDateString('es-CL')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length === 0 && <p className="text-center py-12 text-gray-400">Sin hallazgos</p>}
          </div>

          {/* Cards móvil */}
          <div className="md:hidden space-y-3">
            {items.map(h => (
              <button key={h.id} onClick={() => navigate(`/supervisor/hallazgos/${h.id}`)}
                className="w-full text-left bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <p className="font-mono text-xs text-gray-500">{h.numero_aviso}</p>
                  <div className="flex gap-1">
                    <EstadoBadge estado={h.estado} />
                    <CriticidadBadge criticidad={h.criticidad} />
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-800">{h.ubicacion_tecnica.codigo}</p>
                <p className="text-xs text-gray-500 mt-1">{h.inspector.nombre} · {new Date(h.fecha_creacion).toLocaleDateString('es-CL')}</p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
