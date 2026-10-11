'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { Bug, Check, Copy, RefreshCw, Trash2, X } from 'lucide-react'
import { useDebug } from './DebugProvider'
import { clearDebug, getDebugSnapshot, subscribeDebug } from './registry'

interface DebugTab {
  key: string
  label: string
  /** Section names shown on this tab; `null` means "everything". */
  sections: string[] | null
}

/** Sections read live from the browser instead of the debug registry. */
const BROWSER_KEYS = ['cookies', 'localStorage', 'sessionStorage'] as const

const TABS: DebugTab[] = [
  { key: 'context', label: 'Context', sections: ['view-context', 'view-state'] },
  { key: 'config', label: 'Config', sections: ['resource-config'] },
  { key: 'data', label: 'Data', sections: ['data'] },
  { key: 'toolbar', label: 'Toolbar', sections: ['toolbar'] },
  { key: 'browser', label: 'Browser', sections: [...BROWSER_KEYS] },
  { key: 'all', label: 'All', sections: null },
]

const SECTION_LABELS: Record<string, string> = {
  'view-context': 'View context',
  'view-state': 'View state',
  'resource-config': 'Resource config',
  data: 'Data',
  toolbar: 'Toolbar',
  cookies: 'Cookies',
  localStorage: 'Local Storage',
  sessionStorage: 'Session Storage',
}

/** Clipboard write that cannot throw — falls back to a hidden textarea. */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    textarea.remove()
    return ok
  } catch {
    return false
  }
}

interface SectionData {
  section: string
  preview: any
  /** Optional one-line hint shown between the title and the JSON body. */
  note?: string
}

/** Read `document.cookie` into a name→value map (httpOnly cookies are hidden). */
function readCookies(): Record<string, string> {
  const out: Record<string, string> = {}
  try {
    const raw = document.cookie
    if (!raw) return out
    for (const part of raw.split(';')) {
      const eq = part.indexOf('=')
      const name = (eq === -1 ? part : part.slice(0, eq)).trim()
      if (!name) continue
      const value = eq === -1 ? '' : part.slice(eq + 1).trim()
      try {
        out[name] = decodeURIComponent(value)
      } catch {
        out[name] = value
      }
    }
  } catch {
    /* ignore */
  }
  return sortRecord(out)
}

/** Read a Web Storage object into a name→value map. */
function readStorage(getStore: () => Storage): Record<string, string> {
  const out: Record<string, string> = {}
  try {
    const store = getStore()
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i)
      if (key == null) continue
      out[key] = store.getItem(key) ?? ''
    }
  } catch {
    /* ignore (storage unavailable / blocked) */
  }
  return sortRecord(out)
}

function sortRecord(input: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const key of Object.keys(input).sort((a, b) => a.localeCompare(b))) out[key] = input[key]
  return out
}

interface BrowserSnapshot {
  cookies: Record<string, string>
  localStorage: Record<string, string>
  sessionStorage: Record<string, string>
}

function readBrowserSnapshot(): BrowserSnapshot {
  return {
    cookies: readCookies(),
    localStorage: readStorage(() => window.localStorage),
    sessionStorage: readStorage(() => window.sessionStorage),
  }
}

function Section({ section, preview, note }: SectionData) {
  const [copied, setCopied] = useState(false)
  const text = useMemo(() => {
    try {
      return JSON.stringify(preview, null, 2)
    } catch {
      return String(preview)
    }
  }, [preview])

  const onCopy = useCallback(async () => {
    const ok = await copyText(text)
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    }
  }, [text])

  return (
    <section className="mb-3">
      <header className="flex items-center justify-between gap-2 rounded-t-md bg-slate-800 px-2 py-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-200">
          {SECTION_LABELS[section] || section}
        </span>
        <button
          type="button"
          onClick={onCopy}
          title="Copy JSON"
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-slate-300 hover:bg-slate-700 hover:text-white"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </header>
      {note ? (
        <div className="border-x border-slate-700 bg-slate-900/70 px-2 py-1 text-[10px] leading-4 text-slate-400">
          {note}
        </div>
      ) : null}
      <pre className="max-h-[46vh] overflow-auto rounded-b-md border border-t-0 border-slate-700 bg-slate-900 p-2 text-[11px] leading-4 text-slate-100">
        {text}
      </pre>
    </section>
  )
}

