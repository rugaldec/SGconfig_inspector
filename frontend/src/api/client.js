import axios from 'axios'

let accessToken = null
let isRefreshing = false
let refreshQueue = []

export function setToken(token) { accessToken = token }
export function getToken() { return accessToken }
export function clearToken() { accessToken = null }

const api = axios.create({ baseURL: '/api', withCredentials: true })

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config
    if (error.response?.status !== 401 || original._retry || original.url === '/auth/refresh') {
      return Promise.reject(error)
    }
    original._retry = true

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject })
      }).then(() => api(original))
    }

    isRefreshing = true
    try {
      const { data } = await api.post('/auth/refresh')
      setToken(data.data.token)
      refreshQueue.forEach(({ resolve }) => resolve())
      refreshQueue = []
      return api(original)
    } catch (e) {
      refreshQueue.forEach(({ reject }) => reject(e))
      refreshQueue = []
      clearToken()
      window.location.href = '/login'
      return Promise.reject(e)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
