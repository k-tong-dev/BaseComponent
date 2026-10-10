import React, {useState, useEffect, useMemo, useRef} from 'react'
import {Button} from '@/components/ui/button'
import {Switch} from '@/components/ui/switch'
import {
    Table,
    Popover,
    IconButton,
    Whisper,
    InputGroup,
    Input,
    DateRangePicker,
    InputPicker,
    HStack,
    Button as RsuiteButton,
    Tag,
    Divider,
    Pagination,
    Placeholder,
    Loader,
    Checkbox,
    Center,
    Drawer,
    ButtonToolbar,
    Modal
} from 'rsuite'
import {ServerActions, ServerActionConfig, ActionContext, ConfirmationModal} from '../../Actions'

import {CiMenuKebab} from "react-icons/ci";
import {Badge} from "@/components/ui/badge";

const {Column, HeaderCell, Cell} = Table

// Types
export type FilterType = 'text' | 'number' | 'date' | 'options' | 'boolean' | 'string'
export type ViewType = 'list' | 'kanban' | 'grid' | 'gantt' | 'tree'

export interface FilterValue {
    type: FilterType
    value: any
    operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte' | 'between'
}

export interface ColumnFilter {
    columnKey: string
    values: FilterValue[]
}

export interface ListColumn {
    key: string
    title: string
    width?: number
    resizable?: boolean
    sortable?: boolean
    filterable?: boolean
    type?: 'text' | 'number' | 'date' | 'options' | 'boolean'
    filterOptions?: Array<{ label: string; value: any }>
    filterDataFetcher?: () => Promise<Array<{ label: string; value: any }>>
    filterDefault?: any
    render?: (value: any, rowData: any) => React.ReactNode
    align?: 'left' | 'center' | 'right'
    groupable?: boolean
    summary?: boolean
    summaryType?: 'sum' | 'count' | 'avg' | 'min' | 'max'
}

export interface ListViewConfig {
    title: string
    columns: ListColumn[]
    data: any[]
    showColumnToggle?: boolean
    showSearch?: boolean
    showFilters?: boolean
    showViewSwitcher?: boolean
    showExport?: boolean
    defaultVisibleColumns?: string[]
    pageSize?: number
    enableGroupBy?: boolean
    enableGanttView?: boolean
    ganttStartDateKey?: string
    ganttEndDateKey?: string
    ganttTitleKey?: string
    bulkActions?: BulkActionConfig[]
}

// BulkActionConfig is now deprecated - use ServerActionConfig instead
export interface BulkActionConfig {
    label: string
    icon?: React.ReactNode
    color?: 'blue' | 'green' | 'red' | 'orange' | 'violet' | 'yellow' | 'cyan'
    onClick: (selectedIds: string[], selectedData: any[]) => void
    show?: (selectedIds: string[], selectedData: any[]) => boolean
    confirm?: string | ((selectedIds: string[], selectedData: any[]) => string)
    helper?: string
}

// Convert BulkActionConfig to ServerActionConfig for compatibility
function convertToServerAction(config: BulkActionConfig): ServerActionConfig {
    return {
        key: config.label.toLowerCase().replace(/\s+/g, '_'),
        label: config.label,
        icon: config.icon,
        color: config.color,
        onClick: (data, context) => {
            const selectedIds = context?.selectedIds || []
            config.onClick(selectedIds, data)
        },
        show: (data, context) => {
            const selectedIds = context?.selectedIds || []
            return config.show ? config.show(selectedIds, data) : true
        },
        confirm: config.confirm ? (data, context) => {
            const selectedIds = context?.selectedIds || []
            if (typeof config.confirm === 'function') {
                return config.confirm(selectedIds, data)
            }
            return config.confirm as string
        } : undefined,
        helper: config.helper,
        mode: 'bulk'
    }
}

export interface ListViewProps {
    config: ListViewConfig
    onRowClick?: (rowData: any) => void
    onEdit?: (rowData: any) => void
    onDelete?: (rowData: any) => void
    loading?: boolean
    serverActions?: ServerActionConfig[]  // Centralized ServerActions from ResourceView
    searchValues?: {fieldKey: string; value: string}[]
    filterValues?: {fieldKey: string; operator: string; value: any}[]
    availableFields?: Array<{ key: string; label: string; type?: string }>
    groupByField?: string | null
    selectedIds?: string[]
    setSelectedIds?: (ids: string[]) => void
    onDataChange?: (data: any[]) => void  // Callback to notify parent of current filtered data
    allowEdit?: boolean  // allow row click/edit (default: true)
}

