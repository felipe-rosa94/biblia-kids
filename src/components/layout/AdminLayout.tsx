import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'
import { BibleIcon } from '../../assets/BibleIcon'

export function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-[#f7f7f7] font-nunito">
      {/* Sidebar */}
      <aside className="flex flex-col w-60 bg-white border-r border-gray-100 px-4 py-6 shrink-0">
        {/* Logo + badge admin */}
        <div className="flex items-center gap-3 mb-8 px-2">
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
          <AdminNavLink to="/admin/plans" icon="📚">Planos de Estudo</AdminNavLink>
        </nav>

        {/* Rodapé */}
        <div className="flex flex-col gap-2 mt-4">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-[#1CB0F6] hover:bg-blue-50 transition-colors"
          >
            <span>👁️</span> Ver como aluno
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full py-2 rounded-xl text-gray-400 font-bold text-sm hover:bg-gray-50 hover:text-gray-600 transition-colors text-left px-4"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

function AdminNavLink({ to, icon, children }: { to: string; icon: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
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
