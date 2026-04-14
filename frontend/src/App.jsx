import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './features/auth/useAuth'
import AppShell from './shared/components/layout/AppShell'
import ProtectedRoute from './shared/components/layout/ProtectedRoute'
import Spinner from './shared/components/ui/Spinner'

// Cada feature se carga solo cuando el usuario navega a ella
const LoginPage          = lazy(() => import('./features/auth/LoginPage'))
const NuevoHallazgoPage  = lazy(() => import('./features/hallazgos/pages/NuevoHallazgoPage'))
const MisHallazgosPage   = lazy(() => import('./features/hallazgos/pages/MisHallazgosPage'))
const DashboardPage      = lazy(() => import('./features/dashboard/DashboardPage'))
const HallazgosPage      = lazy(() => import('./features/hallazgos/pages/HallazgosPage'))
const HallazgoDetallePage = lazy(() => import('./features/hallazgos/pages/HallazgoDetallePage'))
const UsuariosPage       = lazy(() => import('./features/usuarios/pages/UsuariosPage'))
const UbicacionesPage    = lazy(() => import('./features/ubicaciones/pages/UbicacionesPage'))
const ListasCorreoPage   = lazy(() => import('./features/listasCorreo/pages/ListasCorreoPage'))
const LogsCorreoPage     = lazy(() => import('./features/logsCorreo/pages/LogsCorreoPage'))
const LogsAccesoPage    = lazy(() => import('./features/logsAcceso/pages/LogsAccesoPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size="lg" />
    </div>
  )
}

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (user.rol === 'INSPECTOR') return <Navigate to="/inspector/hallazgos" replace />
  return <Navigate to="/supervisor/dashboard" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Pública */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<RootRedirect />} />

            {/* Inspector */}
            <Route element={<ProtectedRoute roles={['INSPECTOR']} />}>
              <Route element={<AppShell />}>
                <Route path="/inspector/nuevo"           element={<NuevoHallazgoPage />} />
                <Route path="/inspector/hallazgos"       element={<MisHallazgosPage />} />
                <Route path="/inspector/hallazgos/:id"   element={<HallazgoDetallePage />} />
              </Route>
            </Route>

            {/* Supervisor y Admin */}
            <Route element={<ProtectedRoute roles={['SUPERVISOR', 'ADMINISTRADOR']} />}>
              <Route element={<AppShell />}>
                <Route path="/supervisor/dashboard"        element={<DashboardPage />} />
                <Route path="/supervisor/hallazgos"        element={<HallazgosPage />} />
                <Route path="/supervisor/hallazgos/:id"    element={<HallazgoDetallePage />} />
                <Route path="/supervisor/nuevo"            element={<NuevoHallazgoPage />} />
              </Route>
            </Route>

            {/* Solo Admin */}
            <Route element={<ProtectedRoute roles={['ADMINISTRADOR']} />}>
              <Route element={<AppShell />}>
                <Route path="/admin/usuarios"      element={<UsuariosPage />} />
                <Route path="/admin/ubicaciones"   element={<UbicacionesPage />} />
                <Route path="/admin/listas-correo"  element={<ListasCorreoPage />} />
                <Route path="/admin/logs-correo"    element={<LogsCorreoPage />} />
                <Route path="/admin/logs-acceso"    element={<LogsAccesoPage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
