import apiClient from '../../lib/apiClient'

export const pautasApi = {
  // ── Plantillas ──
  listar: (params) => apiClient.get('/pautas', { params }).then(r => r.data.data),
  crear: (datos) => apiClient.post('/pautas', datos).then(r => r.data.data),
  detalle: (id) => apiClient.get(`/pautas/${id}`).then(r => r.data.data),
  actualizar: (id, datos) => apiClient.patch(`/pautas/${id}`, datos).then(r => r.data.data),

  // ── Ejecuciones (anidadas) ──
  programarEjecucion: (pautaId, datos) =>
    apiClient.post(`/pautas/${pautaId}/ejecuciones`, datos).then(r => r.data.data),
  historialEjecuciones: (pautaId, params) =>
    apiClient.get(`/pautas/${pautaId}/ejecuciones`, { params }).then(r => r.data.data),

  // ── Ejecuciones (propias) ──
  ejecucionesActivas: () => apiClient.get('/ejecuciones/activas').then(r => r.data.data),
  detalleEjecucion: (id) => apiClient.get(`/ejecuciones/${id}`).then(r => r.data.data),
  marcarItem: (ejecucionId, itemId, datos) =>
    apiClient.patch(`/ejecuciones/${ejecucionId}/items/${itemId}`, datos).then(r => r.data.data),
}
