const NIVELES = ['Planta', 'Área', 'Activo', 'Componente']

export default function FiltrosUbicacion({ filtros, onChange, plantas, areas, activos, componentes }) {
  const { plantaId, areaId, activoId, componenteId } = filtros
  const hayFiltro = plantaId || areaId || activoId || componenteId

  function cambiar(campo, valor, limpiar = []) {
    const nuevo = { ...filtros, [campo]: valor || undefined }
    for (const c of limpiar) delete nuevo[c]
    onChange(nuevo)
  }

  const labelFiltroActivo = [
    plantas.find((n) => n.id === plantaId)?.codigo,
    areas.find((n) => n.id === areaId)?.codigo,
    activos.find((n) => n.id === activoId)?.codigo,
    componentes.find((n) => n.id === componenteId)?.codigo,
  ].filter(Boolean).join(' › ')

  return (
    <div className="mb-4 bg-white rounded-xl border p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filtrar por nivel</span>
        {hayFiltro && (
          <button
            type="button"
            onClick={() => onChange({})}
            className="text-xs text-blue-600 hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {/* Planta */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">{NIVELES[0]}</label>
          <select
            value={plantaId ?? ''}
            onChange={(e) => cambiar('plantaId', e.target.value, ['areaId', 'activoId', 'componenteId'])}
            className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Todas</option>
            {plantas.map((n) => (
              <option key={n.id} value={n.id}>{n.codigo} — {n.descripcion}</option>
            ))}
          </select>
        </div>

        {/* Área */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">{NIVELES[1]}</label>
          <select
            value={areaId ?? ''}
            onChange={(e) => cambiar('areaId', e.target.value, ['activoId', 'componenteId'])}
            disabled={!plantaId}
            className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">Todas</option>
            {areas.map((n) => (
              <option key={n.id} value={n.id}>{n.codigo} — {n.descripcion}</option>
            ))}
          </select>
        </div>

        {/* Activo */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">{NIVELES[2]}</label>
          <select
            value={activoId ?? ''}
            onChange={(e) => cambiar('activoId', e.target.value, ['componenteId'])}
            disabled={!areaId}
            className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">Todos</option>
            {activos.map((n) => (
              <option key={n.id} value={n.id}>{n.codigo} — {n.descripcion}</option>
            ))}
          </select>
        </div>

        {/* Componente */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">{NIVELES[3]}</label>
          <select
            value={componenteId ?? ''}
            onChange={(e) => cambiar('componenteId', e.target.value)}
            disabled={!activoId}
            className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">Todos</option>
            {componentes.map((n) => (
              <option key={n.id} value={n.id}>{n.codigo} — {n.descripcion}</option>
            ))}
          </select>
        </div>
      </div>

      {hayFiltro && labelFiltroActivo && (
        <p className="text-xs text-gray-400">
          Mostrando: <span className="font-medium text-gray-600">{labelFiltroActivo}</span>
        </p>
      )}
    </div>
  )
}
