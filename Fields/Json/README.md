# Json Field

JSON editor with real-time validation. Stores/retrieves parsed JSON objects.

## Props
- `config`: FieldConfig — field configuration
- `value`: `object | array | null` — parsed JSON value
- `onChange`: `(value: object | array | null) => void`
- `error`: `string | null`

## Value Format
- Input: parsed JSON (object, array, or null)
- Output: parsed JSON object/array
- Display: formatted JSON string in monospace textarea

## Example
```typescript
{ name: 'metadata', type: 'json', label: 'Metadata' }
```
