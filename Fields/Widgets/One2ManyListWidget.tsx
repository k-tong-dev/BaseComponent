'use client'

import * as React from 'react'
import { SelectPicker, IconButton, Input, NumberInput, Checkbox, DatePicker } from 'rsuite'
import { Plus, Trash2 } from 'lucide-react'

/**
 * Generic inline editable One2Many list widget (`one2many_list`).
 *
 * Config is provided through `field.widgetConfig`:
 *
 * {
 *   allowCreate?: boolean,
 *   allowDelete?: boolean,
 *   columns: [
 *     { key: 'partner_id', title: 'Partner', type: 'many2one', relation: '/api/dashboard/partners', labelKey: 'partner_name' },
 *     { key: 'amount',     title: 'Amount',  type: 'number' },
 *     { key: 'done',       title: 'Done',    type: 'boolean' },
 *     { key: 'state',      title: 'State',   type: 'select', options: [{ label: 'New', value: 'new' }] },
 *     { key: 'due_date',   title: 'Due',     type: 'date' },
 *   ],
 * }
 */

export interface One2ManyListColumn {
  key: string
  title: string
  type?: 'string' | 'number' | 'boolean' | 'select' | 'many2one' | 'date'
  width?: number
  editable?: boolean
  required?: boolean
  options?: Array<{ label: any; value: any }>
  /** Endpoint for `many2one` options (alias: fetchUrl). */
  relation?: string
  fetchUrl?: string
  displayField?: string
  valueField?: string
  /** When set, the selected option label is also stored on this row key (e.g. denormalized name). */
  labelKey?: string
  placeholder?: string
}

export interface One2ManyListConfig {
  columns: One2ManyListColumn[]
  allowCreate?: boolean
  allowDelete?: boolean
  /** Child records endpoint / inverse FK (informational; persistence is handled by the parent form's API). */
  relation?: string
  inverseField?: string
}

function defaultValueFor(col: One2ManyListColumn) {
  switch (col.type) {
    case 'boolean':
      return false
    case 'number':
      return 0
    default:
      return ''
  }
}

function displayValue(col: One2ManyListColumn, value: any, options: Array<{ label: any; value: any }>) {
  if (value === undefined || value === null || value === '') return '-'
  if (col.type === 'boolean') return value ? 'Yes' : 'No'
  if (col.type === 'many2one' || col.type === 'select') {
    const opts = col.type === 'select' ? col.options || [] : options
    return opts.find((o) => o.value === value)?.label ?? value
  }
  return String(value)
}

