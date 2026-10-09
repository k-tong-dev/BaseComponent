# ResourceView Component

A unified parent component that manages ListView, KanbanView, FormView, GanttView, and CustomView for seamless navigation between different view types and rendering modes.

## ServerActions Component

The ServerActions component is a shared action system inspired by Odoo's server actions. It allows you to define reusable actions that can be used across different views (ListView, FormView) for the same model, reducing code duplication and improving maintainability.

### Architecture Overview (Odoo-like)

ServerActions provides a **centralized action system** that handles both bulk operations (ListView) and single-record operations (FormView) through a context-aware interface.

**Centralized Configuration:**
- Actions are defined ONCE in the model's central config (e.g., `app/admin/products/config/index.ts`)
- ResourceView passes `serverActions` to both ListView and FormView
- No need to duplicate actions in ListView config (`bulkActions`) or FormView config (`actions`/`customActions`)

**Context Modes:**
- **Bulk Mode (ListView)**: Actions operate on multiple selected records
  - `context.mode = 'bulk'`
  - `context.view = 'list'`
  - `context.selectedIds = ['id1', 'id2', ...]`
  - `data = [record1, record2, ...]`

- **Single Mode (FormView)**: Actions operate on a single record
  - `context.mode = 'single'`
  - `context.view = 'form'`
  - `context.record = { id: 'id1', ... }`
  - `data = [{ id: 'id1', ... }]`

### Location
- Component: `components/admin/ResourceView/ServerActions/index.tsx`
- Documentation: `components/admin/ResourceView/ServerActions/README.md`

### Features
- **Centralized Actions**: Define actions once in model config, use across all views
- **Built-in Default Actions**: Pre-configured actions (Print, Export Excel, Delete, Duplicate, Copy JSON, Archive, Unarchive) that can be enabled/disabled via flags
- **Context-Aware**: Actions automatically adapt to bulk vs single record context
- **Confirmation Dialogs**: Built-in confirmation support via Modal
- **Helper Tooltips**: Whisper tooltips with bottom placement for action descriptions
- **Mode Filtering**: Actions can be filtered by mode (create, edit, both, bulk)
- **Conditional Display**: Actions can be shown/hidden based on data/context
- **Loading States**: Built-in loading state management for async actions
- **Multiple Layouts**: Support for inline, toolbar, drawer, and dropdown layouts

### Built-in Default Actions

The system provides built-in default actions that can be enabled/disabled via flags in the ResourceView config:

**Available Default Actions:**
- `print`: Print the current record
- `export`: Export records to Excel or CSV (mode: 'both') - Opens Export modal
- `delete`: Delete record(s) (both bulk and single mode)
- `duplicate`: Create a copy of the record (both modes)
- `copyJson`: Copy record data as JSON to clipboard (both modes)
- `archive`: Archive the record (both modes)
- `unarchive`: Unarchive the record (both modes)

**Note:** The `duplicate`, `archive`, and `unarchive` actions now use `mode: 'both'` to appear in both FormView and ListView bulk actions.

**Usage Example:**
```typescript
<ResourceView
  config={{
    type: 'list',
    title: 'Products',
    description: 'Create, edit, and manage your product catalog.',
    listViewConfig: listViewConfig,
    formViewConfig: formViewConfig,
    enableDefaultActions: true,  // Enable default actions
    defaultActions: {
      print: true,
      exportExcel: true,
      delete: true,
      duplicate: true,
      copyJson: true,
      archive: true,
      unarchive: true
    },
    serverActions: customActions  // Additional custom actions
  }}
/>
```

**Action Placement:**
- **ListView**: Default actions appear in the bulk actions Popover dropdown in ResourceView header (when records are selected)
- **FormView**: Default actions appear in the Top Action Buttons dropdown (in edit mode)

### ServerActionConfig Interface

```typescript
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
    readonly?: boolean
    badge?: string | number
    className?: string
}
```

### ActionContext Interface

```typescript
export interface ActionContext {
    mode: 'bulk' | 'single'
    view: 'list' | 'form'
    record?: any
    selectedIds?: string[]
}
```

### Example: Delete Action in Both Contexts

```typescript
const deleteAction: ServerActionConfig = {
    key: 'delete',
    label: 'Delete',
    icon: <Trash2 size={16} />,
    color: 'red',
    mode: 'both',
    confirm: (data, context) => {
        if (context.mode === 'bulk') {
            return `Delete ${context.selectedIds?.length || data.length} selected records?`
        } else {
            return 'Delete this record? This action cannot be undone.'
        }
    },
    helper: 'Permanently remove record(s)',
    onClick: async (data, context) => {
        if (context.mode === 'bulk') {
            // ListView: Delete multiple records
            const ids = context.selectedIds || data.map(d => d.id)
            await fetch('/api/bulk-delete', {
                method: 'POST',
                body: JSON.stringify({ ids })
            })
        } else {
            // FormView: Delete single record
            const id = context.record?.id || data[0]?.id
            await fetch(`/api/records/${id}`, { method: 'DELETE' })
        }
    }
}
```

