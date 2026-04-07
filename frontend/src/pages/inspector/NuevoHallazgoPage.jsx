import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../api/client'
import CamaraInput from '../../components/form/CamaraInput'
import UbicacionSelector from '../../components/form/UbicacionSelector'
import Spinner from '../../components/ui/Spinner'
import { useOfflineQueue } from '../../hooks/useOfflineQueue'

const CRITICIDADES = [
  { value: 'BAJA',    label: 'Baja',    color: 'border-gray-400 text-gray-700' },
  { value: 'MEDIA',   label: 'Media',   color: 'border-amber-400 text-amber-700' },
  { value: 'ALTA',    label: 'Alta',    color: 'border-orange-500 text-orange-700' },
  { value: 'CRITICA', label: 'Crítica', color: 'border-red-500 text-red-700' },
]

export default function NuevoHallazgoPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { enqueue, isOnline } = useOfflineQueue()

  const [ubicacion, setUbicacion] = useState(null)
  const [foto, setFoto] = useState(null)
  const [descripcion, setDescripcion] = useState('')
  const [criticidad, setCriticidad] = useState('')
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)

  const mutation = useMutation({
    mutationFn: (fd) => api.post('/hallazgos', fd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hallazgos-mios'] })
      setSuccess(true)
      setTimeout(() => navigate('/inspector/hallazgos'), 1500)
    },
  })

  function validate() {
    const e = {}
    if (!ubicacion) e.ubicacion = 'Selecciona una ubicación'
    if (!foto) e.foto = 'La foto es obligatoria'
    if (!descripcion.trim()) e.descripcion = 'Describe el hallazgo'
    if (!criticidad) e.criticidad = 'Selecciona la criticidad'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    setErrors({})

    if (!isOnline) {
      await enqueue({ ubicacion_tecnica_id: ubicacion.id, descripcion, criticidad, foto, ubicacion })
      setSuccess(true)
      setTimeout(() => navigate('/inspector/hallazgos'), 1500)
      return
    }

    const fd = new FormData()
    fd.append('ubicacion_tecnica_id', ubicacion.id)
    fd.append('descripcion', descripcion)
    fd.append('criticidad', criticidad)
    fd.append('foto', foto)
    mutation.mutate(fd)
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
          <span className="text-emerald-600 text-2xl">✓</span>
        </div>
        <p className="text-emerald-700 font-semibold">Hallazgo registrado</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-5">Nuevo Hallazgo</h1>
      {!isOnline && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-sm text-amber-700">
          Sin conexión — el hallazgo se guardará localmente y se sincronizará automáticamente.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Ubicación Técnica</label>
          <UbicacionSelector value={ubicacion} onChange={setUbicacion} error={errors.ubicacion} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Foto del Hallazgo</label>
          <CamaraInput onChange={setFoto} error={errors.foto} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
          <textarea
            rows={4} value={descripcion} onChange={e => setDescripcion(e.target.value)}
            placeholder="Describe detalladamente el hallazgo encontrado..."
            className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${errors.descripcion ? 'border-red-400' : 'border-gray-300'}`}
          />
          {errors.descripcion && <p className="text-red-500 text-xs mt-1">{errors.descripcion}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Criticidad</label>
          <div className="grid grid-cols-2 gap-2">
            {CRITICIDADES.map(({ value, label, color }) => (
              <button
                key={value} type="button"
                onClick={() => setCriticidad(value)}
                className={`py-3 rounded-xl border-2 font-semibold text-sm transition-all ${criticidad === value ? color + ' bg-opacity-10' : 'border-gray-200 text-gray-500'} ${criticidad === value ? 'ring-2 ring-offset-1 ring-current' : ''}`}>
                {label}
              </button>
            ))}
          </div>
          {errors.criticidad && <p className="text-red-500 text-xs mt-1">{errors.criticidad}</p>}
        </div>

        {mutation.isError && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {mutation.error?.response?.data?.message || 'Error al enviar el hallazgo'}
          </p>
        )}

        <button
          type="submit" disabled={mutation.isPending}
          className="w-full bg-blue-800 hover:bg-blue-900 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
          {mutation.isPending ? <Spinner size="sm" /> : null}
          Registrar Hallazgo
        </button>
      </form>
    </div>
  )
}
