import { useRef, useState } from 'react'
import { Camera } from 'lucide-react'

export default function CamaraInput({ onChange, error }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)

  function handleChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    onChange(file)
  }

  return (
    <div>
      {preview ? (
        <div className="relative">
          <img src={preview} alt="Preview" className="w-full max-h-64 object-cover rounded-xl border" />
          <button
            type="button"
            onClick={() => { setPreview(null); onChange(null); inputRef.current.value = '' }}
            className="absolute top-2 right-2 bg-white rounded-full shadow px-2 py-0.5 text-xs text-red-600 font-medium">
            Cambiar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current.click()}
          className={`w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-colors ${error ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}>
          <Camera size={36} className={error ? 'text-red-400' : 'text-gray-400'} />
          <span className="text-sm font-medium text-gray-600">Tomar / Seleccionar foto</span>
          <span className="text-xs text-gray-400">JPEG, PNG o WebP · máx 10 MB</span>
        </button>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      {/* capture="environment" activa la cámara trasera en móvil */}
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
