# Boolean Field

Toggle switch for boolean values.

## Props
- `config`: FieldConfig — field configuration (uses `label`, `readonly`)
- `value`: `boolean` — current toggle state
- `onChange`: `(value: boolean) => void`
- `error`: `string | null`

## Example
```typescript
{ name: 'active', type: 'boolean', label: 'Active' }
```
