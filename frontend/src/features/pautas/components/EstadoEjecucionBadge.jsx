const CONFIG = {
  PENDIENTE:  { label: 'Pendiente',  cls: 'bg-gray-100 text-gray-600' },
  EN_CURSO:   { label: 'En Curso',   cls: 'bg-blue-100 text-blue-700' },
  COMPLETADA: { label: 'Completada', cls: 'bg-emerald-100 text-emerald-700' },
  VENCIDA:    { label: 'Vencida',    cls: 'bg-red-100 text-red-600' },
}

export default function EstadoEjecucionBadge({ estado }) {
  const cfg = CONFIG[estado] ?? CONFIG.PENDIENTE
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}
