import { useState, useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  useUsuarios, useCrearUsuario, useActualizarUsuario,
  useResetPassword, useActualizarFotoUsuario,
} from '../hooks/useUsuarios'
import { useDisciplinas } from '../../disciplinas/hooks/useDisciplinas'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Input from '../../../shared/components/ui/Input'
import Spinner from '../../../shared/components/ui/Spinner'
import { UserPlus, KeyRound, Camera } from 'lucide-react'
import { comprimirImagen } from '../../../shared/utils/comprimirImagen'

const PASSWORD_HINT = 'Mínimo 8 caracteres, una mayúscula, un número y un carácter especial (ej: !, @, #)'

const crearSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .regex(/\d/, 'Debe contener al menos un número')
    .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial (ej: !, @, #)'),
  rol: z.enum(['ADMINISTRADOR', 'SUPERVISOR', 'INSPECTOR']),
  disciplinas: z.array(z.string()).optional(),
})

const editarSchema = z.object({
  nombre:         z.string().min(2, 'Mínimo 2 caracteres'),
  email:          z.string().email('Email inválido'),
  rol:            z.enum(['ADMINISTRADOR', 'SUPERVISOR', 'INSPECTOR']),
  activo:         z.boolean(),
  disciplinas:    z.array(z.string()).optional(),
  titulo:         z.string().optional(),
  cargo:          z.string().optional(),
  telefono:       z.string().optional(),
  area_funcional: z.string().optional(),
  observaciones:  z.string().optional(),
})

const passwordSchema = z.object({
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .regex(/\d/, 'Debe contener al menos un número')
    .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial (ej: !, @, #)'),
  confirmar: z.string(),
}).refine(d => d.password === d.confirmar, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmar'],
})

const ROL_BADGE = {
  ADMINISTRADOR: 'bg-purple-100 text-purple-700',
  SUPERVISOR:    'bg-blue-100 text-blue-700',
  INSPECTOR:     'bg-green-100 text-green-700',
}

