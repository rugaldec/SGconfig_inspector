import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../../auth/useAuth'
import { useActualizarMiPerfil, useActualizarMiFoto } from '../hooks/useUsuarios'
import Input from '../../../shared/components/ui/Input'
import Button from '../../../shared/components/ui/Button'
import { Camera, CheckCircle } from 'lucide-react'
import { comprimirImagen } from '../../../shared/utils/comprimirImagen'

const schema = z.object({
  nombre:         z.string().min(2, 'Mínimo 2 caracteres'),
  titulo:         z.string().optional(),
  cargo:          z.string().optional(),
  telefono:       z.string().optional(),
  area_funcional: z.string().optional(),
  observaciones:  z.string().optional(),
})

const ROL_LABEL = { ADMINISTRADOR: 'Administrador', SUPERVISOR: 'Supervisor', INSPECTOR: 'Inspector' }
const ROL_COLOR = {
  ADMINISTRADOR: 'bg-purple-100 text-purple-700',
  SUPERVISOR:    'bg-blue-100 text-blue-700',
  INSPECTOR:     'bg-green-100 text-green-700',
}

export default function PerfilPage() {
  const { user, refreshUser } = useAuth()
  const actualizar = useActualizarMiPerfil()
  const subirFoto  = useActualizarMiFoto()
  const fileRef    = useRef(null)
  const [preview, setPreview] = useState(null)

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (user) {
      reset({
        nombre:         user.nombre         ?? '',
        titulo:         user.titulo         ?? '',
        cargo:          user.cargo          ?? '',
        telefono:       user.telefono       ?? '',
        area_funcional: user.area_funcional ?? '',
        observaciones:  user.observaciones  ?? '',
      })
    }
  }, [user, reset])

  async function onFotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const comprimida = await comprimirImagen(file)
    setPreview(URL.createObjectURL(comprimida))
    subirFoto.mutate(comprimida, {
      onSuccess: () => refreshUser(),
    })
  }

  function onSubmit(data) {
    actualizar.mutate(data, {
      onSuccess: () => refreshUser(),
    })
  }

  const fotoSrc = preview ?? user?.foto_url ?? null

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        {/* Avatar con botón de cambio */}
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-blue-900 flex items-center justify-center text-white font-bold text-2xl overflow-hidden">
            {fotoSrc
              ? <img src={fotoSrc} alt="avatar" className="w-full h-full object-cover" />
              : user?.nombre?.charAt(0).toUpperCase()
            }
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={subirFoto.isPending}
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-md transition-colors disabled:opacity-60"
            title="Cambiar foto"
          >
            <Camera size={13} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onFotoChange}
          />
        </div>

        <div>
          <h1 className="text-xl font-bold text-gray-800">Mi Perfil</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm text-gray-500">{user?.email}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROL_COLOR[user?.rol]}`}>
              {ROL_LABEL[user?.rol]}
            </span>
          </div>
          {subirFoto.isPending && <p className="text-xs text-blue-500 mt-1">Subiendo foto…</p>}
          {subirFoto.isSuccess && !subirFoto.isPending && (
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle size={11} /> Foto actualizada</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6">
        {actualizar.isSuccess && (
          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-5 text-sm font-medium">
            <CheckCircle size={16} />
            Perfil actualizado correctamente
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nombre completo" error={errors.nombre?.message} {...register('nombre')} />
            <Input label="Título profesional" placeholder="Ej: Ingeniero Civil, Técnico Eléctrico" {...register('titulo')} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Cargo" placeholder="Ej: Jefe de Mantenimiento" {...register('cargo')} />
            <Input label="Teléfono" placeholder="Ej: +56 9 1234 5678" {...register('telefono')} />
          </div>

          <Input label="Área funcional" placeholder="Ej: Mantenimiento Eléctrico, Operaciones Planta" {...register('area_funcional')} />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Observaciones</label>
            <textarea
              rows={3}
              placeholder="Información adicional relevante…"
              className="border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              {...register('observaciones')}
            />
          </div>

          {actualizar.error && (
            <p className="text-sm text-red-500">
              {actualizar.error?.response?.data?.message ?? 'Error al guardar el perfil'}
            </p>
          )}

          <Button type="submit" size="full" loading={actualizar.isPending} disabled={!isDirty && !actualizar.isSuccess}>
            Guardar Perfil
          </Button>
        </form>
      </div>
    </div>
  )
}
