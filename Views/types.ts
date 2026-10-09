'use client'

import { ListViewConfig } from './ListView'
import { KanbanViewConfig } from './KanbanView'
import { GanttViewConfig } from './GanttView'
import { FormConfig } from './FormView'
import { ServerActionConfig } from '../Actions'

export type ResourceType = 'list' | 'kanban' | 'gantt' | 'form' | 'custom'

export interface CustomViewProps {
  searchValues?: any[]
  filterValues?: any[]
  loading?: boolean
  onRefresh?: () => void
}

export type CustomViewComponent = React.ComponentType<CustomViewProps>

export interface ResourceViewConfig {
  type: ResourceType
  listViewConfig?: ListViewConfig
  kanbanViewConfig?: KanbanViewConfig
  ganttViewConfig?: GanttViewConfig
  formViewConfig?: FormConfig
  customView?: CustomViewComponent
  serverActions?: ServerActionConfig[]  // Centralized ServerActions
  title?: string  // Page title
  description?: string  // Page description
  // Default action flags
  enableDefaultActions?: boolean
  defaultActions?: {
    print?: boolean
    exportExcel?: boolean
    delete?: boolean
    duplicate?: boolean
    copyJson?: boolean
    archive?: boolean
    unarchive?: boolean
  }
}

export interface ResourceViewProps {
  config: ResourceViewConfig
  onEdit?: (rowData: any) => void
  onCreate?: () => void
  onDelete?: (rowData: any) => void
  loading?: boolean
  entityId?: string  // For form mode - determines if edit or create
  initialData?: any  // Initial data for form mode (edit)
  recordIds?: (string | number)[]  // ordered list for prev/next form navigation
  onNavigate?: (recordId: string | number) => void  // navigate to a specific record
  onRefresh?: () => void  // trigger parent data re-fetch
  allowCreate?: boolean  // show/hide New button (default: true when onCreate provided)
  allowEdit?: boolean    // allow row click to edit (default: true when onEdit provided)
}