/** localStorage key holding the floating button position (top-left, px). */
export const DEBUG_BUTTON_POS_KEY = 'base:debug:button-pos'

/** Button box in px — matches the `h-10 w-10` classes below. */
const BUTTON_SIZE = 40
/** Minimum gap kept between the button and the viewport edges. */
const EDGE_GAP = 8
/** Pointer travel (px) above which a press counts as a drag, not a click. */
const DRAG_THRESHOLD = 4

interface ButtonPos {
  x: number
  y: number
}

/** Keep the button fully inside the viewport. */
function clampPos(pos: ButtonPos): ButtonPos {
  if (typeof window === 'undefined') return pos
  const maxX = Math.max(EDGE_GAP, window.innerWidth - BUTTON_SIZE - EDGE_GAP)
  const maxY = Math.max(EDGE_GAP, window.innerHeight - BUTTON_SIZE - EDGE_GAP)
  return {
    x: Math.min(Math.max(pos.x, EDGE_GAP), maxX),
    y: Math.min(Math.max(pos.y, EDGE_GAP), maxY),
  }
}

function readStoredButtonPos(): ButtonPos | null {
  try {
    const raw = window.localStorage.getItem(DEBUG_BUTTON_POS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.x === 'number' && typeof parsed.y === 'number') {
      return clampPos(parsed)
    }
  } catch {
    /* ignore malformed / unavailable storage */
  }
  return null
}

/**
 * Floating debug toggle. Drag it anywhere on screen with the pointer; the
 * position is remembered in localStorage. A press that does not move still
 * toggles the panel, so click and keyboard activation behave as before.
 */
function DebugButton({ onActivate }: { onActivate: () => void }) {
  const [pos, setPos] = useState<ButtonPos | null>(null)
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
    moved: boolean
  } | null>(null)
  // Set when a drag finished, so the trailing `click` does not also toggle.
  const suppressClick = useRef(false)

  // Restore the saved position after mount (keeps SSR/hydration markup stable).
  useEffect(() => {
    setPos(readStoredButtonPos())
  }, [])

  // Keep the button on-screen when the window is resized.
  useEffect(() => {
    const onResize = () => setPos((current) => (current ? clampPos(current) : current))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    suppressClick.current = false
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: rect.left,
      originY: rect.top,
      moved: false,
    }
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      /* ignore */
    }
    setDragging(true)
  }, [])

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const state = drag.current
    if (!state || state.pointerId !== event.pointerId) return
    const dx = event.clientX - state.startX
    const dy = event.clientY - state.startY
    if (!state.moved && Math.hypot(dx, dy) >= DRAG_THRESHOLD) state.moved = true
    if (!state.moved) return
    setPos(clampPos({ x: state.originX + dx, y: state.originY + dy }))
  }, [])

  const endDrag = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const state = drag.current
    if (!state) return
    drag.current = null
    setDragging(false)
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      /* ignore */
    }
    if (!state.moved) return
    // A drag happened: swallow the trailing click (if any) and remember the new
    // position. The flag self-clears on the next task so a click that the browser
    // does *not* fire after a drag can never be swallowed later.
    suppressClick.current = true
    window.setTimeout(() => {
      suppressClick.current = false
    }, 0)
    setPos((current) => {
      if (current) {
        try {
          window.localStorage.setItem(DEBUG_BUTTON_POS_KEY, JSON.stringify(current))
        } catch {
          /* ignore */
        }
      }
      return current
    })
  }, [])

  const handleClick = useCallback(() => {
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    onActivate()
  }, [onActivate])

  return (
    <button
      type="button"
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      title="Drag to move · Click to open (Ctrl/⌘+Shift+D)"
      aria-label="Open debug mode"
      style={pos ? { left: pos.x, top: pos.y } : undefined}
      className={
        'fixed z-[9999] inline-flex h-10 w-10 touch-none select-none items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 shadow-lg transition-colors hover:bg-slate-800 ' +
        (dragging ? 'cursor-grabbing' : 'cursor-grab') +
        (pos ? '' : ' bottom-4 right-4')
      }
    >
      <Bug size={18} />
    </button>
  )
}

