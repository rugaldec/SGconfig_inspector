import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../features/auth/useAuth'
import {
  LayoutDashboard, ClipboardList, PlusCircle,
  Users, MapPin, Mail, History, LogOut, Menu, X,
} from 'lucide-react'

const NAV_INSPECTOR = [
  { to: '/inspector/hallazgos', icon: ClipboardList,  label: 'Mis Hallazgos' },
  { to: '/inspector/nuevo',     icon: PlusCircle,     label: 'Nuevo Hallazgo' },
]

const NAV_SUP = [
  { to: '/supervisor/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/supervisor/hallazgos',  icon: ClipboardList,   label: 'Hallazgos' },
  { to: '/supervisor/nuevo',      icon: PlusCircle,      label: 'Nuevo Hallazgo' },
]

const NAV_ADMIN_EXTRA = [
  { to: '/admin/usuarios',      icon: Users,   label: 'Usuarios' },
  { to: '/admin/ubicaciones',   icon: MapPin,  label: 'Ubicaciones' },
  { to: '/admin/listas-correo', icon: Mail,    label: 'Listas Correo' },
  { to: '/admin/logs-correo',   icon: History, label: 'Historial Correos' },
]

function navLinks(rol) {
  if (rol === 'INSPECTOR') return NAV_INSPECTOR
  if (rol === 'ADMINISTRADOR') return [...NAV_SUP, ...NAV_ADMIN_EXTRA]
  return NAV_SUP
}

// En móvil mostramos solo las primeras 4 en el bottom nav
const BOTTOM_NAV_MAX = 4

export default function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const links = navLinks(user?.rol)
  const [drawerOpen, setDrawerOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="bg-blue-900 text-white h-14 px-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          {/* Hamburger — solo móvil */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="md:hidden p-1.5 hover:bg-blue-800 rounded-lg transition-colors"
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
          <span className="font-bold text-lg tracking-tight">SGConfi</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-blue-200 hidden sm:block">{user?.nombre}</span>
          <span className="text-xs text-blue-300 hidden sm:block bg-blue-800 px-2 py-0.5 rounded-full">
            {user?.rol}
          </span>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="p-1.5 hover:bg-blue-800 rounded-lg transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Drawer overlay — móvil */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Drawer — móvil */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-64 bg-white z-50 shadow-xl transform transition-transform duration-200 flex flex-col
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header del drawer */}
        <div className="bg-blue-900 text-white h-14 flex items-center justify-between px-4 flex-shrink-0">
          <span className="font-bold text-lg">SGConfi</span>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 hover:bg-blue-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Info usuario */}
        <div className="px-4 py-3 border-b bg-gray-50 flex-shrink-0">
          <p className="text-sm font-medium text-gray-800">{user?.nombre}</p>
          <p className="text-xs text-gray-500">{user?.rol}</p>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto py-3">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setDrawerOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-3 text-sm transition-colors
                ${isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold border-r-4 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-blue-700'
                }`
              }
            >
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-5 py-4 text-sm text-red-600 hover:bg-red-50 transition-colors border-t flex-shrink-0"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </aside>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — desktop */}
        <nav className="hidden md:flex flex-col w-56 bg-white border-r pt-4 gap-0.5 flex-shrink-0">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-r-full mr-3 text-sm transition-colors
                ${isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-500 hover:text-blue-700 hover:bg-gray-50'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Contenido */}
        <main className="flex-1 overflow-auto p-4 pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav — móvil (hasta 4 items) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t flex justify-around py-2 z-20 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
        {links.slice(0, BOTTOM_NAV_MAX).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors ${
                isActive ? 'text-blue-700' : 'text-gray-500'
              }`
            }
          >
            <Icon size={22} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
