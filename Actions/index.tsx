'use client'

import React, {useState} from 'react'
import {Button, Modal, Popover, Whisper, IconButton} from 'rsuite'
import {cn} from '@/lib/utils'
import {Printer, FileSpreadsheet, Trash2, Copy, Download, Archive, ArchiveRestore, Settings, Barcode} from 'lucide-react'
import {createElement} from 'react'
import {Export} from '../Export'
import {ExportConfig} from '@/components/Base/Export/types'
import { showToast } from '@/components/ui/notification'

// Built-in default ServerActions - generic utility that can be used by any resource
export const getDefaultServerActions = (flags: {
    print?: boolean
    exportExcel?: boolean
    delete?: boolean
    duplicate?: boolean
    copyJson?: boolean
    archive?: boolean
    unarchive?: boolean
} = {}, apiEndpoint?: string): ServerActionConfig[] => {
    const actions: ServerActionConfig[] = []
    
    if (flags.print !== false) {
        actions.push({
            key: 'print',
            label: 'Print',
            icon: createElement(Printer, {size: 16}),
            color: 'blue',
            mode: 'both',
            helper: 'Print this record',
            onClick: async (data, context) => {
                window.print()
            }
        })
    }
    
    if (flags.exportExcel !== false) {
        actions.push({
            key: 'export_excel',
            label: 'Export',
            icon: createElement(FileSpreadsheet, {size: 16}),
            color: 'green',
            mode: 'both',
            helper: 'Export records to Excel or CSV',
            onClick: async (data, context) => {
                // This will be handled by the parent component that shows the Export modal
                // The action key will trigger the modal in ServerActions component
            }
        })
    }
    
    if (flags.delete !== false) {
        actions.push({
            key: 'delete',
            label: 'Delete',
            icon: createElement(Trash2, {size: 16}),
            color: 'red',
            mode: 'both',
            confirm: (data, context) => {
                if (context?.mode === 'bulk') {
                    return `Delete ${context.selectedIds?.length || data.length} record(s)? This action cannot be undone.`
                } else {
                    return 'Delete this record? This action cannot be undone.'
                }
            },
            helper: 'Permanently remove record(s)',
            onClick: async (data, context) => {
                const endpoint = apiEndpoint || context?.apiEndpoint
                if (!endpoint) {
                    console.error('[Delete action] No apiEndpoint available')
                    return
                }
                if (context?.mode === 'bulk') {
                    const ids = context?.selectedIds || data.map(d => d.id)
                    const results = await Promise.allSettled(
                        ids.map(id => fetch(`${endpoint}/${id}`, { method: 'DELETE' }))
                    )
                    const failed = results.filter(r => r.status === 'rejected')
                    if (failed.length > 0) {
                        showToast('error', 'Delete failed', `${failed.length} record(s) could not be deleted`)
                    } else {
                        showToast('success', 'Deleted', `${ids.length} record(s) deleted successfully`)
                        context?.refresh?.()
                    }
                } else {
                    const id = context?.record?.id || data[0]?.id
                    if (!id) return
                    const res = await fetch(`${endpoint}/${id}`, { method: 'DELETE' })
                    if (res.ok) {
                        showToast('success', 'Deleted', 'Record deleted successfully')
                        context?.refresh?.()
                    } else {
                        showToast('error', 'Delete failed', 'Failed to delete record')
                    }
                }
            }
        })
    }
    
    if (flags.duplicate !== false) {
        actions.push({
            key: 'duplicate',
            label: 'Duplicate',
            icon: createElement(Copy, {size: 16}),
            color: 'blue',
            mode: 'both',
            helper: 'Create a copy of this record',
            onClick: async (data, context) => {
                const endpoint = apiEndpoint || context?.apiEndpoint
                if (!endpoint) {
                    console.error('[Duplicate action] No apiEndpoint available')
                    return
                }
                const record = context?.record || data[0]
                if (!record) return
                const copy = { ...record }
                delete copy.id
                delete copy.created_at
                delete copy.updated_at
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(copy),
                })
                if (res.ok) {
                    showToast('success', 'Duplicated', 'Record duplicated successfully')
                    context?.refresh?.()
                } else {
                    showToast('error', 'Duplicate failed', 'Failed to duplicate record')
                }
            }
        })
    }
    
    if (flags.copyJson !== false) {
        actions.push({
            key: 'copy_json',
            label: 'Copy JSON',
            icon: createElement(Download, {size: 16}),
            color: 'blue',
            mode: 'both',
            helper: 'Copy record data as JSON',
            onClick: async (data, context) => {
                const record = context?.record || data[0]
                const json = JSON.stringify(record, null, 2)
                navigator.clipboard.writeText(json)
                console.log('Copied to clipboard')
            }
        })
    }
    
    if (flags.archive !== false) {
        actions.push({
            key: 'archive',
            label: 'Archive',
            icon: createElement(Archive, {size: 16}),
            color: 'orange',
            mode: 'both',
            confirm: (data, context) => {
                if (context?.mode === 'bulk') {
                    return `Archive ${context.selectedIds?.length || data.length} record(s)?`
                }
                return 'Archive this record?'
            },
            helper: 'Archive this record',
            onClick: async (data, context) => {
                const endpoint = apiEndpoint || context?.apiEndpoint
                if (!endpoint) {
                    console.error('[Archive action] No apiEndpoint available')
                    return
                }
                if (context?.mode === 'bulk') {
                    const ids = context?.selectedIds || data.map(d => d.id)
                    const results = await Promise.allSettled(
                        ids.map(id => fetch(`${endpoint}/${id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ active: false }),
                        }))
                    )
                    const failed = results.filter(r => r.status === 'rejected')
                    if (failed.length > 0) {
                        showToast('error', 'Archive failed', `${failed.length} record(s) could not be archived`)
                    } else {
                        showToast('success', 'Archived', `${ids.length} record(s) archived successfully`)
                        context?.refresh?.()
                    }
                } else {
                    const id = context?.record?.id || data[0]?.id
                    if (!id) return
                    const res = await fetch(`${endpoint}/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ active: false }),
                    })
                    if (res.ok) {
                        showToast('success', 'Archived', 'Record archived successfully')
                        context?.refresh?.()
                    } else {
                        showToast('error', 'Archive failed', 'Failed to archive record')
                    }
                }
            }
        })
    }
    
    if (flags.unarchive !== false) {
        actions.push({
            key: 'unarchive',
            label: 'Unarchive',
            icon: createElement(ArchiveRestore, {size: 16}),
            color: 'green',
            mode: 'both',
            confirm: (data, context) => {
                if (context?.mode === 'bulk') {
                    return `Unarchive ${context.selectedIds?.length || data.length} record(s)?`
                }
                return 'Unarchive this record?'
            },
            helper: 'Unarchive this record',
            onClick: async (data, context) => {
                const endpoint = apiEndpoint || context?.apiEndpoint
                if (!endpoint) {
                    console.error('[Unarchive action] No apiEndpoint available')
                    return
                }
                if (context?.mode === 'bulk') {
                    const ids = context?.selectedIds || data.map(d => d.id)
                    const results = await Promise.allSettled(
                        ids.map(id => fetch(`${endpoint}/${id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ active: true }),
                        }))
                    )
                    const failed = results.filter(r => r.status === 'rejected')
                    if (failed.length > 0) {
                        showToast('error', 'Unarchive failed', `${failed.length} record(s) could not be unarchived`)
                    } else {
                        showToast('success', 'Unarchived', `${ids.length} record(s) unarchived successfully`)
                        context?.refresh?.()
                    }
                } else {
                    const id = context?.record?.id || data[0]?.id
                    if (!id) return
                    const res = await fetch(`${endpoint}/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ active: true }),
                    })
                    if (res.ok) {
                        showToast('success', 'Unarchived', 'Record unarchived successfully')
                        context?.refresh?.()
                    } else {
                        showToast('error', 'Unarchive failed', 'Failed to unarchive record')
                    }
                }
            }
        })
    }
    
    return actions
}

