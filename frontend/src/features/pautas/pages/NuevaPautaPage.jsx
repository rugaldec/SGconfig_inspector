import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown, ClipboardCheck, Camera, X } from 'lucide-react'
import { nuevaPautaSchema } from '../schemas'
import { useCrearPauta } from '../hooks/usePautas'
import { useDisciplinas } from '../../disciplinas/hooks/useDisciplinas'
import { usePlantillas } from '../../plantillas/hooks/usePlantillas'
import SelectorUBTMulti from '../components/SelectorUBTMulti'
import Button from '../../../shared/components/ui/Button'
import Input from '../../../shared/components/ui/Input'

export default function NuevaPautaPage() {
  const navigate = useNavigate()
  const crear = useCrearPauta()
  const { data: disciplinas } = useDisciplinas()
  const [ubts, setUbts] = useState([])
  const [ubtError, setUbtError] = useState(null)
  const [ubtPlantillas, setUbtPlantillas] = useState({})
  const [equipoPlantillas, setEquipoPlantillas] = useState({})
  const [fotoFile, setFotoFile] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const fotoRef = useRef(null)

  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: zodResolver(nuevaPautaSchema),
    defaultValues: { nombre: '', descripcion: '', disciplina_id: '' },
  })

  const disciplinaId = useWatch({ control, name: 'disciplina_id' })
  const { data: plantillas } = usePlantillas(disciplinaId ? { disciplina_id: disciplinaId } : undefined)

  // Clave de agrupación: activo_id si existe, sino prefijo del código del componente
  function getGrupoKey(u) {
    if (u.activo_id) return u.activo_id
    const partes = u.codigo?.split('-') ?? []
    return partes.length > 1 ? partes.slice(0, -1).join('-') : u.codigo ?? '__sin_activo__'
  }

  // Cambiar checklist de un componente individual
  // Guarda '' para "explícitamente sin checklist" (distinto de undefined = sin override)
  function setPlantillaUbt(ubtId, plantillaId) {
    setUbtPlantillas(prev => ({ ...prev, [ubtId]: plantillaId }))
  }

  // Cambiar checklist a nivel equipo — solo guarda su propio valor, NO toca los componentes
  function setPlantillaEquipo(grupoKey, plantillaId) {
    setEquipoPlantillas(prev => ({ ...prev, [grupoKey]: plantillaId || null }))
  }

  // Agrupar ubts por activo (o por prefijo de código como fallback)
  function gruposPorActivo(lista) {
    const map = new Map()
    lista.forEach(u => {
      const key = getGrupoKey(u)
      const activo_codigo = u.activo_codigo ?? key
      const activo_descripcion = u.activo_descripcion ?? null
      if (!map.has(key)) map.set(key, { grupoKey: key, activo_codigo, activo_descripcion, items: [] })
      map.get(key).items.push(u)
    })
    return Array.from(map.values())
  }

  function onDisciplinaChange(e) {
    setUbtPlantillas({})
    setEquipoPlantillas({})
    return e
  }

  function handleFotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  function quitarFoto() {
    setFotoFile(null)
    setFotoPreview(null)
  }

  function onSubmit(data) {
    if (ubts.length === 0) { setUbtError('Agrega al menos una UBT'); return }
    setUbtError(null)
    const ubtsFinal = ubts.map(u => ({
      ...u,
      plantilla_verif_id: ubtPlantillas[u.ubicacion_tecnica_id] !== undefined
        ? (ubtPlantillas[u.ubicacion_tecnica_id] || null)
        : (equipoPlantillas[getGrupoKey(u)] || null),
    }))
    crear.mutate(
      { ...data, ubts: ubtsFinal, foto: fotoFile ?? undefined },
      { onSuccess: (pauta) => navigate(`/admin/pautas/${pauta.id}`) },
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

        {/* Foto identificadora */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Foto identificadora <span className="text-gray-400 font-normal text-xs">(opcional)</span>
          </label>
          <input ref={fotoRef} type="file" accept="image/*" className="hidden" onChange={handleFotoChange} />
          {fotoPreview ? (
            <div className="relative w-32 h-24 rounded-xl overflow-hidden border border-gray-200">
              <img src={fotoPreview} alt="preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={quitarFoto}
                className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-0.5 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fotoRef.current?.click()}
              className="w-32 h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
            >
              <Camera size={20} />
              <span className="text-xs">Agregar foto</span>
            </button>
          )}
        </div>

        {/* Disciplina */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Disciplina</label>
          <div className="relative">
            <select
              className={`w-full appearance-none border rounded-xl px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.disciplina_id ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
              {...register('disciplina_id', { onChange: onDisciplinaChange })}
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

        {/* UBTs */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Componentes a inspeccionar
            <span className="ml-1.5 text-xs text-gray-400 font-normal">
              — podés agregar de distintas áreas
            </span>
          </label>
          <SelectorUBTMulti value={ubts} onChange={setUbts} error={ubtError} />
        </div>

        {/* Asignación de checklist — agrupado por Activo */}
        {ubts.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <ClipboardCheck size={15} className="text-indigo-500" />
              <label className="text-sm font-medium text-gray-700">
                Checklist por equipo / componente
                <span className="ml-1.5 text-xs text-gray-400 font-normal">— opcional</span>
              </label>
            </div>
            {!disciplinaId ? (
              <p className="text-xs text-gray-400 italic px-1">Selecciona una disciplina primero.</p>
            ) : !plantillas?.length ? (
              <p className="text-xs text-gray-400 italic px-1">No hay plantillas activas para esta disciplina.</p>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                {gruposPorActivo(ubts).map(grupo => (
                  <div key={grupo.grupoKey}>
                    {/* Fila Equipo (nivel 3) — selector independiente que propaga hacia abajo */}
                    <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50">
                      <div className="flex-1 min-w-0 flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Equipo</span>
                        <span className="text-xs font-mono text-indigo-600 font-semibold">{grupo.activo_codigo}</span>
                        <span className="text-xs text-gray-700 font-medium truncate">{grupo.activo_descripcion}</span>
                      </div>
                      <select
                        value={equipoPlantillas[grupo.grupoKey] ?? ''}
                        onChange={e => setPlantillaEquipo(grupo.grupoKey, e.target.value)}
                        className="text-xs border border-indigo-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white max-w-[180px] font-medium text-indigo-700"
                      >
                        <option value="">Sin checklist</option>
                        {plantillas.map(p => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                    {/* Filas Componente (nivel 4) — override individual. Los ítems nivel 3 no tienen fila separada. */}
                    {grupo.items.filter(ubt => ubt.activo_id !== ubt.ubicacion_tecnica_id).map(ubt => (
                      <div key={ubt.ubicacion_tecnica_id} className="flex items-center gap-3 px-3 py-2 pl-7 border-t border-gray-100">
                        <div className="flex-1 min-w-0 flex items-center gap-1.5">
                          <span className="text-xs font-mono text-gray-400">{ubt.codigo}</span>
                          <span className="text-xs text-gray-600 truncate">{ubt.descripcion}</span>
                        </div>
                        <select
                          value={ubtPlantillas[ubt.ubicacion_tecnica_id] !== undefined
                            ? ubtPlantillas[ubt.ubicacion_tecnica_id]
                            : equipoPlantillas[grupo.grupoKey] ?? ''}
                          onChange={e => setPlantillaUbt(ubt.ubicacion_tecnica_id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white max-w-[180px]"
                        >
                          <option value="">Sin checklist</option>
                          {plantillas.map(p => (
                            <option key={p.id} value={p.id}>{p.nombre}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