// ── Selector de disciplinas ────────────────────────────────────────────────────
function DisciplinasCheckboxes({ disciplinas, value = [], onChange }) {
  function toggle(id) {
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id])
  }
  if (!disciplinas?.length) return <p className="text-sm text-gray-400 italic">No hay disciplinas activas</p>
  return (
    <div className="border border-gray-200 rounded-xl p-2 max-h-36 overflow-y-auto flex flex-wrap gap-2">
      {disciplinas.map(d => {
        const checked = value.includes(d.id)
        return (
          <button
            key={d.id}
            type="button"
            onClick={() => toggle(d.id)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
              checked
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-600'
            }`}
          >
            {d.nombre}
          </button>
        )
      })}
    </div>
  )
}

// ── Avatar editable ────────────────────────────────────────────────────────────
function AvatarEditable({ usuario, onFotoChange, loading }) {
  const fotoSrc = usuario?.foto_url ?? null
  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <div className="w-16 h-16 rounded-full bg-blue-900 flex items-center justify-center text-white font-bold text-2xl overflow-hidden">
        {fotoSrc
          ? <img src={fotoSrc} alt="avatar" className="w-full h-full object-cover" />
          : usuario?.nombre?.charAt(0).toUpperCase()
        }
      </div>
      <button
        type="button"
        onClick={onFotoChange}
        disabled={loading}
        className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-md transition-colors disabled:opacity-60"
        title="Cambiar foto"
      >
        {loading ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera size={13} />}
      </button>
    </div>
  )
}

export default function UsuariosPage() {
  const [modal, setModal]           = useState(false)
  const [editando, setEditando]     = useState(null)
  const [modalPwd, setModalPwd]     = useState(false)
  const [usuarioPwd, setUsuarioPwd] = useState(null)
  const [tab, setTab]               = useState('activos')
  const [disciplinasSeleccionadas, setDisciplinasSeleccionadas] = useState([])
  const fileRef = useRef(null)

  const { data: usuarios, isLoading } = useUsuarios()
  const { data: disciplinas } = useDisciplinas()
  const crear        = useCrearUsuario()
  const actualizar   = useActualizarUsuario()
  const resetPwd     = useResetPassword()
  const subirFoto    = useActualizarFotoUsuario()

  const schema = editando ? editarSchema : crearSchema
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })
  const rolActual = useWatch({ control, name: 'rol', defaultValue: 'INSPECTOR' })

  const { register: regPwd, handleSubmit: handlePwd, reset: resetPwdForm, formState: { errors: errPwd } } = useForm({
    resolver: zodResolver(passwordSchema),
  })

  function abrirNuevo() {
    setEditando(null)
    setDisciplinasSeleccionadas([])
    reset({ nombre: '', email: '', password: '', rol: 'INSPECTOR' })
    setModal(true)
  }

  function abrirEditar(u) {
    setEditando(u)
    const discIds = u.disciplinas?.map(d => d.disciplina_id ?? d.id) ?? []
    setDisciplinasSeleccionadas(discIds)
    reset({
      nombre:         u.nombre         ?? '',
      email:          u.email          ?? '',
      rol:            u.rol,
      activo:         u.activo,
      titulo:         u.titulo         ?? '',
      cargo:          u.cargo          ?? '',
      telefono:       u.telefono       ?? '',
      area_funcional: u.area_funcional ?? '',
      observaciones:  u.observaciones  ?? '',
    })
    setModal(true)
  }

  function cerrar() {
    setModal(false)
    crear.reset()
    actualizar.reset()
    setDisciplinasSeleccionadas([])
  }

  function abrirCambiarPwd(u) {
    setUsuarioPwd(u)
    resetPwdForm()
    resetPwd.reset()
    setModalPwd(true)
  }

  function cerrarPwd() {
    if (resetPwd.isPending) return
    setModalPwd(false)
    resetPwd.reset()
  }

  function onSubmit(data) {
    const payload = {
      ...data,
      disciplinas: (rolActual === 'INSPECTOR' || rolActual === 'SUPERVISOR') ? disciplinasSeleccionadas : [],
    }
    if (editando) {
      actualizar.mutate({ id: editando.id, datos: payload }, { onSuccess: cerrar })
    } else {
      crear.mutate(payload, { onSuccess: cerrar })
    }
  }

  function onSubmitPwd({ password }) {
    resetPwd.mutate({ id: usuarioPwd.id, password })
  }

  async function onFotoClick() {
    fileRef.current?.click()
  }

  async function onFotoChange(e) {
    const file = e.target.files?.[0]
    if (!file || !editando) return
    e.target.value = ''
    const comprimida = await comprimirImagen(file)
    subirFoto.mutate({ id: editando.id, file: comprimida }, {
      onSuccess: (data) => setEditando(data),
    })
  }

  const mutError = editando
    ? actualizar.error?.response?.data?.message
    : crear.error?.response?.data?.message

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  const activos   = usuarios?.filter(u => u.activo)  ?? []
  const inactivos = usuarios?.filter(u => !u.activo) ?? []
  const lista     = tab === 'activos' ? activos : inactivos

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-800">Usuarios</h1>
        <Button size="sm" onClick={abrirNuevo}>
          <UserPlus size={15} /> Nuevo Usuario
        </Button>
      </div>

      {/* Pestañas */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {[
          { key: 'activos',   label: 'Activos',   count: activos.length },
          { key: 'inactivos', label: 'Inactivos', count: inactivos.length },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              tab === key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['', 'Nombre', 'Email', 'Rol', 'Disciplinas', ''].map((h, i) => (
                <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lista.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                  No hay usuarios {tab === 'activos' ? 'activos' : 'inactivos'}
                </td>
              </tr>
            )}
            {lista.map((u) => {
              const fotoSrc = u.foto_url ?? null
              return (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 w-10">
                    <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                      {fotoSrc
                        ? <img src={fotoSrc} alt="avatar" className="w-full h-full object-cover" />
                        : u.nombre?.charAt(0).toUpperCase()
                      }
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    <div>{u.nombre}</div>
                    {u.cargo && <div className="text-xs text-gray-400">{u.cargo}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROL_BADGE[u.rol]}`}>
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.disciplinas?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {u.disciplinas.map(d => (
                          <span key={d.disciplina_id ?? d.id} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                            {d.disciplina?.nombre ?? d.nombre}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => abrirEditar(u)} className="text-xs text-blue-600 hover:underline">
                        Editar
                      </button>
                      <button onClick={() => abrirCambiarPwd(u)} className="flex items-center gap-1 text-xs text-amber-600 hover:underline">
                        <KeyRound size={11} /> Contraseña
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Modal crear / editar ──────────────────────────────────────────────── */}
      <Modal open={modal} onClose={cerrar} title={editando ? 'Editar Usuario' : 'Nuevo Usuario'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Avatar + foto (solo al editar) */}
          {editando && (
            <div className="flex items-center gap-4 pb-2 border-b">
              <AvatarEditable
                usuario={editando}
                onFotoChange={onFotoClick}
                loading={subirFoto.isPending}
              />
              <div>
                <p className="text-sm font-medium text-gray-700">{editando.nombre}</p>
                <p className="text-xs text-gray-400">{editando.email}</p>
                {subirFoto.isSuccess && <p className="text-xs text-emerald-600 mt-0.5">Foto actualizada</p>}
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFotoChange} />
            </div>
          )}

          <Input label="Nombre" error={errors.nombre?.message} {...register('nombre')} />
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />

          {!editando && (
            <Input label="Contraseña" type="password" error={errors.password?.message} hint={PASSWORD_HINT} {...register('password')} />
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Rol</label>
            <select className="border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" {...register('rol')}>
              <option value="INSPECTOR">Inspector</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="ADMINISTRADOR">Administrador</option>
            </select>
          </div>

          {(rolActual === 'INSPECTOR' || rolActual === 'SUPERVISOR') && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                Disciplinas <span className="text-gray-400 text-xs">(puede seleccionar varias)</span>
              </label>
              <DisciplinasCheckboxes
                disciplinas={disciplinas}
                value={disciplinasSeleccionadas}
                onChange={setDisciplinasSeleccionadas}
              />
            </div>
          )}

          {editando && (
            <>
              {/* Campos de perfil */}
              <div className="border-t pt-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Perfil</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Título profesional" placeholder="Ej: Ing. Civil" {...register('titulo')} />
                  <Input label="Cargo" placeholder="Ej: Jefe de Turno" {...register('cargo')} />
                  <Input label="Teléfono" placeholder="+56 9 1234 5678" {...register('telefono')} />
                  <Input label="Área funcional" placeholder="Ej: Mantenimiento" {...register('area_funcional')} />
                </div>
                <div className="mt-3 flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Observaciones</label>
                  <textarea
                    rows={2}
                    className="border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    {...register('observaciones')}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="activo" {...register('activo')} className="rounded" />
                <label htmlFor="activo" className="text-sm text-gray-700">Usuario activo</label>
              </div>
            </>
          )}

          {mutError && <p className="text-sm text-red-500">{mutError}</p>}

          <Button type="submit" size="full" loading={crear.isPending || actualizar.isPending}>
            {editando ? 'Guardar Cambios' : 'Crear Usuario'}
          </Button>
        </form>
      </Modal>

      {/* ── Modal cambiar contraseña ──────────────────────────────────────────── */}
      <Modal open={modalPwd} onClose={cerrarPwd} title="Cambiar Contraseña">
        {resetPwd.isSuccess ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-gray-800">Contraseña actualizada</p>
              <p className="text-sm text-gray-500 mt-1">
                La contraseña de <span className="font-medium text-gray-700">{usuarioPwd?.nombre}</span> fue cambiada correctamente.
              </p>
            </div>
            <Button size="full" onClick={cerrarPwd}>Cerrar</Button>
          </div>
        ) : (
          <form onSubmit={handlePwd(onSubmitPwd)} className="space-y-4">
            <p className="text-sm text-gray-500">
              Cambiando contraseña de <span className="font-semibold text-gray-700">{usuarioPwd?.nombre}</span>
            </p>
            <Input label="Nueva contraseña" type="password" error={errPwd.password?.message} hint={PASSWORD_HINT} {...regPwd('password')} />
            <Input label="Confirmar contraseña" type="password" error={errPwd.confirmar?.message} {...regPwd('confirmar')} />
            {resetPwd.error && (
              <p className="text-sm text-red-500">
                {resetPwd.error?.response?.data?.message ?? 'Error al cambiar contraseña'}
              </p>
            )}
            <Button type="submit" size="full" loading={resetPwd.isPending}>
              Actualizar Contraseña
            </Button>
          </form>
        )}
      </Modal>
    </div>
  )
}
