import { useState } from 'react'
import { useArbolUbicaciones } from '../../ubicaciones/hooks/useUbicaciones'
import Spinner from '../../../shared/components/ui/Spinner'

// Selector de ubicación opcional (cualquier nivel, no obligatorio nivel 4)
export default function UbicacionOpcionalSelector({ value, onChange }) {
  const { data: arbol, isLoading } = useArbolUbicaciones()
  const [sel, setSel] = useState({ n1: null, n2: null, n3: null })

  if (isLoading) return <div className="py-2"><Spinner size="sm" /></div>

  const plantas    = arbol ?? []
  const areas      = sel.n1?.hijos ?? []
  const activos    = sel.n2?.hijos ?? []
  const componentes = sel.n3?.hijos ?? []

  function pick(nivel, id, lista) {
    const node = lista.find(n => n.id === id) ?? null
    if (nivel === 1) {
      setSel({ n1: node, n2: null, n3: null })
      onChange(node?.id ?? null)
    } else if (nivel === 2) {
      setSel(s => ({ ...s, n2: node, n3: null }))
      onChange(node?.id ?? sel.n1?.id ?? null)
    } else if (nivel === 3) {
      setSel(s => ({ ...s, n3: node }))
      onChange(node?.id ?? sel.n2?.id ?? null)
    } else {
      onChange(id || sel.n3?.id || null)
    }
  }

  const selectClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <select className={selectClass} value={sel.n1?.id || ''} onChange={e => pick(1, e.target.value, plantas)}>
        <option value="">— Planta —</option>
        {plantas.map(n => <option key={n.id} value={n.id}>{n.descripcion}</option>)}
      </select>

      <select className={selectClass} value={sel.n2?.id || ''} onChange={e => pick(2, e.target.value, areas)} disabled={!sel.n1}>
        <option value="">— Área —</option>
        {areas.map(n => <option key={n.id} value={n.id}>{n.descripcion}</option>)}
      </select>

      <select className={selectClass} value={sel.n3?.id || ''} onChange={e => pick(3, e.target.value, activos)} disabled={!sel.n2}>
        <option value="">— Activo —</option>
        {activos.map(n => <option key={n.id} value={n.id}>{n.descripcion}</option>)}
      </select>

      <select className={selectClass} value={value && !sel.n3 ? '' : (componentes.find(c => c.id === value)?.id || '')}
        onChange={e => pick(4, e.target.value, componentes)} disabled={!sel.n3}>
        <option value="">— Componente —</option>
        {componentes.map(n => <option key={n.id} value={n.id}>{n.descripcion}</option>)}
      </select>
    </div>
  )
}
