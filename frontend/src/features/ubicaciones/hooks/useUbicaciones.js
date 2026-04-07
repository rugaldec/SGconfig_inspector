import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ubicacionesApi } from '../api'

export function useArbolUbicaciones() {
  return useQuery({
    queryKey: ['ubicaciones', 'arbol'],
    queryFn: ubicacionesApi.arbol,
  })
}

export function useBuscarUbicaciones(q) {
  return useQuery({
    queryKey: ['ubicaciones', 'buscar', q],
    queryFn: () => ubicacionesApi.buscar(q),
    enabled: true,
    staleTime: 60_000,
  })
}

export function useCrearUbicacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ubicacionesApi.crear,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ubicaciones'] }),
  })
}

export function useActualizarUbicacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, datos }) => ubicacionesApi.actualizar(id, datos),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ubicaciones'] }),
  })
}

export function useEliminarUbicacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ubicacionesApi.eliminar,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ubicaciones'] }),
  })
}

export function useImportarUbicaciones() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ubicacionesApi.importar,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ubicaciones'] }),
  })
}
