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
import { ArrowLeft, FileDown, Camera, X } from 'lucide-react'

function SeccionEstado({ hallazgo, mutCambiarEstado }) {
  const siguientes = siguientesEstados(hallazgo.estado)
  const [fotosCierre, setFotosCierre] = useState([])
  const [fotoError, setFotoError] = useState('')
  const fotoInputRef = useRef(null)
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(cambioEstadoSchema),
  })
  const estadoSeleccionado = watch('estado')

  if (!siguientes.length) return null

  function onSubmit(data) {
    if (data.estado === 'CERRADO' && !fotosCierre.length) {
      setFotoError('Al menos una foto de cierre es obligatoria')
      return
    }
    setFotoError('')
    mutCambiarEstado.mutate(
      { ...data, fotosCierre },
      { onSuccess: () => { reset(); setFotosCierre([]) } }
    )
  }

  const motivoEsObligatorio = estadoSeleccionado === 'RECHAZADO'
  const requiereSap = estadoSeleccionado === 'EN_GESTION'
  const requiereFoto = estadoSeleccionado === 'CERRADO'

  function agregarFotos(e) {
    const files = Array.from(e.target.files ?? [])
    const restantes = 5 - fotosCierre.length
    setFotosCierre(prev => [...prev, ...files.slice(0, restantes)])
    setFotoError('')
    if (fotoInputRef.current) fotoInputRef.current.value = ''
  }

  function quitarFoto(idx) {
    setFotosCierre(prev => prev.filter((_, i) => i !== idx))
  }

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
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Fotos de cierre <span className="text-red-500">*</span>
                  <span className="ml-1.5 text-xs text-gray-400 font-normal">— hasta 5 fotos</span>
                </label>

                {/* Grid de thumbnails seleccionados */}
                {fotosCierre.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {fotosCierre.map((f, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={URL.createObjectURL(f)}
                          alt={`Cierre ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => quitarFoto(idx)}
                          className="absolute top-1 right-1 bg-white/90 rounded-full p-0.5 text-gray-600 hover:text-red-600"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {fotosCierre.length < 5 && (
                  <label className="flex items-center gap-2 cursor-pointer w-fit">
                    <input
                      ref={fotoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={agregarFotos}
                    />
                    <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-colors">
                      <Camera size={13} /> {fotosCierre.length === 0 ? 'Seleccionar fotos' : 'Agregar más'}
                    </span>
                    {fotosCierre.length > 0 && (
                      <span className="text-xs text-gray-400">{fotosCierre.length}/5</span>
                    )}
                  </label>
                )}

                {fotoError && <p className="text-xs text-red-500">{fotoError}</p>}
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

const ROL_CONFIG = {
  ADMINISTRADOR: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Admin' },
  SUPERVISOR:    { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Supervisor' },
  INSPECTOR:     { bg: 'bg-emerald-100',text: 'text-emerald-700',label: 'Inspector' },
}

function AvatarComentario({ nombre, rol }) {
  const cfg = ROL_CONFIG[rol] ?? { bg: 'bg-gray-100', text: 'text-gray-600', label: rol }
  const iniciales = nombre
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
      {iniciales}
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-700">Historial de Comentarios</h2>
        {hallazgo.comentarios.length > 0 && (
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
            {hallazgo.comentarios.length} {hallazgo.comentarios.length === 1 ? 'comentario' : 'comentarios'}
          </span>
        )}
      </div>

      {/* Lista de comentarios */}
      <div className="space-y-4 mb-5">
        {hallazgo.comentarios.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">Sin comentarios aún</p>
        )}
        {hallazgo.comentarios.map((c, i) => {
          const cfg = ROL_CONFIG[c.autor.rol] ?? { bg: 'bg-gray-100', text: 'text-gray-600', label: c.autor.rol }
          return (
            <div key={c.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <AvatarComentario nombre={c.autor.nombre} rol={c.autor.rol} />
                {i < hallazgo.comentarios.length - 1 && (
                  <div className="w-px flex-1 bg-gray-100 mt-2" />
                )}
              </div>
              <div className="flex-1 pb-2">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-800">{c.autor.nombre}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>
                    {cfg.label}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(c.fecha_creacion).toLocaleString('es-CL')}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-xl rounded-tl-none px-3 py-2">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{c.texto}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Formulario nuevo comentario */}
      <div className="border-t pt-4">
        <p className="text-xs font-medium text-gray-500 mb-2">Nuevo comentario</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          <textarea
            rows={2}
            placeholder="Escribe un comentario..."
            className={`w-full border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.texto ? 'border-red-400' : ''}`}
            {...register('texto')}
          />
          {errors.texto && <p className="text-xs text-red-500">{errors.texto.message}</p>}
          <div className="flex justify-end">
            <Button type="submit" size="sm" loading={mutComentario.isPending}>
              Enviar comentario
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Galería de fotos con foto principal + tira de miniaturas + lightbox
function FotoGaleria({ fotos = [], fallback, titulo, colorHeader }) {
  const [seleccionada, setSeleccionada] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  const urls = fotos.length > 0 ? fotos.map(f => f.foto_url) : (fallback ? [fallback] : [])
  if (!urls.length) return null

  const esEmerald = colorHeader === 'emerald'
  const borderColor  = esEmerald ? 'border-emerald-100' : 'border-gray-200'
  const headerColor  = esEmerald ? 'text-emerald-700 bg-emerald-50' : 'text-gray-500 bg-gray-50'
  const ringColor    = esEmerald ? 'ring-emerald-500' : 'ring-blue-500'

  const idx = Math.min(seleccionada, urls.length - 1)

  function anterior() { setSeleccionada(i => (i - 1 + urls.length) % urls.length) }
  function siguiente() { setSeleccionada(i => (i + 1) % urls.length) }

  return (
    <>
      <div className={`rounded-xl border overflow-hidden ${borderColor}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-2.5 ${headerColor}`}>
          <p className="text-xs font-medium">{titulo}</p>
          {urls.length > 1 && (
            <span className="text-[10px] text-gray-400">{idx + 1} / {urls.length}</span>
          )}
        </div>

        {/* Foto principal */}
        <div className="relative bg-white group">
          <img
            src={urls[idx]}
            alt={`${titulo} ${idx + 1}`}
            className="w-full max-h-80 object-contain cursor-zoom-in"
            onClick={() => setLightbox(true)}
          />

          {/* Flechas de navegación (solo con 2+ fotos) */}
          {urls.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); anterior() }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ‹
              </button>
              <button
                onClick={e => { e.stopPropagation(); siguiente() }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ›
              </button>
            </>
          )}

          {/* Zoom hint */}
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] bg-black/50 text-white px-2 py-0.5 rounded-full">Clic para ampliar</span>
          </div>
        </div>

        {/* Tira de miniaturas (solo con 2+ fotos) */}
        {urls.length > 1 && (
          <div className="flex gap-2 p-2 overflow-x-auto bg-gray-950/5">
            {urls.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSeleccionada(i)}
                className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden ring-2 transition-all
                  ${i === idx ? `${ringColor} opacity-100` : 'ring-transparent opacity-50 hover:opacity-80'}`}
              >
                <img src={url} alt={`Miniatura ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          {/* Cerrar */}
          <button
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors z-10"
            onClick={() => setLightbox(false)}
          >
            <X size={20} />
          </button>

          {/* Flechas lightbox */}
          {urls.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); anterior() }}
                className="absolute left-4 text-white text-4xl bg-black/30 hover:bg-black/60 w-12 h-12 rounded-full flex items-center justify-center transition-colors z-10"
              >
                ‹
              </button>
              <button
                onClick={e => { e.stopPropagation(); siguiente() }}
                className="absolute right-4 text-white text-4xl bg-black/30 hover:bg-black/60 w-12 h-12 rounded-full flex items-center justify-center transition-colors z-10"
              >
                ›
              </button>
            </>
          )}

          <img
            src={urls[idx]}
            alt="Ampliada"
            className="max-w-[90vw] max-h-[90vh] rounded-xl object-contain shadow-2xl"
            onClick={e => e.stopPropagation()}
          />

          {/* Contador lightbox */}
          {urls.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5">
              {urls.map((_, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setSeleccionada(i) }}
                  className={`w-2 h-2 rounded-full transition-all ${i === idx ? 'bg-white' : 'bg-white/40 hover:bg-white/70'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
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

      {/* Fotos iniciales */}
      <FotoGaleria
        fotos={(h.fotos ?? []).filter(f => f.tipo === 'INICIAL')}
        fallback={h.foto_url}
        titulo="Fotos del hallazgo"
        colorHeader="gray"
      />

      {/* Fotos de cierre */}
      {(h.foto_despues_url || (h.fotos ?? []).some(f => f.tipo === 'CIERRE')) && (
        <FotoGaleria
          fotos={(h.fotos ?? []).filter(f => f.tipo === 'CIERRE')}
          fallback={h.foto_despues_url}
          titulo="Fotos de cierre"
          colorHeader="emerald"
        />
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
