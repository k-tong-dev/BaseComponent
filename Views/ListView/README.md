# ListView Component Documentation

## Overview

The `ListView` is a table component built with rsuite Table. It provides a clean interface for displaying tabular data with features like filtering, sorting, pagination, and tree view. **Note:** Header controls (view switcher, filters, search, export) are now handled by the parent `ResourceView` component.

## Features

- **Table Display**: Clean table display using rsuite Table
- **Advanced Filtering**: Column-level filtering with text, number, date, options, and boolean filters
- **Column Sorting**: Sort data by clicking column headers with visual indicators
- **Tree View**: Group data by specified field for hierarchical display
- **Pagination**: Navigate through large datasets efficiently
- **Header Summary**: Display column summaries (sum, count, avg, min, max)
- **Custom Render Functions**: Format cell data with custom renderers
- **Configurable**: Highly customizable through configuration objects
- **ServerActions Integration**: Shared action system with FormView for bulk operations

## Architecture Note

ListView is designed to be used within the `ResourceView` parent component, which provides:
- View switcher (List, Kanban, Gantt)
- Search input
- Filter toggle
- Export button
- Add New button

When using ListView directly, these controls need to be implemented externally.

## Installation

The ListView component is located at `components/admin/ResourceView/ListView`. It uses rsuite Table and related components.

## Usage

### Within ResourceView (Recommended)

```typescript
import { ResourceView } from '@/components/admin/ResourceView'
import { getProductListConfig } from '@/app/admin/products/config'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  
  const config = {
    type: 'list' as const,
    listViewConfig: getProductListConfig(products),
    formViewConfig: productFormConfig,
  }
  
  return (
    <ResourceView
      config={config}
      onEdit={(row) => router.push(`/admin/products/${row.id}/edit`)}
      onDelete={(row) => handleDelete(row.id)}
      loading={loading}
    />
  )
}
```

### Direct Usage (Without ResourceView)

```typescript
import { ListView } from '@/components/admin/ResourceView/ListView'
import { getProductListConfig } from '@/app/admin/products/config'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  
  const config = getProductListConfig(products)
  
  return (
    <ListView 
      config={config}
      onRowClick={(row) => console.log('Row clicked:', row)}
      onEdit={(row) => router.push(`/admin/products/${row.id}/edit`)}
      onDelete={(row) => handleDelete(row.id)}
      loading={loading}
    />
  )
}
```

## Props Interface

```typescript
export interface ListViewProps {
  config: ListViewConfig          // Configuration object
  onRowClick?: (rowData: any) => void      // Callback when a row is clicked
  onEdit?: (rowData: any) => void          // Callback for edit action
  onDelete?: (rowData: any) => void        // Callback for delete action
  loading?: boolean                           // Loading state
}
```

## Configuration Interface

```typescript
export interface ListViewConfig {
  title: string                      // Title used for export filename
  columns: ListColumn[]              // Array of column definitions
  data: any[]                       // Array of data to display
  showColumnToggle?: boolean        // Show column visibility toggle (default: false)
  showSearch?: boolean              // Show global search (default: false)
  showFilters?: boolean             // Show column filters (default: false)
  showViewSwitcher?: boolean        // Show view type switcher (default: false)
  showExport?: boolean              // Show export button (default: false)
  defaultVisibleColumns?: string[]  // Array of column keys to show by default
  pageSize?: number                 // Number of rows per page (default: 20)
  enableGroupBy?: boolean           // Enable group-by/tree view (default: false)
  enableGanttView?: boolean         // Enable Gantt view (default: false)
  ganttStartDateKey?: string        // Field key for Gantt start date
  ganttEndDateKey?: string          // Field key for Gantt end date
  ganttTitleKey?: string            // Field key for Gantt title
}
```

**Note:** When using ListView within ResourceView, set `showSearch`, `showFilters`, `showViewSwitcher`, and `showExport` to `false` as ResourceView handles these controls.
```

## Column Definition

```typescript
export interface ListColumn {
  key: string                       // Field key in data object
  title: string                     // Column header text
  width?: number                    // Column width (in pixels)
  resizable?: boolean              // Allow column resizing
  sortable?: boolean               // Enable sorting for this column
  filterable: boolean             // Enable filtering for this column
  type?: 'text' | 'number' | 'date' | 'options' | 'boolean'  // Field type for filtering and display
  filterOptions?: Array<{ label: string; value: any }>  // Options for type: 'options'
  filterDataFetcher?: () => Promise<Array<{ label: string; value: any }>>  // Async fetch for filter options
  filterDefault?: any             // Default filter value
  render?: (value: any, rowData: any) => React.ReactNode  // Custom cell renderer
  align?: 'left' | 'center' | 'right'  // Text alignment
  groupable?: boolean             // Enable group-by for this column
  summary?: boolean               // Enable header summary for this column
  summaryType?: 'sum' | 'count' | 'avg' | 'min' | 'max'  // Type of summary calculation
}
```

## Creating a List Configuration

### Example Configuration

```typescript
import React from 'react'
import { ListViewConfig, ListColumn } from '../ListView'

