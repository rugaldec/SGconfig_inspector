const CONFIG = {
  ABIERTO:          { label: 'Abierto',          bg: 'bg-blue-100',   text: 'text-blue-700' },
  EN_GESTION:       { label: 'En Gestión',        bg: 'bg-amber-100',  text: 'text-amber-700' },
  PENDIENTE_CIERRE: { label: 'Pend. Cierre',      bg: 'bg-violet-100', text: 'text-violet-700' },
  CERRADO:          { label: 'Cerrado',            bg: 'bg-emerald-100',text: 'text-emerald-700' },
  RECHAZADO:        { label: 'Rechazado',          bg: 'bg-red-100',    text: 'text-red-700' },
}

export default function EstadoBadge({ estado }) {
  const cfg = CONFIG[estado] || { label: estado, bg: 'bg-gray-100', text: 'text-gray-600' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  )
}
