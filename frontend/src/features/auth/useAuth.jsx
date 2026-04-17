import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from './api'
import { setToken, clearToken, setSimulateHeader, clearSimulateHeader } from '../../lib/apiClient'

const AuthContext = createContext(null)
const SIMULATE_KEY = 'sgconfi_simulated_role'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [simulatedRole, setSimulatedRoleState] = useState(
    () => sessionStorage.getItem(SIMULATE_KEY) || null
  )

  // Restaurar header de simulación al montar (ej: después de F5)
  useEffect(() => {
    const saved = sessionStorage.getItem(SIMULATE_KEY)
    if (saved) setSimulateHeader(saved)
  }, [])

  useEffect(() => {
    authApi.refresh()
      .then(({ token }) => {
        setToken(token)
        return authApi.me()
      })
      .then((userData) => setUser(userData))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Si el usuario deja de ser ADMINISTRADOR, limpiar simulación
  useEffect(() => {
    if (user && user.rol !== 'ADMINISTRADOR' && simulatedRole) {
      _clearSimulation()
    }
  }, [user])

  function _clearSimulation() {
    sessionStorage.removeItem(SIMULATE_KEY)
    setSimulatedRoleState(null)
    clearSimulateHeader()
  }

  function setSimulatedRole(rol) {
    if (!rol) {
      _clearSimulation()
    } else if (['SUPERVISOR', 'INSPECTOR'].includes(rol)) {
      sessionStorage.setItem(SIMULATE_KEY, rol)
      setSimulatedRoleState(rol)
      setSimulateHeader(rol)
    }
  }

  async function login(email, password) {
    const { token, user: userData } = await authApi.login(email, password)
    setToken(token)
    setUser(userData)
    return userData
  }

  async function logout() {
    await authApi.logout()
    clearToken()
    _clearSimulation()
    setUser(null)
  }

  const rolEfectivo = (user?.rol === 'ADMINISTRADOR' && simulatedRole) ? simulatedRole : user?.rol

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, simulatedRole, rolEfectivo, setSimulatedRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
