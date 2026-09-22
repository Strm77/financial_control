import { useCallback, useEffect, useState } from 'react'
import { createOption, deleteOption, fetchOptions, type SelectOption } from '../api/settingsApi'

export function useSelectOptions(section: string) {
  const [options, setOptions] = useState<SelectOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const reload = useCallback(() => {
    setIsLoading(true)
    fetchOptions(section)
      .then(setOptions)
      .finally(() => setIsLoading(false))
  }, [section])

  useEffect(() => {
    reload()
  }, [reload])

  const addOption = useCallback(
    async (field: string, label: string) => {
      const created = await createOption(section, field, label)
      setOptions((prev) => [...prev, created])
    },
    [section],
  )

  const removeOption = useCallback(
    async (id: number) => {
      setOptions((prev) => prev.filter((option) => option.id !== id))
      await deleteOption(id)
    },
    [],
  )

  const byField = useCallback((field: string) => options.filter((option) => option.field === field), [options])

  return { options, isLoading, addOption, removeOption, byField }
}
