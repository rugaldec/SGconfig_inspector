import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usuariosApi } from '../api'

export function useUsuarios() {
  return useQuery({
    queryKey: ['usuarios'],
    queryFn: usuariosApi.listar,
  })
}

export function useCrearUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: usuariosApi.crear,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  })
}

export function useActualizarUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, datos }) => usuariosApi.actualizar(id, datos),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  })
}
