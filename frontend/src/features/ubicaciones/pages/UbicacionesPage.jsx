import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import {
  useArbolUbicaciones,
  useCrearUbicacion,
  useActualizarUbicacion,
  useEliminarUbicacion,
  useImportarUbicaciones,
  useUbicacionesFiltradas,
} from '../hooks/useUbicaciones'
import { ubicacionesApi } from '../api'
import ArbolUbicaciones from '../components/ArbolUbicaciones'
import FiltrosUbicacion from '../components/FiltrosUbicacion'
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

  const [filtros, setFiltros] = useState({})

  const { data: arbol, isLoading } = useArbolUbicaciones()
  const { plantas, areas, activos, componentes, nodosFiltrados } = useUbicacionesFiltradas(filtros)
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
          <div className="relative group">
            <Button variant="secondary" size="sm" loading={exportando} onClick={handleExport}>
              <Download size={14} /> Exportar CSV
            </Button>
            <div className="absolute right-0 top-full mt-2 w-72 bg-gray-900 text-white text-xs rounded-xl p-3 shadow-xl
                            opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
              <p className="font-semibold mb-1">📥 Exportar CSV</p>
              <p className="text-gray-300 leading-relaxed">
                Descarga todas las ubicaciones activas en formato CSV listo para Excel.
                Incluye columna <span className="text-yellow-300 font-mono">accion</span> para indicar qué hacer al reimportar:
              </p>
              <ul className="mt-1.5 space-y-0.5 text-gray-300">
                <li><span className="text-emerald-400 font-mono">AGREGAR</span> — crea nuevos registros</li>
                <li><span className="text-blue-400 font-mono">MODIFICAR</span> — actualiza la descripción</li>
                <li><span className="text-red-400 font-mono">ELIMINAR</span> — desactiva el registro y sus hijos</li>
                <li><span className="text-yellow-300 font-mono">#</span> — comentario, la fila se ignora</li>
              </ul>
              <p className="mt-1.5 text-gray-400">El archivo incluye comentarios de instrucciones al inicio.</p>
              <div className="absolute right-4 -top-1.5 w-3 h-3 bg-gray-900 rotate-45" />
            </div>
          </div>

          <div className="relative group">
            <Button variant="secondary" size="sm" loading={importar.isPending} onClick={() => fileRef.current?.click()}>
              <Upload size={14} /> Importar Excel
            </Button>
            <div className="absolute right-0 top-full mt-2 w-72 bg-gray-900 text-white text-xs rounded-xl p-3 shadow-xl
                            opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
              <p className="font-semibold mb-1">📤 Importar Excel / CSV</p>
              <p className="text-gray-300 leading-relaxed">
                Sube un archivo <span className="text-yellow-300">.xlsx</span> o <span className="text-yellow-300">.csv</span> con la columna
                <span className="text-yellow-300 font-mono"> accion</span> completada. Flujo recomendado:
              </p>
              <ol className="mt-1.5 space-y-0.5 text-gray-300 list-decimal list-inside">
                <li>Exporta el CSV actual</li>
                <li>Edita en Excel: llena columna <span className="font-mono">accion</span></li>
                <li>Agrega filas nuevas con <span className="text-emerald-400 font-mono">AGREGAR</span></li>
                <li>Reimporta aquí</li>
              </ol>
              <p className="mt-1.5 text-gray-300">Las eliminaciones ignoran hallazgos asociados.</p>
              <p className="mt-1 text-gray-400">💡 Filas con <span className="font-mono text-yellow-300">#</span> en columna accion son comentarios y se ignoran.</p>
              <div className="absolute right-4 -top-1.5 w-3 h-3 bg-gray-900 rotate-45" />
            </div>
          </div>

          <Button size="sm" onClick={abrirNuevoRaiz}>
            <Plus size={14} /> Nueva Planta
          </Button>
        </div>
      </div>

      <input ref={fileRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={handleImport} />

      {importResult && (
        <div className="mb-4 bg-white border rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Resultado de importación</p>
            <button onClick={() => setImportResult(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕ cerrar</button>
          </div>
          <div className="flex gap-4 flex-wrap">
            {importResult.creados > 0 && (
              <span className="flex items-center gap-1 text-sm text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full font-medium">
                <span className="text-base">+</span> {importResult.creados} agregados
              </span>
            )}
            {importResult.modificados > 0 && (
              <span className="flex items-center gap-1 text-sm text-blue-700 bg-blue-50 px-3 py-1 rounded-full font-medium">
                <span className="text-base">✎</span> {importResult.modificados} modificados
              </span>
            )}
            {importResult.eliminados > 0 && (
              <span className="flex items-center gap-1 text-sm text-red-700 bg-red-50 px-3 py-1 rounded-full font-medium">
                <span className="text-base">−</span> {importResult.eliminados} eliminados
              </span>
            )}
            {importResult.omitidos > 0 && (
              <span className="flex items-center gap-1 text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                <span className="text-base">—</span> {importResult.omitidos} sin acción (ignoradas)
              </span>
            )}
            {importResult.creados === 0 && importResult.modificados === 0 && importResult.eliminados === 0 && importResult.errores?.length === 0 && (
              <span className="text-sm text-gray-500">Sin cambios aplicados — recuerda llenar la columna <code className="bg-gray-100 px-1 rounded">accion</code></span>
            )}
          </div>
          {importResult.errores?.length > 0 && (
            <div className="border-t pt-2 mt-1">
              <p className="text-xs font-medium text-red-600 mb-1">{importResult.errores.length} fila(s) con error:</p>
              <ul className="space-y-0.5 max-h-32 overflow-y-auto">
                {importResult.errores.map((e, i) => (
                  <li key={i} className="text-xs text-red-600">
                    Fila {e.fila}{e.accion ? ` [${e.accion}]` : ''}: {e.motivo}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <FiltrosUbicacion
        filtros={filtros}
        onChange={setFiltros}
        plantas={plantas}
        areas={areas}
        activos={activos}
        componentes={componentes}
      />

      <div className="bg-white rounded-xl border p-3">
        <ArbolUbicaciones
          nodos={nodosFiltrados ?? arbol ?? []}
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
