# Print Component

The Print component allows users to print data from any view (FormView, ListView) with custom template support. It uses an iframe-based printing approach (similar to Odoo) for isolated printing, with a template registry system for scalable template management.

## Features

- **Iframe-based Printing**: Isolated printing using hidden iframe (Odoo-like approach)
- **Print Modes**: Single record and bulk record printing
- **Custom Templates**: Pass custom React components as print templates
- **Print Preview**: Full-screen modal with rsuite Modal component
- **Template Registry**: Centralized registry for dynamic template loading
- **Action-driven**: Print actions defined in config with `template` property
- **next-barcode Integration**: Real barcode generation for product labels

## Architecture

The print system follows a 3-layer architecture:

1. **Action Config** - Defines print actions with `template` property
2. **Template Registry** - Central registry for all print templates
3. **PrintView** - Modal with iframe for isolated printing

### Flow

```
User clicks print action in ServerActions
    ↓
ServerActions detects action.template property
    ↓
Load template from printTemplateRegistry
    ↓
Call onPrint callback with template
    ↓
ResourceView shows PrintView modal
    ↓
PrintView renders preview in modal + hidden iframe
    ↓
User clicks Print button
    ↓
iframe.contentWindow.print() called
    ↓
Browser print dialog shows only iframe content
```

## Usage

### Adding a Print Action to Config

Add a print action to your entity config with the `template` property:

```typescript
// app/admin/products/config/index.ts
import { createElement } from 'react'
import { Printer } from 'lucide-react'

const customServerActions = [
    {
        key: 'print_barcode',
        label: 'Print Barcode',
        icon: createElement(Printer, { size: 16 }),
        color: 'violet' as const,
        mode: 'both' as const,
        helper: 'Print product barcode labels',
        template: 'ProductBarcodePrintTemplate'  // ← Registry key
    }
]
```

### Creating a Custom Print Template

1. **Create the template component**:

```typescript
// components/admin/reports/invoices/InvoicePrintTemplate.tsx
'use client'

import React from 'react'

interface InvoicePrintTemplateProps {
    data: any
}

export function InvoicePrintTemplate({data}: InvoicePrintTemplateProps) {
    const records = Array.isArray(data) ? data : [data]
    
    return (
        <div className="bg-white">
            {records.map((record, index) => (
                <div key={index} style={{
                    pageBreakAfter: index < records.length - 1 ? 'always' : 'auto',
                    padding: '20px'
                }}>
                    <h1>Invoice #{record.number}</h1>
                    {/* Your invoice layout here */}
                </div>
            ))}
        </div>
    )
}
```

2. **Add to template registry**:

```typescript
// lib/printTemplateRegistry.ts
export const printTemplateRegistry: PrintTemplateRegistry = {
    ProductBarcodePrintTemplate: () => 
        import('@/components/admin/reports/products/ProductBarcodePrintTemplate').then(m => ({ default: m.ProductBarcodePrintTemplate })),
    
    InvoicePrintTemplate: () => 
        import('@/components/admin/reports/invoices/InvoicePrintTemplate').then(m => ({ default: m.InvoicePrintTemplate })),
}
```

3. **Add action to config**:

```typescript
{
    key: 'print_invoice',
    label: 'Print Invoice',
    template: 'InvoicePrintTemplate'
}
```

**That's it!** No changes needed to ServerActions or PrintView.

## Integration with Views

### FormView

The Print action is available in FormView's ServerActions dropdown:

```tsx
<FormView
    mode={editingId ? 'edit' : 'create'}
    config={config.formViewConfig}
    entityId={editingId}
    initialData={formInitialData}
    serverActions={mergedServerActions}
/>
```

### ListView

The Print action is available in ListView's bulk actions dropdown:

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
/>
```

### ResourceView

The Print action is triggered from the bulk actions toolbar when records are selected:

```tsx
{selectedIds.length > 0 && (
    <ServerActions
        actions={mergedServerActions}
        data={currentFilteredData.filter(item => 
            selectedIds.includes(item.id || item._id)
        ) || []}
        context={{
            mode: 'bulk',
            view: 'list',
            selectedIds
        }}
        layout="dropdown"
    />
)}
```

## How It Works

1. User clicks a print action in ServerActions
2. ServerActions checks if action has `template` property
3. If yes, loads template from `printTemplateRegistry`
4. Calls `onPrint` callback with template
5. ResourceView shows PrintView modal (rsuite Modal)
6. PrintView renders template in modal body (preview)
7. PrintView also renders template in hidden iframe
8. User clicks Print button
9. `iframe.contentWindow.print()` is called
10. Browser print dialog shows only iframe content (isolated printing)

## PrintView Component

The PrintView component (`components/admin/ResourceView/PrintView/index.tsx`) provides:

- **rsuite Modal**: Full-screen modal with backdrop="static"
- **Preview**: Shows template in modal body for user to review
- **Hidden iframe**: Contains same content for isolated printing
- **Print/Download buttons**: Triggers iframe print
- **Style preservation**: Copies all stylesheets to iframe

## Template Registry

The template registry (`lib/printTemplateRegistry.ts`) provides:

- **Centralized management**: All templates in one place
- **Dynamic imports**: Code splitting for performance
- **Type safety**: TypeScript interface for consistency
- **Error handling**: Graceful fallback if template not found

## Barcode Integration

For barcode printing, use the `next-barcode` library:

```typescript
import { useBarcode } from 'next-barcode'

const { inputRef } = useBarcode({
    value: barcodeValue,
    options: {
        format: 'CODE128',
        displayValue: true,
        fontSize: 14,
        background: '#ffffff',
        lineColor: '#000000',
        width: 2,
        height: 80,
        margin: 0,
    }
})

return <svg ref={inputRef} />
```

## Print CSS Tips

When creating custom print templates, consider:

- Use `@media print` CSS rules for print-specific styling
- Hide non-print elements with `.print:hidden` class
- Ensure high contrast for readability
- Use appropriate font sizes (12pt+ recommended)
- Test print preview before finalizing

```css
@media print {
    .no-print {
        display: none !important;
    }
    body {
        background: white;
        color: black;
    }
}
```

## Dependencies

- React (for component rendering)
- rsuite (Modal component)
- next-barcode (for barcode generation)
- Browser's native print dialog (for printing)
- Browser's print-to-PDF (for PDF export)

## Benefits of This Architecture

- **Scalable**: Add 100+ templates without touching ServerActions
- **Isolated**: Iframe printing prevents page layout conflicts
- **Type-safe**: TypeScript ensures template consistency
- **Code-split**: Templates loaded only when needed
- **Config-driven**: Behavior controlled by action config, not component logic
