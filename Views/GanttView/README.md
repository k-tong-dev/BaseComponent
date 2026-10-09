# GanttView Component

A Gantt chart view component using rsuite Table with tree structure support.

## Features

- **Tree Structure**: Display hierarchical data with expand/collapse
- **Customizable Columns**: Define custom columns with render functions
- **Row Actions**: Support for click, edit, and delete actions
- **Configurable**: Height, expand behavior, and row key configuration

## Usage

```tsx
import { GanttView } from '@/components/admin/GanttView'

const config = {
  data: ganttData,
  columns: [
    { key: 'id', title: 'Code', width: 100 },
    { key: 'label', title: 'Task', flexGrow: 1, treeCol: true },
    { key: 'startDate', title: 'Start Date', width: 150 },
    { key: 'endDate', title: 'End Date', width: 150 },
  ],
  startDateKey: 'startDate',
  endDateKey: 'endDate',
  titleKey: 'label',
  height: 500,
  onRowClick: handleRowClick,
}

<GanttView config={config} />
```

## API Reference

### GanttViewConfig

```typescript
interface GanttViewConfig {
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
```

### GanttTask

```typescript
interface GanttTask {
  id: string
  label: string
  startDate: Date | string
  endDate: Date | string
  progress?: number
  assignee?: string
  [key: string]: any
}
```

## Integration

GanttView is designed to work within the ResourceView parent component for unified view management.
