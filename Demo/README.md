# Global Demo Data

Mock data for testing field components and API interactions.

## Usage

### API Endpoints (for field fetchUrl)
```typescript
{ name: 'owner', type: 'many2one', label: 'Owner',
  fetchUrl: '/api/demo/users' }

{ name: 'tags', type: 'selection', label: 'Products',
  fetchUrl: '/api/demo/products', multiple: true }
```

### Direct Import (for in-code options)
```typescript
import { users, products, demo } from '@/components/Base/Demo'

// Static options from demo data
{ name: 'user', type: 'selection', label: 'User',
  options: users.map(u => ({ id: u.id, name: u.name, avatar: u.avatar })) }
```

### API Response Format
All endpoints return: `{ data: [...], total: number }`
Supports: `?search=keyword` and `?limit=number`

## Resources
- **Users** — `/api/demo/users` — 6 users with avatar, email, group
- **Contacts** — `/api/demo/contacts` — 5 companies with avatar, phone
- **Products** — `/api/demo/products` — 8 products with thumbnail, price, category
- **Customers** — `/api/demo/customers` — 5 customers with avatar, email, tier
