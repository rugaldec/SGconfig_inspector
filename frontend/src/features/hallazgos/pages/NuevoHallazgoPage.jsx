import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { nuevoHallazgoSchema } from '../schemas'
import { useCrearHallazgo } from '../hooks/useHallazgos'
import { useMarcarItem } from '../../pautas/hooks/usePautas'
import { useOfflineQueue } from '../../../shared/hooks/useOfflineQueue'
import { useAuth } from '../../auth/useAuth'
import { CRITICIDAD_CONFIG, CATEGORIA_CONFIG } from '../estadoMachine'
import CamaraInput from '../components/CamaraInput'
import UbicacionSelector from '../../ubicaciones/components/UbicacionSelector'
import Button from '../../../shared/components/ui/Button'

export default function NuevoHallazgoPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { enqueue, isOnline } = useOfflineQueue()
  const crearHallazgo = useCrearHallazgo()
  const marcarItem = useMarcarItem()

  // Parámetros opcionales desde una ejecución de pauta
  const ejecucionId = searchParams.get('ejecucionId')
  const itemId = searchParams.get('itemId')
  const ubicacionIdParam = searchParams.get('ubicacionId')
  const desdeEjecucion = !!(ejecucionId && itemId)

  const successRedirect = user?.rol === 'INSPECTOR' ? '/inspector/hallazgos' : '/supervisor/hallazgos'
  const ejecucionRedirect = user?.rol === 'INSPECTOR'
    ? `/inspector/ejecuciones/${ejecucionId}`
    : `/supervisor/ejecuciones/${ejecucionId}`

  const [fotos, setFotos] = useState([])
  const [fotoError, setFotoError] = useState(null)
  const [ubicacion, setUbicacion] = useState(null)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: zodResolver(nuevoHallazgoSchema),
  })

  async function onSubmit(data) {
    if (!fotos.length) { setFotoError('Al menos una foto es obligatoria'); return }
    setFotoError(null)

    if (!isOnline) {
      await enqueue({ ...data, foto: fotos[0], ubicacion })
      setSuccess(true)
      setTimeout(() => navigate(successRedirect), 1500)
      return
    }

    const fd = new FormData()
    fd.append('ubicacion_tecnica_id', data.ubicacion_tecnica_id)
    fd.append('descripcion', data.descripcion)
    fd.append('criticidad', data.criticidad)
    fd.append('categoria', data.categoria)
    fotos.forEach(f => fd.append('fotos', f))

    crearHallazgo.mutate(fd, {
      onSuccess: (hallazgo) => {
        // Si viene desde una ejecución, vincular el hallazgo al ítem y volver
        if (desdeEjecucion && hallazgo?.id) {
          marcarItem.mutate(
            { ejecucionId, itemId, datos: { hallazgo_id: hallazgo.id } },
            {
              onSettled: () => {
                setSuccess(true)
                setTimeout(() => navigate(ejecucionRedirect), 1500)
              },
            },
          )
        } else {
          setSuccess(true)
          setTimeout(() => navigate(successRedirect), 1500)
        }
      },
    })
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <span className="text-emerald-600 text-3xl">✓</span>
        </div>
        <p className="text-emerald-700 font-semibold text-lg">Hallazgo registrado</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-5">Nuevo Hallazgo</h1>

      {desdeEjecucion && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
          Creando hallazgo desde pauta de inspección — se vinculará automáticamente al ítem.
        </div>
      )}

      {!isOnline && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          Sin conexión — se guardará localmente y sincronizará automáticamente.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Ubicación */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Ubicación Técnica
          </label>
          <Controller
            name="ubicacion_tecnica_id"
            control={control}
            render={({ field }) => (
              <UbicacionSelector
                value={ubicacion}
                onChange={(ub) => { setUbicacion(ub); field.onChange(ub.id) }}
                error={errors.ubicacion_tecnica_id?.message}
              />
            )}
          />
        </div>

        {/* Fotos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Fotos del Hallazgo
            <span className="ml-1.5 text-xs text-gray-400 font-normal">— hasta 5 fotos</span>
          </label>
          <CamaraInput fotos={fotos} onChange={setFotos} error={fotoError} />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Descripción
          </label>
          <textarea
            rows={4}
            placeholder="Describe detalladamente el hallazgo encontrado..."
            className={`
              w-full border rounded-xl px-3 py-2.5 text-sm resize-none
              focus:outline-none focus:ring-2 focus:ring-blue-500
              ${errors.descripcion ? 'border-red-400 bg-red-50' : 'border-gray-300'}
            `}
            {...register('descripcion')}
          />
          {errors.descripcion && (
            <p className="text-xs text-red-500 mt-1">{errors.descripcion.message}</p>
          )}
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoría
          </label>
          <Controller
            name="categoria"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(CATEGORIA_CONFIG).map(([value, cfg]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => field.onChange(value)}
                    className={`
                      py-3 rounded-xl border-2 font-semibold text-sm transition-all
                      ${field.value === value
                        ? `${cfg.bg} ${cfg.text} border-current ring-2 ring-offset-1 ring-current`
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }
                    `}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
            )}
          />
          {errors.categoria && (
            <p className="text-xs text-red-500 mt-1">{errors.categoria.message}</p>
          )}
        </div>

        {/* Criticidad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Criticidad
          </label>
          <Controller
            name="criticidad"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(CRITICIDAD_CONFIG).map(([value, cfg]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => field.onChange(value)}
                    className={`
                      py-3 rounded-xl border-2 font-semibold text-sm transition-all
                      ${field.value === value
                        ? `${cfg.bg} ${cfg.text} border-current ring-2 ring-offset-1 ring-current`
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }
                    `}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
            )}
          />
          {errors.criticidad && (
            <p className="text-xs text-red-500 mt-1">{errors.criticidad.message}</p>
          )}
        </div>

        {crearHallazgo.isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm text-red-700">
            {crearHallazgo.error?.response?.data?.message || 'Error al enviar el hallazgo'}
          </div>
        )}

        <Button type="submit" size="full" loading={crearHallazgo.isPending}>
          Registrar Hallazgo
        </Button>
      </form>
    </div>
  )
}
