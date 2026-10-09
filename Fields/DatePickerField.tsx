'use client'

import React from 'react'
import { DatePicker } from 'rsuite'
import { cn } from '@/lib/utils'

interface DatePickerFieldProps {
  label?: string
  value?: string | Date
  onChange?: (value: Date | null) => void
  placeholder?: string
  format?: string
  includeTime?: boolean
  disabled?: boolean
  required?: boolean
  className?: string
  locale?: {
    sunday?: string
    monday?: string
    tuesday?: string
    wednesday?: string
    thursday?: string
    friday?: string
    saturday?: string
    ok?: string
    today?: string
    yesterday?: string
    hours?: string
    minutes?: string
    seconds?: string
  }
}

export function DatePickerField({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  format = 'yyyy-MM-dd',
  includeTime = false,
  disabled = false,
  required = false,
  className,
  locale
}: DatePickerFieldProps) {
  // Convert value to Date object for the DatePicker
  const dateValue = value ? new Date(value) : null

  const handleDateChange = (date: Date | null) => {
    onChange?.(date)
  }

  // Determine format based on includeTime
  const dateFormat = includeTime ? 'yyyy-MM-dd HH:mm:ss' : format

  // Default locale (English)
  const defaultLocale = {
    sunday: 'Su',
    monday: 'Mo',
    tuesday: 'Tu',
    wednesday: 'We',
    thursday: 'Th',
    friday: 'Fr',
    saturday: 'Sa',
    ok: 'OK',
    today: 'Today',
    hours: 'Hours',
    minutes: 'Minutes',
    seconds: 'Seconds'
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <DatePicker
        format={dateFormat}
        value={dateValue}
        onChange={handleDateChange}
        placeholder={placeholder}
        editable={false}
        disabled={disabled}
        locale={locale || defaultLocale}
        style={{ width: '100%' }}
      />
    </div>
  )
}
