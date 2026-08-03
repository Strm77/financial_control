import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  createCardExpense,
  deleteCardExpense,
  fetchCardExpenses,
  importFatura,
  type CardExpense,
} from '../api/cardExpensesApi'
import { ApiError } from '../api/authApi'
import type { Payment } from '../api/paymentsApi'
import { IconTrash, IconUpload } from './icons'
import { formatCurrency } from '../utils/format'
import './CardExpensePanel.css'

const EMPTY_FORM = { descricao: '', valor: '', parcelaAtual: '', numeroParcelas: '' }

export function CardExpensePanel({ payment }: { payment: Payment }) {
  const { token } = useAuth()
  const [expenses, setExpenses] = useState<CardExpense[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    fetchCardExpenses(token, payment.id).then((data) => {
      if (!cancelled) setExpenses(data)
    })
    return () => {
      cancelled = true
    }
  }, [token, payment.id])

  const total = expenses.reduce((sum, expense) => sum + expense.valorCents, 0)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const valorCents = Math.round(Number(form.valor.replace(',', '.')) * 100)
    const hasParcela = form.parcelaAtual.trim() !== '' || form.numeroParcelas.trim() !== ''
    const parcelaAtual = hasParcela ? Number(form.parcelaAtual) : null
    const numeroParcelas = hasParcela ? Number(form.numeroParcelas) : null

    if (!form.descricao.trim() || !valorCents || valorCents <= 0) {
      setError('Preencha a descrição e um valor válido.')
      return
    }
    if (hasParcela && (!parcelaAtual || !numeroParcelas || parcelaAtual > numeroParcelas)) {
      setError('Preencha parcela atual e número de parcelas corretamente, ou deixe os dois em branco.')
      return
    }

    setIsSubmitting(true)
    try {
      const created = await createCardExpense(token!, {
        paymentId: payment.id,
        descricao: form.descricao,
        valorCents,
        parcelaAtual,
        numeroParcelas,
      })
      setExpenses((prev) => [created, ...prev])
      setForm(EMPTY_FORM)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar o gasto.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id: number) {
    setExpenses((prev) => prev.filter((expense) => expense.id !== id))
    await deleteCardExpense(token!, id)
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setImportMessage(null)
    setIsImporting(true)
    try {
      const result = await importFatura(token!, payment.id, file)
      if (result.expenses.length > 0) {
        setExpenses((prev) => [...result.expenses, ...prev])
      }
      setImportMessage(result.message ?? `${result.expenses.length} itens importados.`)
    } catch (err) {
      setImportMessage(err instanceof ApiError ? err.message : 'Não foi possível ler a fatura.')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="neo-panel card-expense-panel">
      <div className="card-expense-panel__header">
        <div>
          <h3>{payment.descricao}</h3>
          <span className="card-expense-panel__tag">{payment.categoria}</span>
        </div>
        <span className="card-expense-panel__total mono">{formatCurrency(total)}</span>
      </div>

      <form className="card-expense-panel__form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Descrição do gasto"
          className="card-expense-panel__desc"
          value={form.descricao}
          onChange={(event) => setForm((prev) => ({ ...prev, descricao: event.target.value }))}
          disabled={isSubmitting}
        />
        <div className="card-expense-panel__form-row">
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Valor (R$)"
            value={form.valor}
            onChange={(event) => setForm((prev) => ({ ...prev, valor: event.target.value }))}
            disabled={isSubmitting}
          />
          <input
            type="number"
            min="1"
            step="1"
            placeholder="Parcela"
            className="card-expense-panel__narrow"
            value={form.parcelaAtual}
            onChange={(event) => setForm((prev) => ({ ...prev, parcelaAtual: event.target.value }))}
            disabled={isSubmitting}
          />
          <input
            type="number"
            min="1"
            step="1"
            placeholder="Total"
            className="card-expense-panel__narrow"
            value={form.numeroParcelas}
            onChange={(event) => setForm((prev) => ({ ...prev, numeroParcelas: event.target.value }))}
            disabled={isSubmitting}
          />
          <button type="submit" disabled={isSubmitting}>
            Adicionar
          </button>
        </div>
      </form>

      {error && (
        <p className="card-expense-panel__error" role="alert">
          {error}
        </p>
      )}

      <div className="card-expense-panel__import">
        <button
          type="button"
          className="card-expense-panel__upload-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
        >
          <IconUpload width={15} height={15} />
          {isImporting ? 'Lendo fatura…' : 'Anexar fatura (PDF)'}
        </button>
        <input ref={fileInputRef} type="file" accept="application/pdf" hidden onChange={handleFileChange} />
        {importMessage && <span className="card-expense-panel__import-message">{importMessage}</span>}
      </div>

      {expenses.length === 0 ? (
        <p className="card-expense-panel__empty">Nenhum gasto lançado neste cartão ainda.</p>
      ) : (
        <ul className="card-expense-panel__list">
          {expenses.map((expense) => (
            <li key={expense.id} className="card-expense-panel__item">
              <div>
                <p className="card-expense-panel__item-desc">{expense.descricao}</p>
                {expense.parcelaAtual && expense.numeroParcelas && (
                  <span className="card-expense-panel__installments">
                    {expense.parcelaAtual}/{expense.numeroParcelas}
                  </span>
                )}
              </div>
              <div className="card-expense-panel__item-right">
                <span className="mono">{formatCurrency(expense.valorCents)}</span>
                <button
                  type="button"
                  className="card-expense-panel__delete"
                  onClick={() => handleDelete(expense.id)}
                  aria-label={`Remover ${expense.descricao}`}
                >
                  <IconTrash width={14} height={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
