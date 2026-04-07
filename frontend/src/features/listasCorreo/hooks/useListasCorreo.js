import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listasCorreoApi } from '../api'

export function useListasCorreo() {
  return useQuery({
    queryKey: ['listas-correo'],
    queryFn: listasCorreoApi.listar,
  })
}

export function useCrearListaCorreo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: listasCorreoApi.crear,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['listas-correo'] }),
  })
}

export function useActualizarListaCorreo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, datos }) => listasCorreoApi.actualizar(id, datos),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['listas-correo'] }),
  })
}

export function useEliminarListaCorreo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: listasCorreoApi.eliminar,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['listas-correo'] }),
  })
}
