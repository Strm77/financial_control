import { useState } from 'react'
import { LiquidBackground } from '../components/LiquidBackground'
import { Sidebar, type MenuItem } from '../components/Sidebar'
import { MonthSelector } from '../components/MonthSelector'
import { PaymentsList } from '../components/PaymentsList'
import { IncomeTable } from '../components/IncomeTable'
import { IconDashboard, IconDebt, IconExpense, IconIncome, IconPayments, IconSettings } from '../components/icons'
import { useAuth } from '../context/AuthContext'
import { MonthProvider, useMonth } from '../context/MonthContext'
import { SettingsPage } from './SettingsPage'
import './DashboardShell.css'

const MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <IconDashboard /> },
  { id: 'renda', label: 'Renda', icon: <IconIncome /> },
  { id: 'gasto-mes', label: 'Gasto Mês', icon: <IconExpense /> },
  { id: 'dividas', label: 'Dívidas', icon: <IconDebt /> },
  { id: 'pagamentos-mes', label: 'Pagamentos Mês', icon: <IconPayments /> },
]

const FOOTER_ITEMS: MenuItem[] = [{ id: 'configuracoes', label: 'Configurações', icon: <IconSettings /> }]

const SECTION_TEXT: Record<string, { title: string; text: (monthLabel: string) => string }> = {
  dashboard: {
    title: 'Nenhuma funcionalidade habilitada ainda',
    text: (monthLabel) => `Um resumo geral das suas finanças em ${monthLabel} aparecerá aqui.`,
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

  const activeItem = [...MENU_ITEMS, ...FOOTER_ITEMS].find((item) => item.id === activeMenu) ?? MENU_ITEMS[0]

  function renderMain() {
    if (activeMenu === 'renda') return <IncomeTable />
    if (activeMenu === 'pagamentos-mes') return <PaymentsList />
    if (activeMenu === 'configuracoes') return <SettingsPage />

    const section = SECTION_TEXT[activeMenu]
    return (
      <div className="liquid-glass dashboard-placeholder">
        <p className="dashboard-placeholder__title">{section.title}</p>
        <p className="dashboard-placeholder__text">{section.text(monthLabel)}</p>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <LiquidBackground />

      <MonthSelector />

      <div className="app-shell">
        <Sidebar items={MENU_ITEMS} footerItems={FOOTER_ITEMS} activeId={activeMenu} onSelect={setActiveMenu} />

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

          <main className="app-main">{renderMain()}</main>
        </div>
      </div>
    </div>
  )
}
