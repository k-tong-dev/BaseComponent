'use client'

import { Suspense, useState, useEffect, useCallback, type ReactNode } from 'react'
import {useRouter, useSearchParams} from 'next/navigation'
import {Breadcrumb, Dropdown, Loader, Popover, Whisper, Drawer, Tabs, Tab} from 'rsuite'
import type { StorageFile } from '@/components/Base/Asset/types'
import type { UploadedFile } from '@/components/Base/Fields/File'
import {
    ActionBar,
    ActionBarItem,
    ActionBarGroup,
    ActionBarSeparator,
    ActionBarSelection,
    ActionBarClose
} from '@/components/ui/action-bar'
import {Button} from '@/components/ui/button'
import {Input, NumberInput} from '@/components/ui/input'
import {
    SelectionField,
    Many2ManyField,
    Many2OneField,
    One2ManyField,
    BooleanField,
    StringField,
    NumberField,
    TextareaField,
    HtmlField,
    JsonField,
    DateField,
    DatetimeField,
    TimeField,
    YearField,
    MonthField,
    DayField,
    FileField,
} from '@/components/Base/Fields'
import {Save, X, Plus, ChevronLeft, ChevronRight} from 'lucide-react'
import { showToast } from '@/lib/ui/toast'
import {IoMdCloudDone, IoMdSettings, IoMdArrowBack} from "react-icons/io";
import {BsTools} from "react-icons/bs";

import type { ServerActionConfig } from '../../Actions'
import {ServerActions, ActionContext} from '../../Actions'
import { getWidget, registerWidget, fieldWidgets } from '../../Fields/Widgets'
import { Many2ManyWidget } from '../../Fields/Widgets/Many2ManyWidget'
import { One2ManyWidget } from '../../Fields/Widgets/One2ManyWidget'
import { Many2OneWidget } from '../../Fields/Widgets/Many2OneWidget'
import { TagSelectWidget } from '@/components/Base/Fields/Widgets/TagSelectWidget'
import { One2ManyListWidget } from '../../Fields/Widgets/One2ManyListWidget'
import {Switch} from "@/components/ui/switch";
import { showWizardWarning, showWizardError, Wizard } from '../../Wizard'

// Register widgets on module load
registerWidget(Many2ManyWidget as any)
registerWidget(One2ManyWidget as any)
registerWidget(Many2OneWidget as any)
registerWidget(TagSelectWidget as any)
registerWidget(One2ManyListWidget as any)



// Generic field types for the FormView
export interface FormField {
    key: string
    label: string
    type: 'number' | 'file' | 'array' | 'json' | 'checkbox' | 'boolean' | 'toggle' | 'date' | 'datetime' | 'time' | 'year' | 'month' | 'day' | 'one2many' | 'many2many' | 'many2one' | 'selection' | 'string' | 'html'
    required?: boolean
    readonly?: boolean
    helper?: string
    placeholder?: string
    options?: Array<{ label: string; value: string }>
    validation?: (value: any) => string | null
    className?: string
    columnWidth?: number
    rows?: number
    accept?: string
    width?: string
    icon?: React.ReactNode
    component?: React.ComponentType<any>  // Custom component
    uploadText?: string
    maxFiles?: number  // Max files allowed (1 = single-file mode, replacing old on upload)
    order?: number
    after?: string
    before?: string
    groupNumber?: number
    groupColumn?: number
    widget?: string  // Field widget name (e.g., 'many2many_list', 'many2one', 'one2many')
    widgetConfig?: any  // Widget-specific configuration
    show?: (data: any) => boolean  // Conditional visibility
    // New Fields system options
    fetchUrl?: string
    multiple?: boolean
    groupBy?: string
    tree?: boolean
    searchable?: boolean
    size?: 'sm' | 'md' | 'lg'
    selectOptions?: Array<{ id: string | number; name: string; avatar?: string; group?: string; children?: any[] }>
}

// Custom page configuration for form pages (like Odoo)
export interface FormPage {
    key: string
    label: string
    icon?: ReactNode
    component?: React.ComponentType<{data: any; onDataChange: (data: any) => void}>  // Optional custom component
    fields?: FormField[]  // Optional fields to render on this page
    show?: (data: any) => boolean
    order?: number
}

// Form configuration for different entities
export interface FormConfig {
    entityName: string
    entityNamePlural: string
    apiEndpoint: string

    fields: FormField[]
    pages?: FormPage[]  // Custom pages with components or fields (like Odoo)
    actions?: {  // Made optional - now using centralized serverActions from ResourceView
        print?: boolean
        export?: boolean
        duplicate?: boolean
        copy?: boolean
        archive?: boolean
        delete?: boolean
    }
    customActions?: Array<{
        key: string
        label: string
        icon?: React.ReactNode | (() => React.ReactNode)
        onClick: (data: any) => void
        mode?: 'create' | 'edit' | 'both'
        variant?: 'default' | 'primary' | 'danger' | 'success' | 'warning' | 'info'
        className?: string
        badge?: string | number
        readonly?: boolean
        helper?: string
    }>
    breadcrumbs: {
        base: string
        list: string
        create: string
        edit: string
    }
}

// Generic entity type
export interface Entity {
    id?: string

    [key: string]: any
}

// Mutable entity type for form state
export type MutableEntity = {
    [key: string]: any
}

