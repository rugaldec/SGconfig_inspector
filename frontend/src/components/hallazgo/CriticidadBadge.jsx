const CONFIG = {
  BAJA:    { label: 'Baja',    bg: 'bg-gray-100',   text: 'text-gray-600' },
  MEDIA:   { label: 'Media',   bg: 'bg-amber-100',  text: 'text-amber-700' },
  ALTA:    { label: 'Alta',    bg: 'bg-orange-100', text: 'text-orange-700' },
  CRITICA: { label: 'Crítica', bg: 'bg-red-100',    text: 'text-red-700' },
}

export default function CriticidadBadge({ criticidad }) {
  const cfg = CONFIG[criticidad] || { label: criticidad, bg: 'bg-gray-100', text: 'text-gray-600' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  )
}
