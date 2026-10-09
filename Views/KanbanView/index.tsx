'use client'

import React, { useState, useMemo, useRef } from 'react'
import { Kanban, KanbanBoard, KanbanColumn, KanbanItem, KanbanOverlay } from './kanban'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from 'rsuite'
import { Search } from 'lucide-react'
import { KanbanViewProps, KanbanMode, KanbanColumn as KanbanColumnType } from './types'
import { cn } from '@/lib/utils'

export function KanbanView({ config, loading, showFilterPanel, setShowFilterPanel, searchKeyword, setSearchKeyword, filterValues, groupByField, onCardClick: externalOnCardClick, onCardEdit: externalOnCardEdit, onCardDelete: externalOnCardDelete }: KanbanViewProps & { showFilterPanel?: boolean; setShowFilterPanel?: (show: boolean) => void; searchKeyword?: string; setSearchKeyword?: (keyword: string) => void; filterValues?: {fieldKey: string; operator: string; value: any}[]; groupByField?: string }) {
  const {
    data,
    onCardClick: configOnCardClick,
    onCardEdit: configOnCardEdit,
    onCardDelete: configOnCardDelete,
    onStateChange,
    renderCard,
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
        title: String(value),
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
  const currentFilterValues = filterValues || []

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

  const handleDragEnd = async (event: any) => {
    if (!draggable || !groupByField || !onStateChange) return

    const { active, over } = event
    if (!over) return

    const activeColumn = columns.find((col: any) => col.id === active.id)
    const overColumn = columns.find((col: any) => col.id === over.id)

    if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) return

    // Find the item being moved
    const movedItem = kanbanData[activeColumn.id]?.find((item: any) => getItemValue(item) === active.data?.current?.value)
    if (!movedItem) return

    // Update the item's groupByField value
    const newValue = (overColumn as any).state
    if (newValue && groupByField) {
      await onStateChange(getItemValue(movedItem), newValue)
    }
  }

  const handleValueChange = (newColumns: Record<string, any[]>) => {
    setKanbanData(newColumns)
  }

  const getItemValue = (item: any) => item.id || item._id

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
        <div className="flex flex-wrap gap-4">
          {filteredData.map(item => (
            <div key={getItemValue(item)} style={{ width: cardWidth }}>
              {renderCard({ id: getItemValue(item), data: item, onCardClick: handleCardClick, onCardEdit: handleCardEdit, onCardDelete: handleCardDelete })}
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
                      asHandle={draggable}
                    >
                      {renderCard({ id: getItemValue(item), data: item, state: column.title, showDragHandle: true, onCardClick: handleCardClick, onCardEdit: handleCardEdit, onCardDelete: handleCardDelete })}
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
              for (const [columnId, items] of Object.entries(kanbanData)) {
                const item = items.find(i => getItemValue(i) === value)
                if (item) {
                  return (
                    <Card className="p-3 shadow-xl cursor-grabbing w-64">
                      <div className="space-y-2">
                        <div className="font-medium">{item.name || item.title || 'Untitled'}</div>
                        {item.description && (
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </Card>
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
