import { useQuery } from '@tanstack/react-query'
import { bitacoraApi } from '../api'

export function useBitacoraEntrada(id) {
  return useQuery({
    queryKey: ['bitacora-entrada', id],
    queryFn: () => bitacoraApi.detalle(id),
    enabled: !!id,
  })
}
