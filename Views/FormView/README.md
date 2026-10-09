# FormView Architecture

A comprehensive, reusable form system for Next.js applications inspired by Odoo's FormView pattern.

## 🚀 Overview

FormView provides a unified architecture for creating and managing forms across different entities (Products, Customers, Orders, etc.) with consistent UI, validation, and behavior.

## 📁 Structure

```text
components/admin/FormView/
├── FormView.tsx              # Main form component
├── index.ts                  # Global exports
├── README.md                 # This documentation
├── config/
│   └── registry.ts          # Configuration registry
└── utils/

Note: Model-specific form configurations are now in app/admin/[model]/config/
- Product config: app/admin/products/config/formView.ts
- Customer config: app/admin/customers/config/formView.ts (to be created)

utils/
    ├── api-client.ts         # Unified API operations
    ├── validation.ts          # Form validation utilities
    └── file-upload.ts        # File upload handling
```

## 🎯 Key Features

### ✅ **Unified Form Component**
- Single component handles all entity types
- Mode-aware (create/edit) behavior
- Responsive grid layouts
- Built-in change tracking
- Smart action buttons

### ✅ **Configuration-Driven**
- Declarative form definitions
- Type-safe field configurations
- Entity-specific behavior
- Reusable across applications

### ✅ **Comprehensive Utilities**
- **API Client**: Unified CRUD operations
- **Validation Engine**: Built-in and custom rules
- **File Upload**: Complete upload management
- **Registry System**: Dynamic configuration loading

### ✅ **Enterprise Features**
- Batch operations support
- Progress tracking
- Error handling
- Type safety throughout
- Performance optimized

### ✅ **ServerActions Integration**
- Shared action system with ListView
- Context-aware actions (single vs bulk)
- Built-in confirmation dialogs
- Helper tooltips for guidance
- Reusable action definitions across views

## 🚀 Quick Start

### 1. Basic Usage

```typescript
import { FormView, productFormConfig } from '@/components/admin/ResourceView/FormView'

export default function ProductPage() {
  return (
    <FormView 
      mode="create"
      config={productFormConfig}
    />
  )
}
```

### 2. Edit Mode

```typescript
import { FormView, productFormConfig } from '@/components/admin/ResourceView/FormView'

export default function EditProductPage() {
  const [product, setProduct] = useState(null)
  
  // Load product data...
  
  return (
    <FormView 
      mode="edit"
      config={productFormConfig}
      initialData={product}
      entityId={productId}
    />
  )
}
```

### 3. Custom Configuration

```typescript
import { createFormConfig } from '@/components/admin/ResourceView/FormView'

const customConfig = createFormConfig()
  .entityName('Custom Entity')
  .entityNamePlural('Custom Entities')
  .apiEndpoint('/api/custom')
  .fields([
    {
      key: 'name',
      label: 'Name',
      type: 'string',
      required: true,
      validation: (value) => {
        if (!value || value.length < 2) {
          return 'Name must be at least 2 characters'
        }
        return null
      }
    }
  ])
  .actions({
    print: true,
    export: true,
    delete: true
  })
  .breadcrumbs({
    base: '/admin',
    list: '/admin/custom',
    create: '/admin/custom/new',
    edit: '/admin/custom'
  })
  .build()
```

## 📝 Field Types

FormView supports multiple field types:

### FormField Interface

```typescript
export interface FormField {
  key: string
  label: string
  type: 'number' | 'file' | 'array' | 'json' | 'checkbox' | 'boolean' | 'toggle' | 'date' | 'datetime' | 'time' | 'year' | 'month' | 'day' | 'one2many' | 'many2many' | 'many2one' | 'selection' | 'string' | 'html'
  required?: boolean
  readonly?: boolean
  helper?: string
  placeholder?: string
  options?: Array<{ label: string; value: string }>
  validation?: (value: any) => string | null
  className?: string
  columnWidth?: number        // Grid grouping for layout (replaces columnWidth)
  rows?: number
  accept?: string
  width?: string
  icon?: React.ReactNode
  uploadText?: string
  order?: number           // Field ordering priority
  after?: string           // Position after specific field
  before?: string           // Position before specific field
  groupNumber?: number          // Specific grid row position
  groupColumn?: number        // Specific grid column position
}
```

