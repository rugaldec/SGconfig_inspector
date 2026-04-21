const OPCIONES = [
  { value: 'ENTRADA',    label: 'Novedades',    color: 'bg-blue-100 text-blue-700 border-blue-300'    },
  { value: 'HALLAZGO',   label: 'Hallazgos',    color: 'bg-red-100 text-red-700 border-red-300'       },
  { value: 'INSPECCION', label: 'Inspecciones', color: 'bg-purple-100 text-purple-700 border-purple-300' },
]

export default function FiltrosOrigen({ activos, onChange }) {
  function toggle(value) {
    if (activos.includes(value)) {
      if (activos.length === 1) return  // al menos uno siempre activo
      onChange(activos.filter(v => v !== value))
    } else {
      onChange([...activos, value])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {OPCIONES.map(op => {
        const isActive = activos.includes(op.value)
        return (
          <button
            key={op.value}
            onClick={() => toggle(op.value)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all
              ${isActive ? op.color : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}
          >
            {isActive ? '● ' : '○ '}{op.label}
          </button>
        )
      })}
    </div>
  )
}
