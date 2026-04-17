import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { plantillasApi } from '../api'

export function usePlantillas(params) {
  return useQuery({
    queryKey: ['plantillas', params],
    queryFn: () => plantillasApi.listar(params),
  })
}

export function usePlantillaDetalle(id) {
  return useQuery({
    queryKey: ['plantilla', id],
    queryFn: () => plantillasApi.detalle(id),
    enabled: !!id,
  })
}

export function useCrearPlantilla() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: plantillasApi.crear,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plantillas'] }),
  })
}

export function useActualizarPlantilla() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, datos }) => plantillasApi.actualizar(id, datos),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['plantillas'] })
      qc.invalidateQueries({ queryKey: ['plantilla', id] })
    },
  })
}

export function useEliminarPlantilla() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: plantillasApi.eliminar,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plantillas'] }),
  })
}
