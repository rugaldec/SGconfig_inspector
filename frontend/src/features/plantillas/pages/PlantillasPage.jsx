import { useState } from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown, ClipboardList } from 'lucide-react'
import { usePlantillas, useCrearPlantilla, useActualizarPlantilla, useEliminarPlantilla } from '../hooks/usePlantillas'
import { plantillasApi } from '../api'
import { useDisciplinas } from '../../disciplinas/hooks/useDisciplinas'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Spinner from '../../../shared/components/ui/Spinner'

const TIPO_LABEL = { CHECKBOX_ESTADO: 'Sí/No/N/A', NUMERICO: 'Numérico', TEXTO: 'Texto libre' }

function CampoFila({ campo, idx, total, onChange, onRemove, onMoveUp, onMoveDown }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex flex-col gap-1 flex-shrink-0">
        <button type="button" onClick={onMoveUp} disabled={idx === 0} className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30"><ChevronUp size={13} /></button>
        <button type="button" onClick={onMoveDown} disabled={idx === total - 1} className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30"><ChevronDown size={13} /></button>
      </div>
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          value={campo.etiqueta}
          onChange={e => onChange({ ...campo, etiqueta: e.target.value })}
          placeholder="Descripción del campo..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 col-span-2"
        />
        <select
          value={campo.tipo}
          onChange={e => onChange({ ...campo, tipo: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="CHECKBOX_ESTADO">Sí / No / N/A</option>
          <option value="NUMERICO">Numérico</option>
          <option value="TEXTO">Texto libre</option>
        </select>
        {campo.tipo === 'NUMERICO' ? (
          <input
            value={campo.unidad_medida ?? ''}
            onChange={e => onChange({ ...campo, unidad_medida: e.target.value })}
            placeholder="Unidad (ej: °C, mm, psi)"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <div className="flex items-center gap-2 px-1">
            <input
              type="checkbox"
              id={`oblig-${idx}`}
              checked={campo.es_obligatorio}
              onChange={e => onChange({ ...campo, es_obligatorio: e.target.checked })}
              className="rounded"
            />
            <label htmlFor={`oblig-${idx}`} className="text-xs text-gray-600">Obligatorio</label>
          </div>
        )}
        {campo.tipo === 'NUMERICO' && (
          <div className="flex items-center gap-2 px-1 col-span-2">
            <input
              type="checkbox"
              id={`oblig-${idx}`}
              checked={campo.es_obligatorio}
              onChange={e => onChange({ ...campo, es_obligatorio: e.target.checked })}
              className="rounded"
            />
            <label htmlFor={`oblig-${idx}`} className="text-xs text-gray-600">Obligatorio</label>
          </div>
        )}
      </div>
      <button type="button" onClick={onRemove} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
        <Trash2 size={15} />
      </button>
    </div>
  )
}

const CAMPO_VACIO = () => ({ _key: Math.random(), etiqueta: '', tipo: 'CHECKBOX_ESTADO', es_obligatorio: true, unidad_medida: '' })

export default function PlantillasPage() {
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ nombre: '', descripcion: '', disciplina_id: '' })
  const [campos, setCampos] = useState([])
  const [errMsg, setErrMsg] = useState(null)

  const { data: plantillas, isLoading } = usePlantillas()
  const { data: disciplinas } = useDisciplinas()
  const crear = useCrearPlantilla()
  const actualizar = useActualizarPlantilla()
  const eliminar = useEliminarPlantilla()

  function abrirNueva() {
    setEditando(null)
    setForm({ nombre: '', descripcion: '', disciplina_id: '' })
    setCampos([CAMPO_VACIO()])
    setErrMsg(null)
    setModal(true)
  }

  async function abrirEditar(p) {
    setEditando(p)
    setForm({ nombre: p.nombre, descripcion: p.descripcion ?? '', disciplina_id: p.disciplina_id })
    setCampos([])   // muestra vacío mientras carga
    setErrMsg(null)
    setModal(true)
    try {
      const detalle = await plantillasApi.detalle(p.id)
      setCampos(detalle.campos?.map(c => ({ ...c, _key: c.id })) ?? [])
    } catch {
      setErrMsg('No se pudieron cargar los campos de la plantilla')
    }
  }

  function cerrar() { setModal(false); crear.reset(); actualizar.reset() }

  function actualizarCampo(idx, nuevo) {
    setCampos(prev => prev.map((c, i) => i === idx ? nuevo : c))
  }
  function eliminarCampo(idx) { setCampos(prev => prev.filter((_, i) => i !== idx)) }
  function moverArriba(idx) {
    setCampos(prev => { const a = [...prev]; [a[idx-1], a[idx]] = [a[idx], a[idx-1]]; return a })
  }
  function moverAbajo(idx) {
    setCampos(prev => { const a = [...prev]; [a[idx], a[idx+1]] = [a[idx+1], a[idx]]; return a })
  }

  function onSubmit(e) {
    e.preventDefault()
    if (!form.nombre.trim()) { setErrMsg('El nombre es obligatorio'); return }
    if (!form.disciplina_id) { setErrMsg('Selecciona una disciplina'); return }
    if (campos.length === 0) { setErrMsg('Agrega al menos un campo'); return }
    if (campos.some(c => !c.etiqueta.trim())) { setErrMsg('Todos los campos deben tener descripción'); return }
    setErrMsg(null)

    const payload = {
      ...form,
      campos: campos.map((c, i) => ({
        etiqueta: c.etiqueta.trim(),
        tipo: c.tipo,
        orden: i + 1,
        es_obligatorio: c.es_obligatorio,
        unidad_medida: c.unidad_medida?.trim() || null,
      })),
    }

    if (editando) {
      actualizar.mutate({ id: editando.id, datos: payload }, { onSuccess: cerrar })
    } else {
      crear.mutate(payload, { onSuccess: cerrar })
    }
  }

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-800">Plantillas de Verificación</h1>
        <Button size="sm" onClick={abrirNueva}><Plus size={15} /> Nueva Plantilla</Button>
      </div>

      {!plantillas?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <ClipboardList size={40} className="text-gray-300" />
          <p className="font-medium">No hay plantillas creadas</p>
          <p className="text-sm">Crea plantillas para agregar checklists a tus pautas de inspección</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Nombre', 'Disciplina', 'Campos', 'Estado', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plantillas.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.nombre}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                      {p.disciplina?.nombre}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p._count?.campos ?? 0} campos</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${p.activo ? 'text-emerald-600' : 'text-red-500'}`}>
                      {p.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => abrirEditar(p)} className="text-xs text-blue-600 hover:underline">Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={cerrar} title={editando ? 'Editar Plantilla' : 'Nueva Plantilla de Verificación'}>
        <form onSubmit={onSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Nombre</label>
            <input value={form.nombre} onChange={e => setForm(p => ({...p, nombre: e.target.value}))}
              className="border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Descripción (opcional)</label>
            <textarea rows={2} value={form.descripcion} onChange={e => setForm(p => ({...p, descripcion: e.target.value}))}
              className="border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 resize-none" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Disciplina</label>
            <select value={form.disciplina_id} onChange={e => setForm(p => ({...p, disciplina_id: e.target.value}))}
              className="border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300">
              <option value="">Selecciona disciplina...</option>
              {disciplinas?.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Campos del checklist</label>
              <button type="button" onClick={() => setCampos(p => [...p, CAMPO_VACIO()])}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                <Plus size={13} /> Agregar campo
              </button>
            </div>
            <div className="space-y-2">
              {campos.map((c, i) => (
                <CampoFila key={c._key ?? i} campo={c} idx={i} total={campos.length}
                  onChange={nuevo => actualizarCampo(i, nuevo)}
                  onRemove={() => eliminarCampo(i)}
                  onMoveUp={() => moverArriba(i)}
                  onMoveDown={() => moverAbajo(i)}
                />
              ))}
              {campos.length === 0 && (
                <p className="text-sm text-gray-400 italic text-center py-3">Sin campos — agrega al menos uno</p>
              )}
            </div>
          </div>

          {errMsg && <p className="text-sm text-red-500">{errMsg}</p>}
          {(crear.error || actualizar.error) && (
            <p className="text-sm text-red-500">{(crear.error || actualizar.error)?.response?.data?.message}</p>
          )}

          <Button type="submit" size="full" loading={crear.isPending || actualizar.isPending}>
            {editando ? 'Guardar Cambios' : 'Crear Plantilla'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
