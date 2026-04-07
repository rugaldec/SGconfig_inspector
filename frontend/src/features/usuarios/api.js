import apiClient from '../../lib/apiClient'

export const usuariosApi = {
  listar: () =>
    apiClient.get('/usuarios').then(r => r.data.data),

  obtener: (id) =>
    apiClient.get(`/usuarios/${id}`).then(r => r.data.data),

  crear: (datos) =>
    apiClient.post('/usuarios', datos).then(r => r.data.data),

  actualizar: (id, datos) =>
    apiClient.put(`/usuarios/${id}`, datos).then(r => r.data.data),

  resetPassword: (id, password) =>
    apiClient.patch(`/usuarios/${id}/password`, { password }).then(r => r.data),
}
