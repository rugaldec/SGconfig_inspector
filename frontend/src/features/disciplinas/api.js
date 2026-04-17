import apiClient from '../../lib/apiClient'

export const disciplinasApi = {
  listar:   (params) => apiClient.get('/disciplinas', { params }).then(r => r.data.data),
  crear:    (datos)  => apiClient.post('/disciplinas', datos).then(r => r.data.data),
  actualizar:(id, datos) => apiClient.patch(`/disciplinas/${id}`, datos).then(r => r.data.data),
  eliminar: (id)     => apiClient.delete(`/disciplinas/${id}`).then(r => r.data),

  // Usuarios de una disciplina
  listarUsuarios:  (id)           => apiClient.get(`/disciplinas/${id}/usuarios`).then(r => r.data.data),
  asignarUsuario:  (id, usuario_id) => apiClient.post(`/disciplinas/${id}/usuarios`, { usuario_id }).then(r => r.data),
  quitarUsuario:   (id, usuarioId) => apiClient.delete(`/disciplinas/${id}/usuarios/${usuarioId}`).then(r => r.data),
}
