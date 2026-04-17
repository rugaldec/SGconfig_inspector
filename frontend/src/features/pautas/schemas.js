import { z } from 'zod'

export const nuevaPautaSchema = z.object({
  nombre: z.string().min(3, 'Mínimo 3 caracteres'),
  descripcion: z.string().optional(),
  disciplina_id: z.string().uuid('Selecciona una disciplina'),
})

export const programarEjecucionSchema = z.object({
  fecha_inicio:        z.string().min(1, 'Fecha de inicio requerida'),
  fecha_fin:           z.string().min(1, 'Fecha de fin requerida'),
  relanzamiento_auto:  z.boolean().optional().default(false),
  frecuencia_tipo:     z.string().optional(),
  frecuencia_dias:     z.preprocess(v => (v === '' || v == null ? undefined : Number(v)), z.number().int().min(1).optional()),
  max_ejecuciones:     z.preprocess(v => (v === '' || v == null ? undefined : Number(v)), z.number().int().min(1).optional()),
})
.refine(d => new Date(d.fecha_fin) >= new Date(d.fecha_inicio), {
  message: 'La fecha de fin debe ser igual o posterior al inicio',
  path: ['fecha_fin'],
})
.refine(d => !d.relanzamiento_auto || !!d.frecuencia_tipo, {
  message: 'Seleccioná la frecuencia de relanzamiento',
  path: ['frecuencia_tipo'],
})
.refine(d => !(d.relanzamiento_auto && d.frecuencia_tipo === 'PERSONALIZADA') || !!d.frecuencia_dias, {
  message: 'Indicá los días entre rondas',
  path: ['frecuencia_dias'],
})
