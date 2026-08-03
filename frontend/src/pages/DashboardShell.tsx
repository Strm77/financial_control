import { LiquidBackground } from '../components/LiquidBackground'
import { useAuth } from '../context/AuthContext'
import './DashboardShell.css'

export function DashboardShell() {
  const { user, logout } = useAuth()

  return (
    <div className="dashboard-screen">
      <LiquidBackground />

      <header className="liquid-glass dashboard-header">
        <div>
          <span className="dashboard-header__eyebrow">Financial Control</span>
          <h1>Olá, {user?.username}</h1>
        </div>
        <button type="button" className="logout-button" onClick={logout}>
          Sair
        </button>
      </header>

      <main className="dashboard-main">
        <div className="liquid-glass dashboard-placeholder">
          <p className="dashboard-placeholder__title">Nenhuma funcionalidade habilitada ainda</p>
          <p className="dashboard-placeholder__text">
            Login realizado com sucesso. As próximas funcionalidades do sistema serão adicionadas aqui.
          </p>
        </div>
      </main>
    </div>
  )
}
