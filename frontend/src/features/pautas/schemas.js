import { z } from 'zod'

export const nuevaPautaSchema = z.object({
  nombre: z.string().min(3, 'Mínimo 3 caracteres'),
  descripcion: z.string().optional(),
  disciplina_id: z.string().uuid('Selecciona una disciplina'),
  zona_funcional_id: z.string().uuid('Selecciona una zona funcional'),
})

export const programarEjecucionSchema = z.object({
  fecha_inicio: z.string().min(1, 'Fecha de inicio requerida'),
  fecha_fin: z.string().min(1, 'Fecha de fin requerida'),
}).refine(d => new Date(d.fecha_fin) >= new Date(d.fecha_inicio), {
  message: 'La fecha de fin debe ser igual o posterior al inicio',
  path: ['fecha_fin'],
})
