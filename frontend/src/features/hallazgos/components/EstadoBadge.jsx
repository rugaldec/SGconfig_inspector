import Badge from '../../../shared/components/ui/Badge'
import { ESTADO_CONFIG } from '../estadoMachine'

export default function EstadoBadge({ estado }) {
  const cfg = ESTADO_CONFIG[estado] ?? { label: estado, bg: 'bg-gray-100', text: 'text-gray-600' }
  return <Badge label={cfg.label} bg={cfg.bg} text={cfg.text} />
}
