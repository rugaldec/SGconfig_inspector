import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../api/client'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'
import { ChevronRight, ChevronDown, Plus, Upload } from 'lucide-react'

const NIVEL_LABEL = { 1: 'Planta', 2: 'Sistema', 3: 'Subsistema', 4: 'Equipo' }
const INDENT = { 1: 'ml-0', 2: 'ml-6', 3: 'ml-12', 4: 'ml-18' }

function NodoUbicacion({ node, onAgregar, onEditar }) {
  const [expandido, setExpandido] = useState(node.nivel <= 2)
  const tieneHijos = node.hijos?.length > 0

  return (
    <div>
      <div className={`flex items-center gap-1 py-1.5 px-2 rounded-lg hover:bg-gray-50 group ${INDENT[node.nivel] || ''}`}>
        <button onClick={() => setExpandido(!expandido)} className="w-5 h-5 flex items-center justify-center text-gray-400">
          {tieneHijos ? (expandido ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span className="w-3" />}
        </button>
        <span className="text-xs text-gray-400 w-20 flex-shrink-0">{NIVEL_LABEL[node.nivel]}</span>
        <span className="font-mono text-sm text-gray-700 font-medium">{node.codigo}</span>
        <span className="text-sm text-gray-500 ml-2 flex-1 truncate">{node.descripcion}</span>
        <div className="hidden group-hover:flex gap-1 flex-shrink-0">
          {node.nivel < 4 && (
            <button onClick={() => onAgregar(node)} className="text-xs text-blue-600 hover:bg-blue-100 px-2 py-0.5 rounded">
              + Hijo
            </button>
          )}
          <button onClick={() => onEditar(node)} className="text-xs text-gray-500 hover:bg-gray-200 px-2 py-0.5 rounded">
            Editar
          </button>
        </div>
      </div>
      {expandido && tieneHijos && (
        <div>{node.hijos.map(h => <NodoUbicacion key={h.id} node={h} onAgregar={onAgregar} onEditar={onEditar} />)}</div>
      )}
    </div>
  )
}

export default function UbicacionesPage() {
  const qc = useQueryClient()
  const fileRef = useRef(null)
  const [modal, setModal] = useState(false)
  const [padre, setPadre] = useState(null)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ codigo: '', descripcion: '' })
  const [error, setError] = useState(null)
  const [importResult, setImportResult] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['ubicaciones-arbol'],
    queryFn: () => api.get('/ubicaciones').then(r => r.data.data),
  })

  const mutation = useMutation({
    mutationFn: (d) => editando
      ? api.put(`/ubicaciones/${editando.id}`, d)
      : api.post('/ubicaciones', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ubicaciones-arbol'] }); setModal(false) },
    onError: (e) => setError(e.response?.data?.message || 'Error'),
  })

  const importMut = useMutation({
    mutationFn: (fd) => api.post('/ubicaciones/importar', fd),
    onSuccess: ({ data }) => { qc.invalidateQueries({ queryKey: ['ubicaciones-arbol'] }); setImportResult(data.data) },
  })

  function abrirAgregar(nodo) {
    setPadre(nodo)
    setEditando(null)
    setForm({ codigo: '', descripcion: '' })
    setError(null)
    setModal(true)
  }

  function abrirNuevoRaiz() {
    setPadre(null)
    setEditando(null)
    setForm({ codigo: '', descripcion: '' })
    setError(null)
    setModal(true)
  }

  function abrirEditar(nodo) {
    setEditando(nodo)
    setPadre(null)
    setForm({ codigo: nodo.codigo, descripcion: nodo.descripcion })
    setError(null)
    setModal(true)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (editando) {
      mutation.mutate({ descripcion: form.descripcion })
    } else {
      mutation.mutate({ codigo: form.codigo, descripcion: form.descripcion, nivel: padre ? padre.nivel + 1 : 1, padre_id: padre?.id })
    }
  }

  async function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('archivo', file)
    importMut.mutate(fd)
    e.target.value = ''
  }

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-800">Ubicaciones Técnicas</h1>
        <div className="flex gap-2">
          <button onClick={() => fileRef.current.click()}
            className="flex items-center gap-1.5 border text-sm px-3 py-2 rounded-xl hover:bg-gray-50 text-gray-700">
            {importMut.isPending ? <Spinner size="sm" /> : <Upload size={15} />} Importar Excel
          </button>
          <button onClick={abrirNuevoRaiz}
            className="flex items-center gap-1.5 bg-blue-800 text-white text-sm px-3 py-2 rounded-xl hover:bg-blue-900">
            <Plus size={15} /> Nueva Planta
          </button>
        </div>
      </div>
      <input ref={fileRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={handleImport} />

      {importResult && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm">
          <p className="font-medium text-emerald-700">Importación completada: {importResult.creados} creados, {importResult.actualizados} actualizados</p>
          {importResult.errores?.length > 0 && (
            <ul className="mt-1 text-red-600 text-xs space-y-0.5">
              {importResult.errores.map((e, i) => <li key={i}>Fila {e.fila}: {e.motivo}</li>)}
            </ul>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border p-3">
        {data?.map(node => (
          <NodoUbicacion key={node.id} node={node} onAgregar={abrirAgregar} onEditar={abrirEditar} />
        ))}
        {data?.length === 0 && <p className="text-center py-8 text-gray-400">Sin ubicaciones. Crea la primera planta.</p>}
      </div>

      <Modal open={modal} onClose={() => setModal(false)}
        title={editando ? `Editar: ${editando.codigo}` : padre ? `Nuevo hijo de ${padre.codigo}` : 'Nueva Planta'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editando && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
              <input required value={form.codigo} onChange={e => setForm(p => ({ ...p, codigo: e.target.value.toUpperCase() }))}
                placeholder="EJ: PLANTA-01"
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input required value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {padre && <p className="text-xs text-gray-500">Nivel: {NIVEL_LABEL[padre.nivel + 1]}</p>}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={mutation.isPending}
            className="w-full bg-blue-800 text-white py-2.5 rounded-xl font-medium hover:bg-blue-900 disabled:opacity-60 flex items-center justify-center gap-2">
            {mutation.isPending && <Spinner size="sm" />} {editando ? 'Guardar' : 'Crear'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
