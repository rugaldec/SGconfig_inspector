import axios from 'axios'

let accessToken = null
let simulatedRole = null
let isRefreshing = false
let refreshQueue = []

export function setToken(token) { accessToken = token }
export function getToken() { return accessToken }
export function clearToken() { accessToken = null }
export function setSimulateHeader(rol) { simulatedRole = rol }
export function clearSimulateHeader() { simulatedRole = null }

const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

apiClient.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  if (simulatedRole) config.headers['X-Simulate-Role'] = simulatedRole
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const is401 = error.response?.status === 401
    const isRefreshEndpoint = original.url === '/auth/refresh'

    if (!is401 || original._retry || isRefreshEndpoint) {
      return Promise.reject(error)
    }

    original._retry = true

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject })
      }).then(() => apiClient(original))
    }

    isRefreshing = true
    try {
      const { data } = await apiClient.post('/auth/refresh')
      setToken(data.data.token)
      refreshQueue.forEach(({ resolve }) => resolve())
      refreshQueue = []
      return apiClient(original)
    } catch (e) {
      refreshQueue.forEach(({ reject }) => reject(e) )
      refreshQueue = []
      clearToken()
      window.location.href = '/login'
      return Promise.reject(e)
    } finally {
      isRefreshing = false
    }
  }
)

export default apiClient
