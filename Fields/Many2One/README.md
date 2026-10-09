# Many2One Field

Single-selection field that fetches options from an API. Displays avatar+name for selected value.

## Props
Same as FieldProps with config requiring `fetchUrl`.

## Config
- `fetchUrl`: `string` — API endpoint to fetch related records
- `default`: `string | null` — default selected record ID

## Value Format
- Input: `string | null` (record ID)
- Output: `string | null` (selected record ID)

## Example
```typescript
{ name: 'customer_id', type: 'many2one', label: 'Customer',
  fetchUrl: '/api/customers' }
```