### Integration with ResourceView Views

**ListView (Bulk Actions):**
- Actions appear in a drawer when rows are selected
- Context provides `selectedIds` array
- Actions receive array of selected records

**FormView (Quick Actions):**
- Actions appear in the Quick Actions sidebar
- Context provides single `record` object
- Actions receive array with single record

For detailed documentation, see:
- [ServerActions README](../Actions/README.md)
- [Export README](../Export/README.md)
- [Print README](../Print/README.md)
- [ListView README](ListView/README.md)
- [FormView README](FormView/README.md)
- [Search README](../Search/README.md)
- [Filter README](../Filter/README.md)

---

## Features

- **Unified View Management**: Switch between List, Kanban, Gantt, and Form views
- **State Preservation**: Maintain state when switching between views
- **Edit/Create Workflow**: Automatically switch to FormView for editing or creating records
- **Config-Based**: All views are configured through a single config object
- **Reusable**: Designed for reuse across different models and projects
- **Field-based Search**: Advanced search component with field selection and tag-based UI
- **Field-based Filter**: Advanced filter component with field, operator, and value selection

## Search Component

ResourceView includes a flexible Search component that supports field-based searching with a tag-based UI.

**Features:**
- **Field Selection**: Search by specific fields (name, price, phone, etc.) or search across all fields
- **Tag-based UI**: Search terms are displayed as tags with close buttons for easy removal
- **Multiple Search Terms**: Add multiple search criteria with AND logic (all must match)
- **Keyboard Support**: Press Enter to add search terms, Backspace to remove last tag
- **Auto-populated Fields**: Search fields are automatically populated from ListView config columns

**Usage:**
The Search component is automatically rendered in the ResourceView header when in list view. It receives field definitions from the ListView config columns and passes search values to the ListView for filtering.

For detailed documentation, see [Search README](../Search/README.md).

## Filter Component

ResourceView includes a flexible Filter component that supports field-based filtering with operator selection.

**Features:**
- **Field Selection**: Filter by specific fields (name, price, phone, etc.)
- **Operator Selection**: Choose comparison operators (equals, contains, >, <, etc.) based on field type
- **Tag-based UI**: Active filters are displayed as tags with close buttons for easy removal
- **Multiple Filters**: Add multiple filter criteria with AND logic (all must match)
- **Type Support**: Supports text, number, date, options, and boolean field types
- **Keyboard Support**: Press Enter to add filters
- **Auto-populated Fields**: Filter fields are automatically populated from ListView config columns

**Usage:**
The Filter component is automatically rendered in the ResourceView header when in list view. It receives field definitions from the ListView config columns and passes filter values to both ListView and KanbanView for filtering.

For detailed documentation, see [Filter README](../Filter/README.md).

## Folder Structure

```
components/admin/ResourceView/
├── index.tsx          # Main ResourceView component
├── types.ts           # TypeScript type definitions
├── Search/            # Search component
│   ├── index.tsx      # Search component implementation
│   ├── FieldTagInput.tsx  # Custom tag input with field selector
│   └── README.md      # Search component documentation
├── Filter/            # Filter component
│   ├── index.tsx      # Filter component implementation
│   ├── FieldFilterInput.tsx  # Custom filter input with field/operator selectors
│   └── README.md      # Filter component documentation
├── Export/            # Export component
│   ├── index.tsx      # Export component implementation
│   ├── types.ts       # Export type definitions
│   └── README.md      # Export component documentation
├── Print/             # Print component
│   ├── index.tsx      # Print component implementation
│   ├── types.ts       # Print type definitions
│   └── README.md      # Print component documentation
├── ListView/          # List view component
├── KanbanView/        # Kanban view component
├── GanttView/         # Gantt view component
├── FormView/          # Form view component
├── ServerActions/     # Server actions system
└── README.md          # This file
```

## Usage

### Basic Usage

```tsx
import { ResourceView } from '@/components/admin/ResourceView'
import { ListView } from '@/components/admin/ResourceView/ListView'
import { KanbanView } from '@/components/admin/ResourceView/KanbanView'
import { GanttView } from '@/components/admin/ResourceView/GanttView'
import { FormView } from '@/components/admin/ResourceView/FormView'

const config = {
  type: 'list',
  listViewConfig: {
    title: 'Products',
    columns: productColumns,
    data: productData,
    showFilters: true,
    showSearch: true,
    enableGroupBy: true,
    enableGanttView: true,
  },
  kanbanViewConfig: {
    mode: 'state-control',
    stateField: 'status',
    columns: statusColumns,
    data: productData,
    onStateChange: handleStatusUpdate,
  },
  formViewConfig: productFormConfig,
  ganttConfig: {
    startDateKey: 'startDate',
    endDateKey: 'endDate',
    titleKey: 'name',
  },
}

<ResourceView
  config={config}
  onEdit={handleEdit}
  onCreate={handleCreate}
  onDelete={handleDelete}
  loading={loading}
/>
```

