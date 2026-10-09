# FileField

A drag-and-drop file upload field that integrates with Supabase Storage via the Asset Picker Modal. Stores file references as JSON objects in `jsonb` columns (not `ir_attachment`).

## Usage

```ts
// FormView field config
{
  key: 'image_id',
  label: 'Image',
  type: 'file',
  maxFiles: 1,        // 1 = single-file mode; omit or >1 for multi-file
  accept: 'image/*',  // file filter for native picker fallback
  uploadText: 'Click to upload logo',
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `files` | `UploadedFile[]` | required | Current file list |
| `maxFiles` | `number` | — | `1` for single-file, `>1` to limit count, omit for unlimited |
| `accept` | `string` | `'image/*'` | Accepted MIME types |
| `uploadText` | `string` | — | Custom drop-zone label |
| `label` | `string` | — | Field label |
| `readonly` | `boolean` | — | Disable interactions |
| `error` | `string` | — | Validation error message |
| `onFilesSelected` | `(files: File[]) => void` | required | Called when user drops/selects native files |
| `onRemove` | `(index: number) => void` | required | Called when user removes a file |
| `onAssetSelected` | `(asset: StorageFile) => void` | — | Called per file when user picks from Asset Picker |

## Data Flow

1. **Click drop zone** → opens AssetPickerModal
2. **Drag files** → uploads to `/api/admin/storage/upload`, calls `onAssetSelected` with the result
3. **Picker multi-select** → `maxFiles=1` closes immediately on click; `>1` shows checkboxes + Apply button
4. **Form submit** → FormView reads `uploadedFiles` state and writes JSON into the payload (single object for `maxFiles=1`, array otherwise)

## Storage Format

Single-file field stores:
```json
{ "id": "uuid", "name": "photo.png", "url": "...", "metadata": {...} }
```

Multi-file field stores:
```json
[ { "id": "uuid", "name": "photo.png", "url": "...", ... } ]
```

The `url` is a public Supabase Storage URL. The `id` is the storage path (e.g. `Brands/uuid.ext`).

## Type

```ts
type UploadedFile = StorageFile & { file?: File }
```
