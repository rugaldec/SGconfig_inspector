import { useRef, useState } from 'react'
import { Camera, X, Plus, ImageIcon } from 'lucide-react'
import Spinner from '../../../shared/components/ui/Spinner'
import { comprimirImagen } from '../../../shared/utils/comprimirImagen'

// fotos: File[]   onChange(File[])
export default function CamaraInput({ fotos = [], onChange, error, max = 5 }) {
  const inputRef = useRef(null)
  const [comprimiendo, setComprimiendo] = useState(false)

  async function handleChange(e) {
    const nuevos = Array.from(e.target.files ?? [])
    if (!nuevos.length) return
    if (fotos.length + nuevos.length > max) {
      nuevos.splice(max - fotos.length)
    }

    setComprimiendo(true)
    try {
      const comprimidos = await Promise.all(nuevos.map(f => comprimirImagen(f)))
      onChange([...fotos, ...comprimidos])
    } finally {
      setComprimiendo(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function quitar(idx) {
    onChange(fotos.filter((_, i) => i !== idx))
  }

  const puedeAgregar = fotos.length < max

  return (
    <div className="space-y-2">
      {/* Foto principal grande + tira de miniaturas */}
      {fotos.length > 0 && (
        <div className="space-y-2">
          {/* Hero — foto principal */}
          <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100 group">
            <img
              src={URL.createObjectURL(fotos[0])}
              alt="Foto principal"
              className="w-full h-52 object-cover"
            />
            <button
              type="button"
              onClick={() => quitar(0)}
              className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow text-gray-600 hover:text-red-600 transition-colors"
            >
              <X size={14} />
            </button>
            <span className="absolute bottom-2 left-2 text-[10px] font-semibold bg-blue-600/90 text-white px-2 py-0.5 rounded-full">
              Principal
            </span>
            {fotos.length > 1 && (
              <span className="absolute bottom-2 right-2 text-[10px] bg-black/50 text-white px-2 py-0.5 rounded-full">
                1 / {fotos.length}
              </span>
            )}
          </div>

          {/* Tira de miniaturas + botón agregar */}
          {(fotos.length > 1 || puedeAgregar || comprimiendo) && (
            <div className="flex gap-2 overflow-x-auto pb-0.5">
              {fotos.slice(1).map((file, i) => {
                const idx = i + 1
                return (
                  <div key={idx} className="relative flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border border-gray-200 group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => quitar(idx)}
                      className="absolute top-1 right-1 bg-white/90 rounded-full p-0.5 text-gray-600 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X size={11} />
                    </button>
                  </div>
                )
              })}

              {/* Botón agregar */}
              {puedeAgregar && !comprimiendo && (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex-shrink-0 w-20 h-16 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 flex flex-col items-center justify-center gap-0.5 text-gray-400 hover:text-blue-500 transition-colors"
                >
                  <Plus size={18} />
                  <span className="text-[10px] font-medium">Agregar</span>
                </button>
              )}

              {comprimiendo && (
                <div className="flex-shrink-0 w-20 h-16 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 flex flex-col items-center justify-center gap-0.5 text-blue-400">
                  <Spinner size="sm" />
                  <span className="text-[9px]">Procesando...</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Área inicial (sin fotos) */}
      {fotos.length === 0 && (
        comprimiendo ? (
          <div className="w-full h-40 border-2 border-dashed border-blue-300 bg-blue-50 rounded-xl flex flex-col items-center justify-center gap-2 text-blue-400">
            <Spinner size="md" />
            <span className="text-sm">Procesando imagen...</span>
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
            <span className="text-xs opacity-70">Se comprime automáticamente · hasta {max} fotos</span>
          </button>
        )
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
      {fotos.length > 0 && fotos.length < max && (
        <p className="text-xs text-gray-400">{fotos.length}/{max} fotos · podés agregar {max - fotos.length} más</p>
      )}
      {fotos.length >= max && (
        <p className="text-xs text-gray-400">Máximo de {max} fotos alcanzado</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}
