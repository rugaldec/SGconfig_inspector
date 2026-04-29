import { useState } from 'react'
import { CheckCircle, ChevronLeft, ChevronRight, X } from 'lucide-react'

function avatarUrl(u) {
  return u?.foto_url ? u.foto_url : null
}

function iniciales(nombre) {
  return nombre?.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase() ?? '?'
}

export default function SeguimientoItem({ seguimiento }) {
  const [lightboxIdx, setLightboxIdx] = useState(null)
  const fotos = seguimiento.fotos ?? []

  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden shrink-0">
          {avatarUrl(seguimiento.autor)
            ? <img src={avatarUrl(seguimiento.autor)} alt="" className="w-full h-full object-cover" />
            : <span className="text-xs font-bold text-teal-700">{iniciales(seguimiento.autor?.nombre)}</span>
          }
        </div>
        <div className="w-px flex-1 bg-gray-200 mt-1" />
      </div>

      {/* Contenido */}
      <div className="flex-1 pb-5">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle size={14} className="text-teal-500" />
          <span className="text-xs font-semibold text-teal-700 uppercase tracking-wide">Confirmación de condición</span>
        </div>
        <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-800">{seguimiento.autor?.nombre}</span>
            <span className="text-xs text-gray-400">
              {new Date(seguimiento.created_at).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}
            </span>
          </div>
          <p className="text-sm text-gray-700">{seguimiento.observacion}</p>

          {fotos.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-1">
              {fotos.map((f, i) => (
                <button
                  key={f.id}
                  onClick={() => setLightboxIdx(i)}
                  className="w-16 h-16 rounded-lg overflow-hidden border border-teal-200 hover:opacity-80 transition-opacity"
                >
                  <img src={f.foto_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightboxIdx(null)}>
          <button className="absolute top-4 right-4 text-white" onClick={() => setLightboxIdx(null)}>
            <X size={24} />
          </button>
          {fotos.length > 1 && (
            <>
              <button
                className="absolute left-4 text-white p-2 hover:bg-white/10 rounded-full"
                onClick={e => { e.stopPropagation(); setLightboxIdx((lightboxIdx - 1 + fotos.length) % fotos.length) }}
              >
                <ChevronLeft size={28} />
              </button>
              <button
                className="absolute right-4 text-white p-2 hover:bg-white/10 rounded-full"
                onClick={e => { e.stopPropagation(); setLightboxIdx((lightboxIdx + 1) % fotos.length) }}
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}
          <img
            src={fotos[lightboxIdx]?.foto_url}
            alt=""
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />
          {fotos.length > 1 && (
            <span className="absolute bottom-6 text-white text-sm">{lightboxIdx + 1} / {fotos.length}</span>
          )}
        </div>
      )}
    </div>
  )
}