interface FormViewProps<T extends Entity> {
    mode: 'create' | 'edit'
    config: FormConfig
    initialData?: T | null
    entityId?: string
    serverActions?: ServerActionConfig[]  // Centralized ServerActions from ResourceView
    availableFields?: Array<{ key: string; label: string; type?: string }>
    onPrint?: (data: any[], mode: 'single' | 'bulk', title: string, template?: React.ComponentType<any>) => void
    recordIds?: (string | number)[]  // ordered list for prev/next navigation
    onNavigate?: (recordId: string | number) => void  // navigate to a specific record
    onRefresh?: () => void  // trigger parent data refresh
    readonly?: boolean  // make all fields read-only and hide save bar
}

export function FormView<T extends Entity>(props: FormViewProps<T>) {
  return (
    <Suspense fallback={<div className="p-8"><Loader center /></div>}>
      <FormViewContent {...props} />
    </Suspense>
  )
}

function FormViewContent<T extends Entity>({mode, config, initialData, entityId, serverActions, availableFields = [], onPrint, recordIds, onNavigate, onRefresh, readonly: formReadonly = false}: FormViewProps<T>) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [data, setData] = useState<MutableEntity>({} as MutableEntity)
    const [originalData, setOriginalData] = useState<MutableEntity | null>(null)
    const [hasChanges, setHasChanges] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
    const [showQuickActions, setShowQuickActions] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [activePageTab, setActivePageTab] = useState('')
    const [actionContext, setActionContext] = useState<ActionContext>({
        mode: 'single',
        view: 'form',
        record: data,
        apiEndpoint: config.apiEndpoint
    })
    const [showUnsavedWarning, setShowUnsavedWarning] = useState(false)
    const [pendingUnsavedAction, setPendingUnsavedAction] = useState<{ onDiscard: () => void } | null>(null)

    const [internalRecordIds, setInternalRecordIds] = useState<(string | number)[] | null>(null)
    const resolvedRecordIds = recordIds || internalRecordIds
    const currentId = entityId ? Number(entityId) : undefined
    const currentIndex = resolvedRecordIds && currentId !== undefined ? resolvedRecordIds.indexOf(currentId as never) : -1

    // Auto-fetch recordIds list when in edit mode if not provided via props
    useEffect(() => {
        if (mode === 'edit' && entityId && !recordIds && !internalRecordIds) {
            fetch(config.apiEndpoint)
                .then(res => res.json())
                .then(result => {
                    const list = result.data || result
                    if (Array.isArray(list)) {
                        setInternalRecordIds(list.map((r: any) => Number(r.id)))
                    }
                })
                .catch(() => {})
        }
    }, [mode, entityId, recordIds, internalRecordIds, config.apiEndpoint])

    // Central refresh handler — re-fetches current record and updates form state
    const handleFormRefresh = useCallback(async () => {
        if (!entityId) return
        try {
            const res = await fetch(`${config.apiEndpoint}/${entityId}`)
            if (res.ok) {
                const record = await res.json()
                setData(record)
                setOriginalData(record)
                setHasChanges(false)
            } else if (res.status === 404) {
                // Record was deleted — navigate to list
                router.push(config.breadcrumbs.list)
            }
        } catch {}
        onRefresh?.()
    }, [entityId, config.apiEndpoint, onRefresh, router, config.breadcrumbs.list])

    useEffect(() => {
        setActionContext(prev => ({
            ...prev,
            record: data,
            refresh: handleFormRefresh,
        }))
    }, [data, handleFormRefresh])

    useEffect(() => {
        setMounted(true)
    }, [])

    // Initialize form data
    useEffect(() => {
        // Check for duplicate data in URL params (context system)
        const duplicateParam = searchParams.get('duplicate')
        
        
        if (mode === 'edit' && initialData) {
            // Ensure all fields from config exist in initial data, even if undefined
            const completeData: Record<string, any> = { ...initialData }
            config.fields.forEach(field => {
                if (!(field.key in completeData)) {
                    completeData[field.key] = undefined
                }
            })
            setData(completeData as MutableEntity)
            setOriginalData(completeData as MutableEntity)
            // Initialize uploadedFiles from JSON stored in file fields
            const fileFieldValues = config.fields
                .filter(f => f.type === 'file')
                .flatMap(f => {
                    const val = initialData[f.key]
                    if (!val) return []
                    if (Array.isArray(val)) return val
                    return [val]
                })
            const validFiles = fileFieldValues.filter((v): v is StorageFile => v && typeof v.id === 'string' && typeof v.url === 'string')
            console.log('[FileInit] JSON files from initialData:', validFiles)
            setUploadedFiles(validFiles)
            setLoading(false)
        } else if (mode === 'create') {
            // Initialize with default values
            let defaultData: MutableEntity = {} as MutableEntity
            let isDuplicate = false
            
            // If duplicate data exists in URL, use it as base
            if (duplicateParam) {
                try {
                    const duplicateData = JSON.parse(decodeURIComponent(duplicateParam))
                    defaultData = duplicateData as MutableEntity
                    // Clear ID to ensure it's treated as new
                    delete defaultData.id
                    isDuplicate = true
                } catch (error) {
                    showWizardError('Error parsing duplicate data', (error as Error)?.message)
                }
            }
            
            // Initialize missing fields with defaults
            config.fields.forEach(field => {
                if (defaultData[field.key] === undefined || defaultData[field.key] === null) {
                    if (field.type === 'array' || field.type === 'json') {
                        defaultData[field.key] = []
                    } else if (field.type === 'number') {
                        defaultData[field.key] = 0
                    } else if (field.type === 'toggle' || field.type === 'boolean' || field.type === 'checkbox') {
                        defaultData[field.key] = false
                    } else {
                        defaultData[field.key] = ''
                    }
                }
            })
            
            setData(defaultData)
            
            // When duplicating, don't set originalData so hasChanges remains true
            if (!isDuplicate) {
                setOriginalData(defaultData)
            } else {
                setOriginalData({} as MutableEntity) // Empty object to ensure hasChanges stays true
                setHasChanges(true)
            }
            
            setLoading(false)
        }
    }, [mode, initialData, config.fields, searchParams])

    // Check if form is valid (all required fields filled)
    const isFormValid = () => {
        for (const field of config.fields) {
            const value = data[field.key]
            
            // Only check if required field is missing or empty string
            if (field.required) {
                if (value === undefined || value === null || value === '') {
                    return false
                }
            }
            
            // Only run validation if field has a value and is not empty
            if (field.validation && value !== undefined && value !== null && value !== '') {
                const error = field.validation(value)
                if (error) {
                    return false
                }
            }
        }
        return true
    }

    // Track changes
    useEffect(() => {
        if (!originalData || !data) return

        const allFields = [
            ...config.fields,
            ...(config.pages || []).flatMap(p => p.fields || []),
        ]

        // Get original file values from originalData for all file fields
        let originalFileValues: any[] = []
        for (const field of allFields) {
            if (field.type === 'file' && originalData[field.key]) {
                const vals = Array.isArray(originalData[field.key])
                    ? originalData[field.key]
                    : [originalData[field.key]]
                originalFileValues = [...originalFileValues, ...vals.filter((v: any) => v)]
            }
        }

        // Normalize both sides to same shape before comparing
        const norm = (v: any) => ({ id: v.id, url: v.url })
        const currentFileValues = uploadedFiles.filter(f => f.url).map(norm)
        const origFileValues = originalFileValues.map(norm)
        const filesChanged = JSON.stringify(currentFileValues) !== JSON.stringify(origFileValues)

        // Check if any non-file data changed
        const dataWithoutFiles = {...data}
        const originalWithoutFiles = {...originalData}
        for (const field of allFields) {
            if (field.type === 'file') {
                delete dataWithoutFiles[field.key]
                delete originalWithoutFiles[field.key]
            }
            if (field.type === 'one2many') {
                const norm = (v: any) => JSON.stringify(Array.isArray(v) ? v : [])
                dataWithoutFiles[field.key] = norm(dataWithoutFiles[field.key])
                originalWithoutFiles[field.key] = norm(originalWithoutFiles[field.key])
                continue
            }
            if (field.type === 'many2many') {
                const norm = (v: any) => {
                    if (!Array.isArray(v)) return []
                    return v.map((x: any) => typeof x === 'string' ? x : x.id || x.value_id || x.key).filter(Boolean).sort()
                }
                const rawCurrent = dataWithoutFiles[field.key]
                const rawOrig = originalWithoutFiles[field.key]
                const normCurrent = norm(rawCurrent)
                const normOrig = norm(rawOrig)
                console.log('[FormView] norm debug:', {
                    field: field.key,
                    rawCurrent: JSON.stringify(rawCurrent),
                    rawOrig: JSON.stringify(rawOrig),
                    normCurrent: JSON.stringify(normCurrent),
                    normOrig: JSON.stringify(normOrig),
                    same: JSON.stringify(normCurrent) === JSON.stringify(normOrig),
                })
                dataWithoutFiles[field.key] = normCurrent
                originalWithoutFiles[field.key] = normOrig
            }
        }
        const dataChanged = JSON.stringify(dataWithoutFiles) !== JSON.stringify(originalWithoutFiles)

        console.log('[FormView] Data changed:', { dataChanged, dataWithoutFiles: JSON.stringify(dataWithoutFiles), originalWithoutFiles: JSON.stringify(originalWithoutFiles) })

        const isChanged = dataChanged || filesChanged

        console.log('[FormView] Final change detection result:', {
            dataChanged,
            filesChanged,
            isChanged,
            hasChanges,
            allKeys: Object.keys(dataWithoutFiles),
        })

        setHasChanges(isChanged)
        console.log('[FormView] setHasChanges called with:', isChanged)

        // Simple logging for many2many field
        const many2manyField = allFields.find(f => f.type === 'many2many' || f.type === 'one2many')
        if (many2manyField) {
            console.log('[FormView] Many2many field:', {
                fieldKey: many2manyField?.key,
                currentValue: data[many2manyField?.key],
                originalValue: originalData[many2manyField?.key],
                hasChanges
            })
        }
    }, [data, originalData, uploadedFiles, config.fields])

    const handleSubmit = async () => {
        if (formReadonly) return

        // Validate required fields
        for (const field of config.fields) {
            if (field.required && !data[field.key]) {
                showToast('error', 'Validation Error', `${field.label} is required`)
                return
            }

            if (field.validation) {
                const error = field.validation(data[field.key])
                if (error) {
                    showToast('error', 'Validation Error', error)
                    return
                }
            }
        }

        setSaving(true)

        try {
            const payload = {...data}

            // File fields: Put JSON objects directly in payload
            config.fields
                .filter(f => f.type === 'file')
                .forEach(field => {
                    const fieldFiles = uploadedFiles.filter(f => f.url)
                    if (fieldFiles.length === 0) {
                        payload[field.key] = field.maxFiles === 1 ? null : []
                    } else if (field.maxFiles === 1) {
                        payload[field.key] = fieldFiles[0] || null
                    } else {
                        payload[field.key] = fieldFiles
                    }
                })

            // Remove ID for create mode
            if (mode === 'create' && payload.id) {
                delete payload.id
            }

            const endpoint = mode === 'edit' && entityId ? `${config.apiEndpoint}/${entityId}` : config.apiEndpoint
            const method = mode === 'edit' ? 'PUT' : 'POST'

            console.log(`[FileUpload] Payload → ${method} ${endpoint}:`, JSON.stringify(payload, null, 2))

            const response = await fetch(endpoint, {
                method: method,
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            })

            const result = await response.json()
            console.log(`[FileUpload] Response ← ${method} ${endpoint}:`, result)

            if (!response.ok) {
                // Handle HTTP errors
                showToast('error', 'Error', `HTTP ${response.status}: ${result.error || result.message || 'Failed to save'}`)
                return
            }

            if (result.success) {
                if (mode === 'create') {
                    showToast('success', `${config.entityName} Created`, `${config.entityName} has been successfully created`)
                    const newId = result.data?.id
                    if (newId) {
                        router.push(`${config.breadcrumbs.edit}/${newId}/edit`)
                    } else {
                        router.push(config.breadcrumbs.list)
                    }
                } else {
                    showToast('success', `${config.entityName} Updated`, `${config.entityName} has been successfully updated`)
                    const serverData = result.data || data
                    setOriginalData(serverData)
                    setData(serverData)
                    // Reset uploadedFiles from saved server data
                    const savedFiles = config.fields
                        .filter(f => f.type === 'file' && serverData[f.key])
                        .flatMap(f => Array.isArray(serverData[f.key]) ? serverData[f.key] : [serverData[f.key]])
                    setUploadedFiles(savedFiles.filter((v: any) => v && v.url))
                    setHasChanges(false)
                }
            } else {
                // Handle API success=false response
                showToast('error', 'Error', result.error || result.message || 'Failed to save')
            }
        } catch (error) {
            showToast('error', 'Error', `An error occurred while saving ${config.entityName.toLowerCase()}`)
        } finally {
            setSaving(false)
        }
    }

    const navigateTo = (recordId: string | number) => {
        if (hasChanges) {
            setPendingUnsavedAction({
                onDiscard: () => {
                    setShowUnsavedWarning(false)
                    if (onNavigate) {
                        onNavigate(recordId)
                    } else {
                        router.push(`${config.breadcrumbs.edit}/${recordId}/edit`)
                    }
                }
            })
            setShowUnsavedWarning(true)
        } else {
            if (onNavigate) {
                onNavigate(recordId)
            } else {
                router.push(`${config.breadcrumbs.edit}/${recordId}/edit`)
            }
        }
    }

    const handlePrevious = () => {
        if (!resolvedRecordIds || resolvedRecordIds.length === 0) return
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : resolvedRecordIds.length - 1
        navigateTo(resolvedRecordIds[prevIndex])
    }

    const handleNext = () => {
        if (!resolvedRecordIds || resolvedRecordIds.length === 0) return
        const nextIndex = currentIndex < resolvedRecordIds.length - 1 ? currentIndex + 1 : 0
        navigateTo(resolvedRecordIds[nextIndex])
    }

    const handleBack = () => {
        if (hasChanges) {
            setPendingUnsavedAction({
                onDiscard: () => {
                    setShowUnsavedWarning(false)
                    router.push(config.breadcrumbs.list)
                }
            })
            setShowUnsavedWarning(true)
        } else {
            router.push(config.breadcrumbs.list)
        }
    }

    const removeFile = (index: number) => {
        const newUploadedFiles = uploadedFiles.filter((_, i) => i !== index)
        setUploadedFiles(newUploadedFiles)
        if (newUploadedFiles.length === 0) {
            config.fields
                .filter(f => f.type === 'file' && f.maxFiles === 1)
                .forEach(field => {
                    setData(prev => ({...prev, [field.key]: null}))
                })
        }
    }

    const addArrayItem = (fieldKey: string) => {
        setData({
            ...data,
            [fieldKey]: [...(data[fieldKey] || []), '']
        })
    }

    const updateArrayItem = (fieldKey: string, index: number, value: string) => {
        const updatedArray = [...(data[fieldKey] || [])]
        updatedArray[index] = value
        setData({
            ...data,
            [fieldKey]: updatedArray
        })
    }

    const removeArrayItem = (fieldKey: string, index: number) => {
        setData({
            ...data,
            [fieldKey]: data[fieldKey]?.filter((_: any, i: number) => i !== index) || []
        })
    }

    const renderField = (field: FormField) => {
        // Check conditional visibility
        if (field.show && !field.show(data)) {
            return null
        }

        const readonly = formReadonly || field.readonly
        const value = data[field.key]
        const onChange = (newValue: any) => {
            if (readonly) return
            setData({...data, [field.key]: newValue})
        }

        // Check for validation error
        let errorMessage = null
        if (field.required && (!value || value === '')) {
            errorMessage = `${field.label} is required`
        } else if (field.validation && value !== undefined && value !== null && value !== '') {
            errorMessage = field.validation(value)
        }

        // Determine if field should have error styling
        const hasError = errorMessage !== null

        // Check if field has a widget
        if (field.widget) {
            const compatibleTypes: Record<string, string[]> = {
                many2many: ['many2many', 'json', 'array'],
                many2many_list: ['many2many', 'json', 'array'],
                one2many: ['one2many', 'json', 'array'],
                one2many_list: ['one2many', 'json', 'array'],
                many2one: ['many2one', 'json', 'string'],
                tag_select: ['selection', 'string'],
            }
            const valid = compatibleTypes[field.widget]
            if (typeof window !== 'undefined' && valid && !valid.includes(field.type)) {
                showWizardWarning(
                    `Widget/type mismatch on "${field.key}"`,
                    `Widget "${field.widget}" used with type "${field.type}". Expected one of: ${valid.join(', ')}.`
                )
            }
            const WidgetComponent = getWidget(field.widget)
            if (WidgetComponent) {
                return (
                    <div>
                        <WidgetComponent
                            value={value}
                            onChange={onChange}
                            field={field}
                            data={data}
                            disabled={readonly}
                            readonly={readonly}
                        />
                        {errorMessage && (
                            <p className="text-red-500 text-xs mt-1">{errorMessage}</p>
                        )}
                    </div>
                )
            } else if (typeof window !== 'undefined') {
                showWizardWarning(
                    `Unknown widget "${field.widget}" on "${field.key}"`,
                    `No widget registered for "${field.widget}". Available: ${Object.keys(fieldWidgets).join(', ') || 'none'}. Falling through to default rendering.`
                )
            }
        }

        // Check if field has a custom component (passed directly from config)
        if (field.component) {
            const Component = field.component
            if (Component) {
                return (
                    <div>
                        <Component
                            value={value}
                            onChange={onChange}
                            data={data}
                            disabled={readonly}
                            readonly={readonly}
                        />
                        {errorMessage && (
                            <p className="text-red-500 text-xs mt-1">{errorMessage}</p>
                        )}
                    </div>
                )
            }
        }

        switch (field.type) {
            case 'number':
                return (
                    <div>
                        <NumberInput
                            value={value ?? null}
                            onChange={(val) => onChange(val ?? 0)}
                            placeholder={field.placeholder}
                            disabled={readonly}
                            error={hasError}
                            fullWidth
                            className={readonly ? 'opacity-60 cursor-not-allowed' : ''}
                            min={0}
                            controls={false}
                        />
                        {errorMessage && (
                            <p className="text-red-500 text-xs mt-1">{errorMessage}</p>
                        )}
                    </div>
                )

            case 'file':
                return (
                    <FileField
                        files={uploadedFiles}
                        maxFiles={field.maxFiles}
                        uploadText={field.uploadText}
                        label={field.label}
                        readonly={readonly}
                        error={errorMessage}
                        onRemove={removeFile}
                        onAssetSelected={(asset) => {
                            if (field.maxFiles === 1) {
                                setUploadedFiles([{ ...asset, file: undefined }])
                            } else {
                                setUploadedFiles(prev => [...prev, { ...asset, file: undefined }])
                            }
                        }}
                    />
                )

            case 'array':
                return (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">{field.label}</label>
                            {!readonly && (
                                <Button onClick={() => addArrayItem(field.key)} size="sm" className="gap-2">
                                    <Plus className="w-4 h-4"/>
                                    Add Item
                                </Button>
                            )}
                        </div>
                        {(value || []).map((item: string, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                                <Input
                                    value={item}
                                    onChange={(e) => updateArrayItem(field.key, index, e.target.value)}
                                    placeholder={field.placeholder}
                                    variant="outlined"
                                    inputSize="sm"
                                    fullWidth
                                    disabled={readonly}
                                />
                                {!readonly && (
                                    <Button
                                        onClick={() => removeArrayItem(field.key, index)}
                                        size="sm"
                                        className="p-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                                    >
                                        <X className="w-4 h-4"/>
                                    </Button>
                                )}
                            </div>
                        ))}
                        {(!value || value.length === 0) && (
                            <p className="text-muted-foreground text-sm">No items added yet</p>
                        )}
                    </div>
                )

            case 'checkbox':
                return (
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id={field.key}
                            checked={value || false}
                            onChange={(e) => onChange(e.target.checked)}
                            disabled={readonly}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor={field.key} className="text-sm font-medium">
                            {field.label}
                        </label>
                    </div>
                )

            case 'boolean':
            case 'toggle':
                return (
                    <div className="flex items-center gap-2">
                        <Switch checked={value || false}
                                color={"violet"}
                                checkedChildren={"ON"}
                                unCheckedChildren={"OFF"}
                                disabled={readonly}
                                onClick={() => !readonly && onChange(!value)}>
                        </Switch>
                    </div>
                )

            case 'date':
                return (
                    <div>
                        <DateField
                            config={{
                                name: field.key,
                                type: 'date',

                                placeholder: field.placeholder,
                                required: field.required,
                                readonly: readonly,
                                helper: field.helper,
                                size: field.size,
                            }}
                            value={value}
                            onChange={onChange}
                            error={errorMessage}
                        />
                    </div>
                )

            case 'datetime':
                return (
                    <div>
                        <DatetimeField
                            config={{
                                name: field.key,
                                type: 'datetime',

                                placeholder: field.placeholder,
                                required: field.required,
                                readonly: readonly,
                                helper: field.helper,
                                size: field.size,
                            }}
                            value={value}
                            onChange={onChange}
                            error={errorMessage}
                        />
                    </div>
                )

            case 'time':
                return (
                    <div>
                        <TimeField
                            config={{
                                name: field.key,
                                type: 'time',
                                placeholder: field.placeholder || 'HH:mm:ss',
                                required: field.required,
                                readonly: readonly,
                                helper: field.helper,
                                size: field.size,
                            }}
                            value={value}
                            onChange={onChange}
                            error={errorMessage}
                        />
                    </div>
                )

            case 'year':
                return (
                    <div>
                        <YearField
                            config={{
                                name: field.key,
                                type: 'year',

                                placeholder: field.placeholder || 'yyyy',
                                required: field.required,
                                readonly: readonly,
                                helper: field.helper,
                                size: field.size,
                            }}
                            value={value}
                            onChange={onChange}
                            error={errorMessage}
                        />
                    </div>
                )

            case 'month':
                return (
                    <div>
                        <MonthField
                            config={{
                                name: field.key,
                                type: 'month',

                                placeholder: field.placeholder || 'yyyy-MM',
                                required: field.required,
                                readonly: readonly,
                                helper: field.helper,
                                size: field.size,
                            }}
                            value={value}
                            onChange={onChange}
                            error={errorMessage}
                        />
                    </div>
                )

            case 'day':
                return (
                    <div>
                        <DayField
                            config={{
                                name: field.key,
                                type: 'day',

                                placeholder: field.placeholder || 'dd',
                                required: field.required,
                                readonly: readonly,
                                helper: field.helper,
                                size: field.size,
                            }}
                            value={value}
                            onChange={onChange}
                            error={errorMessage}
                        />
                    </div>
                )

            case 'one2many':
                return (
                    <div>
                        <One2ManyField
                            config={{
                                name: field.key,
                                type: 'one2many',
                                placeholder: field.placeholder,
                                required: field.required,
                                readonly: readonly,
                                helper: field.helper,
                                fetchUrl: field.fetchUrl,
                                size: field.size,
                            }}
                            value={value}
                            onChange={onChange}
                            error={errorMessage}
                        />
                    </div>
                )

            case 'many2many':
                return (
                    <div>
                        <Many2ManyField
                            config={{
                                name: field.key,
                                type: 'many2many',
                                placeholder: field.placeholder,
                                required: field.required,
                                readonly: readonly,
                                helper: field.helper,
                                fetchUrl: field.fetchUrl,
                                size: field.size,
                            }}
                            value={value}
                            onChange={onChange}
                            error={errorMessage}
                        />
                    </div>
                )

            case 'many2one':
                return (
                    <div>
                        <Many2OneField
                            config={{
                                name: field.key,
                                type: 'many2one',
                                placeholder: field.placeholder,
                                required: field.required,
                                readonly: readonly,
                                helper: field.helper,
                                fetchUrl: field.fetchUrl,
                                options: field.options?.map((o) => ({ id: o.value, name: o.label })),
                                size: field.size,
                            }}
                            value={value}
                            onChange={onChange}
                            error={errorMessage}
                        />
                    </div>
                )

            // New Fields system cases
            case 'selection': {
                const selOptions = field.selectOptions?.length
                    ? field.selectOptions
                    : field.options?.map((o) => ({ id: o.value, name: o.label }))
                return (
                    <div>
                        <SelectionField
                            config={{
                                name: field.key,
                                type: 'selection',

                                placeholder: field.placeholder,
                                required: field.required,
                                readonly: readonly,
                                helper: field.helper,
                                options: selOptions as any,
                                fetchUrl: field.fetchUrl,
                                multiple: field.multiple,
                                groupBy: field.groupBy,
                                tree: field.tree,
                                searchable: field.searchable,
                                size: field.size,
                            }}
                            value={value}
                            onChange={onChange}
                            error={errorMessage}
                        />
                    </div>
                )
            }

            case 'string':
                return (
                    <div>
                        <StringField
                            config={{
                                name: field.key,
                                type: 'string',

                                placeholder: field.placeholder,
                                required: field.required,
                                readonly: readonly,
                                helper: field.helper,
                                size: field.size,
                            }}
                            value={value}
                            onChange={onChange}
                            error={errorMessage}
                        />
                    </div>
                )

            case 'html':
                return (
                    <div>
                        <HtmlField
                            config={{
                                name: field.key,
                                type: 'html',

                                placeholder: field.placeholder,
                                required: field.required,
                                readonly: readonly,
                                helper: field.helper,
                                size: field.size,
                            }}
                            value={value}
                            onChange={onChange}
                            error={errorMessage}
                        />
                    </div>
                )

            default:
                return null
        }
    }

    // Group fields by groupNumber for proper grid layout
    const groupedFields = config.fields.reduce((acc, field) => {
        // Use groupNumber for grouping, default to 0 if not specified
        const groupNumber = field.groupNumber || 0
        if (!acc[groupNumber]) {
            acc[groupNumber] = []
        }
        
        // Add field to the appropriate row
        acc[groupNumber].push(field)
        
        // Sort fields within each row by groupColumn then by order
        acc[groupNumber].sort((a, b) => {
            // First sort by groupColumn if specified
            const aCol = a.groupColumn !== undefined ? a.groupColumn : 999
            const bCol = b.groupColumn !== undefined ? b.groupColumn : 999
            if (aCol !== bCol) return aCol - bCol
            
            // Then sort by order if specified
            const aOrder = a.order !== undefined ? a.order : 999
            const bOrder = b.order !== undefined ? b.order : 999
            return aOrder - bOrder
        })
        
        return acc
    }, {} as Record<number, FormField[]>)

    const formTitle = mode === 'create' ? `Create New ${config.entityName}` : formReadonly ? `View: ${data.name || config.entityName}` : `Edit: ${data.name || config.entityName}`
    const formSubtitle = mode === 'create' ? `Add a new ${config.entityName.toLowerCase()} to your catalog` : formReadonly ? `View ${config.entityName.toLowerCase()} details` : `Modify ${config.entityName.toLowerCase()} details and settings`

    return (
        <div className="relative">
            {/* Loading overlay */}
            {loading && mounted && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Loader backdrop content="Loading..." vertical />
                </div>
            )}

            {/* Saving overlay */}
            {saving && mounted && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Loader backdrop content={mode === 'create' ? 'Creating...' : 'Saving...'} vertical />
                </div>
            )}
            
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        onClick={handleBack}
                        className="gap-2 hover:gap-4"
                        style={{
                            backgroundColor: 'transparent',
                            boxShadow: 'none',
                    }}
                    >
                        <IoMdArrowBack className="w-4 h-4" />
                        Back
                    </Button>
                    {mode === 'edit' && resolvedRecordIds && resolvedRecordIds.length > 1 && (
                        <div className="flex items-center gap-1 ml-2 border-l pl-2 border-border">
                            <Button
                                size="sm"
                                onClick={handlePrevious}
                                style={{
                                    backgroundColor: 'transparent',
                                    boxShadow: 'none',
                                }}
                                className="gap-1"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {currentIndex + 1} / {resolvedRecordIds.length}
                            </span>
                            <Button
                                size="sm"
                                onClick={handleNext}
                                style={{
                                    backgroundColor: 'transparent',
                                    boxShadow: 'none',
                                }}
                                className="gap-1"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Top Action Buttons - Only in Edit Mode */}
                {mode === 'edit' && mounted && (
                    <ServerActions
                        actions={serverActions || []}
                        data={[data]}
                        context={actionContext}
                        layout="dropdown"
                        onPrint={onPrint}
                        availableFields={availableFields}
                    />
                )}
            </div>

            {/* Form Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Render grouped fields - EXCLUDE file fields */}
                    {Object.entries(groupedFields).map(([groupNumber, fields]) => {
                        // Filter out file fields from main form area
                        const nonFileFields = fields.filter(field => field.type !== 'file')
                        if (nonFileFields.length === 0) return null
                        
                        return (
                            <div key={groupNumber} className="bg-card rounded-lg border border-dashed p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {nonFileFields.map((field) => (
                                        <div 
                                            key={field.key} 
                                            className={`space-y-2 ${
                                                field.columnWidth === 2 ? 'md:col-span-2' : 
                                                field.columnWidth === 3 ? 'md:col-span-3' : 
                                                'md:col-span-1'
                                            }`}
                                            // style={{
                                            //     display: "flex",
                                            //     justifyContent: "flex-start",
                                            //     alignItems: "center",
                                            //     gap: "30px"
                                            // }}
                                        >
                                            <label className={
                                                "text-xs uppercase tracking-widest text-foreground/50 hover:text-foreground " +
                                                "font-medium " +
                                                "flex items-center gap-1 mb-2"
                                            }>
                                                {field.label}
                                                {field.required && <span className="text-red-500 ml-1">*</span>}
                                                {field.helper && (
                                                    <Whisper
                                                        placement="bottom"
                                                        trigger="click"
                                                        speaker={<Popover>{field.helper}</Popover>}
                                                    >
                                                        <button type="button" className="text-gray-400 hover:text-gray-600 focus:outline-none">
                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    </Whisper>
                                                )}
                                            </label>
                                            {renderField(field)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}

                    {/* Custom Pages - like Odoo */}
                    {config.pages && (() => {
                        const visiblePages = config.pages!
                            .filter(page => !page.show || page.show(data))
                            .sort((a: FormPage, b: FormPage) => (a.order || 0) - (b.order || 0))
                        
                        if (visiblePages.length === 0) return null
                        
                        return (
                            <div className="bg-card rounded-lg border p-6 border-dashed">
                                <Tabs appearance="subtle"
                                      color={"violet"}
                                      activeKey={activePageTab || visiblePages[0]?.key}
                                      onSelect={(eventKey) => { if (eventKey) setActivePageTab(String(eventKey)) }}>
                                    {visiblePages.map((page) => (
                                        <Tab key={page.key} eventKey={page.key} title={page.label} icon={page.icon}>
                                            {page.component ? (() => {
                                                const PageComponent = page.component
                                                return <PageComponent data={data} onDataChange={setData} />
                                            })() : page.fields ? (
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {page.fields.map((field) => (
                                                        <div 
                                                            key={field.key} 
                                                            className={`space-y-2 ${
                                                                field.columnWidth === 2 ? 'md:col-span-2' : 
                                                                field.columnWidth === 3 ? 'md:col-span-3' : 
                                                                'md:col-span-1'
                                                            }`}
                                                        >
                                                            <label className={
                                                                "text-xs uppercase tracking-widest text-foreground/50 hover:text-foreground " +
                                                                "font-medium " +
                                                                "flex items-center gap-1 mb-2"
                                                            }>
                                                                {field.label}
                                                                {field.required && <span className="text-red-500 ml-1">*</span>}
                                                                {field.helper && (
                                                                    <Whisper
                                                                        placement="bottom"
                                                                        trigger="click"
                                                                        speaker={<Popover>{field.helper}</Popover>}
                                                                    >
                                                                        <button type="button" className="text-gray-400 hover:text-gray-600 focus:outline-none">
                                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                                            </svg>
                                                                        </button>
                                                                    </Whisper>
                                                                )}
                                                            </label>
                                                            {renderField(field)}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </Tab>
                                    ))}
                                </Tabs>
                            </div>
                        )
                    })()}
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6 sticky top-[72px] self-start h-fit">
                    {/* File Upload Section */}
                    {config.fields.filter(f => f.type === 'file').length > 0 && (
                        <div className="bg-card rounded-lg border p-6 border-dashed">
                            <h2 className="text-md font-semibold mb-4">Media & Files</h2>
                            <div className="space-y-4">
                                {config.fields.filter(f => f.type === 'file').map((field) => (
                                    <div key={field.key}>
                                        <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                            {field.label}
                                            {field.required && <span className="text-red-500 ml-1">*</span>}
                                            {field.helper && (
                                                <Whisper
                                                    placement="bottom"
                                                    trigger="hover"
                                                    speaker={<Popover>{field.helper}</Popover>}
                                                >
                                                    <button type="button" className="text-gray-400 hover:text-gray-600 focus:outline-none">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </Whisper>
                                            )}
                                        </label>
                                        {renderField(field)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quick Actions - Desktop */}
                    <div className="hidden lg:block bg-card rounded-lg border p-6 border-dashed">
                        <h2 className="text-sm uppercase text-foreground/50 hover:text-foreground font-semibold mb-4">Quick Actions</h2>
                        {serverActions && serverActions.length > 0 && mounted && (
                            <ServerActions
                                actions={serverActions
                                    .filter(action => !['print', 'export_excel', 'delete', 'duplicate', 'copy_json', 'archive', 'unarchive'].includes(action.key))
                                }
                                data={[data]}
                                context={actionContext}
                                layout="inline"
                                onPrint={onPrint}
                                block
                            />
                        )}
                    </div>

                    {/* Quick Actions - Mobile Drawer */}
                    <div className="lg:hidden">
                        <Whisper
                            trigger="hover"
                            placement={"topEnd"}
                            speaker={<Popover>Quick Actions</Popover>}
                            >
                            <button
                                onClick={() => setShowQuickActions(true)}
                                // className="fixed right-4 top-1/2 -translate-y-1/2 bg-white rounded-lg border shadow-lg p-2 flex items-center justify-center hover:bg-gray-50 z-50"
                                className="fixed right-4 bottom-4 bg-white rounded-lg border shadow-lg p-2 flex items-center justify-center hover:bg-gray-50 z-50"
                            >
                                <BsTools className="w-5 h-5" />
                            </button>
                        </Whisper>

                        <Drawer open={showQuickActions}
                                onClose={() => setShowQuickActions(false)}
                                size="300px"
                                backdrop="static"
                                placement="right">
                            <Drawer.Header>
                                <Drawer.Title className={"uppercase !text-md !text-foreground/50 hover:!text-foreground"}>
                                    Quick Actions
                                </Drawer.Title>
                            </Drawer.Header>
                            <Drawer.Body>
                                {serverActions && serverActions.length > 0 && mounted && (
                                    <ServerActions
                                        actions={serverActions
                                            .filter(action => !['print', 'export_excel', 'delete', 'duplicate', 'copy_json', 'archive', 'unarchive'].includes(action.key))
                                        }
                                        data={[data]}
                                        context={actionContext}
                                        onActionComplete={() => setShowQuickActions(false)}
                                        onPrint={onPrint}
                                        layout="inline"
                                        block
                                    />
                                )}
                            </Drawer.Body>
                        </Drawer>
                    </div>
                </div>
            </div>

            {/* Unsaved Changes Warning */}
            <Wizard
                open={showUnsavedWarning}
                onClose={() => setShowUnsavedWarning(false)}
                title="Unsaved Changes"
                variant="warning"
                buttons={[
                    {
                        label: 'Discard Changes',
                        onClick: () => pendingUnsavedAction?.onDiscard(),
                        color: 'red',
                        appearance:"primary"
                    },
                    {
                        label: 'Continue Editing',
                        onClick: () => setShowUnsavedWarning(false),
                        appearance: 'subtle',
                    },
                ]}
                backdrop={"static"}
            >
                <p>You have unsaved changes. What would you like to do?</p>
            </Wizard>

            {!formReadonly && (
                <ActionBar
                    key={hasChanges ? 'has-changes' : 'no-changes'}
                    open={hasChanges}
                    onOpenChange={(open) => {
                        console.log('[FormView] ActionBar onOpenChange:', { open, hasChanges })
                        if (!open) {
                            if (hasChanges) {
                                setHasChanges(false)
                            }
                        }
                    }}
                    side="bottom"
                    align="center"
                >
                    <ActionBarSelection/>
                    <ActionBarSeparator/>
                    <ActionBarGroup>
                        <ActionBarItem
                            color="red"
                            size="sm"
                            onClick={() => {
                                if (mode === 'edit' && originalData) {
                                    setData(originalData)
                                    uploadedFiles.forEach(f => {
                                        if (typeof f.url === 'string' && f.url.startsWith('blob:')) {
                                            URL.revokeObjectURL(f.url)
                                        }
                                    })
                                    const originalFiles = config.fields
                                        .filter(f => f.type === 'file' && originalData[f.key])
                                        .flatMap(f => Array.isArray(originalData[f.key]) ? originalData[f.key] : [originalData[f.key]])
                                    setUploadedFiles(originalFiles.filter((v: any) => v && v.url))
                                    setHasChanges(false)
                                } else {
                                    uploadedFiles.forEach(f => {
                                        if (typeof f.url === 'string' && f.url.startsWith('blob:')) {
                                            URL.revokeObjectURL(f.url)
                                        }
                                    })
                                    router.push(config.breadcrumbs.list)
                                }
                            }}
                            disabled={saving}
                        >
                            Cancel
                        </ActionBarItem>
                        <ActionBarItem
                            appearance="primary"
                            color="green"
                            onClick={handleSubmit}
                            disabled={saving || !isFormValid()}
                        >
                            <IoMdCloudDone className="w-4 h-4 mr-2"/>
                            {saving ? (mode === 'create' ? 'Creating...' : 'Saving...') : (mode === 'create' ? 'Create' : 'Save')}
                        </ActionBarItem>
                    </ActionBarGroup>
                    <ActionBarClose/>
                </ActionBar>
            )}
        </div>
    )
}