### TabConfig Interface

```typescript
export interface TabConfig {
  key: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
}
```

### FormConfig Interface (Updated)

```typescript
export interface FormConfig {
  entityName: string
  entityNamePlural: string
  apiEndpoint: string
  fields: FormField[]
  pages?: FormPage[]      // NEW: Custom pages with components or fields (like Odoo)
  tabs?: TabConfig[]        // Optional tabs configuration
  customActions?: Array<{   // Custom button actions
    key: string
    label: string
    icon?: React.ReactNode
    onClick: (data: any) => void
    mode?: 'create' | 'edit' | 'both'
    variant?: 'default' | 'primary' | 'danger' | 'success' | 'warning' | 'info'
    className?: string
    badge?: string | number
    readonly?: boolean
    helper?: string
  }>
  actions: { /* ... */ }
  breadcrumbs: { /* ... */ }
}
```

### FormPage Interface (NEW)

```typescript
export interface FormPage {
  key: string
  label: string
  icon?: ReactNode  // Optional icon for tab header
  component?: React.ComponentType<{data: any; onDataChange: (data: any) => void}>  // Optional custom component
  fields?: FormField[]  // Optional fields to render on this page
  show?: (data: any) => boolean  // Conditional visibility
  order?: number  // Ordering priority
}
```

## 📄 Custom Pages System (Like Odoo)

FormView now supports a **custom pages system** inspired by Odoo, allowing you to add custom components or field groups to your forms. This is particularly useful for model-specific functionality like product variants, order details, or custom workflows.

### Basic Usage with Custom Component

```typescript
import { FormConfig } from '@/components/admin/ResourceView/FormView'
import { ProductVariantsPage } from './ProductVariantsPage'

export const productFormConfig: FormConfig = {
  entityName: 'Product',
  entityNamePlural: 'Products',
  apiEndpoint: '/api/products',
  fields: [/* ... */],
  pages: [
    {
      key: 'variants',
      label: 'Product Variants',
      component: ProductVariantsPage,
      show: (data) => data.product_type === 'variable',  // Only show for variable products
      order: 100
    }
  ]
}
```

### Custom Page Component

Your custom component receives `data` and `onDataChange` props:

```typescript
// ProductVariantsPage.tsx
'use client'

import React from 'react'
import { VariantManager } from '@/components/admin/VariantManager'

export function ProductVariantsPage({data, onDataChange}: {data: any; onDataChange: (data: any) => void}) {
    const [variants, setVariants] = React.useState<any[]>(data.variants || [])
    const [attributes, setAttributes] = React.useState<Array<{name: string, values: string[]}>>(data.attributes || [])

    const handleVariantsChange = (newVariants: any[]) => {
        setVariants(newVariants)
        onDataChange({...data, variants: newVariants})
    }

    const handleAttributesChange = (newAttributes: Array<{name: string, values: string[]}>) => {
        setAttributes(newAttributes)
        onDataChange({...data, attributes: newAttributes})
    }

    return (
        <VariantManager
            productType={data.product_type}
            variants={variants}
            attributes={attributes}
            onVariantsChange={handleVariantsChange}
            onAttributesChange={handleAttributesChange}
        />
    )
}
```

### Using Fields in Pages

You can also define fields directly in pages instead of using a custom component:

```typescript
export const productFormConfig: FormConfig = {
  entityName: 'Product',
  entityNamePlural: 'Products',
  apiEndpoint: '/api/products',
  fields: [/* ... */],
  pages: [
    {
      key: 'additional-info',
      label: 'Additional Information',
      fields: [
        {
          key: 'warranty',
          label: 'Warranty Period',
          type: 'selection',
          options: [
            { label: '1 Year', value: '1_year' },
            { label: '2 Years', value: '2_years' },
            { label: '3 Years', value: '3_years' }
          ],
          columnWidth: 1
        },
        {
          key: 'return_policy',
          label: 'Return Policy',
          type: 'html',
          size: 'md',
          columnWidth: 2
        }
      ],
      order: 50
    }
  ]
}
```

