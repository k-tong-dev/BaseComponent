'use client'

import * as React from 'react'
import { TagPicker, Avatar } from 'rsuite'
import { cn } from '@/lib/utils'
import type { FieldProps } from '../types'

const PICKER_STYLE = {
  borderTop: 0,
  borderRight: 0,
  borderLeft: 0,
  borderBottom: 0,
  borderRadius: 0,
  outlineColor: 'transparent',
  boxShadow: 'none',
}

const SIZE = { sm: 'top-3 text-xs', md: 'top-4 text-sm', lg: 'top-5 text-base' }

export function Many2ManyField({ config, value, onChange, error }: FieldProps) {
  const [open, setOpen] = React.useState(false)
  const [options, setOptions] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)

  const selectedIds = React.useMemo(() => {
    if (!Array.isArray(value)) return []
    return value.map((v: any) => {
      if (typeof v === 'string') return v
      return v.id || v.value_id || v.key
    }).filter(Boolean)
  }, [value])

  const hasValue = selectedIds.length > 0
  const floating = open || hasValue

  // Seed initial options from value objects (API returns full relation data)
  React.useEffect(() => {
    if (Array.isArray(value)) {
      const valueOptions = value
        .filter((v: any) => typeof v !== 'string' && (v.name || v.label))
        .map((v: any) => ({
          id: v.id || v.value_id,
          name: v.name || v.label,
          avatar: v.avatar || v.image || v.thumbnail,
        }))
        .filter((v: any) => v.id)
      if (valueOptions.length > 0) {
        setOptions(prev => {
          const existing = new Set(prev.map((o: any) => o.id))
          const newOnes = valueOptions.filter((v: any) => !existing.has(v.id))
          return newOnes.length > 0 ? [...prev, ...newOnes] : prev
        })
      }
    }
  }, [value])

  const fetchOptions = React.useCallback(async (search?: string) => {
    if (!config.fetchUrl) return
    setLoading(true)
    try {
      const url = search ? `${config.fetchUrl}?search=${encodeURIComponent(search)}` : config.fetchUrl
      const res = await fetch(url)
      const data = await res.json()
      const items = Array.isArray(data) ? data : data.data || data.records || data.items || []
      setOptions(prev => {
        const existing = new Set(prev.map((o: any) => o.id))
        const newOnes = items.filter((i: any) => !existing.has(i.id))
        return newOnes.length > 0 ? [...prev, ...newOnes] : prev
      })
    } catch (e) {
      console.error('[Many2ManyField] fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [config.fetchUrl])

  React.useEffect(() => { fetchOptions() }, [fetchOptions])

  const pickerData = options.map((item: any) => ({
    label: item.avatar
      ? <div className="flex items-center gap-2"><Avatar src={item.avatar} size="xs" circle /><span>{item.name}</span></div>
      : item.name || item.id,
    value: String(item.id),
    item,
  }))

  return (
    <div className="w-full space-y-1">
      <div className="relative">
        <style>{`.rs-picker-toggle { border-top: 0 !important; border-right: 0 !important; border-left: 0 !important; border-bottom: 0 !important; border-radius: 0 !important; outline: none !important; box-shadow: none !important; } .rs-picker-tag-wrapper { min-height: unset !important; padding-top: 0 !important; padding-bottom: 2px !important; } .rs-picker-textbox { margin-top: 0 !important; } .rs-picker-toggle-wrapper { display: block !important; } .rs-picker-menu { max-height: 240px !important; }`}</style>
        <div className={cn(
          'w-full bg-transparent text-foreground rounded-none disabled:cursor-not-allowed disabled:opacity-50 border-b-1',
          error ? 'border-destructive' : 'border-border',
          config.size === 'sm' ? 'text-sm' : config.size === 'lg' ? 'text-base' : 'text-sm',
        )}>
          <TagPicker
            data={pickerData}
            value={selectedIds}
            onChange={(next) => onChange(next)}
            creatable={false}
            onCreate={(value, item) => {
              setOptions(prev => [...prev, { id: value, name: value, ...item }])
              onChange([...selectedIds, value])
            }}
            searchable
            block
            loading={loading}
            placeholder={config.placeholder || ' '}
            disabled={config.readonly}
            onSearch={(kw) => { if (kw.length >= 1) fetchOptions(kw) }}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            renderValue={(value, items, tags) => {
              return <div className="flex flex-wrap gap-0.5 py-0.5">{tags}</div>
            }}
            tagProps={{ color: 'violet', closable: !config.readonly, size: 'sm' }}
            style={PICKER_STYLE}
            size={config.size || 'md'}
            cleanable={true}
            preventOverflow
            placement={"auto"}
          />
        </div>
        {config.label && (
          <label className={cn(
            'absolute left-0 z-10 origin-[0] text-muted-foreground duration-200 pointer-events-none',
            floating ? '-translate-y-3 scale-75' : 'translate-y-0 scale-100',
            error ? 'text-destructive' : floating ? 'text-primary' : 'text-muted-foreground',
            SIZE[config.size || 'md'],
          )}>
            {config.label}
          </label>
        )}
        <div className={cn(
          'absolute bottom-0 left-1/2 h-px w-full -translate-x-1/2 scale-x-0 bg-foreground transition-transform duration-200',
          open && 'scale-x-100',
          error && 'bg-destructive',
        )} />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {config.helper && !error && <p className="text-xs text-muted-foreground">{config.helper}</p>}
    </div>
  )
}
