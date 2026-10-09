# Filter Component

A flexible, field-based filter component for ResourceView that supports filtering by specific fields with different operators and value types.

## Features

- **Field-based Filtering**: Filter by specific fields (name, price, phone, etc.) with different operators
- **Tag-based UI**: Active filters are displayed as tags with close buttons for easy removal
- **Multiple Filters**: Add multiple filter criteria with AND logic (all must match)
- **Field Selector**: Dropdown to select which field to filter
- **Operator Selector**: Dropdown to select comparison operator (equals, contains, >, <, etc.)
- **Type Support**: Supports text, number, date, options, and boolean field types
- **Keyboard Support**: Press Enter to add filter
- **Customizable**: Configurable fields, operators, and styling

## Props

### FilterProps

| Prop             | Type                              | Default       | Description                        |
|------------------|-----------------------------------|---------------|------------------------------------|
| `fields`         | `FilterField[]`                   | `[]`          | Array of filterable fields         |
| `value`          | `FilterValue[]`                   | `[]`          | Current filter values              |
| `onChange`       | `(values: FilterValue[]) => void` | `undefined`   | Callback when filter values change |
| `className`      | `string`                          | `""`          | Additional CSS classes             |

### FilterField

| Property | Type                           | Required | Description                                         |
|----------|--------------------------------|----------|-----------------------------------------------------|
| `key`    | `string`                       | Yes      | Unique field identifier (e.g., "name", "price")     |
| `label`  | `string`                       | Yes      | Display label for the field (e.g., "Name", "Price") |
| `type`   | `FilterType`                   | Yes      | Field type for validation and operators             |
| `options`| `Array<{label: string; value: any}>` | No       | Options for 'options' type fields                   |

### FilterValue

| Property   | Type           | Description                                        |
|------------|----------------|----------------------------------------------------|
| `fieldKey` | `string`       | The field being filtered                           |
| `operator` | `FilterOperator`| The comparison operator (equals, contains, etc.)   |
| `value`    | `any`          | The filter value                                   |

### FilterType

- `'text'` - Text fields with equals, contains, startsWith, endsWith operators
- `'number'` - Number fields with equals, gt, lt, gte, lte, between operators
- `'date'` - Date fields with equals, gt, lt, gte, lte, between operators
- `'options'` - Select fields with equals operator
- `'boolean'` - Boolean fields with equals operator

### FilterOperator

- `'equals'` - Exact match
- `'contains'` - Contains substring (text only)
- `'startsWith'` - Starts with substring (text only)
- `'endsWith'` - Ends with substring (text only)
- `'gt'` - Greater than (number/date)
- `'lt'` - Less than (number/date)
- `'gte'` - Greater than or equal (number/date)
- `'lte'` - Less than or equal (number/date)
- `'between'` - Between two values (number/date)

## Usage

### Basic Usage

```tsx
import {Filter} from '@/components/admin/ResourceView/Filter'

function MyComponent() {
  const filterFields = [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'price', label: 'Price', type: 'number' },
    { key: 'status', label: 'Status', type: 'options', options: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' }
    ]}
  ]

  const handleFilterChange = (values) => {
    console.log('Filter values:', values)
    // values: [
    //   { fieldKey: 'name', operator: 'contains', value: 'John' },
    //   { fieldKey: 'price', operator: 'gt', value: 100 }
    // ]
  }

  return (
    <Filter 
      fields={filterFields}
      onFilterChange={handleFilterChange}
    />
  )
}
```

### Integration with ResourceView

```tsx
import {Filter} from '@/components/admin/ResourceView/Filter'

export function ResourceView({config, ...props}: ResourceViewProps) {
  const [filterValues, setFilterValues] = useState<FilterValue[]>([])

  // Define filterable fields from ListView config
  const filterFields = config.listViewConfig?.columns
    .filter(col => col.filterable !== false)
    .map(col => ({
      key: col.key,
      label: col.title,
      type: col.type || 'text',
      options: col.filterOptions
    })) || []

  const handleFilterChange = (values: FilterValue[]) => {
    setFilterValues(values)
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <Filter 
          fields={filterFields}
          value={filterValues}
          onChange={handleFilterChange}
        />
      </div>
      {/* Pass filterValues to ListView for filtering */}
      <ListView 
        config={config.listViewConfig}
        filterValues={filterValues}
        {...props}
      />
    </div>
  )
}
```

## Behavior

### Adding Filters

1. Select a field from the dropdown
2. Select an operator from the dropdown (based on field type)
3. Type a value in the input
4. Press Enter or click "Add" to add the filter
5. The filter appears as a tag with field, operator, and value

### Removing Filters

- Click the × button on a filter tag to remove it

### Field Selection

- Only fields that don't already have active filters are shown
- When a field is selected, available operators are shown based on field type
- After adding a filter, the field selector moves to the next available field

### Operator Selection

- Available operators depend on field type:
  - Text: equals, contains, startsWith, endsWith
  - Number/Date: equals, gt, lt, gte, lte, between
  - Options/Boolean: equals only

### Filter Logic

- **AND Logic**: When multiple filters are added, ALL must match for an item to be included
- Example: Filter name "contains John" + price "gt 100" → shows items with BOTH matching name AND price
- Each filter value must match its respective field with the specified operator

### Filter Value Updates

- The `onChange` callback is called whenever filter values are added or removed
- The callback receives an array of `FilterValue` objects
- Parent components can use these values to filter data

## Styling

The component uses:
- Custom `FieldFilterInput` component with integrated field and operator selectors
- Blue-colored filter tags with close buttons
- Lucide icons (ChevronDown, Plus)
- Tailwind CSS for layout and spacing

Custom styles can be applied via the `className` prop.

## Future Enhancements

- Date picker for date fields
- Range inputs for 'between' operator
- Filter presets/saved filters
- Advanced nested conditions (AND/OR groups)
- Debounced filter application for performance
