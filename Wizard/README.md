# Wizard Component

Two tools in one package:

1. **Odoo-style Modal Wizard** — modal popup for messages, forms, or custom content
2. **Developer message system** — persistent toast notifications that replace `console.warn`/`console.error` (no close, no auto-dismiss until bug is fixed)

---

## Developer Message System

Shows warning/error/info toasts in the app UI instead of console logs. These toasts are **persistent** — they have no close button and never auto-dismiss, forcing the developer to fix the underlying issue.

### Usage

```tsx
import { showWizardWarning, showWizardError } from '@/components/Base/Wizard'

// In any widget, field, or view:
showWizardWarning('Missing widgetConfig', 'Many2OneWidget requires a "relation" property.')

showWizardError('Configuration Error', 'Field "price" has unknown type "currency".')
```

### API

| Function | Toast type | Duration |
|---|---|---|
| `showWizardInfo(title, description?)` | Info toast | Persistent |
| `showWizardWarning(title, description?)` | Warning toast | Persistent |
| `showWizardError(title, description?)` | Error toast | Persistent |
| `showWizardMessage(type, title, description?)` | Any type | Persistent |

When called during SSR (`typeof window === 'undefined'`), the message falls back to `console.log`/`console.warn`/`console.error`.

---

## Odoo-style Modal Wizard

A modal dialog for showing messages, collecting input, or presenting custom content. Unlike the multi-step form approach, this is a lightweight popup similar to Odoo's wizard concept.

### Declarative API

```tsx
import { Wizard } from '@/components/Base/Wizard'
import { useState } from 'react'

function MyComponent() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Wizard</Button>

      <Wizard
        open={open}
        onClose={() => setOpen(false)}
        title="Confirm Action"
        variant="warning"
        buttons={[
          { label: 'Cancel', onClick: () => setOpen(false) },
          { label: 'Proceed', appearance: 'primary', color: 'red', onClick: handleProceed },
        ]}
      >
        <p>Are you sure you want to delete this record?</p>
      </Wizard>
    </>
  )
}
```

### Composable sub-components

```tsx
<Wizard open={open} onClose={() => setOpen(false)}>
  <Wizard.Header>
    <Wizard.Title>Create Record</Wizard.Title>
  </Wizard.Header>
  <Wizard.Body>
    {/* Your custom form or content here */}
  </Wizard.Body>
  <Wizard.Footer>
    <Button onClick={handleSave} appearance="primary">Save</Button>
  </Wizard.Footer>
</Wizard>
```

### Imperative quick message

For simple messages from non-component code (e.g., widgets):

```tsx
showWizardMessage({
  title: 'Config Error',
  message: 'Missing relation in widgetConfig',
  type: 'error',
})
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `open` | `boolean` | — | Show/hide modal |
| `onClose` | `() => void` | — | Close handler |
| `title` | `string` | — | Modal title |
| `variant` | `'default' \| 'info' \| 'warning' \| 'error'` | `'default'` | Adds icon prefix |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'sm'` | Modal width |
| `buttons` | `WizardButton[]` | — | Footer action buttons |
| `backdrop` | `boolean \| 'static'` | `true` | Backdrop behavior |
| `children` | `ReactNode` | — | Modal body content |

### WizardButton

| Prop | Type | Description |
|---|---|---|
| `label` | `string` | Button text |
| `onClick` | `() => void \| Promise<void>` | Click handler |
| `appearance` | `'primary' \| 'default' \| 'subtle' \| 'ghost' \| 'link'` | RSuite button style |
| `color` | `'red' \| 'green' \| 'blue' \| 'violet' \| 'orange' \| 'yellow'` | RSuite button color |
| `loading` | `boolean` | Show loading spinner |
| `disabled` | `boolean` | Disable button |

### Use cases

- **Configuration errors** — show missing/invalid config details
- **Confirmation dialogs** — before destructive actions
- **Quick forms** — inline data entry without leaving the page
- **Guided operations** — single-step or multi-step via state management
