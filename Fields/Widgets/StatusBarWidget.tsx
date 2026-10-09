'use client'

import * as React from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslate } from '../../i18n'

/**
 * Odoo-style status bar widget (`widget: 'statusbar'`).
 *
 * Renders a selection field as a row of clickable stage buttons instead of a
 * dropdown — the same mental model as Odoo's `statusbar` / state buttons.
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
 * action buttons to the right — red when selected. Clicking a stage updates the
 * field value through the normal form change/save flow.
 */

interface StatusOption {
  label: string
  value: any
}

export const StatusBarWidget: React.FC<any> = ({ value, onChange, field, readonly, disabled }: any) => {
  const translate = useTranslate()
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
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center overflow-hidden rounded-lg border border-border bg-background">
        {ordered.map((opt, i) => {
          const done = i <= currentIndex
          const active = i === currentIndex
          const isCurrent = String(opt.value) === String(value)
          return (
            <React.Fragment key={`${opt.value}`}>
              {i > 0 && <ChevronRight size={14} className="shrink-0 text-muted-foreground/60" />}
              <button
                type="button"
                aria-pressed={isCurrent}
                disabled={isReadonly}
                onClick={() => pick(opt.value)}
                className={cn(
                  'px-3.5 py-2 text-xs font-semibold transition-colors',
                  !isReadonly && 'cursor-pointer hover:brightness-105',
                  done
                    ? 'bg-gradient-to-r from-primary to-violet-500 text-primary-foreground'
                    : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
                  active && 'ring-1 ring-inset ring-primary/40',
                )}
              >
                {translate(opt.label)}
              </button>
            </React.Fragment>
          )
        })}
      </div>

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
              'rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors',
              !isReadonly && 'cursor-pointer',
              isCurrent
                ? 'border-red-500 bg-red-500 text-white'
                : 'border-border bg-background text-muted-foreground hover:border-red-300 hover:text-red-600',
            )}
          >
            {translate(opt.label)}
          </button>
        )
      })}
    </div>
  )
}

;(StatusBarWidget as any).widgetName = 'statusbar'

export default StatusBarWidget