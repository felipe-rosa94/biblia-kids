import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'
import { calculateLevel, levelProgressPercent, xpForCurrentLevel, xpToNextLevel } from '../../utils/xp'
import { BibleIcon } from '../../assets/BibleIcon'

export function StudentLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const totalXP = user?.xp ?? 0
  const level = calculateLevel(totalXP)
  const progressPercent = levelProgressPercent(totalXP)
  const xpCurrent = xpForCurrentLevel(totalXP)
  const xpNext = xpToNextLevel(totalXP)

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-[#f7f7f7] font-nunito overflow-x-hidden">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 px-4 py-6 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <BibleIcon className="w-10 h-10" />
          <span className="text-xl font-black text-gray-800">Bíblia Kids</span>
        </div>

        {/* Avatar + nome + nível */}
        <div className="flex flex-col items-center bg-[#f7f7f7] rounded-2xl p-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-[#1CB0F6] flex items-center justify-center text-white text-2xl font-black mb-2">
            {user?.displayName.charAt(0).toUpperCase()}
          </div>
          <p className="font-extrabold text-gray-800 text-sm">{user?.displayName}</p>
          <p className="text-xs text-gray-400 font-semibold">Nível {level}</p>
        </div>

        {/* Barra de XP */}
        <div className="mb-6 px-1">
          <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
            <span>{totalXP} XP</span>
            <span>{xpCurrent}/{xpNext} para o nível {level + 1}</span>
          </div>
          <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#FFD900] rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <StreakBadge streak={user?.streak ?? 0} />

        {/* Navegação */}
        <nav className="flex flex-col gap-1 mt-4 flex-1">
          <SideNavLink to="/dashboard" icon="🏠">Início</SideNavLink>
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="mt-4 w-full py-3 rounded-xl text-gray-400 font-bold text-sm hover:bg-gray-50 hover:text-gray-600 transition-colors"
        >
          Sair
        </button>

        <span className="text-[10px] text-gray-300 font-semibold text-center mt-1">v{__APP_VERSION__}</span>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 flex flex-col">
        {/* Header mobile */}
        <header className="md:hidden flex items-center justify-between bg-white px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BibleIcon className="w-8 h-8" />
            <span className="text-lg font-black text-gray-800">Bíblia Kids</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-[#FF9600]">🔥 {user?.streak ?? 0}</span>
            <span className="text-sm font-bold text-[#FF9600]">⭐ {totalXP} XP</span>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8">
          <Outlet />
        </div>

        {/* Bottom nav mobile */}
        <nav className="md:hidden flex flex-col bg-white border-t border-gray-100">
          <div className="flex">
            <BottomNavLink to="/dashboard" icon="🏠" label="Início" />
          </div>
          <span className="text-[10px] text-gray-300 font-semibold text-center py-1">v{__APP_VERSION__}</span>
        </nav>
      </main>
    </div>
  )
}

function SideNavLink({ to, icon, children }: { to: string; icon: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-colors
        ${isActive
          ? 'bg-[#58CC02]/10 text-[#58CC02]'
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`
      }
    >
      <span className="text-lg">{icon}</span>
      {children}
    </NavLink>
  )
}

function BottomNavLink({ to, icon, label }: { to: string; icon: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center flex-1 py-2 text-xs font-bold transition-colors
        ${isActive ? 'text-[#58CC02]' : 'text-gray-400'}`
      }
    >
      <span className="text-xl">{icon}</span>
      {label}
    </NavLink>
  )
}

function StreakBadge({ streak }: { streak: number }) {
  return (
    <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2">
      <span className="text-2xl">🔥</span>
      <div>
        <p className="text-sm font-black text-[#FF9600]">{streak} dias</p>
        <p className="text-xs text-gray-400 font-semibold">sequência atual</p>
      </div>
    </div>
  )
}

