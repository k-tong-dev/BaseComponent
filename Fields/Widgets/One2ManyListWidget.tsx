'use client'

import * as React from 'react'
import { Modal, Button, IconButton } from 'rsuite'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  StringField,
  NumberField,
  BooleanField,
  SelectionField,
  Many2OneField,
  DateField,
  DatetimeField,
  TextareaField,
} from '@/components/Base/Fields'
import { getFormConfig } from '../../Views/FormView/config/registry'

/**
 * Generic inline One2Many widget (`one2many_list`), Odoo-style.
 *
 * The lines are shown as a read-only table. Adding / editing a line opens a
 * modal dialog that renders the *target view* form (a set of fields) instead of
 * editing inside the table cells. Rows are kept in the parent form state and
 * persisted when the parent record is saved.
 *
 * Config (`field.widgetConfig`):
 *
 * {
 *   allowCreate?: boolean,
 *   allowDelete?: boolean,
 *   // Target view shown in the add/edit modal. Inline object or a registered
 *   // form-config key (see registerFormConfig / getFormConfig).
 *   targetView?: { title?: string; fields: TargetField[] } | string,
 *   // Optional explicit list columns. If omitted they are derived from targetView.
 *   columns?: Column[],
 * }
 *
 * TargetField: { key, label, type, required?, readonly?, placeholder?, helper?,
 *   options?, fetchUrl?, labelKey?, columnWidth?, order? }
 *   type: string | number | boolean | toggle | selection | many2one | date | datetime | textarea
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
  /** When set, the selected option label is also stored on this row key. */
  labelKey?: string
  placeholder?: string
}

export interface One2ManyListTargetField {
  key: string
  label?: string
  type?: string
  required?: boolean
  readonly?: boolean
  placeholder?: string
  helper?: string
  options?: Array<{ label: any; value: any }>
  fetchUrl?: string
  labelKey?: string
  columnWidth?: number
  order?: number
}

export interface One2ManyListTargetView {
  title?: string
  fields: One2ManyListTargetField[]
}

export interface One2ManyListConfig {
  columns?: One2ManyListColumn[]
  allowCreate?: boolean
  allowDelete?: boolean
  /** Child records endpoint / inverse FK (informational; persistence is handled by the parent form's API). */
  relation?: string
  inverseField?: string
  /** Target form view used by the add/edit modal. */
  targetView?: One2ManyListTargetView | string
  modalTitle?: string
  addLabel?: string
}

interface ModalField {
  key: string
  label: string
  type: string
  required?: boolean
  readonly?: boolean
  placeholder?: string
  helper?: string
  options?: Array<{ label: any; value: any }>
  fetchUrl?: string
  labelKey?: string
  columnWidth?: number
  order?: number
}

function defaultFor(f: ModalField) {
  switch (f.type) {
    case 'number':
      return 0
    case 'boolean':
    case 'toggle':
    case 'checkbox':
      return false
    default:
      return ''
  }
}

function displayValue(col: One2ManyListColumn, value: any, options: Array<{ label: any; value: any }>) {
  if (value === undefined || value === null || value === '') return '-'
  if (col.type === 'boolean') return value ? 'Yes' : 'No'
  if (col.type === 'many2one' || col.type === 'select') {
    const opts = col.type === 'select' ? col.options || [] : options
    return opts.find((o) => String(o.value) === String(value))?.label ?? value
  }
  return String(value)
}

function resolveTargetView(config: One2ManyListConfig): One2ManyListTargetView | null {
  const tv: any = config.targetView
  if (!tv) return null
  if (typeof tv === 'string') {
    const cfg = getFormConfig(tv)
    return cfg ? { title: cfg.entityName, fields: cfg.fields as any } : null
  }
  return tv
}

function columnsToFields(columns: One2ManyListColumn[]): ModalField[] {
  return columns.map((c, i) => ({
    key: c.key,
    label: c.title || c.key,
    type: c.type === 'select' ? 'selection' : (c.type || 'string'),
    required: c.required,
    placeholder: c.placeholder,
    options: c.options,
    fetchUrl: c.relation || c.fetchUrl,
    labelKey: c.labelKey,
    columnWidth: c.width && c.width >= 200 ? 2 : 1,
    order: i,
  }))
}

function fieldsToColumns(fields: ModalField[]): One2ManyListColumn[] {
  return fields.map((f) => ({
    key: f.key,
    title: f.label,
    type:
      f.type === 'selection'
        ? 'select'
        : f.type === 'number' || f.type === 'boolean' || f.type === 'date' || f.type === 'many2one'
          ? (f.type as any)
          : 'string',
    options: f.options,
    relation: f.fetchUrl,
    labelKey: f.labelKey,
    width: f.columnWidth === 2 ? 220 : 140,
  }))
}

