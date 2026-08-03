import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { useMonth } from '../context/MonthContext'
import { createDebt, deleteDebt, fetchDebts, updateDebt, type Debt } from '../api/debtsApi'
import { ApiError } from '../api/authApi'
import { IconEdit, IconTrash } from './icons'
import { formatCurrency, formatDate } from '../utils/format'
import './DebtsTable.css'

const EMPTY_FORM = {
  credor: '',
  valorContratado: '',
  valorParcela: '',
  numeroParcelas: '',
  parcelaAtual: '',
  juros: '',
  dueDate: '',
}

function toCents(value: string): number {
  return Math.round(Number(value.replace(',', '.')) * 100)
}

export function DebtsTable() {
  const { token } = useAuth()
  const { selectedMonth, year, monthLabel } = useMonth()

  const [debts, setDebts] = useState<Debt[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    fetchDebts(token).then((data) => {
      if (!cancelled) setDebts(data)
    })
    return () => {
      cancelled = true
    }
  }, [token])

  function startEdit(debt: Debt) {
    setEditingId(debt.id)
    setError(null)
    setForm({
      credor: debt.credor,
      valorContratado: (debt.valorContratadoCents / 100).toFixed(2),
      valorParcela: (debt.valorParcelaCents / 100).toFixed(2),
      numeroParcelas: String(debt.numeroParcelas),
      parcelaAtual: String(debt.parcelaAtual),
      juros: debt.jurosPercent !== null ? String(debt.jurosPercent) : '',
      dueDate: debt.dueDate,
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setError(null)
    setForm(EMPTY_FORM)
  }

  const previewValorContratado = toCents(form.valorContratado || '0')
  const previewValorParcela = toCents(form.valorParcela || '0')
  const previewParcelaAtual = Number(form.parcelaAtual || '0')
  const previewValorPago = previewParcelaAtual * previewValorParcela
  const previewFaltaPagar = Math.max(0, previewValorContratado - previewValorPago)
  const showPreview = form.valorContratado !== '' && form.valorParcela !== '' && form.parcelaAtual !== ''

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const valorContratadoCents = toCents(form.valorContratado)
    const valorParcelaCents = toCents(form.valorParcela)
    const numeroParcelas = Number(form.numeroParcelas)
    const parcelaAtual = Number(form.parcelaAtual)
    const jurosPercent = form.juros.trim() === '' ? null : Number(form.juros.replace(',', '.'))

    if (
      !form.credor.trim() ||
      !valorContratadoCents ||
      valorContratadoCents <= 0 ||
      !valorParcelaCents ||
      valorParcelaCents <= 0 ||
      !Number.isInteger(numeroParcelas) ||
      numeroParcelas < 1 ||
      !Number.isInteger(parcelaAtual) ||
      parcelaAtual < 0 ||
      parcelaAtual > numeroParcelas ||
      !form.dueDate
    ) {
      setError('Preencha credor, valores, parcelas e vencimento corretamente. A parcela atual não pode ser maior que o número de parcelas.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        credor: form.credor,
        valorContratadoCents,
        valorParcelaCents,
        numeroParcelas,
        parcelaAtual,
        jurosPercent,
        dueDate: form.dueDate,
      }

      if (editingId !== null) {
        const updated = await updateDebt(token!, editingId, payload)
        setDebts((prev) => prev.map((debt) => (debt.id === editingId ? updated : debt)))
        setEditingId(null)
      } else {
        const created = await createDebt(token!, payload)
        setDebts((prev) => [...prev, created])
      }

      setForm(EMPTY_FORM)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar a dívida.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id: number) {
    if (editingId === id) cancelEdit()
    setDebts((prev) => prev.filter((debt) => debt.id !== id))
    await deleteDebt(token!, id)
  }

  const filtered = debts.filter((debt) => {
    if (selectedMonth === 'all') return true
    const due = new Date(`${debt.dueDate}T00:00:00`)
    return due.getFullYear() === year && due.getMonth() + 1 === selectedMonth
  })

  return (
    <div className="debts-section">
      <form className="neo-panel debts-form" onSubmit={handleSubmit}>
        {editingId !== null && <p className="debts-form__editing">Editando dívida</p>}

        <div className="debts-form__fields">
          <label className="debts-form__field debts-form__field--wide">
            <span>Credor</span>
            <input
              type="text"
              value={form.credor}
              onChange={(event) => setForm((prev) => ({ ...prev, credor: event.target.value }))}
              placeholder="Nome do credor"
              disabled={isSubmitting}
            />
          </label>

          <label className="debts-form__field">
            <span>Valor contratado (R$)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={form.valorContratado}
              onChange={(event) => setForm((prev) => ({ ...prev, valorContratado: event.target.value }))}
              disabled={isSubmitting}
            />
          </label>

          <label className="debts-form__field">
            <span>Valor da parcela (R$)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={form.valorParcela}
              onChange={(event) => setForm((prev) => ({ ...prev, valorParcela: event.target.value }))}
              disabled={isSubmitting}
            />
          </label>

          <label className="debts-form__field">
            <span>Número de parcelas</span>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="12"
              value={form.numeroParcelas}
              onChange={(event) => setForm((prev) => ({ ...prev, numeroParcelas: event.target.value }))}
              disabled={isSubmitting}
            />
          </label>

          <label className="debts-form__field">
            <span>Parcela atual</span>
            <input
              type="number"
              min="0"
              step="1"
              placeholder="1"
              value={form.parcelaAtual}
              onChange={(event) => setForm((prev) => ({ ...prev, parcelaAtual: event.target.value }))}
              disabled={isSubmitting}
            />
          </label>

          <label className="debts-form__field">
            <span>Juros % (opcional)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="—"
              value={form.juros}
              onChange={(event) => setForm((prev) => ({ ...prev, juros: event.target.value }))}
              disabled={isSubmitting}
            />
          </label>

          <label className="debts-form__field">
            <span>Data de vencimento</span>
            <input
              type="date"
              value={form.dueDate}
              onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
              disabled={isSubmitting}
            />
          </label>
        </div>

        {showPreview && (
          <div className="debts-form__preview">
            <span>
              Valor pago: <strong className="mono">{formatCurrency(previewValorPago)}</strong>
            </span>
            <span>
              Falta pagar: <strong className="mono">{formatCurrency(previewFaltaPagar)}</strong>
            </span>
          </div>
        )}

        {error && (
          <p className="debts-form__error" role="alert">
            {error}
          </p>
        )}

        <div className="debts-form__actions">
          <button type="submit" className="debts-form__submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando…' : editingId !== null ? 'Salvar alterações' : 'Adicionar dívida'}
          </button>
          {editingId !== null && (
            <button type="button" className="debts-form__cancel" onClick={cancelEdit} disabled={isSubmitting}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {filtered.length === 0 ? (
        <div className="neo-panel dashboard-placeholder">
          <p className="dashboard-placeholder__title">Nenhuma dívida cadastrada</p>
          <p className="dashboard-placeholder__text">Não há dívidas com vencimento em {monthLabel}.</p>
        </div>
      ) : (
        <div className="neo-panel debts-table-card">
          <div className="debts-table-scroll">
            <table className="debts-table">
              <thead>
                <tr>
                  <th>Credor</th>
                  <th>Contratado</th>
                  <th>Parcela</th>
                  <th>Parcelas</th>
                  <th>Pago</th>
                  <th>Falta pagar</th>
                  <th>Juros</th>
                  <th>Vencimento</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((debt) => {
                  const progress = debt.numeroParcelas > 0 ? (debt.parcelaAtual / debt.numeroParcelas) * 100 : 0
                  return (
                    <tr key={debt.id} className={debt.id === editingId ? 'debts-table__row--editing' : undefined}>
                      <td>{debt.credor}</td>
                      <td className="debts-table__amount">{formatCurrency(debt.valorContratadoCents)}</td>
                      <td className="debts-table__amount">{formatCurrency(debt.valorParcelaCents)}</td>
                      <td>
                        <div className="debts-progress">
                          <span className="debts-progress__label">
                            {debt.parcelaAtual}/{debt.numeroParcelas}
                          </span>
                          <div className="debts-progress__bar">
                            <div className="debts-progress__fill" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="debts-table__amount debts-table__amount--paid">{formatCurrency(debt.valorPagoCents)}</td>
                      <td className="debts-table__amount debts-table__amount--due">{formatCurrency(debt.faltaPagarCents)}</td>
                      <td>{debt.jurosPercent !== null ? `${debt.jurosPercent}%` : '—'}</td>
                      <td>{formatDate(debt.dueDate)}</td>
                      <td>
                        <div className="debts-table__actions">
                          <button
                            type="button"
                            className="debts-table__icon-btn"
                            onClick={() => startEdit(debt)}
                            aria-label={`Editar dívida com ${debt.credor}`}
                          >
                            <IconEdit width={16} height={16} />
                          </button>
                          <button
                            type="button"
                            className="debts-table__icon-btn debts-table__icon-btn--danger"
                            onClick={() => handleDelete(debt.id)}
                            aria-label={`Remover dívida com ${debt.credor}`}
                          >
                            <IconTrash width={16} height={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
