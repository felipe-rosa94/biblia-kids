import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'

export function AuthGuard() {
  const { user, loading } = useAuth()

  if (loading) return <FullPageSpinner />
  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}

export function AdminGuard() {
  const { user, loading } = useAuth()

  if (loading) return <FullPageSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />

  return <Outlet />
}

function FullPageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f7f7f7]">
      <div className="w-12 h-12 border-4 border-[#58CC02] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
