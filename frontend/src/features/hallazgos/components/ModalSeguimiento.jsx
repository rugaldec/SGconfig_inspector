import { useState } from 'react'
import { useCrearSeguimiento } from '../hooks/useSeguimientos'
import CamaraInput from './CamaraInput'

export default function ModalSeguimiento({ hallazgoId, onClose }) {
  const [observacion, setObservacion] = useState('')
  const [fotos, setFotos] = useState([])
  const crear = useCrearSeguimiento(hallazgoId)

  const puedeGuardar = observacion.trim().length >= 5 && fotos.length > 0

  function handleSubmit(e) {
    e.preventDefault()
    if (!puedeGuardar) return
    const fd = new FormData()
    fd.append('observacion', observacion.trim())
    fotos.forEach(f => fd.append('fotos', f))
    crear.mutate(fd, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-800">Confirmar condición actual</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Observación</label>
            <textarea
              value={observacion}
              onChange={e => setObservacion(e.target.value)}
              rows={3}
              placeholder="Describe el estado actual de la condición..."
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            {observacion.trim().length > 0 && observacion.trim().length < 5 && (
              <p className="text-xs text-red-500 mt-1">Mínimo 5 caracteres</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Fotos de evidencia <span className="font-normal text-red-500">*</span>
              <span className="font-normal text-gray-400 ml-1">(máx. 5)</span>
            </label>
            <CamaraInput fotos={fotos} onChange={setFotos} max={5} />
            {fotos.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">Al menos una foto es obligatoria</p>
            )}
          </div>

          {crear.isError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {crear.error?.response?.data?.message || 'Error al registrar el seguimiento'}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!puedeGuardar || crear.isPending}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {crear.isPending ? 'Guardando...' : 'Registrar confirmación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
