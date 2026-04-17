import apiClient from '../../lib/apiClient'

export const pautasApi = {
  // ── Plantillas ──
  listar: (params) => apiClient.get('/pautas', { params }).then(r => r.data.data),
  crear: (datos) => apiClient.post('/pautas', datos).then(r => r.data.data),
  detalle: (id) => apiClient.get(`/pautas/${id}`).then(r => r.data.data),
  actualizar: (id, datos) => apiClient.patch(`/pautas/${id}`, datos).then(r => r.data.data),
  desactivar: (id)        => apiClient.patch(`/pautas/${id}/desactivar`).then(r => r.data.data),
  eliminar:   (id)        => apiClient.delete(`/pautas/${id}`).then(r => r.data.data),

  // ── Ejecuciones (anidadas) ──
  programarEjecucion: (pautaId, datos) =>
    apiClient.post(`/pautas/${pautaId}/ejecuciones`, datos).then(r => r.data.data),
  historialEjecuciones: (pautaId, params) =>
    apiClient.get(`/pautas/${pautaId}/ejecuciones`, { params }).then(r => r.data.data),

  // ── Ejecuciones (propias) ──
  ejecucionesActivas:   () => apiClient.get('/ejecuciones/activas').then(r => r.data.data),
  historialEjecuciones: () => apiClient.get('/ejecuciones/historial').then(r => r.data.data),
  detalleEjecucion:     (id) => apiClient.get(`/ejecuciones/${id}`).then(r => r.data.data),
  exportarPdfEjecucion: (id) => apiClient.get(`/ejecuciones/${id}/pdf`, { responseType: 'blob' }),
  cerrarEjecucion: (ejecucionId, { motivo } = {}) =>
    apiClient.patch(`/ejecuciones/${ejecucionId}/cerrar`, { motivo }).then(r => r.data.data),

  marcarItem: (ejecucionId, itemId, { observacion, hallazgo_id, foto, respuestas }) => {
    const fd = new FormData()
    if (observacion) fd.append('observacion', observacion)
    if (hallazgo_id) fd.append('hallazgo_id', hallazgo_id)
    if (foto) fd.append('foto', foto)
    if (respuestas?.length) fd.append('respuestas', JSON.stringify(respuestas))
    return apiClient.patch(`/ejecuciones/${ejecucionId}/items/${itemId}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data.data)
  },
}
