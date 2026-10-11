'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { clearDebug, publishDebug } from './registry'

/** localStorage key holding the persisted on/off state. */
export const DEBUG_STORAGE_KEY = 'base:debug'

export interface DebugContextValue {
  /** Debug tooling is present in this build. */
  available: boolean
  /** The user has switched debug mode on. */
  enabled: boolean
  toggle: () => void
  setEnabled: (value: boolean) => void
}

const DebugContext = createContext<DebugContextValue>({
  available: false,
  enabled: false,
  toggle: () => {},
  setEnabled: () => {},
})

/**
 * Is the debug tooling available? Off in production builds unless it is
 * explicitly opted in with `NEXT_PUBLIC_DEBUG=true`.
 */
function computeAvailable(): boolean {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') return true
  return process.env?.NEXT_PUBLIC_DEBUG === 'true'
}

/**
 * Base debug mode provider.
 *
 * Mount once near the app root. It owns the on/off state (persisted in
 * localStorage, seeded from `?debug=1` / `?debug=0` and toggled with
 * `Ctrl/Cmd+Shift+D`) and exposes it to `useDebugValue`, which Base components
 * use to publish their state to the DebugPanel.
 */
export function DebugProvider({ children }: { children: React.ReactNode }) {
  const available = useMemo(computeAvailable, [])
  const [enabled, setEnabledState] = useState(false)

  // Hydrate the on/off state on the client (URL flag wins, then localStorage).
  useEffect(() => {
    if (!available) return
    const params = new URLSearchParams(window.location.search)
    const flag = params.get('debug')
    let next: boolean | null = null
    if (flag === '1' || flag === 'true') next = true
    else if (flag === '0' || flag === 'false') next = false
    if (next === null) {
      try {
        next = window.localStorage.getItem(DEBUG_STORAGE_KEY) === '1'
      } catch {
        next = false
      }
    }
    setEnabledState(next)
  }, [available])

  // Keyboard shortcut: Ctrl/Cmd + Shift + D.
  useEffect(() => {
    if (!available) return
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && (event.key === 'D' || event.key === 'd')) {
        event.preventDefault()
        setEnabledState((prev) => {
          const next = !prev
          try {
            window.localStorage.setItem(DEBUG_STORAGE_KEY, next ? '1' : '0')
          } catch {
            /* ignore */
          }
          return next
        })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [available])

  // Drop collected values when debug mode is switched off.
  useEffect(() => {
    if (!enabled) clearDebug()
  }, [enabled])

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value)
    try {
      window.localStorage.setItem(DEBUG_STORAGE_KEY, value ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [])

  const toggle = useCallback(() => {
    setEnabledState((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(DEBUG_STORAGE_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  const value = useMemo<DebugContextValue>(
    () => ({ available, enabled, toggle, setEnabled }),
    [available, enabled, toggle, setEnabled],
  )

  return <DebugContext.Provider value={value}>{children}</DebugContext.Provider>
}

/** Read the current debug state. Safe to call without a provider (returns off). */
export function useDebug(): DebugContextValue {
  return useContext(DebugContext)
}

/**
 * Publish a labelled value to the DebugPanel while debug mode is on.
 *
 * Call it unconditionally (it is a no-op when debug is off) with the exact
 * object you want inspected:
 *
 * ```ts
 * useDebugValue('view-context', viewContext)
 * ```
 *
 * The effect intentionally runs after every render so the panel tracks live
 * state; `publishDebug` skips the update when the value has not changed.
 */
export function useDebugValue(section: string, data: any): void {
  const { enabled } = useContext(DebugContext)
  useEffect(() => {
    if (enabled) publishDebug(section, data)
  })
}
