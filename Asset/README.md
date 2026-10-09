# Asset Manager

A file management UI built on top of Supabase Storage (`assets` bucket). Uses path-prefix folders (no DB tables), stores file metadata in the bucket itself.

## Components

### `AssetManager`
Full-page admin interface for browsing, uploading, creating folders, renaming, and deleting files.

```
┌────────────────────────────┐
│  [Upload]  [New Folder]    │
├─────────┬──────────────────┤
│ Folders │  File Grid       │
│ Tree    │  (thumbnail grid │
│         │   with select)   │
│         │                  │
└─────────┴──────────────────┘
```

### `AssetPickerModal`
Modal for selecting files from inside a FormView file field.

| Prop | Type | Description |
|------|------|-------------|
| `open` | `boolean` | Show/hide modal |
| `onClose` | `() => void` | Close callback |
| `onSelect` | `(file: StorageFile) => void` | Called per selected file on Apply |
| `maxFiles` | `number` | `1` = single-select (click to confirm); `>1` = multi-select with checkboxes + Apply button; omit = unlimited |

### `FolderTree`
Sidebar tree of folder paths.

| Prop | Type | Description |
|------|------|-------------|
| `selectedPath` | `string \| null` | Currently active folder |
| `onSelect` | `(path: string \| null) => void` | Folder click handler |
| `onNewFolder` | `(parentPath: string \| null) => void` | Create subfolder |
| `onRename` | `(folder: StorageFolder) => void` | Rename folder |
| `onDelete` | `(folder: StorageFolder) => void` | Delete folder |

### `FileGrid`
Thumbnail grid with select-all, multi-select, and delete.

| Prop | Type | Description |
|------|------|-------------|
| `files` | `StorageFile[]` | Files to display |
| `loading` | `boolean` | Loading state |
| `selectedIds` | `Set<string>` | Currently selected file paths |
| `onToggleSelect` | `(path: string) => void` | Toggle selection |
| `onSelectAll` | `() => void` | Select all visible |
| `onDeselectAll` | `() => void` | Deselect all |
| `onDelete` | `(files: StorageFile[]) => void` | Bulk delete |

## Types

```ts
interface StorageFile {
  name: string
  id: string        // storage path (e.g. "Brands/uuid.png")
  path: string      // full path (same as id)
  url: string       // public Supabase URL
  updated_at: string | null
  created_at: string | null
  metadata: { size: number; mimetype: string } | null
}

interface StorageFolder {
  name: string
  id: string | null
  path: string
}
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/storage/files?path=` | List files in folder |
| `DELETE` | `/api/admin/storage/files?path=` | Delete a single file |
| `POST` | `/api/admin/storage/upload` | Upload file (multipart) |
| `GET` | `/api/admin/storage/folders?path=` | List folders |
| `POST` | `/api/admin/storage/folders` | Create folder |
| `PUT` | `/api/admin/storage/folders` | Rename folder |
| `DELETE` | `/api/admin/storage/folders?path=` | Delete folder + contents |

## Storage Structure

```
assets/                  # Supabase Storage bucket (public)
├── Brands/              # path-prefix "folder"
│   ├── uuid.svg
│   └── ...
├── Products/
│   ├── uuid1.jpg
│   ├── uuid2.jpg
│   └── ...
└── ...
```

Folders are path prefixes only — no database records. Files are stored with UUID-based names to avoid collisions. The original filename is preserved in the metadata.
