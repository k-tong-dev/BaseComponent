'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Fixed label rendered ABOVE a field control (Odoo/FormView style).
 *
 * Unlike a floating label it can never overlap the value text of the input,
 * picker or textarea below it.
 */
export interface FieldLabelProps {
  htmlFor?: string
  label?: string
  required?: boolean
  error?: boolean
  description?: string
  className?: string
  children?: React.ReactNode
}

export function FieldLabel({ htmlFor, label, required, error, description, className, children }: FieldLabelProps) {
  if (!label && !children) return null
  return (
    <div className={cn('mb-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className={cn(
          'block text-xs font-medium text-foreground/70',
          error && 'text-destructive',
        )}
      >
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
        {children}
      </label>
      {description && !error && (
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  )
}