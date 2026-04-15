import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown } from 'lucide-react'
import { nuevaPautaSchema } from '../schemas'
import { useCrearPauta } from '../hooks/usePautas'
import { useDisciplinas } from '../../disciplinas/hooks/useDisciplinas'
import { useArbolUbicaciones } from '../../ubicaciones/hooks/useUbicaciones'
import SelectorUBTMulti from '../components/SelectorUBTMulti'
import Button from '../../../shared/components/ui/Button'
import Input from '../../../shared/components/ui/Input'

export default function NuevaPautaPage() {
  const navigate = useNavigate()
  const crear = useCrearPauta()
  const { data: disciplinas } = useDisciplinas()
  const { data: arbol } = useArbolUbicaciones()
  const [ubts, setUbts] = useState([])
  const [ubtError, setUbtError] = useState(null)
  const [plantaId, setPlantaId] = useState('')

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm({
    resolver: zodResolver(nuevaPautaSchema),
    defaultValues: { nombre: '', descripcion: '', disciplina_id: '', zona_funcional_id: '' },
  })

  const plantas = arbol ?? []
  const planta = plantas.find(p => p.id === plantaId)
  const zonas = planta?.hijos ?? []

  function onSubmit(data) {
    if (ubts.length === 0) { setUbtError('Agrega al menos una UBT'); return }
    setUbtError(null)
    crear.mutate(
      { ...data, ubts },
      { onSuccess: (pauta) => navigate(`/supervisor/pautas/${pauta.id}`) },
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-6">Nueva Pauta de Inspección</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input label="Nombre" error={errors.nombre?.message} {...register('nombre')} />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Descripción (opcional)</label>
          <textarea
            rows={3}
            className="border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
            {...register('descripcion')}
          />
        </div>

        {/* Disciplina */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Disciplina</label>
          <div className="relative">
            <select
              className={`w-full appearance-none border rounded-xl px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.disciplina_id ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
              {...register('disciplina_id')}
            >
              <option value="">Selecciona disciplina...</option>
              {disciplinas?.map(d => (
                <option key={d.id} value={d.id}>{d.nombre}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          {errors.disciplina_id && <p className="text-xs text-red-500">{errors.disciplina_id.message}</p>}
        </div>

        {/* Zona Funcional: planta → area */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Zona Funcional (Área)</label>
          <div className="space-y-2">
            <div className="relative">
              <select
                className="w-full appearance-none border rounded-xl px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                value={plantaId}
                onChange={e => setPlantaId(e.target.value)}
              >
                <option value="">Planta...</option>
                {plantas.map(p => <option key={p.id} value={p.id}>{p.codigo} — {p.descripcion}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {plantaId && (
              <Controller
                name="zona_funcional_id"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <select
                      className={`w-full appearance-none border rounded-xl px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.zona_funcional_id ? 'border-red-400 bg-red-50' : 'border-blue-400'
                      }`}
                      value={field.value}
                      onChange={e => field.onChange(e.target.value)}
                    >
                      <option value="">Área...</option>
                      {zonas.map(z => <option key={z.id} value={z.id}>{z.codigo} — {z.descripcion}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                )}
              />
            )}
          </div>
          {errors.zona_funcional_id && <p className="text-xs text-red-500">{errors.zona_funcional_id.message}</p>}
        </div>

        {/* UBTs */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Componentes a inspeccionar (nivel 4)
          </label>
          <SelectorUBTMulti value={ubts} onChange={setUbts} error={ubtError} />
        </div>

        {crear.error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm text-red-700">
            {crear.error?.response?.data?.message || 'Error al crear la pauta'}
          </div>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="secondary" size="full" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" size="full" loading={crear.isPending}>
            Crear Pauta
          </Button>
        </div>
      </form>
    </div>
  )
}
