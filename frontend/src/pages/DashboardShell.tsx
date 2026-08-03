import { useState } from 'react'
import { Sidebar, type MenuItem } from '../components/Sidebar'
import { MonthSelector } from '../components/MonthSelector'
import { PaymentsTable } from '../components/PaymentsTable'
import { IncomeTable } from '../components/IncomeTable'
import { DebtsTable } from '../components/DebtsTable'
import { GastoMesPage } from '../components/GastoMesPage'
import { DashboardPage } from '../components/DashboardPage'
import { IconDashboard, IconDebt, IconExpense, IconIncome, IconPayments, IconSettings } from '../components/icons'
import { useAuth } from '../context/AuthContext'
import { MonthProvider } from '../context/MonthContext'
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

export function DashboardShell() {
  return (
    <MonthProvider>
      <DashboardShellContent />
    </MonthProvider>
  )
}

function DashboardShellContent() {
  const { user, logout } = useAuth()
  const [activeMenu, setActiveMenu] = useState(MENU_ITEMS[0].id)

  const activeItem = [...MENU_ITEMS, ...FOOTER_ITEMS].find((item) => item.id === activeMenu) ?? MENU_ITEMS[0]

  function renderMain() {
    if (activeMenu === 'renda') return <IncomeTable />
    if (activeMenu === 'dividas') return <DebtsTable />
    if (activeMenu === 'gasto-mes') return <GastoMesPage />
    if (activeMenu === 'pagamentos-mes') return <PaymentsTable />
    if (activeMenu === 'configuracoes') return <SettingsPage />
    return <DashboardPage />
  }

  return (
    <div className="page-shell">
      <MonthSelector />

      <div className="app-shell">
        <Sidebar items={MENU_ITEMS} footerItems={FOOTER_ITEMS} activeId={activeMenu} onSelect={setActiveMenu} />

        <div className="app-content">
          <header className="neo-panel app-topbar">
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
