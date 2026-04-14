import { useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'
import Spinner from '../../../shared/components/ui/Spinner'
import { comprimirImagen } from '../../../shared/utils/comprimirImagen'

export default function CamaraInput({ onChange, error }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [comprimiendo, setComprimiendo] = useState(false)

  async function handleChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setComprimiendo(true)
    try {
      const comprimido = await comprimirImagen(file)
      setPreview(URL.createObjectURL(comprimido))
      onChange(comprimido)
    } finally {
      setComprimiendo(false)
    }
  }

  function limpiar() {
    setPreview(null)
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      {comprimiendo ? (
        <div className="w-full h-40 border-2 border-dashed border-blue-300 bg-blue-50 rounded-xl flex flex-col items-center justify-center gap-2 text-blue-400">
          <Spinner size="md" />
          <span className="text-sm">Procesando imagen...</span>
        </div>
      ) : preview ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200">
          <img src={preview} alt="Vista previa" className="w-full max-h-64 object-cover" />
          <button
            type="button"
            onClick={limpiar}
            className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow text-gray-700 hover:text-red-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`
            w-full h-40 border-2 border-dashed rounded-xl
            flex flex-col items-center justify-center gap-2 transition-colors
            ${error
              ? 'border-red-300 bg-red-50 text-red-400'
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-400'
            }
          `}
        >
          <Camera size={36} />
          <span className="text-sm font-medium">Tomar / Seleccionar foto</span>
          <span className="text-xs opacity-70">Se comprime automáticamente antes de enviar</span>
        </button>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {/* capture="environment" abre cámara trasera en móvil */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}
