import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MapPin, Calendar, ClipboardCheck, History, PlayCircle, ToggleLeft, ToggleRight } from 'lucide-react'
import { usePautaDetalle, useActualizarPauta, useProgramarEjecucion } from '../hooks/usePautas'
import { programarEjecucionSchema } from '../schemas'
import HistorialEjecuciones from '../components/HistorialEjecuciones'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Input from '../../../shared/components/ui/Input'
import Spinner from '../../../shared/components/ui/Spinner'

const TABS = [
  { id: 'definicion', label: 'Definición', icon: ClipboardCheck },
  { id: 'historial',  label: 'Historial',  icon: History },
]

export default function PautaDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('definicion')
  const [modalEjecucion, setModalEjecucion] = useState(false)

  const { data: pauta, isLoading } = usePautaDetalle(id)
  const actualizar = useActualizarPauta()
  const programar = useProgramarEjecucion()

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(programarEjecucionSchema),
  })

  function toggleActivo() {
    actualizar.mutate({ id, datos: { activo: !pauta.activo } })
  }

  function onProgramar(data) {
    programar.mutate(
      { pautaId: id, datos: data },
      {
        onSuccess: (ejecucion) => {
          setModalEjecucion(false)
          reset()
          setTab('historial')
        },
      },
    )
  }

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  if (!pauta) return <p className="text-center text-gray-400 py-16">Pauta no encontrada</p>

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {pauta.disciplina?.nombre}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              pauta.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {pauta.activo ? 'Activa' : 'Inactiva'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-800">{pauta.nombre}</h1>
          {pauta.descripcion && <p className="text-sm text-gray-500 mt-1">{pauta.descripcion}</p>}
          <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
            <MapPin size={12} />
            <span className="font-mono">{pauta.zona_funcional?.codigo}</span>
            <span>{pauta.zona_funcional?.descripcion}</span>
            <span className="ml-2">{pauta._count?.ubts ?? 0} componentes · {pauta._count?.ejecuciones ?? 0} ejecuciones</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          <Button
            size="sm"
            onClick={() => { reset(); setModalEjecucion(true) }}
            disabled={!pauta.activo}
          >
            <PlayCircle size={15} /> Programar ejecución
          </Button>
          <button
            onClick={toggleActivo}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            {pauta.activo
              ? <><ToggleRight size={16} className="text-emerald-500" /> Desactivar</>
              : <><ToggleLeft size={16} /> Activar</>}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b mb-4">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Definición */}
      {tab === 'definicion' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b">
              Componentes a inspeccionar ({pauta.ubts?.length ?? 0})
            </div>
            <div className="divide-y max-h-96 overflow-y-auto">
              {pauta.ubts?.map((u, i) => (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-xs text-gray-400 w-6 flex-shrink-0">{i + 1}</span>
                  <MapPin size={13} className="text-blue-400 flex-shrink-0" />
                  <span className="text-xs font-mono text-gray-500 flex-shrink-0">
                    {u.ubicacion_tecnica?.codigo}
                  </span>
                  <span className="text-sm text-gray-700 truncate">
                    {u.ubicacion_tecnica?.descripcion}
                  </span>
                </div>
              ))}
              {(!pauta.ubts || pauta.ubts.length === 0) && (
                <div className="px-4 py-8 text-center text-gray-400 text-sm">
                  Sin componentes configurados
                </div>
              )}
            </div>
          </div>
          <div className="text-xs text-gray-400">
            Creada por {pauta.creado_por?.nombre} · {new Date(pauta.created_at).toLocaleDateString('es-CL')}
          </div>
        </div>
      )}

      {/* Tab: Historial */}
      {tab === 'historial' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <HistorialEjecuciones pautaId={id} />
        </div>
      )}

      {/* Modal programar ejecución */}
      <Modal open={modalEjecucion} onClose={() => setModalEjecucion(false)} title="Programar Ejecución">
        <form onSubmit={handleSubmit(onProgramar)} className="space-y-4">
          <p className="text-sm text-gray-500">
            Se creará una nueva ronda de <span className="font-semibold text-gray-700">{pauta.nombre}</span>.
            Los {pauta._count?.ubts ?? 0} componentes serán copiados automáticamente.
          </p>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Fecha de inicio</label>
            <input
              type="date"
              className={`border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.fecha_inicio ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
              {...register('fecha_inicio')}
            />
            {errors.fecha_inicio && <p className="text-xs text-red-500">{errors.fecha_inicio.message}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Fecha límite</label>
            <input
              type="date"
              className={`border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.fecha_fin ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
              {...register('fecha_fin')}
            />
            {errors.fecha_fin && <p className="text-xs text-red-500">{errors.fecha_fin.message}</p>}
          </div>
          {programar.error && (
            <p className="text-sm text-red-500">
              {programar.error?.response?.data?.message || 'Error al programar la ejecución'}
            </p>
          )}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" size="full" onClick={() => setModalEjecucion(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="full" loading={programar.isPending}>
              <Calendar size={15} /> Programar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
