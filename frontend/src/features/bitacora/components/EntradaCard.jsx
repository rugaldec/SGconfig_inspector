import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Trash2, Paperclip, Camera, ChevronLeft, ChevronRight, X } from 'lucide-react'
import TipoBadge from './TipoBadge'
import { TIPO_COLOR } from '../schemas'
import { useEliminarEntrada } from '../hooks/useBitacora'
import { useAuth } from '../../../features/auth/useAuth'

export default function EntradaCard({ item, baseUrl }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const eliminar = useEliminarEntrada()
  const [lightbox, setLightbox] = useState(null)
  const [confirmando, setConfirmando] = useState(false)

  const fotos = item._fotos || []
  const archivos = item._archivos || []
  const color = TIPO_COLOR[item.meta?.tipo] || TIPO_COLOR.OTRO

  function handleEliminar() {
    if (!confirmando) { setConfirmando(true); return }
    eliminar.mutate(item.id, { onSuccess: () => setConfirmando(false) })
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border-l-4 ${color.border} overflow-hidden`}>
      {/* Lightbox */}
      {lightbox !== null && fotos.length > 0 && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-4 right-4 text-white" onClick={() => setLightbox(null)}><X size={24} /></button>
          <button
            className="absolute left-4 text-white p-2"
            onClick={e => { e.stopPropagation(); setLightbox((lightbox - 1 + fotos.length) % fotos.length) }}
          ><ChevronLeft size={32} /></button>
          <img
            src={fotos[lightbox].foto_url}
            alt=""
            className="max-h-[85vh] max-w-[90vw] object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button
            className="absolute right-4 text-white p-2"
            onClick={e => { e.stopPropagation(); setLightbox((lightbox + 1) % fotos.length) }}
          ><ChevronRight size={32} /></button>
          <span className="absolute bottom-4 text-white text-sm">{lightbox + 1} / {fotos.length}</span>
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <TipoBadge tipo={item.meta?.tipo} small />
            <span className="text-xs text-gray-500">{item.hora}</span>
          </div>
          {(item.meta?.editable) && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => navigate(`${baseUrl}/bitacora/entrada/${item.id}/editar`)}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="Editar"
              ><Pencil size={14} /></button>
              <button
                onClick={handleEliminar}
                disabled={eliminar.isPending}
                className={`p-1 transition-colors ${confirmando ? 'text-red-600' : 'text-gray-400 hover:text-red-500'}`}
                title={confirmando ? 'Confirmar eliminar' : 'Eliminar'}
              ><Trash2 size={14} /></button>
              {confirmando && (
                <button onClick={() => setConfirmando(false)} className="text-xs text-gray-500 hover:text-gray-700">
                  cancelar
                </button>
              )}
            </div>
          )}
        </div>

        {/* Título y descripción */}
        <p className="font-semibold text-gray-900 text-sm mb-1">{item.titulo}</p>
        <p className="text-gray-600 text-sm line-clamp-3">{item.resumen}</p>

        {/* Autor y ubicación */}
        <div className="mt-2 flex items-center gap-2">
          {item.autor.foto_url
            ? <img src={item.autor.foto_url} alt="" className="w-5 h-5 rounded-full object-cover" />
            : <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-500">{item.autor.nombre[0]}</div>
          }
          <span className="text-xs text-gray-500">{item.autor.nombre}</span>
          {item.ubicacion && <span className="text-xs text-gray-400 truncate">· {item.ubicacion}</span>}
        </div>

        {/* Indicadores */}
        <div className="mt-2 flex items-center gap-3">
          {fotos.length > 0 && (
            <button
              onClick={() => setLightbox(0)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600"
            >
              <Camera size={13} /> {fotos.length}
            </button>
          )}
          {archivos.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Paperclip size={13} /> {archivos.length}
            </span>
          )}
        </div>

        {/* Galería de miniaturas */}
        {fotos.length > 0 && (
          <div className="mt-3 flex gap-1.5 overflow-x-auto">
            {fotos.map((f, i) => (
              <button key={f.id} onClick={() => setLightbox(i)} className="flex-shrink-0">
                <img src={f.foto_url} alt="" className="w-14 h-14 object-cover rounded-lg border" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
