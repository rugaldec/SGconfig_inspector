import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './features/auth/useAuth'
import AppShell from './shared/components/layout/AppShell'
import ProtectedRoute from './shared/components/layout/ProtectedRoute'
import Spinner from './shared/components/ui/Spinner'

// Cada feature se carga solo cuando el usuario navega a ella
const LoginPage            = lazy(() => import('./features/auth/LoginPage'))
const NuevoHallazgoPage    = lazy(() => import('./features/hallazgos/pages/NuevoHallazgoPage'))
const MisHallazgosPage     = lazy(() => import('./features/hallazgos/pages/MisHallazgosPage'))
const DashboardPage        = lazy(() => import('./features/dashboard/DashboardPage'))
const HallazgosPage        = lazy(() => import('./features/hallazgos/pages/HallazgosPage'))
const HallazgoDetallePage  = lazy(() => import('./features/hallazgos/pages/HallazgoDetallePage'))
const UsuariosPage         = lazy(() => import('./features/usuarios/pages/UsuariosPage'))
const UbicacionesPage      = lazy(() => import('./features/ubicaciones/pages/UbicacionesPage'))
const ListasCorreoPage     = lazy(() => import('./features/listasCorreo/pages/ListasCorreoPage'))
const LogsCorreoPage       = lazy(() => import('./features/logsCorreo/pages/LogsCorreoPage'))
const LogsAccesoPage       = lazy(() => import('./features/logsAcceso/pages/LogsAccesoPage'))
const DisciplinasPage      = lazy(() => import('./features/disciplinas/pages/DisciplinasPage'))
const PautasPage           = lazy(() => import('./features/pautas/pages/PautasPage'))
const NuevaPautaPage       = lazy(() => import('./features/pautas/pages/NuevaPautaPage'))
const PautaDetallePage     = lazy(() => import('./features/pautas/pages/PautaDetallePage'))
const EjecucionDetallePage = lazy(() => import('./features/pautas/pages/EjecucionDetallePage'))
const MisPautasPage            = lazy(() => import('./features/pautas/pages/MisPautasPage'))
const HistorialPautasPage      = lazy(() => import('./features/pautas/pages/HistorialPautasPage'))
const ReporteEjecucionPage     = lazy(() => import('./features/pautas/pages/ReporteEjecucionPage'))
const DashboardDisciplinaPage  = lazy(() => import('./features/dashboard/DashboardDisciplinaPage'))
const PlantillasPage           = lazy(() => import('./features/plantillas/pages/PlantillasPage'))
const PerfilPage               = lazy(() => import('./features/usuarios/pages/PerfilPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size="lg" />
    </div>
  )
}

function RootRedirect() {
  const { user, loading, rolEfectivo } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (rolEfectivo === 'INSPECTOR') return <Navigate to="/inspector/hallazgos" replace />
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
                <Route path="/inspector/dashboard"            element={<DashboardDisciplinaPage />} />
                <Route path="/inspector/nuevo"                element={<NuevoHallazgoPage />} />
                <Route path="/inspector/hallazgos"            element={<MisHallazgosPage />} />
                <Route path="/inspector/hallazgos/:id"        element={<HallazgoDetallePage />} />
                <Route path="/inspector/pautas"               element={<MisPautasPage />} />
                <Route path="/inspector/ejecuciones/:id"      element={<EjecucionDetallePage />} />
                <Route path="/inspector/historial-pautas"     element={<HistorialPautasPage />} />
                <Route path="/inspector/historial-pautas/:id" element={<ReporteEjecucionPage />} />
              </Route>
            </Route>

            {/* Supervisor y Admin */}
            <Route element={<ProtectedRoute roles={['SUPERVISOR', 'ADMINISTRADOR']} />}>
              <Route element={<AppShell />}>
                <Route path="/supervisor/dashboard"             element={<DashboardPage />} />
                <Route path="/supervisor/mi-disciplina"         element={<DashboardDisciplinaPage />} />
                <Route path="/supervisor/hallazgos"             element={<HallazgosPage />} />
                <Route path="/supervisor/hallazgos/:id"         element={<HallazgoDetallePage />} />
                <Route path="/supervisor/nuevo"                 element={<NuevoHallazgoPage />} />
                <Route path="/supervisor/ruta-pautas"           element={<MisPautasPage />} />
                <Route path="/supervisor/ejecuciones/:id"       element={<EjecucionDetallePage />} />
                <Route path="/supervisor/historial-pautas"      element={<HistorialPautasPage />} />
                <Route path="/supervisor/historial-pautas/:id"  element={<ReporteEjecucionPage />} />
              </Route>
            </Route>

            {/* Solo Admin */}
            <Route element={<ProtectedRoute roles={['ADMINISTRADOR']} />}>
              <Route element={<AppShell />}>
                <Route path="/admin/nuevo"                    element={<NuevoHallazgoPage />} />
                <Route path="/admin/ruta-pautas"              element={<MisPautasPage />} />
                <Route path="/admin/ejecuciones/:id"          element={<EjecucionDetallePage />} />
                <Route path="/admin/historial-pautas"         element={<HistorialPautasPage />} />
                <Route path="/admin/historial-pautas/:id"     element={<ReporteEjecucionPage />} />
                <Route path="/admin/usuarios"                 element={<UsuariosPage />} />
                <Route path="/admin/disciplinas"              element={<DisciplinasPage />} />
                <Route path="/admin/pautas"                   element={<PautasPage />} />
                <Route path="/admin/pautas/nueva"             element={<NuevaPautaPage />} />
                <Route path="/admin/pautas/:id"               element={<PautaDetallePage />} />
                <Route path="/admin/ubicaciones"              element={<UbicacionesPage />} />
                <Route path="/admin/listas-correo"            element={<ListasCorreoPage />} />
                <Route path="/admin/logs-correo"              element={<LogsCorreoPage />} />
                <Route path="/admin/logs-acceso"              element={<LogsAccesoPage />} />
                <Route path="/admin/plantillas"               element={<PlantillasPage />} />
              </Route>
            </Route>

            {/* Perfil — todos los roles */}
            <Route element={<ProtectedRoute roles={['INSPECTOR', 'SUPERVISOR', 'ADMINISTRADOR']} />}>
              <Route element={<AppShell />}>
                <Route path="/perfil" element={<PerfilPage />} />
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
