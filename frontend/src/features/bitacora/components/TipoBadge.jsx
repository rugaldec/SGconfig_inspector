import { TIPO_COLOR, TIPO_LABEL } from '../schemas'

export default function TipoBadge({ tipo, small = false }) {
  const c = TIPO_COLOR[tipo] || TIPO_COLOR.OTRO
  return (
    <span className={`inline-flex items-center font-semibold rounded-full ${small ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'} ${c.bg} ${c.text}`}>
      {TIPO_LABEL[tipo] || tipo}
    </span>
  )
}
