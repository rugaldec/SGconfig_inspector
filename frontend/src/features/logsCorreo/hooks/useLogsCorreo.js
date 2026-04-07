import { useQuery } from '@tanstack/react-query'
import { logsCorreoApi } from '../api'

export function useLogsCorreo(params = {}) {
  return useQuery({
    queryKey: ['logs-correo', params],
    queryFn: () => logsCorreoApi.listar(params),
  })
}
