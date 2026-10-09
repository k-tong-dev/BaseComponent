# ServerActions Component

A shared action system inspired by Odoo's server actions. Allows defining reusable actions that work across ListView (bulk actions) and FormView (quick actions).

## Location
- Component: `components/Base/Actions/index.tsx`
- Default Actions: `getDefaultServerActions()` function (same file)
- Documentation: This file

## Architecture

### Centralized Default Actions

`getDefaultServerActions(flags, apiEndpoint?)` provides built-in default actions that make real API calls. Passed from model configs (e.g. `brands/config/index.ts`) via `defaultActions` flags.

```typescript
import { getDefaultServerActions } from '@/components/Base/Actions'

const defaultActions = getDefaultServerActions(
  { print: true, exportExcel: true, delete: true, duplicate: true, copyJson: true, archive: true, unarchive: true },
  '/api/admin/brands'
)
```

**Available Default Actions (all `mode: 'both'`):**

| Action | Key | API Call |
|--------|-----|----------|
| Print | `print` | `window.print()` |
| Export | `export_excel` | Triggers Export modal |
| Delete | `delete` | `DELETE {apiEndpoint}/{id}` |
| Duplicate | `duplicate` | `POST {apiEndpoint}` (strips `id`/timestamps) |
| Copy JSON | `copy_json` | `navigator.clipboard.writeText()` |
| Archive | `archive` | `PUT {apiEndpoint}/{id} { active: false }` |
| Unarchive | `unarchive` | `PUT {apiEndpoint}/{id} { active: true }` |

The `apiEndpoint` parameter is passed from the model config's `apiEndpoint` field (e.g. `'/api/admin/brands'`). When rendered inside a ResourceView or FormView, it falls back to `context.apiEndpoint`.

### Context-Aware Actions

- **ListView (Bulk Mode)**: `context.mode = 'bulk'`, `context.view = 'list'`, `context.selectedIds = [...]`
- **FormView (Single Mode)**: `context.mode = 'single'`, `context.view = 'form'`, `context.record = { ... }`, `context.apiEndpoint = '/api/admin/...'`

### Context API Endpoint Flow

1. Model config defines `apiEndpoint` (e.g. `'/api/admin/brands'`)
2. ResourceView passes it to `getDefaultServerActions(flags, apiEndpoint)` and to `ActionContext.apiEndpoint`
3. FormView passes `context.apiEndpoint` via `actionContext`
4. Default action `onClick` handlers use the endpoint for all `fetch()` calls

## Interfaces

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

export interface ActionContext {
    mode: 'bulk' | 'single'
    view: 'list' | 'form'
    record?: any
    selectedIds?: string[]
    refresh?: () => void
    apiEndpoint?: string
}
```

## Integration with Model Configs

In each model's `config/index.ts`:

```typescript
export const brandConfig = {
  entityName: 'Brand',
  entityNamePlural: 'Brands',
  apiEndpoint: '/api/admin/brands',
  defaultActions: {
    print: true,
    exportExcel: true,
    delete: true,
    duplicate: true,
    copyJson: true,
    archive: true,
    unarchive: true,
  },
  customServerActions: [...] as ServerActionConfig[],
  listViewConfig: ...,
  formViewConfig: ...,
}
```

The `customServerActions` array allows adding model-specific actions beyond the defaults (e.g. "Mark as Featured" for products).

## FormView ServerActions

Two ServerActions instances appear in FormView:

1. **Dropdown (top-right)**: Shows in edit mode only — contains all actions (defaults + custom). Wrapped with `mounted` guard for SSR hydration safety.

2. **Inline sidebar (Quick Actions)**: Shows default actions filtered out — only custom actions appear. Also wrapped with `mounted` guard.

The sidebar filter:
```tsx
serverActions.filter(action => 
  !['print', 'export_excel', 'delete', 'duplicate', 'copy_json', 'archive', 'unarchive'].includes(action.key)
)
```

## Layout Options

- **`inline`**: Vertical stack (default). Used in sidebar.
- **`toolbar`**: Horizontal row. Used in action bars.
- **`drawer`**: Larger vertical spacing. Used in mobile drawer.
- **`dropdown`**: Dropdown via settings icon. Used in FormView header.

## Best Practices

1. **Always check context.mode**: Handle both bulk and single modes
2. **Use context.record for FormView**: Access single record via `context.record`
3. **Use context.selectedIds for ListView**: Access IDs via `context.selectedIds`
4. **Dynamic confirm messages**: Use function form of `confirm`
5. **Mode filtering**: Use `mode` prop (create, edit, both, bulk)
6. **Conditional display**: Use `show` prop to conditionally hide actions
7. **mounted guard**: Wrap ServerActions on edit pages with `mounted &&` to avoid hydration mismatches from mode switching
