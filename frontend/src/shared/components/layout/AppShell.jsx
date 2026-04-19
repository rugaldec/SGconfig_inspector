import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../features/auth/useAuth'
import {
  LayoutDashboard, ClipboardList, PlusCircle,
  Users, MapPin, Mail, History, LogOut, Menu, X, Shield,
  ClipboardCheck, Wrench, BookOpen, FlaskConical, ChevronDown, UserCircle,
} from 'lucide-react'

// ── Grupos de navegación por rol ─────────────────────────────────────────────

const NAV_INSPECTOR_GROUPS = [
  {
    label: 'Inicio',
    items: [
      { to: '/inspector/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Pautas',
    items: [
      { to: '/inspector/pautas',            icon: ClipboardCheck, label: 'Pautas en Ruta' },
      { to: '/inspector/historial-pautas',  icon: BookOpen,       label: 'Historial de Pautas'  },
    ],
  },
  {
    label: 'Hallazgos',
    items: [
      { to: '/inspector/hallazgos', icon: ClipboardList, label: 'Mis Hallazgos'  },
      { to: '/inspector/nuevo',     icon: PlusCircle,    label: 'Nuevo Hallazgo' },
    ],
  },
]

const NAV_SUP_GROUPS = [
  {
    label: 'Gestión',
    items: [
      { to: '/supervisor/dashboard', icon: LayoutDashboard, label: 'Dashboard'      },
      { to: '/supervisor/hallazgos', icon: ClipboardList,   label: 'Hallazgos'      },
      { to: '/supervisor/nuevo',     icon: PlusCircle,      label: 'Nuevo Hallazgo' },
    ],
  },
  {
    label: 'Pautas',
    items: [
      { to: '/supervisor/mi-disciplina',   icon: LayoutDashboard, label: 'Mi Disciplina'    },
      { to: '/supervisor/ruta-pautas',     icon: ClipboardCheck,  label: 'Pautas en Ruta'  },
      { to: '/supervisor/historial-pautas',icon: BookOpen,        label: 'Historial de Pautas' },
    ],
  },
]

const NAV_ADMIN_GROUPS = [
  {
    label: 'Supervisor',
    items: [
      { to: '/supervisor/dashboard', icon: LayoutDashboard, label: 'Dashboard'      },
      { to: '/supervisor/hallazgos', icon: ClipboardList,   label: 'Hallazgos'      },
      { to: '/supervisor/nuevo',     icon: PlusCircle,      label: 'Nuevo Hallazgo' },
    ],
  },
  {
    label: 'Pautas',
    items: [
      { to: '/admin/ruta-pautas',     icon: ClipboardCheck, label: 'Pautas en Ruta' },
      { to: '/admin/historial-pautas',icon: BookOpen,       label: 'Historial de Pautas'  },
      { to: '/admin/pautas',          icon: ClipboardCheck, label: 'Pautas'         },
    ],
  },
  {
    label: 'Administración',
    items: [
      { to: '/admin/usuarios',      icon: Users,         label: 'Usuarios'          },
      { to: '/admin/disciplinas',   icon: Wrench,        label: 'Disciplinas'       },
      { to: '/admin/plantillas',    icon: ClipboardCheck, label: 'Plantillas'       },
      { to: '/admin/ubicaciones',   icon: MapPin,        label: 'Ubicaciones'       },
      { to: '/admin/listas-correo', icon: Mail,          label: 'Listas Correo'     },
      { to: '/admin/logs-correo',   icon: History,       label: 'Historial Correos' },
      { to: '/admin/logs-acceso',   icon: Shield,        label: 'Log de Accesos'    },
    ],
  },
]

function navGroups(rolEfectivo) {
  if (rolEfectivo === 'INSPECTOR')     return NAV_INSPECTOR_GROUPS
  if (rolEfectivo === 'ADMINISTRADOR') return NAV_ADMIN_GROUPS
  return NAV_SUP_GROUPS
}

function flatItems(groups) {
  return groups.flatMap(g => g.items)
}

// ── Selector de rol para modo prueba ─────────────────────────────────────────
const ROL_OPTIONS = [
  { value: null,         label: 'Administrador', desc: 'Vista real' },
  { value: 'SUPERVISOR', label: 'Supervisor',    desc: 'Vista supervisor' },
  { value: 'INSPECTOR',  label: 'Inspector',     desc: 'Vista inspector' },
]

function RolSimulator() {
  const { simulatedRole, setSimulatedRole } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleSelect(valor) {
    setOpen(false)
    setSimulatedRole(valor)
    // Redirigir a la home del rol seleccionado
    if (!valor) {
      navigate('/supervisor/dashboard', { replace: true })
    } else if (valor === 'SUPERVISOR') {
      navigate('/supervisor/dashboard', { replace: true })
    } else {
      navigate('/inspector/hallazgos', { replace: true })
    }
  }

  const current = ROL_OPTIONS.find(o => o.value === simulatedRole) || ROL_OPTIONS[0]
  const isSimulating = !!simulatedRole

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors
          ${isSimulating
            ? 'bg-amber-500 text-white hover:bg-amber-400'
            : 'bg-blue-800 text-blue-200 hover:bg-blue-700'
          }`}
        title="Cambiar vista de rol"
      >
        <FlaskConical size={13} />
        <span className="hidden sm:inline">{isSimulating ? `Vista: ${current.label}` : 'Modo prueba'}</span>
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
          <div className="px-3 py-2 bg-gray-50 border-b">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Simular vista de rol</p>
          </div>
          {ROL_OPTIONS.map(opt => {
            const isActive = opt.value === simulatedRole
            return (
              <button
                key={String(opt.value)}
                onClick={() => handleSelect(opt.value)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors
                  ${isActive ? 'bg-amber-50 text-amber-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <div className="text-left">
                  <p className="font-medium">{opt.label}</p>
                  <p className="text-[11px] text-gray-400">{opt.desc}</p>
                </div>
                {isActive && <span className="text-amber-500 text-xs">activo</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Componente de links agrupados ─────────────────────────────────────────────
function NavGroupLinks({ groups, onClickLink }) {
  return (
    <div className="flex-1 overflow-y-auto">
      {groups.map(group => (
        <div key={group.label} className="mb-1">
          <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest select-none">
            {group.label}
          </p>
          {group.items.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClickLink}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors
                ${isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold border-r-4 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-blue-700'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Sidebar desktop (grupos) ──────────────────────────────────────────────────
function SidebarGroupLinks({ groups }) {
  return (
    <nav className="hidden md:flex flex-col w-56 bg-white border-r pt-2 flex-shrink-0 overflow-y-auto">
      {groups.map(group => (
        <div key={group.label} className="mb-1">
          <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest select-none">
            {group.label}
          </p>
          {group.items.map(({ to, icon: Icon, label }) => (
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
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </div>
      ))}

      <div className="mt-auto border-t pt-1 pb-2">
        <NavLink
          to="/perfil"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-r-full mr-3 text-sm transition-colors
            ${isActive
              ? 'bg-blue-50 text-blue-700 font-semibold'
              : 'text-gray-500 hover:text-blue-700 hover:bg-gray-50'
            }`
          }
        >
          <UserCircle size={17} />
          Mi Perfil
        </NavLink>
      </div>
    </nav>
  )
}

