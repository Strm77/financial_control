import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { createOption, deleteOption, fetchOptions, type SelectOption } from '../api/settingsApi'

export function useSelectOptions(section: string) {
  const { token } = useAuth()
  const [options, setOptions] = useState<SelectOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const reload = useCallback(() => {
    if (!token) return
    setIsLoading(true)
    fetchOptions(token, section)
      .then(setOptions)
      .finally(() => setIsLoading(false))
  }, [token, section])

  useEffect(() => {
    reload()
  }, [reload])

  const addOption = useCallback(
    async (field: string, label: string) => {
      if (!token) return
      const created = await createOption(token, section, field, label)
      setOptions((prev) => [...prev, created])
    },
    [token, section],
  )

  const removeOption = useCallback(
    async (id: number) => {
      if (!token) return
      setOptions((prev) => prev.filter((option) => option.id !== id))
      await deleteOption(token, id)
    },
    [token],
  )

  const byField = useCallback((field: string) => options.filter((option) => option.field === field), [options])

  return { options, isLoading, addOption, removeOption, byField }
}
