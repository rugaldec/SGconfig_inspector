import apiClient from '../../lib/apiClient'

export const disciplinasApi = {
  listar: (params) => apiClient.get('/disciplinas', { params }).then(r => r.data.data),
  crear: (datos) => apiClient.post('/disciplinas', datos).then(r => r.data.data),
  actualizar: (id, datos) => apiClient.patch(`/disciplinas/${id}`, datos).then(r => r.data.data),
  eliminar: (id) => apiClient.delete(`/disciplinas/${id}`).then(r => r.data),
}
