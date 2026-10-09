'use client'

import React, {useState, useEffect} from 'react'
import {FieldTagInput} from './FieldTagInput'

export interface SearchField {
    key: string
    label: string
    type?: 'text' | 'number' | 'date'
}

export interface SearchValue {
    fieldKey: string
    value: string
}

export interface SearchProps {
    fields?: SearchField[]
    onSearchChange?: (values: SearchValue[]) => void
    placeholder?: string
    width?: number
    className?: string
}

export function Search({
    fields = [],
    onSearchChange,
    placeholder = "Search...",
    width = 200,
    className = ""
}: SearchProps) {
    const [searchValues, setSearchValues] = useState<SearchValue[]>([])

    // Notify parent when search values change
    useEffect(() => {
        onSearchChange?.(searchValues)
    }, [searchValues, onSearchChange])

    return (
        <div className={className} style={{width}}>
            <FieldTagInput
                fields={fields}
                value={searchValues}
                onChange={setSearchValues}
                placeholder={placeholder}
            />
        </div>
    )
}
