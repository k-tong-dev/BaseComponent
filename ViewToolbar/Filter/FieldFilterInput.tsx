'use client'

import React, {useState, useRef, useEffect} from 'react'
import {ChevronDown, Plus} from 'lucide-react'
import {DatePicker} from 'rsuite'

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

export interface FieldFilterInputProps {
    fields?: FilterField[]
    onAddFilter: (filter: FilterValue) => void
    existingFields?: string[]
    onDatePickerOpenChange?: (isOpen: boolean) => void
}

export function FieldFilterInput({
    fields = [],
    onAddFilter,
    existingFields = [],
    onDatePickerOpenChange
}: FieldFilterInputProps) {
    const [selectedField, setSelectedField] = useState<string>(
        fields.length > 0 ? fields[0].key : ''
    )
    const [selectedOperator, setSelectedOperator] = useState<FilterOperator>('equals')
    const [inputValue, setInputValue] = useState('')
    const [inputValue2, setInputValue2] = useState('') // For between operator
    const [fieldDropdownOpen, setFieldDropdownOpen] = useState(false)
    const [operatorDropdownOpen, setOperatorDropdownOpen] = useState(false)
    
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setFieldDropdownOpen(false)
                setOperatorDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const getField = (fieldKey: string) => {
        return fields.find(f => f.key === fieldKey)
    }

    const getAvailableOperators = (fieldType: FilterType): FilterOperator[] => {
        switch (fieldType) {
            case 'text':
                return ['equals', 'contains', 'startsWith', 'endsWith']
            case 'number':
                return ['equals', 'gt', 'lt', 'gte', 'lte', 'between']
            case 'date':
                return ['equals', 'gt', 'lt', 'gte', 'lte', 'between']
            case 'options':
                return ['equals']
            case 'boolean':
                return ['equals']
            default:
                return ['equals']
        }
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

    const handleAddFilter = () => {
        const trimmedValue = inputValue.trim()
        const trimmedValue2 = inputValue2.trim()
        
        if (selectedOperator === 'between') {
            if (trimmedValue && trimmedValue2 && selectedField) {
                const field = getField(selectedField)
                let finalValue1: any = trimmedValue
                let finalValue2: any = trimmedValue2
                
                // Convert values based on field type
                if (field?.type === 'number') {
                    finalValue1 = parseFloat(trimmedValue)
                    finalValue2 = parseFloat(trimmedValue2)
                }

                onAddFilter({
                    fieldKey: selectedField,
                    operator: selectedOperator,
                    value: [finalValue1, finalValue2]
                })
                setInputValue('')
                setInputValue2('')
            }
        } else {
            if (trimmedValue && selectedField) {
                const field = getField(selectedField)
                let finalValue: any = trimmedValue
                
                // Convert value based on field type
                if (field?.type === 'number') {
                    finalValue = parseFloat(trimmedValue)
                } else if (field?.type === 'boolean') {
                    finalValue = trimmedValue.toLowerCase() === 'true'
                }

                onAddFilter({
                    fieldKey: selectedField,
                    operator: selectedOperator,
                    value: finalValue
                })
                setInputValue('')
            }
        }
        
        // Move to next available field
        const availableFields = fields.filter(f => !existingFields.includes(f.key) && f.key !== selectedField)
        if (availableFields.length > 0) {
            setSelectedField(availableFields[0].key)
            const newOperators = getAvailableOperators(availableFields[0].type)
            setSelectedOperator(newOperators[0])
        }
    }

    const formatDate = (date: Date | null): string => {
        if (!date) return ''
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${month}/${day}/${year}`
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleAddFilter()
        }
    }

    const handleFieldSelect = (fieldKey: string) => {
        setSelectedField(fieldKey)
        setFieldDropdownOpen(false)
        const field = getField(fieldKey)
        if (field) {
            const operators = getAvailableOperators(field.type)
            setSelectedOperator(operators[0])
        }
        inputRef.current?.focus()
    }

    const handleOperatorSelect = (operator: FilterOperator) => {
        setSelectedOperator(operator)
        setOperatorDropdownOpen(false)
        inputRef.current?.focus()
    }

    const availableFields = fields.filter(f => !existingFields.includes(f.key))
    const currentField = getField(selectedField)
    const availableOperators = currentField ? getAvailableOperators(currentField.type) : []

    if (availableFields.length === 0) {
        return null
    }

    return (
        <div ref={containerRef} className="flex items-center gap-2">
            {/* Field Selector */}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setFieldDropdownOpen(!fieldDropdownOpen)}
                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 focus:outline-none focus:border-blue-500 truncate"
                >
                    {currentField?.label || 'Select Field'}
                    <ChevronDown size={14} />
                </button>
                {fieldDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 min-w-[150px]">
                        <div className="p-2">
                            <div className="flex flex-col gap-1">
                                {availableFields.map(field => (
                                    <button
                                        type="button"
                                        key={field.key}
                                        onClick={() => handleFieldSelect(field.key)}
                                        className={`text-left px-2 py-1 rounded text-sm ${
                                            selectedField === field.key 
                                                ? 'bg-blue-100 text-blue-700' 
                                                : 'hover:bg-gray-100'
                                        }`}
                                    >
                                        {field.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Operator Selector */}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setOperatorDropdownOpen(!operatorDropdownOpen)}
                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 focus:outline-none focus:border-blue-500"
                >
                    {getOperatorLabel(selectedOperator)}
                    <ChevronDown size={14} />
                </button>
                {operatorDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 min-w-[120px]">
                        <div className="p-2">
                            <div className="flex flex-col gap-1">
                                {availableOperators.map(operator => (
                                    <button
                                        type="button"
                                        key={operator}
                                        onClick={() => handleOperatorSelect(operator)}
                                        className={`text-left px-2 py-1 rounded text-sm ${
                                            selectedOperator === operator 
                                                ? 'bg-blue-100 text-blue-700' 
                                                : 'hover:bg-gray-100'
                                        }`}
                                    >
                                        {getOperatorLabel(operator)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Value Input */}
            {selectedOperator === 'between' ? (
                <div className="flex items-center gap-2">
                    {currentField?.type === 'date' ? (
                        <DatePicker
                            value={inputValue ? new Date(inputValue) : null}
                            onChange={(date) => setInputValue(formatDate(date))}
                            onOpen={() => onDatePickerOpenChange?.(true)}
                            onClose={() => onDatePickerOpenChange?.(false)}
                            placeholder="Min..."
                            style={{minWidth: '130px'}}
                        />
                    ) : (
                        <input
                            ref={inputRef}
                            type={currentField?.type === 'number' ? 'number' : 'text'}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Min..."
                            className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 min-w-[100px]"
                        />
                    )}
                    <span className="text-gray-500">and</span>
                    {currentField?.type === 'date' ? (
                        <DatePicker
                            value={inputValue2 ? new Date(inputValue2) : null}
                            onChange={(date) => setInputValue2(formatDate(date))}
                            onOpen={() => onDatePickerOpenChange?.(true)}
                            onClose={() => onDatePickerOpenChange?.(false)}
                            placeholder="Max..."
                            style={{minWidth: '130px'}}
                        />
                    ) : (
                        <input
                            type={currentField?.type === 'number' ? 'number' : 'text'}
                            value={inputValue2}
                            onChange={(e) => setInputValue2(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Max..."
                            className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 min-w-[100px]"
                        />
                    )}
                </div>
            ) : (
                currentField?.type === 'options' ? (
                    <select
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 min-w-[100px]"
                    >
                        <option value="">Select...</option>
                        {currentField?.options?.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                ) : currentField?.type === 'boolean' ? (
                    <select
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 min-w-[100px]"
                    >
                        <option value="">Select...</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                    </select>
                ) : currentField?.type === 'date' ? (
                    <DatePicker
                        value={inputValue ? new Date(inputValue) : null}
                        onChange={(date) => setInputValue(formatDate(date))}
                        onOpen={() => onDatePickerOpenChange?.(true)}
                        onClose={() => onDatePickerOpenChange?.(false)}
                        placeholder="Value..."
                        style={{minWidth: '130px'}}
                    />
                ) : (
                    <input
                        ref={inputRef}
                        type={currentField?.type === 'number' ? 'number' : 'text'}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Value..."
                        className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 min-w-[100px]"
                    />
                )
            )}

            {/* Add Button */}
            <button
                type="button"
                onClick={handleAddFilter}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 focus:outline-none"
            >
                <Plus size={14} />
                Add
            </button>
        </div>
    )
}