export function ListView({
                             config,
                             onRowClick,
                             onEdit,
                             onDelete,
                             loading,
                             serverActions,
                             searchValues: externalSearchValues,
                             filterValues: externalFilterValues,
                             groupByField: externalGroupByField,
                             selectedIds: externalSelectedIds,
                             setSelectedIds: externalSetSelectedIds,
                             availableFields = [],
                             onDataChange,
                             allowEdit = true,
                         }: ListViewProps) {
    const {
        columns: allColumns,
        data: initialData,
        title,
        showColumnToggle = true,
        showSearch = true,
        showFilters = true,
        showViewSwitcher = true,
        showExport = true,
        defaultVisibleColumns,
        pageSize = 20,
        enableGroupBy = false,
        enableGanttView = false,
        ganttStartDateKey,
        ganttEndDateKey,
        ganttTitleKey,
        bulkActions: configBulkActions
    } = config

    const [data, setData] = useState(initialData)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [searchKeyword, setSearchKeyword] = useState('')
    const [sortColumn, setSortColumn] = useState<string>()
    const [sortType, setSortType] = useState<'asc' | 'desc'>()
    const [viewType, setViewType] = useState<ViewType>('list')
    const [currentPage, setCurrentPage] = useState(1)
    const [limit, setLimit] = useState(pageSize)
    const [showColumnPicker, setShowColumnPicker] = useState(false)
    const [showFilterPanel, setShowFilterPanel] = useState(false)
    const [headerColumnPickerOpen, setHeaderColumnPickerOpen] = useState(false)
    const [actionsDrawerOpen, setActionsDrawerOpen] = useState(false)
    const [confirmModalOpen, setConfirmModalOpen] = useState(false)
    const [confirmModalConfig, setConfirmModalConfig] = useState<{
        message: string
        onConfirm: () => void
    } | null>(null)
    const [actionContext, setActionContext] = useState<ActionContext>({
        mode: 'bulk',
        view: 'list',
        selectedIds: selectedIds
    })

    // Use external state if provided (from ResourceView), otherwise use local state
    const currentSearchValues = externalSearchValues !== undefined ? externalSearchValues : []
    const currentFilterValues = externalFilterValues !== undefined ? externalFilterValues : []
    const currentGroupByField = externalGroupByField !== undefined ? externalGroupByField : null
    const currentSelectedIds = externalSelectedIds !== undefined ? externalSelectedIds : selectedIds
    const setCurrentSelectedIds = externalSetSelectedIds || setSelectedIds

    // Update action context when selectedIds change
    useEffect(() => {
        setActionContext(prev => ({
            ...prev,
            selectedIds: currentSelectedIds
        }))
    }, [currentSelectedIds])

    const [groupColumn, setGroupColumn] = useState<string>()
    const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([])
    const [pendingFilters, setPendingFilters] = useState<ColumnFilter[]>([])
    const [dynamicFilterData, setDynamicFilterData] = useState<Record<string, Array<{ label: string; value: any }>>>({})
    const [visibleColumns, setVisibleColumns] = useState<ListColumn[]>(
        defaultVisibleColumns
            ? allColumns.filter(col => defaultVisibleColumns.includes(col.key))
            : allColumns
    )

    // Initialize filters with default values
    useEffect(() => {
        const defaultFilters: ColumnFilter[] = []
        allColumns.forEach(column => {
            if (column.filterable && column.filterDefault !== undefined) {
                let filterValue: FilterValue
                switch (column.type) {
                    case 'boolean':
                        filterValue = {type: 'boolean', value: column.filterDefault}
                        break
                    case 'number':
                        filterValue = {type: 'number', value: column.filterDefault, operator: 'equals'}
                        break
                    case 'options':
                        filterValue = {type: 'options', value: column.filterDefault}
                        break
                    case 'text':
                        filterValue = {type: 'string', value: column.filterDefault, operator: 'contains'}
                        break
                    default:
                        filterValue = {type: 'string', value: column.filterDefault, operator: 'equals'}
                }
                defaultFilters.push({columnKey: column.key, values: [filterValue]})
            }
        })
        if (defaultFilters.length > 0) {
            setColumnFilters(defaultFilters)
            setPendingFilters(defaultFilters)
        }
    }, [allColumns])

    // Update data when config changes
    useEffect(() => {
        setData(initialData)
    }, [initialData])

    // Fetch dynamic filter data on mount
    useEffect(() => {
        const fetchDynamicData = async () => {
            const data: Record<string, Array<{ label: string; value: any }>> = {}
            for (const column of allColumns) {
                if (column.filterDataFetcher) {
                    try {
                        const options = await column.filterDataFetcher()
                        data[column.key] = options
                    } catch (error) {
                        console.error(`Failed to fetch filter data for ${column.key}:`, error)
                    }
                }
            }
            setDynamicFilterData(data)
        }
        fetchDynamicData()
    }, [allColumns])

    // Apply search, filters, and sorting
    const filteredData = useMemo(() => {
        let result = [...data]

        // Filter out group rows if present
        result = result.filter(item => !item._isGroup)

        // Apply search with field-based values (AND logic - match all search values)
        if (currentSearchValues.length > 0) {
            result = result.filter(item =>
                currentSearchValues.every(searchValue => {
                    if (searchValue.fieldKey === 'all') {
                        // Search across all fields
                        return Object.keys(item).some(key =>
                            String(item[key]).toLowerCase().includes(searchValue.value.toLowerCase())
                        )
                    } else {
                        // Search specific field
                        return String(item[searchValue.fieldKey]).toLowerCase().includes(searchValue.value.toLowerCase())
                    }
                })
            )
        }

        // Apply new filter values from Filter component (AND logic - match all filters)
        if (currentFilterValues.length > 0) {
            result = result.filter(item =>
                currentFilterValues.every(filterValue => {
                    const value = item[filterValue.fieldKey]
                    const filterVal = filterValue.value
                    
                    switch (filterValue.operator) {
                        case 'equals':
                            // Use number comparison if filter value is a number
                            if (typeof filterVal === 'number') {
                                return Number(value) === filterVal
                            }
                            // Handle boolean comparison
                            if (typeof filterVal === 'boolean') {
                                return Boolean(value) === filterVal
                            }
                            // Handle date comparison - convert both to date and compare
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
                            // filterVal should be an array [min, max] for between
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

        // Apply column filters
        columnFilters.forEach(filter => {
            const column = allColumns.find(col => col.key === filter.columnKey)
            if (!column) return

            filter.values.forEach(filterValue => {
                result = result.filter(item => {
                    const value = item[filter.columnKey]
                    switch (filterValue.type) {
                        case 'text':
                            if (filterValue.operator === 'contains') {
                                return String(value).toLowerCase().includes(String(filterValue.value).toLowerCase())
                            } else if (filterValue.operator === 'equals') {
                                return String(value) === String(filterValue.value)
                            }
                            return true
                        case 'number':
                            if (filterValue.operator === 'gt') return Number(value) > Number(filterValue.value)
                            if (filterValue.operator === 'lt') return Number(value) < Number(filterValue.value)
                            if (filterValue.operator === 'gte') return Number(value) >= Number(filterValue.value)
                            if (filterValue.operator === 'lte') return Number(value) <= Number(filterValue.value)
                            if (filterValue.operator === 'equals') return Number(value) === Number(filterValue.value)
                            return true
                        case 'options':
                            return filterValue.value.includes(value)
                        case 'boolean':
                            return Boolean(value) === Boolean(filterValue.value)
                        case 'date':
                            // Date comparison
                            const dateValue = new Date(value)
                            if (filterValue.operator === 'between' && Array.isArray(filterValue.value) && filterValue.value.length === 2) {
                                const startDate = new Date(filterValue.value[0])
                                const endDate = new Date(filterValue.value[1])
                                // Set end date to end of day for inclusive comparison
                                endDate.setHours(23, 59, 59, 999)
                                return dateValue >= startDate && dateValue <= endDate
                            }
                            const filterDate = new Date(filterValue.value)
                            if (filterValue.operator === 'gt') return dateValue > filterDate
                            if (filterValue.operator === 'lt') return dateValue < filterDate
                            if (filterValue.operator === 'equals') return dateValue.getTime() === filterDate.getTime()
                            return true
                        default:
                            return true
                    }
                })
            })
        })

        // Apply sorting
        if (sortColumn && sortType) {
            result.sort((a, b) => {
                const aVal = a[sortColumn]
                const bVal = b[sortColumn]
                if (aVal < bVal) return sortType === 'asc' ? -1 : 1
                if (aVal > bVal) return sortType === 'asc' ? 1 : -1
                return 0
            })
        }

        return result
    }, [data, currentSearchValues, currentFilterValues, sortColumn, sortType, columnFilters, allColumns])

    // Notify parent of current filtered data for export
    useEffect(() => {
        if (onDataChange) {
            onDataChange(filteredData)
        }
    }, [filteredData, onDataChange])

    // Pagination
    const totalPages = Math.ceil(filteredData.length / limit)
    const paginatedData = filteredData.slice(
        (currentPage - 1) * limit,
        currentPage * limit
    ).map((item, index) => ({
        ...item,
        _index: (currentPage - 1) * limit + index + 1
    }))

    // Transform data to tree structure when grouped
    const groupedTreeData = useMemo(() => {
        if (!currentGroupByField) return paginatedData

        // Group data by the selected field
        const grouped: Record<string, any[]> = {}
        filteredData.forEach(item => {
            const groupValue = item[currentGroupByField] || 'Uncategorized'
            if (!grouped[groupValue]) {
                grouped[groupValue] = []
            }
            grouped[groupValue].push(item)
        })

        // Convert to tree structure
        const tree: any[] = []
        Object.keys(grouped).forEach((groupValue, groupIndex) => {
            const groupItem = {
                id: `group-${groupIndex}-${String(groupValue).replace(/[^a-zA-Z0-9]/g, '-')}`,
                [currentGroupByField]: groupValue,
                _isGroup: true,
                children: grouped[groupValue].map((item, childIndex) => ({
                    ...item,
                    _originalId: item.id || item._id || childIndex,
                    id: `${item.id || item._id || childIndex}-${groupIndex}`
                }))
            }
            tree.push(groupItem)
        })

        return tree
    }, [filteredData, currentGroupByField, paginatedData])

    const handleSort = (columnKey: string) => {
        if (sortColumn === columnKey) {
            setSortType(sortType === 'asc' ? 'desc' : 'asc')
        } else {
            setSortColumn(columnKey)
            setSortType('asc')
        }
    }

    const handleSortColumn = (dataKey: string, sortType?: any) => {
        setSortColumn(dataKey)
        if (sortType) setSortType(sortType)
    }

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setCurrentSelectedIds(paginatedData.map(row => row.id || row._id))
        } else {
            setCurrentSelectedIds([])
        }
    }

    const handleSelectRow = (id: string, checked: boolean, rowData?: any) => {
        // Use original ID for selection tracking
        const selectionId = rowData?._originalId || id
        
        // Handle group row selection - select/deselect all children
        if (rowData?._isGroup && rowData.children) {
            const childIds = rowData.children.map((child: any) => child._originalId || child.id || child._id)
            if (checked) {
                // Add group ID and all child IDs
                const newIds = [...currentSelectedIds]
                if (!newIds.includes(selectionId)) {
                    newIds.push(selectionId)
                }
                childIds.forEach((childId: string) => {
                    if (!newIds.includes(childId)) {
                        newIds.push(childId)
                    }
                })
                setCurrentSelectedIds(newIds)
            } else {
                // Remove group ID and all child IDs
                setCurrentSelectedIds(currentSelectedIds.filter(rowId => rowId !== selectionId && !childIds.includes(rowId)))
            }
        } else {
            // Handle individual row selection
            if (checked) {
                setCurrentSelectedIds([...currentSelectedIds, selectionId])
            } else {
                setCurrentSelectedIds(currentSelectedIds.filter(rowId => rowId !== selectionId))
            }
        }
    }

    const handleDeleteSelected = () => {
        if (currentSelectedIds.length === 0) {
            alert('Please select at least one row to delete')
            return
        }
        if (confirm(`Delete ${currentSelectedIds.length} selected records?`)) {
            currentSelectedIds.forEach(id => {
                const row = data.find(r => (r.id || r._id) === id)
                if (row && onDelete) {
                    onDelete(row)
                }
            })
            setCurrentSelectedIds([])
        }
    }

    const toggleColumn = (columnKey: string) => {
        if (visibleColumns.find(col => col.key === columnKey)) {
            setVisibleColumns(prev => prev.filter(col => col.key !== columnKey))
        } else {
            const column = allColumns.find(col => col.key === columnKey)
            if (column) {
                setVisibleColumns(prev => [...prev, column])
            }
        }
    }

    const handleAddPendingFilter = (columnKey: string, filterValue: FilterValue) => {
        // Don't add empty filters
        if (filterValue.value === '' || filterValue.value === null || filterValue.value === undefined) {
            setPendingFilters(prev => {
                const existingFilter = prev.find(f => f.columnKey === columnKey)
                if (existingFilter) {
                    // Remove only the specific operator value, keep other operators
                    const remainingValues = existingFilter.values.filter(v => v.operator !== filterValue.operator)
                    if (remainingValues.length === 0) {
                        return prev.filter(f => f.columnKey !== columnKey)
                    }
                    return prev.map(f =>
                        f.columnKey === columnKey
                            ? {...f, values: remainingValues}
                            : f
                    )
                }
                return prev
            })
            return
        }

        setPendingFilters(prev => {
            const existingFilter = prev.find(f => f.columnKey === columnKey)
            if (existingFilter) {
                // For boolean, text, and options filters, replace the value instead of appending
                if (filterValue.type === 'boolean' || filterValue.type === 'text' || filterValue.type === 'options') {
                    return prev.map(f =>
                        f.columnKey === columnKey
                            ? {...f, values: [filterValue]}
                            : f
                    )
                }
                // For number filters, replace the specific operator value
                if (filterValue.type === 'number') {
                    return prev.map(f =>
                        f.columnKey === columnKey
                            ? {
                                ...f,
                                values: [...f.values.filter(v => v.operator !== filterValue.operator), filterValue]
                            }
                            : f
                    )
                }
                return prev.map(f =>
                    f.columnKey === columnKey
                        ? {...f, values: [...f.values, filterValue]}
                        : f
                )
            } else {
                return [...prev, {columnKey, values: [filterValue]}]
            }
        })
    }

    const handleApplyFilters = () => {
        setColumnFilters(pendingFilters)
    }

    const handleClearPendingFilters = () => {
        setPendingFilters(columnFilters)
    }

    const handleClearAllFilters = () => {
        setPendingFilters([])
        setColumnFilters([])
    }

    const getActiveFilterCount = () => {
        return columnFilters.reduce((count, filter) => count + filter.values.length, 0)
    }

    const getPendingFilterCount = () => {
        return pendingFilters.reduce((count, filter) => count + filter.values.length, 0)
    }

    // Transform data for tree view (group by)
    const treeData = useMemo(() => {
        if (!groupColumn || viewType !== 'tree') return paginatedData

        const groups: Record<string, any[]> = {}
        paginatedData.forEach(row => {
            const groupValue = row[groupColumn] || 'Uncategorized'
            if (!groups[groupValue]) {
                groups[groupValue] = []
            }
            groups[groupValue].push(row)
        })

        return Object.entries(groups).map(([groupKey, rows]) => ({
            id: groupKey,
            [groupColumn]: groupKey,
            _children: rows,
            _isGroup: true
        }))
    }, [paginatedData, groupColumn, viewType])

    // Render loading state
    const renderLoading = () => {
        return (
            <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                background: 'var(--rs-bg-card)',
                padding: 20,
                zIndex: 1
            }}>
                <Placeholder.Grid rows={10} columns={visibleColumns.length + 2} active/>
            </div>
        )
    }

    // Calculate column summaries
    const calculateSummary = (columnKey: string, summaryType?: 'sum' | 'count' | 'avg' | 'min' | 'max') => {
        if (!summaryType) return null

        const values = filteredData.map(row => row[columnKey]).filter(v => v !== null && v !== undefined && !isNaN(Number(v)))

        if (values.length === 0) return null

        switch (summaryType) {
            case 'sum':
                return values.reduce((acc, val) => acc + Number(val), 0)
            case 'count':
                return values.length
            case 'avg':
                return values.reduce((acc, val) => acc + Number(val), 0) / values.length
            case 'min':
                return Math.min(...values.map(Number))
            case 'max':
                return Math.max(...values.map(Number))
            default:
                return null
        }
    }

    // Reorder columns to move grouped column to first position
    const orderedColumns = useMemo(() => {
        if (!currentGroupByField) return visibleColumns
        
        const groupedColumn = visibleColumns.find(col => col.key === currentGroupByField)
        const otherColumns = visibleColumns.filter(col => col.key !== currentGroupByField)
        
        return groupedColumn ? [groupedColumn, ...otherColumns] : visibleColumns
    }, [visibleColumns, currentGroupByField])

    // Render list view
    const renderListView = () => (
        <div className="w-full overflow-x-auto pt-4">
            <Table
                height={500}
                headerHeight={80}
                data={currentGroupByField ? groupedTreeData : paginatedData}
                isTree={!!currentGroupByField}
                defaultExpandAllRows={!!currentGroupByField}
                rowKey="id"
                bordered={false}
                cellBordered={false}
                autoHeight
                hover={true}
                affixHeader
                affixHorizontalScrollbar
                onRowClick={(rowData) => onRowClick && !rowData._isGroup && onRowClick({...rowData, id: rowData._originalId || rowData.id, _id: rowData._originalId || rowData._id})}
                sortColumn={sortColumn}
                sortType={sortType}
                onSortColumn={handleSortColumn}
                loading={loading}
                renderLoading={renderLoading}
                className={"rounded-lg"}
            >
                <Column width={35} align="center" fixed resizable={false}>
                    <HeaderCell style={{padding: 0}}>
                        <Center>
                            <Checkbox
                                inline
                                className={"w-[16px]"}
                                color={"violet"}
                                checked={paginatedData.length > 0 && paginatedData.every(row => currentSelectedIds.includes(row.id || row._id))}
                                indeterminate={paginatedData.length > 0 && currentSelectedIds.length > 0 && !paginatedData.every(row => currentSelectedIds.includes(row.id || row._id))}
                                onChange={(value, checked) => handleSelectAll(checked)}
                            />
                        </Center>
                    </HeaderCell>
                    <Cell>
                        {(rowData: any) => {
                            // Handle group row checkbox state
                            if (rowData._isGroup && rowData.children) {
                                const childIds = rowData.children.map((child: any) => child._originalId || child.id || child._id)
                                const allChildrenSelected = childIds.every((id: string) => currentSelectedIds.includes(id))
                                const someChildrenSelected = childIds.some((id: string) => currentSelectedIds.includes(id))
                                
                                return (
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            checked={allChildrenSelected}
                                            color={"violet"}
                                            className={"w-[16px]"}
                                            indeterminate={someChildrenSelected && !allChildrenSelected}
                                            onChange={(value, checked, event) => {
                                                event?.stopPropagation()
                                                handleSelectRow(rowData.id || rowData._id, checked, rowData)
                                            }}
                                        />
                                    </div>
                                )
                            }
                            
                            // Handle individual row checkbox
                            return (
                                <div onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        color="violet"
                                        className={"w-[16px]"}
                                        checked={currentSelectedIds.includes(rowData._originalId || rowData.id || rowData._id)}
                                        onChange={(value, checked, event) => {
                                            event?.stopPropagation()
                                            handleSelectRow(rowData.id || rowData._id, checked, rowData)
                                        }}
                                    />
                                </div>
                            )
                        }}
                    </Cell>
                </Column>
                <Column width={50} align="center" fixed resizable={false}>
                    <HeaderCell style={{padding: 0}} className={"uppercase"}>
                        <Center>
                            <span className="text-xs text-gray-500">N<sup>o</sup></span>
                        </Center>
                    </HeaderCell>
                    <Cell>
                        {(rowData: any) => {
                            if (rowData._isGroup) return null
                            return <span className="text-sm text-gray-600">{rowData._index || '-'}</span>
                        }}
                    </Cell>
                </Column>

                <Column width={30} align="center" fixed>
                    <HeaderCell style={{padding: 0}}>
                        <Center>
                            <Whisper
                                trigger="click"
                                placement="auto"
                                speaker={
                                    <Popover style={{padding: 0}}>
                                        <div
                                            className="p-4 min-w-[300px] max-h-[400px] overflow-y-auto no-scrollbar"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="font-medium">Select Columns</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {allColumns.map(column => (
                                                    <label key={column.key}
                                                           className="flex items-center gap-2 cursor-pointer">
                                                        <Checkbox
                                                            checked={visibleColumns.some(col => col.key === column.key)}
                                                            onChange={(value, checked) => {
                                                                if (checked) {
                                                                    setVisibleColumns([...visibleColumns, column])
                                                                } else {
                                                                    setVisibleColumns(visibleColumns.filter(col => col.key !== column.key))
                                                                }
                                                            }}
                                                        />
                                                        <span className="text-sm">{column.title}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </Popover>
                                }
                                onClose={() => setHeaderColumnPickerOpen(false)}
                            >
                                <IconButton icon={<CiMenuKebab/>}
                                            appearance={headerColumnPickerOpen ? 'primary' : 'subtle'} size="xs"/>
                            </Whisper>
                        </Center>
                    </HeaderCell>
                    <Cell>
                        {/* Empty cell for column picker header */}
                    </Cell>
                </Column>

                {orderedColumns.map(column => {
                    const summary = calculateSummary(column.key, column.summaryType)
                    const isTreeColumn = currentGroupByField === column.key
                    return (
                        <Column
                            key={column.key}
                            width={column.width}
                            resizable={column.resizable !== false}
                            sortable={column.sortable}
                            align={column.align}
                            treeCol={isTreeColumn}
                        >
                            <HeaderCell className={"uppercase"}>
                                {column.summary && summary !== null ? (
                                    <div>
                                        <label>{column.title}</label>
                                        <div style={{fontSize: 14, color: '#7f03a1', fontWeight: 'bold'}}>
                                            {(() => {
                                                switch (column.summaryType) {
                                                    case 'sum': return `${summary.toLocaleString()}`
                                                    case 'count': return `${summary}`
                                                    case 'avg': return `${summary.toFixed(2)}`
                                                    case 'min': return `${summary.toLocaleString()}`
                                                    case 'max': return `${summary.toLocaleString()}`
                                                    default: return summary.toLocaleString()
                                                }
                                            })()}
                                        </div>
                                    </div>
                                ) : (
                                    column.title
                                )}
                            </HeaderCell>
                            <Cell dataKey={column.key} wordWrap={"keep-all"}>
                                {(rowData: any) => {
                                    // Show group value with count for group rows in tree column
                                    if (rowData._isGroup && isTreeColumn) {
                                        return (
                                            <div>
                                                <Badge content={rowData.children?.length || 0}
                                                       placement="topEnd">
                                                    <span>{rowData[currentGroupByField]}</span>
                                                </Badge>
                                            </div>
                                        )
                                    }
                                    // Don't show values for group rows in other columns
                                    if (rowData._isGroup) {
                                        return null
                                    }
                                    const value = rowData[column.key]
                                    
                                    // Render boolean fields as readonly switch
                                    if (column.type === 'boolean') {
                                        return (
                                            <Switch 
                                                checked={value === true || value === 'true' || value === 1 || value === '1'}
                                                disabled={false} readOnly={true} color='violet'
                                                checkedChildren={"ON"} unCheckedChildren={"OFF"}
                                            />
                                        )
                                    }
                                    
                                    return (
                                        <div className="truncate" style={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            maxWidth: '100%'
                                        }}>
                                            {column.render ? column.render(value, rowData) : value}
                                        </div>
                                    )
                                }}
                            </Cell>
                        </Column>
                    )
                })}
            </Table>
        </div>
    )

    return (
        <div className="space-y-4">
            {/* Table content */}
            {loading ? (
                <Loader backdrop content={"Loading..."} vertical />
            ) : (
                renderListView()
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{padding: 20}}>
                    <Pagination
                        prev
                        next
                        first
                        last
                        ellipsis
                        boundaryLinks
                        maxButtons={5}
                        size="xs"
                        layout={['total', '-', 'limit', '|', 'pager', 'skip']}
                        total={filteredData.length}
                        limitOptions={[10, 20, 30, 50]}
                        limit={limit}
                        activePage={currentPage}
                        onChangePage={setCurrentPage}
                        onChangeLimit={(newLimit) => {
                            setLimit(newLimit)
                            setCurrentPage(1)
                        }}
                    />
                </div>
            )}
        </div>
    )
}