export interface ServerActionConfig {
    label: string
    key: string
    icon?: React.ReactNode
    color?: 'blue' | 'green' | 'red' | 'orange' | 'violet' | 'yellow' | 'cyan'
    variant?: 'default' | 'primary' | 'danger' | 'success' | 'warning' | 'info'
    onClick: (data: any[], context?: ActionContext) => void | Promise<void>
    show?: (data: any[], context?: ActionContext) => boolean
    confirm?: string | ((data: any[], context?: ActionContext) => string)
    helper?: string
    mode?: 'create' | 'edit' | 'both' | 'bulk'
    template?: string // Print template name for print actions
    readonly?: boolean
    badge?: string | number
    className?: string
}

/**
 * ActionContext provides information about the context in which an action is executed.
 * 
 * For ListView (bulk mode):
 * - mode: 'bulk'
 * - view: 'list'
 * - selectedIds: Array of selected record IDs
 * - record: undefined
 * - data: Array of selected records
 * 
 * For FormView (single mode):
 * - mode: 'single'
 * - view: 'form'
 * - selectedIds: undefined
 * - record: Single record object
 * - data: Array with single record [record]
 * 
 * Example action that works in both contexts:
 * ```typescript
 * const deleteAction: ServerActionConfig = {
 *   key: 'delete',
 *   label: 'Delete',
 *   onClick: (data, context) => {
 *     if (context.mode === 'bulk') {
 *       // ListView: delete multiple records
 *       const ids = context.selectedIds || data.map(d => d.id)
 *       deleteRecords(ids)
 *     } else {
 *       // FormView: delete single record
 *       const id = context.record?.id || data[0]?.id
 *       deleteRecord(id)
 *     }
 *   }
 * }
 * ```
 */

