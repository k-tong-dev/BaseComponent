'use client'

import * as React from 'react'
import { SelectPicker, IconButton, Input, DatePicker } from 'rsuite'
import { Plus, Trash2 } from 'lucide-react'

interface PricelistItemRow {
  id?: number | string
  menu_item_id?: number | string | null
  menu_item_name?: string
  price?: number | string
  discount?: number | string
  sell_quantity?: number | string
  allowed_order?: boolean
  close_order?: boolean
  feature?: string
  start_date?: string | null
  end_date?: string | null
  published?: boolean
  active?: boolean
  notes?: string
}

const FEATURE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'discount', label: 'Discount' },
  { value: 'promotion', label: 'Promotion' },
]

function MenuItemSelect({ value, onChange }: { value: any; onChange: (id: number | null, name: string) => void }) {
  const [options, setOptions] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    setLoading(true)
    fetch('/api/dashboard/menu-items')
      .then(r => r.json())
      .then((list: any[]) => setOptions((Array.isArray(list) ? list : []).map((m: any) => ({ id: m.id, name: m.name }))))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <SelectPicker
      data={options.map((o) => ({ label: o.name, value: String(o.id), item: o }))}
      value={value != null ? String(value) : null}
      onChange={(next: string | null) => {
        const opt = options.find((o) => String(o.id) === next)
        onChange(next != null ? Number(next) : null, opt?.name ?? '')
      }}
      searchable
      block
      loading={loading}
      placeholder="Select menu item…"
      cleanable
      placement="auto"
      style={{ width: '100%' }}
    />
  )
}

export function PricelistItemsWidget({ value, onChange, field, readonly }: any) {
  const rows: PricelistItemRow[] = React.useMemo(
    () => (Array.isArray(value) ? value : []),
    [value]
  )

  const setRows = (next: PricelistItemRow[]) => onChange(next)

  const updateRow = (idx: number, patch: Partial<PricelistItemRow>) => {
    const next = rows.map((r, i) => (i === idx ? { ...r, ...patch } : r))
    setRows(next)
  }

  const addRow = () => {
    setRows([
      ...rows,
      {
        menu_item_id: null,
        menu_item_name: '',
        price: 0,
        discount: 0,
        sell_quantity: 0,
        allowed_order: true,
        close_order: false,
        feature: 'none',
        published: true,
        active: true,
      },
    ])
  }

  const removeRow = (idx: number) => setRows(rows.filter((_, i) => i !== idx))

  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2 w-8">#</th>
              <th className="text-left p-2 min-w-[180px]">Menu Item</th>
              <th className="text-left p-2 w-20">Price</th>
              <th className="text-left p-2 w-20">Discount</th>
              <th className="text-left p-2 w-20">Qty</th>
              <th className="text-center p-2 w-24">Allowed</th>
              <th className="text-center p-2 w-20">Close</th>
              <th className="text-left p-2 w-28">Feature</th>
              <th className="text-left p-2 w-32">Promo Start</th>
              <th className="text-left p-2 w-32">Promo End</th>
              <th className="text-center p-2 w-20">Publish</th>
              <th className="p-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id ?? idx} className="border-t border-border align-middle">
                <td className="p-1.5 text-muted-foreground">{idx + 1}</td>
                <td className="p-1.5">
                  <MenuItemSelect
                    value={row.menu_item_id}
                    onChange={(id, name) => updateRow(idx, { menu_item_id: id, menu_item_name: name })}
                  />
                </td>
                <td className="p-1.5">
                  <Input
                    size="sm"
                    type="number"
                    value={row.price ?? 0}
                    disabled={readonly}
                    onChange={(v) => updateRow(idx, { price: v })}
                  />
                </td>
                <td className="p-1.5">
                  <Input
                    size="sm"
                    type="number"
                    value={row.discount ?? 0}
                    disabled={readonly}
                    onChange={(v) => updateRow(idx, { discount: v })}
                  />
                </td>
                <td className="p-1.5">
                  <Input
                    size="sm"
                    type="number"
                    value={row.sell_quantity ?? 0}
                    disabled={readonly}
                    onChange={(v) => updateRow(idx, { sell_quantity: v })}
                  />
                </td>
                <td className="p-1.5 text-center">
                  <input
                    type="checkbox"
                    checked={!!row.allowed_order}
                    disabled={readonly}
                    onChange={(e) => updateRow(idx, { allowed_order: e.target.checked })}
                  />
                </td>
                <td className="p-1.5 text-center">
                  <input
                    type="checkbox"
                    checked={!!row.close_order}
                    disabled={readonly}
                    onChange={(e) => updateRow(idx, { close_order: e.target.checked })}
                  />
                </td>
                <td className="p-1.5">
                  <SelectPicker
                    data={FEATURE_OPTIONS}
                    value={row.feature ?? 'none'}
                    disabled={readonly}
                    onChange={(v) => updateRow(idx, { feature: v ?? undefined })}
                    block
                    placement="auto"
                    style={{ width: '100%' }}
                  />
                </td>
                <td className="p-1.5">
                  <DatePicker
                    value={row.start_date ? new Date(row.start_date) : null}
                    disabled={readonly}
                    onChange={(d) => updateRow(idx, { start_date: d ? d.toISOString().slice(0, 10) : undefined })}
                    placeholder="—"
                    placement="auto"
                  />
                </td>
                <td className="p-1.5">
                  <DatePicker
                    value={row.end_date ? new Date(row.end_date) : null}
                    disabled={readonly}
                    onChange={(d) => updateRow(idx, { end_date: d ? d.toISOString().slice(0, 10) : undefined })}
                    placeholder="—"
                    placement="auto"
                  />
                </td>
                <td className="p-1.5 text-center">
                  <input
                    type="checkbox"
                    checked={row.published !== false}
                    disabled={readonly}
                    onChange={(e) => updateRow(idx, { published: e.target.checked })}
                  />
                </td>
                <td className="p-1.5 text-center">
                  <IconButton
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                    circle
                    size="xs"
                    disabled={readonly}
                    onClick={() => removeRow(idx)}
                  />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={12} className="p-4 text-center text-muted-foreground">
                  No items yet — add a menu item to this pricelist.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={addRow}
        disabled={readonly}
        className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Add Line
      </button>
      <span className="sr-only">{field?.key}</span>
    </div>
  )
}

;(PricelistItemsWidget as any).widgetName = 'pricelist_items'

export default PricelistItemsWidget
