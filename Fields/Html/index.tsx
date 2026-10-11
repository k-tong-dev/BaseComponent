'use client'

import * as React from 'react'
import { Textarea as RsTextarea } from 'rsuite'
import { cn } from '@/lib/utils'
import { FieldLabel } from '../Label'
import type { FieldProps } from '../types'

const sizeStyles = {
  sm: { input: 'text-sm' },
  md: { input: 'text-sm' },
  lg: { input: 'text-base' },
}

export function HtmlField({ config, value, onChange, error }: FieldProps) {
  const [focused, setFocused] = React.useState(false)
  const inputId = React.useId()

  return (
    <div className="w-full space-y-1">
      <FieldLabel htmlFor={inputId} label={config.label} required={config.required} error={!!error} />
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
          readOnly={config.readonly}
          disabled={config.disabled}
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
            'peer w-full resize-y border-0 border-b-1 border-b-foreground bg-transparent px-0 text-foreground transition-colors duration-200 rounded-none font-mono text-sm',
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
