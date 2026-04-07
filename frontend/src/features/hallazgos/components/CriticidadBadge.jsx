import Badge from '../../../shared/components/ui/Badge'
import { CRITICIDAD_CONFIG } from '../estadoMachine'

export default function CriticidadBadge({ criticidad }) {
  const cfg = CRITICIDAD_CONFIG[criticidad] ?? { label: criticidad, bg: 'bg-gray-100', text: 'text-gray-600' }
  return <Badge label={cfg.label} bg={cfg.bg} text={cfg.text} />
}
