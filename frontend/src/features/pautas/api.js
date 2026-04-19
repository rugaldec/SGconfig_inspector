import apiClient from '../../lib/apiClient'

export const pautasApi = {
  // ── Plantillas ──
  listar: (params) => apiClient.get('/pautas', { params }).then(r => r.data.data),
  crear: ({ foto, ...datos }) => {
    const fd = new FormData()
    Object.entries(datos).forEach(([k, v]) =>
      fd.append(k, typeof v === 'object' && !(v instanceof File) ? JSON.stringify(v) : v)
    )
    if (foto) fd.append('foto', foto)
    return apiClient.post('/pautas', fd).then(r => r.data.data)
  },
  detalle: (id) => apiClient.get(`/pautas/${id}`).then(r => r.data.data),
  actualizar: (id, { foto, ...datos }) => {
    const fd = new FormData()
    Object.entries(datos).forEach(([k, v]) => {
      if (v === undefined) return
      fd.append(k, typeof v === 'object' && !(v instanceof File) ? JSON.stringify(v) : v)
    })
    if (foto) fd.append('foto', foto)
    return apiClient.patch(`/pautas/${id}`, fd).then(r => r.data.data)
  },
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

  marcarItem: (ejecucionId, itemId, { observacion, hallazgo_id, fotos, respuestas }) => {
    const fd = new FormData()
    if (observacion) fd.append('observacion', observacion)
    if (hallazgo_id) fd.append('hallazgo_id', hallazgo_id)
    if (fotos?.length) fotos.forEach(f => fd.append('fotos', f))
    if (respuestas?.length) fd.append('respuestas', JSON.stringify(respuestas))
    return apiClient.patch(`/ejecuciones/${ejecucionId}/items/${itemId}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data.data)
  },
}
