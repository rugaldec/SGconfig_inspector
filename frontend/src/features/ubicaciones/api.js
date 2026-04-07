import apiClient from '../../lib/apiClient'

export const ubicacionesApi = {
  arbol: () =>
    apiClient.get('/ubicaciones').then(r => r.data.data),

  buscar: (q) =>
    apiClient.get('/ubicaciones/buscar', { params: { q } }).then(r => r.data.data),

  obtener: (id) =>
    apiClient.get(`/ubicaciones/${id}`).then(r => r.data.data),

  crear: (datos) =>
    apiClient.post('/ubicaciones', datos).then(r => r.data.data),

  actualizar: (id, datos) =>
    apiClient.put(`/ubicaciones/${id}`, datos).then(r => r.data.data),

  eliminar: (id) =>
    apiClient.delete(`/ubicaciones/${id}`).then(r => r.data),

  importar: (archivo) => {
    const fd = new FormData()
    fd.append('archivo', archivo)
    return apiClient.post('/ubicaciones/importar', fd).then(r => r.data.data)
  },

  exportarCsv: () =>
    apiClient.get('/ubicaciones/exportar', { responseType: 'blob' }).then(r => r.data),
}