export interface ActionContext {
    mode: 'bulk' | 'single'
    view: 'list' | 'form'
    record?: any
    selectedIds?: string[]
    actionKey?: string
    apiEndpoint?: string
    refresh?: () => void
}

export interface ServerActionsProps {
    actions: ServerActionConfig[]
    data: any[]
    context: ActionContext
    onActionComplete?: (actionKey: string) => void
    onPrint?: (data: any[], mode: 'single' | 'bulk', title: string, template?: React.ComponentType<any>) => void
    layout?: 'dropdown' | 'drawer' | 'toolbar' | 'inline'
    block?: boolean
    size?: 'xs' | 'sm' | 'md' | 'lg'
    availableFields?: Array<{ key: string; label: string; type?: string }>
}

export function ServerActions({
    actions,
    data,
    context,
    onActionComplete,
    onPrint,
    layout = 'inline',
    block = false,
    size = 'sm',
    availableFields = []
}: ServerActionsProps) {
    const [confirmModalOpen, setConfirmModalOpen] = useState(false)
    const [confirmModalConfig, setConfirmModalConfig] = useState<{
        message: string
        onConfirm: () => void | Promise<void>
    } | null>(null)
    const [loading, setLoading] = useState<string | null>(null)
    const [showExportModal, setShowExportModal] = useState(false)

    const handleActionClick = async (action: ServerActionConfig) => {
        // Check if action should be shown
        if (action.show && !action.show(data, context)) {
            return
        }

        // Handle export action specially
        if (action.key === 'export_excel') {
            setShowExportModal(true)
            return
        }

        // Handle print actions with template property
        if (action.template && onPrint) {
            const mode = context.mode === 'bulk' ? 'bulk' : 'single'
            const title = action.label || 'Print'
            
            // Load template from registry
            import('@/lib/printTemplateRegistry').then(({ loadTemplate }) => {
                loadTemplate(action.template!).then(template => {
                    if (template) {
                        onPrint(data, mode, title, template)
                    }
                })
            })
            return
        }

        // Handle default print action (no template)
        if (action.key === 'print' && onPrint) {
            const mode = context.mode === 'bulk' ? 'bulk' : 'single'
            const title = action.label || 'Print'
            onPrint(data, mode, title)
            return
        }

        // Handle confirmation
        let confirmMessage: string
        if (typeof action.confirm === 'function') {
            confirmMessage = action.confirm(data, context)
        } else if (typeof action.confirm === 'string') {
            confirmMessage = action.confirm
        } else {
            confirmMessage = ''
        }

        if (confirmMessage) {
            setConfirmModalConfig({
                message: confirmMessage,
                onConfirm: async () => {
                    setLoading(action.key)
                    try {
                        await action.onClick(data, context)
                        if (onActionComplete) {
                            onActionComplete(action.key)
                        }
                    } finally {
                        setLoading(null)
                        setConfirmModalOpen(false)
                    }
                }
            })
            setConfirmModalOpen(true)
        } else {
            setLoading(action.key)
            try {
                await action.onClick(data, context)
                if (onActionComplete) {
                    onActionComplete(action.key)
                }
            } finally {
                setLoading(null)
            }
        }
    }

    const renderButton = (action: ServerActionConfig) => {
        // Check mode filter
        if (action.mode && action.mode !== 'both') {
            if (context.mode === 'bulk' && action.mode !== 'bulk') return null
            if (context.mode === 'single') {
                // For single mode, check if action mode matches the form mode (create/edit)
                if (context.view === 'form' && action.mode !== 'create' && action.mode !== 'edit') return null
            }
        }

        // Check show condition
        if (action.show && !action.show(data, context)) {
            return null
        }

        const button = (
            <Button
                key={action.key}
                appearance="subtle"
                block={block}
                size={size}
                startIcon={action.icon}
                onClick={() => handleActionClick(action)}
                disabled={loading === action.key || action.readonly}
                loading={loading === action.key}
                className={cn(action.className)}
                style={{
                    padding: '20px 10px',
                    marginTop: '0',
                }}
            >
                {action.label}
                {action.badge && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                        {action.badge}
                      </span>
                )}
            </Button>
        )

        // Wrap with Whisper if helper text is provided
        if (action.helper) {
            return (
                <Whisper
                    key={action.key}
                    trigger="hover"
                    placement="bottom"
                    speaker={<Popover>{action.helper}</Popover>}
                >
                    {button}
                </Whisper>
            )
        }

        return button
    }

    const renderActions = () => {
        return actions.map(action => renderButton(action))
    }

    const renderExport = () => (
        <Export
            data={data}
            availableFields={availableFields}
            onExport={(config: ExportConfig) => {
                console.log('Export config:', config)
                if (onActionComplete) {
                    onActionComplete('export_excel')
                }
            }}
            onClose={() => setShowExportModal(false)}
        />
    )

    const renderContent = () => {
        if (layout === 'inline') {
            return (
                <div className="flex flex-wrap gap-2">
                    {renderActions()}
                </div>
            )
        }

        if (layout === 'dropdown') {
            return (
                <Whisper
                    trigger="click"
                    enterable
                    placement="bottomEnd"
                    speaker={
                        <Popover>
                            <div className="flex flex-col gap-2 p-2 min-w-[200px]">
                                {renderActions()}
                            </div>
                        </Popover>
                    }
                >
                    <IconButton
                        icon={<Settings className="w-4 h-4" />}
                        appearance="subtle"
                        style={{
                            backgroundColor: 'transparent',
                            boxShadow: 'none',
                            borderWidth: '0.5px',
                        }}
                        className="bg-accent"
                    />
                </Whisper>
            )
        }

        if (layout === 'toolbar') {
            return (
                <div className="flex gap-2">
                    {renderActions()}
                </div>
            )
        }

        if (layout === 'drawer') {
            return (
                <div className="flex flex-col gap-4">
                    {renderActions()}
                </div>
            )
        }

        // Default inline layout
        return (
            <div className="flex flex-col gap-2">
                {renderActions()}
            </div>
        )
    }

    return (
        <>
            {renderContent()}
            {showExportModal && renderExport()}
            <ConfirmationModal
                open={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                config={confirmModalConfig}
            />
        </>
    )
}

// Confirmation Modal
export function ConfirmationModal({
    open,
    onClose,
    config
}: {
    open: boolean
    onClose: () => void
    config: { message: string; onConfirm: () => void | Promise<void> } | null
}) {
    const [loading, setLoading] = useState(false)

    const handleConfirm = async () => {
        if (!config) return
        setLoading(true)
        try {
            await config.onConfirm()
            onClose()
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            size="sm"
            backdrop={"static"}
            draggable
        >
            <Modal.Header>
                <Modal.Title>Confirm Action</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {config?.message}
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={onClose} appearance="subtle" disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleConfirm}
                    appearance="primary"
                    color="red"
                    loading={loading}
                >
                    Confirm
                </Button>
            </Modal.Footer>
        </Modal>
    )
}
