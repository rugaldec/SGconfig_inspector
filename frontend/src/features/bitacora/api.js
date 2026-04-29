import apiClient from '../../lib/apiClient'

export const bitacoraApi = {
  listar: (params) =>
    apiClient.get('/bitacora', { params }).then(r => r.data.data),

  misDisciplinas: () =>
    apiClient.get('/bitacora/disciplinas').then(r => r.data.data),

  crear: (formData) =>
    apiClient.post('/bitacora/entrada', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data.data),

  detalle: (id) =>
    apiClient.get(`/bitacora/entrada/${id}`).then(r => r.data.data),

  actualizar: (id, formData) =>
    apiClient.patch(`/bitacora/entrada/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data.data),

  eliminar: (id) =>
    apiClient.delete(`/bitacora/entrada/${id}`).then(r => r.data),

  confirmarSinNovedades: (disciplina_id, semana) =>
    apiClient.post('/bitacora/sin-novedades', { disciplina_id, semana }).then(r => r.data.data),

  eliminarFoto: (fotoId) =>
    apiClient.delete(`/bitacora/fotos/${fotoId}`).then(r => r.data),

  eliminarArchivo: (archivoId) =>
    apiClient.delete(`/bitacora/archivos/${archivoId}`).then(r => r.data),

  descargarReporte: (params) =>
    apiClient.get('/bitacora/reporte/semanal', { params, responseType: 'blob' }),
}
