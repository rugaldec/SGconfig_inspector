import { useQuery } from '@tanstack/react-query'
import apiClient from '../../../lib/apiClient'

export function useStats(filtros = {}) {
  return useQuery({
    queryKey: ['stats', filtros],
    queryFn: () => apiClient.get('/stats', { params: filtros }).then(r => r.data.data),
    staleTime: 30_000,
  })
}
