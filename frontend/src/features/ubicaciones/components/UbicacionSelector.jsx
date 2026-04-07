import { useState } from 'react'
import { useArbolUbicaciones } from '../hooks/useUbicaciones'
import { MapPin, ChevronDown } from 'lucide-react'
import Spinner from '../../../shared/components/ui/Spinner'

const NIVEL_LABEL = { 1: 'Planta', 2: 'Área', 3: 'Activo', 4: 'Componente' }

export default function UbicacionSelector({ value, onChange, error }) {
  const { data: arbol, isLoading } = useArbolUbicaciones()
  const [sel, setSel] = useState({ n1: null, n2: null, n3: null, n4: null })

  if (isLoading) return <div className="flex justify-center py-3"><Spinner size="sm" /></div>

  const plantas = arbol ?? []
  const zonasFunc = sel.n1?.hijos ?? []
  const equipos   = sel.n2?.hijos ?? []
  const subEquipos = sel.n3?.hijos ?? []

  function pickN1(id) {
    const node = plantas.find(n => n.id === id) ?? null
    setSel({ n1: node, n2: null, n3: null, n4: null })
    onChange(null)
  }
  function pickN2(id) {
    const node = zonasFunc.find(n => n.id === id) ?? null
    setSel(s => ({ ...s, n2: node, n3: null, n4: null }))
    onChange(null)
  }
  function pickN3(id) {
    const node = equipos.find(n => n.id === id) ?? null
    setSel(s => ({ ...s, n3: node, n4: null }))
    onChange(null)
  }
  function pickN4(id) {
    const node = subEquipos.find(n => n.id === id) ?? null
    setSel(s => ({ ...s, n4: node }))
    onChange(node)
  }

  return (
    <div className="space-y-2">
      {/* Nivel 1 — Planta */}
      <SelectNivel
        label={NIVEL_LABEL[1]}
        value={sel.n1?.id ?? ''}
        onChange={pickN1}
        opciones={plantas}
        placeholder="Selecciona planta..."
        error={!sel.n1 && error ? error : null}
      />

      {/* Nivel 2 — Área */}
      {sel.n1 && (
        <SelectNivel
          label={NIVEL_LABEL[2]}
          value={sel.n2?.id ?? ''}
          onChange={pickN2}
          opciones={zonasFunc}
          placeholder="Selecciona área..."
        />
      )}

      {/* Nivel 3 — Activo */}
      {sel.n2 && (
        <SelectNivel
          label={NIVEL_LABEL[3]}
          value={sel.n3?.id ?? ''}
          onChange={pickN3}
          opciones={equipos}
          placeholder="Selecciona activo..."
        />
      )}

      {/* Nivel 4 — Componente (nivel seleccionable para hallazgos) */}
      {sel.n3 && (
        <SelectNivel
          label={NIVEL_LABEL[4]}
          value={sel.n4?.id ?? ''}
          onChange={pickN4}
          opciones={subEquipos}
          placeholder="Selecciona componente..."
          error={sel.n3 && !sel.n4 && error ? error : null}
          highlight
        />
      )}

      {/* Valor seleccionado */}
      {value && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
          <MapPin size={14} className="text-blue-500 flex-shrink-0" />
          <span className="text-sm text-blue-800 font-medium truncate">
            {value.codigo} — {value.descripcion}
          </span>
        </div>
      )}

      {error && !sel.n1 && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}

function SelectNivel({ label, value, onChange, opciones, placeholder, error, highlight }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`
            w-full appearance-none border rounded-xl px-3 py-2.5 pr-8 text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white
            ${error ? 'border-red-400 bg-red-50' :
              highlight ? 'border-blue-400' : 'border-gray-300'}
          `}
        >
          <option value="">{placeholder}</option>
          {opciones.map(n => (
            <option key={n.id} value={n.id}>
              {n.codigo} — {n.descripcion}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {opciones.length === 0 && (
        <p className="text-xs text-gray-400 mt-1">Sin nodos hijos disponibles</p>
      )}
    </div>
  )
}
