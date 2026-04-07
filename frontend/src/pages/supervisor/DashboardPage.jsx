import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'
import Spinner from '../../components/ui/Spinner'
import { useNavigate } from 'react-router-dom'

const ESTADOS = [
  { key: 'ABIERTO',          label: 'Abiertos',       color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { key: 'EN_GESTION',       label: 'En Gestión',      color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { key: 'PENDIENTE_CIERRE', label: 'Pend. Cierre',    color: 'bg-violet-50 border-violet-200 text-violet-700' },
  { key: 'CERRADO',          label: 'Cerrados',        color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { key: 'RECHAZADO',        label: 'Rechazados',      color: 'bg-red-50 border-red-200 text-red-700' },
]

const CRITICIDADES = [
  { key: 'CRITICA', label: 'Crítica', color: 'text-red-700' },
  { key: 'ALTA',    label: 'Alta',    color: 'text-orange-700' },
  { key: 'MEDIA',   label: 'Media',   color: 'text-amber-700' },
  { key: 'BAJA',    label: 'Baja',    color: 'text-gray-500' },
]

export default function DashboardPage() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['hallazgos-todos'],
    queryFn: () => api.get('/hallazgos?limit=500').then(r => r.data.data),
  })

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  const total = data?.length || 0
  const porEstado = Object.fromEntries(ESTADOS.map(e => [e.key, data?.filter(h => h.estado === e.key).length || 0]))
  const porCriticidad = Object.fromEntries(CRITICIDADES.map(c => [c.key, data?.filter(h => h.criticidad === c.key).length || 0]))

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-5">Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {ESTADOS.map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => navigate(`/supervisor/hallazgos?estado=${key}`)}
            className={`border rounded-xl p-4 text-left transition-shadow hover:shadow-md ${color}`}>
            <p className="text-3xl font-bold">{porEstado[key]}</p>
            <p className="text-sm font-medium mt-1">{label}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <h2 className="font-semibold text-gray-700 mb-3">Por Criticidad</h2>
          <div className="space-y-2">
            {CRITICIDADES.map(({ key, label, color }) => (
              <div key={key} className="flex items-center justify-between">
                <span className={`text-sm font-medium ${color}`}>{label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-current h-2 rounded-full transition-all"
                      style={{ width: total ? `${(porCriticidad[key] / total) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-6 text-right">{porCriticidad[key]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4">
          <h2 className="font-semibold text-gray-700 mb-3">Resumen General</h2>
          <p className="text-4xl font-bold text-gray-800">{total}</p>
          <p className="text-sm text-gray-500 mt-1">Hallazgos totales</p>
          <button
            onClick={() => navigate('/supervisor/hallazgos')}
            className="mt-4 text-sm text-blue-600 hover:underline">
            Ver todos →
          </button>
        </div>
      </div>
    </div>
  )
}
