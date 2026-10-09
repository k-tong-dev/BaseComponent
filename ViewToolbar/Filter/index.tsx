'use client'

import React, {useState, useEffect, useRef} from 'react'
import {Badge, Popover, Whisper} from 'rsuite'
import {Filter as FilterIcon} from 'lucide-react'
import {FieldFilterInput} from './FieldFilterInput'
import {Button} from "@/components/ui/button";

export type FilterType = 'text' | 'number' | 'date' | 'options' | 'boolean' | 'string'
export type FilterOperator = 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte' | 'between'

export interface FilterField {
    key: string
    label: string
    type: FilterType
    options?: Array<{ label: string; value: any }>
}

export interface FilterValue {
    fieldKey: string
    operator: FilterOperator
    value: any
}

export interface FilterProps {
    fields?: FilterField[]
    value?: FilterValue[]
    onChange?: (values: FilterValue[]) => void
    className?: string
}

export function Filter({
    fields = [],
    value = [],
    onChange,
    className = ""
}: FilterProps) {
    const [filterValues, setFilterValues] = useState<FilterValue[]>([])
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
    const whisperRef = useRef<any>(null)

    // Sync with external value only when it actually changes
    useEffect(() => {
        const valueStr = JSON.stringify(value)
        const filterValuesStr = JSON.stringify(filterValues)
        if (valueStr !== filterValuesStr) {
            setFilterValues(value)
        }
    }, [value])

    // Notify parent when filter values change
    useEffect(() => {
        onChange?.(filterValues)
    }, [filterValues, onChange])

    const handleAddFilter = (filterValue: FilterValue) => {
        // Check if this field already has a filter
        const existingIndex = filterValues.findIndex(f => f.fieldKey === filterValue.fieldKey)
        
        let newValue: FilterValue[]
        if (existingIndex >= 0) {
            // Update existing filter
            newValue = [...filterValues]
            newValue[existingIndex] = filterValue
        } else {
            // Add new filter
            newValue = [...filterValues, filterValue]
        }
        
        setFilterValues(newValue)
    }

    const handleRemoveFilter = (index: number) => {
        const newValue = filterValues.filter((_, i) => i !== index)
        setFilterValues(newValue)
    }

    const handleClearAll = () => {
        setFilterValues([])
    }

    const getFieldLabel = (fieldKey: string) => {
        const field = fields.find(f => f.key === fieldKey)
        return field?.label || fieldKey
    }

    const getOperatorLabel = (operator: FilterOperator) => {
        const labels: Record<FilterOperator, string> = {
            equals: '=',
            contains: 'contains',
            startsWith: 'starts with',
            endsWith: 'ends with',
            gt: '>',
            lt: '<',
            gte: '>=',
            lte: '<=',
            between: 'between'
        }
        return labels[operator] || operator
    }

    return (
        <div className={className}>
            <Whisper
                trigger="none"
                placement="bottomEnd"
                ref={whisperRef}
                speaker={
                    <Popover style={{padding: 0}}>
                        <div className="p-4 min-w-[400px] lg:max-w-[500px] sm:max-w-full">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-medium">Filters</span>
                                <div className="flex items-center gap-2">
                                    {filterValues.length > 0 && (
                                        <Button
                                            size={"xs"}
                                            color={"violet"}
                                            appearance={"primary"}
                                            onClick={handleClearAll}
                                        >
                                            Clear All
                                        </Button>
                                    )}
                                    <Button
                                        size={"xs"}
                                        onClick={() => whisperRef.current?.close()}
                                        className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>

                            {/* Filter Input */}
                            <FieldFilterInput
                                fields={fields}
                                onAddFilter={handleAddFilter}
                                existingFields={filterValues.map(f => f.fieldKey)}
                                onDatePickerOpenChange={setIsDatePickerOpen}
                            />

                            {/* Active Filters */}
                            {filterValues.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {filterValues.map((filter, index) => (
                                        <div
                                            key={`${filter.fieldKey}-${index}`}
                                            className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm"
                                        >
                                            <span className="font-medium">{getFieldLabel(filter.fieldKey)}</span>
                                            <span>{getOperatorLabel(filter.operator)}</span>
                                            <span>{String(filter.value)}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveFilter(index)}
                                                className="hover:text-blue-900 focus:outline-none ml-1"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Popover>
                }
            >
                <Badge content={filterValues.length > 0 && filterValues.length} invisible={filterValues.length <= 0 }>
                    <Button size={"md"}
                        onClick={() => whisperRef.current?.open()}
                            style={{
                                backgroundColor: "transparent",
                                borderWidth: "0.5px",
                                boxShadow: "none",
                            }}
                        className={`flex items-center gap-1 border rounded text-sm transition-colors border-gray-300 hover:bg-gray-50`}
                    >
                        <FilterIcon size={14} />
                </Button>
                </Badge>
                
            </Whisper>
        </div>
    )
}