export const One2ManyListWidget: React.FC<any> = ({ value, onChange, field, readonly, disabled }: any) => {
  const config: One2ManyListConfig = field?.widgetConfig || {}
  const columns = React.useMemo(
    () => (Array.isArray(config.columns) ? config.columns : []),
    [config.columns]
  )
  const rows: any[] = React.useMemo(() => (Array.isArray(value) ? value : []), [value])

  const isReadonly = Boolean(readonly || disabled)
  const allowCreate = config.allowCreate !== false && !isReadonly
  const allowDelete = config.allowDelete !== false && !isReadonly

  // Preload options for every many2one column (keyed by column key)
  const m2oKey = columns
    .filter((c) => c.type === 'many2one')
    .map((c) => `${c.key}|${c.relation || c.fetchUrl || ''}|${c.displayField || 'name'}|${c.valueField || 'id'}`)
    .join(';')
  const [m2oOptions, setM2oOptions] = React.useState<Record<string, Array<{ label: any; value: any }>>>({})

  React.useEffect(() => {
    let cancelled = false
    const load = async () => {
      const next: Record<string, Array<{ label: any; value: any }>> = {}
      for (const col of columns) {
        if (col.type !== 'many2one') continue
        const url = col.relation || col.fetchUrl
        if (!url) continue
        try {
          const list = await (await fetch(url)).json()
          next[col.key] = (Array.isArray(list) ? list : []).map((it: any) => ({
            label: it[col.displayField || 'name'],
            value: it[col.valueField || 'id'],
          }))
        } catch {
          next[col.key] = []
        }
      }
      if (!cancelled) setM2oOptions(next)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [m2oKey])

  if (columns.length === 0) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm font-medium text-destructive">One2ManyListWidget configuration error</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Provide <code>widgetConfig.columns</code>, e.g.{' '}
          <code>{`{ columns: [{ key: 'name', title: 'Name', type: 'string' }] }`}</code>.
        </p>
      </div>
    )
  }

  const setRows = (next: any[]) => onChange(next)
  const updateRow = (idx: number, patch: Record<string, any>) =>
    setRows(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  const addRow = () =>
    setRows([
      ...rows,
      {
        _isNew: true,
        ...columns.reduce((acc, col) => ({ ...acc, [col.key]: defaultValueFor(col) }), {} as any),
      },
    ])
  const removeRow = (idx: number) => setRows(rows.filter((_, i) => i !== idx))

  const renderCell = (col: One2ManyListColumn, row: any, idx: number) => {
    const v = row[col.key]
    if (isReadonly || col.editable === false) {
      return <span className="text-xs">{displayValue(col, v, m2oOptions[col.key] || [])}</span>
    }
    switch (col.type) {
      case 'boolean':
        return (
          <Checkbox
            checked={!!v}
            disabled={isReadonly}
            onChange={(_val: any, checked: boolean) => updateRow(idx, { [col.key]: checked })}
          />
        )
      case 'number':
        return (
          <NumberInput
            size="sm"
            value={v === '' || v === undefined ? null : v}
            disabled={isReadonly}
            onChange={(nv: string | number | null) => updateRow(idx, { [col.key]: nv === null ? 0 : Number(nv) })}
          />
        )
      case 'many2one':
        return (
          <SelectPicker
            data={m2oOptions[col.key] || []}
            value={v === '' || v === undefined ? null : v}
            disabled={isReadonly}
            searchable
            cleanable
            block
            placeholder={col.placeholder || `Select ${col.title}...`}
            placement="auto"
            style={{ width: '100%', minWidth: 160 }}
            onChange={(next: any) => {
              const opt = (m2oOptions[col.key] || []).find((o) => o.value === next)
              updateRow(idx, {
                [col.key]: next ?? null,
                ...(col.labelKey ? { [col.labelKey]: opt?.label ?? '' } : {}),
              })
            }}
          />
        )
      case 'select':
        return (
          <SelectPicker
            data={col.options || []}
            value={v === '' || v === undefined ? null : v}
            disabled={isReadonly}
            cleanable
            block
            placement="auto"
            style={{ width: '100%', minWidth: 120 }}
            onChange={(next: any) => updateRow(idx, { [col.key]: next ?? '' })}
          />
        )
      case 'date':
        return (
          <DatePicker
            size="sm"
            oneTap
            value={v ? new Date(v) : null}
            disabled={isReadonly}
            placeholder={col.placeholder || '—'}
            placement="auto"
            style={{ width: '100%', minWidth: 130 }}
            onChange={(d: Date | null) => updateRow(idx, { [col.key]: d ? d.toISOString().slice(0, 10) : '' })}
          />
        )
      default:
        return (
          <Input
            size="sm"
            value={v ?? ''}
            disabled={isReadonly}
            placeholder={col.placeholder || col.title}
            onChange={(nv: string) => updateRow(idx, { [col.key]: nv })}
          />
        )
    }
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-xs">
          <thead className="bg-muted/50">
            <tr>
              <th className="w-8 p-2 text-left font-medium text-muted-foreground">#</th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="p-2 text-left font-medium text-muted-foreground"
                  style={{ minWidth: col.width || 120 }}
                >
                  {col.title}
                  {col.required ? <span className="text-destructive"> *</span> : null}
                </th>
              ))}
              {allowDelete && <th className="w-10 p-2" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id ?? idx} className="border-t border-border align-middle">
                <td className="p-1.5 text-muted-foreground">{idx + 1}</td>
                {columns.map((col) => (
                  <td key={col.key} className="p-1.5" style={{ minWidth: col.width || 120 }}>
                    {renderCell(col, row, idx)}
                  </td>
                ))}
                {allowDelete && (
                  <td className="p-1.5 text-center">
                    <IconButton
                      icon={<Trash2 className="h-3.5 w-3.5" />}
                      circle
                      size="xs"
                      disabled={isReadonly}
                      onClick={() => removeRow(idx)}
                    />
                  </td>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 2} className="p-4 text-center text-muted-foreground">
                  No lines yet — click “Add Line” to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {allowCreate && (
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
        >
          <Plus className="h-3.5 w-3.5" /> Add Line
        </button>
      )}
    </div>
  )
}

;(One2ManyListWidget as any).widgetName = 'one2many_list'

export default One2ManyListWidget
