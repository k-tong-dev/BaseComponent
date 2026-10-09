'use client'

import { useState, useCallback } from 'react'
import { Loader2, Folder, File, Image, Film, Music, Archive, Check, FolderPlus, Edit3, Trash2, Move } from 'lucide-react'
import type { StorageFile, StorageFolder } from './types'
import { Checkbox } from '@/components/ui/checkbox'

interface FileGridProps {
  folders: StorageFolder[]
  files: StorageFile[]
  loading: boolean
  selectedIds: Set<string>
  onToggleSelect: (path: string) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onDelete: (files: StorageFile[]) => void
  onViewDetail?: (file: StorageFile) => void
  onNavigate?: (path: string) => void
  onNewSubfolder?: (parentPath: string | null) => void
  onRenameFolder?: (folder: StorageFolder) => void
  onDeleteFolder?: (folder: StorageFolder) => void
  onMoveFiles?: (paths: string[], targetPath: string | null) => void
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function getFileIcon(mime: string | null) {
  if (!mime) return <File className="w-6 h-6" />
  if (mime.startsWith('image/')) return <Image className="w-6 h-6" />
  if (mime.startsWith('video/')) return <Film className="w-6 h-6" />
  if (mime.startsWith('audio/')) return <Music className="w-6 h-6" />
  if (mime.includes('zip') || mime.includes('rar') || mime.includes('tar') || mime.includes('7z'))
    return <Archive className="w-6 h-6" />
  return <File className="w-6 h-6" />
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

export function FileGrid({
  folders,
  files,
  loading,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onDelete,
  onViewDetail,
  onNavigate,
  onNewSubfolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveFiles,
}: FileGridProps) {
  const allSelected = files.length > 0 && selectedIds.size === files.length
  const hasSelection = selectedIds.size > 0
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null)
  const [dragOverEmpty, setDragOverEmpty] = useState(false)

  const handleDragStart = useCallback((e: React.DragEvent, path: string) => {
    const paths = selectedIds.size > 0
      ? [...selectedIds]
      : [path]
    e.dataTransfer.setData('text/plain', JSON.stringify(paths))
    e.dataTransfer.effectAllowed = 'move'
    if (paths.length > 1) {
      const el = e.currentTarget as HTMLElement
      el.style.opacity = '0.5'
    }
  }, [selectedIds])

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const el = e.currentTarget as HTMLElement
    el.style.opacity = ''
  }, [])

  const parseDragPaths = (e: React.DragEvent): string[] => {
    try {
      const raw = e.dataTransfer.getData('text/plain')
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      return []
    }
  }

  const handleFolderDrop = useCallback((e: React.DragEvent, targetPath: string) => {
    e.preventDefault()
    setDragOverFolder(null)
    const paths = parseDragPaths(e)
    const valid = paths.filter(p => p && p !== targetPath && !p.startsWith(targetPath + '/'))
    if (valid.length > 0) {
      onMoveFiles?.(valid, targetPath)
    }
  }, [onMoveFiles])

  const handleEmptyDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOverFolder(null)
    setDragOverEmpty(false)
    const paths = parseDragPaths(e)
    if (paths.length > 0) {
      onMoveFiles?.(paths, null)
    }
  }, [onMoveFiles])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <div className="relative">
          <Loader2 className="w-10 h-10 animate-spin text-primary/60" />
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent rounded-full blur-xl" />
        </div>
        <p className="text-sm text-muted-foreground/60 font-medium tracking-wide">Loading assets...</p>
      </div>
    )
  }

  if (folders.length === 0 && files.length === 0) {
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverEmpty(true) }}
        onDragLeave={() => setDragOverEmpty(false)}
        onDrop={handleEmptyDrop}
        className={`flex flex-col items-center justify-center h-80 text-muted-foreground gap-4 transition-all duration-200 rounded-xl border-2 ${
          dragOverEmpty
            ? 'border-primary border-dashed bg-primary/5 scale-[1.02]'
            : 'border-transparent'
        }`}
        style={dragOverEmpty ? { animation: 'drop-target-pulse 1.2s ease-in-out infinite', boxShadow: '0 0 0 4px rgba(79,70,229,0.1)' } : undefined}
      >
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-muted/80 to-muted/40 flex items-center justify-center border border-border/50 shadow-sm">
            <Folder className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs text-primary/60">+</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground/60">This folder is empty</p>
          <p className="text-xs mt-1 text-muted-foreground/50">Upload files or create a folder to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <label className="flex items-center gap-2.5 text-sm text-muted-foreground/70 cursor-pointer">
          <Checkbox
            checked={allSelected}
            color="violet"
            onChange={allSelected ? onDeselectAll : onSelectAll}
            className="rounded border-border"
          />
          <span className="text-xs font-medium uppercase tracking-wider">
            {allSelected ? 'Deselect all' : 'Select all'}
          </span>
          <span className="text-xs text-muted-foreground/40 font-mono">
            {folders.length + files.length} item{(folders.length + files.length) !== 1 ? 's' : ''}
          </span>
        </label>
        {hasSelection && (
          <button
            onClick={() => {
              const selected = files.filter((f) => selectedIds.has(f.path))
              onDelete(selected)
            }}
            className="text-xs font-semibold uppercase tracking-wider text-red-500/80 hover:text-red-500 transition-colors px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            Delete {selectedIds.size}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {folders.map((folder) => {
          const isHovered = hoveredCard === folder.path
          const isDragOver = dragOverFolder === folder.path
          return (
            <div
              key={folder.path}
              draggable
              onDragStart={(e) => handleDragStart(e, folder.path)}
              onDragEnd={handleDragEnd}
              onMouseEnter={() => setHoveredCard(folder.path)}
              onMouseLeave={() => setHoveredCard(null)}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverFolder(folder.path) }}
              onDragLeave={() => setDragOverFolder(null)}
              onDrop={(e) => handleFolderDrop(e, folder.path)}
              className="group relative focus:outline-none"
            >
              {/* Folder actions on hover */}
              <div className="absolute top-2 right-2 z-20 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                {onNewSubfolder && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onNewSubfolder(folder.path) }}
                    className="w-6 h-6 rounded-md bg-background/90 border border-border flex items-center justify-center hover:bg-background hover:border-primary/50 transition-all text-muted-foreground/60 hover:text-foreground/80"
                    title="New subfolder"
                  >
                    <FolderPlus className="w-3 h-3" />
                  </button>
                )}
                {onRenameFolder && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onRenameFolder(folder) }}
                    className="w-6 h-6 rounded-md bg-background/90 border border-border flex items-center justify-center hover:bg-background hover:border-primary/50 transition-all text-muted-foreground/60 hover:text-foreground/80"
                    title="Rename"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                )}
                {onDeleteFolder && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder) }}
                    className="w-6 h-6 rounded-md bg-background/90 border border-border flex items-center justify-center hover:bg-background hover:border-red-300 transition-all text-muted-foreground/60 hover:text-red-500"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              <button
                onClick={() => onNavigate?.(folder.path)}
                className="w-full text-left focus:outline-none"
              >
                <div className={`rounded-xl border-2 overflow-hidden transition-all duration-200 bg-background ${
                  isDragOver
                    ? 'border-primary border-dashed bg-primary/5 scale-[1.03]'
                    : isHovered
                      ? 'border-primary/40 shadow-lg shadow-primary/5 translate-y-[-2px]'
                      : 'border-border/60 hover:border-primary/30 shadow-sm hover:shadow-md'
                }`}
                  style={isDragOver ? { animation: 'drop-target-pulse 1.2s ease-in-out infinite', boxShadow: '0 0 0 4px rgba(79,70,229,0.1)' } : undefined}
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-amber-50/80 to-amber-100/40 dark:from-amber-950/30 dark:to-amber-900/20 flex items-center justify-center relative">
                    <div className={`transition-transform duration-200 ${isHovered ? 'scale-110' : 'scale-100'}`}>
                      {isDragOver ? (
                        <div className="flex items-center justify-center" style={{ animation: 'drop-target-glow 1.2s ease-in-out infinite' }}>
                          <Move className="w-10 h-10 text-primary drop-shadow-sm" />
                        </div>
                      ) : (
                        <Folder className="w-10 h-10 text-amber-400 drop-shadow-sm" />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/[0.02] to-transparent pointer-events-none" />
                  </div>
                  <div className="p-2 space-y-0">
                    <p className="text-xs font-medium truncate text-foreground/80 group-hover:text-foreground transition-colors">
                      {folder.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground/40 font-medium uppercase tracking-wider">Folder</p>
                  </div>
                </div>
              </button>
            </div>
          )
        })}

        {files.map((file) => {
          const isSelected = selectedIds.has(file.path)
          const isHovered = hoveredCard === file.path
          const isImg = file.metadata?.mimetype.startsWith('image/')
          const fileColor = getFileColor(file.metadata?.mimetype ?? null)

          return (
            <div
              key={file.path}
              draggable
              onDragStart={(e) => handleDragStart(e, file.path)}
              onDragEnd={handleDragEnd}
              onMouseEnter={() => setHoveredCard(file.path)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`group relative rounded-xl border-2 overflow-hidden transition-all duration-200 ${
                isSelected
                  ? 'border-primary bg-primary/[0.02] shadow-lg shadow-primary/10'
                  : isHovered
                    ? 'border-primary/30 shadow-lg shadow-primary/5 translate-y-[-2px] cursor-grab active:cursor-grabbing'
                    : 'border-border/60 shadow-sm hover:shadow-md'
              }`}
            >
              <button
                onClick={(e) => { e.stopPropagation(); onToggleSelect(file.path) }}
                className={`absolute top-2 left-2 z-20 w-5 h-5 rounded-md flex items-center justify-center transition-all duration-150 ${
                  isSelected
                    ? 'bg-primary shadow-sm shadow-primary/30 scale-100 opacity-100'
                    : 'bg-background/90 border border-border opacity-0 group-hover:opacity-100 hover:border-primary/50 scale-90 group-hover:scale-100'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-primary-foreground stroke-[2.5]" />}
              </button>

              <button
                onClick={() => onViewDetail?.(file)}
                className="w-full text-left focus:outline-none"
              >
                <div className={`aspect-square bg-gradient-to-br ${fileColor} flex items-center justify-center relative overflow-hidden`}>
                  {isImg ? (
                    <>
                      <img
                        src={file.url}
                        alt={file.name}
                        className={`w-full h-full object-cover transition-all duration-300 ${
                          isHovered ? 'scale-105' : 'scale-100'
                        }`}
                        loading="lazy"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent transition-opacity duration-200 ${
                        isHovered ? 'opacity-100' : 'opacity-0'
                      }`} />
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`transition-transform duration-200 ${isHovered ? 'scale-110' : 'scale-100'}`}>
                        {getFileIcon(file.metadata?.mimetype ?? null)}
                      </div>
                      <span className="text-[9px] font-bold tracking-widest text-muted-foreground/40 uppercase">
                        {file.name.split('.').pop() || 'FILE'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-2.5 space-y-0.5">
                  <p className="text-xs font-medium truncate text-foreground/80 group-hover:text-foreground transition-colors">
                    {file.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground/50 font-medium">
                    {file.metadata ? formatSize(file.metadata.size) : ''}
                  </p>
                </div>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
