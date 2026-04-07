export const TRANSICIONES_VALIDAS = {
  ABIERTO:          ['EN_GESTION', 'RECHAZADO'],
  EN_GESTION:       ['PENDIENTE_CIERRE', 'RECHAZADO'],
  PENDIENTE_CIERRE: ['CERRADO', 'EN_GESTION'],
  CERRADO:          [],
  RECHAZADO:        [],
}

export const ESTADO_CONFIG = {
  ABIERTO:          { label: 'Abierto',        bg: 'bg-blue-100',    text: 'text-blue-700' },
  EN_GESTION:       { label: 'En Gestión',      bg: 'bg-amber-100',   text: 'text-amber-700' },
  PENDIENTE_CIERRE: { label: 'Pend. Cierre',    bg: 'bg-violet-100',  text: 'text-violet-700' },
  CERRADO:          { label: 'Cerrado',          bg: 'bg-emerald-100', text: 'text-emerald-700' },
  RECHAZADO:        { label: 'Rechazado',        bg: 'bg-red-100',     text: 'text-red-700' },
}

export const CRITICIDAD_CONFIG = {
  BAJA:    { label: 'Baja',    bg: 'bg-gray-100',    text: 'text-gray-600' },
  MEDIA:   { label: 'Media',   bg: 'bg-amber-100',   text: 'text-amber-700' },
  ALTA:    { label: 'Alta',    bg: 'bg-orange-100',  text: 'text-orange-700' },
  CRITICA: { label: 'Crítica', bg: 'bg-red-100',     text: 'text-red-700' },
}

export const CATEGORIA_CONFIG = {
  SEGURIDAD:     { label: 'Seguridad',     bg: 'bg-red-100',    text: 'text-red-700' },
  MANTENIMIENTO: { label: 'Mantenimiento', bg: 'bg-blue-100',   text: 'text-blue-700' },
  OPERACIONES:   { label: 'Operaciones',   bg: 'bg-green-100',  text: 'text-green-700' },
}

export function siguientesEstados(estadoActual) {
  return TRANSICIONES_VALIDAS[estadoActual] ?? []
}

export function puedeTransicionar(estadoActual, estadoNuevo) {
  return (TRANSICIONES_VALIDAS[estadoActual] ?? []).includes(estadoNuevo)
}
