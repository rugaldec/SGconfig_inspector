import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../../features/auth/useAuth'
import Spinner from '../ui/Spinner'

export default function ProtectedRoute({ roles }) {
  const { user, loading, rolEfectivo } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (roles && !roles.includes(rolEfectivo)) return <Navigate to="/" replace />

  return <Outlet />
}
