'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { SelectPicker, Button, Loader } from 'rsuite'
import { VscAdd, VscEdit } from 'react-icons/vsc'
import { FieldWidgetProps } from './index'
import { showWizardError } from '../../Wizard'

/**
 * Many2One Widget Configuration
 * Similar to Odoo's Many2One field
 */
export interface Many2OneWidgetConfig {
  relation: string           // API endpoint (e.g., '/api/dashboard/product-categories')
  displayField?: string      // Field to display (default: 'name')
  valueField?: string        // Field to use as value (default: 'id')
  searchField?: string       // Field to search (default: displayField)
  domain?: any               // Optional filter
  context?: Record<string, any>
  
  // UI options
  allowCreate?: boolean     // Allow creating new records
  allowEdit?: boolean       // Allow editing selected record
  allowClear?: boolean      // Allow clearing selection
  placeholder?: string
  
  // Search options
  searchable?: boolean      // Enable search (default: true)
  minSearchLength?: number  // Min chars to trigger search (default: 0 for preload)
  limit?: number            // Max results to show
}

/**
 * Many2One Widget - Odoo-style many-to-one relationship field
 * Single selection with optional create/edit capabilities
 */
export const Many2OneWidget: React.FC<FieldWidgetProps> = ({
  value,
  onChange,
  field,
  data: formData,
  disabled,
  readonly
}) => {
  const config = field.widgetConfig as Many2OneWidgetConfig

  // Developer validation
  if (typeof window !== 'undefined') {
    if (!config) {
      showWizardError(
        '[Many2OneWidget] Missing widgetConfig',
        'You must provide a widgetConfig with at least "relation". Example: { relation: "/api/dashboard/related-records", displayField: "name" }'
      )
    } else if (!config.relation) {
      showWizardError(
        '[Many2OneWidget] Missing "relation" in widgetConfig',
        'Example: { relation: "/api/dashboard/product-categories" }'
      )
    }
  }

  // Guard: show fallback UI instead of crashing when config is missing
  if (!config || !config.relation) {
    return (
      <div className="border border-destructive/30 rounded-md p-4 bg-destructive/5">
        <p className="text-sm text-destructive font-medium">Many2OneWidget configuration error</p>
        <p className="text-xs text-muted-foreground mt-1">
          Missing required widgetConfig property <code>relation</code>. A warning has been shown.
        </p>
      </div>
    )
  }

  const [options, setOptions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  
  const displayField = config.displayField || 'name'
  const valueField = config.valueField || 'id'
  const searchField = config.searchField || displayField
  const placeholder = config.placeholder || `Select ${field.label}...`
  const searchable = config.searchable !== false
  
  // Fetch all options on mount (or search if configured)
  useEffect(() => {
    const fetchOptions = async () => {
      if (!config.relation) return
      
      setLoading(true)
      try {
        // Build query params
        const params = new URLSearchParams()
        if (config.limit) params.append('limit', config.limit.toString())
        
        const url = `${config.relation}${params.toString() ? `?${params}` : ''}`
        const response = await fetch(url)
        const data = await response.json()
        
        const formattedOptions = data.map((item: any) => ({
          label: item[displayField],
          value: item[valueField],
          ...item
        }))
        
        setOptions(formattedOptions)
        
        // Find selected record if value exists
        if (value) {
          const selected = formattedOptions.find((o: any) => o.value === value)
          setSelectedRecord(selected || null)
        }
      } catch (error) {
        showWizardError('[Many2OneWidget] Failed to fetch options', String(error))
      } finally {
        setLoading(false)
      }
    }
    
    fetchOptions()
  }, [config.relation, config.limit, displayField, valueField])
  
  // Update selected record when value changes externally
  useEffect(() => {
    if (value) {
      const selected = options.find((o: any) => o.value === value)
      setSelectedRecord(selected || null)
    } else {
      setSelectedRecord(null)
    }
  }, [value, options])
  
  // Handle selection change
  const handleChange = useCallback((newValue: string | null) => {
    onChange(newValue)
    const selected = options.find((o: any) => o.value === newValue)
    setSelectedRecord(selected || null)
  }, [onChange, options])
  
  // Handle search
  const handleSearch = async (query: string) => {
    if (!searchable || !config.relation) return
    
    // If minSearchLength is 0, we already loaded all options
    if (config.minSearchLength === 0) return
    
    // Otherwise, search via API
    if (query.length < (config.minSearchLength || 2)) return
    
    setLoading(true)
    try {
      const response = await fetch(
        `${config.relation}?${searchField}_like=${encodeURIComponent(query)}`
      )
      const data = await response.json()
      
      setOptions(data.map((item: any) => ({
        label: item[displayField],
        value: item[valueField],
        ...item
      })))
    } catch (error) {
      showWizardError('[Many2OneWidget] Search failed', String(error))
    } finally {
      setLoading(false)
    }
  }
  
  // Handle create new
  const handleCreate = () => {
    // This would typically open a modal or navigate to create page
    console.log('[Many2OneWidget] Create new record')
    // Could emit event or call callback if provided in config
  }
  
  // Handle edit selected
  const handleEdit = () => {
    if (!selectedRecord) return
    console.log('[Many2OneWidget] Edit record:', selectedRecord.value)
    // Could emit event or call callback if provided in config
  }
  
  if (readonly) {
    return (
      <div className="px-3 py-2 border rounded bg-gray-50">
        {selectedRecord?.label || <span className="text-gray-400">-</span>}
      </div>
    )
  }
  
  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <SelectPicker
          data={options}
          value={value}
          onChange={handleChange}
          onSearch={handleSearch}
          placeholder={placeholder}
          disabled={disabled}
          block
          searchable={searchable}
          loading={loading}
          renderMenu={(menu: React.ReactNode) => (
            <>
              {menu}
              {config.allowCreate && (
                <div className="p-2 border-t">
                  <Button
                    appearance="ghost"
                    size="sm"
                    block
                    startIcon={<VscAdd />}
                    onClick={handleCreate}
                  >
                    Create New
                  </Button>
                </div>
              )}
            </>
          )}
        />
      </div>
      
      {config.allowEdit && selectedRecord && (
        <Button
          appearance="default"
          size="sm"
          onClick={handleEdit}
          disabled={disabled}
        >
          <VscEdit />
        </Button>
      )}
    </div>
  )
}

;(Many2OneWidget as any).widgetName = 'many2one'

export default Many2OneWidget