export const getProductListConfig = (data: any[] = []): ListViewConfig => ({
  title: 'Products',
  data: data,
  showColumnToggle: false,  // Disabled when using ResourceView
  showSearch: false,        // Disabled when using ResourceView
  showFilters: false,       // Disabled when using ResourceView
  showViewSwitcher: false,  // Disabled when using ResourceView
  showExport: false,        // Disabled when using ResourceView
  defaultVisibleColumns: [
    'name',
    'sku',
    'price',
    'stock',
    'status'
  ],
  pageSize: 20,
  columns: [
    {
      key: 'id',
      title: 'ID',
      width: 80,
      sortable: true,
      filterable: false,
      align: 'center'
    },
    {
      key: 'name',
      title: 'Product Name',
      width: 200,
      resizable: true,
      sortable: true,
      filterable: true,
      type: 'text',
      align: 'left'
    },
    {
      key: 'price',
      title: 'Price',
      width: 100,
      sortable: true,
      filterable: true,
      type: 'number',
      align: 'right',
      render: (value) => `$${parseFloat(value).toFixed(2)}`
    },
    {
      key: 'stock',
      title: 'Stock',
      width: 80,
      sortable: true,
      filterable: true,
      type: 'number',
      align: 'center',
      render: (value) => {
        const stock = parseInt(value)
        if (stock <= 0) return <span className="text-red-500 font-semibold">{stock}</span>
        if (stock < 10) return <span className="text-yellow-500 font-semibold">{stock}</span>
        return <span className="text-green-500">{stock}</span>
      }
    },
    {
      key: 'status',
      title: 'Status',
      width: 100,
      sortable: true,
      filterable: true,
      type: 'options',
      filterOptions: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' }
      ],
      align: 'center',
      render: (value) => {
        const statusColors: Record<string, string> = {
          draft: 'gray',
          published: 'green',
          archived: 'red'
        }
        const color = statusColors[value] || 'gray'
        return <span className={`bg-${color}-100 text-${color}-300 px-2 py-1 rounded text-xs font-medium capitalize`}>{value}</span>
      }
    }
  ]
})
```

## View Types

### List View
The default table view with sortable columns and row selection.

### Kanban View
Card-based layout displaying up to 3 fields per card. Useful for visual browsing.

### Grid View
Compact card layout displaying up to 2 fields per card. Best for high-density displays.

## Features in Detail

### Checkbox Selection
- **Master Checkbox**: Located in the table header, selects/deselects all rows on the current page
- **Row Checkboxes**: Located in each row, selects/deselects individual rows
- **Bulk Actions**: When rows are selected, an "Actions" button appears in the ResourceView header toolbar
- Clicking the Actions button opens a Popover dropdown with bulk action options

### Export Functionality
- Exports selected rows to CSV format
- Includes only visible columns
- Downloads file as `{title}_export.csv`
- Requires at least one row to be selected

### Pagination
- Configurable page size (default: 20)
- Shows "Showing X to Y of Z records"
- Smart page number display (max 5 page numbers visible)
- Previous/Next navigation buttons
- Automatically handles edge cases (first/last page)

### Column Visibility
- Click "Columns" button to toggle column visibility
- Checkboxes for each column
- Changes persist until page refresh
- Affects all view types

### Search
- Global search across all fields
- Case-insensitive
- Real-time filtering
- Works with all data types

### Sorting
- Click column header to sort
- Toggle between ascending/descending
- Visual indicator (↑/↓) shows current sort direction
- Only columns with `sortable: true` can be sorted

## Styling

The ListView uses Tailwind CSS classes for styling. You can customize the appearance by:

1. **Modifying the component**: Edit `components/admin/ListView.tsx`
2. **Using custom render functions**: Format cells with custom JSX
3. **Overriding CSS**: Add custom styles in your global CSS

## Responsive Behavior

- **Mobile (< 640px)**: Single column layout, stacked controls
- **Tablet (640px - 1024px)**: Multi-column grid for Kanban/Grid views
- **Desktop (> 1024px)**: Full layout with all features

## Best Practices

1. **Keep data manageable**: For large datasets (> 1000 rows), consider server-side pagination
2. **Use appropriate types**: Match `type` to your data type for better UX (text, number, date, options, boolean)
3. **Custom render functions**: Use render functions for complex formatting (dates, currencies, statuses)
4. **Set reasonable defaults**: Configure `defaultVisibleColumns` to show the most important fields
5. **Handle loading state**: Always pass the `loading` prop when fetching data
6. **Provide callbacks**: Implement `onRowClick`, `onEdit`, and `onDelete` for full functionality

## Example: Full Implementation

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ListView } from '@/components/admin/ResourceView/ListView'
import { getProductListConfig } from '@/app/admin/products/config'
import { showToast } from '@/lib/ui/toast'

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      showToast('error', 'Error', 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleRowClick = (row: Product) => {
    router.push(`/admin/products/${row.id}/edit`)
  }

  const handleDelete = async (row: Product) => {
    const ok = window.confirm('Delete this product?')
    if (!ok) return

    try {
      await fetch(`/api/products/${row.id}`, { method: 'DELETE' })
      setProducts(prev => prev.filter(p => p.id !== row.id))
      showToast('success', 'Deleted', 'Product deleted successfully')
    } catch (error) {
      showToast('error', 'Error', 'Failed to delete product')
    }
  }

  const config = getProductListConfig(products)

  return (
    <Card className="mx-auto max-w-7xl border-border/50">
      <div className="flex items-center justify-between gap-4 px-6 pt-2">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your product catalog.</p>
        </div>
        <Button onClick={() => router.push('/admin/products/new')} size="sm">
          Add Product
        </Button>
      </div>

      <div className="p-3 pt-1">
        <ListView 
          config={config} 
          onRowClick={handleRowClick}
          onDelete={handleDelete}
          loading={loading}
        />
      </div>
    </Card>
  )
}
```

