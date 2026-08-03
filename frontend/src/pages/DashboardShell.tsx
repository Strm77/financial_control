import { useState } from 'react'
import { LiquidBackground } from '../components/LiquidBackground'
import { Sidebar, type MenuItem } from '../components/Sidebar'
import { IconDashboard, IconDebt, IconExpense, IconIncome, IconPayments } from '../components/icons'
import { useAuth } from '../context/AuthContext'
import './DashboardShell.css'

const MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <IconDashboard /> },
  { id: 'renda', label: 'Renda', icon: <IconIncome /> },
  { id: 'gasto-mes', label: 'Gasto Mês', icon: <IconExpense /> },
  { id: 'dividas', label: 'Dívidas', icon: <IconDebt /> },
  { id: 'pagamentos-mes', label: 'Pagamentos Mês', icon: <IconPayments /> },
]

const SECTION_CONTENT: Record<string, { title: string; text: string }> = {
  dashboard: {
    title: 'Nenhuma funcionalidade habilitada ainda',
    text: 'Login realizado com sucesso. Um resumo geral das suas finanças aparecerá aqui.',
  },
  renda: {
    title: 'Nenhuma renda cadastrada',
    text: 'Quando o cadastro de renda for implementado, os lançamentos aparecerão aqui.',
  },
  'gasto-mes': {
    title: 'Nenhum gasto registrado neste mês',
    text: 'Quando o controle de gastos for implementado, os lançamentos do mês aparecerão aqui.',
  },
  dividas: {
    title: 'Nenhuma dívida cadastrada',
    text: 'Quando o controle de dívidas for implementado, elas aparecerão aqui.',
  },
  'pagamentos-mes': {
    title: 'Nenhum pagamento agendado',
    text: 'Quando o controle de pagamentos for implementado, os compromissos do mês aparecerão aqui.',
  },
}

export function DashboardShell() {
  const { user, logout } = useAuth()
  const [activeMenu, setActiveMenu] = useState(MENU_ITEMS[0].id)

  const activeItem = MENU_ITEMS.find((item) => item.id === activeMenu) ?? MENU_ITEMS[0]
  const section = SECTION_CONTENT[activeMenu]

  return (
    <div className="app-shell">
      <LiquidBackground />

      <Sidebar items={MENU_ITEMS} activeId={activeMenu} onSelect={setActiveMenu} />

      <div className="app-content">
        <header className="liquid-glass app-topbar">
          <div>
            <span className="app-topbar__eyebrow">Olá, {user?.username}</span>
            <h1>{activeItem.label}</h1>
          </div>
          <button type="button" className="logout-button" onClick={logout}>
            Sair
          </button>
        </header>

        <main className="app-main">
          <div className="liquid-glass dashboard-placeholder">
            <p className="dashboard-placeholder__title">{section.title}</p>
            <p className="dashboard-placeholder__text">{section.text}</p>
          </div>
        </main>
      </div>
    </div>
  )
}
