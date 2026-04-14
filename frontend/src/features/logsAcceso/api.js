import apiClient from '../../lib/apiClient'

export const logsAccesoApi = {
  listar: (params) => apiClient.get('/logs-acceso', { params }).then(r => r.data.data),
}