### Multiple Pages with Tabs

When you have multiple pages, FormView automatically renders them as tabs:

```typescript
export const productFormConfig: FormConfig = {
  entityName: 'Product',
  entityNamePlural: 'Products',
  apiEndpoint: '/api/products',
  fields: [/* ... */],
  pages: [
    {
      key: 'variants',
      label: 'Product Variants',
      component: ProductVariantsPage,
      show: (data) => data.product_type === 'variable',
      order: 100
    },
    {
      key: 'inventory',
      label: 'Inventory Management',
      component: InventoryPage,
      show: (data) => data.track_inventory,
      order: 90
    },
    {
      key: 'seo',
      label: 'SEO Settings',
      fields: [
        {
          key: 'meta_title',
          label: 'Meta Title',
          type: 'string',
          columnWidth: 1
        },
        {
          key: 'meta_description',
          label: 'Meta Description',
          type: 'html',
          columnWidth: 2
        }
      ],
      order: 80
    }
  ]
}
```

### Page Features

- **Tab Rendering**: Multiple pages automatically render as tabs
- **Single Page**: Single pages render with a single tab (still uses Tabs component)
- **Conditional Visibility**: Use `show` function to conditionally display pages
- **Ordering**: Use `order` property to control page sequence
- **Custom Components**: Use `component` for complex UI with custom logic
- **Field Groups**: Use `fields` for simple field groupings
- **Data Sync**: Components receive `onDataChange` to update form data

### Benefits

- **Model-Specific**: Define pages in model config, not in generic FormView
- **Reusable**: Components can be reused across different models
- **Flexible**: Choose between custom components or field definitions
- **Odoo-Like**: Familiar pattern for ERP users
- **Type-Safe**: Full TypeScript support

### Best Practices

1. **Separate Components**: Create separate files for page components
2. **Use Conditional Visibility**: Only show pages when relevant
3. **Order Pages**: Use `order` to control tab sequence
4. **Sync Data**: Always call `onDataChange` when modifying data
5. **Keep Components Focused**: Each page should handle one concern

### Text Input
```typescript
{
  key: 'name',
  label: 'Name',
  type: 'string',
  required: true,
  placeholder: 'Enter name',
  validation: (value) => value ? null : 'Name is required',
  columnWidth: 2
}
```

### Readonly Field
```typescript
{
  key: 'created_at',
  label: 'Created At',
  type: 'string',
  readonly: true,
  placeholder: 'Auto-generated'
}
```

**Readonly Features:**
- Input is disabled and cannot be edited
- Gray background indicates read-only state
- Cursor shows "not-allowed" on hover
- Ideal for auto-generated fields, timestamps, IDs

### Helper Field
```typescript
{
  key: 'slug',
  label: 'URL Slug',
  type: 'string',
  required: true,
  helper: 'A URL-friendly version of the product name. Used for SEO and clean URLs.'
}
```

**Helper Features:**
- Info icon (ⓘ) appears next to field label
- Click to show popover with helper text
- Positioned to the right of the label
- Ideal for explaining complex fields, providing guidance, or showing requirements

### Number Input
```typescript
{
  key: 'price',
  label: 'Price',
  type: 'number',
  required: true,
  placeholder: '0.00',
  validation: (value) => value >= 0 ? null : 'Price must be positive'
}
```

### Select Dropdown
```typescript
{
  key: 'category',
  label: 'Category',
  type: 'selection',
  required: true,
  options: [
    { label: 'Electronics', value: 'electronics' },
    { label: 'Clothing', value: 'clothing' }
  ]
}
```

### Html (Textarea with Preview)
```typescript
{
  key: 'description',
  label: 'Description',
  type: 'html',
  required: false,
  placeholder: 'Enter description',
  size: 'md'      // 'sm' | 'md' | 'lg'
}
```

### File Upload
```typescript
{
  key: 'images',
  label: 'Product Images',
  type: 'file',
  accept: 'image/*',           // File type restrictions
  width: '100%',               // Custom width
  icon: '🖼️',               // Custom icon
  uploadText: 'Upload product images',  // Custom upload text
  columnWidth: 1
}
```

