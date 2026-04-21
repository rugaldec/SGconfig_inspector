import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, FileText } from 'lucide-react'
import { useBitacora, useConfirmarSinNovedades } from '../hooks/useBitacora'
import SemanaSelector, { semanaActual } from '../components/SemanaSelector'
import FiltrosOrigen from '../components/FiltrosOrigen'
import EntradaCard from '../components/EntradaCard'
import HallazgoCard from '../components/HallazgoCard'
import InspeccionCard from '../components/InspeccionCard'
import SinNovedadesCard from '../components/SinNovedadesCard'
import EmptySemana from '../components/EmptySemana'
import ModalReporte from '../components/ModalReporte'
import Spinner from '../../../shared/components/ui/Spinner'
import { useAuth } from '../../auth/useAuth'

// Agrupa items por día ISO "YYYY-MM-DD"
function agruparPorDia(items) {
  const map = {}
  for (const item of items) {
    const dia = new Date(item.fecha).toISOString().slice(0, 10)
    if (!map[dia]) map[dia] = []
    map[dia].push(item)
  }
  return Object.entries(map).sort(([a], [b]) => b.localeCompare(a))
}

function formatDia(dia) {
  return new Date(dia + 'T12:00:00Z').toLocaleDateString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
  })
}

export default function BitacoraPage({ baseUrl }) {
  const navigate = useNavigate()
  const { rolEfectivo } = useAuth()
  const [semana, setSemana] = useState(semanaActual())
  const [origenes, setOrigenes] = useState(['ENTRADA', 'HALLAZGO', 'INSPECCION'])
  const [showReporte, setShowReporte] = useState(false)

  const { data, isLoading, isError } = useBitacora({ semana })
  const confirmar = useConfirmarSinNovedades()

  const esActual = semana === semanaActual()
  const items = data?.items || []
  const sinNovedadesConfirmado = data?.sin_novedades_confirmado

  // Filtrar por origen seleccionado
  const itemsFiltrados = items.filter(i => {
    if (i.meta?.tipo === 'SIN_NOVEDADES') return true  // siempre visible
    return origenes.includes(i.origen)
  })

  const entradas = items.filter(i => i.origen === 'ENTRADA' && i.meta?.tipo !== 'SIN_NOVEDADES')
  const automaticos = items.filter(i => i.origen !== 'ENTRADA')

  const grupos = agruparPorDia(itemsFiltrados)

  const mostrarEmptyTotal = items.length === 0
  const mostrarEmptyParcial = !sinNovedadesConfirmado && entradas.length === 0 && automaticos.length > 0

  function handleConfirmarSinNovedades() {
    // Se necesita disciplina_id — si el usuario tiene una sola, usar esa
    confirmar.mutate({ semana })
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <h1 className="text-xl font-bold text-gray-900">Bitácora</h1>
        {esActual && (
          <button
            onClick={() => navigate(`${baseUrl}/bitacora/nueva`)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors"
          >
            <PlusCircle size={16} /> Nueva entrada
          </button>
        )}
      </div>

      {/* Selector de semana */}
      <div className="bg-white rounded-xl border p-3 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <SemanaSelector semana={semana} onChange={setSemana} />
        <button
          onClick={() => setShowReporte(true)}
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-600 transition-colors"
        >
          <FileText size={14} /> Reporte PDF
        </button>
      </div>

      {/* Filtros */}
      <div className="mb-4">
        <FiltrosOrigen activos={origenes} onChange={setOrigenes} />
      </div>

      {/* Contenido */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : isError ? (
        <div className="text-center py-12 text-red-500 text-sm">Error al cargar la bitácora</div>
      ) : (
        <>
          {/* Empty state total */}
          {mostrarEmptyTotal && (
            <EmptySemana
              haySoloAutomaticos={false}
              esActual={esActual}
              onAgregarEntrada={() => navigate(`${baseUrl}/bitacora/nueva`)}
              onConfirmarSinNovedades={handleConfirmarSinNovedades}
              cargandoConfirmar={confirmar.isPending}
            />
          )}

          {/* Empty state parcial (hay hallazgos/inspecciones pero no entradas) */}
          {mostrarEmptyParcial && (
            <div className="mb-4">
              <EmptySemana
                haySoloAutomaticos={true}
                esActual={esActual}
                onAgregarEntrada={() => navigate(`${baseUrl}/bitacora/nueva`)}
                onConfirmarSinNovedades={handleConfirmarSinNovedades}
                cargandoConfirmar={confirmar.isPending}
              />
            </div>
          )}

          {/* Lista agrupada por día */}
          {grupos.map(([dia, items]) => (
            <div key={dia} className="mb-6">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                {formatDia(dia)}
              </h2>
              <div className="space-y-3">
                {items.map(item => {
                  if (item.origen === 'ENTRADA' && item.meta?.tipo === 'SIN_NOVEDADES') {
                    return <SinNovedadesCard key={item.id} item={item} />
                  }
                  if (item.origen === 'ENTRADA') {
                    return <EntradaCard key={item.id} item={item} baseUrl={baseUrl} />
                  }
                  if (item.origen === 'HALLAZGO') {
                    return <HallazgoCard key={item.id} item={item} />
                  }
                  if (item.origen === 'INSPECCION') {
                    return <InspeccionCard key={item.id} item={item} />
                  }
                  return null
                })}
              </div>
            </div>
          ))}
        </>
      )}

      {showReporte && (
        <ModalReporte semana={semana} onClose={() => setShowReporte(false)} />
      )}
    </div>
  )
}
