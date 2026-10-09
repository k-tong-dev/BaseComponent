# Field Widgets Architecture

A flexible widget system for rendering custom field types in FormView and ListView, inspired by Odoo's field widget system.

## Overview

Field widgets allow you to customize how specific field types are rendered in forms and lists. This is particularly useful for:
- Many-to-many relationships with editable tables
- Many-to-one relationships with searchable selects
- One-to-many relationships with inline editing
- Custom data visualization
- Complex input components

## Architecture

### Widget Interface

```typescript
export interface FieldWidgetProps {
  value: any
  onChange: (value: any) => void
  field: FormField
  data: any  // Full form data
  disabled?: boolean
  readonly?: boolean
}

export interface FieldWidgetComponent extends React.FC<FieldWidgetProps> {
  widgetName: string
}
```

### Available Widgets

| Widget           | Type         | Description                                      |
|------------------|--------------|--------------------------------------------------|
| `one2many`       | One-to-Many  | Inline editable list of child records            |
| `many2many`      | Many-to-Many | Junction table management with tags or list view |
| `many2one`       | Many-to-One  | Searchable select for single relation            |
| `many2many_list` | Many-to-Many | Editable table for many-to-many (legacy)         |

**Note:** `one2many`, `many2many`, and `many2one` types are automatically handled by FormView. You can also use them via `widget` property or `type` property.

## Usage in FormView

To use a widget in a field configuration:

```typescript
{
  key: 'attribute_ids',
  label: 'Product Attributes',
  type: 'json',  // or 'array'
  widget: 'many2many_list',
  widgetConfig: {
    relation: 'product.attributes',
    displayField: 'name',
    columns: [
      { key: 'name', title: 'Name', width: 200 },
      { key: 'type', title: 'Type', width: 150 }
    ]
  }
}
```

## Creating Custom Widgets

### Step 1: Create Widget Component

```typescript
// components/admin/ResourceView/FieldWidgets/MyCustomWidget.tsx
import React from 'react'
import { FieldWidgetProps } from '../index'

export const MyCustomWidget: React.FC<FieldWidgetProps> = ({
  value,
  onChange,
  field,
  data,
  disabled,
  readonly
}) => {
  return (
    <div>
      {/* Your custom widget implementation */}
    </div>
  )
}

MyCustomWidget.widgetName = 'my_custom_widget'
```

### Step 2: Register Widget

```typescript
// components/admin/ResourceView/FieldWidgets/index.ts
import { MyCustomWidget } from './MyCustomWidget'

export const fieldWidgets = {
  my_custom_widget: MyCustomWidget,
  // ... other widgets
}
```

### Step 3: Use in Field Config

```typescript
{
  key: 'my_field',
  label: 'My Field',
  type: 'text',
  widget: 'my_custom_widget'
}
```

## Widget Configuration

### one2many

**Odoo-style One-to-Many field** - Parent record has many child records. Child has FK to parent.

```typescript
{
  key: 'variants',           // Field key in form data
  label: 'Product Variants',
  type: 'one2many',          // Auto-uses One2ManyWidget
  // OR: widget: 'one2many',
  widgetConfig: {
    relation: '/api/admin/product-variants',  // API endpoint for child records
    inverseField: 'product_id',                  // FK field in child referencing parent
    
    columns: [
      { key: 'sku', title: 'SKU', width: 150, type: 'string', editable: true },
      { key: 'price', title: 'Price', width: 100, type: 'number', editable: true },
      { key: 'stock', title: 'Stock', width: 80, type: 'number', editable: true },
      { 
        key: 'color_id', 
        title: 'Color', 
        width: 120, 
        type: 'many2one',
        relation: '/api/admin/colors',
        displayField: 'name',
        editable: true 
      }
    ],
    
    allowCreate: true,    // Allow creating new records inline
    allowEdit: true,      // Allow editing existing records
    allowDelete: true,    // Allow deleting records
    allowImport: false    // Allow importing records
  }
}
```

### many2many

**Odoo-style Many-to-Many field** - Records linked via junction table.

```typescript
{
  key: 'attribute_ids',
  label: 'Product Attributes',
  type: 'many2many',       // Auto-uses Many2ManyWidget
  // OR: widget: 'many2many',
  widgetConfig: {
    // Junction table configuration
    junctionTable: '/api/admin/product-attributes-rel',  // Junction API endpoint
    localField: 'product_id',    // FK to parent in junction
    remoteField: 'attribute_id', // FK to related in junction
    
    // Related record configuration
    relation: '/api/admin/product-attributes',  // Related records API
    displayField: 'name',    // Field to display from related record
    valueField: 'id',        // Field to use as value
    
    // Junction data columns (optional)
    columns: [
      { key: 'position', title: 'Position', width: 80, type: 'number', editable: true },
      { key: 'is_required', title: 'Required', width: 80, type: 'boolean', editable: true }
    ],
    
    // Display mode
    mode: 'list',  // 'list' | 'tags'
    
    // Actions
    allowSelect: true,    // Allow linking existing records
    allowCreate: false,   // Allow creating new related records
    allowRemove: true,    // Allow unlinking records
    allowEdit: true       // Allow editing junction data
  }
}
```

### many2one

**Odoo-style Many-to-One field** - Single relation with searchable select.

