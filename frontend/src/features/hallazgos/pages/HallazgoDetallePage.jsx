import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useHallazgoDetalle } from '../hooks/useHallazgoDetalle'
import { siguientesEstados, ESTADO_CONFIG } from '../estadoMachine'
import { cambioEstadoSchema, comentarioSchema } from '../schemas'
import { hallazgosApi } from '../api'
import EstadoBadge from '../components/EstadoBadge'
import CriticidadBadge from '../components/CriticidadBadge'
import TimelineEstados from '../components/TimelineEstados'
import Spinner from '../../../shared/components/ui/Spinner'
import Button from '../../../shared/components/ui/Button'
import Input from '../../../shared/components/ui/Input'
import { ArrowLeft, FileDown } from 'lucide-react'

function SeccionEstado({ hallazgo, mutCambiarEstado }) {
  const siguientes = siguientesEstados(hallazgo.estado)
  const [fotoDespues, setFotoDespues] = useState(null)
  const [fotoError, setFotoError] = useState('')
  const fotoInputRef = useRef(null)
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(cambioEstadoSchema),
  })
  const estadoSeleccionado = watch('estado')

  if (!siguientes.length) return null

  function onSubmit(data) {
    if (data.estado === 'CERRADO' && !fotoDespues) {
      setFotoError('La foto de cierre es obligatoria')
      return
    }
    setFotoError('')
    mutCambiarEstado.mutate(
      { ...data, fotoDespues },
      { onSuccess: () => { reset(); setFotoDespues(null); if (fotoInputRef.current) fotoInputRef.current.value = '' } }
    )
  }

  const motivoEsObligatorio = estadoSeleccionado === 'RECHAZADO'
  const requiereSap = estadoSeleccionado === 'EN_GESTION'
  const requiereFoto = estadoSeleccionado === 'CERRADO'

  return (
    <div className="bg-white rounded-xl border p-4">
      <h2 className="font-semibold text-gray-700 mb-3">Cambiar Estado</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {siguientes.map((e) => {
            const cfg = ESTADO_CONFIG[e]
            return (
              <label key={e} className="cursor-pointer">
                <input type="radio" value={e} {...register('estado')} className="sr-only" />
                <span className={`
                  inline-block px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all
                  ${estadoSeleccionado === e
                    ? `${cfg.bg} ${cfg.text} border-current`
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }
                `}>
                  {cfg.label}
                </span>
              </label>
            )
          })}
        </div>
        {errors.estado && <p className="text-xs text-red-500">{errors.estado.message}</p>}

        {estadoSeleccionado && (
          <>
            {requiereSap && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de aviso SAP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: 10012345"
                  className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.numero_aviso_sap ? 'border-red-400' : ''}`}
                  {...register('numero_aviso_sap')}
                />
                {errors.numero_aviso_sap && <p className="text-xs text-red-500 mt-0.5">{errors.numero_aviso_sap.message}</p>}
              </div>
            )}

            <div>
              <textarea
                rows={2}
                placeholder={motivoEsObligatorio ? 'Motivo del rechazo (obligatorio)' : 'Motivo del cambio (opcional)'}
                className={`w-full border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.motivo ? 'border-red-400' : ''}`}
                {...register('motivo')}
              />
              {motivoEsObligatorio && !errors.motivo && (
                <p className="text-xs text-red-500 mt-0.5">Obligatorio al rechazar</p>
              )}
              {errors.motivo && <p className="text-xs text-red-500 mt-0.5">{errors.motivo.message}</p>}
            </div>

            {requiereFoto && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Foto de cierre <span className="text-red-500">*</span>
                </label>
                <input
                  ref={fotoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  onChange={(e) => { setFotoDespues(e.target.files[0] || null); setFotoError('') }}
                />
                {fotoDespues && (
                  <p className="text-xs text-emerald-600 mt-1">{fotoDespues.name}</p>
                )}
                {fotoError && <p className="text-xs text-red-500 mt-0.5">{fotoError}</p>}
              </div>
            )}

            <Button type="submit" size="sm" loading={mutCambiarEstado.isPending}>
              Confirmar cambio
            </Button>
            {mutCambiarEstado.isError && (
              <p className="text-xs text-red-500">{mutCambiarEstado.error?.response?.data?.message}</p>
            )}
          </>
        )}
      </form>
    </div>
  )
}

function SeccionSap({ hallazgo, mutAsignarSap }) {
  const [valor, setValor] = useState('')

  function guardar() {
    if (!valor.trim()) return
    mutAsignarSap.mutate(valor.trim(), { onSuccess: () => setValor('') })
  }

  return (
    <div className="bg-white rounded-xl border p-4">
      <h2 className="font-semibold text-gray-700 mb-3">Número Aviso SAP</h2>
      {hallazgo.numero_aviso_sap && (
        <p className="text-sm text-blue-700 font-mono mb-2 bg-blue-50 px-2 py-1 rounded-lg inline-block">
          {hallazgo.numero_aviso_sap}
        </p>
      )}
      <div className="flex gap-2">
        <input
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder={hallazgo.numero_aviso_sap ? 'Actualizar...' : 'Ingresar número SAP...'}
          className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button size="sm" onClick={guardar} loading={mutAsignarSap.isPending} disabled={!valor.trim()}>
          Guardar
        </Button>
      </div>
    </div>
  )
}

function SeccionComentarios({ hallazgo, mutComentario }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(comentarioSchema),
  })

  function onSubmit(data) {
    mutComentario.mutate(data.texto, { onSuccess: () => reset() })
  }

  return (
    <div className="bg-white rounded-xl border p-4">
      <h2 className="font-semibold text-gray-700 mb-3">Comentarios</h2>
      <div className="space-y-3 mb-4">
        {hallazgo.comentarios.map((c) => (
          <div key={c.id} className="bg-gray-50 rounded-xl p-3">
            <p className="text-sm text-gray-800">{c.texto}</p>
            <p className="text-xs text-gray-400 mt-1">
              {c.autor.nombre} · {new Date(c.fecha_creacion).toLocaleString('es-CL')}
            </p>
          </div>
        ))}
        {!hallazgo.comentarios.length && (
          <p className="text-sm text-gray-400">Sin comentarios aún</p>
        )}
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2">
        <input
          placeholder="Agregar comentario..."
          className={`flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.texto ? 'border-red-400' : ''}`}
          {...register('texto')}
        />
        <Button type="submit" size="sm" loading={mutComentario.isPending}>
          Enviar
        </Button>
      </form>
    </div>
  )
}

export default function HallazgoDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { query, mutCambiarEstado, mutAsignarSap, mutComentario } = useHallazgoDetalle(id)
  const { data: h, isLoading } = query
  const [exporting, setExporting] = useState(false)

  async function handleExportarPdf() {
    setExporting(true)
    try { await hallazgosApi.exportarPdf(h.id) }
    finally { setExporting(false) }
  }

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  if (!h) return <p className="text-center py-16 text-gray-400">Hallazgo no encontrado</p>

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft size={16} /> Volver
        </button>
        <Button variant="secondary" size="sm" loading={exporting} onClick={handleExportarPdf}>
          <FileDown size={15} /> Exportar PDF
        </Button>
      </div>

      {/* Encabezado */}
      <div className="bg-white rounded-xl border p-5">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="font-mono text-sm text-gray-400">{h.numero_aviso}</span>
          {h.numero_aviso_sap && (
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              SAP: {h.numero_aviso_sap}
            </span>
          )}
          <EstadoBadge estado={h.estado} />
          <CriticidadBadge criticidad={h.criticidad} />
        </div>
        <h1 className="font-semibold text-gray-800 mb-1">
          {h.ubicacion_tecnica.codigo} — {h.ubicacion_tecnica.descripcion}
        </h1>
        <p className="text-sm text-gray-600 leading-relaxed">{h.descripcion}</p>
        <p className="text-xs text-gray-400 mt-2">
          Inspector: {h.inspector.nombre} · {new Date(h.fecha_creacion).toLocaleString('es-CL')}
        </p>
      </div>

      {/* Foto inicial */}
      <div className="rounded-xl overflow-hidden border bg-gray-50">
        <p className="text-xs text-gray-500 px-4 pt-3 font-medium">Foto del hallazgo</p>
        <img src={h.foto_url} alt="Foto del hallazgo" className="w-full max-h-80 object-cover" />
      </div>

      {/* Foto de cierre */}
      {h.foto_despues_url && (
        <div className="rounded-xl overflow-hidden border bg-emerald-50">
          <p className="text-xs text-emerald-700 px-4 pt-3 font-medium">Foto de cierre</p>
          <img src={h.foto_despues_url} alt="Foto de cierre" className="w-full max-h-80 object-cover" />
        </div>
      )}

      <SeccionEstado hallazgo={h} mutCambiarEstado={mutCambiarEstado} />
      <SeccionSap hallazgo={h} mutAsignarSap={mutAsignarSap} />

      {/* Timeline */}
      <div className="bg-white rounded-xl border p-4">
        <h2 className="font-semibold text-gray-700 mb-3">Historial de Estados</h2>
        <TimelineEstados cambios={h.cambios_estado} />
      </div>

      <SeccionComentarios hallazgo={h} mutComentario={mutComentario} />
    </div>
  )
}
