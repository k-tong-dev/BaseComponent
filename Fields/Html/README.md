# Html Field

HTML editor with monospace textarea input and basic HTML preview.

## Props
- `config`: FieldConfig — field configuration
- `value`: `string` — HTML content
- `onChange`: `(value: string) => void`
- `error`: `string | null`

## Example
```typescript
{ name: 'body', type: 'html', label: 'Content', rows: 12 }
```
