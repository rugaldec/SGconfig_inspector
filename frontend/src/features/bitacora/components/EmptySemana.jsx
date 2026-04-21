import { ClipboardList, PlusCircle, CheckSquare } from 'lucide-react'
import { useAuth } from '../../../features/auth/useAuth'

export default function EmptySemana({ haySoloAutomaticos, onAgregarEntrada, onConfirmarSinNovedades, cargandoConfirmar, esActual }) {
  const { rolEfectivo } = useAuth()
  const puedeConfirmar = rolEfectivo !== 'INSPECTOR'

  if (!esActual && !haySoloAutomaticos) {
    return (
      <div className="text-center py-12 text-gray-400">
        <ClipboardList size={40} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm font-medium">Sin actividad en esta semana</p>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border-2 border-dashed p-6 ${haySoloAutomaticos ? 'border-gray-200 bg-gray-50' : 'border-blue-200 bg-blue-50'}`}>
      <div className="flex items-start gap-3">
        <ClipboardList size={22} className={haySoloAutomaticos ? 'text-gray-400 mt-0.5' : 'text-blue-500 mt-0.5'} />
        <div className="flex-1">
          <p className={`font-semibold text-sm ${haySoloAutomaticos ? 'text-gray-600' : 'text-blue-800'}`}>
            {haySoloAutomaticos ? 'Sin novedades manuales esta semana' : 'Sin actividad esta semana'}
          </p>
          <p className={`text-xs mt-0.5 ${haySoloAutomaticos ? 'text-gray-500' : 'text-blue-600'}`}>
            {haySoloAutomaticos
              ? 'No se registraron entradas manuales en este período.'
              : 'No hay entradas, hallazgos ni inspecciones registradas.'}
          </p>

          {esActual && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={onAgregarEntrada}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusCircle size={13} /> Agregar entrada
              </button>
              {puedeConfirmar && (
                <button
                  onClick={onConfirmarSinNovedades}
                  disabled={cargandoConfirmar}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-700 text-xs rounded-lg border hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <CheckSquare size={13} /> Confirmar sin novedades
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
