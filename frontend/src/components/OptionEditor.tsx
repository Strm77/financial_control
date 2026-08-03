import { useState, type FormEvent } from 'react'
import type { SelectOption } from '../api/settingsApi'
import { ApiError } from '../api/authApi'
import './OptionEditor.css'

interface OptionEditorProps {
  field: string
  label: string
  options: SelectOption[]
  onAdd: (field: string, label: string) => Promise<void>
  onRemove: (id: number) => Promise<void>
}

export function OptionEditor({ field, label, options, onAdd, onRemove }: OptionEditorProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!value.trim()) return

    setIsSubmitting(true)
    try {
      await onAdd(field, value.trim())
      setValue('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível adicionar essa opção.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="option-editor">
      <h3 className="option-editor__title">{label}</h3>

      <div className="option-editor__chips">
        {options.length === 0 && <span className="option-editor__empty">Nenhuma opção cadastrada</span>}
        {options.map((option) => (
          <span key={option.id} className="option-chip">
            {option.label}
            <button
              type="button"
              className="option-chip__remove"
              onClick={() => onRemove(option.id)}
              aria-label={`Remover ${option.label}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <form className="option-editor__form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Nova opção"
          disabled={isSubmitting}
        />
        <button type="submit" disabled={isSubmitting}>
          Adicionar
        </button>
      </form>

      {error && (
        <p className="option-editor__error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