### Enhanced File Upload Options:
- **accept**: Restrict file types (e.g., `'image/*'`, `'application/pdf'`)
- **width**: Custom width for upload area (e.g., `'100%'`, `'300px'`)
- **icon**: Custom icon to display (React.ReactNode)
- **uploadText**: Custom upload button text
- **className**: Additional CSS classes for styling

### Array Fields
```typescript
{
  key: 'features',
  label: 'Features',
  type: 'array',
  required: false,
  placeholder: 'Enter feature'
}
```

### Checkbox Field
```typescript
{
  key: 'subscribe',
  label: 'Subscribe to newsletter',
  type: 'checkbox',
  required: false
}
```

### Boolean/Toggle Field
```typescript
{
  key: 'active',
  label: 'Active Status',
  type: 'toggle',
  required: false
}
```

**Toggle Features:**
- Visual switch component with color feedback
- Shows "Active" when true (green), "Inactive" when false (gray)
- Smooth transition animations
- Ideal for boolean flags and status fields

## 🎯 Custom Quick Actions

FormView supports custom button actions in the Quick Actions sidebar, allowing you to add entity-specific actions beyond the built-in options.

### Custom Actions Configuration

```typescript
export const productFormConfig: FormConfig = {
  entityName: 'Product',
  entityNamePlural: 'Products',
  apiEndpoint: '/api/products',
  fields: [/* ... */],
  customActions: [
    {
      key: 'approve',
      label: 'Approve Product',
      icon: <Check className="w-4 h-4" />,
      onClick: (data) => {
        console.log('Approving product:', data)
        // Custom logic to approve product
      },
      mode: 'edit',
      variant: 'primary'
    },
    {
      key: 'send-notification',
      label: 'Send Notification',
      icon: <Bell className="w-4 h-4" />,
      onClick: (data) => {
        console.log('Sending notification for:', data)
        // Custom logic to send notification
      },
      mode: 'both',
      variant: 'default'
    },
    {
      key: 'delete-permanent',
      label: 'Delete Permanently',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (data) => {
        if (confirm('Are you sure you want to permanently delete this item?')) {
          console.log('Permanently deleting:', data)
          // Custom delete logic
        }
      },
      mode: 'edit',
      variant: 'danger'
    }
  ],
  actions: {
    print: false,  // Disable built-in print if using custom actions
    export: false,
    duplicate: false,
    copy: false
  },
  breadcrumbs: { /* ... */ }
}
```

### Custom Action Properties

```typescript
{
  key: string,              // Unique identifier for the action
  label: string,            // Button label text
  icon?: React.ReactNode,   // Optional icon component
  onClick: (data: any) => void,  // Click handler with form data
  mode?: 'create' | 'edit' | 'both',  // When to show (default: 'both')
  variant?: 'default' | 'primary' | 'danger' | 'success' | 'warning' | 'info'  // Button style (default: 'default')
  className?: string,       // Additional CSS classes for custom styling
  badge?: string | number   // Optional badge to display (e.g., '5', 'New', '!')
  readonly?: boolean       // Disable action button (default: false)
  helper?: string           // Helper text shown on hover (popover)
}
```

### Button Variants

- **default**: Gray background with hover effect (standard action)
- **primary**: Primary color background (important/prominent action)
- **danger**: Red background (destructive/critical action)
- **success**: Green background (positive/completed actions)
- **warning**: Yellow background (cautionary actions)
- **info**: Blue background (informational actions)

### Mode Behavior

- **create**: Only shows in create mode
- **edit**: Only shows in edit mode
- **both**: Shows in both modes (default)

### Example Use Cases

