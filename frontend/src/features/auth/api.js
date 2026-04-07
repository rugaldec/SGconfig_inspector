import apiClient, { setToken, clearToken } from '../../lib/apiClient'

export const authApi = {
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }).then(r => r.data.data),

  refresh: () =>
    apiClient.post('/auth/refresh').then(r => r.data.data),

  logout: () =>
    apiClient.post('/auth/logout').catch(() => {}),

  me: () =>
    apiClient.get('/auth/me').then(r => r.data.data),
}
