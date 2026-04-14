import { useMemo } from 'react'
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

// Retorna los 4 niveles como listas derivadas del árbol cacheado,
// y la lista plana de nodos que pasan el filtro activo más profundo.
export function useUbicacionesFiltradas(filtros = {}) {
  const { data: arbol = [] } = useArbolUbicaciones()
  const { plantaId, areaId, activoId, componenteId } = filtros

  // Obtiene descendientes planos de un nodo (incluye el nodo mismo)
  function descendientes(nodo) {
    const resultado = [nodo]
    for (const hijo of nodo.hijos ?? []) {
      resultado.push(...descendientes(hijo))
    }
    return resultado
  }

  const plantas = useMemo(() => arbol, [arbol])

  const areas = useMemo(() => {
    if (!plantaId) return []
    const planta = arbol.find((n) => n.id === plantaId)
    return planta?.hijos ?? []
  }, [arbol, plantaId])

  const activos = useMemo(() => {
    if (!areaId) return []
    const area = areas.find((n) => n.id === areaId)
    return area?.hijos ?? []
  }, [areas, areaId])

  const componentes = useMemo(() => {
    if (!activoId) return []
    const activo = activos.find((n) => n.id === activoId)
    return activo?.hijos ?? []
  }, [activos, activoId])

  // Nodos a mostrar en el árbol según el filtro más profundo activo
  const nodosFiltrados = useMemo(() => {
    if (componenteId) {
      const componente = componentes.find((n) => n.id === componenteId)
      return componente ? [componente] : []
    }
    if (activoId) {
      const activo = activos.find((n) => n.id === activoId)
      return activo ? [activo] : []
    }
    if (areaId) {
      const area = areas.find((n) => n.id === areaId)
      return area ? [area] : []
    }
    if (plantaId) {
      const planta = arbol.find((n) => n.id === plantaId)
      return planta ? [planta] : []
    }
    return null // null = sin filtro, mostrar árbol completo
  }, [arbol, areas, activos, componentes, plantaId, areaId, activoId, componenteId])

  return { plantas, areas, activos, componentes, nodosFiltrados }
}
