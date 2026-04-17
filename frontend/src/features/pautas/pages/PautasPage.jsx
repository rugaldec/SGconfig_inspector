import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardCheck, PlusCircle, ChevronRight, Trash2, AlertTriangle } from 'lucide-react'
import { usePautas, useDesactivarPauta, useEliminarPauta } from '../hooks/usePautas'
import { useDisciplinas } from '../../disciplinas/hooks/useDisciplinas'
import { useAuth } from '../../auth/useAuth'
import Button from '../../../shared/components/ui/Button'
import Modal from '../../../shared/components/ui/Modal'
import Spinner from '../../../shared/components/ui/Spinner'

export default function PautasPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [disciplinaFiltro, setDisciplinaFiltro] = useState('')
  const [tab, setTab] = useState('activas')
  const [pautaAEliminar, setPautaAEliminar] = useState(null)
  const [confirmarEliminacionTotal, setConfirmarEliminacionTotal] = useState(false)

  const { data: todasDisciplinas } = useDisciplinas()
  const desactivar = useDesactivarPauta()
  const eliminar   = useEliminarPauta()

  const disciplinas = useMemo(() => {
    if (user?.rol === 'INSPECTOR' && user?.disciplinas?.length > 0) {
      return user.disciplinas.map(d => ({ id: d.disciplina_id, nombre: d.disciplina?.nombre }))
    }
    return todasDisciplinas ?? []
  }, [user, todasDisciplinas])

  const disciplinaActual = useMemo(() => {
    if (user?.rol === 'INSPECTOR' && disciplinas.length === 1 && !disciplinaFiltro) {
      return disciplinas[0].id
    }
    return disciplinaFiltro
  }, [user, disciplinas, disciplinaFiltro])

  const filtros = {}
  if (disciplinaActual) filtros.disciplina_id = disciplinaActual

  const { data, isLoading } = usePautas(filtros)
  const todasPautas = data?.pautas ?? []

  const activas   = todasPautas.filter(p => p.activo)
  const inactivas = todasPautas.filter(p => !p.activo)
  const pautas    = tab === 'activas' ? activas : inactivas

  const esInspector = user?.rol === 'INSPECTOR'
  const esAdmin = user?.rol === 'ADMINISTRADOR'
  const mostrarFiltro = !esInspector || (disciplinas.length > 1)

  function cerrarModal() {
    setPautaAEliminar(null)
    setConfirmarEliminacionTotal(false)
    desactivar.reset()
    eliminar.reset()
  }

  function handleDesactivar() {
    desactivar.mutate(pautaAEliminar.id, { onSuccess: cerrarModal })
  }

  function handleEliminar() {
    eliminar.mutate(pautaAEliminar.id, { onSuccess: cerrarModal })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <ClipboardCheck size={20} /> Pautas de Inspección
        </h1>
        {!esInspector && (
          <Button size="sm" onClick={() => navigate('/admin/pautas/nueva')}>
            <PlusCircle size={15} /> Nueva Pauta
          </Button>
        )}
      </div>

      {/* Filtro disciplina + pestañas */}
      <div className="flex items-end justify-between gap-3 flex-wrap mb-0">
        {mostrarFiltro && (
          <select
            className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={disciplinaFiltro}
            onChange={e => setDisciplinaFiltro(e.target.value)}
          >
            <option value="">Todas las disciplinas</option>
            {disciplinas?.map(d => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </select>
        )}
      </div>

      {/* Pestañas */}
      <div className="flex gap-1 mt-4 border-b border-gray-200">
        {[
          { key: 'activas',   label: 'Activas',   count: activas.length },
          { key: 'inactivas', label: 'Inactivas', count: inactivas.length },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              tab === key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden mt-4">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Nombre', 'Disciplina', 'UBTs', 'Ejecuciones', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pautas.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td
                    className="px-4 py-3 font-medium text-gray-800 cursor-pointer"
                    onClick={() => navigate(`/admin/pautas/${p.id}`)}
                  >
                    {p.nombre}
                  </td>
                  <td className="px-4 py-3 cursor-pointer" onClick={() => navigate(`/admin/pautas/${p.id}`)}>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                      {p.disciplina?.nombre}
                    </span>
                  </td>
                  <td className="px-4 py-3 cursor-pointer" onClick={() => navigate(`/admin/pautas/${p.id}`)}>
                    {p._count?.ubts ?? 0}
                  </td>
                  <td className="px-4 py-3 cursor-pointer" onClick={() => navigate(`/admin/pautas/${p.id}`)}>
                    {p._count?.ejecuciones ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {esAdmin && (
                        <button
                          onClick={e => { e.stopPropagation(); setPautaAEliminar(p) }}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar pauta"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                      <ChevronRight
                        size={15}
                        className="text-gray-400 cursor-pointer"
                        onClick={() => navigate(`/admin/pautas/${p.id}`)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {pautas.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-sm">
                    No hay pautas {tab === 'activas' ? 'activas' : 'inactivas'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal gestionar pauta */}
      <Modal open={!!pautaAEliminar} onClose={cerrarModal} title="Gestionar pauta">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Pauta: <span className="font-semibold text-gray-800">"{pautaAEliminar?.nombre}"</span>
          </p>

          {(pautaAEliminar?._count?.ejecuciones ?? 0) === 0 ? (
            /* Sin historial — solo eliminar */
            <>
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm text-red-700">
                Esta acción es irreversible. Se eliminarán la pauta y todos sus componentes configurados.
              </div>
              {eliminar.error && <p className="text-xs text-red-500">{eliminar.error?.response?.data?.message || 'Error al eliminar'}</p>}
              <div className="flex gap-3">
                <Button variant="secondary" size="full" onClick={cerrarModal}>Cancelar</Button>
                <Button variant="danger" size="full" loading={eliminar.isPending} onClick={handleEliminar}>
                  Eliminar definitivamente
                </Button>
              </div>
            </>
          ) : !confirmarEliminacionTotal ? (
            /* Con historial — mostrar las dos opciones */
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-sm text-amber-700">
                Esta pauta tiene <strong>{pautaAEliminar?._count?.ejecuciones} ejecución(es)</strong> registradas.
              </div>
              <div className="space-y-2">
                {/* Opción 1: Desactivar */}
                <button
                  onClick={handleDesactivar}
                  disabled={desactivar.isPending}
                  className="w-full text-left border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <p className="text-sm font-semibold text-gray-800">Desactivar pauta</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    La pauta deja de estar disponible. El historial de ejecuciones se conserva. Las rondas activas se cierran automáticamente.
                  </p>
                </button>
                {/* Opción 2: Eliminar definitivo */}
                <button
                  onClick={() => setConfirmarEliminacionTotal(true)}
                  className="w-full text-left border border-red-200 rounded-xl px-4 py-3 hover:bg-red-50 transition-colors"
                >
                  <p className="text-sm font-semibold text-red-600">Eliminar definitivamente</p>
                  <p className="text-xs text-red-400 mt-0.5">
                    Se borra la pauta y todo su historial de ejecuciones. Esta acción no se puede deshacer.
                  </p>
                </button>
              </div>
              {desactivar.error && <p className="text-xs text-red-500">{desactivar.error?.response?.data?.message || 'Error'}</p>}
              <Button variant="secondary" size="full" onClick={cerrarModal}>Cancelar</Button>
            </>
          ) : (
            /* Confirmación de eliminación definitiva */
            <>
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-3 py-3">
                <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700 space-y-1">
                  <p className="font-semibold">¿Estás seguro?</p>
                  <p>Se eliminarán permanentemente:</p>
                  <ul className="list-disc list-inside text-xs space-y-0.5 text-red-600">
                    <li>La pauta y sus componentes configurados</li>
                    <li><strong>{pautaAEliminar?._count?.ejecuciones} ejecución(es)</strong> y todos sus registros de inspección</li>
                    <li>Fotos, checklists y observaciones asociadas</li>
                  </ul>
                </div>
              </div>
              {eliminar.error && <p className="text-xs text-red-500">{eliminar.error?.response?.data?.message || 'Error al eliminar'}</p>}
              <div className="flex gap-3">
                <Button variant="secondary" size="full" onClick={() => setConfirmarEliminacionTotal(false)}>
                  Volver
                </Button>
                <Button variant="danger" size="full" loading={eliminar.isPending} onClick={handleEliminar}>
                  Sí, eliminar todo
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
