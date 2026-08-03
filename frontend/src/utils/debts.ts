import type { Debt } from '../api/debtsApi'
import type { SelectedMonth } from '../context/MonthContext'
import { addMonthsToDate, yearMonthIndex } from './format'

export interface VisibleDebtEntry {
  debt: Debt
  projectedDueDate: string
}

export function getVisibleDebts(debts: Debt[], selectedMonth: SelectedMonth, year: number): VisibleDebtEntry[] {
  const selectedIndex = selectedMonth === 'all' ? null : year * 12 + (selectedMonth - 1)

  return debts
    .map((debt) => {
      if (selectedIndex === null) {
        return { debt, projectedDueDate: debt.dueDate, visible: true }
      }

      const startIndex = yearMonthIndex(debt.dueDate)

      if (!debt.recorrente) {
        return { debt, projectedDueDate: debt.dueDate, visible: selectedIndex === startIndex }
      }

      const endIndex = yearMonthIndex(debt.dataFinal)
      const visible = selectedIndex >= startIndex && selectedIndex <= endIndex
      const projectedDueDate = visible ? addMonthsToDate(debt.dueDate, selectedIndex - startIndex) : debt.dueDate
      return { debt, projectedDueDate, visible }
    })
    .filter((entry): entry is VisibleDebtEntry & { visible: true } => entry.visible)
    .map(({ debt, projectedDueDate }) => ({ debt, projectedDueDate }))
}
