// Renderiza los campos de una PlantillaVerificacion
// Props:
//   campos: CampoPlantilla[]
//   respuestas: { [campo_id]: string }
//   onChange: (campo_id, valor) => void
//   errores: { [campo_id]: string }   — campos obligatorios sin valor

const CHECKBOX_OPTS = [
  { valor: 'SI',  label: 'Sí',  cls: 'bg-emerald-500 text-white border-emerald-500', hover: 'hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700' },
  { valor: 'NO',  label: 'No',  cls: 'bg-red-500 text-white border-red-500',         hover: 'hover:bg-red-50 hover:border-red-400 hover:text-red-700' },
  { valor: 'NA',  label: 'N/A', cls: 'bg-gray-400 text-white border-gray-400',       hover: 'hover:bg-gray-100 hover:border-gray-400 hover:text-gray-600' },
]

export default function ChecklistDinamico({ campos = [], respuestas = {}, onChange, errores = {} }) {
  if (!campos.length) return null

  return (
    <div className="space-y-3">
      {campos.map(campo => {
        const valor = respuestas[campo.id] ?? ''
        const error = errores[campo.id]

        return (
          <div key={campo.id} className={`rounded-xl border p-3 transition-colors ${
            error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-medium text-gray-700 leading-snug">
                {campo.etiqueta}
                {campo.es_obligatorio && <span className="text-red-500 ml-0.5">*</span>}
              </p>
            </div>

            {campo.tipo === 'CHECKBOX_ESTADO' && (
              <div className="flex gap-2">
                {CHECKBOX_OPTS.map(opt => (
                  <button
                    key={opt.valor}
                    type="button"
                    onClick={() => onChange(campo.id, opt.valor)}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all active:scale-95
                      ${valor === opt.valor
                        ? opt.cls
                        : `bg-white border-gray-200 text-gray-400 ${opt.hover}`
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {campo.tipo === 'NUMERICO' && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="any"
                  value={valor}
                  onChange={e => onChange(campo.id, e.target.value)}
                  placeholder="0"
                  className={`flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    error ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                {campo.unidad_medida && (
                  <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-2 rounded-xl border border-gray-200 whitespace-nowrap">
                    {campo.unidad_medida}
                  </span>
                )}
              </div>
            )}

            {campo.tipo === 'TEXTO' && (
              <textarea
                rows={2}
                value={valor}
                onChange={e => onChange(campo.id, e.target.value)}
                placeholder="Escribe aquí..."
                className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                  error ? 'border-red-400' : 'border-gray-300'
                }`}
              />
            )}

            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        )
      })}
    </div>
  )
}
