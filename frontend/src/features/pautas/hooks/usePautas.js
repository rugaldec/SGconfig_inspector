import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pautasApi } from '../api'

export function usePautas(filtros) {
  return useQuery({
    queryKey: ['pautas', filtros],
    queryFn: () => pautasApi.listar(filtros),
  })
}

export function useCrearPauta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: pautasApi.crear,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pautas'] }),
  })
}

export function useActualizarPauta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, datos }) => pautasApi.actualizar(id, datos),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['pautas'] })
      qc.invalidateQueries({ queryKey: ['pauta', id] })
    },
  })
}

export function useDesactivarPauta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => pautasApi.desactivar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pautas'] })
      qc.invalidateQueries({ queryKey: ['ejecuciones', 'activas'] })
      qc.invalidateQueries({ queryKey: ['ejecuciones', 'historial'] })
    },
  })
}

export function useEliminarPauta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => pautasApi.eliminar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pautas'] })
      qc.invalidateQueries({ queryKey: ['ejecuciones', 'activas'] })
      qc.invalidateQueries({ queryKey: ['ejecuciones', 'historial'] })
    },
  })
}

export function usePautaDetalle(id) {
  return useQuery({
    queryKey: ['pauta', id],
    queryFn: () => pautasApi.detalle(id),
    enabled: !!id,
  })
}

export function useHistorialEjecuciones(pautaId, params) {
  return useQuery({
    queryKey: ['pauta', pautaId, 'ejecuciones', params],
    queryFn: () => pautasApi.historialEjecuciones(pautaId, params),
    enabled: !!pautaId,
  })
}

export function useProgramarEjecucion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ pautaId, datos }) => pautasApi.programarEjecucion(pautaId, datos),
    onSuccess: (_, { pautaId }) => {
      qc.invalidateQueries({ queryKey: ['pauta', pautaId, 'ejecuciones'] })
      qc.invalidateQueries({ queryKey: ['ejecuciones', 'activas'] })
    },
  })
}

export function useEjecucionesActivas() {
  return useQuery({
    queryKey: ['ejecuciones', 'activas'],
    queryFn: pautasApi.ejecucionesActivas,
  })
}

export function useEjecucionesHistorial() {
  return useQuery({
    queryKey: ['ejecuciones', 'historial'],
    queryFn: pautasApi.historialEjecuciones,
  })
}

export function useEjecucionDetalle(id) {
  return useQuery({
    queryKey: ['ejecucion', id],
    queryFn: () => pautasApi.detalleEjecucion(id),
    enabled: !!id,
  })
}

export function useCerrarEjecucion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ejecucionId, motivo }) => pautasApi.cerrarEjecucion(ejecucionId, { motivo }),
    onSuccess: (_, { ejecucionId }) => {
      qc.invalidateQueries({ queryKey: ['ejecucion', ejecucionId] })
      qc.invalidateQueries({ queryKey: ['ejecuciones', 'activas'] })
      qc.invalidateQueries({ queryKey: ['ejecuciones', 'historial'] })
    },
  })
}

export function useMarcarItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ejecucionId, itemId, datos }) => pautasApi.marcarItem(ejecucionId, itemId, datos),
    onSuccess: (_, { ejecucionId }) => {
      qc.invalidateQueries({ queryKey: ['ejecucion', ejecucionId] })
      qc.invalidateQueries({ queryKey: ['ejecuciones', 'activas'] })
    },
  })
}
