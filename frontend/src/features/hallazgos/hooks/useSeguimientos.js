import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hallazgosApi } from '../api'

export function useCrearSeguimiento(hallazgoId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData) => hallazgosApi.crearSeguimiento(hallazgoId, formData),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hallazgo', hallazgoId] }),
  })
}
