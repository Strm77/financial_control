import { parseError } from './client'

export interface SelectOption {
  id: number
  field: string
  label: string
}

export async function fetchOptions(section: string): Promise<SelectOption[]> {
  const response = await fetch(`/api/settings/options?section=${encodeURIComponent(section)}`)

  if (!response.ok) {
    await parseError(response)
  }

  const data = (await response.json()) as { options: SelectOption[] }
  return data.options
}

export async function createOption(
  section: string,
  field: string,
  label: string,
): Promise<SelectOption> {
  const response = await fetch('/api/settings/options', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ section, field, label }),
  })

  if (!response.ok) {
    await parseError(response)
  }

  const data = (await response.json()) as { option: SelectOption }
  return data.option
}

export async function deleteOption(id: number): Promise<void> {
  const response = await fetch(`/api/settings/options/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    await parseError(response)
  }
}
