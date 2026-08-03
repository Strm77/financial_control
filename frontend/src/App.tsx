import { useAuth } from './context/AuthContext'
import { LoginPage } from './pages/LoginPage'
import { DashboardShell } from './pages/DashboardShell'

function App() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  return isAuthenticated ? <DashboardShell /> : <LoginPage />
}

export default App
