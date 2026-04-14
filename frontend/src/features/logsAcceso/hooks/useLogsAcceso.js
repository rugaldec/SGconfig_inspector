import { useQuery } from '@tanstack/react-query'
import { logsAccesoApi } from '../api'

export function useLogsAcceso(params = {}) {
  return useQuery({
    queryKey: ['logs-acceso', params],
    queryFn: () => logsAccesoApi.listar(params),
    staleTime: 30_000,
  })
}
