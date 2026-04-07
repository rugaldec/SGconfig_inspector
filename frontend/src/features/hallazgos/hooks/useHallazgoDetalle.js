import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hallazgosApi } from '../api'

export function useHallazgoDetalle(id) {
  const qc = useQueryClient()
  const invalidar = () => qc.invalidateQueries({ queryKey: ['hallazgo', id] })

  const query = useQuery({
    queryKey: ['hallazgo', id],
    queryFn: () => hallazgosApi.obtener(id),
    enabled: !!id,
  })

  const mutCambiarEstado = useMutation({
    mutationFn: ({ estado, motivo, fotoDespues, numero_aviso_sap }) => hallazgosApi.cambiarEstado(id, estado, motivo, fotoDespues, numero_aviso_sap),
    onSuccess: invalidar,
  })

  const mutAsignarSap = useMutation({
    mutationFn: (numero) => hallazgosApi.asignarSap(id, numero),
    onSuccess: invalidar,
  })

  const mutComentario = useMutation({
    mutationFn: (texto) => hallazgosApi.agregarComentario(id, texto),
    onSuccess: invalidar,
  })

  return { query, mutCambiarEstado, mutAsignarSap, mutComentario }
}
