import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, FileDown, CheckCircle2, Circle, AlertTriangle,
  Users, MapPin, Calendar, BarChart2, Image, ExternalLink, Wrench,
} from 'lucide-react'
import { useEjecucionDetalle } from '../hooks/usePautas'
import { useAuth } from '../../auth/useAuth'
import { pautasApi } from '../api'
import EstadoEjecucionBadge from '../components/EstadoEjecucionBadge'
import ProgresoPauta from '../components/ProgresoPauta'
import Spinner from '../../../shared/components/ui/Spinner'
import Button from '../../../shared/components/ui/Button'

const CRITICIDAD_COLOR = {
  BAJA:   'text-green-600',
  MEDIA:  'text-yellow-600',
  ALTA:   'text-orange-600',
  CRITICA:'text-red-600',
}

function FilaItem({ item, index }) {
  const inspeccionado = item.inspeccionado

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
      inspeccionado ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'
    }`}>
      <div className="flex-shrink-0 mt-0.5">
        {inspeccionado
          ? <CheckCircle2 size={17} className="text-emerald-500" />
          : <Circle size={17} className="text-gray-300" />
        }
      </div>

      <div className="flex-1 min-w-0">
        {/* Código + descripción */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-gray-400">#{index + 1}</span>
          <span className="text-xs font-medium bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
            {item.ubicacion_tecnica?.codigo}
          </span>
          <span className="text-sm font-medium text-gray-800">
            {item.ubicacion_tecnica?.descripcion}
          </span>
        </div>

        {/* Inspector + fecha */}
        {inspeccionado && (
          <div className="mt-1 text-xs text-gray-500 flex items-center gap-1.5 flex-wrap">
            <Users size={10} className="text-gray-400" />
            <span>{item.ejecutado_por?.nombre}</span>
            {item.fecha_inspeccion && (
              <span className="text-gray-400">
                · {new Date(item.fecha_inspeccion).toLocaleString('es-CL', {
                  dateStyle: 'short', timeStyle: 'short',
                })}
              </span>
            )}
          </div>
        )}

        {/* Observación */}
        {item.observacion && (
          <p className="mt-1 text-xs text-gray-600 italic">"{item.observacion}"</p>
        )}

        {/* Foto evidencia inline */}
        {item.foto_url && (
          <div className="mt-2">
            <a href={item.foto_url} target="_blank" rel="noopener noreferrer">
              <img
                src={item.foto_url}
                alt="Evidencia"
                className="rounded-xl max-h-52 w-auto object-cover border border-gray-200 hover:opacity-90 transition-opacity"
              />
            </a>
            <a
              href={item.foto_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs text-blue-500 hover:underline"
            >
              <Image size={11} /> Ver imagen completa
            </a>
          </div>
        )}

        {/* Hallazgo */}
        {item.hallazgo && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <AlertTriangle size={11} className={CRITICIDAD_COLOR[item.hallazgo.criticidad] ?? 'text-gray-500'} />
            <span className="text-xs text-gray-500">Hallazgo:</span>
            <a
              href={`/supervisor/hallazgos/${item.hallazgo.id}`}
              className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-0.5"
              target="_blank" rel="noopener noreferrer"
            >
              {item.hallazgo.numero_aviso}
              <ExternalLink size={10} />
            </a>
          </div>
        )}
      </div>

      {/* Indicador no inspeccionado */}
      {!inspeccionado && (
        <span className="flex-shrink-0 text-xs text-gray-400 italic">Sin inspección</span>
      )}
    </div>
  )
}

export default function ReporteEjecucionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: ejecucion, isLoading } = useEjecucionDetalle(id)
  const [cargandoPdf, setCargandoPdf] = useState(false)

  const esInspector = user?.rol === 'INSPECTOR'
  const rutaVolver  = esInspector ? '/inspector/historial-pautas' : '/admin/historial-pautas'

  async function exportarPdf() {
    setCargandoPdf(true)
    try {
      const resp = await pautasApi.exportarPdfEjecucion(id)
      const blob = resp.data
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `reporte_pauta_${id.slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exportando PDF:', err)
    } finally {
      setCargandoPdf(false)
    }
  }

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  if (!ejecucion) return <p className="text-center text-gray-400 py-16">Reporte no encontrado</p>

  const { cobertura, inspectores_desglose = [], items = [] } = ejecucion
  const inspeccionados = items.filter(i => i.inspeccionado)
  const sinInspeccionar = items.filter(i => !i.inspeccionado)
  const pct = cobertura?.total > 0
    ? Math.round((cobertura.inspeccionados / cobertura.total) * 100) : 0

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate(rutaVolver)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
      >
        <ArrowLeft size={16} /> Volver al historial
      </button>

      {/* Encabezado del reporte */}
      <div className="bg-white rounded-2xl border overflow-hidden mb-4 shadow-sm">
        {/* Barra decorativa */}
        <div className={`h-2 w-full ${ejecucion.estado === 'COMPLETADA' ? 'bg-emerald-500' : 'bg-red-400'}`} />

        <div className="p-5">
          {/* Título + exportar */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
                <Wrench size={10} /> {ejecucion.pauta?.disciplina?.nombre}
              </p>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">
                {ejecucion.pauta?.nombre}
              </h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <EstadoEjecucionBadge estado={ejecucion.estado} />
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Calendar size={11} />
                  {new Date(ejecucion.fecha_inicio).toLocaleDateString('es-CL')}
                  {' — '}
                  {new Date(ejecucion.fecha_fin).toLocaleDateString('es-CL')}
                </span>
              </div>
            </div>

            <Button
              onClick={exportarPdf}
              loading={cargandoPdf}
              size="sm"
            >
              <FileDown size={15} className="mr-1.5" />
              Exportar PDF
            </Button>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-3 gap-3">
            {/* Cobertura */}
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <ProgresoPauta
                inspeccionados={cobertura?.inspeccionados ?? 0}
                total={cobertura?.total ?? 0}
              />
              <p className="text-xs text-gray-500 mt-1">Cobertura</p>
            </div>

            {/* Inspecciones */}
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600">{cobertura?.inspeccionados ?? 0}</p>
              <p className="text-xs text-emerald-700">Inspeccionados</p>
              <p className="text-xs text-gray-400">de {cobertura?.total ?? 0} total</p>
            </div>

            {/* Hallazgos */}
            <div className={`rounded-xl p-3 text-center ${(cobertura?.hallazgos ?? 0) > 0 ? 'bg-amber-50' : 'bg-gray-50'}`}>
              <p className={`text-2xl font-bold ${(cobertura?.hallazgos ?? 0) > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                {cobertura?.hallazgos ?? 0}
              </p>
              <p className={`text-xs ${(cobertura?.hallazgos ?? 0) > 0 ? 'text-amber-700' : 'text-gray-500'}`}>
                Hallazgo{(cobertura?.hallazgos ?? 0) !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-gray-400">registrado{(cobertura?.hallazgos ?? 0) !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Inspectores */}
          {inspectores_desglose.length > 0 && (
            <div className="mt-4 pt-4 border-t flex items-center gap-2 flex-wrap">
              <Users size={13} className="text-gray-400" />
              <span className="text-xs text-gray-400">Participaron:</span>
              {inspectores_desglose.map(ins => (
                <span key={ins.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                  {ins.nombre} ({ins.count})
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sección: Ítems inspeccionados */}
      {inspeccionados.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={15} className="text-emerald-500" />
            <h2 className="text-sm font-semibold text-gray-700">
              Inspeccionados ({inspeccionados.length})
            </h2>
          </div>
          <div className="space-y-2">
            {inspeccionados.map((item, i) => (
              <FilaItem key={item.id} item={item} index={items.indexOf(item)} />
            ))}
          </div>
        </div>
      )}

      {/* Sección: Sin inspeccionar */}
      {sinInspeccionar.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Circle size={15} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-500">
              Sin inspeccionar ({sinInspeccionar.length})
            </h2>
          </div>
          <div className="space-y-2">
            {sinInspeccionar.map((item, i) => (
              <FilaItem key={item.id} item={item} index={items.indexOf(item)} />
            ))}
          </div>
        </div>
      )}

      {/* Botón exportar al pie (visible en móvil) */}
      <div className="mt-6">
        <Button size="full" onClick={exportarPdf} loading={cargandoPdf}>
          <FileDown size={16} className="mr-2" />
          Exportar reporte PDF
        </Button>
      </div>
    </div>
  )
}
