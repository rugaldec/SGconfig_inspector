import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { LogOut, PlusCircle, ClipboardList, LayoutDashboard, Users, MapPin } from 'lucide-react'

const navInspector = [
  { to: '/inspector/nuevo', icon: PlusCircle, label: 'Nuevo' },
  { to: '/inspector/hallazgos', icon: ClipboardList, label: 'Mis Hallazgos' },
]

const navSupAdmin = [
  { to: '/supervisor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/supervisor/hallazgos', icon: ClipboardList, label: 'Hallazgos' },
]

const navAdmin = [
  { to: '/admin/usuarios', icon: Users, label: 'Usuarios' },
  { to: '/admin/ubicaciones', icon: MapPin, label: 'Ubicaciones' },
]

export default function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const links = user?.rol === 'INSPECTOR'
    ? navInspector
    : user?.rol === 'ADMINISTRADOR'
      ? [...navSupAdmin, ...navAdmin]
      : navSupAdmin

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const activeClass = 'text-blue-600 font-semibold'
  const inactiveClass = 'text-gray-500 hover:text-blue-600'

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="bg-blue-800 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow">
        <span className="font-bold text-lg">SGConfi</span>
        <div className="flex items-center gap-3">
          <span className="text-sm hidden sm:block">{user?.nombre}</span>
          <button onClick={handleLogout} className="p-1 hover:text-blue-200" title="Cerrar sesión">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — solo desktop */}
        <nav className="hidden md:flex flex-col w-52 bg-white border-r py-4 gap-1">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded-r-full mr-2 transition-colors ${isActive ? activeClass + ' bg-blue-50' : inactiveClass}`}>
              <Icon size={18} />
              <span className="text-sm">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Contenido principal */}
        <main className="flex-1 overflow-auto p-4 pb-20 md:pb-4">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav — solo móvil */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 z-10">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => `flex flex-col items-center gap-0.5 px-3 py-1 ${isActive ? activeClass : inactiveClass}`}>
            <Icon size={22} />
            <span className="text-xs">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
