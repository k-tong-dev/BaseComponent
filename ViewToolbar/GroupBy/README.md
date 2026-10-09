# GroupBy Component

The GroupBy component allows users to group data in the ListView by a selected field, transforming the table into a tree structure for better data organization.

## Features

- **Button-triggered popover**: Click the Group button to open a popover with field selection options
- **Field selection**: Choose from available fields to group the data by
- **Clear grouping**: Easily remove grouping with the Clear button
- **Visual feedback**: Button shows purple when grouped, displays the selected field name
- **Tree transformation**: Automatically converts flat data to tree structure when grouped
- **Expandable groups**: All groups are expanded by default for easy viewing

## Usage

```tsx
import {GroupBy} from './GroupBy'

<GroupBy
    fields={[
        { key: 'category', label: 'Category' },
        { key: 'status', label: 'Status' },
        { key: 'priority', label: 'Priority' }
    ]}
    value={groupByField}
    onChange={setGroupByField}
/>
```

## Props

| Prop        | Type                                 | Default | Description                               |
|-------------|--------------------------------------|---------|-------------------------------------------|
| `fields`    | `GroupField[]`                       | `[]`    | Array of fields available for grouping    |
| `value`     | `string \| null`                     | `null`  | Currently selected field key for grouping |
| `onChange`  | `(fieldKey: string \| null) => void` | -       | Callback when group field changes         |
| `className` | `string`                             | `""`    | Additional CSS classes for the component  |

## GroupField Interface

```typescript
interface GroupField {
    key: string    // Field key in the data
    label: string  // Display label for the field
}
```

## Integration with ResourceView

The GroupBy component is integrated into ResourceView and automatically:

1. Extracts groupable fields from ListView columns (columns with `groupable !== false`)
2. Passes the selected group field to ListView
3. ListView transforms data into tree structure when grouped
4. Table switches to tree mode with expand/collapse functionality

## Data Transformation

When a field is selected for grouping:

1. Data is grouped by the selected field value
2. Each group becomes a parent node with `_isGroup: true`
3. Original data items become children of their respective groups
4. Groups are labeled with the field value
5. Uncategorized items are grouped under "Uncategorized"

## Tree Structure Example

```typescript
// Original data
[
    { id: 1, category: 'Electronics', name: 'Laptop' },
    { id: 2, category: 'Electronics', name: 'Phone' },
    { id: 3, category: 'Clothing', name: 'Shirt' }
]

// Grouped by 'category'
[
    {
        id: 'group-Electronics',
        category: 'Electronics',
        _isGroup: true,
        children: [
            { id: 1, category: 'Electronics', name: 'Laptop' },
            { id: 2, category: 'Electronics', name: 'Phone' }
        ]
    },
    {
        id: 'group-Clothing',
        category: 'Clothing',
        _isGroup: true,
        children: [
            { id: 3, category: 'Clothing', name: 'Shirt' }
        ]
    }
]
```

## ListView Integration

The ListView component automatically:

- Uses `groupedTreeData` instead of `paginatedData` when grouped
- Enables `isTree` prop on Table component
- Sets `defaultExpandAllRows` to true
- Marks the grouped column with `treeCol` prop
- Prevents row clicks on group nodes (`_isGroup: true`)

## Styling

- **Inactive state**: Gray border, "Group" text
- **Active state**: Purple background, white text, displays field name
- **Popover**: White background, field list with hover states
- **Selected field**: Blue background, blue text

## Dependencies

- React
- rsuite (Popover, Whisper)
- lucide-react (Group icon)
- shadcn/ui (Button component)

## Notes

- Grouping works with all field types (text, number, date, options, boolean)
- Grouping is applied after filtering and search
- Pagination is disabled when grouped (shows all grouped data)
- Sorting still works within groups
- Group rows are not selectable or clickable
