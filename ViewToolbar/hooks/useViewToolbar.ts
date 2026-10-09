'use client'

import { useState, useCallback } from 'react'
import { useViewPresets, type ViewPreset } from './useViewPresets'
import type { FilterValue } from '@/components/Base/ViewToolbar/Filter'
import type { SearchValue } from '@/components/Base/Search'

export interface ViewToolbarOptions {
  userId: string
  pathname: string
}

export function useViewToolbar({ userId, pathname }: ViewToolbarOptions) {
  const [searchValues, setSearchValues] = useState<SearchValue[]>([])
  const [filterValues, setFilterValues] = useState<FilterValue[]>([])
  const [groupByField, setGroupByField] = useState<string | null>(null)
  const [showSavePreset, setShowSavePreset] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [showFilterPanel, setShowFilterPanel] = useState(false)

  const { presets, savePreset, deletePreset, loadPreset } = useViewPresets(userId, pathname)

  const handleSavePreset = useCallback((viewType: string) => {
    if (presetName.trim()) {
      savePreset(presetName.trim(), viewType, searchValues, filterValues, groupByField)
      setShowSavePreset(false)
      setPresetName('')
    }
  }, [presetName, savePreset, searchValues, filterValues, groupByField])

  const handleLoadPreset = useCallback((preset: ViewPreset) => {
    setSearchValues(preset.searchValues)
    setFilterValues(preset.filterValues)
    setGroupByField(preset.groupByField)
    return preset.viewType
  }, [])

  const resetAll = useCallback(() => {
    setSearchValues([])
    setFilterValues([])
    setGroupByField(null)
  }, [])

  return {
    searchValues,
    setSearchValues,
    filterValues,
    setFilterValues,
    groupByField,
    setGroupByField,
    showSavePreset,
    setShowSavePreset,
    presetName,
    setPresetName,
    showFilterPanel,
    setShowFilterPanel,
    presets,
    savePreset,
    deletePreset,
    loadPreset,
    handleSavePreset,
    handleLoadPreset,
    resetAll,
  }
}

export type UseViewToolbarReturn = ReturnType<typeof useViewToolbar>
