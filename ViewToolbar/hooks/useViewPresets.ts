'use client'

import { useState, useCallback, useEffect } from 'react'

export interface ViewPreset {
  id: string
  name: string
  viewType: string
  searchValues: any[]
  filterValues: any[]
  groupByField: string | null
  createdAt: string
}

const STORAGE_KEY = 'viewPresets'

function loadAllPresets(userId: string, pathname: string): ViewPreset[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${userId}_${pathname}`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveAllPresets(userId: string, pathname: string, presets: ViewPreset[]) {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${userId}_${pathname}`, JSON.stringify(presets))
  } catch {}
}

export function useViewPresets(userId: string, pathname: string) {
  const [presets, setPresets] = useState<ViewPreset[]>([])

  useEffect(() => {
    setPresets(loadAllPresets(userId, pathname))
  }, [userId, pathname])

  const savePreset = useCallback(
    (name: string, viewType: string, searchValues: any[], filterValues: any[], groupByField: string | null) => {
      const newPreset: ViewPreset = {
        id: Date.now().toString(36),
        name,
        viewType,
        searchValues,
        filterValues,
        groupByField,
        createdAt: new Date().toISOString(),
      }
      const updated = [...presets, newPreset]
      setPresets(updated)
      saveAllPresets(userId, pathname, updated)
      return newPreset
    },
    [presets, userId, pathname]
  )

  const deletePreset = useCallback(
    (id: string) => {
      const updated = presets.filter((p) => p.id !== id)
      setPresets(updated)
      saveAllPresets(userId, pathname, updated)
    },
    [presets, userId, pathname]
  )

  const loadPreset = useCallback(
    (id: string) => {
      return presets.find((p) => p.id === id) || null
    },
    [presets]
  )

  return { presets, savePreset, deletePreset, loadPreset }
}