```typescript
{
  key: 'category_id',
  label: 'Category',
  type: 'many2one',        // Auto-uses Many2OneWidget
  // OR: widget: 'many2one',
  widgetConfig: {
    relation: '/api/admin/product-categories',  // API endpoint
    displayField: 'name',    // Field to display
    valueField: 'id',        // Field to use as value
    searchField: 'name',     // Field to search
    
    // UI options
    allowCreate: true,       // Show "Create New" button
    allowEdit: true,         // Show edit button for selected
    allowClear: true,        // Allow clearing selection
    placeholder: 'Select a category...',
    
    // Search options
    searchable: true,        // Enable search
    minSearchLength: 0,      // 0 = preload all, >0 = search on type
    limit: 100               // Max results to show
  }
}
```

### many2one

```typescript
{
  widget: 'many2one',
  widgetConfig: {
    relation: 'product.categories',  // API endpoint
    displayField: 'name',           // Field to display
    searchable: true,               // Enable search
    createable: true                 // Allow creating new records
  }
}
```

### one2many

```typescript
{
  widget: 'one2many',
  widgetConfig: {
    relation: 'order.items',         // API endpoint
    displayField: 'name',           // Field to display
    columns: [                      // Table columns
      { key: 'name', title: 'Name', width: 200 },
      { key: 'quantity', title: 'Qty', width: 100 }
    ],
    editable: true,
    allowAdd: true,
    allowDelete: true
  }
}
```

## Integration with FormView

FormView automatically detects the `widget` property in field configurations and renders the appropriate widget component.

```typescript
// In FormView.tsx
const renderField = (field: FormField) => {
  if (field.widget && fieldWidgets[field.widget]) {
    const WidgetComponent = fieldWidgets[field.widget]
    return (
      <WidgetComponent
        value={data[field.key]}
        onChange={(value) => setData({ ...data, [field.key]: value })}
        field={field}
        data={data}
        disabled={field.readonly}
        readonly={field.readonly}
      />
    )
  }
  
  // Default field rendering
  // ...
}
```

## Best Practices

1. **Keep Widgets Focused**: Each widget should handle one specific use case
2. **Use TypeScript**: Ensure proper typing for props and configuration
3. **Handle Loading States**: Widgets should handle async data loading gracefully
4. **Error Handling**: Provide clear error messages when operations fail
5. **Accessibility**: Ensure widgets are keyboard navigable and screen reader friendly
6. **Performance**: Use React.memo for expensive widgets
7. **Testing**: Write unit tests for widget components

## Widget Validation & Developer Warnings

Widgets validate their required configuration at runtime and log clear errors to the browser console when misconfigured. This helps developers identify issues quickly instead of encountering cryptic crashes.

### Required Configurations

| Widget      | Required widgetConfig properties                    | Error example                                      |
|-------------|-----------------------------------------------------|----------------------------------------------------|
| `one2many`  | `relation`, `columns` (must be a non-empty array)   | `[One2ManyWidget] Missing widgetConfig.`           |
| `many2many` | `relation`, `localField`, `remoteField`             | `[Many2ManyWidget] Missing required widgetConfig.` |
| `many2one`  | `relation`                                          | `[Many2OneWidget] Missing required widgetConfig.`  |

### Type-Widget Compatibility Check

FormView also validates that the `widget` is compatible with the field `type` at runtime. For example, using `widget: 'one2many'` on a `type: 'number'` field will log a warning.

| Widget            | Compatible types                              |
|-------------------|-----------------------------------------------|
| `many2many`       | `many2many`, `json`, `array`                  |
| `many2many_list`  | `many2many`, `json`, `array`                  |
| `one2many`        | `one2many`, `json`, `array`                   |
| `many2one`        | `many2one`, `json`, `string`                  |
| `tag_select`      | `selection`, `string`                         |

Console warning example:
```
[FormView] Widget "one2many" used on field "value_ids" with type "number".
Expected one of: one2many, json, array. This may cause rendering issues.
```

### Developer Experience

When a widget is missing required configuration:
1. A **red-bordered fallback UI** is rendered in place of the widget so the page doesn't crash
2. A **detailed error message** is logged to the browser console explaining what's missing and how to fix it
3. The error message includes an **example configuration** for reference

Example browser console output:
```
[One2ManyWidget] Missing or invalid "columns" in widgetConfig.
You must define the columns to display/edit.
Example: columns: [{ key: "name", title: "Name", type: "string", editable: true }]
```

Example rendered fallback UI shows a red-bordered box with the message:
"One2ManyWidget configuration error - Missing or invalid widgetConfig.columns. Check the browser console for details."

## Server-Side Handling

### One2Many Save Pattern

When saving records with one2many fields, the server should handle:

```typescript
// Form submits array of child records
const variants = [
  { id: 'temp_123', sku: 'SKU001', price: 10, _isNew: true },
  { id: 'existing_456', sku: 'SKU002', price: 20, _isModified: true },
  { id: 'existing_789', sku: 'SKU003', price: 30, _toDelete: true }
]

// Server logic:
// 1. Create new records (_isNew)
// 2. Update modified records (_isModified)
// 3. Delete records marked for deletion (_toDelete)
```

### Many2Many Save Pattern

```typescript
// Junction records are managed inline
const attributeRels = [
  { id: 'temp_1', attribute_id: 'attr_1', position: 1, _isNew: true },
  { id: 'rel_2', attribute_id: 'attr_2', position: 2 },
  { id: 'rel_3', attribute_id: 'attr_3', _toDelete: true }
]
```

## Future Enhancements

- [x] One2Many widget with inline editing
- [x] Many2Many widget with junction table support
- [x] Many2One widget with search
- [ ] Domain/context propagation to related records
- [ ] OnChange handlers for relation fields
- [ ] Modal dialogs for create/edit operations
- [ ] Widget validation integration
- [ ] Widget-specific configuration UI
- [ ] Widget marketplace for community contributions
- [ ] Widget composition (nesting widgets)
- [ ] Widget state persistence
