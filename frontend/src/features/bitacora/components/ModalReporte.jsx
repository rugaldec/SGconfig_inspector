import { useState } from 'react'
import { X, Download } from 'lucide-react'
import { useReporteSemanal } from '../hooks/useReporteSemanal'

export default function ModalReporte({ semana, disciplinaId, onClose }) {
  const reporte = useReporteSemanal()
  const [incluirFotos, setIncluirFotos] = useState(true)

  function handleDescargar() {
    reporte.mutate(
      { semana, disciplina_id: disciplinaId || undefined, incluir_fotos: incluirFotos },
      { onSuccess: onClose },
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-bold text-gray-900">Reporte Semanal PDF</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Semana</p>
            <p className="text-sm font-medium text-gray-800">{semana}</p>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={incluirFotos}
              onChange={e => setIncluirFotos(e.target.checked)}
              className="w-4 h-4 accent-blue-600"
            />
            <div>
              <p className="text-sm font-medium text-gray-700">Incluir fotos en el reporte</p>
              <p className="text-xs text-gray-400">Aumenta el tamaño del PDF</p>
            </div>
          </label>
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={handleDescargar}
            disabled={reporte.isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Download size={15} />
            {reporte.isPending ? 'Generando...' : 'Descargar PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}
