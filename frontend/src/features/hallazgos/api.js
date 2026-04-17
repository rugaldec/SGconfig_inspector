import apiClient from '../../lib/apiClient'

export const hallazgosApi = {
  listar: (params) =>
    apiClient.get('/hallazgos', { params }).then(r => r.data),

  mios: () =>
    apiClient.get('/hallazgos/mios').then(r => r.data.data),

  obtener: (id) =>
    apiClient.get(`/hallazgos/${id}`).then(r => r.data.data),

  crear: (formData) =>
    apiClient.post('/hallazgos', formData).then(r => r.data.data),

  cambiarEstado: (id, estado, motivo, fotosCierre = [], numero_aviso_sap) => {
    const fd = new FormData()
    fd.append('estado', estado)
    if (motivo) fd.append('motivo', motivo)
    if (numero_aviso_sap) fd.append('numero_aviso_sap', numero_aviso_sap)
    fotosCierre.forEach(f => fd.append('fotos_cierre', f))
    return apiClient.patch(`/hallazgos/${id}/estado`, fd).then(r => r.data.data)
  },

  asignarSap: (id, numero_aviso_sap) =>
    apiClient.patch(`/hallazgos/${id}/sap`, { numero_aviso_sap }).then(r => r.data.data),

  agregarComentario: (id, texto) =>
    apiClient.post(`/hallazgos/${id}/comentarios`, { texto }).then(r => r.data.data),

  exportarCsv: (params) => {
    const qs = new URLSearchParams(params).toString()
    window.location.href = `/api/hallazgos/export?${qs}`
  },

  exportarPdf: async (id) => {
    const r = await apiClient.get(`/hallazgos/${id}/pdf`, { responseType: 'blob' })
    const filename = r.headers['content-disposition']?.match(/filename="(.+?)"/)?.[1]
      ?? `hallazgo-${id}.pdf`
    const url = URL.createObjectURL(r.data)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  },
}
