import type { StorageFile } from './types'

/**
 * Resolve a Supabase Storage object key from a stored file reference.
 *
 * Only references that point at our own bucket are returned — external URLs,
 * data URIs and blob URLs are ignored (we must never try to delete those).
 */
export function storagePath(file: any): string | null {
  if (!file) return null
  const p = typeof file === 'string' ? file : (file.path || file.id)
  if (!p || typeof p !== 'string') return null
  if (/^(https?:|data:|blob:)/i.test(p)) return null
  return p
}

/** Whether a stored file reference lives in our Supabase Storage bucket. */
export function isBucketFile(file: any): boolean {
  return storagePath(file) !== null
}

/**
 * Upload a device file to the Supabase Storage bucket.
 *
 * Returns the created {@link StorageFile} reference (same shape the Storage
 * browser returns), so callers can persist it exactly like a picked asset.
 */
export async function uploadToBucket(file: File, path?: string): Promise<StorageFile> {
  const form = new FormData()
  form.append('file', file)
  if (path) form.append('path', path)

  const res = await fetch('/api/dashboard/storage/upload', { method: 'POST', body: form })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || data?.message || 'Upload failed')

  return {
    id: data.id ?? data.path ?? file.name,
    name: data.name ?? file.name,
    path: data.path ?? data.id ?? file.name,
    url: data.url,
    updated_at: data.updated_at ?? null,
    created_at: data.created_at ?? null,
    metadata: data.metadata ?? { size: file.size, mimetype: file.type || 'application/octet-stream' },
  }
}

/** Delete a single file from the bucket. No-op for non-bucket references. */
export async function deleteStorageFile(file: any): Promise<void> {
  const path = storagePath(file)
  if (!path) return
  try {
    await fetch(`/api/dashboard/storage/files?path=${encodeURIComponent(path)}`, { method: 'DELETE' })
  } catch {
    /* best-effort cleanup — never block the UI */
  }
}

/** Delete several files from the bucket (best-effort). */
export async function deleteStorageFiles(files: any[]): Promise<void> {
  await Promise.all((files || []).map((f) => deleteStorageFile(f)))
}
