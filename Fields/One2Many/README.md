# One2Many Field

Reverse relation multi-selection field. Fetches options from an API and displays selected values as badges.

## Props
Same as FieldProps with config requiring `fetchUrl`.

## Config
- `fetchUrl`: `string` — API endpoint for related records
- `default`: `string[]` — default pre-selected record IDs

## Value Format
- Input: `string[]` (array of record IDs)
- Output: `string[]` (selected record IDs)

## Example
```typescript
{ name: 'order_ids', type: 'one2many', label: 'Orders',
  fetchUrl: '/api/orders?customer_id=:id' }
```
