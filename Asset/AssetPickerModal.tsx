'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Modal, Button } from 'rsuite'
import { Loader2, Check, ChevronRight, Home, Folder, Image, File, Film, Music, Archive, Upload, Link2, HardDrive, X } from 'lucide-react'
import type { StorageFile, StorageFolder } from './types'
import { FaFolder } from 'react-icons/fa'
import { uploadToBucket } from './storage-client'

interface AssetPickerModalProps {
  open: boolean
  onClose: () => void
  onSelect: (file: StorageFile) => void
  maxFiles?: number
  /** Accepted MIME types for the device picker (default: images). */
  accept?: string
  /** Folder inside the bucket that device uploads are stored under. */
  uploadPath?: string
  /** Title shown in the header. */
  title?: string
  /** Which sources are available. Defaults to all three. */
  allowUpload?: boolean
  allowUrl?: boolean
  allowStorage?: boolean
}

type Source = 'device' | 'url' | 'storage'

function getFileIcon(mime: string | null) {
  if (!mime) return <File className="w-5 h-5" />
  if (mime.startsWith('image/')) return <Image className="w-5 h-5" />
  if (mime.startsWith('video/')) return <Film className="w-5 h-5" />
  if (mime.startsWith('audio/')) return <Music className="w-5 h-5" />
  if (mime.includes('zip') || mime.includes('rar') || mime.includes('tar') || mime.includes('7z'))
    return <Archive className="w-5 h-5" />
  return <File className="w-5 h-5" />
}

const FILE_COLORS: Record<string, string> = {
  'image/jpeg': 'from-blue-500/20 to-blue-600/10',
  'image/png': 'from-green-500/20 to-green-600/10',
  'image/webp': 'from-purple-500/20 to-purple-600/10',
  'image/gif': 'from-pink-500/20 to-pink-600/10',
  'image/svg+xml': 'from-orange-500/20 to-orange-600/10',
  'application/pdf': 'from-red-500/20 to-red-600/10',
}

function getFileColor(mime: string | null): string {
  if (!mime) return 'from-gray-500/20 to-gray-600/10'
  return FILE_COLORS[mime] || 'from-gray-500/20 to-gray-600/10'
}

