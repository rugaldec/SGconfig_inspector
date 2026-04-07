import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../api/client'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'
import { UserPlus } from 'lucide-react'

const ROLES = ['ADMINISTRADOR', 'SUPERVISOR', 'INSPECTOR']
const ROL_COLOR = { ADMINISTRADOR: 'bg-purple-100 text-purple-700', SUPERVISOR: 'bg-blue-100 text-blue-700', INSPECTOR: 'bg-green-100 text-green-700' }

export default function UsuariosPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'INSPECTOR' })
  const [error, setError] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => api.get('/usuarios').then(r => r.data.data),
  })

  const mutation = useMutation({
    mutationFn: (d) => editando ? api.put(`/usuarios/${editando.id}`, d) : api.post('/usuarios', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); setModal(false); setEditando(null) },
    onError: (e) => setError(e.response?.data?.message || 'Error'),
  })

  function abrirNuevo() {
    setForm({ nombre: '', email: '', password: '', rol: 'INSPECTOR' })
    setEditando(null); setError(null); setModal(true)
  }

  function abrirEditar(u) {
    setForm({ nombre: u.nombre, email: u.email, password: '', rol: u.rol })
    setEditando(u); setError(null); setModal(true)
  }

  function handleSubmit(e) {
    e.preventDefault()
    const d = { nombre: form.nombre, email: form.email, rol: form.rol }
    if (!editando || form.password) d.password = form.password
    mutation.mutate(d)
  }

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-800">Usuarios</h1>
        <button onClick={abrirNuevo} className="flex items-center gap-1.5 bg-blue-800 text-white text-sm px-3 py-2 rounded-xl hover:bg-blue-900">
          <UserPlus size={16} /> Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Nombre', 'Email', 'Rol', 'Activo', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{u.nombre}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROL_COLOR[u.rol]}`}>{u.rol}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${u.activo ? 'text-emerald-600' : 'text-red-500'}`}>{u.activo ? 'Sí' : 'No'}</span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => abrirEditar(u)} className="text-blue-600 hover:underline text-xs">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editando ? 'Editar Usuario' : 'Nuevo Usuario'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {['nombre', 'email'].map(f => (
            <div key={f}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{f}</label>
              <input type={f === 'email' ? 'email' : 'text'} required={!editando || f !== 'email' ? true : false}
                value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña{editando ? ' (dejar vacío para no cambiar)' : ''}</label>
            <input type="password" required={!editando} value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select value={form.rol} onChange={e => setForm(p => ({ ...p, rol: e.target.value }))}
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={mutation.isPending}
            className="w-full bg-blue-800 text-white py-2.5 rounded-xl font-medium hover:bg-blue-900 disabled:opacity-60 flex items-center justify-center gap-2">
            {mutation.isPending && <Spinner size="sm" />} {editando ? 'Guardar Cambios' : 'Crear Usuario'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
