'use client'

import * as React from 'react'
import { Input as RsInput } from 'rsuite'
import { cn } from '@/lib/utils'
import { FieldLabel } from '../Label'
import type { FieldProps } from '../types'

const sizeStyles = {
  sm: { input: 'text-sm pb-0.5' },
  md: { input: 'text-sm pb-1' },
  lg: { input: 'text-base pb-1.5' },
}

export function StringField({ config, value, onChange, error }: FieldProps) {
  const [focused, setFocused] = React.useState(false)
  const inputId = React.useId()

  return (
    <div className="w-full space-y-1">
      <FieldLabel htmlFor={inputId} label={config.label} required={config.required} error={!!error} />
      <div className="relative">
        <RsInput
          id={inputId}
          data-slot="string-input"
          classPrefix=""
          value={value || ''}
          placeholder={config.placeholder || ' '}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(val: string) => onChange(val)}
          readOnly={config.readonly}
          disabled={config.disabled}
          style={{
            borderTop: '0',
            borderRight: '0',
            borderLeft: '0',
            borderRadius: '0',
            outlineColor: 'transparent',
            boxShadow: 'none',
          }}
          className={cn(
            'peer w-full border-b-1 border-b-foreground bg-transparent px-0 text-foreground transition-colors duration-200 rounded-none disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-b-destructive',
            sizeStyles[config.size || 'md'].input,
          )}

        />
        <div
          className={cn(
            'absolute bottom-0 left-1/2 h-px w-full -translate-x-1/2 bg-foreground transition-transform duration-200',
            focused ? 'scale-x-100' : 'scale-x-0',
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
