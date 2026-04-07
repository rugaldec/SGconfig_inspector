import { useState } from 'react'
import { ChevronRight, ChevronDown, Trash2 } from 'lucide-react'

const NIVEL_LABEL = { 1: 'Planta', 2: 'Área', 3: 'Activo', 4: 'Componente' }
const INDENT_PX = { 1: 'pl-0', 2: 'pl-6', 3: 'pl-12', 4: 'pl-[72px]' }

function Nodo({ node, onAgregar, onEditar, onEliminar }) {
  const [expandido, setExpandido] = useState(node.nivel <= 2)
  const tieneHijos = node.hijos?.length > 0

  return (
    <div>
      <div className={`group flex items-center gap-1 py-2 px-2 rounded-xl hover:bg-gray-50 transition-colors ${INDENT_PX[node.nivel] ?? 'pl-0'}`}>
        <button
          onClick={() => setExpandido((v) => !v)}
          className="w-5 h-5 flex items-center justify-center text-gray-400 flex-shrink-0"
        >
          {tieneHijos
            ? expandido ? <ChevronDown size={13} /> : <ChevronRight size={13} />
            : null}
        </button>

        <span className="text-xs text-gray-400 w-20 flex-shrink-0">
          {NIVEL_LABEL[node.nivel] ?? `N${node.nivel}`}
        </span>
        <span className="font-mono text-sm font-medium text-gray-700">{node.codigo}</span>
        <span className="text-sm text-gray-500 ml-2 flex-1 truncate">{node.descripcion}</span>

        {!node.activo && (
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">
            Inactivo
          </span>
        )}

        <div className="hidden group-hover:flex gap-1 flex-shrink-0">
          {node.nivel < 4 && (
            <button
              onClick={() => onAgregar(node)}
              className="text-xs text-blue-600 hover:bg-blue-100 px-2 py-0.5 rounded-lg transition-colors"
            >
              + Hijo
            </button>
          )}
          <button
            onClick={() => onEditar(node)}
            className="text-xs text-gray-500 hover:bg-gray-200 px-2 py-0.5 rounded-lg transition-colors"
          >
            Editar
          </button>
          <button
            onClick={() => onEliminar(node)}
            className="flex items-center text-red-400 hover:bg-red-100 hover:text-red-600 px-2 py-0.5 rounded-lg transition-colors"
            title="Eliminar"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {expandido && tieneHijos && (
        <div>
          {node.hijos.map((h) => (
            <Nodo key={h.id} node={h} onAgregar={onAgregar} onEditar={onEditar} onEliminar={onEliminar} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ArbolUbicaciones({ nodos = [], onAgregar, onEditar, onEliminar }) {
  if (!nodos.length) return (
    <p className="text-center py-10 text-sm text-gray-400">
      Sin ubicaciones. Crea la primera planta.
    </p>
  )

  return (
    <div className="space-y-0.5">
      {nodos.map((n) => (
        <Nodo key={n.id} node={n} onAgregar={onAgregar} onEditar={onEditar} onEliminar={onEliminar} />
      ))}
    </div>
  )
}
