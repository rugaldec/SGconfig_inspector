import apiClient from '../../lib/apiClient'

export const logsCorreoApi = {
  listar: (params) => apiClient.get('/logs-correo', { params }).then(r => r.data.data),
}
