import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Wrench, PlusCircle, Pencil, Trash2 } from 'lucide-react'
import {
  useDisciplinas,
  useCrearDisciplina,
  useActualizarDisciplina,
  useEliminarDisciplina,
} from '../hooks/useDisciplinas'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Input from '../../../shared/components/ui/Input'
import Spinner from '../../../shared/components/ui/Spinner'

const schema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  descripcion: z.string().optional(),
})

export default function DisciplinasPage() {
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const { data: disciplinas, isLoading } = useDisciplinas({ soloActivo: 'false' })
  const crear = useCrearDisciplina()
  const actualizar = useActualizarDisciplina()
  const eliminar = useEliminarDisciplina()

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  function abrirNueva() {
    setEditando(null)
    reset({ nombre: '', descripcion: '' })
    setModal(true)
  }

  function abrirEditar(d) {
    setEditando(d)
    reset({ nombre: d.nombre, descripcion: d.descripcion ?? '' })
    setModal(true)
  }

  function cerrar() {
    setModal(false)
    crear.reset()
    actualizar.reset()
  }

  function onSubmit(data) {
    const payload = { nombre: data.nombre, descripcion: data.descripcion || null }
    if (editando) {
      actualizar.mutate({ id: editando.id, datos: payload }, { onSuccess: cerrar })
    } else {
      crear.mutate(payload, { onSuccess: cerrar })
    }
  }

  function toggleActivo(d) {
    actualizar.mutate({ id: d.id, datos: { activo: !d.activo } })
  }

  function onEliminar() {
    eliminar.mutate(confirmDelete.id, { onSuccess: () => setConfirmDelete(null) })
  }

  const mutError = editando
    ? actualizar.error?.response?.data?.message
    : crear.error?.response?.data?.message

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Wrench size={20} /> Disciplinas
        </h1>
        <Button size="sm" onClick={abrirNueva}>
          <PlusCircle size={15} /> Nueva Disciplina
        </Button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Nombre', 'Descripción', 'Inspectores', 'Pautas', 'Estado', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {disciplinas?.map(d => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{d.nombre}</td>
                <td className="px-4 py-3 text-gray-500">{d.descripcion ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{d._count.usuarios}</td>
                <td className="px-4 py-3 text-gray-600">{d._count.pautas}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActivo(d)}
                    className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${
                      d.activo
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {d.activo ? 'Activa' : 'Inactiva'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => abrirEditar(d)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(d)}
                      className="text-red-500 hover:text-red-700"
                      title="Eliminar"
                      disabled={d._count.usuarios > 0 || d._count.pautas > 0}
                    >
                      <Trash2 size={14} className={d._count.usuarios > 0 || d._count.pautas > 0 ? 'opacity-30' : ''} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {disciplinas?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">
                  No hay disciplinas registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal crear / editar */}
      <Modal open={modal} onClose={cerrar} title={editando ? 'Editar Disciplina' : 'Nueva Disciplina'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nombre" error={errors.nombre?.message} {...register('nombre')} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Descripción (opcional)</label>
            <textarea
              rows={3}
              className="border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
              {...register('descripcion')}
            />
          </div>
          {mutError && <p className="text-sm text-red-500">{mutError}</p>}
          <Button type="submit" size="full" loading={crear.isPending || actualizar.isPending}>
            {editando ? 'Guardar Cambios' : 'Crear Disciplina'}
          </Button>
        </form>
      </Modal>

      {/* Modal confirmar eliminar */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Eliminar Disciplina">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿Eliminar la disciplina <span className="font-semibold">{confirmDelete?.nombre}</span>?
            Esta acción no se puede deshacer.
          </p>
          {eliminar.error && (
            <p className="text-sm text-red-500">{eliminar.error?.response?.data?.message}</p>
          )}
          <div className="flex gap-3">
            <Button size="full" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button size="full" variant="danger" loading={eliminar.isPending} onClick={onEliminar}>
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
