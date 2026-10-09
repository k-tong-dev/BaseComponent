'use client'

import React, {useState, useRef, useEffect} from 'react'
import {X, ChevronDown} from 'lucide-react'

// Add scrollbar hiding styles
if (typeof document !== 'undefined') {
    const style = document.createElement('style')
    style.textContent = `
        .search-tags-scroll::-webkit-scrollbar {
            display: none;
        }
        .search-tags-scroll {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    `
    document.head.appendChild(style)
}

export interface SearchField {
    key: string
    label: string
    type?: 'text' | 'number' | 'date'
}

export interface SearchValue {
    fieldKey: string
    value: string
}

export interface FieldTagInputProps {
    fields?: SearchField[]
    value?: SearchValue[]
    onChange?: (values: SearchValue[]) => void
    placeholder?: string
    className?: string
}

export function FieldTagInput({
    fields = [],
    value = [],
    onChange,
    placeholder = "Search...",
    className = ""
}: FieldTagInputProps) {
    const [inputValue, setInputValue] = useState('')
    const [fieldDropdownOpen, setFieldDropdownOpen] = useState(false)
    const [selectedField, setSelectedField] = useState<string>(
        fields.length > 0 ? fields[0].key : 'all'
    )
    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setFieldDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const getFieldLabel = (fieldKey: string) => {
        if (fieldKey === 'all') return 'All'
        const field = fields.find(f => f.key === fieldKey)
        return field?.label || fieldKey
    }

    const handleAddTag = () => {
        const trimmedValue = inputValue.trim()
        if (trimmedValue) {
            // Check if this field already has a value
            const existingIndex = value.findIndex(v => v.fieldKey === selectedField)
            
            let newValue: SearchValue[]
            if (existingIndex >= 0) {
                // Update existing tag
                newValue = [...value]
                newValue[existingIndex] = {fieldKey: selectedField, value: trimmedValue}
            } else {
                // Add new tag
                newValue = [...value, {fieldKey: selectedField, value: trimmedValue}]
            }
            
            onChange?.(newValue)
            setInputValue('')
        }
    }

    const handleRemoveTag = (index: number) => {
        const newValue = value.filter((_, i) => i !== index)
        onChange?.(newValue)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleAddTag()
        } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
            // Remove last tag when backspace is pressed on empty input
            handleRemoveTag(value.length - 1)
        }
    }

    const handleFieldSelect = (fieldKey: string) => {
        setSelectedField(fieldKey)
        setFieldDropdownOpen(false)
        inputRef.current?.focus()
    }

    return (
        <div ref={containerRef} className={`flex items-center border border-gray-300 rounded px-3 py-1 focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500 ${className}`}>
            {/* Field Selector */}
            {fields.length > 0 && (
                <div className="relative mr-2">
                    <button
                        type="button"
                        onClick={() => setFieldDropdownOpen(!fieldDropdownOpen)}
                        className="flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700 focus:outline-none"
                    >
                        {getFieldLabel(selectedField)}
                        <ChevronDown size={14} />
                    </button>
                    {fieldDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 min-w-[150px]">
                            <div className="p-2">
                                <div className="text-xs text-muted-foreground mb-2">Search in:</div>
                                <div className="flex flex-col gap-1">
                                    <button
                                        type="button"
                                        onClick={() => handleFieldSelect('all')}
                                        className={`text-left px-2 py-1 rounded text-sm ${
                                            selectedField === 'all' 
                                                ? 'bg-violet-100 text-violet-700' 
                                                : 'hover:bg-gray-100'
                                        }`}
                                    >
                                        All Fields
                                    </button>
                                    {fields.map(field => (
                                        <button
                                            type="button"
                                            key={field.key}
                                            onClick={() => handleFieldSelect(field.key)}
                                            className={`text-left px-2 py-1 rounded text-sm ${
                                                selectedField === field.key 
                                                    ? 'bg-violet-100 text-violet-700' 
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
            )}

            {/* Tags */}
            <div 
                className="flex items-center gap-2 flex-1 overflow-x-auto search-tags-scroll"
            >
                {value.map((tag, index) => (
                    <div
                        key={`${tag.fieldKey}-${index}`}
                        className="flex items-center gap-1 bg-violet-100 text-violet-700 px-2 py-1 rounded text-sm flex-shrink-0"
                    >
                        <span className="font-medium">{getFieldLabel(tag.fieldKey)}:</span>
                        <span>{tag.value}</span>
                        <button
                            type="button"
                            onClick={() => handleRemoveTag(index)}
                            className="hover:text-violet-900 focus:outline-none"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}

                {/* Input */}
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={value.length === 0 ? placeholder : ''}
                    className="flex-1 min-w-[100px] outline-none text-sm flex-shrink-0"
                />
            </div>
        </div>
    )
}
