'use client'

import React, {useState, useEffect, useRef, useMemo} from 'react'
import {useSearchParams} from 'next/navigation'
import {ListView} from './ListView'
import {KanbanView} from './KanbanView'
import {GanttView} from './GanttView'
import {FormView} from './FormView'
import {PrintView} from '../Print/PrintView'
import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'
import {Loader} from 'rsuite'
import {ViewContextProvider, parseContextFromSearchParams} from './Context'

import { List, Grid3x3, Calendar, Info } from 'lucide-react'
import {ResourceViewProps, ResourceType} from './types'
import {MdAdd} from "react-icons/md";
import {ServerActions} from '../Actions'
import {Tooltip, TooltipTrigger, TooltipContent} from '@/components/ui/tooltip'
import { useAuth } from '@/hooks/use-auth'
import { useViewToolbar } from '@/components/Base/ViewToolbar/hooks/useViewToolbar'
import { ViewToolbar } from '../ViewToolbar'

export function ResourceView({config, onEdit, onCreate, onDelete, loading, entityId, initialData, recordIds, onNavigate, onRefresh, allowCreate, allowEdit}: ResourceViewProps) {
    const searchParams = useSearchParams()
    const [viewType, setViewType] = useState<ResourceType>(config.type)
    const [editingId, setEditingId] = useState<string | undefined>(undefined)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [formInitialData, setFormInitialData] = useState<any>(initialData)
    const [mounted, setMounted] = useState(false)
    const [lastViewType, setLastViewType] = useState<ResourceType>(config.type)
    const [currentFilteredData, setCurrentFilteredData] = useState<any[]>([])
    const [showPrintModal, setShowPrintModal] = useState(false)
    const [printConfig, setPrintConfig] = useState<{data: any[]; mode: 'single' | 'bulk'; title: string; template?: React.ComponentType<any>} | null>(null)
    const { user } = useAuth()
    const toolbar = useViewToolbar({
      userId: String(user?.id ?? 'anonymous'),
      pathname: typeof window !== 'undefined' ? window.location.pathname : '',
    })
    const { searchValues, filterValues, groupByField, setSearchValues, setFilterValues, setGroupByField, showFilterPanel, setShowFilterPanel } = toolbar

    // Odoo-style view context: merge config context with URL params (?context[key]=value)
    const viewContext = useMemo(() => {
      const urlContext = parseContextFromSearchParams(searchParams)
      return { ...(config.formViewConfig?.context || {}), ...urlContext }
    }, [searchParams, config.formViewConfig?.context])

    // Set editingId after mount to avoid hydration mismatch
    useEffect(() => {
        setMounted(true)
        setEditingId(entityId)
    }, [entityId])

    // Sync formInitialData when initialData changes (e.g., after fetch completes)
    useEffect(() => {
        if (initialData) {
            setFormInitialData(initialData)
        }
    }, [initialData])

    // Merge default actions with custom actions
    const mergedServerActions = React.useMemo(() => {
        let actions = config.serverActions || []

        if (config.enableDefaultActions !== false && config.defaultActions) {
            const {getDefaultServerActions} = require('../Actions')
            const defaultActions = getDefaultServerActions(config.defaultActions, config.formViewConfig?.apiEndpoint)
            actions = [...defaultActions, ...actions]
        }

        // Mark all actions as readonly when allowEdit is false
        if (allowEdit === false) {
            actions = actions.map(a => ({...a, readonly: true}))
        }

        return actions
    }, [config.serverActions, config.enableDefaultActions, config.defaultActions, config.formViewConfig?.apiEndpoint, allowEdit])

    const handleEdit = (rowData: any) => {
        setLastViewType(viewType)
        setEditingId(rowData.id || rowData._id)
        setViewType('form')
        onEdit?.(rowData)
    }

    const handleRowClick = (rowData: any) => {
        if (!(allowEdit ?? !!onEdit)) return
        onEdit?.(rowData)
    }

    const handleCreate = () => {
        setLastViewType(viewType)
        setEditingId(undefined)
        setViewType('form')
        onCreate?.()
    }

    const handleFormComplete = () => {
        setEditingId(undefined)
        setViewType(lastViewType)
    }

    const handlePrint = (data: any[], mode: 'single' | 'bulk', title: string, template?: React.ComponentType<any>) => {
        try {
            // Ensure title is never empty
            const safeTitle = title && typeof title === 'string' && title.trim() ? title : 'Print'
            // Convert empty string values to null instead of filtering them out
            const safeData = data.map(item => 
                Object.fromEntries(
                    Object.entries(item || {}).map(([key, value]) => [key, value === '' ? null : value])
                )
            )
            setPrintConfig({data: safeData, mode, title: safeTitle, template})
            setShowPrintModal(true)
        } catch (e) {
            console.error('Error in handlePrint:', e)
        }
    }

    const handlePrintClose = () => {
        setShowPrintModal(false)
        setPrintConfig(null)
    }

    const handleExport = () => {
        // Export functionality
        console.log('Export triggered')
    }

    const renderView = () => {
        switch (viewType) {
            case 'list':
                if (!config.listViewConfig) {
                    return <div className="text-center py-8 text-muted-foreground">ListView config not provided</div>
                }
                return (
                    <ListView
                        config={config.listViewConfig}
                        onRowClick={handleRowClick}
                        onEdit={handleEdit}
                        onDelete={onDelete}
                        loading={loading}
                        searchValues={searchValues}
                        filterValues={filterValues}
                        groupByField={groupByField}
                        selectedIds={selectedIds}
                        setSelectedIds={setSelectedIds}
                        serverActions={mergedServerActions}
                        availableFields={config.listViewConfig?.columns?.map(col => ({
                            key: col.key,
                            label: col.title,
                            type: col.type
                        })) || []}
                        onDataChange={setCurrentFilteredData}
                        allowEdit={allowEdit}
                    />
                )

            case 'kanban':
                if (!config.kanbanViewConfig) {
                    return <div className="text-center py-8 text-muted-foreground">KanbanView config not provided</div>
                }
                return (
                    <KanbanView
                        config={config.kanbanViewConfig}
                        loading={loading}
                        showFilterPanel={showFilterPanel}
                        setShowFilterPanel={setShowFilterPanel}
                        searchKeyword={searchValues.map(v => v.value).join(' ')}
                        setSearchKeyword={() => {}}
                        filterValues={filterValues}
                        groupByField={groupByField || undefined}
                        onCardClick={handleRowClick}
                        onCardEdit={handleEdit}
                    />
                )

            case 'form':
                if (!config.formViewConfig) {
                    return <div className="text-center py-8 text-muted-foreground">FormView config not provided</div>
                }
                return (
                    <div className="">
                        <FormView
                            mode={editingId ? 'edit' : 'create'}
                            config={config.formViewConfig}
                            entityId={editingId}
                            initialData={formInitialData}
                            serverActions={mergedServerActions}
                            onPrint={handlePrint}
                            availableFields={config.formViewConfig?.fields?.map(f => ({
                                key: f.key,
                                label: f.label,
                                type: f.type
                            })) || []}
                            recordIds={recordIds}
                            onNavigate={onNavigate}
                            onRefresh={onRefresh}
                            readonly={allowEdit === false}
                            context={viewContext}
                        />
                    </div>
                )

            case 'gantt':
                if (!config.ganttViewConfig) {
                    return <div className="text-center py-8 text-muted-foreground">GanttView config not provided</div>
                }
                return (
                    <GanttView
                        config={config.ganttViewConfig}
                        loading={loading}
                    />
                )

            case 'custom':
                if (!config.customView) {
                    return <div className="text-center py-8 text-muted-foreground">CustomView config not provided</div>
                }
                const CustomView = config.customView
                return (
                    <CustomView
                        searchValues={searchValues}
                        filterValues={filterValues}
                        loading={loading}
                        onRefresh={onRefresh}
                    />
                )

            default:
                return <div className="text-center py-8 text-muted-foreground">Unknown view type</div>
        }
    }

    const viewButtons = useMemo(() => {
      const buttons: { type: ResourceType; icon: any; label: string }[] = []
      if (config.listViewConfig) buttons.push({ type: 'list', icon: List, label: 'List' })
      if (config.kanbanViewConfig) buttons.push({ type: 'kanban', icon: Grid3x3, label: 'Kanban' })
      if (config.ganttViewConfig) buttons.push({ type: 'gantt', icon: Calendar, label: 'Gantt' })
      return buttons
    }, [config.listViewConfig, config.kanbanViewConfig, config.ganttViewConfig])

    const containerRef = useRef<HTMLDivElement>(null)
    const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

    useEffect(() => {
      const idx = viewButtons.findIndex(b => b.type === viewType)
      const el = buttonRefs.current[idx]
      if (el && containerRef.current) {
        setIndicatorStyle({
          left: el.offsetLeft,
          width: el.offsetWidth,
        })
      }
    }, [viewType, viewButtons])

    const renderHeader = () => {
        if (viewType === 'form' || viewType === 'custom') return null

        return (
            <div className="flex items-center justify-between gap-4 px-6 pt-2">
                <div ref={containerRef} className="inline-flex items-center rounded-full bg-muted/60 p-0.5 border border-border/50 relative">
                    <div
                        className="absolute top-0.5 bottom-0.5 rounded-full bg-background shadow-sm transition-all duration-200 ease-in-out z-0"
                        style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
                    />
                    {viewButtons.map((btn, i) => {
                        const Icon = btn.icon
                        const active = viewType === btn.type
                        return (
                            <button
                                key={btn.type}
                                ref={el => { buttonRefs.current[i] = el }}
                                className={`relative z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-150 ${
                                    active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                                }`}
                                onClick={() => setViewType(btn.type)}
                            >
                                <Icon size={13}/>
                                {btn.label}
                            </button>
                        )
                    })}
                </div>
                <div className="flex items-center gap-2">
                    <ViewToolbar
                        toolbar={toolbar}
                        columns={config.listViewConfig?.columns}
                        currentViewType={viewType}
                    >
                        {selectedIds.length > 0 && (
                            <ServerActions
                                actions={mergedServerActions}
                                data={currentFilteredData.filter(item => 
                                    selectedIds.includes(item.id || item._id)
                                ) || []}
                                context={{
                                    mode: 'bulk',
                                    view: 'list',
                                    selectedIds,
                                    apiEndpoint: config.formViewConfig?.apiEndpoint,
                                    refresh: onRefresh,
                                }}
                                layout="dropdown"
                                onPrint={handlePrint}
                                availableFields={config.listViewConfig?.columns?.map(col => ({
                                    key: col.key,
                                    label: col.title,
                                    type: col.type
                                })) || []}
                            />
                        )}
                        {(allowCreate ?? !!onCreate) && (
                            <Button onClick={handleCreate}
                                    color="violet"
                                    startIcon={<MdAdd />}
                                    appearance={"primary"}
                                    size="sm">
                                New
                            </Button>
                        )}
                    </ViewToolbar>
                </div>
            </div>
        )
    }

    // Show loading state for form view when editing and data is not yet loaded
    if (viewType === 'form' && entityId && !formInitialData && mounted) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <Loader backdrop content="Loading..." vertical/>
            </div>
        )
    }

    return (
        <ViewContextProvider value={viewContext}>
            <Card className="border-border/50 rounded-none min-h-screen shadow-none pt-4">
                {config.title && viewType !== 'form' && (
                    <div className="px-6 pt-1 flex items-center gap-2">
                        <h1 className="text-2xl font-bold">{config.title}</h1>
                        {config.description && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors cursor-help">
                                        <Info size={16}/>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-xs">
                                    {config.description}
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                )}
                <div className="p-6 pt-0">
                    {renderHeader()}
                    {renderView()}
                </div>
                {showPrintModal && printConfig && (
                    <PrintView
                        open={showPrintModal}
                        data={printConfig.data}
                        mode={printConfig.mode}
                        title={printConfig.title}
                        template={printConfig.template}
                        onClose={handlePrintClose}
                    />
                )}
            </Card>
        </ViewContextProvider>
    )
}

export * from './types'
