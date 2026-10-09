# KanbanView Component

A reusable Kanban board component with support for dynamic grouping and custom card rendering.

## Features

- **Dynamic Grouping**: Auto-generates columns based on unique values from a specified field (`groupByField`)
- **Grid Mode**: Single column displaying all cards without grouping (when no `groupByField` is set)
- **Custom Card Rendering**: Every card must be custom via the required `renderCard` function
- **Drag & Drop**: Full drag and drop support powered by @dnd-kit
- **State Auto-Update**: Automatically update record field when moving between columns
- **Card Actions**: Support for click, edit, and delete actions on cards

## Folder Structure

```
components/admin/KanbanView/
├── index.tsx          # Main KanbanView component
├── types.ts           # TypeScript type definitions
├── config/            # Configuration files (optional)
└── README.md          # This file
```

## Usage

### GroupBy Mode (Dynamic Columns)

```tsx
import { KanbanView } from '@/components/admin/ResourceView/KanbanView'
import { MyCustomCard } from './MyCustomCard'

const config = {
  mode: 'groupby',
  groupByField: 'status',  // Auto-generates columns based on unique status values
  data: myData,
  onStateChange: async (cardId, newState) => {
    await api.updateCard(cardId, { status: newState })
  },
  renderCard: (card) => <MyCustomCard card={card} />
}

<KanbanView config={config} />
```

### Grid Mode (No Grouping)

```tsx
const config = {
  mode: 'grid',  // Single column with all cards
  data: myData,
  renderCard: (card) => <MyCustomCard card={card} />
}

<KanbanView config={config} />
```

### Custom Card Component

```tsx
// MyCustomCard.tsx
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface MyCustomCardProps {
  card: { id: string; data: any; state?: string }
  onCardClick?: (card: { id: string; data: any }) => void
  onCardEdit?: (card: { id: string; data: any }) => void
  onCardDelete?: (card: { id: string; data: any }) => void
}

export function MyCustomCard({ card, onCardClick, onCardEdit, onCardDelete }: MyCustomCardProps) {
  return (
    <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer" onClick={() => onCardClick?.(card)}>
      <div className="space-y-2">
        <div className="font-medium">{card.data.name}</div>
        <div className="text-sm text-muted-foreground">{card.data.description}</div>
        <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" onClick={(e) => { e.stopPropagation(); onCardEdit?.(card) }}>Edit</Button>
          <Button size="sm" onClick={(e) => { e.stopPropagation(); onCardDelete?.(card) }}>Delete</Button>
        </div>
      </div>
    </Card>
  )
}
```

## API Reference

### KanbanViewConfig

```typescript
interface KanbanViewConfig {
  mode: 'normal' | 'groupby' | 'grid'
  data: any[]
  groupByField?: string  // Field to group by - if set, columns are auto-generated. If not set, displays as grid
  onCardClick?: (card: KanbanCard) => void
  onCardEdit?: (card: KanbanCard) => void
  onCardDelete?: (card: KanbanCard) => void
  onStateChange?: (cardId: string, newState: string) => Promise<void>
  renderCard: (card: KanbanCard) => React.ReactNode  // Required - every card must be custom
  cardWidth?: number
  columnWidth?: number
  draggable?: boolean
  showCardCount?: boolean
}
```

### KanbanCard

```typescript
interface KanbanCard {
  id: string
  data: any
  state?: string
}
```

## Integration with ResourceView

The KanbanView is designed to work seamlessly with the ResourceView parent component for unified view management across your application.

See `components/admin/ResourceView/README.md` for more information.
