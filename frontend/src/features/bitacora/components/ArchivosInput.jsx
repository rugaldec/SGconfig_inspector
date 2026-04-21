import { useRef } from 'react'
import { Paperclip, X, FileText, Sheet, File } from 'lucide-react'

const MIME_ACCEPT = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
].join(',')

function icono(mime) {
  if (mime?.includes('pdf')) return <FileText size={16} className="text-red-500" />
  if (mime?.includes('sheet') || mime?.includes('excel')) return <FileText size={16} className="text-green-600" />
  if (mime?.includes('word')) return <FileText size={16} className="text-blue-600" />
  return <File size={16} className="text-gray-500" />
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ArchivosInput({ archivos = [], onChange, max = 10, error }) {
  const inputRef = useRef(null)

  function handleAdd(e) {
    const files = Array.from(e.target.files || [])
    const nuevos = [...archivos, ...files].slice(0, max)
    onChange(nuevos)
    e.target.value = ''
  }

  function handleRemove(i) {
    const arr = archivos.filter((_, idx) => idx !== i)
    onChange(arr)
  }

  return (
    <div>
      <div className="space-y-1.5">
        {archivos.map((f, i) => (
          <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
            {icono(f.type || f.mime_type)}
            <span className="flex-1 text-sm text-gray-700 truncate">{f.name || f.nombre}</span>
            <span className="text-xs text-gray-400">{formatBytes(f.size || f.tamanio)}</span>
            <button type="button" onClick={() => handleRemove(i)} className="text-gray-400 hover:text-red-500">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {archivos.length < max && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2 flex items-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors w-full justify-center"
        >
          <Paperclip size={15} /> Adjuntar archivo
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={MIME_ACCEPT}
        className="hidden"
        onChange={handleAdd}
      />

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <p className="mt-1 text-xs text-gray-400">{archivos.length}/{max} · PDF, Word, Excel · máx 20 MB c/u</p>
    </div>
  )
}
