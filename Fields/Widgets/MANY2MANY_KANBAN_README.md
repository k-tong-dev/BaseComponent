# Many2Many Widget - Kanban Mode

The Many2Many widget now supports a Kanban display mode, allowing you to visualize related records in a column-based layout grouped by a specific field.

## Features

- **Column-based Grouping**: Group items by any field (e.g., state, status, priority)
- **Color-coded Columns**: Each group can have a custom color
- **Card Display**: Shows item title and optional subtitle
- **Add/Remove Actions**: Easily add or remove linked records
- **Responsive Layout**: Horizontal scrolling for multiple columns

## Usage

### Basic Kanban Configuration

```typescript
import type { Many2ManyWidgetConfig } from '@/components/admin/ResourceView/FieldWidgets'

{
  key: 'task_ids',
  label: 'Tasks',
  type: 'many2many',
  widget: 'many2many',
  widgetConfig: {
    // Junction table configuration
    junctionTable: '/api/admin/project-tasks-rel',
    localField: 'project_id',
    remoteField: 'task_id',
    
    // Related records
    relation: '/api/admin/tasks',
    displayField: 'name',
    valueField: 'id',
    
    // Kanban mode
    mode: 'kanban',
    
    // Kanban-specific options
    kanbanGroupField: 'stage',  // Field to group by
    kanbanTitleField: 'name',   // Field for card title
    kanbanSubtitleField: 'description',  // Field for card subtitle
    
    // Group options with colors
    kanbanGroupOptions: [
      { value: 'draft', label: 'Draft', color: 'gray' },
      { value: 'in_progress', label: 'In Progress', color: 'blue' },
      { value: 'review', label: 'Review', color: 'yellow' },
      { value: 'done', label: 'Done', color: 'green' }
    ],
    
    // Actions
    allowSelect: true,
    allowRemove: true,
  } as Many2ManyWidgetConfig
}
```

### Advanced Example: Product Variants Kanban

```typescript
{
  key: 'variant_ids',
  label: 'Product Variants',
  type: 'many2many',
  widget: 'many2many',
  widgetConfig: {
    junctionTable: '/api/admin/product-variants-rel',
    localField: 'product_id',
    remoteField: 'variant_id',
    
    relation: '/api/admin/product-variants',
    displayField: 'name',
    valueField: 'id',
    
    mode: 'kanban',
    
    // Group by availability status
    kanbanGroupField: 'availability',
    kanbanTitleField: 'sku',
    kanbanSubtitleField: 'price',
    
    kanbanGroupOptions: [
      { value: 'in_stock', label: 'In Stock', color: 'green' },
      { value: 'low_stock', label: 'Low Stock', color: 'yellow' },
      { value: 'out_of_stock', label: 'Out of Stock', color: 'red' },
      { value: 'discontinued', label: 'Discontinued', color: 'gray' }
    ],
    
    allowSelect: true,
    allowRemove: true,
  } as Many2ManyWidgetConfig
}
```

## Configuration Options

### Display Modes

The Many2Many widget supports three display modes:

| Mode | Description | Use Case |
|------|-------------|----------|
| `list` | Table view with optional columns | Default, detailed data view |
| `tags` | Inline tags/chips | Simple list of items |
| `kanban` | Column-based grouped view | Workflow/status visualization |

### Kanban-specific Options

| Option | Type | Description |
|--------|------|-------------|
| `kanbanGroupField` | `string` | Field name to group items by |
| `kanbanGroupOptions` | `Array<{value, label, color}>` | Available groups with labels and colors |
| `kanbanTitleField` | `string` | Field to display as card title |
| `kanbanSubtitleField` | `string` | Field to display as card subtitle (optional) |
| `kanbanColorField` | `string` | Field that contains color value (alternative to groupOptions) |

### Color Options

Available colors for `kanbanGroupOptions`:

- `blue` - Blue border/header
- `green` - Green border/header
- `yellow` - Yellow border/header
- `red` - Red border/header
- `purple` - Purple border/header
- `orange` - Orange border/header
- `gray` - Gray border/header (default)

## Visual Example

```
┌─────────────────────────────────────────────────────────────┐
│ 6 linked records                    [+ Add lines]           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ ● Draft  (2)│  │ ● In Progress│ │ ● Done  (2) │         │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤         │
│  │ Task A      │  │ Task C      │  │ Task E      │         │
│  │ Description │  │ Description │  │ Description │         │
│  │          [x]│  │          [x]│  │          [x]│         │
│  │             │  │             │  │             │         │
│  │ Task B      │  │ Task D      │  │ Task F      │         │
│  │ Description │  │ Description │  │ Description │         │
│  │          [x]│  │          [x]│  │          [x]│         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Data Structure

The widget expects the following data structure for items:

```typescript
interface Many2ManyItem {
  id: string              // Unique identifier
  [groupField]: string    // Value for grouping (e.g., 'stage')
  [titleField]: string    // Value for card title
  [subtitleField]?: string // Value for card subtitle (optional)
  _related?: {            // Related record data
    [key: string]: any
  }
  _isNew?: boolean        // Whether this is a new (unsaved) item
  _toDelete?: boolean     // Whether this item is marked for deletion
}
```

## API Requirements

The related records API should return data that includes the grouping field:

```json
[
  {
    "id": "1",
    "name": "Task A",
    "description": "First task",
    "stage": "draft"
  },
  {
    "id": "2",
    "name": "Task B", 
    "description": "Second task",
    "stage": "in_progress"
  }
]
```

## Tips

1. **Choose meaningful group fields**: Select a field that provides clear workflow visualization
2. **Use consistent colors**: Match colors to your application's design system
3. **Keep subtitles short**: Long subtitles may be truncated
4. **Consider mobile**: The kanban view scrolls horizontally on smaller screens
5. **Combine with other modes**: Users can switch between list, tags, and kanban modes

## Migration from List Mode

To convert an existing Many2Many field from list to kanban mode:

```typescript
// Before (list mode)
{
  key: 'task_ids',
  label: 'Tasks',
  type: 'many2many',
  widgetConfig: {
    mode: 'list',
    // ... other config
  }
}

// After (kanban mode)
{
  key: 'task_ids',
  label: 'Tasks',
  type: 'many2many',
  widgetConfig: {
    mode: 'kanban',
    kanbanGroupField: 'stage',
    kanbanGroupOptions: [
      { value: 'draft', label: 'Draft', color: 'gray' },
      { value: 'in_progress', label: 'In Progress', color: 'blue' },
      { value: 'done', label: 'Done', color: 'green' }
    ],
    // ... other config remains the same
  }
}