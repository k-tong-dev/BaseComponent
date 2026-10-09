# Fields System — Implementation Plan

## 1. Architecture

```
components/
├── ui/
│   ├── input.tsx          ← Material Input + NumberInput (done)
│   ├── textarea.tsx       ← Material Textarea (done)
│   └── select.tsx         ← REWRITE: base selection component
│
├── Base/Fields/
│   ├── Selection/         ← single/multi with badges, avatar, group, tree
│   │   ├── index.tsx
│   │   └── README.md
│   ├── Many2Many/         ← multi-select, API-fetched, badges
│   │   ├── index.tsx
│   │   └── README.md
│   ├── Many2One/          ← single-select, API-fetched, avatar+name
│   │   ├── index.tsx
│   │   └── README.md
│   ├── One2Many/          ← multi-select, API-fetched, badges
│   │   ├── index.tsx
│   │   └── README.md
│   ├── Boolean/           ← toggle/checkbox
│   │   ├── index.tsx
│   │   └── README.md
│   ├── String/            ← text input
│   │   ├── index.tsx
│   │   └── README.md
│   ├── Number/            ← number input
│   │   ├── index.tsx
│   │   └── README.md
│   ├── Html/              ← rich text editor (rte)
│   │   ├── index.tsx
│   │   └── README.md
│   ├── Json/              ← JSON editor
│   │   ├── index.tsx
│   │   └── README.md
│   ├── Widgets/           ← Existing widgets stay untouched
│   │   ├── Many2ManyWidget.tsx
│   │   ├── Many2OneWidget.tsx
│   │   ├── One2ManyWidget.tsx
│   │   ├── TagSelectWidget.tsx
│   │   ├── DatePickerField.tsx
│   │   └── index.ts
│   ├── Demo/              ← Mock data from DummyJSON
│   │   ├── users.json
│   │   ├── contacts.json
│   │   ├── products.json
│   │   ├── customers.json
│   │   └── index.ts
│   ├── types.ts           ← Shared field option/result types
│   ├── index.ts           ← Barrel exports
│   └── PLAN.md
│
└── Base/Views/FormView/
    └── FormView.tsx       ← Updated to use new Fields components
```

## 2. Data Types (`types.ts`)

```ts
// Single selection value
type SelectOption = {
  id: string | number
  name: string
  avatar?: string
  group?: string // for group/tree
  children?: SelectOption[] // for tree
}

// Field metadata for FormView config
type FieldConfig = {
  name: string
  type: 'selection' | 'many2many' | 'many2one' | 'one2many'
           | 'boolean' | 'string' | 'number' | 'html' | 'json'
  label: string
  placeholder?: string
  required?: boolean
  // For selection-type fields:
  options?: SelectOption[]   // static options
  fetchUrl?: string          // API endpoint for dynamic options
  multiple?: boolean         // single vs multi
  groupBy?: string           // group field name
  tree?: boolean             // tree mode
  searchable?: boolean
  default?: any
}
```

## 3. Base Select Component (`components/ui/select.tsx` - rewritten)

| Prop           | Type                   | Description                         |
|----------------|------------------------|-------------------------------------|
| `options`      | `SelectOption[]`       | Static options list                 |
| `value`        | `string \| string[]`   | Controlled value(s)                 |
| `onChange`     | `(v) => void`          | Change handler (JSON format)        |
| `multiple`     | `boolean`              | Enable multi-select (default false) |
| `groupBy`      | `string`               | Group field name                    |
| `tree`         | `boolean`              | Tree mode with children             |
| `searchable`   | `boolean`              | Enable search                       |
| `renderAvatar` | `boolean`              | Show avatar+name in options         |
| `placeholder`  | `string`               | Placeholder text                    |
| `loading`      | `boolean`              | Loading state                       |
| `fetchUrl`     | `string`               | API endpoint for dynamic fetch      |
| `fetchParams`  | `Record<string, any>`  | Extra query params                  |
| `size`         | `'sm' \| 'md' \| 'lg'` | Size variant                        |

Uses rsuite under the hood:
- Single: `SelectPicker`
- Multi: `CheckPicker`
- Group: `SelectPicker` with `groupBy`
- Tree: `TreePicker`
- Avatar+name: custom `renderMenuItem` on `SelectPicker`

## 4. Field Component Patterns

### Selection (`/Fields/Selection/`)
- Wraps `ui/select`
- Default: single select
- `multiple: true` → badges for selected values
- Accepts `options` or `fetchUrl`

### Many2Many (`/Fields/Many2Many/`)
- `multiple: true` + badges by default
- Always API-fetched (`fetchUrl` required)
- Pre-selected values shown as removable badges
- Fetch on search input (debounced)
- Input type: `string[]` (IDs), Output: `{ add: string[], remove: string[] }`

### Many2One (`/Fields/Many2One/`)
- `multiple: false` by default
- Avatar+name display for selected value
- API-fetched or static
- Input: `string | null`, Output: `string | null`

### One2Many (`/Fields/One2Many/`)
- `multiple: true` by default
- API-fetched
- Similar to Many2Many but for reverse relation

### Simple Fields (Boolean, String, Number, Html, Json)
- Boolean: rsuite `Toggle` or `Checkbox`
- String: wraps `ui/Input`
- Number: wraps `ui/NumberInput`
- Html: rsuite `ReactSuite` or `@uiw/react-md-editor`
- Json: textarea with JSON validation

## 5. FormView Integration

In `FormView.tsx`, the `renderField` switch by `type` dispatches to components:

```tsx
switch (field.type) {
  case 'selection':  return <SelectionField config={field} />
  case 'many2many':  return <Many2ManyField config={field} />
  case 'many2one':   return <Many2OneField config={field} />
  case 'one2many':   return <One2ManyField config={field} />
  case 'boolean':    return <BooleanField config={field} />
  case 'string':     return <StringField config={field} />
  case 'number':     return <NumberField config={field} />
  case 'html':       return <HtmlField config={field} />
  case 'json':       return <JsonField config={field} />
}
```

Each field component receives `{ config, value, onChange }` from FormView.

## 6. Implementation Order

| Phase     | Files                                                       | Est.  |
|-----------|-------------------------------------------------------------|-------|
| **1**     | `types.ts`, `index.ts` (barrel)                             | 10min |
| **2**     | Rewrite `ui/select.tsx` (base)                              | 30min |
| **3**     | `Selection/index.tsx`                                       | 20min |
| **4**     | `Many2One/index.tsx`                                        | 20min |
| **5**     | `Many2Many/index.tsx`                                       | 25min |
| **6**     | `One2Many/index.tsx`                                        | 20min |
| **7**     | `Boolean/index.tsx`, `String/index.tsx`, `Number/index.tsx` | 30min |
| **8**     | `Html/index.tsx`, `Json/index.tsx`                          | 25min |
| **9**     | Demo data                                                   | 15min |
| **10**    | FormView integration                                        | 15min |
| **Total** |                                                             | ~3.5h |

## 7. Migration Path

- New Components folder (`Fields/`): **NEW**, no migration needed
- Widgets (`Widgets/`): **KEEP** as-is for existing pages
- FormView: Update to render new Fields components while also supporting old Widgets
- Future: migrate Widget users to new Fields, then remove Widgets

## 8. Mock Data Sources

Use [DummyJSON](https://dummyjson.com/) API or static JSON:
- `users.json` — id, firstName, lastName, image, email
- `contacts.json` — id, name, avatar, phone
- `products.json` — id, title, price, thumbnail, category
- `customers.json` — id, name, email, avatar

Stored as static JSON files under `Demo/` for offline demo.
