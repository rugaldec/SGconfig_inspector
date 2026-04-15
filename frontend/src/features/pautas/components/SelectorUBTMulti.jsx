import { useState } from 'react'
import { useArbolUbicaciones } from '../../ubicaciones/hooks/useUbicaciones'
import { Plus, X, MapPin, ChevronDown } from 'lucide-react'
import Spinner from '../../../shared/components/ui/Spinner'

const NIVEL_LABEL = { 1: 'Planta', 2: 'Área', 3: 'Activo', 4: 'Componente' }

export default function SelectorUBTMulti({ value = [], onChange, error }) {
  const { data: arbol, isLoading } = useArbolUbicaciones()
  const [sel, setSel] = useState({ n1: null, n2: null, n3: null, n4: null })

  if (isLoading) return <div className="flex justify-center py-3"><Spinner size="sm" /></div>

  const plantas    = arbol ?? []
  const zonasFunc  = sel.n1?.hijos ?? []
  const equipos    = sel.n2?.hijos ?? []
  const subEquipos = sel.n3?.hijos ?? []

  function pickN1(id) {
    const node = plantas.find(n => n.id === id) ?? null
    setSel({ n1: node, n2: null, n3: null, n4: null })
  }
  function pickN2(id) {
    const node = zonasFunc.find(n => n.id === id) ?? null
    setSel(s => ({ ...s, n2: node, n3: null, n4: null }))
  }
  function pickN3(id) {
    const node = equipos.find(n => n.id === id) ?? null
    setSel(s => ({ ...s, n3: node, n4: null }))
  }
  function pickN4(id) {
    const node = subEquipos.find(n => n.id === id) ?? null
    setSel(s => ({ ...s, n4: node }))
  }

  function agregarSeleccion() {
    if (!sel.n4) return
    const yaTiene = value.some(u => u.ubicacion_tecnica_id === sel.n4.id)
    if (yaTiene) return
    onChange([
      ...value,
      {
        ubicacion_tecnica_id: sel.n4.id,
        codigo: sel.n4.codigo,
        descripcion: sel.n4.descripcion,
        orden: value.length + 1,
      },
    ])
    setSel(s => ({ ...s, n4: null }))
  }

  function agregarTodosDelActivo() {
    if (!sel.n3 || subEquipos.length === 0) return
    const nuevos = subEquipos
      .filter(n => !value.some(u => u.ubicacion_tecnica_id === n.id))
      .map((n, i) => ({
        ubicacion_tecnica_id: n.id,
        codigo: n.codigo,
        descripcion: n.descripcion,
        orden: value.length + i + 1,
      }))
    onChange([...value, ...nuevos])
  }

  function quitar(id) {
    onChange(
      value
        .filter(u => u.ubicacion_tecnica_id !== id)
        .map((u, i) => ({ ...u, orden: i + 1 }))
    )
  }

  return (
    <div className="space-y-3">
      {/* Selectores en cascada */}
      <div className="space-y-2">
        <SelectNivel label={NIVEL_LABEL[1]} value={sel.n1?.id ?? ''} onChange={pickN1} opciones={plantas} placeholder="Planta..." />
        {sel.n1 && <SelectNivel label={NIVEL_LABEL[2]} value={sel.n2?.id ?? ''} onChange={pickN2} opciones={zonasFunc} placeholder="Área..." />}
        {sel.n2 && <SelectNivel label={NIVEL_LABEL[3]} value={sel.n3?.id ?? ''} onChange={pickN3} opciones={equipos} placeholder="Activo..." />}
        {sel.n3 && (
          <div className="space-y-1.5">
            <SelectNivel label={NIVEL_LABEL[4]} value={sel.n4?.id ?? ''} onChange={pickN4} opciones={subEquipos} placeholder="Componente..." highlight />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={agregarSeleccion}
                disabled={!sel.n4}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={12} /> Agregar componente
              </button>
              {subEquipos.length > 0 && (
                <button
                  type="button"
                  onClick={agregarTodosDelActivo}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <Plus size={12} /> Agregar todos del activo ({subEquipos.length})
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Lista seleccionada */}
      {value.length > 0 && (
        <div className="border rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b">
            UBTs seleccionadas ({value.length})
          </div>
          <div className="divide-y max-h-48 overflow-y-auto">
            {value.map((u, i) => (
              <div key={u.ubicacion_tecnica_id} className="flex items-center gap-2 px-3 py-2">
                <span className="text-xs text-gray-400 w-5 flex-shrink-0">{i + 1}</span>
                <MapPin size={12} className="text-blue-400 flex-shrink-0" />
                <span className="text-xs font-mono text-gray-500 flex-shrink-0">{u.codigo}</span>
                <span className="text-xs text-gray-700 flex-1 truncate">{u.descripcion}</span>
                <button
                  type="button"
                  onClick={() => quitar(u.ubicacion_tecnica_id)}
                  className="text-gray-300 hover:text-red-500 flex-shrink-0 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function SelectNivel({ label, value, onChange, opciones, placeholder, highlight }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`w-full appearance-none border rounded-xl px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
            highlight ? 'border-blue-400' : 'border-gray-300'
          }`}
        >
          <option value="">{placeholder}</option>
          {opciones.map(n => (
            <option key={n.id} value={n.id}>{n.codigo} — {n.descripcion}</option>
          ))}
        </select>
        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
      {opciones.length === 0 && (
        <p className="text-xs text-gray-400 mt-1">Sin nodos disponibles</p>
      )}
    </div>
  )
}
