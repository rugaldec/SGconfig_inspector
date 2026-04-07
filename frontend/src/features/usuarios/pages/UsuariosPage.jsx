import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useUsuarios, useCrearUsuario, useActualizarUsuario } from '../hooks/useUsuarios'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Input from '../../../shared/components/ui/Input'
import Spinner from '../../../shared/components/ui/Spinner'
import { UserPlus } from 'lucide-react'

const crearSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  rol: z.enum(['ADMINISTRADOR', 'SUPERVISOR', 'INSPECTOR']),
})

const editarSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  rol: z.enum(['ADMINISTRADOR', 'SUPERVISOR', 'INSPECTOR']),
  activo: z.boolean(),
})

const ROL_BADGE = {
  ADMINISTRADOR: 'bg-purple-100 text-purple-700',
  SUPERVISOR:    'bg-blue-100 text-blue-700',
  INSPECTOR:     'bg-green-100 text-green-700',
}

export default function UsuariosPage() {
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)

  const { data: usuarios, isLoading } = useUsuarios()
  const crear = useCrearUsuario()
  const actualizar = useActualizarUsuario()

  const schema = editando ? editarSchema : crearSchema
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  function abrirNuevo() {
    setEditando(null)
    reset({ nombre: '', email: '', password: '', rol: 'INSPECTOR' })
    modal || setModal(true)
    setModal(true)
  }

  function abrirEditar(u) {
    setEditando(u)
    reset({ nombre: u.nombre, email: u.email, rol: u.rol, activo: u.activo })
    setModal(true)
  }

  function cerrar() {
    setModal(false)
    crear.reset()
    actualizar.reset()
  }

  function onSubmit(data) {
    if (editando) {
      actualizar.mutate({ id: editando.id, datos: data }, { onSuccess: cerrar })
    } else {
      crear.mutate(data, { onSuccess: cerrar })
    }
  }

  const mutError = editando
    ? actualizar.error?.response?.data?.message
    : crear.error?.response?.data?.message

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-800">Usuarios</h1>
        <Button size="sm" onClick={abrirNuevo}>
          <UserPlus size={15} /> Nuevo Usuario
        </Button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Nombre', 'Email', 'Rol', 'Activo', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usuarios?.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{u.nombre}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROL_BADGE[u.rol]}`}>
                    {u.rol}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${u.activo ? 'text-emerald-600' : 'text-red-500'}`}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => abrirEditar(u)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={cerrar} title={editando ? 'Editar Usuario' : 'Nuevo Usuario'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nombre" error={errors.nombre?.message} {...register('nombre')} />
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />

          {!editando && (
            <Input
              label="Contraseña"
              type="password"
              error={errors.password?.message}
              hint="Mínimo 8 caracteres"
              {...register('password')}
            />
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Rol</label>
            <select
              className="border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register('rol')}
            >
              <option value="INSPECTOR">Inspector</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="ADMINISTRADOR">Administrador</option>
            </select>
          </div>

          {editando && (
            <div className="flex items-center gap-2">
              <input type="checkbox" id="activo" {...register('activo')} className="rounded" />
              <label htmlFor="activo" className="text-sm text-gray-700">Usuario activo</label>
            </div>
          )}

          {mutError && <p className="text-sm text-red-500">{mutError}</p>}

          <Button
            type="submit"
            size="full"
            loading={crear.isPending || actualizar.isPending}
          >
            {editando ? 'Guardar Cambios' : 'Crear Usuario'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
