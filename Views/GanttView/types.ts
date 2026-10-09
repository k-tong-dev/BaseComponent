'use client'

export interface GanttTask {
  id: string
  label: string
  startDate: Date | string
  endDate: Date | string
  progress?: number
  assignee?: string
  [key: string]: any
}

export interface GanttColumn {
  key: string
  title: string
  width?: number
  flexGrow?: number
  treeCol?: boolean
  render?: (rowData: any) => React.ReactNode
}

export interface GanttViewConfig {
  data: GanttTask[]
  columns: GanttColumn[]
  startDateKey: string
  endDateKey: string
  titleKey: string
  rowKey?: string
  height?: number
  defaultExpandAllRows?: boolean
  onRowClick?: (rowData: any) => void
  onEdit?: (rowData: any) => void
  onDelete?: (rowData: any) => void
}

export interface GanttViewProps {
  config: GanttViewConfig
  loading?: boolean
}
