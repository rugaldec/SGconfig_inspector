import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bitacoraApi } from '../api'

export function useBitacora(params) {
  return useQuery({
    queryKey: ['bitacora', params],
    queryFn: () => bitacoraApi.listar(params),
    staleTime: 30_000,
  })
}

export function useMisDisciplinas() {
  return useQuery({
    queryKey: ['bitacora-disciplinas'],
    queryFn: bitacoraApi.misDisciplinas,
    staleTime: 5 * 60_000,
  })
}

export function useCrearEntrada() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: bitacoraApi.crear,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bitacora'] }),
  })
}

export function useActualizarEntrada(id) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData) => bitacoraApi.actualizar(id, formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bitacora'] })
      qc.invalidateQueries({ queryKey: ['bitacora-entrada', id] })
    },
  })
}

export function useEliminarEntrada() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: bitacoraApi.eliminar,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bitacora'] }),
  })
}

export function useConfirmarSinNovedades() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ disciplina_id, semana }) => bitacoraApi.confirmarSinNovedades(disciplina_id, semana),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bitacora'] }),
  })
}
