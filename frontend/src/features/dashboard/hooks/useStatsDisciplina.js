import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api'

export function useStatsDisciplina() {
  return useQuery({
    queryKey: ['stats-disciplina'],
    queryFn:  dashboardApi.statsDisciplina,
    staleTime: 30_000,
  })
}
