'use client'

import * as React from 'react'
import { DatePicker } from 'rsuite'
import { cn } from '@/lib/utils'
import type { FieldProps } from '../types'

export function TimeField({ config, value, onChange, error }: FieldProps) {
  const uid = React.useId()
  const [open, setOpen] = React.useState(false)
  const dateValue = value ? new Date(`2000-01-01T${value}`) : null
  const hasValue = dateValue !== null
  const floating = open || hasValue

  const handleChange = (d: Date | null) => {
    if (d) {
      const h = String(d.getHours()).padStart(2, '0')
      const m = String(d.getMinutes()).padStart(2, '0')
      const s = String(d.getSeconds()).padStart(2, '0')
      onChange(`${h}:${m}:${s}`)
    } else {
      onChange(null)
    }
  }

  return (
    <div className={cn('w-full space-y-1', config.className)}>
      <div className="relative" id={uid}>
        <style>{`.rs-picker-input-group, .rs-input-group { border-top: 0 !important; border-right: 0 !important; border-left: 0 !important; border-radius: 0 !important; outline: none !important; box-shadow: none !important; }`}</style>
        <DatePicker
          format="HH:mm:ss"
          value={dateValue}
          onChange={handleChange}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          placeholder={config.placeholder || ' '}
          editable={false}
          preventOverflow
          disabled={config.readonly}
          className={cn(
            'w-full bg-transparent border-b-1 border-b-foreground text-foreground rounded-none disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-destructive' : 'border-border',
            config.size === 'sm' ? 'text-sm' : config.size === 'lg' ? 'text-base' : 'text-sm',
          )}
          style={{
            borderTop: 0, borderRight: 0, borderLeft: 0, borderBottom: 0,
            borderRadius: 0, outlineColor: 'transparent', boxShadow: 'none',
          }}
          locale={{ ok: 'OK', hours: 'Hours', minutes: 'Minutes', seconds: 'Seconds' }}
        />
        {config.label && (
          <label
            htmlFor={uid}
            className={cn(
              'absolute left-0 z-10 origin-[0] text-muted-foreground duration-200',
              floating ? '-translate-y-3 scale-75' : 'translate-y-0 scale-100',
              error
                ? 'text-destructive'
                : floating
                ? 'text-primary'
                : 'text-muted-foreground',
              config.size === 'sm'
                ? 'top-3 text-xs'
                : config.size === 'lg'
                ? 'top-5 text-base'
                : 'top-4 text-sm',
            )}
          >
            {config.label}
          </label>
        )}
        <div
          className={cn(
            'absolute bottom-0 left-1/2 h-px w-full -translate-x-1/2 scale-x-0 bg-foreground transition-transform duration-200',
            open && 'scale-x-100',
            error && 'bg-destructive',
          )}
        />
      </div>
      {(error || config.helper) && (
        <p className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>
          {error || config.helper}
        </p>
      )}
    </div>
  )
}