## Troubleshooting

### Data not displaying
- Ensure your data array is properly formatted
- Check that column keys match data object keys
- Verify that `defaultVisibleColumns` contains valid column keys

### Selection not working
- Ensure your data objects have an `id` or `_id` field
- Check that the checkbox event handlers are not being prevented

### Export not downloading
- Ensure at least one row is selected
- Check browser popup blockers
- Verify the CSV generation logic

### Styling issues
- Ensure Tailwind CSS is properly configured
- Check that shadcn/ui components are installed
- Verify component imports are correct

## ServerActions Integration

ListView now uses the **ServerActions** component for bulk operations, providing a unified action system that works across both ListView and FormView.

### Bulk Actions Popover

When rows are selected, an "Actions" button appears in the ResourceView header toolbar. Clicking it opens a Popover dropdown containing bulk action buttons.

### Migration from BulkActionConfig to ServerActions

The old `BulkActionConfig` interface is being replaced with `ServerActionConfig`. A converter function is provided for backward compatibility:

**Old (BulkActionConfig):**
```typescript
bulkActions: [
  {
    label: 'Delete Selected',
    icon: <Trash2 size={16} />,
    color: 'red',
    onClick: (selectedIds, selectedData) => {
      selectedData.forEach(item => onDelete(item))
    },
    confirm: 'Delete selected records?',
    helper: 'Permanently remove selected records'
  }
]
```

**New (ServerActionConfig):**
```typescript
import { ServerActionConfig } from '@/components/admin/ResourceView/ServerActions'

const bulkActions: ServerActionConfig[] = [
  {
    key: 'delete_selected',
    label: 'Delete Selected',
    icon: <Trash2 size={16} />,
    color: 'red',
    mode: 'bulk',
    confirm: (data, context) => `Delete ${context.selectedIds?.length} records?`,
    helper: 'Permanently remove selected records',
    onClick: async (data, context) => {
      const ids = context.selectedIds || data.map(d => d.id)
      await fetch('/api/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids })
      })
    }
  }
]
```

### Context Handling in ListView

In ListView, the action context provides:
- `context.mode = 'bulk'`: Bulk record mode
- `context.view = 'list'`: List view context
- `context.selectedIds`: Array of selected record IDs
- `data`: Array of selected records

**Example: Action that works in both ListView and FormView:**
```typescript
const deleteAction: ServerActionConfig = {
  key: 'delete',
  label: 'Delete',
  icon: <Trash2 size={16} />,
  color: 'red',
  mode: 'both',
  confirm: (data, context) => {
    if (context.mode === 'bulk') {
      return `Delete ${context.selectedIds?.length} records?`
    } else {
      return 'Delete this record?'
    }
  },
  onClick: async (data, context) => {
    if (context.mode === 'bulk') {
      // ListView: Delete multiple
      const ids = context.selectedIds || data.map(d => d.id)
      await fetch('/api/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids })
      })
    } else {
      // FormView: Delete single
      const id = context.record?.id || data[0]?.id
      await fetch(`/api/records/${id}`, { method: 'DELETE' })
    }
  }
}
```

### Backward Compatibility

Existing configurations using `BulkActionConfig` are automatically converted using the `convertToServerAction` function in ListView. No immediate changes are required, but migrating to `ServerActionConfig` is recommended for consistency.

For detailed ServerActions documentation, see: [ServerActions README](../../Actions/README.md)

## Future Enhancements

Potential features for future versions:
- Server-side pagination
- Advanced filtering (date ranges, multi-select)
- Column reordering
- Saved filter presets
- Bulk edit functionality
- Drag-and-drop row reordering
- Custom action buttons per row

## License

This component is part of the eCommerce project and follows the project's license.
