'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Table, Button, IconButton, Input, NumberInput, Checkbox, SelectPicker } from 'rsuite'
import { VscEdit, VscSave, VscRemove, VscAdd } from 'react-icons/vsc'
import { FieldWidgetProps } from './index'
import { showWizardError } from '../../Wizard'
import {IoIosCreate} from "react-icons/io";

const { Column, HeaderCell, Cell } = Table

const styles = `
.table-cell-editing .rs-table-cell-content {
  padding: 4px;
}
.table-cell-editing .rs-input {
  width: 100%;
}
`

/**
 * One2Many Widget Configuration
 * Similar to Odoo's One2Many field
 */
export interface One2ManyWidgetConfig {
  relation: string           // API endpoint for child records (e.g., '/api/dashboard/product-variants')
  inverseField: string       // FK field in child that references parent (e.g., 'product_id')
  domain?: any               // Optional domain filter for records
  context?: Record<string, any>  // Context passed to child operations
  
  // Column definitions for inline editing
  columns: Array<{
    key: string
    title: string
    width?: number
    type?: 'string' | 'number' | 'boolean' | 'select' | 'many2one'
    editable?: boolean
    required?: boolean
    options?: Array<{ label: string; value: string }>  // For select type
    relation?: string          // For many2one type - API endpoint
    displayField?: string      // For many2one type - field to display
    valueField?: string        // For many2one type - field to use as value
  }>
  
  // Actions
  allowCreate?: boolean      // Allow creating new records inline
  allowEdit?: boolean       // Allow editing existing records
  allowDelete?: boolean     // Allow deleting records
  allowImport?: boolean     // Allow importing records
}

