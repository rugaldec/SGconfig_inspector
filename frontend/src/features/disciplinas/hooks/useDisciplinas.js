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

export function useUsuariosDisciplina(disciplinaId) {
  return useQuery({
    queryKey: ['disciplina', disciplinaId, 'usuarios'],
    queryFn: () => disciplinasApi.listarUsuarios(disciplinaId),
    enabled: !!disciplinaId,
  })
}

export function useAsignarUsuario(disciplinaId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (usuario_id) => disciplinasApi.asignarUsuario(disciplinaId, usuario_id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['disciplina', disciplinaId, 'usuarios'] })
      qc.invalidateQueries({ queryKey: ['disciplinas'] })
      qc.invalidateQueries({ queryKey: ['usuarios'] })
    },
  })
}

export function useQuitarUsuario(disciplinaId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (usuarioId) => disciplinasApi.quitarUsuario(disciplinaId, usuarioId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['disciplina', disciplinaId, 'usuarios'] })
      qc.invalidateQueries({ queryKey: ['disciplinas'] })
      qc.invalidateQueries({ queryKey: ['usuarios'] })
    },
  })
}
