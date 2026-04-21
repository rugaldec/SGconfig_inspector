import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { nuevaEntradaSchema, TIPOS_BITACORA } from '../schemas'
import { useCrearEntrada, useMisDisciplinas } from '../hooks/useBitacora'
import CamaraInput from '../../hallazgos/components/CamaraInput'
import ArchivosInput from '../components/ArchivosInput'
import UbicacionOpcionalSelector from '../components/UbicacionOpcionalSelector'
import Spinner from '../../../shared/components/ui/Spinner'
import { useAuth } from '../../auth/useAuth'

function hoy() {
  return new Date().toISOString().slice(0, 10)
}

export default function NuevaEntradaPage({ baseUrl }) {
  const navigate = useNavigate()
  const { rolEfectivo } = useAuth()
  const crear = useCrearEntrada()
  const { data: disciplinas = [], isLoading: cargandoDisciplinas } = useMisDisciplinas()

  const [fotos, setFotos] = useState([])
  const [archivos, setArchivos] = useState([])

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(nuevaEntradaSchema),
    defaultValues: { fecha: hoy() },
  })

  async function onSubmit(data) {
    const fd = new FormData()
    fd.append('titulo', data.titulo)
    fd.append('descripcion', data.descripcion)
    fd.append('tipo', data.tipo)
    fd.append('disciplina_id', data.disciplina_id)
    fd.append('fecha', data.fecha)
    if (data.ubicacion_id) fd.append('ubicacion_id', data.ubicacion_id)
    fotos.forEach(f => fd.append('fotos', f))
    archivos.forEach(a => fd.append('archivos', a))

    crear.mutate(fd, {
      onSuccess: () => navigate(`${baseUrl}/bitacora`),
    })
  }

  if (cargandoDisciplinas) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  const inputClass = 'w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const labelClass = 'block text-sm font-semibold text-gray-700 mb-1'

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">←</button>
        <h1 className="text-xl font-bold text-gray-900">Nueva entrada</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Fecha y Tipo */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Fecha</label>
            <input type="date" {...register('fecha')} className={inputClass} max={hoy()} />
            {errors.fecha && <p className="text-xs text-red-600 mt-1">{errors.fecha.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Tipo</label>
            <select {...register('tipo')} className={inputClass}>
              <option value="">— Seleccionar —</option>
              {TIPOS_BITACORA.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {errors.tipo && <p className="text-xs text-red-600 mt-1">{errors.tipo.message}</p>}
          </div>
        </div>

        {/* Disciplina */}
        <div>
          <label className={labelClass}>Disciplina</label>
          <select {...register('disciplina_id')} className={inputClass}>
            <option value="">— Seleccionar —</option>
            {disciplinas.map(d => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </select>
          {errors.disciplina_id && <p className="text-xs text-red-600 mt-1">{errors.disciplina_id.message}</p>}
        </div>

        {/* Título */}
        <div>
          <label className={labelClass}>Título</label>
          <input {...register('titulo')} placeholder="Resumen breve de la novedad" className={inputClass} />
          {errors.titulo && <p className="text-xs text-red-600 mt-1">{errors.titulo.message}</p>}
        </div>

        {/* Descripción */}
        <div>
          <label className={labelClass}>Descripción</label>
          <textarea
            {...register('descripcion')}
            rows={4}
            placeholder="Detalle lo ocurrido..."
            className={`${inputClass} resize-none`}
          />
          {errors.descripcion && <p className="text-xs text-red-600 mt-1">{errors.descripcion.message}</p>}
        </div>

        {/* Ubicación */}
        <div>
          <label className={labelClass}>Ubicación <span className="font-normal text-gray-400">(opcional)</span></label>
          <Controller
            name="ubicacion_id"
            control={control}
            render={({ field }) => (
              <UbicacionOpcionalSelector value={field.value} onChange={field.onChange} />
            )}
          />
        </div>

        {/* Fotos */}
        <div>
          <label className={labelClass}>Fotos <span className="font-normal text-gray-400">(máx. 5)</span></label>
          <CamaraInput fotos={fotos} onChange={setFotos} max={5} />
        </div>

        {/* Archivos */}
        <div>
          <label className={labelClass}>Archivos adjuntos <span className="font-normal text-gray-400">(máx. 10)</span></label>
          <ArchivosInput archivos={archivos} onChange={setArchivos} max={10} />
        </div>

        {/* Error global */}
        {crear.isError && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {crear.error?.response?.data?.message || 'Error al crear la entrada'}
          </p>
        )}

        {/* Botones */}
        <div className="flex gap-3 pt-2 pb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-3 border rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={crear.isPending}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {crear.isPending ? 'Guardando...' : 'Guardar entrada'}
          </button>
        </div>
      </form>
    </div>
  )
}
