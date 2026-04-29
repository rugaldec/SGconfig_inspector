import { useMutation } from '@tanstack/react-query'
import { bitacoraApi } from '../api'

export function useReporteSemanal() {
  return useMutation({
    mutationFn: async (params) => {
      const resp = await bitacoraApi.descargarReporte(params)
      const url = URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `bitacora-${params.semana || 'reporte'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    },
  })
}
