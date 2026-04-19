import { useState } from 'react'
import { CheckCircle2, Circle, AlertTriangle, ExternalLink, X, ZoomIn, ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../../shared/components/ui/Button'

const CRITICIDAD_COLOR = {
  BAJA:    'text-green-600',
  MEDIA:   'text-yellow-600',
  ALTA:    'text-orange-600',
  CRITICA: 'text-red-600',
}

export default function ItemEjecucionRow({
  item,
  index,
  usuarioId,
  onMarcar,
  onCrearHallazgo,
  puedeEjecutar,
  cargando,
}) {
  const [lightboxIdx, setLightboxIdx] = useState(null)
  const esPropio = item.ejecutado_por_id === usuarioId
  const rutaHallazgo = item.hallazgo?.id ? `/supervisor/hallazgos/${item.hallazgo.id}` : null

  // Construir lista de URLs: usar fotos[] si existe, si no caer en foto_url para backward compat
  const urls = item.fotos?.length
    ? item.fotos.map(f => f.foto_url)
    : item.foto_url ? [item.foto_url] : []

  function abrirLightbox(idx) { setLightboxIdx(idx) }
  function cerrarLightbox()   { setLightboxIdx(null) }
  function anterior() { setLightboxIdx(i => (i - 1 + urls.length) % urls.length) }
  function siguiente() { setLightboxIdx(i => (i + 1) % urls.length) }

  return (
    <>
      <div className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
        item.inspeccionado
          ? esPropio ? 'bg-blue-50 border-blue-100' : 'bg-emerald-50 border-emerald-100'
          : 'bg-white border-gray-200'
      }`}>
        {/* Ícono estado */}
        <div className="flex-shrink-0 mt-0.5">
          {item.inspeccionado ? (
            <CheckCircle2 size={18} className={esPropio ? 'text-blue-500' : 'text-emerald-500'} />
          ) : (
            <Circle size={18} className="text-gray-300" />
          )}
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-gray-400">#{index + 1}</span>
            <span className="text-xs font-medium bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
              {item.ubicacion_tecnica?.codigo}
            </span>
            <span className="text-sm font-medium text-gray-800 truncate">
              {item.ubicacion_tecnica?.descripcion}
            </span>
            {item.plantilla_verif && (
              <span className="flex items-center gap-0.5 text-[10px] font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-full">
                <ClipboardList size={10} />
                {item.plantilla_verif.nombre}
              </span>
            )}
          </div>

          {/* Quién y cuándo */}
          {item.inspeccionado && (
            <div className="mt-1 text-xs text-gray-500">
              {item.ejecutado_por?.nombre}
              {item.fecha_inspeccion && (
                <span className="ml-1.5 text-gray-400">
                  · {new Date(item.fecha_inspeccion).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              )}
            </div>
          )}

          {/* Observación */}
          {item.observacion && (
            <p className="mt-1 text-xs text-gray-600 italic">"{item.observacion}"</p>
          )}

          {/* Fotos evidencia */}
          {urls.length > 0 && (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {urls.map((url, i) => (
                <button
                  key={i}
                  onClick={() => abrirLightbox(i)}
                  className="relative flex-shrink-0 group rounded-lg overflow-hidden border border-gray-200 w-20 h-16"
                >
                  <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <ZoomIn size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {urls.length > 1 && i === 0 && (
                    <span className="absolute bottom-0.5 right-0.5 bg-black/50 text-white text-[9px] px-1 rounded">
                      1/{urls.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Hallazgo vinculado */}
          {item.hallazgo && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <AlertTriangle size={12} className={CRITICIDAD_COLOR[item.hallazgo.criticidad] ?? 'text-gray-500'} />
              <span className="text-xs text-gray-500">Hallazgo:</span>
              <Link
                to={rutaHallazgo}
                className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-0.5"
                onClick={e => e.stopPropagation()}
              >
                {item.hallazgo.numero_aviso}
                <ExternalLink size={10} />
              </Link>
            </div>
          )}
        </div>

        {/* Acciones */}
        {puedeEjecutar && !item.inspeccionado && (
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            <Button size="sm" onClick={() => onMarcar(item)} loading={cargando === item.id}>
              Registrar
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onCrearHallazgo(item)}>
              Hallazgo
            </Button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && urls.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={cerrarLightbox}
        >
          <button
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
            onClick={cerrarLightbox}
          >
            <X size={20} />
          </button>

          {urls.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
                onClick={e => { e.stopPropagation(); anterior() }}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                className="absolute right-16 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
                onClick={e => { e.stopPropagation(); siguiente() }}
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          <img
            src={urls[lightboxIdx]}
            alt={`Foto ${lightboxIdx + 1}`}
            className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
            onClick={e => e.stopPropagation()}
          />

          <div className="absolute bottom-4 left-0 right-0 text-center">
            {urls.length > 1 && (
              <p className="text-white/60 text-xs mb-1">{lightboxIdx + 1} / {urls.length}</p>
            )}
            <p className="text-white/70 text-xs">
              {item.ubicacion_tecnica?.codigo} — {item.ubicacion_tecnica?.descripcion}
            </p>
            {item.observacion && (
              <p className="text-white/90 text-sm mt-1 italic">"{item.observacion}"</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
