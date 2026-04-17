import apiClient from '../../lib/apiClient'

export const dashboardApi = {
  stats:           (params) => apiClient.get('/stats', { params }).then(r => r.data.data),
  statsDisciplina: ()       => apiClient.get('/stats/disciplina').then(r => r.data.data),
}
