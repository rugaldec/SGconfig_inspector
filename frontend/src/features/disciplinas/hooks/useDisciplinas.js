import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { disciplinasApi } from '../api'

export function useDisciplinas(params) {
  return useQuery({
    queryKey: ['disciplinas', params],
    queryFn: () => disciplinasApi.listar(params),
  })
}

export function useCrearDisciplina() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: disciplinasApi.crear,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['disciplinas'] }),
  })
}

export function useActualizarDisciplina() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, datos }) => disciplinasApi.actualizar(id, datos),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['disciplinas'] }),
  })
}

export function useEliminarDisciplina() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: disciplinasApi.eliminar,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['disciplinas'] }),
  })
}
