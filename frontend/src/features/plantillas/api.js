import apiClient from '../../lib/apiClient'

export const plantillasApi = {
  listar:    (params) => apiClient.get('/plantillas', { params }).then(r => r.data.data),
  detalle:   (id)     => apiClient.get(`/plantillas/${id}`).then(r => r.data.data),
  crear:     (datos)  => apiClient.post('/plantillas', datos).then(r => r.data.data),
  actualizar:(id, datos) => apiClient.patch(`/plantillas/${id}`, datos).then(r => r.data.data),
  eliminar:  (id)     => apiClient.delete(`/plantillas/${id}`).then(r => r.data.data),
}