const toFieldOptions = (opts?: Array<{ label: any; value: any }>) =>
  (opts || []).map((o) => ({ id: o.value, name: o.label }))

function FieldControl({
  f,
  value,
  onChange,
  error,
}: {
  f: ModalField
  value: any
  onChange: (v: any) => void
  error?: string | null
}) {
  const cfg: any = {
    name: f.key,
    type: f.type,
    label: f.required ? `${f.label} *` : f.label,
    placeholder: f.placeholder || ' ',
    required: f.required,
    readonly: f.readonly,
    helper: f.helper,
    size: 'md',
    fetchUrl: f.fetchUrl,
    options: toFieldOptions(f.options),
  }

  switch (f.type) {
    case 'number':
      return <NumberField config={cfg} value={value} onChange={onChange} error={error} />
    case 'boolean':
    case 'toggle':
    case 'checkbox':
      return <BooleanField config={cfg} value={value} onChange={onChange} error={error} />
    case 'selection':
      return <SelectionField config={cfg} value={value} onChange={onChange} error={error} />
    case 'many2one':
      return <Many2OneField config={cfg} value={value} onChange={onChange} error={error} />
    case 'date':
      return <DateField config={cfg} value={value} onChange={onChange} error={error} />
    case 'datetime':
      return <DatetimeField config={cfg} value={value} onChange={onChange} error={error} />
    case 'textarea':
      return <TextareaField config={cfg} value={value} onChange={onChange} error={error} />
    default:
      return <StringField config={cfg} value={value} onChange={onChange} error={error} />
  }
}

