import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'
import { BibleIcon } from '../../assets/BibleIcon'

export function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  function closeDrawer() {
    setDrawerOpen(false)
  }

  return (
    <div className="flex min-h-screen bg-[#f7f7f7] font-nunito overflow-x-hidden">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-100 px-4 py-6 shrink-0">
        <SidebarContent user={user} onLogout={handleLogout} onNavigate={closeDrawer} />
      </aside>

      {/* Drawer overlay — mobile */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={closeDrawer}
        />
      )}

      {/* Drawer — mobile */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 px-4 py-6 z-50 transition-transform duration-300 md:hidden
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BibleIcon className="w-9 h-9" />
            <div>
              <p className="text-base font-black text-gray-800 leading-none">Bíblia Kids</p>
              <span className="text-xs font-bold bg-[#CE82FF]/20 text-[#9333EA] px-2 py-0.5 rounded-full">
                Admin
              </span>
            </div>
          </div>
          <button
            onClick={closeDrawer}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors text-xl"
          >
            ✕
          </button>
        </div>
        <SidebarContent user={user} onLogout={handleLogout} onNavigate={closeDrawer} />
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header mobile */}
        <header className="md:hidden flex items-center justify-between bg-white px-4 py-3 border-b border-gray-100 shrink-0">
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Abrir menu"
          >
            <HamburgerIcon />
          </button>
          <div className="flex items-center gap-2">
            <BibleIcon className="w-7 h-7" />
            <span className="text-base font-black text-gray-800">Bíblia Kids</span>
            <span className="text-xs font-bold bg-[#CE82FF]/20 text-[#9333EA] px-2 py-0.5 rounded-full">
              Admin
            </span>
          </div>
          <div className="w-9" />
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function SidebarContent({
  user,
  onLogout,
  onNavigate,
}: {
  user: ReturnType<typeof useAuth>['user']
  onLogout: () => void
  onNavigate: () => void
}) {
  return (
    <>
      {/* Logo + badge admin — só no desktop (mobile tem no header do drawer) */}
      <div className="hidden md:flex items-center gap-3 mb-8 px-2">
        <BibleIcon className="w-10 h-10" />
        <div>
          <p className="text-base font-black text-gray-800 leading-none">Bíblia Kids</p>
          <span className="text-xs font-bold bg-[#CE82FF]/20 text-[#9333EA] px-2 py-0.5 rounded-full">
            Admin
          </span>
        </div>
      </div>

      {/* Info do admin */}
      <div className="flex items-center gap-3 bg-[#f7f7f7] rounded-xl px-3 py-3 mb-6">
        <div className="w-9 h-9 rounded-full bg-[#CE82FF] flex items-center justify-center text-white font-black text-sm shrink-0">
          {user?.displayName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-gray-800 truncate">{user?.displayName}</p>
          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex flex-col gap-1 flex-1">
        <p className="text-xs font-black text-gray-400 uppercase tracking-wider px-3 mb-1">
          Gestão de Conteúdo
        </p>
        <AdminNavLink to="/admin/plans" icon="📚" onClick={onNavigate}>
          Planos de Estudo
        </AdminNavLink>
      </nav>

      {/* Rodapé */}
      <div className="flex flex-col gap-2 mt-4">
        <NavLink
          to="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-[#1CB0F6] hover:bg-blue-50 transition-colors"
        >
          <span>👁️</span> Ver como aluno
        </NavLink>
        <button
          onClick={onLogout}
          className="w-full py-2 rounded-xl text-gray-400 font-bold text-sm hover:bg-gray-50 hover:text-gray-600 transition-colors text-left px-4"
        >
          Sair
        </button>
        <span className="text-[10px] text-gray-300 font-semibold text-center mt-1">v{__APP_VERSION__}</span>
      </div>
    </>
  )
}

function AdminNavLink({
  to,
  icon,
  onClick,
  children,
}: {
  to: string
  icon: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-colors
        ${isActive
          ? 'bg-[#CE82FF]/15 text-[#9333EA]'
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`
      }
    >
      <span className="text-lg">{icon}</span>
      {children}
    </NavLink>
  )
}

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect y="3" width="20" height="2.5" rx="1.25" fill="currentColor" />
      <rect y="9" width="20" height="2.5" rx="1.25" fill="currentColor" />
      <rect y="15" width="20" height="2.5" rx="1.25" fill="currentColor" />
    </svg>
  )
}
