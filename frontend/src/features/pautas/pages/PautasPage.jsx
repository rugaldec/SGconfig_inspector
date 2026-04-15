import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardCheck, PlusCircle, ChevronRight } from 'lucide-react'
import { usePautas } from '../hooks/usePautas'
import { useDisciplinas } from '../../disciplinas/hooks/useDisciplinas'
import Button from '../../../shared/components/ui/Button'
import Spinner from '../../../shared/components/ui/Spinner'

export default function PautasPage() {
  const navigate = useNavigate()
  const [filtros, setFiltros] = useState({ activo: undefined, disciplina_id: '' })
  const { data, isLoading } = usePautas(filtros.disciplina_id ? filtros : {})
  const { data: disciplinas } = useDisciplinas()

  const { pautas = [], total = 0 } = data ?? {}

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <ClipboardCheck size={20} /> Pautas de Inspección
        </h1>
        <Button size="sm" onClick={() => navigate('/supervisor/pautas/nueva')}>
          <PlusCircle size={15} /> Nueva Pauta
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select
          className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filtros.disciplina_id}
          onChange={e => setFiltros(f => ({ ...f, disciplina_id: e.target.value }))}
        >
          <option value="">Todas las disciplinas</option>
          {disciplinas?.map(d => (
            <option key={d.id} value={d.id}>{d.nombre}</option>
          ))}
        </select>
        <select
          className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filtros.activo ?? ''}
          onChange={e => setFiltros(f => ({ ...f, activo: e.target.value === '' ? undefined : e.target.value === 'true' }))}
        >
          <option value="">Activas e inactivas</option>
          <option value="true">Solo activas</option>
          <option value="false">Solo inactivas</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Nombre', 'Disciplina', 'Zona Funcional', 'UBTs', 'Ejecuciones', 'Estado', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pautas.map(p => (
                <tr
                  key={p.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/supervisor/pautas/${p.id}`)}
                >
                  <td className="px-4 py-3 font-medium text-gray-800">{p.nombre}</td>
                  <td className="px-4 py-3">
                    <span className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">
                      {p.disciplina?.nombre}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    <span className="text-xs font-mono text-gray-400">{p.zona_funcional?.codigo}</span>
                    {' '}
                    {p.zona_funcional?.descripcion}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p._count?.ubts ?? 0}</td>
                  <td className="px-4 py-3 text-gray-600">{p._count?.ejecuciones ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      p.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {p.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ChevronRight size={15} className="text-gray-400" />
                  </td>
                </tr>
              ))}
              {pautas.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">
                    No hay pautas registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
