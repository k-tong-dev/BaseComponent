# StatView Component

A lightweight **summary-stats row** rendered *above* a ResourceView's data view. Use it to answer "at a glance" questions — how many orders, total sales, how many sessions are open — without building a bespoke dashboard.

## Why it exists

Every list/kanban page tends to want the same 3–4 KPI cards at the top. Rather than each page rolling its own markup, StatView gives the Base Views architecture a first-class slot for summary cards, wired the same `config`-driven way as List/Kanban/Form.

## Features

- **Config-driven**: define an array of stats; the view renders a responsive card grid.
- **Responsive grid**: always **2 columns** on phones, then `columns` (2–6) from `sm` up.
- **Rich cards**: each stat has a label, a value, and optional `icon`, `color` (Tailwind text color) and `help` sub-text.
- **Auto-hides**: renders nothing when `stats` is empty, so it never leaves an empty gap.
- **View-aware**: only shows for list/kanban/gantt views (never over a form or custom view).

## Architecture — how ResourceView wires it

StatView is *not* rendered directly by pages. You hand the config to `ResourceView` via `statViewConfig`, and ResourceView mounts it above the header (`components/Base/Views/index.tsx`):

```tsx
{config.statViewConfig && viewType !== 'form' && viewType !== 'custom' && (
  <div className="mb-4">
    <StatView config={config.statViewConfig} />
  </div>
)}
```

So it appears for every data view automatically — you just provide the config.

## Interfaces

```typescript
interface StatItem {
  key: string            // React key (must be unique within stats)
  label: string          // Small caption above the value, e.g. "Total sales"
  value: string | number // The headline value (already formatted)
  icon?: React.ReactNode // Optional trailing icon (e.g. a lucide icon)
  color?: string         // Tailwind text color for the value, e.g. 'text-emerald-600'
  help?: string          // Optional fine-print below the value
}

interface StatViewConfig {
  stats: StatItem[]
  columns?: 2 | 3 | 4 | 5 | 6   // Grid columns from `sm` up (default: 4). Always 2 cols below `sm`.
}
```

`value` is intentionally `string | number` — **format it before passing** (currency, percentages, counts). StatView does no number formatting itself; it just displays what you give it. That keeps currency/locale logic in the page, next to the data.

## Usage

Because `statViewConfig` lives in the page (a `.tsx`), the stats are usually derived from the fetched rows:

```tsx
import { ResourceView } from '@/components/Base/Views'

const rows = data ?? []
const totalSales = rows.reduce((sum, s) => sum + (Number(s.total_sales) || 0), 0)
const openCount = rows.filter(s => s.status === 'open').length

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'KHR', maximumFractionDigits: 0 }).format(totalSales)

<ResourceView
  config={{
    type: 'kanban',
    title: 'POS Sessions',
    listViewConfig: { ...listConfig, data: rows },
    kanbanViewConfig: { /* ... */ },
    statViewConfig: {
      columns: 4,
      stats: [
        { key: 'open',   label: 'Open now',      value: openCount,  color: 'text-emerald-600' },
        { key: 'total',  label: 'Sessions',       value: rows.length },
        { key: 'orders', label: 'Orders rung',    value: totalOrders },
        { key: 'sales',  label: 'Total sales',    value: money,     color: 'text-primary' },
      ],
    },
  }}
/>
```

Real usages: `app/dashboard/pos/sessions/page.tsx` and `app/dashboard/pos/orders/page.tsx`.

## Best practices

- **3–5 stats** reads best; past 6 the cards get cramped (use `columns: 6` only for short numeric values).
- **Pre-format** `value` — StatView shows it verbatim.
- Use `color` sparingly (one accent, e.g. the headline money stat) so the row stays scannable.
- Prefer `help` for totals that carry a caveat (e.g. "across 8 sessions").
- Stats that need sorting/summary of the *table itself* belong on `summary`/`summaryType` columns; StatView is for the **page-level KPIs above the table**.
