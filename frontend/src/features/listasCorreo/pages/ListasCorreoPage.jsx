import { useState } from 'react'
import { useArbolUbicaciones } from '../../ubicaciones/hooks/useUbicaciones'
import {
  useListasCorreo,
  useCrearListaCorreo,
  useActualizarListaCorreo,
  useEliminarListaCorreo,
} from '../hooks/useListasCorreo'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Spinner from '../../../shared/components/ui/Spinner'
import { Plus, Mail, Trash2, Power, ChevronDown } from 'lucide-react'

function TagEmail({ email, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
      {email}
      {onRemove && (
        <button type="button" onClick={onRemove} className="hover:text-red-600 ml-0.5">×</button>
      )}
    </span>
  )
}

export default function ListasCorreoPage() {
  const { data: arbol, isLoading: loadingArbol } = useArbolUbicaciones()
  const { data: listas, isLoading: loadingListas } = useListasCorreo()
  const crear = useCrearListaCorreo()
  const actualizar = useActualizarListaCorreo()
  const eliminar = useEliminarListaCorreo()

  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [plantaId, setPlantaId] = useState('')
  const [zonaId, setZonaId] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [emails, setEmails] = useState([])
  const [formError, setFormError] = useState(null)

  function abrirNueva() {
    setEditando(null); setPlantaId(''); setZonaId(''); setDescripcion('')
    setEmails([]); setEmailInput(''); setFormError(null); setModal(true)
  }

  function abrirEditar(lista) {
    setEditando(lista)
    setPlantaId(lista.zona_funcional.padre?.id ?? '')
    setZonaId(lista.zona_funcional_id)
    setDescripcion(lista.descripcion ?? ''); setEmails(lista.emails ?? [])
    setEmailInput(''); setFormError(null); setModal(true)
  }

  function cerrar() { setModal(false); crear.reset(); actualizar.reset() }

  function agregarEmail() {
    const v = emailInput.trim().toLowerCase()
    if (!v || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setFormError('Ingresa un email válido'); return
    }
    if (emails.includes(v)) { setFormError('Email ya agregado'); return }
    setEmails(e => [...e, v]); setEmailInput(''); setFormError(null)
  }

  function quitarEmail(em) { setEmails(e => e.filter(x => x !== em)) }

  function onSubmit(e) {
    e.preventDefault()
    if (!zonaId) { setFormError('Selecciona una Zona Funcional'); return }
    if (!emails.length) { setFormError('Agrega al menos un email'); return }
    setFormError(null)

    if (editando) {
      actualizar.mutate({ id: editando.id, datos: { emails, descripcion } }, { onSuccess: cerrar })
    } else {
      crear.mutate({ zona_funcional_id: zonaId, emails, descripcion }, { onSuccess: cerrar })
    }
  }

  function toggleActivo(lista) {
    actualizar.mutate({ id: lista.id, datos: { activo: !lista.activo } })
  }

  const isLoading = loadingArbol || loadingListas

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Listas de Correo</h1>
          <p className="text-sm text-gray-500 mt-0.5">Notificaciones por Zona Funcional al crear hallazgos</p>
        </div>
        <Button size="sm" onClick={abrirNueva}>
          <Plus size={14} /> Nueva Lista
        </Button>
      </div>

      {!listas?.length ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border">
          <Mail size={36} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Sin listas configuradas</p>
          <p className="text-sm mt-1">Crea la primera lista para comenzar a recibir notificaciones</p>
        </div>
      ) : (
        <div className="space-y-3">
          {listas.map(lista => (
            <div key={lista.id} className={`bg-white rounded-xl border p-4 ${!lista.activo ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-gray-700">
                      {lista.zona_funcional.codigo}
                    </span>
                    <span className="text-sm text-gray-500">— {lista.zona_funcional.descripcion}</span>
                    {lista.zona_funcional.padre && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {lista.zona_funcional.padre.descripcion}
                      </span>
                    )}
                    {!lista.activo && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Inactiva</span>
                    )}
                  </div>
                  {lista.descripcion && (
                    <p className="text-xs text-gray-500 mt-1">{lista.descripcion}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {lista.emails.map(em => <TagEmail key={em} email={em} />)}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleActivo(lista)}
                    title={lista.activo ? 'Desactivar' : 'Activar'}
                    className={`p-1.5 rounded-lg transition-colors ${lista.activo ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-100'}`}
                  >
                    <Power size={15} />
                  </button>
                  <button
                    onClick={() => abrirEditar(lista)}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors text-xs font-medium px-2"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => eliminar.mutate(lista.id)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modal}
        onClose={cerrar}
        title={editando ? `Editar lista — ${editando.zona_funcional.codigo}` : 'Nueva Lista de Correo'}
      >
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Zona funcional — selector jerárquico */}
          {!editando && (
            <div className="space-y-3">
              {/* Nivel 1 — Planta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Planta</label>
                <div className="relative">
                  <select
                    value={plantaId}
                    onChange={e => { setPlantaId(e.target.value); setZonaId('') }}
                    className="w-full appearance-none border rounded-xl px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-gray-300"
                  >
                    <option value="">Selecciona una planta...</option>
                    {(arbol ?? []).map(p => (
                      <option key={p.id} value={p.id}>{p.codigo} — {p.descripcion}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Nivel 2 — Zona Funcional (aparece solo si hay planta seleccionada) */}
              {plantaId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zona Funcional</label>
                  <div className="relative">
                    <select
                      value={zonaId}
                      onChange={e => setZonaId(e.target.value)}
                      className="w-full appearance-none border rounded-xl px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white border-gray-300"
                    >
                      <option value="">Selecciona una zona funcional...</option>
                      {(arbol ?? []).find(p => p.id === plantaId)?.hijos?.map(z => (
                        <option key={z.id} value={z.id}>{z.codigo} — {z.descripcion}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
            <input
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Ej: Jefatura Zona Eléctrica"
              className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
            />
          </div>

          {/* Agregar emails */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Emails destinatarios</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), agregarEmail())}
                placeholder="correo@empresa.cl"
                className="flex-1 border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
              />
              <Button type="button" size="sm" variant="secondary" onClick={agregarEmail}>
                Agregar
              </Button>
            </div>
            {emails.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 p-2 bg-gray-50 rounded-lg">
                {emails.map(em => <TagEmail key={em} email={em} onRemove={() => quitarEmail(em)} />)}
              </div>
            )}
          </div>

          {(formError || crear.error || actualizar.error) && (
            <p className="text-sm text-red-500">
              {formError
                || crear.error?.response?.data?.message
                || actualizar.error?.response?.data?.message}
            </p>
          )}

          <Button type="submit" size="full" loading={crear.isPending || actualizar.isPending}>
            {editando ? 'Guardar cambios' : 'Crear lista'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
