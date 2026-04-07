import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from './api'
import { setToken, clearToken } from '../../lib/apiClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Intenta recuperar sesión activa usando la cookie de refresh
    authApi.refresh()
      .then(({ token }) => {
        setToken(token)
        return authApi.me()
      })
      .then((userData) => setUser(userData))
      .catch(() => {}) // Sin sesión activa — flujo normal
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const { token, user: userData } = await authApi.login(email, password)
    setToken(token)
    setUser(userData)
    return userData
  }

  async function logout() {
    await authApi.logout()
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
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
