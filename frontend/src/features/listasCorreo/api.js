import apiClient from '../../lib/apiClient'

export const listasCorreoApi = {
  listar: () =>
    apiClient.get('/listas-correo').then(r => r.data.data),

  crear: (datos) =>
    apiClient.post('/listas-correo', datos).then(r => r.data.data),

  actualizar: (id, datos) =>
    apiClient.put(`/listas-correo/${id}`, datos).then(r => r.data.data),

  eliminar: (id) =>
    apiClient.delete(`/listas-correo/${id}`).then(r => r.data),
}
