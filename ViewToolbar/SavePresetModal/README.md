# SavePresetModal

A modal dialog for saving the current view configuration (search values, filter values, group-by field) as a named preset for later reuse.

## Usage

```tsx
import { SavePresetModal } from './SavePresetModal'

function MyToolbar() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  return (
    <SavePresetModal
      open={open}
      presetName={name}
      onPresetNameChange={setName}
      onSave={() => {
        savePreset(name, viewType, searchValues, filterValues, groupByField)
        setOpen(false)
      }}
      onClose={() => setOpen(false)}
    />
  )
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `open` | `boolean` | Whether the modal is visible |
| `presetName` | `string` | Current value of the name input |
| `onPresetNameChange` | `(name: string) => void` | Called when the user types in the name input |
| `onSave` | `() => void` | Called when the user clicks Save or presses Enter |
| `onClose` | `() => void` | Called when the user cancels or closes the modal |