export const One2ManyWidget: React.FC<FieldWidgetProps> = ({
  value,
  onChange,
  field,
  data: formData,
  disabled,
  readonly
}) => {
  const config = field.widgetConfig as One2ManyWidgetConfig

  // Developer validation
  if (typeof window !== 'undefined') {
    if (!config) {
      showWizardError(
        '[One2ManyWidget] Missing widgetConfig',
        'You must provide a widgetConfig with at least "relation" and "columns". Example: { relation: "/api/dashboard/child-records", inverseField: "parent_id", columns: [...] }'
      )
    } else if (!config.columns || !Array.isArray(config.columns)) {
      showWizardError(
        '[One2ManyWidget] Missing or invalid "columns" in widgetConfig',
        'You must define the columns to display/edit. Example: columns: [{ key: "name", title: "Name", type: "string", editable: true }]'
      )
    }
  }

  // Guard: show fallback UI instead of crashing when config is missing
  if (!config || !config.columns || !Array.isArray(config.columns)) {
    return (
      <div className="border border-destructive/30 rounded-md p-4 bg-destructive/5">
        <p className="text-sm text-destructive font-medium">One2ManyWidget configuration error</p>
        <p className="text-xs text-muted-foreground mt-1">
          Missing or invalid <code>widgetConfig.columns</code>. A warning has been shown.
        </p>
      </div>
    )
  }

  const [items, setItems] = useState<any[]>(value || [])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [columnOptions, setColumnOptions] = useState<Record<string, any[]>>({})
  const parentId = formData?.id
  
  console.log('[One2ManyWidget] Config:', config)
  console.log('[One2ManyWidget] Field:', field)
  
  // Sync with external value
  useEffect(() => {
    console.log('[One2ManyWidget] Initial value set:', value)
    setItems(value || [])
  }, [value])
  
  // Fetch options for many2one columns
  useEffect(() => {
    const fetchOptions = async () => {
      const newOptions: Record<string, any[]> = {}
      
      for (const col of config.columns) {
        if (col.type === 'many2one' && col.relation) {
          try {
            const response = await fetch(col.relation)
            const data = await response.json()
            newOptions[col.key] = data.map((item: any) => ({
              label: item[col.displayField || 'name'],
              value: item[col.valueField || 'id']
            }))
          } catch (error) {
            showWizardError(`[One2ManyWidget] Failed to fetch options for ${col.key}`, String(error))
          }
        }
      }
      
      setColumnOptions(newOptions)
    }
    
    fetchOptions()
  }, [config.columns])
  
  // Notify parent of changes
  const notifyChange = useCallback((newItems: any[]) => {
    setItems(newItems)
    onChange(newItems)
  }, [onChange])
  
  // Handle add
  const handleAdd = () => {
    console.log('[One2ManyWidget] Adding new item')
    
    const newItem: any = {
      id: `temp_${Date.now()}`,
      ...config.columns.reduce((acc, col) => {
        acc[col.key] = col.type === 'boolean' ? false : ''
        return acc
      }, {} as any),
      _isNew: true
    }
    
    console.log('[One2ManyWidget] New item created:', newItem)
    setItems([...items, newItem])
  }
  
  // Handle delete
  const handleDelete = (id: string) => {
    console.log('[One2ManyWidget] Deleting item:', id)
    
    const item = items.find(i => i.id === id)
    if (!item) {
      console.log('[One2ManyWidget] Item not found:', id)
      return
    }
    
    console.log('[One2ManyWidget] Item to delete:', item)
    
    if (item._isNew) {
      // If it's a new item, just remove it
      const newItems = items.filter(i => i.id !== id)
      console.log('[One2ManyWidget] Removed new item, remaining:', newItems)
      setItems(newItems)
    } else {
      // If it's existing, mark for deletion
      const newItems = items.map(i => i.id === id ? { ...i, _toDelete: true } : i)
      console.log('[One2ManyWidget] Marked existing item for deletion:', newItems)
      setItems(newItems)
    }
  }
  
  // Handle save
  const handleSave = (id: string) => {
    console.log('[One2ManyWidget] Saving item:', id)
    
    setEditingId(null)
    const item = items.find(i => i.id === id)
    if (item && item._isNew) {
      const newItems = items.map(i => i.id === id ? { ...i, _isNew: false, _isModified: true } : i)
      console.log('[One2ManyWidget] Saved new item:', newItems)
      setItems(newItems)
    }
  }
  
  // Handle cell value change
  const handleCellChange = (id: string, dataKey: string, value: any) => {
    console.log('[One2ManyWidget] Cell change:', { id, dataKey, value })
    
    const newItems = items.map(item =>
      item.id === id ? { ...item, [dataKey]: value } : item
    )
    
    console.log('[One2ManyWidget] Items after cell change:', newItems)
    setItems(newItems)
  }
  
  // Render editable cell
  const EditableCell = ({ rowData, dataKey, column, ...props }: any) => {
    const isEditing = editingId === rowData.id && column.editable !== false
    const value = rowData[dataKey]
    
    if (!isEditing) {
      // Display mode
      if (column.type === 'boolean') {
        return <Cell {...props}>{value ? 'Yes' : 'No'}</Cell>
      }
      if (column.type === 'many2one') {
        const options = columnOptions[dataKey] || []
        const selected = options.find((o: any) => o.value === value)
        return <Cell {...props}>{selected?.label || value || '-'}</Cell>
      }
      if (column.type === 'select') {
        const selected = column.options?.find((o: any) => o.value === value)
        return <Cell {...props}>{selected?.label || value || '-'}</Cell>
      }
      return <Cell {...props}>{value || '-'}</Cell>
    }
    
    // Edit mode
    const commonProps = {
      value,
      onChange: (newValue: any) => handleCellChange(rowData.id, dataKey, newValue),
      disabled,
      size: 'sm' as const
    }
    
    return (
      <Cell {...props} className="table-cell-editing">
        {column.type === 'boolean' ? (
          <Checkbox {...commonProps} checked={value} />
        ) : column.type === 'number' ? (
          <NumberInput {...commonProps} />
        ) : column.type === 'many2one' ? (
          <SelectPicker
            {...commonProps}
            data={columnOptions[dataKey] || []}
            block
            placeholder={`Select ${column.title}...`}
          />
        ) : column.type === 'select' ? (
          <SelectPicker
            {...commonProps}
            data={column.options || []}
            block
          />
        ) : (
          <Input {...commonProps} placeholder={column.title} />
        )}
      </Cell>
    )
  }
  
  // Action cell
  const ActionCell = ({ rowData, ...props }: any) => {
    const isEditing = editingId === rowData.id
    const showEdit = config.allowEdit && !readonly && !disabled
    const showDelete = config.allowDelete && !readonly && !disabled
    
    return (
      <Cell {...props} style={{ padding: '6px', display: 'flex', gap: '4px' }}>
        {showEdit && (
          <IconButton
            appearance="subtle"
            icon={isEditing ? <VscSave /> : <VscEdit />}
            onClick={() => isEditing ? handleSave(rowData.id) : setEditingId(editingId === rowData.id ? null : rowData.id)}
            size="sm"
          />
        )}
        {showDelete && (
          <IconButton
            appearance="subtle"
            icon={<VscRemove />}
            onClick={() => handleDelete(rowData.id)}
            size="sm"
            color="red"
          />
        )}
      </Cell>
    )
  }
  
  if (readonly || disabled) {
    return (
      <div className="border rounded p-4 bg-gray-50">
        <p className="text-sm text-gray-500">
          {items.length} {items.length === 1 ? 'record' : 'records'} (read-only)
        </p>
      </div>
    )
  }
  
  return (
    <>
      <style>{styles}</style>
      <div className="space-y-2">
        {config.allowCreate && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {items.length} {items.length === 1 ? 'record' : 'records'}
            </span>
            <Button
              onClick={handleAdd}
              appearance="primary"
              size="sm"
              disabled={disabled}
              startIcon={<IoIosCreate />}
            >
              Add lines
            </Button>
          </div>
        )}
        
        {!config.allowCreate && items.length > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {items.length} {items.length === 1 ? 'record' : 'records'}
            </span>
          </div>
        )}
        
        <Table
          height={300}
          data={items}
          autoHeight={items.length === 0}
          bordered
          cellBordered
        >
          {config.columns.map((col) => (
            <Column key={col.key} flexGrow={1} width={col.width || 100}>
              <HeaderCell>{col.title}</HeaderCell>
              <EditableCell dataKey={col.key} column={col} />
            </Column>
          ))}
          
          {(config.allowEdit || config.allowDelete) && (
            <Column width={80} align="center">
              <HeaderCell>Action</HeaderCell>
              <ActionCell dataKey="id" />
            </Column>
          )}
        </Table>
        
        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500 border rounded bg-gray-50">
            <p>No records. Click "Add" to create one.</p>
          </div>
        )}
      </div>
    </>
  )
}

;(One2ManyWidget as any).widgetName = 'one2many'

export default One2ManyWidget
