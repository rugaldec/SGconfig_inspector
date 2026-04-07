import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../api/client'
import EstadoBadge from '../../components/hallazgo/EstadoBadge'
import CriticidadBadge from '../../components/hallazgo/CriticidadBadge'
import TimelineEstados from '../../components/hallazgo/TimelineEstados'
import Spinner from '../../components/ui/Spinner'
import { ArrowLeft } from 'lucide-react'

const TRANSICIONES = {
  ABIERTO:          ['EN_GESTION', 'RECHAZADO'],
  EN_GESTION:       ['PENDIENTE_CIERRE', 'RECHAZADO'],
  PENDIENTE_CIERRE: ['CERRADO', 'EN_GESTION'],
  CERRADO:          [],
  RECHAZADO:        [],
}

const LABEL_ESTADO = {
  EN_GESTION: 'En Gestión', PENDIENTE_CIERRE: 'Pend. Cierre',
  CERRADO: 'Cerrado', RECHAZADO: 'Rechazado', ABIERTO: 'Abierto',
}

export default function HallazgoDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [nuevoEstado, setNuevoEstado] = useState('')
  const [motivo, setMotivo] = useState('')
  const [numeroSap, setNumeroSap] = useState('')
  const [comentario, setComentario] = useState('')

  const { data: h, isLoading } = useQuery({
    queryKey: ['hallazgo', id],
    queryFn: () => api.get(`/hallazgos/${id}`).then(r => r.data.data),
  })

  const invalidar = () => qc.invalidateQueries({ queryKey: ['hallazgo', id] })

  const mutEstado = useMutation({
    mutationFn: () => api.patch(`/hallazgos/${id}/estado`, { estado: nuevoEstado, motivo }),
    onSuccess: () => { invalidar(); setNuevoEstado(''); setMotivo('') },
  })

  const mutSap = useMutation({
    mutationFn: () => api.patch(`/hallazgos/${id}/sap`, { numero_aviso_sap: numeroSap }),
    onSuccess: () => { invalidar(); setNumeroSap('') },
  })

  const mutComentario = useMutation({
    mutationFn: () => api.post(`/hallazgos/${id}/comentarios`, { texto: comentario }),
    onSuccess: () => { invalidar(); setComentario('') },
  })

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  if (!h) return <p className="text-center py-16 text-gray-400">Hallazgo no encontrado</p>

  const siguientes = TRANSICIONES[h.estado] || []

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-700 mb-4">
        <ArrowLeft size={16} /> Volver
      </button>

      {/* Encabezado */}
      <div className="bg-white rounded-xl border p-5 mb-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="font-mono text-sm text-gray-500">{h.numero_aviso}</span>
          {h.numero_aviso_sap && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">SAP: {h.numero_aviso_sap}</span>}
          <EstadoBadge estado={h.estado} />
          <CriticidadBadge criticidad={h.criticidad} />
        </div>
        <h1 className="font-semibold text-gray-800 mb-1">{h.ubicacion_tecnica.codigo} — {h.ubicacion_tecnica.descripcion}</h1>
        <p className="text-sm text-gray-600">{h.descripcion}</p>
        <p className="text-xs text-gray-400 mt-2">Inspector: {h.inspector.nombre} · {new Date(h.fecha_creacion).toLocaleString('es-CL')}</p>
      </div>

      {/* Foto */}
      <div className="mb-4 rounded-xl overflow-hidden border">
        <img src={h.foto_url} alt="Hallazgo" className="w-full max-h-72 object-cover" />
      </div>

      {/* Cambiar estado */}
      {siguientes.length > 0 && (
        <div className="bg-white rounded-xl border p-4 mb-4">
          <h2 className="font-semibold text-gray-700 mb-3">Cambiar Estado</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {siguientes.map(e => (
              <button key={e} type="button" onClick={() => setNuevoEstado(e)}
                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${nuevoEstado === e ? 'bg-blue-800 text-white border-blue-800' : 'border-gray-300 text-gray-700 hover:border-blue-400'}`}>
                {LABEL_ESTADO[e]}
              </button>
            ))}
          </div>
          {nuevoEstado && (
            <div className="space-y-2">
              <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={2}
                placeholder="Motivo del cambio (opcional)"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              <button onClick={() => mutEstado.mutate()} disabled={mutEstado.isPending}
                className="bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 disabled:opacity-60 flex items-center gap-2">
                {mutEstado.isPending && <Spinner size="sm" />} Confirmar Cambio
              </button>
              {mutEstado.isError && <p className="text-red-500 text-xs">{mutEstado.error?.response?.data?.message}</p>}
            </div>
          )}
        </div>
      )}

      {/* Número SAP */}
      <div className="bg-white rounded-xl border p-4 mb-4">
        <h2 className="font-semibold text-gray-700 mb-3">Número Aviso SAP</h2>
        <div className="flex gap-2">
          <input value={numeroSap} onChange={e => setNumeroSap(e.target.value)}
            placeholder={h.numero_aviso_sap || 'Ingresa el número SAP...'}
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={() => mutSap.mutate()} disabled={!numeroSap.trim() || mutSap.isPending}
            className="bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60 flex items-center gap-2">
            {mutSap.isPending && <Spinner size="sm" />} Guardar
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border p-4 mb-4">
        <h2 className="font-semibold text-gray-700 mb-3">Historial de Estados</h2>
        <TimelineEstados cambios={h.cambios_estado} />
      </div>

      {/* Comentarios */}
      <div className="bg-white rounded-xl border p-4">
        <h2 className="font-semibold text-gray-700 mb-3">Comentarios</h2>
        <div className="space-y-3 mb-4">
          {h.comentarios.map(c => (
            <div key={c.id} className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-800">{c.texto}</p>
              <p className="text-xs text-gray-400 mt-1">{c.autor.nombre} · {new Date(c.fecha_creacion).toLocaleString('es-CL')}</p>
            </div>
          ))}
          {h.comentarios.length === 0 && <p className="text-sm text-gray-400">Sin comentarios aún</p>}
        </div>
        <div className="flex gap-2">
          <input value={comentario} onChange={e => setComentario(e.target.value)}
            placeholder="Agregar comentario..."
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={() => mutComentario.mutate()} disabled={!comentario.trim() || mutComentario.isPending}
            className="bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60 flex items-center gap-2">
            {mutComentario.isPending && <Spinner size="sm" />} Enviar
          </button>
        </div>
      </div>
    </div>
  )
}
