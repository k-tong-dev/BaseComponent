# Admin Components Architecture

A unified architecture for data management views including ListView, KanbanView, FormView, GanttView, and a parent ResourceView component.

## Overview

This architecture provides a standardized, reusable set of components for building admin interfaces. All views share common patterns and can be managed through a single parent component (ResourceView).

## Folder Structure

```
components/admin/
├── ListView/           # Table-based data view with filtering, sorting, pagination
│   ├── index.tsx
│   ├── config/
│   │   ├── index.ts
│   │   └── productListConfig.ts
│   └── README.md
├── KanbanView/         # Kanban board with state-based workflow
│   ├── index.tsx
│   ├── types.ts
│   ├── config/
│   └── README.md
├── FormView/           # Form for creating/editing records
│   ├── index.ts
│   ├── FormView.tsx
│   ├── config/
│   ├── utils/
│   └── README.md
├── ResourceView/       # Parent component managing all views
│   ├── index.tsx
│   ├── types.ts
│   └── README.md

Note: Model-specific configurations are now in app/admin/[model]/config/
- Product configs: app/admin/products/config/
- Customer configs: app/admin/customers/config/ (to be created)
```

## Components

### ListView
- **Purpose**: Display data in a table format
- **Features**:
  - Advanced filtering with multiple filter types (text, number, date, options, boolean)
  - Dynamic data fetching for related fields
  - Sorting with onSortColumn handler
  - Pagination with rsuite Pagination component
  - Header summary support (sum, count, avg, min, max)
  - Group-by with tree view
  - Gantt chart view
  - Export functionality
  - Column picker
  - View switcher (list, kanban, grid, gantt, tree)

- **Usage**: Primary view for browsing and managing data
- **Config**: `ListViewConfig`

### KanbanView
- **Purpose**: Display data in columns based on state or custom grouping
- **Features**:
  - **Normal Mode**: Custom card rendering with full design control
  - **State Control Mode**: Draggable columns with automatic state updates
  - Configurable columns with colors and limits
  - Drag and drop powered by @dnd-kit
  - Card actions (click, edit, delete)
  - Card count display

- **Usage**: Workflow management, task boards, status tracking
- **Config**: `KanbanViewConfig`

### FormView
- **Purpose**: Create and edit records
- **Features**:
  - Tabbed form layout
  - Field validation
  - File upload support
  - API integration
  - Export functionality
  - Dynamic field rendering

- **Usage**: Creating and editing individual records
- **Config**: `FormConfig`

### ResourceView
- **Purpose**: Unified parent component managing all views
- **Features**:
  - View type switching (list, kanban, gantt, form)
  - Edit/create workflow automation
  - State preservation
  - Config-based configuration

- **Usage**: Main component for admin pages
- **Config**: `ResourceViewConfig`

## Usage Pattern

### Page-Level Integration

```tsx
import { ResourceView } from '@/components/admin/ResourceView'
import { getProductListConfig, productFormConfig } from '@/app/admin/products/config'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)

  const config = {
    type: 'list',
    listViewConfig: getProductListConfig(products),
    formViewConfig: productFormConfig,
  }

  return (
    <ResourceView
      config={config}
      onEdit={handleEdit}
      onCreate={handleCreate}
      onDelete={handleDelete}
      loading={loading}
    />
  )
}
```

### Direct View Usage

```tsx
// Direct ListView usage
import { ListView } from '@/components/admin/ListView'

<ListView config={listViewConfig} onEdit={handleEdit} />

// Direct KanbanView usage
import { KanbanView } from '@/components/admin/KanbanView'

<KanbanView config={kanbanViewConfig} />

// Direct FormView usage
import { FormView } from '@/components/admin/FormView'

<FormView mode="edit" config={formConfig} entityId={id} />
```

## Configuration Patterns

### ListView Configuration

```typescript
{
  title: string
  columns: ListColumn[]
  data: any[]
  showColumnToggle?: boolean
  showSearch?: boolean
  showFilters?: boolean
  showViewSwitcher?: boolean
  showExport?: boolean
  defaultVisibleColumns?: string[]
  pageSize?: number
  enableGroupBy?: boolean
  enableGanttView?: boolean
  ganttStartDateKey?: string
  ganttEndDateKey?: string
  ganttTitleKey?: string
}
```

### KanbanView Configuration

```typescript
{
  mode: 'normal' | 'state-control'
  columns: KanbanColumn[]
  data: any[]
  stateField?: string
  onCardClick?: (card: KanbanCard) => void
  onCardEdit?: (card: KanbanCard) => void
  onCardDelete?: (card: KanbanCard) => void
  onStateChange?: (cardId: string, newState: string) => Promise<void>
  renderCard?: (card: KanbanCard) => React.ReactNode
  cardWidth?: number
  columnWidth?: number
  draggable?: boolean
  showCardCount?: boolean
}
```

### ResourceView Configuration

```typescript
{
  type: 'list' | 'kanban' | 'gantt' | 'form'
  listViewConfig?: ListViewConfig
  kanbanViewConfig?: KanbanViewConfig
  formViewConfig?: FormConfig
  ganttConfig?: {
    startDateKey: string
    endDateKey: string
    titleKey: string
  }
}
```

## Key Features

### Advanced Filtering
- Filter by text, number, date, options, boolean
- Dynamic data fetching for related fields (brands, categories)
- Apply on-click (pending state)
- Filter counts (applied/pending)
- Clear all / reset options

### Sorting
- Column-based sorting with onSortColumn handler
- Ascending/descending toggle
- Visual sort indicators

### Pagination
- rsuite Pagination component
- Configurable page size (10, 20, 30, 50)
- Total count display
- Skip navigation

### Loading States
- Placeholder.Grid loading skeleton
- Loader component support
- Backdrop loading

### Header Summary
- Sum, count, avg, min, max calculations
- Per-column configuration
- Visual display in headers

### State Management
- Local state for filters, sorting, pagination
- Config-based initialization
- Dynamic data fetching

## Reusability

### Cross-Project Usage

All components are designed for reuse across projects:

1. **Standard Folder Structure**: Consistent organization
2. **Config-Based**: All views configured through config objects
3. **Type-Safe**: Full TypeScript support
4. **Minimal Dependencies**: Uses standard libraries (rsuite, shadcn/ui)
5. **Documentation**: Comprehensive README for each component

### Migration Guide

To use these components in another project:

1. Copy the entire `components/admin/` folder
2. Install dependencies:
   - `@dnd-kit/core`
   - `@dnd-kit/sortable`
   - `@dnd-kit/utilities`
   - `rsuite`
   - `lucide-react`
   - shadcn/ui components
3. Configure your data and column definitions
4. Integrate with your API endpoints

## Best Practices

1. **Use ResourceView** for page-level integration
2. **Define configs** in separate config files
3. **Use filterDataFetcher** for dynamic data
4. **Set filterDefault** for default filter values
5. **Use summary** for numeric column totals
6. **Enable state-control mode** for workflow kanban boards
7. **Keep configs** in version control
8. **Document custom render functions**

## Future Enhancements

- [ ] Add Calendar view
- [ ] Add Timeline view
- [ ] Add more filter operators
- [ ] Add bulk actions
- [ ] Add column reordering
- [ ] Add saved filter presets
- [ ] Add export to more formats (Excel, PDF)
- [ ] Add real-time updates via WebSocket

## Contributing

When adding new features:
1. Follow the existing folder structure
2. Add TypeScript types
3. Update README with new features
4. Add configuration options
5. Ensure backward compatibility
