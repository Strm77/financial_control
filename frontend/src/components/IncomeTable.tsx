import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { useMonth } from '../context/MonthContext'
import { useSelectOptions } from '../hooks/useSelectOptions'
import { createIncome, deleteIncome, fetchIncomes, type Income } from '../api/incomesApi'
import { ApiError } from '../api/authApi'
import { IconTrash } from './icons'
import { formatCurrency, formatDate } from '../utils/format'
import './IncomeTable.css'

const EMPTY_FORM = { fonte: '', categoria: '', tipo: '', valor: '' }

export function IncomeTable() {
  const { token } = useAuth()
  const { selectedMonth, year, monthLabel } = useMonth()
  const { byField } = useSelectOptions('renda')

  const [incomes, setIncomes] = useState<Income[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    fetchIncomes(token).then((data) => {
      if (!cancelled) setIncomes(data)
    })
    return () => {
      cancelled = true
    }
  }, [token])

  const fonteOptions = byField('fonte')
  const categoriaOptions = byField('categoria')
  const tipoOptions = byField('tipo')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const amountCents = Math.round(Number(form.valor.replace(',', '.')) * 100)

    if (!form.fonte || !form.categoria || !form.tipo || !amountCents || amountCents <= 0) {
      setError('Preencha fonte, categoria, tipo e um valor válido.')
      return
    }

    setIsSubmitting(true)
    try {
      const created = await createIncome(token!, {
        fonte: form.fonte,
        categoria: form.categoria,
        tipo: form.tipo,
        amountCents,
      })
      setIncomes((prev) => [created, ...prev])
      setForm(EMPTY_FORM)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar a renda.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id: number) {
    setIncomes((prev) => prev.filter((income) => income.id !== id))
    await deleteIncome(token!, id)
  }

  const filtered = incomes.filter((income) => {
    if (selectedMonth === 'all') return true
    const received = new Date(`${income.receivedDate}T00:00:00`)
    return received.getFullYear() === year && received.getMonth() + 1 === selectedMonth
  })

  return (
    <div className="income-section">
      <form className="liquid-glass income-form" onSubmit={handleSubmit}>
        <div className="income-form__fields">
          <label className="income-form__field">
            <span>Fonte</span>
            <select
              value={form.fonte}
              onChange={(event) => setForm((prev) => ({ ...prev, fonte: event.target.value }))}
              disabled={isSubmitting}
            >
              <option value="">Selecione</option>
              {fonteOptions.map((option) => (
                <option key={option.id} value={option.label}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="income-form__field">
            <span>Categoria</span>
            <select
              value={form.categoria}
              onChange={(event) => setForm((prev) => ({ ...prev, categoria: event.target.value }))}
              disabled={isSubmitting}
            >
              <option value="">Selecione</option>
              {categoriaOptions.map((option) => (
                <option key={option.id} value={option.label}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="income-form__field">
            <span>Tipo</span>
            <select
              value={form.tipo}
              onChange={(event) => setForm((prev) => ({ ...prev, tipo: event.target.value }))}
              disabled={isSubmitting}
            >
              <option value="">Selecione</option>
              {tipoOptions.map((option) => (
                <option key={option.id} value={option.label}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="income-form__field income-form__field--amount">
            <span>Valor (R$)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={form.valor}
              onChange={(event) => setForm((prev) => ({ ...prev, valor: event.target.value }))}
              disabled={isSubmitting}
            />
          </label>
        </div>

        {error && (
          <p className="income-form__error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="income-form__submit" disabled={isSubmitting}>
          {isSubmitting ? 'Adicionando…' : 'Adicionar renda'}
        </button>
      </form>

      {filtered.length === 0 ? (
        <div className="liquid-glass dashboard-placeholder">
          <p className="dashboard-placeholder__title">Nenhuma renda cadastrada</p>
          <p className="dashboard-placeholder__text">Não há rendas cadastradas para {monthLabel}.</p>
        </div>
      ) : (
        <div className="liquid-glass income-table-card">
          <div className="income-table-scroll">
            <table className="income-table">
              <thead>
                <tr>
                  <th>Fonte</th>
                  <th>Categoria</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Data de recebimento</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((income) => (
                  <tr key={income.id}>
                    <td>{income.fonte}</td>
                    <td>
                      <span className="income-tag">{income.categoria}</span>
                    </td>
                    <td>{income.tipo}</td>
                    <td className="income-table__amount">{formatCurrency(income.amountCents)}</td>
                    <td>{formatDate(income.receivedDate)}</td>
                    <td>
                      <button
                        type="button"
                        className="income-table__delete"
                        onClick={() => handleDelete(income.id)}
                        aria-label={`Remover renda de ${income.fonte}`}
                      >
                        <IconTrash width={16} height={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