**Product Management:**
```typescript
customActions: [
  {
    key: 'approve',
    label: 'Approve Product',
    icon: <Check className="w-4 h-4" />,
    onClick: (data) => {
      // Call API to approve product
      fetch(`/api/products/${data.id}/approve`, { method: 'POST' })
    },
    mode: 'edit',
    variant: 'primary'
  },
  {
    key: 'view-stock',
    label: 'View Stock',
    icon: '📦',
    onClick: (data) => {
      console.log('View stock for:', data)
    },
    mode: 'both',
    variant: 'info',
    badge: 5  // Shows badge with number 5
  },
  {
    key: 'sync-inventory',
    label: 'Sync Inventory',
    icon: <RefreshCw className="w-4 h-4" />,
    onClick: (data) => {
      // Sync with external inventory system
      fetch(`/api/products/${data.id}/sync`, { method: 'POST' })
    },
    mode: 'both',
    variant: 'default',
    className: 'font-bold'  // Custom CSS class
  },
  {
    key: 'delete-permanent',
    label: 'Delete Permanently',
    icon: '🗑️',
    onClick: (data) => {
      if (confirm('Permanently delete?')) {
        fetch(`/api/products/${data.id}/delete`, { method: 'DELETE' })
      }
    },
    mode: 'edit',
    variant: 'danger',
    readonly: true  // Disabled action
  },
  {
    key: 'bulk-update',
    label: 'Bulk Update',
    icon: '📊',
    onClick: (data) => {
      console.log('Bulk update for:', data)
    },
    mode: 'edit',
    variant: 'warning',
    helper: 'Update multiple products at once based on selected criteria'
  }
]
```

**Readonly Custom Actions:**
- Button is disabled and cannot be clicked
- Gray background indicates read-only state
- Cursor shows "not-allowed" on hover
- Ideal for temporarily disabling actions based on conditions

**Helper Custom Actions:**
- Popover appears on hover with helper text
- Positioned to the right of the button
- Provides context and guidance for action purpose
- Ideal for explaining complex actions or showing requirements

**Order Management:**
```typescript
customActions: [
  {
    key: 'process-payment',
    label: 'Process Payment',
    icon: <CreditCard className="w-4 h-4" />,
    onClick: (data) => {
      // Process payment gateway
      fetch(`/api/orders/${data.id}/payment`, { method: 'POST' })
    },
    mode: 'edit',
    variant: 'primary'
  },
  {
    key: 'cancel-order',
    label: 'Cancel Order',
    icon: <XCircle className="w-4 h-4" />,
    onClick: (data) => {
      if (confirm('Cancel this order?')) {
        fetch(`/api/orders/${data.id}/cancel`, { method: 'POST' })
      }
    },
    mode: 'edit',
    variant: 'danger'
  }
]
```

### Fallback to Built-in Actions

If `customActions` is not defined, FormView will render the built-in actions based on the `actions` configuration:

```typescript
// Without customActions - uses built-in actions
actions: {
  print: true,
  export: true,
  duplicate: true,
  copy: true
}
```

## ServerActions Integration

FormView now supports the **ServerActions** component for a unified action system that works across both ListView and FormView. This allows you to define actions once and reuse them in different contexts.

### Why ServerActions?

- **Shared Actions**: Define actions once, use in both ListView (bulk) and FormView (single)
- **Context-Aware**: Actions automatically adapt to bulk vs single record context
- **Built-in Features**: Confirmation dialogs, helper tooltips, loading states
- **Better Architecture**: Reduces code duplication and improves maintainability

### Migration from customActions to ServerActions

The old `customActions` system is being replaced with `ServerActions`. Here's how to migrate:

**Old (customActions):**
```typescript
customActions: [
  {
    key: 'approve',
    label: 'Approve Product',
    icon: <Check className="w-4 h-4" />,
    onClick: (data) => {
      fetch(`/api/products/${data.id}/approve`, { method: 'POST' })
    },
    mode: 'edit',
    variant: 'primary'
  }
]
```

**New (ServerActions):**
```typescript
import { ServerActionConfig } from '@/components/admin/ResourceView/ServerActions'

const actions: ServerActionConfig[] = [
  {
    key: 'approve',
    label: 'Approve Product',
    icon: <Check className="w-4 h-4" />,
    color: 'green',
    mode: 'edit',
    confirm: 'Approve this product?',
    helper: 'Mark product as approved',
    onClick: async (data, context) => {
      const record = context.record || data[0]
      await fetch(`/api/products/${record.id}/approve`, { method: 'POST' })
    }
  }
]
```

### Context Handling in FormView

