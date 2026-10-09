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

export function HtmlField({ config, value, onChange, error }: FieldProps) {
  const [focused, setFocused] = React.useState(false)
  const inputId = React.useId()
  const hasValue = value !== null && value !== undefined && value !== ''
  const floating = focused || hasValue

  return (
    <div className="w-full space-y-1">
      <div className="relative">
        <RsTextarea
          id={inputId}
          data-slot="html-input"
          classPrefix=""
          value={value || ''}
          placeholder={config.placeholder || 'Enter HTML content...'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(val: string) => onChange(val)}
          disabled={config.readonly}
          rows={8}
          autosize

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
            error && 'border-b-destructive',
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
              focused && (error ? 'text-destructive' : 'text-primary'),
              error && 'text-destructive',
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
      {value && (
        <div className="border rounded p-3 bg-muted/30 text-xs text-muted-foreground">
          <details>
            <summary className="cursor-pointer font-medium mb-1">Preview</summary>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: value }} />
          </details>
        </div>
      )}
      {(error || config.helper) && (
        <p className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>
          {error || config.helper}
        </p>
      )}
    </div>
  )
}