export const One2ManyListWidget: React.FC<any> = ({ value, onChange, field, readonly, disabled }: any) => {
  const config: One2ManyListConfig = field?.widgetConfig || {}
  const isReadonly = Boolean(readonly || disabled)
  const allowCreate = config.allowCreate !== false && !isReadonly
  const allowDelete = config.allowDelete !== false && !isReadonly

  const targetView = React.useMemo(() => resolveTargetView(config), [config])
  const configuredColumns: One2ManyListColumn[] = React.useMemo(
    () => (Array.isArray(config.columns) ? config.columns : []),
    [config.columns]
  )

  const fields: ModalField[] = React.useMemo(() => {
    if (targetView?.fields?.length) {
      return [...targetView.fields]
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((f) => ({
          key: f.key,
          label: f.label || f.key,
          type: f.type || 'string',
          required: f.required,
          readonly: f.readonly,
          placeholder: f.placeholder,
          helper: f.helper,
          options: f.options,
          fetchUrl: f.fetchUrl,
          labelKey: f.labelKey,
          columnWidth: f.columnWidth,
          order: f.order,
        }))
    }
    return columnsToFields(configuredColumns)
  }, [targetView, configuredColumns])

  const listColumns: One2ManyListColumn[] = React.useMemo(
    () => (configuredColumns.length ? configuredColumns : fieldsToColumns(fields)),
    [configuredColumns, fields]
  )

  const rows: any[] = React.useMemo(() => (Array.isArray(value) ? value : []), [value])

  // Preload many2one options (for the modal labels + list display).
  const m2oNeeds = React.useMemo(() => {
    const map: Record<string, { url: string; displayField: string; valueField: string }> = {}
    for (const f of fields) {
      if (f.type === 'many2one' && f.fetchUrl) {
        map[f.key] = { url: f.fetchUrl, displayField: 'name', valueField: 'id' }
      }
    }
    for (const c of listColumns) {
      if (c.type === 'many2one') {
        const url = c.relation || c.fetchUrl
        if (url) map[c.key] = { url, displayField: c.displayField || 'name', valueField: c.valueField || 'id' }
      }
    }
    return map
  }, [fields, listColumns])

  const m2oKey = Object.entries(m2oNeeds).map(([k, v]) => `${k}|${v.url}`).join(';')
  const [m2oOptions, setM2oOptions] = React.useState<Record<string, Array<{ label: any; value: any }>>>({})

  React.useEffect(() => {
    let cancelled = false
    const load = async () => {
      const next: Record<string, Array<{ label: any; value: any }>> = {}
      for (const [key, cfg] of Object.entries(m2oNeeds)) {
        try {
          const data = await (await fetch(cfg.url)).json()
          const arr = Array.isArray(data) ? data : data?.data || []
          next[key] = arr.map((it: any) => ({ label: it[cfg.displayField], value: it[cfg.valueField] }))
        } catch {
          next[key] = []
        }
      }
      if (!cancelled) setM2oOptions(next)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [m2oKey])

  // Modal state
  const [open, setOpen] = React.useState(false)
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null)
  const [draft, setDraft] = React.useState<Record<string, any>>({})
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const blankDraft = React.useCallback(() => {
    const d: Record<string, any> = {}
    for (const f of fields) d[f.key] = defaultFor(f)
    return d
  }, [fields])

  const openCreate = () => {
    setEditingIndex(null)
    setDraft(blankDraft())
    setErrors({})
    setOpen(true)
  }

  const openEdit = (idx: number) => {
    setEditingIndex(idx)
    setDraft({ ...blankDraft(), ...rows[idx] })
    setErrors({})
    setOpen(true)
  }

  const setField = (f: ModalField, raw: any) => {
    let v = raw
    if (f.type === 'many2one' && v != null && v !== '' && !Number.isNaN(Number(v))) v = Number(v)
    setDraft((d) => {
      const next = { ...d, [f.key]: v }
      if (f.type === 'many2one' && f.labelKey) {
        const opt = (m2oOptions[f.key] || []).find((o) => String(o.value) === String(v))
        next[f.labelKey] = opt ? opt.label : ''
      }
      return next
    })
    setErrors((e) => {
      if (!e[f.key]) return e
      const n = { ...e }
      delete n[f.key]
      return n
    })
  }

  const save = () => {
    const errs: Record<string, string> = {}
    for (const f of fields) {
      if (!f.required) continue
      const v = draft[f.key]
      if (v === '' || v === null || v === undefined) errs[f.key] = 'This field is required'
    }
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    if (editingIndex === null) {
      onChange([...rows, { ...draft, _isNew: true }])
    } else {
      onChange(rows.map((r, i) => (i === editingIndex ? { ...r, ...draft } : r)))
    }
    setOpen(false)
  }

  const removeRow = (idx: number) => onChange(rows.filter((_, i) => i !== idx))

  if (!listColumns.length && !fields.length) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm font-medium text-destructive">One2ManyListWidget configuration error</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Provide <code>widgetConfig.targetView.fields</code> or <code>widgetConfig.columns</code>.
        </p>
      </div>
    )
  }

  const modalTitle = config.modalTitle || targetView?.title || 'Line'
  const showActions = !isReadonly

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-xs">
          <thead className="bg-muted/50">
            <tr>
              <th className="w-8 p-2 text-left font-medium text-muted-foreground">#</th>
              {listColumns.map((col) => (
                <th
                  key={col.key}
                  className="p-2 text-left font-medium text-muted-foreground"
                  style={{ minWidth: col.width || 120 }}
                >
                  {col.title}
                </th>
              ))}
              {showActions && <th className="w-20 p-2" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.id ?? idx}
                className={cn('border-t border-border align-middle', !isReadonly && 'cursor-pointer hover:bg-muted/40')}
                onClick={() => !isReadonly && openEdit(idx)}
              >
                <td className="p-1.5 text-muted-foreground">{idx + 1}</td>
                {listColumns.map((col) => (
                  <td key={col.key} className="p-1.5" style={{ minWidth: col.width || 120 }}>
                    <span className="text-xs">{displayValue(col, row[col.key], m2oOptions[col.key] || [])}</span>
                  </td>
                ))}
                {showActions && (
                  <td className="p-1.5 text-center" onClick={(e) => e.stopPropagation()}>
                    {!isReadonly && (
                      <IconButton
                        icon={<Pencil className="h-3.5 w-3.5" />}
                        size="xs"
                        circle
                        onClick={() => openEdit(idx)}
                      />
                    )}
                    {allowDelete && (
                      <IconButton
                        icon={<Trash2 className="h-3.5 w-3.5" />}
                        size="xs"
                        circle
                        onClick={() => removeRow(idx)}
                      />
                    )}
                  </td>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={listColumns.length + 2} className="p-4 text-center text-muted-foreground">
                  No lines yet — click “{config.addLabel || 'Add Line'}” to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {allowCreate && (
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
        >
          <Plus className="h-3.5 w-3.5" /> {config.addLabel || 'Add Line'}
        </button>
      )}

      <Modal open={open} onClose={() => setOpen(false)} size="md" backdrop="static">
        <Modal.Header>
          <Modal.Title>{editingIndex === null ? `Add ${modalTitle}` : `Edit ${modalTitle}`}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="grid max-h-[60vh] grid-cols-2 gap-x-6 gap-y-5 overflow-y-auto px-1 py-2">
            {fields.map((f) => (
              <div key={f.key} className={cn(f.columnWidth === 2 ? 'col-span-2' : 'col-span-1')}>
                <FieldControl f={f} value={draft[f.key]} onChange={(v) => setField(f, v)} error={errors[f.key]} />
              </div>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button appearance="primary" onClick={save}>
            Save
          </Button>
          <Button appearance="default" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

;(One2ManyListWidget as any).widgetName = 'one2many_list'

export default One2ManyListWidget
