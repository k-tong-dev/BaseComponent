# Export Component

The Export component allows users to export data from any view (FormView, ListView) in either Excel or CSV format. It provides a UI for selecting fields to export, choosing the export type, and including an option to automatically add the 'id' field for data updates.

## Features

- **Export Formats**: Excel (.xlsx) and CSV (.csv)
- **Field Selection**: Dynamic field selection from available fields
- **"I want to update data" Switcher**: Automatically includes the 'id' field when enabled, even if not explicitly selected (required for re-import)
- **Select All / Deselect All**: Quick field selection controls
- **Dynamic Fields**: Fields are passed from view configurations, making it work for any entity

## Usage

### Basic Integration

The Export component is integrated with ServerActions. When the `export_excel` action is triggered, the Export modal opens.

```tsx
import {Export} from './Export'
import {ExportConfig} from './types'

<Export
    data={data}
    availableFields={availableFields}
    onExport={(config: ExportConfig) => {
        console.log('Export config:', config)
        // Handle export completion
    }}
    onClose={() => setShowExportModal(false)}
/>
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `data` | `any[]` | The data to export |
| `availableFields` | `Array<{ key: string; label: string; type?: string }>` | Available fields for export |
| `onExport` | `(config: ExportConfig) => void` | Callback when export is completed |
| `onClose` | `() => void` | Callback to close the modal |

### ExportConfig

```typescript
interface ExportConfig {
    fields: ExportField[]
    includeId: boolean // "I want to update data" switch
    exportType: 'excel' | 'csv'
}
```

### ExportField

```typescript
interface ExportField {
    key: string
    label: string
    selected: boolean
}
```

## Integration with Views

### FormView

```tsx
<FormView
    mode={editingId ? 'edit' : 'create'}
    config={config.formViewConfig}
    entityId={editingId}
    initialData={formInitialData}
    serverActions={mergedServerActions}
    availableFields={config.formViewConfig?.fields?.map(f => ({
        key: f.key,
        label: f.label,
        type: f.type
    })) || []}
/>
```

### ListView

```tsx
<ListView
    config={config.listViewConfig}
    onRowClick={handleEdit}
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
/>
```

### ServerActions

The Export modal is triggered automatically when the `export_excel` action is clicked in ServerActions:

```tsx
<ServerActions
    actions={mergedServerActions}
    data={data}
    context={actionContext}
    layout="dropdown"
    availableFields={availableFields}
/>
```

## How It Works

1. User clicks the "Export" action in ServerActions
2. Export modal opens with available fields
3. User selects export format (Excel/CSV)
4. User toggles "I want to update data" to include ID field
5. User selects/deselects fields to export
6. User clicks "Export" button
7. Data is processed and file is downloaded

## Data Processing

The Export component handles various data types:

- **Dates**: Converted to ISO string format
- **Objects**: Converted to JSON string
- **Arrays**: Converted to JSON string
- **Primitives**: Converted to string

## Dependencies

- `xlsx`: Used for Excel and CSV file generation

## Example Output

### Excel Export
- File: `export_{timestamp}.xlsx`
- Format: Excel workbook with single sheet named "Export"

### CSV Export
- File: `export_{timestamp}.csv`
- Format: Comma-separated values with headers