// ── AppShell ──────────────────────────────────────────────────────────────────
export default function AppShell() {
  const { user, logout, simulatedRole, rolEfectivo, setSimulatedRole } = useAuth()
  const navigate = useNavigate()
  const groups = navGroups(rolEfectivo)
  const bottomItems = flatItems(groups).slice(0, 4)
  const [drawerOpen, setDrawerOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const isAdmin = user?.rol === 'ADMINISTRADOR'
  const isSimulating = isAdmin && !!simulatedRole

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="bg-blue-900 text-white h-14 px-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="md:hidden p-1.5 hover:bg-blue-800 rounded-lg transition-colors"
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
          <span className="font-bold text-lg tracking-tight">SGConfi</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Selector de rol — solo para ADMINISTRADOR real */}
          {isAdmin && <RolSimulator />}

          <span className="text-sm text-blue-200 hidden sm:block">{user?.nombre}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full hidden sm:block
            ${isSimulating ? 'bg-amber-500 text-white' : 'text-blue-300 bg-blue-800'}`}>
            {isSimulating ? rolEfectivo : user?.rol}
          </span>
          <NavLink
            to="/perfil"
            title="Mi Perfil"
            className="p-1.5 hover:bg-blue-800 rounded-lg transition-colors flex items-center"
          >
            {user?.foto_url
              ? <img src={user.foto_url} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
              : <UserCircle size={18} />
            }
          </NavLink>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="p-1.5 hover:bg-blue-800 rounded-lg transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Banner de modo prueba */}
      {isSimulating && (
        <div className="bg-amber-500 text-white text-sm px-4 py-2 flex items-center justify-between sticky top-14 z-20 shadow-sm">
          <div className="flex items-center gap-2">
            <FlaskConical size={15} />
            <span>
              Modo prueba activo — viendo la app como <strong>{simulatedRole}</strong>
            </span>
          </div>
          <button
            onClick={() => {
              setSimulatedRole(null)
              navigate('/supervisor/dashboard', { replace: true })
            }}
            className="text-xs underline underline-offset-2 hover:text-amber-100 transition-colors"
          >
            Salir del modo prueba
          </button>
        </div>
      )}

      {/* Overlay drawer — móvil */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setDrawerOpen(false)} />
      )}

      {/* Drawer — móvil */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-64 bg-white z-50 shadow-xl transform transition-transform duration-200 flex flex-col
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="bg-blue-900 text-white h-14 flex items-center justify-between px-4 flex-shrink-0">
          <span className="font-bold text-lg">SGConfi</span>
          <button onClick={() => setDrawerOpen(false)} className="p-1.5 hover:bg-blue-800 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-4 py-3 border-b bg-gray-50 flex-shrink-0">
          <p className="text-sm font-medium text-gray-800">{user?.nombre}</p>
          <p className={`text-xs ${isSimulating ? 'text-amber-600 font-semibold' : 'text-gray-500'}`}>
            {isSimulating ? `Vista como: ${simulatedRole}` : user?.rol}
          </p>
        </div>

        <NavGroupLinks groups={groups} onClickLink={() => setDrawerOpen(false)} />

        <NavLink
          to="/perfil"
          onClick={() => setDrawerOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-5 py-3 text-sm transition-colors border-t flex-shrink-0
            ${isActive ? 'text-blue-700 font-semibold bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`
          }
        >
          <UserCircle size={18} />
          Mi Perfil
        </NavLink>

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
        <SidebarGroupLinks groups={groups} />

        {/* Contenido */}
        <main className="flex-1 overflow-auto p-4 pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav — móvil */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t flex justify-around py-2 z-20 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
        {bottomItems.map(({ to, icon: Icon, label }) => (
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
            <span className="text-[10px]">{label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