## View Types

### List View
- Displays data in a table format
- Supports filtering, sorting, pagination, and grouping
- Gantt view can be enabled for timeline visualization

### Kanban View
- Displays data in columns based on state
- Supports drag-and-drop to move items between columns
- Automatically updates state field when items are moved

### Form View
- Used for creating and editing records
- Automatically switches from list/form when edit/create is triggered
- Returns to list view after form submission

### Gantt View
- Timeline visualization of data
- Currently embedded within ListView
- Configured through listViewConfig with gantt settings

## API Reference

### ResourceViewConfig

```typescript
interface ResourceViewConfig {
  type: ResourceType  // 'list' | 'kanban' | 'gantt' | 'form'
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

### ResourceViewProps

```typescript
interface ResourceViewProps {
  config: ResourceViewConfig
  onEdit?: (rowData: any) => void
  onCreate?: () => void
  onDelete?: (rowData: any) => void
  loading?: boolean
}
```

## Workflow

1. **List Mode**: Display data in table format with filters, search, and pagination
2. **Kanban Mode**: Display data in columns based on state with drag-and-drop
3. **Gantt Mode**: Display data as timeline (embedded in ListView)
4. **Form Mode**: Display form for creating or editing records
5. **Transitions**: 
   - Click "Edit" on a record → Switch to Form View in edit mode
   - Click "Create" button → Switch to Form View in create mode
   - Form completion → Return to previous view (List by default)

## Integration Example

```tsx
// In your page component
import { ResourceView } from '@/components/admin/ResourceView'
import { getProductListConfig, productFormConfig } from '@/app/admin/products/config'