In FormView, the action context provides:
- `context.mode = 'single'`: Single record mode
- `context.view = 'form'`: Form view context
- `context.record`: The current form data object
- `data`: Array with single record `[record]`

**Example: Delete action that works in both contexts:**
```typescript
const deleteAction: ServerActionConfig = {
  key: 'delete',
  label: 'Delete',
  icon: <Trash2 size={16} />,
  color: 'red',
  mode: 'edit',
  confirm: (data, context) => {
    if (context.mode === 'bulk') {
      return `Delete ${context.selectedIds?.length} records?`
    } else {
      return 'Delete this record? This action cannot be undone.'
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

### Built-in Actions as ServerActions

FormView's built-in actions (Delete, Print, Export, Duplicate, Copy) can also be defined as ServerActions for consistency:

```typescript
const builtInActions: ServerActionConfig[] = [
  {
    key: 'delete',
    label: 'Delete',
    icon: <Trash2 size={16} />,
    color: 'red',
    mode: 'edit',
    confirm: 'Delete this record?',
    helper: 'Permanently remove this record',
    onClick: async (data, context) => {
      const id = context.record?.id || data[0]?.id
      await fetch(`/api/records/${id}`, { method: 'DELETE' })
      router.push('/list')
    }
  },
  {
    key: 'duplicate',
    label: 'Duplicate',
    icon: <Copy size={16} />,
    color: 'blue',
    mode: 'edit',
    helper: 'Create a copy of this record',
    onClick: async (data, context) => {
      const record = context.record || data[0]
      const duplicate = { ...record, id: undefined, name: `${record.name} (Copy)` }
      router.push(`/create?data=${JSON.stringify(duplicate)}`)
    }
  },
  {
    key: 'print',
    label: 'Print',
    icon: <Printer size={16} />,
    color: 'blue',
    mode: 'both',
    helper: 'Print this record',
    onClick: () => window.print()
  }
]
```

For detailed ServerActions documentation, see: [ServerActions README](../../Actions/README.md)

### Best Practices

1. **Use descriptive keys**: Unique identifiers for each action
2. **Provide icons**: Icons improve visual recognition
3. **Choose appropriate variants**: Use 'danger' for destructive actions
4. **Set correct mode**: Only show actions relevant to current mode
5. **Handle errors**: Include error handling in onClick handlers
6. **Use confirmations**: For destructive actions, confirm with user

## 🔧 Advanced Usage

### API Client

```typescript
import { formViewAPI } from '@/components/admin/ResourceView/FormView'

// Get all items
const products = await formViewAPI.get('/api/products', {
  page: 1,
  limit: 20,
  search: 'laptop'
})

// Get single item
const product = await formViewAPI.getById('/api/products', 'product-id')

// Create item
const result = await formViewAPI.create('/api/products', {
  name: 'New Product',
  price: 99.99
})

// Update item
const result = await formViewAPI.update('/api/products', 'product-id', {
  name: 'Updated Product'
})

// Delete item
const result = await formViewAPI.delete('/api/products', 'product-id')

// Batch operations
const result = await formViewAPI.batchDelete('/api/products', ['id1', 'id2'])
```

### Validation

```typescript
import { FormViewValidator, commonValidations } from '@/components/admin/ResourceView/FormView'

// Use built-in validations
const fieldConfig = {
  key: 'email',
  label: 'Email',
  type: 'string',
  validation: commonValidations.email
}

// Custom validation
const fieldConfig = {
  key: 'custom',
  label: 'Custom Field',
  type: 'string',
  validation: FormViewValidator.combine(
    FormViewValidator.required(),
    FormViewValidator.minLength(5),
    FormViewValidator.custom((value) => {
      if (value && !value.includes('special')) {
        return 'Must contain "special"'
      }
      return null
    })
  )
}

// Form validation
const errors = FormViewValidator.validateForm(formData, {
  name: commonValidations.name,
  email: commonValidations.email,
  price: commonValidations.price
})
```

### File Upload

```typescript
import { FormViewFileUploader, defaultUploadOptions } from '@/components/admin/ResourceView/FormView'

