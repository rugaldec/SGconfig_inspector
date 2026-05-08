import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { X, ChevronRight, Lightbulb, Zap, BookOpen, Search } from 'lucide-react'
import { HELP_SECTIONS, findHelpSection, getSectionsForRole } from './helpContent'

// ── Panel principal de ayuda ──────────────────────────────────────────────────
export default function HelpPanel({ open, onClose, userRol }) {
  const location = useLocation()
  const [selectedId, setSelectedId] = useState(null)
  const [query, setQuery] = useState('')

  // Sincronizar con la ruta actual cuando se abre el panel
  useEffect(() => {
    if (open) {
      const current = findHelpSection(location.pathname)
      setSelectedId(current?.id ?? null)
    }
  }, [open, location.pathname])

  const rolEfectivo = userRol || 'INSPECTOR'
  const sections = getSectionsForRole(rolEfectivo)

  const filtered = query.trim()
    ? sections.filter(s =>
        s.titulo.toLowerCase().includes(query.toLowerCase()) ||
        s.descripcion.toLowerCase().includes(query.toLowerCase()) ||
        s.acciones.some(a => a.accion.toLowerCase().includes(query.toLowerCase()))
      )
    : sections

  const selected = selectedId
    ? HELP_SECTIONS.find(s => s.id === selectedId)
    : null

  // Agrupar por categoría para el índice
  const grouped = groupSections(filtered, rolEfectivo)

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel deslizante */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[520px] bg-white z-50 shadow-2xl flex flex-col">
        {/* Cabecera */}
        <div className="bg-blue-900 text-white px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <BookOpen size={20} />
            <div>
              <h2 className="font-bold text-base leading-tight">Centro de Ayuda</h2>
              <p className="text-blue-300 text-xs">SGConfi Inspector</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-blue-800 rounded-lg transition-colors"
            aria-label="Cerrar ayuda"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex flex-1 overflow-hidden">
          {/* Índice lateral */}
          <aside className="w-44 flex-shrink-0 border-r bg-gray-50 flex flex-col overflow-hidden">
            <div className="p-2 border-b">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="w-full pl-7 pr-2 py-1.5 text-xs border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-1">
              {Object.entries(grouped).map(([grupo, items]) => (
                <div key={grupo}>
                  <p className="px-3 pt-2.5 pb-0.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest select-none">
                    {grupo}
                  </p>
                  {items.map(section => (
                    <button
                      key={section.id}
                      onClick={() => { setSelectedId(section.id); setQuery('') }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-start gap-1.5 transition-colors
                        ${selectedId === section.id
                          ? 'bg-blue-100 text-blue-800 font-semibold border-r-2 border-blue-600'
                          : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      <span className="text-sm leading-none mt-px flex-shrink-0">{section.icono}</span>
                      <span className="leading-snug">{section.titulo}</span>
                    </button>
                  ))}
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-xs text-gray-400 px-3 py-4 text-center">Sin resultados</p>
              )}
            </nav>
          </aside>

          {/* Contenido de la sección seleccionada */}
          <main className="flex-1 overflow-y-auto">
            {selected ? (
              <SectionContent section={selected} />
            ) : (
              <Welcome rol={rolEfectivo} onSelect={setSelectedId} sections={sections} />
            )}
          </main>
        </div>

        {/* Pie */}
        <div className="border-t px-5 py-2.5 flex items-center justify-between flex-shrink-0 bg-gray-50">
          <p className="text-[11px] text-gray-400">
            {sections.length} módulos disponibles para tu rol
          </p>
          {selected && (
            <button
              onClick={() => setSelectedId(null)}
              className="text-[11px] text-blue-600 hover:underline"
            >
              ← Inicio
            </button>
          )}
        </div>
      </div>
    </>
  )
}

// ── Contenido de una sección ──────────────────────────────────────────────────
function SectionContent({ section }) {
  return (
    <div className="p-5">
      {/* Título */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl">{section.icono}</span>
        <h3 className="font-bold text-gray-900 text-lg leading-tight">{section.titulo}</h3>
      </div>

      {/* Roles */}
      <div className="flex gap-1 mb-4">
        {section.roles.map(r => (
          <span key={r} className={`text-[10px] px-2 py-0.5 rounded-full font-medium
            ${r === 'ADMINISTRADOR' ? 'bg-purple-100 text-purple-700' :
              r === 'SUPERVISOR'    ? 'bg-blue-100 text-blue-700' :
                                     'bg-green-100 text-green-700'}`}>
            {r}
          </span>
        ))}
      </div>

      {/* Descripción */}
      <p className="text-sm text-gray-600 leading-relaxed mb-5 bg-gray-50 rounded-xl p-3 border">
        {section.descripcion}
      </p>

      {/* Acciones */}
      <div className="mb-5">
        <div className="flex items-center gap-1.5 mb-3">
          <Zap size={14} className="text-blue-600" />
          <h4 className="font-semibold text-sm text-gray-800">¿Qué puedo hacer aquí?</h4>
        </div>
        <div className="space-y-2">
          {section.acciones.map((a, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-lg border bg-white hover:border-blue-200 transition-colors">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{a.accion}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{a.detalle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      {section.tips?.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Lightbulb size={14} className="text-amber-500" />
            <h4 className="font-semibold text-sm text-gray-800">Consejos útiles</h4>
          </div>
          <div className="space-y-2">
            {section.tips.map((tip, i) => (
              <div key={i} className="flex gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-100">
                <span className="text-amber-500 text-sm flex-shrink-0 mt-px">💡</span>
                <p className="text-xs text-amber-800 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Pantalla de bienvenida ────────────────────────────────────────────────────
function Welcome({ rol, onSelect, sections }) {
  const destacados = sections.slice(0, 6)

  return (
    <div className="p-5">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">👋</div>
        <h3 className="font-bold text-gray-900 text-base">¡Bienvenido a la ayuda!</h3>
        <p className="text-sm text-gray-500 mt-1">
          Selecciona un módulo del índice o explora los accesos rápidos.
        </p>
      </div>

      <div className="mb-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
          Módulos principales
        </p>
        <div className="grid grid-cols-2 gap-2">
          {destacados.map(section => (
            <button
              key={section.id}
              onClick={() => onSelect(section.id)}
              className="flex items-start gap-2 p-3 rounded-xl border bg-white hover:border-blue-300 hover:shadow-sm text-left transition-all group"
            >
              <span className="text-xl flex-shrink-0">{section.icono}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800 group-hover:text-blue-700 leading-snug">
                  {section.titulo}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-snug line-clamp-2">
                  {section.descripcion.slice(0, 60)}…
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
        <p className="text-xs font-semibold text-blue-800 mb-1">💡 Tip rápido</p>
        <p className="text-xs text-blue-700 leading-relaxed">
          La ayuda cambia automáticamente según la página que estás viendo.
          Cierra y vuelve a abrir la ayuda desde cualquier pantalla para ver
          información específica de ese módulo.
        </p>
      </div>
    </div>
  )
}

// ── Agrupar secciones por categoría de rol ────────────────────────────────────
function groupSections(sections, rol) {
  const grupos = {
    INSPECTOR: {
      'General': ['inspector-dashboard', 'mis-hallazgos', 'nuevo-hallazgo', 'hallazgo-detalle'],
      'Pautas': ['inspector-pautas', 'ejecucion-detalle', 'historial-pautas'],
      'Bitácora': ['bitacora', 'nueva-entrada'],
      'Cuenta': ['perfil'],
    },
    SUPERVISOR: {
      'General': ['dashboard', 'hallazgos-supervisor', 'nuevo-hallazgo', 'hallazgo-detalle', 'mi-disciplina'],
      'Pautas': ['inspector-pautas', 'ejecucion-detalle', 'historial-pautas'],
      'Bitácora': ['bitacora', 'nueva-entrada'],
      'Cuenta': ['perfil'],
    },
    ADMINISTRADOR: {
      'Gestión': ['dashboard', 'hallazgos-supervisor', 'nuevo-hallazgo', 'hallazgo-detalle'],
      'Pautas': ['inspector-pautas', 'pautas-admin', 'pauta-detalle-admin', 'ejecucion-detalle', 'historial-pautas', 'plantillas'],
      'Bitácora': ['bitacora', 'nueva-entrada'],
      'Administración': ['usuarios', 'disciplinas', 'ubicaciones', 'listas-correo', 'logs-correo', 'logs-acceso'],
      'Cuenta': ['perfil'],
    },
  }

  const mapa = grupos[rol] || grupos.INSPECTOR
  const result = {}
  const used = new Set()

  for (const [grupo, ids] of Object.entries(mapa)) {
    const items = ids
      .map(id => sections.find(s => s.id === id))
      .filter(Boolean)
    if (items.length > 0) {
      result[grupo] = items
      items.forEach(s => used.add(s.id))
    }
  }

  // Agregar secciones no agrupadas
  const resto = sections.filter(s => !used.has(s.id))
  if (resto.length > 0) result['Otros'] = resto

  return result
}
