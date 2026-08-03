import { useState } from 'react'
import { LiquidBackground } from '../components/LiquidBackground'
import { Sidebar, type MenuItem } from '../components/Sidebar'
import { MonthSelector } from '../components/MonthSelector'
import { PaymentsList } from '../components/PaymentsList'
import { IconDashboard, IconDebt, IconExpense, IconIncome, IconPayments } from '../components/icons'
import { useAuth } from '../context/AuthContext'
import { MonthProvider, useMonth } from '../context/MonthContext'
import './DashboardShell.css'

const MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <IconDashboard /> },
  { id: 'renda', label: 'Renda', icon: <IconIncome /> },
  { id: 'gasto-mes', label: 'Gasto Mês', icon: <IconExpense /> },
  { id: 'dividas', label: 'Dívidas', icon: <IconDebt /> },
  { id: 'pagamentos-mes', label: 'Pagamentos Mês', icon: <IconPayments /> },
]

const SECTION_TEXT: Record<string, { title: string; text: (monthLabel: string) => string }> = {
  dashboard: {
    title: 'Nenhuma funcionalidade habilitada ainda',
    text: (monthLabel) => `Um resumo geral das suas finanças em ${monthLabel} aparecerá aqui.`,
  },
  renda: {
    title: 'Nenhuma renda cadastrada',
    text: (monthLabel) => `Os lançamentos de renda de ${monthLabel} aparecerão aqui.`,
  },
  'gasto-mes': {
    title: 'Nenhum gasto registrado',
    text: (monthLabel) => `Os gastos de ${monthLabel} aparecerão aqui.`,
  },
  dividas: {
    title: 'Nenhuma dívida cadastrada',
    text: (monthLabel) => `As dívidas com vencimento em ${monthLabel} aparecerão aqui.`,
  },
}

export function DashboardShell() {
  return (
    <MonthProvider>
      <DashboardShellContent />
    </MonthProvider>
  )
}

function DashboardShellContent() {
  const { user, logout } = useAuth()
  const { monthLabel } = useMonth()
  const [activeMenu, setActiveMenu] = useState(MENU_ITEMS[0].id)

  const activeItem = MENU_ITEMS.find((item) => item.id === activeMenu) ?? MENU_ITEMS[0]

  return (
    <div className="page-shell">
      <LiquidBackground />

      <MonthSelector />

      <div className="app-shell">
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
            {activeMenu === 'pagamentos-mes' ? (
              <PaymentsList />
            ) : (
              <div className="liquid-glass dashboard-placeholder">
                <p className="dashboard-placeholder__title">{SECTION_TEXT[activeMenu].title}</p>
                <p className="dashboard-placeholder__text">{SECTION_TEXT[activeMenu].text(monthLabel)}</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