export function AssetPickerModal({
  open,
  onClose,
  onSelect,
  maxFiles,
  accept = 'image/*',
  uploadPath,
  title = 'Select Asset',
  allowUpload = true,
  allowUrl = true,
  allowStorage = true,
}: AssetPickerModalProps) {
  const [source, setSource] = useState<Source>(allowUpload ? 'device' : allowUrl ? 'url' : 'storage')
  const [currentPath, setCurrentPath] = useState<string | null>(null)
  const [folders, setFolders] = useState<StorageFolder[]>([])
  const [files, setFiles] = useState<StorageFile[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [urlValue, setUrlValue] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isSingle = maxFiles === 1

  const loadFiles = useCallback(async (path: string | null) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/dashboard/storage/files?path=${encodeURIComponent(path || '')}`)
      if (res.ok) {
        const data = await res.json()
        setFolders(data.folders || [])
        setFiles(data.files || [])
      }
    } catch (e) {
      console.error('Failed to load files', e)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (open) {
      setCurrentPath(null)
      setSelected(new Set())
      setUploadError(null)
      setUrlValue('')
      setUrlError(null)
      setSource(allowUpload ? 'device' : allowUrl ? 'url' : 'storage')
      loadFiles(null)
    }
  }, [open, loadFiles, allowUpload, allowUrl])

  useEffect(() => {
    if (open && source === 'storage') loadFiles(currentPath)
  }, [currentPath, open, source, loadFiles])

  const handleNavigate = (path: string | null) => {
    setCurrentPath(path)
    setSelected(new Set())
  }

  // ── Device (OS / phone native picker) ──────────────────────────────────
  const handleDeviceFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) return
    setUploadError(null)
    setUploading(true)
    try {
      const chosen = Array.from(list)
      const limit = maxFiles ? Math.max(0, maxFiles - (isSingle ? 0 : selected.size)) : chosen.length
      const toUpload = isSingle ? chosen.slice(0, 1) : chosen.slice(0, limit || chosen.length)
      for (const file of toUpload) {
        const uploaded = await uploadToBucket(file, uploadPath)
        onSelect(uploaded)
      }
      onClose()
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  // ── URL ───────────────────────────────────────────────────────────────
  const handleAddUrl = () => {
    const value = urlValue.trim()
    if (!value) {
      setUrlError('Please paste an image URL')
      return
    }
    let normalized = value
    if (!/^(https?:|data:)/i.test(normalized)) normalized = `https://${normalized}`
    try {
      // Validate it parses (data URIs are allowed as-is).
      if (!/^data:/i.test(normalized)) new URL(normalized)
    } catch {
      setUrlError('That does not look like a valid URL')
      return
    }
    setUrlError(null)
    const name = normalized.split('?')[0].split('/').pop() || 'image'
    onSelect({
      id: normalized,
      name,
      path: normalized,
      url: normalized,
      updated_at: null,
      created_at: null,
      metadata: { size: 0, mimetype: 'image/*' },
    })
    onClose()
  }

  const breadcrumbs = (() => {
    const segments: { label: string; path: string | null }[] = [{ label: 'All Assets', path: null }]
    if (currentPath) {
      const parts = currentPath.split('/')
      let acc = ''
      for (const part of parts) {
        acc = acc ? `${acc}/${part}` : part
        segments.push({ label: part, path: acc })
      }
    }
    return segments
  })()

  const handleToggle = (path: string) => {
    if (isSingle) {
      const file = files.find(f => f.path === path)
      if (file) { onSelect(file); onClose() }
      return
    }
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else if (!maxFiles || next.size < maxFiles) next.add(path)
      return next
    })
  }

  const handleApply = () => {
    for (const file of files) {
      if (selected.has(file.path)) onSelect(file)
    }
    onClose()
  }

  const sources: Array<{ id: Source; label: string; icon: React.ReactNode; enabled: boolean }> = [
    { id: 'device', label: 'From Device', icon: <HardDrive className="w-3.5 h-3.5" />, enabled: allowUpload },
    { id: 'url', label: 'From URL', icon: <Link2 className="w-3.5 h-3.5" />, enabled: allowUrl },
    { id: 'storage', label: 'Library', icon: <Folder className="w-3.5 h-3.5" />, enabled: allowStorage },
  ]

  return (
    <Modal open={open} onClose={onClose} size="lg" backdrop={'static'} draggable>
      <Modal.Header>
        <Modal.Title>
          <span className="text-base font-semibold tracking-tight">{title}</span>
          {maxFiles && <span className="text-sm font-normal text-muted-foreground/60 ml-2">(max {maxFiles})</span>}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="space-y-4">
          {/* Source selector */}
          <div className="inline-flex items-center gap-1 rounded-xl border border-border/60 bg-muted/30 p-1">
            {sources.filter(s => s.enabled).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSource(s.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  source === s.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>

          {/* ── From Device ─────────────────────────────────────────────── */}
          {source === 'device' && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/70 bg-muted/10 py-12">
              <input
                ref={inputRef}
                type="file"
                accept={accept}
                multiple={!isSingle}
                className="hidden"
                onChange={(e) => handleDeviceFiles(e.target.files)}
              />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-border/50">
                {uploading
                  ? <Loader2 className="w-7 h-7 animate-spin text-primary/70" />
                  : <Upload className="w-7 h-7 text-primary/60" />}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground/70">
                  {uploading ? 'Uploading…' : `Choose ${isSingle ? 'a file' : 'files'} from your device`}
                </p>
                <p className="text-xs mt-1 text-muted-foreground/60">
                  {isSingle ? 'A single file will be uploaded' : `Up to ${maxFiles ?? 'unlimited'} files`} · uploaded to storage
                </p>
              </div>
              <Button
                appearance="primary"
                color={"violet"}
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
              >
                {uploading ? 'Uploading…' : 'Browse device'}
              </Button>
              {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
            </div>
          )}

          {/* ── From URL ───────────────────────────────────────────────── */}
          {source === 'url' && (
            <div className="space-y-3 rounded-xl border border-border/60 bg-muted/10 p-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Link2 className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
                  <input
                    type="text"
                    value={urlValue}
                    onChange={(e) => { setUrlValue(e.target.value); setUrlError(null) }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddUrl() }}
                    placeholder="https://example.com/image.png"
                    className="w-full rounded-lg border border-border/60 bg-background py-2 pl-8 pr-3 text-sm outline-none focus:border-primary/50"
                  />
                  {urlValue && (
                    <Button
                      appearance="primary"
                      color={"violet"}
                      onClick={() => setUrlValue('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
                <Button appearance="primary" color={"violet"} onClick={handleAddUrl} disabled={!urlValue.trim()}>Add</Button>
              </div>
              {urlError && <p className="text-xs text-red-500">{urlError}</p>}
              {urlValue.trim() && (
                <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-background p-2">
                  <img
                    src={urlValue.trim()}
                    alt="preview"
                    className="h-14 w-14 rounded-md object-cover bg-muted"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden' }}
                  />
                  <p className="truncate text-xs text-muted-foreground">{urlValue.trim()}</p>
                </div>
              )}
              <p className="text-[11px] text-muted-foreground/60">
                Paste a direct link to an image. The URL is stored as-is (no upload).
              </p>
            </div>
          )}

          {/* ── From Library (Storage) ─────────────────────────────────── */}
          {source === 'storage' && (
            <>
              {/* Breadcrumbs */}
              <div className="flex items-center gap-1.5 text-sm">
                <Home className="w-3.5 h-3.5 text-muted-foreground/40" />
                {breadcrumbs.map((crumb, i) => (
                  <span key={crumb.path ?? '__root'} className="flex items-center gap-1.5">
                    {i > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground/30" />}
                    {i === breadcrumbs.length - 1 ? (
                      <span className="text-sm font-medium text-foreground/80 px-1.5 py-0.5 rounded-md bg-muted/50">
                        {crumb.label}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleNavigate(crumb.path)}
                        className="text-sm text-muted-foreground/50 hover:text-foreground/80 transition-colors px-1.5 py-0.5 rounded-md hover:bg-muted/50"
                      >
                        {crumb.label}
                      </button>
                    )}
                  </span>
                ))}
              </div>

              {/* Grid */}
              {loading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <div className="relative">
                    <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent rounded-full blur-xl" />
                  </div>
                  <p className="text-sm text-muted-foreground/60 font-medium">Loading assets...</p>
                </div>
              ) : folders.length === 0 && files.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-muted/80 to-muted/40 flex items-center justify-center border border-border/50">
                    <Folder className="w-7 h-7 text-muted-foreground/40" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground/60">No files found</p>
                    <p className="text-xs mt-1 text-muted-foreground/50">Upload files to the current folder</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {folders.map((folder) => {
                    const isHovered = hoveredCard === folder.path
                    return (
                      <button
                        key={folder.path}
                        onClick={() => handleNavigate(folder.path)}
                        onMouseEnter={() => setHoveredCard(folder.path)}
                        onMouseLeave={() => setHoveredCard(null)}
                        className="group text-left focus:outline-none"
                      >
                        <div className={`rounded-xl border-2 overflow-hidden transition-all duration-200 bg-background ${
                          isHovered
                            ? 'border-primary/40 shadow-lg shadow-primary/5 translate-y-[-1px]'
                            : 'border-border/60 hover:border-primary/30 shadow-sm'
                        }`}>
                          <div className="aspect-square bg-gradient-to-br from-amber-50/80 to-amber-100/40 dark:from-amber-950/30 dark:to-amber-900/20 flex items-center justify-center">
                            <div className={`transition-transform duration-200 ${isHovered ? 'scale-110' : 'scale-100'}`}>
                              <FaFolder className="w-10 h-10 text-amber-400" />
                            </div>
                          </div>
                          <div className="p-2">
                            <p className="text-xs font-medium truncate text-foreground/80">{folder.name}</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}

                  {files.map((file) => {
                    const isSelected = selected.has(file.path)
                    const isHovered = hoveredCard === file.path
                    const isImage = file.metadata?.mimetype.startsWith('image/')
                    const fileColor = getFileColor(file.metadata?.mimetype ?? null)

                    return (
                      <button
                        key={file.path}
                        onClick={() => handleToggle(file.path)}
                        onMouseEnter={() => setHoveredCard(file.path)}
                        onMouseLeave={() => setHoveredCard(null)}
                        className={`group relative text-left rounded-xl border-2 overflow-hidden transition-all duration-200 bg-background focus:outline-none ${
                          isSelected
                            ? 'border-primary shadow-lg shadow-primary/10 bg-primary/[0.02]'
                            : isHovered
                              ? 'border-primary/30 shadow-lg shadow-primary/5 translate-y-[-1px]'
                              : 'border-border/60 hover:border-primary/30 shadow-sm'
                        }`}
                      >
                        {!isSingle && (
                          <div className={`absolute top-2 left-2 z-10 w-5 h-5 rounded-md flex items-center justify-center transition-all duration-150 ${
                            isSelected
                              ? 'bg-primary shadow-sm shadow-primary/30 scale-100 opacity-100'
                              : 'bg-background/90 border border-border opacity-0 group-hover:opacity-100 hover:border-primary/50 scale-90 group-hover:scale-100'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-primary-foreground stroke-[2.5]" />}
                          </div>
                        )}

                        <div className={`aspect-square bg-gradient-to-br ${fileColor} flex items-center justify-center relative overflow-hidden`}>
                          {isImage ? (
                            <>
                              <img src={file.url} alt={file.name} className={`w-full h-full object-cover transition-all duration-300 ${
                                isHovered ? 'scale-105' : 'scale-100'
                              }`} loading="lazy" />
                              <div className={`absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent transition-opacity duration-200 ${
                                isHovered ? 'opacity-100' : 'opacity-0'
                              }`} />
                            </>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <div className={`transition-transform duration-200 ${isHovered ? 'scale-110' : 'scale-100'}`}>
                                {getFileIcon(file.metadata?.mimetype ?? null)}
                              </div>
                              <span className="text-[9px] font-bold tracking-widest text-muted-foreground/40 uppercase">
                                {file.name.split('.').pop() || 'FILE'}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-2">
                          <p className="text-xs font-medium truncate text-foreground/80">{file.name}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onClose} appearance="subtle">Cancel</Button>
        {source === 'storage' && !isSingle && (
          <Button onClick={handleApply} appearance="primary" disabled={selected.size === 0}>
            Apply ({selected.size})
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  )
}
