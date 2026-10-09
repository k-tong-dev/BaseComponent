# Selection Field

General-purpose selection field supporting single, multiple, grouped, and tree modes.

## Props
- `config`: FieldConfig — field configuration
- `value`: `string | string[] | null` — current value(s)
- `onChange`: `(value) => void` — change handler
- `error`: `string | null` — validation error message

## Config Options
- `options`: `SelectOption[]` — static options
- `fetchUrl`: `string` — API endpoint for dynamic options
- `multiple`: `boolean` — enable multi-select with badges
- `groupBy`: `string` — group options by field
- `tree`: `boolean` — tree mode with children

## Examples
```typescript
{ name: 'category', type: 'selection', label: 'Category',
  options: [{ id: 1, name: 'Electronics' }, { id: 2, name: 'Clothing' }] }

{ name: 'tags', type: 'selection', label: 'Tags',
  fetchUrl: '/api/tags', multiple: true }

{ name: 'org', type: 'selection', label: 'Organization',
  fetchUrl: '/api/orgs', tree: true }
```
