import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hallazgosApi } from '../api'

export function useHallazgos(params = {}) {
  return useQuery({
    queryKey: ['hallazgos', params],
    queryFn: () => hallazgosApi.listar(params),
  })
}

export function useMisHallazgos() {
  return useQuery({
    queryKey: ['hallazgos', 'mios'],
    queryFn: hallazgosApi.mios,
  })
}

export function useCrearHallazgo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: hallazgosApi.crear,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hallazgos'] })
    },
  })
}
