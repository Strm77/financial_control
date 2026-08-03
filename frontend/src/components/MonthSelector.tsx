import { MONTH_NAMES, useMonth, type MonthStatus } from '../context/MonthContext'
import './MonthSelector.css'

const STATUS_LABEL: Record<MonthStatus, string> = {
  gray: 'Mês encerrado',
  red: 'Pagamentos em atraso',
  yellow: 'Pagamentos pendentes',
  green: 'Pagamentos em dia',
}

export function MonthSelector() {
  const { year, selectedMonth, setSelectedMonth, getMonthStatus } = useMonth()

  return (
    <div className="neo-panel month-selector" aria-label="Seletor de mês">
      <div className="month-selector__scroll">
        <button
          type="button"
          className={`month-pill month-pill--all${selectedMonth === 'all' ? ' month-pill--selected' : ''}`}
          onClick={() => setSelectedMonth('all')}
          title="Ver dados de todos os meses juntos"
        >
          Geral
        </button>

        <span className="month-selector__divider" aria-hidden="true" />

        {MONTH_NAMES.map((name, index) => {
          const month = index + 1
          const status = getMonthStatus(month)
          const isSelected = selectedMonth === month

          return (
            <button
              key={month}
              type="button"
              className={`month-pill month-pill--${status}${isSelected ? ' month-pill--selected' : ''}`}
              onClick={() => setSelectedMonth(month)}
              title={`${name} de ${year} — ${STATUS_LABEL[status]}`}
              aria-current={isSelected ? 'true' : undefined}
            >
              <span className="month-pill__dot" aria-hidden="true" />
              {name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
