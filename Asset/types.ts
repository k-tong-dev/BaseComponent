export interface StorageFile {
  name: string
  id: string
  path: string
  url: string
  updated_at: string | null
  created_at: string | null
  metadata: { size: number; mimetype: string } | null
}

export interface StorageFolder {
  name: string
  id: string | null
  path: string
}
