'use client'

import * as React from 'react'
import { Textarea as RsTextarea } from 'rsuite'
import { cn } from '@/lib/utils'
import type { FieldProps } from '../types'

const sizeStyles = {
  sm: { input: 'text-sm', label: 'text-xs peer-placeholder-shown:text-sm' },
  md: { input: 'text-sm', label: 'text-sm peer-placeholder-shown:text-base' },
  lg: { input: 'text-base', label: 'text-base peer-placeholder-shown:text-lg' },
}

export function JsonField({ config, value, onChange, error }: FieldProps) {
  const [focused, setFocused] = React.useState(false)
  const [text, setText] = React.useState(() =>
    value ? JSON.stringify(value, null, 2) : ''
  )
  const [parseError, setParseError] = React.useState<string | null>(null)
  const inputId = React.useId()
  const hasValue = text !== ''
  const floating = focused || hasValue

  React.useEffect(() => {
    setText(value ? JSON.stringify(value, null, 2) : '')
  }, [value])

  const handleChange = (raw: string) => {
    setText(raw)
    if (!raw.trim()) {
      setParseError(null)
      onChange(null)
      return
    }
    try {
      const parsed = JSON.parse(raw)
      setParseError(null)
      onChange(parsed)
    } catch {
      setParseError('Invalid JSON')
    }
  }

  return (
    <div className="w-full space-y-1">
      <div className="relative">
        <RsTextarea
          id={inputId}
          data-slot="json-input"
          classPrefix=""
          value={text}
          placeholder={config.placeholder || 'Enter JSON...'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={handleChange}
          disabled={config.readonly}
          rows={8}
          style={{
            borderTop: '0',
            borderRight: '0',
            borderLeft: '0',
            borderRadius: '0',
            outlineColor: 'transparent',
            boxShadow: 'none',
          }}
          className={cn(
            'peer w-full resize-y border-0 border-b-1 border-b-foreground bg-transparent px-0 text-foreground transition-colors duration-200 rounded-none font-mono text-sm disabled:cursor-not-allowed disabled:opacity-50',
            (error || parseError) && 'border-b-destructive',
            sizeStyles[config.size || 'md'].input,
          )}

        />
        {config.label && (
          <label
            htmlFor={inputId}
            className={cn(
              'absolute left-0 z-10 origin-[0] text-muted-foreground duration-200 pointer-events-none',
              floating
                ? '-translate-y-3 scale-75'
                : 'translate-y-0 scale-100',
              focused && ((error || parseError) ? 'text-destructive' : 'text-primary'),
              (error || parseError) && 'text-destructive',
              sizeStyles[config.size || 'md'].label,
            )}
          >
            {config.label}
          </label>
        )}
        <div
          className={cn(
            'absolute bottom-0 left-1/2 h-px w-full -translate-x-1/2 bg-foreground transition-transform duration-200',
            focused ? 'scale-x-100' : 'scale-x-0',
          )}
        />
      </div>
      {(parseError || error || config.helper) && (
        <p className={cn('text-xs', (error || parseError) ? 'text-destructive' : 'text-muted-foreground')}>
          {parseError || error || config.helper}
        </p>
      )}
    </div>
  )
}
