'use client'

export type KanbanMode = 'normal' | 'groupby' | 'grid'

export interface KanbanColumn {
  id: string
  title: string
  color?: string
  state?: string
  limit?: number
}

export interface KanbanCard {
  id: string
  data: any
  state?: string
  showDragHandle?: boolean
  onCardClick?: (card: KanbanCard) => void
  onCardEdit?: (card: KanbanCard) => void
  onCardDelete?: (card: KanbanCard) => void
}

export interface KanbanViewConfig {
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

export interface KanbanViewProps {
  config: KanbanViewConfig
  loading?: boolean
  onCardClick?: (card: KanbanCard) => void
  onCardEdit?: (card: KanbanCard) => void
  onCardDelete?: (card: KanbanCard) => void
}