export function DebugPanel() {
  const { available, enabled, toggle } = useDebug()
  const entries = useSyncExternalStore(subscribeDebug, getDebugSnapshot, getDebugSnapshot)
  const [activeTab, setActiveTab] = useState('context')
  const [browser, setBrowser] = useState<BrowserSnapshot>({
    cookies: {},
    localStorage: {},
    sessionStorage: {},
  })
  const pathname = usePathname()

  const tab = useMemo(() => TABS.find((t) => t.key === activeTab) || TABS[0], [activeTab])

  const showBrowser = useMemo(
    () =>
      !tab.sections ||
      tab.sections.some((section) => (BROWSER_KEYS as readonly string[]).includes(section)),
    [tab],
  )

  const refreshBrowser = useCallback(() => {
    setBrowser(readBrowserSnapshot())
  }, [])

  // (Re)read cookies & storage when the panel opens or a tab that shows them is selected.
  useEffect(() => {
    if (enabled && showBrowser) refreshBrowser()
  }, [enabled, showBrowser, refreshBrowser])

  const visible = useMemo<SectionData[]>(() => {
    const registry = !tab.sections ? entries : entries.filter((entry) => tab.sections!.includes(entry.section))
    const out: SectionData[] = registry.map((entry) => ({ section: entry.section, preview: entry.preview }))
    if (showBrowser) {
      out.push({
        section: 'cookies',
        preview: browser.cookies,
        note: 'httpOnly cookies are not visible to JavaScript.',
      })
      out.push({ section: 'localStorage', preview: browser.localStorage })
      out.push({ section: 'sessionStorage', preview: browser.sessionStorage })
    }
    return out
  }, [entries, tab, showBrowser, browser])

  if (!available) return null

  if (!enabled) {
    return <DebugButton onActivate={toggle} />
  }

  const query = typeof window !== 'undefined' ? window.location.search : ''

  return (
    <div className="fixed inset-y-0 right-0 z-[9999] flex w-[440px] max-w-[100vw] flex-col border-l border-slate-700 bg-slate-950 text-slate-100 shadow-2xl">
      <header className="flex items-center justify-between gap-2 border-b border-slate-700 bg-slate-900 px-3 py-2">
        <div className="flex items-center gap-2">
          <Bug size={16} className="text-emerald-400" />
          <span className="text-sm font-semibold">Debug</span>
          <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
            {visible.length} section{visible.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {showBrowser ? (
            <button
              type="button"
              onClick={refreshBrowser}
              title="Refresh cookies & storage"
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <RefreshCw size={13} />
              Refresh
            </button>
          ) : null}
          <button
            type="button"
            onClick={clearDebug}
            title="Clear collected data"
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <Trash2 size={13} />
            Clear
          </button>
          <button
            type="button"
            onClick={toggle}
            title="Close (Ctrl/⌘+Shift+D)"
            className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <X size={15} />
          </button>
        </div>
      </header>

      <div className="border-b border-slate-700 bg-slate-900/60 px-3 py-1.5 text-[11px] text-slate-400">
        <span className="font-mono text-slate-300">{pathname}</span>
        <span className="font-mono">{query}</span>
      </div>

      <nav className="flex gap-1 border-b border-slate-700 bg-slate-900 px-2 py-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className={
              'rounded px-2 py-1 text-[11px] font-medium transition ' +
              (t.key === activeTab
                ? 'bg-emerald-500/20 text-emerald-200'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200')
            }
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-auto p-2">
        {visible.length === 0 ? (
          <p className="px-1 py-6 text-center text-xs text-slate-500">
            Nothing published on this tab yet.
          </p>
        ) : (
          visible.map((entry) => (
            <Section key={entry.section} section={entry.section} preview={entry.preview} note={entry.note} />
          ))
        )}
      </div>
    </div>
  )
}
