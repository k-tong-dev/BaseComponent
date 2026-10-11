'use client'

/**
 * Base debug registry.
 *
 * A tiny module-level store: any Base component can publish a labelled value
 * ("view context", "resource config", …) and the DebugPanel renders them. The
 * store lives outside React so publishing a value re-renders only the panel,
 * never the app.
 *
 * Lives in components/Base on purpose — it is UI-framework plumbing, has no
 * dependency on the app's i18n layer, and is safe to mirror to the standalone
 * Base package.
 *
 * Values are only ever written from the browser (the publisher hook runs in a
 * `useEffect`), so the module-level store is never shared across requests
 * during SSR.
 */

export interface DebugEntry {
  section: string
  /** The raw value as published. */
  data: any
  /** A JSON-safe projection of `data` (functions/elements/circulars made safe). */
  preview: any
  /** Serialised `preview`, used for change detection. */
  json: string
  at: number
}

const entries = new Map<string, DebugEntry>()
const listeners = new Set<() => void>()
let snapshot: DebugEntry[] = []

function rebuild() {
  snapshot = Array.from(entries.values()).sort((a, b) => a.section.localeCompare(b.section))
  listeners.forEach((l) => l())
}

export function subscribeDebug(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Stable snapshot for `useSyncExternalStore`. */
export function getDebugSnapshot(): DebugEntry[] {
  return snapshot
}

/** Publish (or replace) a section. No-op on the server or when unchanged. */
export function publishDebug(section: string, data: any): void {
  if (typeof window === 'undefined') return

  const preview = toPreview(data)
  let json: string
  try {
    json = JSON.stringify(preview)
  } catch {
    json = String(preview)
  }

  const prev = entries.get(section)
  if (prev && prev.json === json) return

  entries.set(section, { section, data, preview, json, at: Date.now() })
  rebuild()
}

export function clearDebug(): void {
  if (entries.size === 0) return
  entries.clear()
  rebuild()
}

const isElement = (v: any): boolean =>
  v && typeof v === 'object' && typeof v.$$typeof === 'symbol'

/**
 * Turn any value into something `JSON.stringify` can render: functions become
 * `ƒ name()`, React elements a short tag, Dates ISO strings, Maps/Sets become
 * plain structures, and true cycles become `[Circular]`.
 */
export function toPreview(value: any, maxDepth = 6): any {
  const path = new WeakSet<object>()

  const walk = (v: any, depth: number): any => {
    if (v === null) return null
    const t = typeof v
    if (t === 'function') return `ƒ ${v.name || 'anonymous'}()`
    if (t !== 'object') return v
    if (depth > maxDepth) return '…'
    if (path.has(v)) return '[Circular]'
    if (isElement(v)) {
      const type = typeof v.type === 'string' ? v.type : v.type?.displayName || v.type?.name || 'Component'
      return `[ReactElement <${type}>]`
    }
    if (v instanceof Date) return v.toISOString()
    if (v instanceof Map) {
      const out: Record<string, any> = {}
      v.forEach((val, key) => {
        out[String(key)] = walk(val, depth + 1)
      })
      return out
    }
    if (v instanceof Set) return Array.from(v.values()).map((x) => walk(x, depth + 1))

    path.add(v)
    let out: any
    if (Array.isArray(v)) {
      out = v.map((x) => walk(x, depth + 1))
    } else {
      out = {}
      for (const key of Object.keys(v)) out[key] = walk(v[key], depth + 1)
    }
    path.delete(v)
    return out
  }

  return walk(value, 0)
}