// Upload files
const files = await FormViewFileUploader.uploadFiles(selectedFiles, {
  ...defaultUploadOptions.image,
  maxSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5
}, (fileIndex, progress) => {
  console.log(`File ${fileIndex}: ${progress}%`)
})

// Compress images
const compressedFile = await FormViewFileUploader.compressImage(file, 1920, 1080, 0.8)
```

### Configuration Registry

```typescript
import { 
  formViewRegistry, 
  registerFormConfig, 
  getFormConfig 
} from '@/components/admin/ResourceView/FormView'

// Register new configuration
registerFormConfig('order', orderFormConfig)

// Get configuration
const config = getFormConfig('product')

// Get all configurations
const allConfigs = formViewRegistry.getAll()

// Load configuration dynamically
const config = await formViewRegistry.loadFormConfig('new-entity')
```

## 🎨 UI Components

### Form Layout Architecture

FormView uses a **3-column grid layout** with intelligent field placement:

```typescript
// Layout Structure
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Main Form Area (2 columns) */}
  <div className="lg:col-span-2">
    {/* All fields EXCEPT file uploads */}
  </div>
  
  {/* Right Sidebar (1 column) */}
  <div className="space-y-6">
    {/* File Upload Section */}
    {/* Quick Actions */}
  </div>
</div>
```

### Field Placement Rules

**Main Form Area (Left Side - 2 columns):**
- All field types: `string`, `html`, `number`, `selection`, `array`, `json`, `date`, `boolean`, `toggle`
- **EXCLUDES**: `file` type fields
- Responsive grid layouts based on `columnWidth` property

**Right Sidebar (Right Side - 1 column):**
- **ONLY**: `file` type fields
- Quick Actions section
- Always visible for easy access

### Responsive Grid Layout
```typescript
// Fields automatically arrange in responsive grids
{
  key: 'name',
  columnWidth: 2  // 2 columns on desktop, 1 on mobile
}

{
  key: 'description', 
  columnWidth: 1  // Full width
}
```

## Tabs Support

FormView now supports **RSuite Tabs** for organizing fields into logical sections:

### Basic Tabs Configuration

```typescript
export const productFormConfig: FormConfig = {
  entityName: 'Product',
  entityNamePlural: 'Products',
  apiEndpoint: '/api/products',
  tabs: [
    {
      key: 'basic',
      label: 'Basic Info',
      icon: <Info className="w-4 h-4" />
    },
    {
      key: 'pricing',
      label: 'Pricing',
      icon: <DollarSign className="w-4 h-4" />
    },
    {
      key: 'inventory',
      label: 'Inventory',
      icon: <Package className="w-4 h-4" />
    }
  ],
  defaultTab: 'basic',
  fields: [
    // Fields assigned to tabs
    {
      key: 'name',
      label: 'Product Name',
      type: 'string',
      tab: 'basic',        // Assign to "Basic Info" tab
      columnWidth: 2
    },
    {
      key: 'price',
      label: 'Sale Price',
      type: 'number',
      tab: 'pricing',      // Assign to "Pricing" tab
      columnWidth: 2
    },
    {
      key: 'stock',
      label: 'Stock Quantity',
      type: 'number',
      tab: 'inventory',   // Assign to "Inventory" tab
      columnWidth: 2
    }
  ]
}
```

### Tabs Features

- **RSuite Integration**: Uses official RSuite Tabs component
- **Icon Support**: Add icons to tab headers
- **Disabled Tabs**: Mark tabs as disabled
- **Default Tab**: Set the initially active tab
- **Flexible Layout**: Each tab supports columnWidth layout
- **Automatic Fallback**: Fields without `tab` go to defaultTab

### Tab Field Assignment

```typescript
// Field assignment rules
{
  key: 'field1',
  tab: 'basic',        // Explicit tab assignment
  // Goes to "basic" tab
}

{
  key: 'field2',
  // No tab specified
  // Goes to defaultTab (first tab if not set)
}

{
  key: 'field3',
  type: 'file',
  // File fields ALWAYS go to sidebar, regardless of tab
}
```

// File fields automatically go to sidebar
{
  key: 'images',
  type: 'file',
  // Automatically rendered in right sidebar
}
```

