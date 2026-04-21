import { z } from 'zod'

export const TIPOS_BITACORA = [
  { value: 'NOVEDAD',           label: 'Novedad' },
  { value: 'INCIDENTE',         label: 'Incidente' },
  { value: 'TRABAJO_REALIZADO', label: 'Trabajo Realizado' },
  { value: 'CONDICION_AREA',    label: 'Condición Área' },
  { value: 'REUNION',           label: 'Reunión' },
  { value: 'OTRO',              label: 'Otro' },
]

export const nuevaEntradaSchema = z.object({
  titulo:        z.string().min(3, 'Mínimo 3 caracteres').max(200),
  descripcion:   z.string().min(5, 'Mínimo 5 caracteres'),
  tipo:          z.enum(['NOVEDAD', 'INCIDENTE', 'TRABAJO_REALIZADO', 'CONDICION_AREA', 'REUNION', 'OTRO'], {
    errorMap: () => ({ message: 'Selecciona un tipo' }),
  }),
  disciplina_id: z.string().uuid('Selecciona una disciplina'),
  fecha:         z.string().min(1, 'Selecciona una fecha'),
  ubicacion_id:  z.string().optional().nullable(),
})

export const TIPO_COLOR = {
  NOVEDAD:           { bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-500'   },
  INCIDENTE:         { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-500' },
  TRABAJO_REALIZADO: { bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-500'  },
  CONDICION_AREA:    { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-500' },
  REUNION:           { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-500' },
  OTRO:              { bg: 'bg-gray-100',   text: 'text-gray-800',   border: 'border-gray-400'   },
  SIN_NOVEDADES:     { bg: 'bg-gray-100',   text: 'text-gray-500',   border: 'border-gray-300'   },
  HALLAZGO:          { bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-500'    },
  INSPECCION:        { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-500' },
}

export const TIPO_LABEL = {
  NOVEDAD:           'Novedad',
  INCIDENTE:         'Incidente',
  TRABAJO_REALIZADO: 'Trabajo Realizado',
  CONDICION_AREA:    'Condición Área',
  REUNION:           'Reunión',
  OTRO:              'Otro',
  SIN_NOVEDADES:     'Sin Novedades',
  HALLAZGO:          'Hallazgo',
  INSPECCION:        'Inspección',
}

export const CRITICIDAD_COLOR = {
  BAJA:    { bg: 'bg-green-100',  text: 'text-green-800'  },
  MEDIA:   { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  ALTA:    { bg: 'bg-orange-100', text: 'text-orange-800' },
  CRITICA: { bg: 'bg-red-100',    text: 'text-red-800'    },
}
