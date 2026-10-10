'use client'

import * as React from 'react'
import { Toggle } from 'rsuite'
import { FieldLabel } from '../Label'
import type { FieldProps } from '../types'

export function BooleanField({ config, value, onChange, error }: FieldProps) {
  return (
    <div className="space-y-1">
      <FieldLabel label={config.label} required={config.required} error={!!error} />
      <div className="pt-0.5">
        <Toggle
          checked={value || false}
          onChange={(checked) => onChange(checked)}
          disabled={config.readonly}
          checkedChildren="ON"
          unCheckedChildren="OFF"
        />
      </div>
      {(error || config.helper) && (
        <p className="text-xs text-muted-foreground">{error || config.helper}</p>
      )}
    </div>
  )
}