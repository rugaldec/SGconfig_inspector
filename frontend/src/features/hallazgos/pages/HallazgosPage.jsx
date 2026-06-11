import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useHallazgos, useEliminarHallazgo, useRestaurarHallazgo } from '../hooks/useHallazgos'
import { hallazgosApi } from '../api'
import EstadoBadge from '../components/EstadoBadge'
import CriticidadBadge from '../components/CriticidadBadge'
import HallazgoCard from '../components/HallazgoCard'
import Spinner from '../../../shared/components/ui/Spinner'
import { useUsuarios } from '../../usuarios/hooks/useUsuarios'
import { useAuth } from '../../auth/useAuth'
import { Download, MessageSquare, GitBranch, Trash2, RotateCcw } from 'lucide-react'

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
  const { user } = useAuth()
  const [confirmando, setConfirmando] = useState(null) // hallazgo a eliminar
  const [verEliminados, setVerEliminados] = useState(false)
  const eliminar = useEliminarHallazgo()
  const restaurar = useRestaurarHallazgo()

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
    ...(verEliminados && { incluir_eliminados: 'true' }),
    page,
    limit: 20,
  })

  const items = data?.data ?? []

  function handleEliminar(e, hallazgo) {
    e.stopPropagation()
    setConfirmando(hallazgo)
  }

  async function confirmarEliminar() {
    await eliminar.mutateAsync(confirmando.id)
    setConfirmando(null)
  }

  return (
    <div>
      {/* Modal confirmación eliminar */}
      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Eliminar hallazgo</h2>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              ¿Eliminar el hallazgo <span className="font-mono font-semibold">{confirmando.numero_aviso}</span>?
            </p>
            <p className="text-xs text-gray-400 mb-6">
              El registro quedará oculto pero no se borrará permanentemente.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmando(null)}
                className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50 transition-colors"
                disabled={eliminar.isPending}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                disabled={eliminar.isPending}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {eliminar.isPending ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">
          Hallazgos
          {verEliminados && (
            <span className="ml-2 text-sm font-normal text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
              Eliminados
            </span>
          )}
        </h1>
        <div className="flex items-center gap-2">
          {user?.rol === 'ADMINISTRADOR' && (
            <button
              onClick={() => { setVerEliminados(v => !v); setFiltro('page', '1') }}
              className={`flex items-center gap-1.5 text-sm border rounded-lg px-3 py-1.5 transition-colors ${
                verEliminados
                  ? 'bg-red-50 border-red-300 text-red-600'
                  : 'text-gray-600 hover:text-red-600 hover:border-red-300'
              }`}
            >
              <Trash2 size={15} /> {verEliminados ? 'Ver activos' : 'Ver eliminados'}
            </button>
          )}
          {!verEliminados && (
            <button
              onClick={() => hallazgosApi.exportarCsv({ estado, criticidad })}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-700 border rounded-lg px-3 py-1.5 transition-colors"
            >
              <Download size={15} /> Exportar CSV
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      {!verEliminados && (
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
      )}

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
                  {user?.rol === 'ADMINISTRADOR' && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {verEliminados ? 'Restaurar' : ''}
                    </th>
                  )}
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
                    {user?.rol === 'ADMINISTRADOR' && (
                      <td className="px-2 py-3">
                        {verEliminados ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); restaurar.mutate(h.id) }}
                            title="Restaurar hallazgo"
                            disabled={restaurar.isPending}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition-colors disabled:opacity-50"
                          >
                            <RotateCcw size={13} /> Restaurar
                          </button>
                        ) : (
                          <button
                            onClick={(e) => handleEliminar(e, h)}
                            title="Eliminar hallazgo"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    )}
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
