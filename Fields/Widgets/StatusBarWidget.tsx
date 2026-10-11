'use client'

import * as React from 'react'
import { Ban, Check, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslate } from '../../i18n'

/**
 * Odoo-style status bar widget (`widget: 'statusbar'`).
 *
 * Renders a selection field as a row of clickable stage buttons instead of a
 * dropdown — the same mental model as Odoo's `statusbar` / state buttons.
 * Completed stages show a check, the current stage is filled with the primary
 * gradient, and upcoming stages are muted.
 *
 * Config (`field.widgetConfig`):
 *
 * {
 *   // Ordered stage values rendered as one connected statusbar.
 *   stages?: string[],
 *   // Optional override for the "extra" buttons (not part of the progress).
 *   // Defaults to every option NOT listed in `stages`.
 *   extras?: string[],
 * }
 *
 * Options not listed in `stages` (e.g. `cancelled`) are rendered as separate
 * outline action buttons — red when selected / hovered. Clicking a stage
 * updates the field value through the normal form change/save flow.
 */

interface StatusOption {
  label: string
  value: any
}

export const StatusBarWidget: React.FC<any> = ({ value, onChange, field, readonly, disabled }: any) => {
  const translate = useTranslate()
  // Readonly blocks state transitions (the form drives the status through its
  // state-action buttons) but keeps the normal look. Disabled additionally
  // mutes the control.
  const isReadonly = Boolean(readonly || disabled)

  const options: StatusOption[] = Array.isArray(field?.options) ? field.options : []
  if (options.length === 0) return null

  const stagesConfig: unknown[] = Array.isArray(field?.widgetConfig?.stages)
    ? field.widgetConfig.stages
    : []
  const extrasConfig: unknown[] = Array.isArray(field?.widgetConfig?.extras)
    ? field.widgetConfig.extras
    : []

  const stageValues = stagesConfig.length
    ? stagesConfig.map(String)
    : options.map((o) => String(o.value))

  const extras: StatusOption[] = extrasConfig.length
    ? options.filter((o) => extrasConfig.map(String).includes(String(o.value)))
    : options.filter((o) => !stageValues.includes(String(o.value)))

  const ordered: StatusOption[] = stageValues
    .map((v) => options.find((o) => String(o.value) === v))
    .filter((o): o is StatusOption => Boolean(o))

  const currentIndex = ordered.findIndex((o) => String(o.value) === String(value))

  const pick = (next: any) => {
    if (isReadonly) return
    onChange(next)
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2.5', disabled && 'pointer-events-none opacity-50')}>
      {/* ── Stages track ─────────────────────────────────────────────── */}
      <div className="inline-flex items-center rounded-xl border border-border bg-muted/40 p-1 shadow-sm">
        {ordered.map((opt, i) => {
          const isCurrent = String(opt.value) === String(value)
          const done = currentIndex >= 0 && i < currentIndex
          return (
            <React.Fragment key={`${opt.value}`}>
              {i > 0 && (
                <ChevronRight
                  size={13}
                  strokeWidth={2.5}
                  className={cn(
                    'mx-0.5 shrink-0 transition-colors',
                    done ? 'text-primary' : 'text-muted-foreground/40',
                  )}
                />
              )}
              <button
                type="button"
                aria-pressed={isCurrent}
                disabled={isReadonly}
                onClick={() => pick(opt.value)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all duration-200',
                  !isReadonly && 'cursor-pointer',
                  isCurrent
                    ? 'bg-gradient-to-r from-primary to-violet-500 text-white shadow-md shadow-primary/30'
                    : done
                      ? 'bg-primary/10 text-primary hover:bg-primary/20'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {done && !isCurrent && <Check size={13} strokeWidth={3} className="shrink-0" />}
                <span>{translate(opt.label)}</span>
              </button>
            </React.Fragment>
          )
        })}
      </div>

      {/* ── Extra actions (e.g. Cancelled) ──────────────────────────── */}
      {extras.map((opt) => {
        const isCurrent = String(opt.value) === String(value)
        return (
          <button
            key={`extra-${opt.value}`}
            type="button"
            aria-pressed={isCurrent}
            disabled={isReadonly}
            onClick={() => pick(opt.value)}
            className={cn(
              'flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all duration-200',
              !isReadonly && 'cursor-pointer',
              isCurrent
                ? 'border-red-500 bg-red-500/10 text-red-600 shadow-sm shadow-red-500/20'
                : 'border-border bg-background text-muted-foreground hover:border-red-400 hover:bg-red-50 hover:text-red-600',
            )}
          >
            <Ban size={13} className="shrink-0" />
            <span>{translate(opt.label)}</span>
          </button>
        )
      })}
    </div>
  )
}

;(StatusBarWidget as any).widgetName = 'statusbar'

export default StatusBarWidget
