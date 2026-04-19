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

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ id, password }) => usuariosApi.resetPassword(id, password),
  })
}

export function useActualizarMiPerfil() {
  return useMutation({
    mutationFn: (datos) => usuariosApi.actualizarMiPerfil(datos),
  })
}

export function useActualizarMiFoto() {
  return useMutation({
    mutationFn: (file) => usuariosApi.actualizarMiFoto(file),
  })
}

export function useActualizarFotoUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }) => usuariosApi.actualizarFotoUsuario(id, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  })
}
