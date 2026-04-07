import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import {
  useArbolUbicaciones,
  useCrearUbicacion,
  useActualizarUbicacion,
  useEliminarUbicacion,
  useImportarUbicaciones,
} from '../hooks/useUbicaciones'
import { ubicacionesApi } from '../api'
import ArbolUbicaciones from '../components/ArbolUbicaciones'
import Modal from '../../../shared/components/ui/Modal'
import Button from '../../../shared/components/ui/Button'
import Input from '../../../shared/components/ui/Input'
import Spinner from '../../../shared/components/ui/Spinner'
import { Plus, Upload, Download } from 'lucide-react'

const NIVEL_LABEL = { 1: 'Planta', 2: 'Área', 3: 'Activo', 4: 'Componente' }

export default function UbicacionesPage() {
  const fileRef = useRef(null)

  // Modal crear/editar
  const [modal, setModal] = useState(false)
  const [padre, setPadre] = useState(null)
  const [editando, setEditando] = useState(null)

  // Modal confirmar eliminar
  const [confirmEliminar, setConfirmEliminar] = useState(null) // nodo

  // Modal error con opción desactivar (TIENE_HALLAZGOS)
  const [errorEliminar, setErrorEliminar] = useState(null) // { nodo, mensaje }

  // Importación
  const [importResult, setImportResult] = useState(null)
  const [exportando, setExportando] = useState(false)

  const { data: arbol, isLoading } = useArbolUbicaciones()
  const crear = useCrearUbicacion()
  const actualizar = useActualizarUbicacion()
  const eliminar = useEliminarUbicacion()
  const importar = useImportarUbicaciones()

  async function handleExport() {
    setExportando(true)
    try {
      const blob = await ubicacionesApi.exportarCsv()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'ubicaciones.csv'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExportando(false)
    }
  }

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  function abrirNuevoRaiz() {
    setPadre(null); setEditando(null); reset({ codigo: '', descripcion: '' }); setModal(true)
  }

  function abrirAgregar(nodo) {
    setPadre(nodo); setEditando(null); reset({ codigo: nodo.codigo + '-', descripcion: '' }); setModal(true)
  }

  function abrirEditar(nodo) {
    setEditando(nodo); setPadre(null); reset({ descripcion: nodo.descripcion }); setModal(true)
  }

  function cerrarModal() {
    setModal(false)
    crear.reset()
    actualizar.reset()
  }

  function onSubmit(data) {
    if (editando) {
      actualizar.mutate(
        { id: editando.id, datos: { descripcion: data.descripcion } },
        { onSuccess: cerrarModal }
      )
    } else {
      crear.mutate(
        {
          codigo: data.codigo.toUpperCase(),
          descripcion: data.descripcion,
          nivel: padre ? padre.nivel + 1 : 1,
          padre_id: padre?.id ?? null,
        },
        { onSuccess: cerrarModal }
      )
    }
  }

  function abrirConfirmEliminar(nodo) {
    eliminar.reset()
    setConfirmEliminar(nodo)
  }

  function handleEliminar() {
    eliminar.mutate(confirmEliminar.id, {
      onSuccess: () => setConfirmEliminar(null),
      onError: (err) => {
        const codigo = err?.response?.data?.error
        if (codigo === 'TIENE_HALLAZGOS') {
          const mensaje = err?.response?.data?.message ?? 'Tiene hallazgos asociados.'
          setErrorEliminar({ nodo: confirmEliminar, mensaje })
          setConfirmEliminar(null)
        }
        // CON_HIJOS: el error se muestra inline en el modal de confirmación
      },
    })
  }

  function handleDesactivar() {
    actualizar.mutate(
      { id: errorEliminar.nodo.id, datos: { activo: false } },
      { onSuccess: () => setErrorEliminar(null) }
    )
  }

  function handleImport(e) {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    importar.mutate(archivo, {
      onSuccess: (result) => setImportResult(result),
    })
    e.target.value = ''
  }

  const mutError = editando
    ? actualizar.error?.response?.data?.message
    : crear.error?.response?.data?.message

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-800">Ubicaciones Técnicas</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" loading={exportando} onClick={handleExport}>
            <Download size={14} /> Exportar CSV
          </Button>
          <Button variant="secondary" size="sm" loading={importar.isPending} onClick={() => fileRef.current?.click()}>
            <Upload size={14} /> Importar Excel
          </Button>
          <Button size="sm" onClick={abrirNuevoRaiz}>
            <Plus size={14} /> Nueva Planta
          </Button>
        </div>
      </div>

      <input ref={fileRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={handleImport} />

      {importResult && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
          <p className="text-sm font-medium text-emerald-700">
            Importación: {importResult.creados} creados
            {importResult.omitidos > 0 && `, ${importResult.omitidos} omitidos por código duplicado`}
          </p>
          {importResult.errores?.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {importResult.errores.map((e, i) => (
                <li key={i} className="text-xs text-red-600">Fila {e.fila}: {e.motivo}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border p-3">
        <ArbolUbicaciones
          nodos={arbol ?? []}
          onAgregar={abrirAgregar}
          onEditar={abrirEditar}
          onEliminar={abrirConfirmEliminar}
        />
      </div>

      {/* Modal crear / editar */}
      <Modal
        open={modal}
        onClose={cerrarModal}
        title={
          editando
            ? `Editar: ${editando.codigo}`
            : padre
              ? `Nuevo ${NIVEL_LABEL[padre.nivel + 1] ?? 'nodo'} en ${padre.codigo}`
              : 'Nueva Planta'
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!editando && (
            <Input
              label="Código"
              placeholder={padre ? `${padre.codigo}-SUFIJO` : 'EJ: PLANTA-01'}
              className="font-mono uppercase"
              error={errors.codigo?.message}
              {...register('codigo', {
                required: 'El código es obligatorio',
                validate: (val) => {
                  if (!padre) return true
                  const prefijo = padre.codigo.toUpperCase() + '-'
                  const v = val.toUpperCase()
                  if (!v.startsWith(prefijo)) return `Debe comenzar con ${prefijo}`
                  if (v === prefijo) return 'Agrega un sufijo después del guion'
                  return true
                },
              })}
            />
          )}
          <Input
            label="Descripción"
            error={errors.descripcion?.message}
            {...register('descripcion', { required: 'La descripción es obligatoria' })}
          />
          {padre && !editando && (
            <p className="text-xs text-gray-500">
              Nivel: <strong>{NIVEL_LABEL[padre.nivel + 1]}</strong> · Padre: {padre.codigo}
            </p>
          )}
          {mutError && <p className="text-sm text-red-500">{mutError}</p>}
          <Button type="submit" size="full" loading={crear.isPending || actualizar.isPending}>
            {editando ? 'Guardar Cambios' : 'Crear'}
          </Button>
        </form>
      </Modal>

      {/* Modal confirmar eliminar */}
      <Modal
        open={!!confirmEliminar}
        onClose={() => setConfirmEliminar(null)}
        title="Eliminar ubicación"
      >
        <p className="text-sm text-gray-600 mb-1">
          ¿Eliminar <strong className="font-mono">{confirmEliminar?.codigo}</strong> — {confirmEliminar?.descripcion}?
        </p>
        <p className="text-xs text-gray-400 mb-4">
          La ubicación dejará de aparecer en nuevos hallazgos.
        </p>
        {eliminar.error && (
          <p className="text-sm text-red-500 mb-3">
            {eliminar.error?.response?.data?.message ?? 'Error al eliminar.'}
          </p>
        )}
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={() => setConfirmEliminar(null)}>
            Cancelar
          </Button>
          <Button variant="danger" size="sm" loading={eliminar.isPending} onClick={handleEliminar}>
            Eliminar
          </Button>
        </div>
      </Modal>

      {/* Modal error TIENE_HALLAZGOS — ofrece desactivar como alternativa */}
      <Modal
        open={!!errorEliminar}
        onClose={() => { setErrorEliminar(null); actualizar.reset() }}
        title="No se puede eliminar"
      >
        <p className="text-sm text-gray-600 mb-1">
          <strong className="font-mono">{errorEliminar?.nodo?.codigo}</strong> — {errorEliminar?.nodo?.descripcion}
        </p>
        <p className="text-sm text-gray-500 mb-1">{errorEliminar?.mensaje}</p>
        <p className="text-sm text-gray-500 mb-4">
          Puedes <strong>desactivarla</strong> para ocultarla de nuevos registros sin perder el historial de hallazgos.
        </p>
        {actualizar.error && (
          <p className="text-sm text-red-500 mb-3">
            {actualizar.error?.response?.data?.message ?? 'Error al desactivar.'}
          </p>
        )}
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={() => { setErrorEliminar(null); actualizar.reset() }}>
            Cancelar
          </Button>
          <Button variant="danger" size="sm" loading={actualizar.isPending} onClick={handleDesactivar}>
            Desactivar
          </Button>
        </div>
      </Modal>
    </div>
  )
}
