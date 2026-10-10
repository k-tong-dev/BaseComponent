'use client'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface StatItem {
  key: string
  label: string
  value: string | number
  icon?: React.ReactNode
  /** Tailwind text color class for the value, e.g. 'text-emerald-600' */
  color?: string
  /** Optional sub-label / help text */
  help?: string
}

export interface StatViewConfig {
  stats: StatItem[]
  /** Number of grid columns on sm+ screens (default 4) */
  columns?: 2 | 3 | 4 | 5 | 6
}

const colMap: Record<number, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
  5: 'sm:grid-cols-5',
  6: 'sm:grid-cols-6',
}

export function StatView({ config }: { config: StatViewConfig }) {
  const { stats, columns = 4 } = config
  if (!stats?.length) return null

  return (
    <div className={cn('grid grid-cols-2 gap-3', colMap[columns] ?? colMap[4])}>
      {stats.map(s => (
        <Card key={s.key} className="p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            {s.icon && <span className="shrink-0 text-muted-foreground">{s.icon}</span>}
          </div>
          <p className={cn('mt-1 text-xl font-bold', s.color ?? 'text-foreground')}>{s.value}</p>
          {s.help && <p className="mt-0.5 text-[11px] text-muted-foreground">{s.help}</p>}
        </Card>
      ))}
    </div>
  )
}
