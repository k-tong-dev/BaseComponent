# Many2Many Field

Multi-selection field that fetches options from an API. Selected values display as removable badges.

## Props
Same as FieldProps with config requiring `fetchUrl`.

## Config
- `fetchUrl`: `string` — API endpoint to fetch related records
- `default`: `string[]` — default pre-selected record IDs

## Value Format
- Input: `string[]` (array of record IDs)
- Output: `string[]` (selected record IDs)

## Pre-selected Values
Configure default badges by passing IDs in `default`:
```typescript
{ 
    name: 'tags', 
    type: 'many2many', 
    label: 'Tags',
    fetchUrl: '/api/tags', 
    default: ['1', '3'] 
}
```

## Example
```typescript
{ name: 'product_ids', type: 'many2many', label: 'Products',
  fetchUrl: '/api/products' }
```