### Smart Action Buttons
- **Create Mode**: Only shows Cancel/Create buttons
- **Edit Mode**: Shows full action dropdown (Print, Export, Duplicate, Archive, Delete)

### Change Tracking
- Automatically detects form changes
- Shows/hides action bar based on modifications
- Prevents accidental navigation

### Breadcrumb Navigation
- Automatic breadcrumb generation
- Entity-aware navigation paths
- Consistent across all forms

## 🛠️ Configuration Options

### Form Actions
```typescript
actions: {
  print: boolean,      // Show print action
  export: boolean,      // Show export action
  duplicate: boolean,    // Show duplicate action
  copy: boolean,        // Show copy action
  archive: boolean,     // Show archive action
  delete: boolean       // Show delete action
}
```

### Breadcrumbs
```typescript
breadcrumbs: {
  base: string,      // Dashboard URL
  list: string,      // List page URL
  create: string,     // Create page URL
  edit: string        // Edit page URL
}
```

## 🔍 Best Practices

### 1. Configuration Design
- Use descriptive field labels
- Implement proper validation
- Set appropriate grid layouts
- Define clear action permissions

### 2. Performance
- Use lazy loading for large forms
- Implement proper error boundaries
- Optimize file upload sizes

### 3. User Experience
- Provide clear error messages
- Show loading states
- Implement proper confirmation dialogs
- Support keyboard navigation

### 4. Type Safety
- Always type your configurations
- Use  strict mode
- Implement proper error handling
- Validate data at boundaries

## 🚀 Migration Guide

### From Custom Forms
1. **Identify Fields**: Map existing form fields to FormView types
2. **Create Config**: Build configuration object
3. **Replace Component**: Swap custom form with FormView
4. **Test**: Verify all functionality works
5. **Remove Old Code**: Delete custom form components

### Example Migration
```typescript
// Before (Custom Form)
function ProductForm({ product, onSave }) {
  const [name, setName] = useState(product?.name || '')
  const [price, setPrice] = useState(product?.price || '')
  
  const handleSubmit = () => {
    // Custom validation and submission logic
    onSave({ name, price })
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <input value={price} onChange={(e) => setPrice(e.target.value)} />
      <button type="submit">Save</button>
    </form>
  )
}

// After (FormView)
function ProductPage() {
  return (
    <FormView 
      mode="edit"
      config={productFormConfig}
      initialData={product}
      entityId={product.id}
    />
  )
}
```

## 🔧 Troubleshooting

### Common Issues

#### Import Errors
```bash
# Error: Export doesn't exist
# Solution: Use direct imports
import { productFormConfig } from '@/app/admin/products/config'
```

#### Type Errors
```bash
# Error: Type 'string' is not assignable to type 'number'
# Solution: Check field type definitions
type: 'number',  // Not 'string'
```

#### Validation Issues
```bash
# Error: Validation not working
# Solution: Check validation function return types
validation: (value) => value ? null : 'Error message'  // Returns string | null
```

## 🎯 Future Enhancements

### Planned Features
- [ ] **Dynamic Field Types**: Add more field types (date, time, color)
- [ ] **Advanced Validation**: Regex builder, conditional validation
- [ ] **Form Themes**: Multiple visual themes
- [ ] **Field Groups**: Collapsible field sections
- [ ] **Auto-save**: Draft saving functionality
- [ ] **Form Wizards**: Multi-step forms
- [ ] **Real-time Validation**: Live validation feedback

### Contributing
1. **Fork Repository**: Create your own version
2. **Create Feature Branch**: `git checkout -b feature-name`
3. **Make Changes**: Implement your feature
4. **Add Tests**: Write comprehensive tests
5. **Submit PR**: Create pull request with description

## 📞 Support

For issues, questions, or contributions:
- **Documentation**: Check this README first
- **Examples**: Review the example configurations
- **Issues**: Check existing GitHub issues
- **Discussions**: Join community discussions

## 📄 License

This FormView architecture is part of the eCommerce application and follows the same licensing terms.

---

**Built with ❤️ for scalable form management across Next.js applications**