export default function ProductsPage() {
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState([])

  const handleEdit = (product) => {
    // Handle edit logic
  }

  const handleCreate = () => {
    // Handle create logic
  }

  const handleDelete = (product) => {
    // Handle delete logic
  }

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

## Architecture

The ResourceView serves as the parent component that:
- Manages view state transitions
- Coordinates between different view components
- Provides a unified API for all view types
- Simplifies integration across the application

### Component Hierarchy
```
ResourceView
├── ListView
│   ├── Table
│   │   ├── Checkbox Column (selection)
│   │   ├── Column Picker Column (three-dot menu)
│   │   └── Data Columns
│   ├── Filter Panel
│   └── Column Picker (legacy, kept for backward compatibility)
├── KanbanView
├── GridView
├── GanttView
└── FormView
```

### Loading State
ResourceView provides a loading state for form view when editing and data is not yet loaded:
- Shows a full-screen overlay with RSuite Loader component
- Automatically displays when `viewType === 'form'`, `entityId` is set, but `formInitialData` is not yet available
- Improves perceived performance by showing loading indicator instead of empty form

### State Management
- **External State**: ResourceView manages global state (search, filter panel, selected IDs, actions drawer)
- **Local State**: ListView uses local state when external state is not provided
- **State Propagation**: State can be passed down from ResourceView to ListView via props

### ListView Component Features

#### Key Features:
- **Checkbox Selection**: RSuite Checkbox component for selecting rows
  - Wrapped in div with stopPropagation to prevent row navigation when clicking checkboxes
  - Header checkbox for select all functionality
- **Column Picker**: Located in table header with three-dot menu icon
  - Opens Whisper/Popover dropdown with column checkboxes
  - Allows showing/hiding columns dynamically
- **Summary/Summable**: Display summary statistics for numeric columns
  - Supports: sum, count, avg, min, max
  - Configured via `summary` and `summaryType` properties in column config
- **Pagination**: RSuite Pagination component with configurable page size
- **Sorting**: Click column headers to sort by that column
- **Filtering**: Filter panel with various input types based on column filterType
- **Bulk Actions**: When records are selected via checkboxes:
  - Actions Button appears in the ResourceView header toolbar (next to Search, Filter, Add New)
  - Clicking the Actions button opens a Popover dropdown with:
    - Export to Excel (with FileSpreadsheet icon)
    - Delete Selected (with Trash2 icon, red color)
    - **Custom Bulk Actions** (configured per model/entity)
  - The Popover shows the count of selected items in the button label
  - Custom bulk actions can be configured via `bulkActions` property in ListViewConfig:
    ```typescript
    import { Package, AlertTriangle } from 'lucide-react'

    export const listViewConfig: ListViewConfig = {
      title: 'Products',
      columns: [...],
      bulkActions: [
        {
          label: 'Apply Stock',
          icon: <Package size={16} />,
          color: 'green',
          confirm: 'Apply stock to selected products?',
          helper: 'Update inventory levels for selected products',
          onClick: (selectedIds, selectedData) => {
            console.log('Apply stock to:', selectedIds)
            // Custom logic to apply stock to selected products
          }
        },
        {
          label: 'Mark as Low Stock',
          icon: <AlertTriangle size={16} />,
          color: 'orange',
          show: (selectedIds, selectedData) => {
            // Only show if at least one item has stock < 10
            return selectedData.some(item => item.stock < 10)
          },
          confirm: (selectedIds, selectedData) => {
            return `Mark ${selectedIds.length} products as low stock?`
          },
          onClick: (selectedIds, selectedData) => {
            console.log('Mark as low stock:', selectedIds)
            // Custom logic to mark items as low stock
          }
        }
      ]
    }
    ```
    **BulkActionConfig Properties:**
    - `label`: Button label text
    - `icon`: Optional React icon component
    - `color`: Button color (blue, green, red, orange, violet, yellow, cyan)
    - `onClick`: Function called when button is clicked, receives selectedIds and selectedData
    - `show`: Optional function to conditionally show/hide the action based on selection
    - `confirm`: Optional string or function for confirmation dialog before executing action
      - If string: Static confirmation message
      - If function: Dynamic confirmation message based on selectedIds and selectedData
      - If not provided: No confirmation dialog will be shown
    - `helper`: Optional helper text that appears on hover (Whisper tooltip with bottom placement)

### CustomView

CustomView allows rendering arbitrary React components with access to the ResourceView context (search, filter, loading, refresh). Useful for dashboards, reports, or any view that doesn't fit List/Kanban/Gantt/Form.

### Usage

1. Set `type: 'custom'` in the ResourceView config.
2. Provide a `customView` component that receives `CustomViewProps`.
3. The view switcher and search/filter bars are hidden in custom mode.

```typescript
// In your page config
import { CustomDashboard } from './CustomDashboard'

export const config: ResourceViewConfig = {
  type: 'custom',
  title: 'Dashboard',
  customView: CustomDashboard,
}
```

```typescript
// CustomDashboard.tsx
import { CustomViewProps } from '@/components/Base/Views/types'

export function CustomDashboard({ loading, onRefresh }: CustomViewProps) {
  return <div>{/* your custom content */}</div>
}
```

### CustomViewProps
| Prop | Type | Description |
|------|------|-------------|
| `searchValues` | `any[]` | Current search values from ResourceView search bar |
| `filterValues` | `any[]` | Current filter values from ResourceView filter bar |
| `loading` | `boolean` | Loading state from parent |
| `onRefresh` | `() => void` | Triggers parent data re-fetch |

## View Switcher

The view switcher is a segmented control with an animated sliding pill indicator showing available views (List, Kanban, Gantt). It renders in the ResourceView header when the current view is not `form` or `custom`.

- Uses CSS `transition-all duration-200` for the pill indicator animation
- Positions the pill via `useEffect` measuring button ref offsets
- Only shows view types that have their config provided (e.g., if `kanbanViewConfig` is missing, the Kanban button is hidden)

## ModuleNavBar

The `ModuleNavBar` is a sticky horizontal navigation strip rendered below `AdminTopNavbar` in the admin layout. It provides context-sensitive navigation based on the current sidebar section.

### Context Sections
| Section | Detection | Modules Shown |
|---------|-----------|---------------|
| Dashboard | `/admin` or `/admin?tab=` | Overview, Revenue, Analytics, Reports |
| Catalog | `/admin/inventory`, `/admin/products*`, `/admin/tax-rates`, etc. | Dashboard, Products (dropdown), Configuration (dropdown) |
| Sales | `/admin/orders*`, `/admin/invoices*` | Orders, Order Lines, Invoices, Payment Trans. |
| Customers | `/admin/customers*`, `/admin/addresses*` | Customers, Addresses, Wishlist, Cart Items, etc. |
| Marketing | `/admin/announcements*`, `/admin/coupons*` | Announcements, Coupons, Reviews |
| Content | `/admin/pages*`, `/admin/menus*` | Pages, Menus |
| System | `/admin/settings*`, `/admin/configurations*` | Settings, Config. |

### Dropdown Groups
Some sections render dropdown groups (e.g., Catalog > Products and Configuration) using `@/components/ui/dropdown-menu` (Radix UI). These use portals to escape parent overflow clipping and support keyboard navigation.

### Location
`components/admin/module-navbar.tsx` — imported in `app/admin/layout.tsx`.
