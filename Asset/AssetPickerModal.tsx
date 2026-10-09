'use client'

import { useState, useEffect, useCallback } from 'react'
import { Modal, Button } from 'rsuite'
import { Loader2, Check, ChevronRight, Home, Folder, Image, File, Film, Music, Archive } from 'lucide-react'
import type { StorageFile, StorageFolder } from './types'
import {FaFolder} from "react-icons/fa";

interface AssetPickerModalProps {
  open: boolean
  onClose: () => void
  onSelect: (file: StorageFile) => void
  maxFiles?: number
}

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

export function AssetPickerModal({ open, onClose, onSelect, maxFiles }: AssetPickerModalProps) {
  const [currentPath, setCurrentPath] = useState<string | null>(null)
  const [folders, setFolders] = useState<StorageFolder[]>([])
  const [files, setFiles] = useState<StorageFile[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

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
      loadFiles(null)
    }
  }, [open, loadFiles])

  useEffect(() => {
    if (open) loadFiles(currentPath)
  }, [currentPath, open, loadFiles])

  const handleNavigate = (path: string | null) => {
    setCurrentPath(path)
    setSelected(new Set())
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

  return (
    <Modal open={open} onClose={onClose} size="lg" backdrop={"static"} draggable>
      <Modal.Header>
        <Modal.Title>
          <span className="text-base font-semibold tracking-tight">Select Asset</span>
          {maxFiles && <span className="text-sm font-normal text-muted-foreground/60 ml-2">(max {maxFiles})</span>}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="space-y-4">
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
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onClose} appearance="subtle">Cancel</Button>
        {!isSingle && (
          <Button onClick={handleApply} appearance="primary" disabled={selected.size === 0}>
            Apply ({selected.size})
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  )
}
