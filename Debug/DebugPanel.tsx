'use client'

import React, { useCallback, useMemo, useState, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { Bug, Check, Copy, Trash2, X } from 'lucide-react'
import { useDebug } from './DebugProvider'
import { clearDebug, getDebugSnapshot, subscribeDebug, type DebugEntry } from './registry'

interface DebugTab {
  key: string
  label: string
  /** Section names shown on this tab; `null` means "everything". */
  sections: string[] | null
}

const TABS: DebugTab[] = [
  { key: 'context', label: 'Context', sections: ['view-context', 'view-state'] },
  { key: 'config', label: 'Config', sections: ['resource-config'] },
  { key: 'data', label: 'Data', sections: ['data'] },
  { key: 'toolbar', label: 'Toolbar', sections: ['toolbar'] },
  { key: 'all', label: 'All', sections: null },
]

const SECTION_LABELS: Record<string, string> = {
  'view-context': 'View context',
  'view-state': 'View state',
  'resource-config': 'Resource config',
  data: 'Data',
  toolbar: 'Toolbar',
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

function pretty(entry: DebugEntry): string {
  try {
    return JSON.stringify(entry.preview, null, 2)
  } catch {
    return String(entry.preview)
  }
}

function Section({ entry }: { entry: DebugEntry }) {
  const [copied, setCopied] = useState(false)
  const text = pretty(entry)

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
          {SECTION_LABELS[entry.section] || entry.section}
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
      <pre className="max-h-[46vh] overflow-auto rounded-b-md border border-t-0 border-slate-700 bg-slate-900 p-2 text-[11px] leading-4 text-slate-100">
        {text}
      </pre>
    </section>
  )
}

export function DebugPanel() {
  const { available, enabled, toggle } = useDebug()
  const entries = useSyncExternalStore(subscribeDebug, getDebugSnapshot, getDebugSnapshot)
  const [activeTab, setActiveTab] = useState('context')
  const pathname = usePathname()

  const tab = useMemo(() => TABS.find((t) => t.key === activeTab) || TABS[0], [activeTab])

  const visible = useMemo(() => {
    if (!tab.sections) return entries
    return entries.filter((entry) => tab.sections!.includes(entry.section))
  }, [entries, tab])

  if (!available) return null

  if (!enabled) {
    return (
      <button
        type="button"
        onClick={toggle}
        title="Open debug mode (Ctrl/⌘+Shift+D)"
        aria-label="Open debug mode"
        className="fixed bottom-4 right-4 z-[9999] inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 shadow-lg transition hover:bg-slate-800"
      >
        <Bug size={18} />
      </button>
    )
  }

  const query = typeof window !== 'undefined' ? window.location.search : ''

  return (
    <div className="fixed inset-y-0 right-0 z-[9999] flex w-[440px] max-w-[100vw] flex-col border-l border-slate-700 bg-slate-950 text-slate-100 shadow-2xl">
      <header className="flex items-center justify-between gap-2 border-b border-slate-700 bg-slate-900 px-3 py-2">
        <div className="flex items-center gap-2">
          <Bug size={16} className="text-emerald-400" />
          <span className="text-sm font-semibold">Debug</span>
          <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
            {entries.length} section{entries.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="flex items-center gap-1">
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
          visible.map((entry) => <Section key={entry.section} entry={entry} />)
        )}
      </div>
    </div>
  )
}
