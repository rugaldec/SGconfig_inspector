import { z } from 'zod'

export const nuevoHallazgoSchema = z.object({
  ubicacion_tecnica_id: z.string().min(1, 'Selecciona una ubicación técnica'),
  descripcion: z.string().min(10, 'Mínimo 10 caracteres'),
  criticidad: z.enum(['BAJA', 'MEDIA', 'ALTA', 'CRITICA'], {
    required_error: 'Selecciona la criticidad',
  }),
  categoria: z.enum(['SEGURIDAD', 'MANTENIMIENTO', 'OPERACIONES'], {
    required_error: 'Selecciona la categoría',
  }),
})

export const cambioEstadoSchema = z.object({
  estado: z.string().min(1, 'Selecciona un estado'),
  motivo: z.string().optional(),
  numero_aviso_sap: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.estado === 'EN_GESTION' && !data.numero_aviso_sap?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El número de aviso SAP es obligatorio',
      path: ['numero_aviso_sap'],
    })
  }
  if (data.estado === 'RECHAZADO' && !data.motivo?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El motivo es obligatorio al rechazar',
      path: ['motivo'],
    })
  }
})

export const comentarioSchema = z.object({
  texto: z.string().min(1, 'El comentario no puede estar vacío'),
})
