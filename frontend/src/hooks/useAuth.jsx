import { createContext, useContext, useState, useEffect } from 'react'
import api, { setToken, clearToken } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Intenta recuperar sesión desde la cookie de refresh
    api.post('/auth/refresh')
      .then(({ data }) => {
        setToken(data.data.token)
        return api.get('/auth/me')
      })
      .then(({ data }) => setUser(data.data))
      .catch(() => {}) // Sin sesión activa — no es error
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password })
    setToken(data.data.token)
    setUser(data.data.user)
    return data.data.user
  }

  async function logout() {
    await api.post('/auth/logout').catch(() => {})
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
