'use client'

import React, { useState, useMemo, useRef } from 'react'
import { Kanban, KanbanBoard, KanbanColumn, KanbanItem, KanbanItemHandle, KanbanOverlay } from './kanban'
import { Input } from 'rsuite'
import { Search, GripVertical } from 'lucide-react'
import { KanbanViewProps, KanbanMode, KanbanColumn as KanbanColumnType } from './types'
import { cn } from '@/lib/utils'

/** Stable empty array so the filter effect does not re-run every render. */
const EMPTY_FILTER_VALUES: { fieldKey: string; operator: string; value: any }[] = []

export function KanbanView({ config, loading, showFilterPanel, setShowFilterPanel, searchKeyword, setSearchKeyword, filterValues, groupByField, onCardClick: externalOnCardClick, onCardEdit: externalOnCardEdit, onCardDelete: externalOnCardDelete }: KanbanViewProps & { showFilterPanel?: boolean; setShowFilterPanel?: (show: boolean) => void; searchKeyword?: string; setSearchKeyword?: (keyword: string) => void; filterValues?: {fieldKey: string; operator: string; value: any}[]; groupByField?: string }) {
  const {
    data,
    onCardClick: configOnCardClick,
    onCardEdit: configOnCardEdit,
    onCardDelete: configOnCardDelete,
    onStateChange,
    renderCard,
    columnLabels,
    cardWidth = 280,
    columnWidth = 320,
    draggable = true,
    showCardCount = true,
  } = config

  // Merge external handlers with config handlers (external takes precedence)
  const handleCardClick = (card: any) => {
    if (externalOnCardClick) {
      externalOnCardClick(card)
    } else if (configOnCardClick) {
      configOnCardClick(card)
    }
  }

  const handleCardEdit = (card: any) => {
    if (externalOnCardEdit) {
      externalOnCardEdit(card)
    } else if (configOnCardEdit) {
      configOnCardEdit(card)
    }
  }

  const handleCardDelete = (card: any) => {
    if (externalOnCardDelete) {
      externalOnCardDelete(card)
    } else if (configOnCardDelete) {
      configOnCardDelete(card)
    }
  }

  const getItemValue = (item: any) => item.id || item._id

  const columns = useMemo(() => {
    if (groupByField && data.length > 0) {
      // Get unique values from groupByField
      const uniqueValues = [...new Set(data.map(item => {
        const val = item[groupByField]
        // Handle date fields
        if (val instanceof Date) {
          return val.toISOString().split('T')[0] // YYYY-MM-DD
        }
        if (typeof val === 'string' && !isNaN(Date.parse(val))) {
          return val.split('T')[0] // Handle date strings
        }
        return val
      }))]
      
      // Sort values - numeric values sorted numerically, strings sorted alphabetically
      uniqueValues.sort((a, b) => {
        const aNum = Number(a)
        const bNum = Number(b)
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum
        }
        return String(a).localeCompare(String(b))
      })
      
      return uniqueValues.map((value, index) => ({
        id: String(value),
        title: config.columnLabels?.[String(value)] ?? String(value),
        state: String(value),
        color: ['blue', 'green', 'yellow', 'red', 'purple', 'orange'][index % 6]
      }))
    }
    // No groupByField - single column for grid display
    return [{ id: 'all', title: 'All Items', color: 'gray' }]
  }, [groupByField, data])

  // Type guard to check if state is defined
  const hasState = (col: KanbanColumnType): col is KanbanColumnType & { state: string } => {
    return col.state !== undefined && col.state !== null
  }

  // Use external state if provided, otherwise use local state
  const [localShowFilterPanel, setLocalShowFilterPanel] = useState(false)
  const [localSearchKeyword, setLocalSearchKeyword] = useState('')
  const filterPanelVisible = showFilterPanel !== undefined ? showFilterPanel : localShowFilterPanel
  const setFilterPanelVisible = setShowFilterPanel || setLocalShowFilterPanel
  const currentSearchKeyword = searchKeyword !== undefined ? searchKeyword : localSearchKeyword
  const setCurrentSearchKeyword = setSearchKeyword || setLocalSearchKeyword
  const currentFilterValues = filterValues || EMPTY_FILTER_VALUES

  const [kanbanData, setKanbanData] = useState<Record<string, any[]>>(() => {
    // Apply search keyword filter
    let filteredData = currentSearchKeyword ? data.filter(item =>
      Object.keys(item).some(key =>
        String(item[key]).toLowerCase().includes(currentSearchKeyword.toLowerCase())
      )
    ) : data

    // Apply filter values (AND logic - match all filters)
    if (currentFilterValues.length > 0) {
      filteredData = filteredData.filter(item =>
        currentFilterValues.every(filterValue => {
          const value = item[filterValue.fieldKey]
          const filterVal = filterValue.value
          
          switch (filterValue.operator) {
            case 'equals':
              if (typeof filterVal === 'number') {
                return Number(value) === filterVal
              }
              if (typeof filterVal === 'boolean') {
                return Boolean(value) === filterVal
              }
              const itemDate = new Date(value)
              const filterDate = new Date(filterVal)
              if (!isNaN(itemDate.getTime()) && !isNaN(filterDate.getTime())) {
                return itemDate.toDateString() === filterDate.toDateString()
              }
              return String(value) === String(filterVal)
            case 'contains':
              return String(value).toLowerCase().includes(String(filterVal).toLowerCase())
            case 'startsWith':
              return String(value).toLowerCase().startsWith(String(filterVal).toLowerCase())
            case 'endsWith':
              return String(value).toLowerCase().endsWith(String(filterVal).toLowerCase())
            case 'gt':
              return Number(value) > Number(filterVal)
            case 'lt':
              return Number(value) < Number(filterVal)
            case 'gte':
              return Number(value) >= Number(filterVal)
            case 'lte':
              return Number(value) <= Number(filterVal)
            case 'between':
              if (Array.isArray(filterVal) && filterVal.length === 2) {
                return Number(value) >= Number(filterVal[0]) && Number(value) <= Number(filterVal[1])
              }
              return true
            default:
              return true
          }
        })
      )
    }

    // Group data based on groupByField
    if (groupByField) {
      const field = groupByField
      const grouped: Record<string, any[]> = {}
      columns.forEach((col: any) => {
        if (hasState(col)) {
          // Normalize the value for comparison (same logic as column generation)
          const normalizeValue = (val: any) => {
            if (val instanceof Date) {
              return val.toISOString().split('T')[0]
            }
            if (typeof val === 'string' && !isNaN(Date.parse(val))) {
              return val.split('T')[0]
            }
            return val
          }
          // @ts-ignore - Type guard narrows col.state to string but TypeScript doesn't recognize it in index
          grouped[col.state] = filteredData.filter((item: any) => {
            const itemValue = normalizeValue(item[field])
            return String(itemValue) === col.state
          })
        }
      })
      return grouped
    } else {
      // No groupByField - single column with all items
      return { 'all': filteredData }
    }
  })

  // Update kanbanData when search keyword or filter values changes
  React.useEffect(() => {
    // Apply search keyword filter
    let filteredData = currentSearchKeyword ? data.filter(item =>
      Object.keys(item).some(key =>
        String(item[key]).toLowerCase().includes(currentSearchKeyword.toLowerCase())
      )
    ) : data

    // Apply filter values (AND logic - match all filters)
    if (currentFilterValues.length > 0) {
      filteredData = filteredData.filter(item =>
        currentFilterValues.every(filterValue => {
          const value = item[filterValue.fieldKey]
          const filterVal = filterValue.value
          
          switch (filterValue.operator) {
            case 'equals':
              if (typeof filterVal === 'number') {
                return Number(value) === filterVal
              }
              if (typeof filterVal === 'boolean') {
                return Boolean(value) === filterVal
              }
              const itemDate = new Date(value)
              const filterDate = new Date(filterVal)
              if (!isNaN(itemDate.getTime()) && !isNaN(filterDate.getTime())) {
                return itemDate.toDateString() === filterDate.toDateString()
              }
              return String(value) === String(filterVal)
            case 'contains':
              return String(value).toLowerCase().includes(String(filterVal).toLowerCase())
            case 'startsWith':
              return String(value).toLowerCase().startsWith(String(filterVal).toLowerCase())
            case 'endsWith':
              return String(value).toLowerCase().endsWith(String(filterVal).toLowerCase())
            case 'gt':
              return Number(value) > Number(filterVal)
            case 'lt':
              return Number(value) < Number(filterVal)
            case 'gte':
              return Number(value) >= Number(filterVal)
            case 'lte':
              return Number(value) <= Number(filterVal)
            case 'between':
              if (Array.isArray(filterVal) && filterVal.length === 2) {
                return Number(value) >= Number(filterVal[0]) && Number(value) <= Number(filterVal[1])
              }
              return true
            default:
              return true
          }
        })
      )
    }

    // Group data based on groupByField
    if (groupByField) {
      const field = groupByField
      const grouped: Record<string, any[]> = {}
      columns.forEach((col: any) => {
        if (hasState(col)) {
          // Normalize the value for comparison (same logic as column generation)
          const normalizeValue = (val: any) => {
            if (val instanceof Date) {
              return val.toISOString().split('T')[0]
            }
            if (typeof val === 'string' && !isNaN(Date.parse(val))) {
              return val.split('T')[0]
            }
            return val
          }
          // @ts-ignore - Type guard narrows col.state to string but TypeScript doesn't recognize it in index
          grouped[col.state] = filteredData.filter((item: any) => {
            const itemValue = normalizeValue(item[field])
            return String(itemValue) === col.state
          })
        }
      })
      setKanbanData(grouped)
    } else {
      // No groupByField - single column with all items
      setKanbanData({ 'all': filteredData })
    }
  }, [data, currentSearchKeyword, currentFilterValues, groupByField, columns])

  /** Resolve which column currently holds the given item id. */
  const columnIdForItem = (itemId: string): string | undefined => {
    for (const [columnId, items] of Object.entries(kanbanData)) {
      if (items.some((item: any) => String(getItemValue(item)) === itemId)) return columnId
    }
    return undefined
  }

  // The item's column is captured at drag start because `Kanban` optimistically
  // moves the item into the hovered column during drag-over, so by drag end the
  // original column is no longer derivable from state.
  const dragSourceColumnRef = useRef<string | null>(null)

  const handleDragStart = (event: any) => {
    dragSourceColumnRef.current = columnIdForItem(String(event.active.id)) ?? null
  }

  const handleDragEnd = async (event: any) => {
    if (!draggable || !groupByField || !onStateChange) return

    const { active, over } = event
    const sourceColumnId = dragSourceColumnRef.current
    dragSourceColumnRef.current = null
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)

    // `over` may be a column id or an item id — resolve both to a column id.
    const targetColumnId =
      columns.find((col: any) => String(col.id) === overId)?.id ?? columnIdForItem(overId)

    if (!sourceColumnId || !targetColumnId || sourceColumnId === targetColumnId) return

    const targetColumn = columns.find((col: any) => String(col.id) === String(targetColumnId))
    const newValue = (targetColumn as any)?.state
    if (newValue === undefined || newValue === null) return

    await onStateChange(activeId, newValue)
  }

  const handleValueChange = (newColumns: Record<string, any[]>) => {
    setKanbanData(newColumns)
  }

  // Find active item for overlay
  const getActiveItem = () => {
    for (const [columnId, items] of Object.entries(kanbanData)) {
      const item = items.find(item => getItemValue(item) === undefined)
      if (item) return { item, columnId }
    }
    return null
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>
  }

  // If no groupByField, display as horizontal flex grid
  if (!groupByField) {
    const filteredData = kanbanData['all'] || data
    return (
      <div className="w-full h-full p-4">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {filteredData.map(item => (
            <div key={getItemValue(item)} className="w-full">
              {renderCard({ id: getItemValue(item), data: item, showDragHandle: false, onCardClick: handleCardClick, onCardEdit: handleCardEdit, onCardDelete: handleCardDelete })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // With groupByField, display as Kanban columns
  return (
    <div className="w-full h-full overflow-x-auto">
      <Kanban
        value={kanbanData}
        onValueChange={handleValueChange}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        getItemValue={getItemValue}
        orientation="horizontal"
      >
        <KanbanBoard className="p-4 gap-0">
          {columns.map(column => (
            <KanbanColumn
              key={column.id}
              value={column.id}
              className={"bg-transparent border-0"}
              style={{ width: columnWidth, minWidth: columnWidth }}
            >
              <div className="flex flex-col h-full">
                {/* Column Header */}
                <div
                  className={cn(
                    "p-4 rounded-t-lg font-semibold flex items-center justify-between",
                    "bg-gradient-to-r from-gray-50 to-white border-b-2",
                    column.color === 'blue' && "border-blue-500",
                    column.color === 'green' && "border-green-500",
                    column.color === 'yellow' && "border-yellow-500",
                    column.color === 'red' && "border-red-500",
                    column.color === 'purple' && "border-purple-500",
                    column.color === 'orange' && "border-orange-500",
                    column.color === 'gray' && "border-gray-400"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full",
                        column.color === 'blue' && "bg-blue-500",
                        column.color === 'green' && "bg-green-500",
                        column.color === 'yellow' && "bg-yellow-500",
                        column.color === 'red' && "bg-red-500",
                        column.color === 'purple' && "bg-purple-500",
                        column.color === 'orange' && "bg-orange-500",
                        column.color === 'gray' && "bg-gray-400"
                      )}
                    />
                    <span className="text-gray-800">{column.title}</span>
                  </div>
                  {showCardCount && (
                    <span className={cn(
                      "text-xs font-medium px-2.5 py-1 rounded-full",
                      "bg-gray-100 text-gray-600"
                    )}>
                      {kanbanData[column.id]?.length || 0}
                    </span>
                  )}
                </div>

                {/* Column Items */}
                <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                  {(kanbanData[column.id] || []).map(item => (
                    <KanbanItem
                      key={getItemValue(item)}
                      value={getItemValue(item)}
                      className="relative group/kanban-item"
                    >
                      {draggable && (
                        <KanbanItemHandle
                          aria-label="Drag to move"
                          className="absolute left-2 top-2 z-20 rounded-md p-1 text-muted-foreground/40 transition-opacity hover:bg-muted hover:text-foreground md:opacity-0 md:group-hover/kanban-item:opacity-100 md:focus-visible:opacity-100"
                        >
                          <GripVertical className="h-4 w-4" />
                        </KanbanItemHandle>
                      )}
                      {renderCard({ id: getItemValue(item), data: item, state: column.title, showDragHandle: false, onCardClick: handleCardClick, onCardEdit: handleCardEdit, onCardDelete: handleCardDelete })}
                    </KanbanItem>
                  ))}
                </div>
              </div>
            </KanbanColumn>
          ))}
        </KanbanBoard>
        <KanbanOverlay>
          {({ value, variant }) => {
            if (variant === 'column') {
              const column = columns.find(col => col.id === value)
              return column ? (
                <div className="w-80 bg-zinc-100 rounded-lg p-4 shadow-xl">
                  <div className="font-medium">{column.title}</div>
                  <div className="text-sm text-muted-foreground">{kanbanData[column.id]?.length || 0} items</div>
                </div>
              ) : null
            }
            if (variant === 'item') {
              for (const items of Object.values(kanbanData)) {
                const item = items.find(i => getItemValue(i) === value)
                if (item) {
                  // Render the real card so the whole component follows the cursor,
                  // and disable pointer events so the overlay never blocks clicks or drops.
                  return (
                    <div
                      className="pointer-events-none cursor-grabbing opacity-90 shadow-2xl [&_*]:pointer-events-none"
                      style={{ width: columnWidth - 16 }}
                    >
                      {renderCard({
                        id: getItemValue(item),
                        data: item,
                        showDragHandle: false,
                        onCardClick: handleCardClick,
                        onCardEdit: handleCardEdit,
                        onCardDelete: handleCardDelete,
                      })}
                    </div>
                  )
                }
              }
            }
            return null
          }}
        </KanbanOverlay>
      </Kanban>
    </div>
  )
}

export * from './types'
