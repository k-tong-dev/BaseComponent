'use client'

import * as React from 'react'
import { DatePicker } from 'rsuite'
import { cn } from '@/lib/utils'
import { FieldLabel } from '../Label'
import type { FieldProps } from '../types'

export function MonthField({ config, value, onChange, error }: FieldProps) {
  const uid = React.useId()
  const [open, setOpen] = React.useState(false)
  const dateValue = value ? new Date(`${value}-01`) : null

  const handleChange = (d: Date | null) => {
    if (d) {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      onChange(`${y}-${m}`)
    } else {
      onChange(null)
    }
  }

  return (
    <div className={cn('w-full space-y-1', config.className)}>
      <FieldLabel label={config.label} required={config.required} error={!!error} />
      <div className="relative" id={uid}>
        <style>{`.rs-picker-input-group, .rs-input-group { border-top: 0 !important; border-right: 0 !important; border-left: 0 !important; border-radius: 0 !important; outline: none !important; box-shadow: none !important; }`}</style>
        <DatePicker
          format="yyyy-MM"
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
          locale={{
            sunday: 'Su', monday: 'Mo', tuesday: 'Tu', wednesday: 'We',
            thursday: 'Th', friday: 'Fr', saturday: 'Sa',
            ok: 'OK', today: 'Today', yesterday: 'Yesterday',
          }}
        />
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
