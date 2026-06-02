import { AuthProvider } from './features/auth/useAuth'
import { AppRouter } from './routes/AppRouter'

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}
