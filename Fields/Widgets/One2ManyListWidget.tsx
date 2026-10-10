'use client'

import * as React from 'react'
import { Modal, Button, IconButton, Toggle } from 'rsuite'
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
import { useTranslate } from '../../i18n'

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
  type?: 'string' | 'number' | 'boolean' | 'toggle' | 'checkbox' | 'select' | 'many2one' | 'date'
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
  /**
   * Odoo-style footer summary for the column (rendered in the table footer):
   * 'sum' | 'count' | 'avg' | 'min' | 'max'. Only meaningful for numeric columns
   * (except 'count', which works for any column).
   */
  summary?: 'sum' | 'count' | 'avg' | 'min' | 'max'
  /** Format for the summary value: 'number' | 'currency' | 'percent' | custom fn. */
  summaryFormat?: 'number' | 'currency' | 'percent' | ((v: number) => string)
  /**
   * Currency code shown for `summaryFormat: 'currency'`. Falls back to the
   * parent form's `currency_code` value when omitted.
   */
  summaryCurrency?: string
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
  /** Source field used to build the many2one option label (e.g. `code`). */
  displayField?: string
  columnWidth?: number
  order?: number
}

export interface One2ManyListTargetView {
  title?: string
  fields: One2ManyListTargetField[]
}

export interface One2ManyListConfig {
  columns?: One2ManyListColumn[]
  /** Parent-form field that holds the currency code for `currency` summaries. */
  currencyField?: string
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
  /** Source field used to build the many2one option label (e.g. `code`). */
  displayField?: string
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
  if (col.type === 'boolean' || col.type === 'toggle' || col.type === 'checkbox') return value ? 'Yes' : 'No'
  if (col.type === 'many2one' || col.type === 'select') {
    const opts = col.type === 'select' ? col.options || [] : options
    return opts.find((o) => String(o.value) === String(value))?.label ?? value
  }
  return String(value)
}

function formatSummaryValue(v: number, fmt?: One2ManyListColumn['summaryFormat'], currencyCode?: string): string {
  if (typeof fmt === 'function') return fmt(v)
  switch (fmt) {
    case 'currency':
      return `${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencyCode || 'KHR'}`.trim()
    case 'percent':
      return `${Number(v.toFixed(2))}%`
    default:
      return v.toLocaleString('en-US', { maximumFractionDigits: 2 })
  }
}

/** Compute the Odoo-style footer summaries for every column that declares one. */
function computeSummaries(
  rows: any[],
  columns: One2ManyListColumn[],
  currencyCode?: string
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const col of columns) {
    if (!col.summary) continue
    const nums = rows
      .map((r) => Number(r?.[col.key]))
      .filter((n) => Number.isFinite(n))
    let value = 0
    switch (col.summary) {
      case 'count':
        value = nums.length
        break
      case 'sum':
        value = nums.reduce((a, b) => a + b, 0)
        break
      case 'avg':
        value = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
        break
      case 'min':
        value = nums.length ? Math.min(...nums) : 0
        break
      case 'max':
        value = nums.length ? Math.max(...nums) : 0
        break
    }
    out[col.key] = formatSummaryValue(value, col.summaryFormat, col.summaryCurrency ?? currencyCode)
  }
  return out
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
    displayField: c.displayField,
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
        : f.type === 'number' ||
            f.type === 'boolean' ||
            f.type === 'toggle' ||
            f.type === 'checkbox' ||
            f.type === 'date' ||
            f.type === 'many2one'
          ? (f.type as any)
          : 'string',
    options: f.options,
    relation: f.fetchUrl,
    labelKey: f.labelKey,
    displayField: f.displayField,
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
  const translate = useTranslate()
  const cfg: any = {
    name: f.key,
    type: f.type,
    label: translate(f.label),
    placeholder: f.placeholder || ' ',
    required: f.required,
    readonly: f.readonly,
    helper: f.helper,
    size: 'md',
    fetchUrl: f.fetchUrl,
    displayField: f.displayField,
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

export const One2ManyListWidget: React.FC<any> = ({ value, onChange, field, readonly, disabled, data }: any) => {
  const translate = useTranslate()
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
          displayField: f.displayField,
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

  // Odoo-style footer summaries (sum / count / avg / min / max per column).
  // Currency summaries fall back to the parent form's currency code
  // (e.g. the order's `currency_code`), or a per-column override.
  const parentCurrencyCode =
    (config.currencyField ? data?.[config.currencyField] : undefined) ??
    data?.currency_code ??
    undefined
  const summaries = React.useMemo(
    () => computeSummaries(rows, listColumns, parentCurrencyCode),
    [rows, listColumns, parentCurrencyCode]
  )
  const hasSummaries = Object.keys(summaries).length > 0

  // Preload many2one options (for the modal labels + list display).
  const m2oNeeds = React.useMemo(() => {
    const map: Record<string, { url: string; displayField: string; valueField: string }> = {}
    for (const f of fields) {
      if (f.type === 'many2one' && f.fetchUrl) {
        map[f.key] = { url: f.fetchUrl, displayField: f.displayField || 'name', valueField: 'id' }
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

  const modalTitle = translate(config.modalTitle || targetView?.title || 'Line')
  const addLabel = translate(config.addLabel || 'Add Line')
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
                  {translate(col.title)}
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
                    {col.type === 'boolean' || col.type === 'toggle' || col.type === 'checkbox' ? (
                      <Toggle size="sm" checked={Boolean(row[col.key])} disabled />
                    ) : (
                      <span className="text-xs">{displayValue(col, row[col.key], m2oOptions[col.key] || [])}</span>
                    )}
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
                  {translate('No lines yet — click “{addLabel}” to create one.', { addLabel })}
                </td>
              </tr>
            )}
          </tbody>
          {hasSummaries && (
            <tfoot>
              <tr className="border-t border-border bg-muted/30">
                <td className="p-2 text-xs font-semibold text-muted-foreground">
                  {translate('Total')}
                </td>
                {listColumns.map((col) => (
                  <td
                    key={col.key}
                    className="p-2 text-xs font-semibold text-foreground"
                    style={{ minWidth: col.width || 120 }}
                  >
                    {summaries[col.key] ?? ''}
                  </td>
                ))}
                {showActions && <td />}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {allowCreate && (
        <Button
          // appearance={"primary"}
          size="sm"
          // color={"violet"}
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
        >
          <Plus className="h-3.5 w-3.5" /> {addLabel}
        </Button>
      )}

      <Modal open={open} onClose={() => setOpen(false)} size="md" backdrop="static">
        <Modal.Header>
          <Modal.Title>{editingIndex === null ? translate('Add {title}', { title: modalTitle }) : translate('Edit {title}', { title: modalTitle })}</Modal.Title>
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
          <Button appearance="primary" color={"violet"} onClick={save}>
            {translate('Save')}
          </Button>
          <Button appearance="default" onClick={() => setOpen(false)}>
            {translate('Cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

;(One2ManyListWidget as any).widgetName = 'one2many_list'

export default One2ManyListWidget
