import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X, Pencil, Trash2, Download, Paperclip } from 'lucide-react'
import { useBitacoraEntrada } from '../hooks/useBitacoraEntrada'
import { useEliminarEntrada } from '../hooks/useBitacora'
import TipoBadge from '../components/TipoBadge'
import Spinner from '../../../shared/components/ui/Spinner'

function formatFecha(d) {
  return new Date(d).toLocaleString('es-CL', { dateStyle: 'full', timeStyle: 'short', timeZone: 'UTC' })
}

function formatBytes(b) {
  if (!b) return ''
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

export default function EntradaDetallePage({ baseUrl }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: entrada, isLoading } = useBitacoraEntrada(id)
  const eliminar = useEliminarEntrada()
  const [lightbox, setLightbox] = useState(null)
  const [confirmando, setConfirmando] = useState(false)

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  if (!entrada) return <div className="text-center py-12 text-gray-500">Entrada no encontrada</div>

  const fotos = entrada.fotos || []

  function handleEliminar() {
    if (!confirmando) { setConfirmando(true); return }
    eliminar.mutate(id, { onSuccess: () => navigate(`${baseUrl}/bitacora`) })
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Lightbox */}
      {lightbox !== null && fotos.length > 0 && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white"><X size={24} /></button>
          <button className="absolute left-4 text-white p-2"
            onClick={e => { e.stopPropagation(); setLightbox((lightbox - 1 + fotos.length) % fotos.length) }}>
            <ChevronLeft size={32} />
          </button>
          <img src={fotos[lightbox].foto_url} alt="" className="max-h-[85vh] max-w-[90vw] object-contain"
            onClick={e => e.stopPropagation()} />
          <button className="absolute right-4 text-white p-2"
            onClick={e => { e.stopPropagation(); setLightbox((lightbox + 1) % fotos.length) }}>
            <ChevronRight size={32} />
          </button>
          <span className="absolute bottom-4 text-white text-sm">{lightbox + 1} / {fotos.length}</span>
        </div>
      )}

      {/* Cabecera */}
      <div className="flex items-center gap-3 mb-4">
        <Link to={`${baseUrl}/bitacora`} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 flex-1 truncate">{entrada.titulo}</h1>
        {entrada.editable && (
          <div className="flex items-center gap-1">
            <Link
              to={`${baseUrl}/bitacora/entrada/${id}/editar`}
              className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Pencil size={16} />
            </Link>
            <button
              onClick={handleEliminar}
              disabled={eliminar.isPending}
              className={`p-2 rounded-lg transition-colors ${confirmando ? 'text-red-600 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
            >
              <Trash2 size={16} />
            </button>
            {confirmando && (
              <button onClick={() => setConfirmando(false)} className="text-xs text-gray-500 px-2">cancelar</button>
            )}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-5 gap-6">
        {/* Columna izquierda: galería */}
        <div className="md:col-span-3">
          {fotos.length > 0 && (
            <>
              <button onClick={() => setLightbox(0)} className="w-full">
                <img
                  src={fotos[0].foto_url}
                  alt=""
                  className="w-full h-52 object-cover rounded-xl border bg-white"
                />
              </button>
              {fotos.length > 1 && (
                <div className="flex gap-2 mt-2 overflow-x-auto">
                  {fotos.map((f, i) => (
                    <button key={f.id} onClick={() => setLightbox(i)} className="flex-shrink-0">
                      <img
                        src={f.foto_url}
                        alt=""
                        className={`w-14 h-14 object-cover rounded-lg border-2 transition-all
                          ${lightbox === i ? 'border-blue-500' : 'border-transparent'}`}
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="mt-4">
            <p className="text-gray-700 text-sm whitespace-pre-wrap">{entrada.descripcion}</p>
          </div>
        </div>

        {/* Columna derecha: metadatos */}
        <div className="md:col-span-2 space-y-4">
          <div>
            <TipoBadge tipo={entrada.tipo} />
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Fecha</p>
            <p className="text-sm text-gray-700">{formatFecha(entrada.fecha)}</p>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Autor</p>
            <div className="flex items-center gap-2">
              {entrada.autor.foto_url
                ? <img src={entrada.autor.foto_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                : <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">{entrada.autor.nombre[0]}</div>
              }
              <span className="text-sm text-gray-700">{entrada.autor.nombre}</span>
            </div>
          </div>

          {entrada.disciplina && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Disciplina</p>
              <p className="text-sm text-gray-700">{entrada.disciplina.nombre}</p>
            </div>
          )}

          {entrada.ubicacion && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Ubicación</p>
              <p className="text-sm text-gray-700">{entrada.ubicacion.descripcion}</p>
            </div>
          )}

          {/* Archivos */}
          {entrada.archivos?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Archivos adjuntos</p>
              <div className="space-y-2">
                {entrada.archivos.map(a => (
                  <a
                    key={a.id}
                    href={a.archivo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border hover:bg-blue-50 transition-colors group"
                  >
                    <Paperclip size={14} className="text-gray-400 group-hover:text-blue-500" />
                    <span className="flex-1 text-xs text-gray-700 truncate">{a.nombre}</span>
                    <span className="text-xs text-gray-400">{formatBytes(a.tamanio)}</span>
                    <Download size={13} className="text-gray-400 group-hover:text-blue-500" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
