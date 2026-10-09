'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Upload, FolderPlus, Copy, ExternalLink, Trash2,
  ChevronRight, Home, Shield, HardDrive, FileImage,
  FileText, FileSpreadsheet, Archive, FolderOpen,
  BarChart3, Link, Globe, Monitor, ChevronDown,
} from 'lucide-react'
import { FileGrid } from './FileGrid'
import type { StorageFile, StorageFolder } from './types'
import {Modal, Input, Button, StatGroup, Stat, StatLabel, StatValue, StatHelpText, HStack} from 'rsuite'
import {FaFolderPlus} from "react-icons/fa6";

const STORAGE_POLICY = {
  maxSize: 50 * 1024 * 1024,
  maxSizeLabel: '50 MB',
  allowedTypes: ['Images', 'PDFs', 'Documents', 'Spreadsheets', 'CSV', 'JSON', 'ZIP'],
} as const

interface Stats {
  totalFiles: number
  totalFolders: number
  totalSize: number
  fileTypes: { label: string; count: number; size: number }[]
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

interface UploadingFile {
  name: string
  status: 'uploading' | 'done' | 'error'
}

function computeStats(files: StorageFile[], rootFolders: StorageFolder[]): Stats {
  const typeBuckets: Record<string, { count: number; size: number }> = {
    Images: { count: 0, size: 0 },
    Documents: { count: 0, size: 0 },
    Archives: { count: 0, size: 0 },
    Other: { count: 0, size: 0 },
  }

  let totalSize = 0
  for (const f of files) {
    const s = f.metadata?.size || 0
    totalSize += s
    const mime = f.metadata?.mimetype || ''
    if (mime.startsWith('image/')) {
      typeBuckets.Images.count++
      typeBuckets.Images.size += s
    } else if (mime.includes('pdf') || mime.includes('document') || mime.includes('spreadsheet') || mime.includes('csv') || mime.includes('text/')) {
      typeBuckets.Documents.count++
      typeBuckets.Documents.size += s
    } else if (mime.includes('zip') || mime.includes('rar') || mime.includes('tar') || mime.includes('7z')) {
      typeBuckets.Archives.count++
      typeBuckets.Archives.size += s
    } else {
      typeBuckets.Other.count++
      typeBuckets.Other.size += s
    }
  }

  return {
    totalFiles: files.length,
    totalFolders: rootFolders.length,
    totalSize,
    fileTypes: Object.entries(typeBuckets)
      .filter(([, v]) => v.count > 0)
      .map(([label, v]) => ({ label, ...v })),
  }
}

export function AssetManager() {
  const [currentPath, setCurrentPath] = useState<string | null>(null)
  const [folders, setFolders] = useState<StorageFolder[]>([])
  const [files, setFiles] = useState<StorageFile[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<UploadingFile[]>([])
  const [stats, setStats] = useState<Stats>({ totalFiles: 0, totalFolders: 0, totalSize: 0, fileTypes: [] })

  const [detailFile, setDetailFile] = useState<StorageFile | null>(null)

  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderParent, setNewFolderParent] = useState<string | null>(null)

  const [showRename, setShowRename] = useState(false)
  const [renameTarget, setRenameTarget] = useState<StorageFolder | null>(null)
  const [renameName, setRenameName] = useState('')

  const [showDeleteFolder, setShowDeleteFolder] = useState(false)
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<StorageFolder | null>(null)
  const [dragOverBreadcrumb, setDragOverBreadcrumb] = useState<string | null>(null)

  const [showDeleteFiles, setShowDeleteFiles] = useState(false)
  const [deleteFilesTargets, setDeleteFilesTargets] = useState<StorageFile[]>([])

  const [showUploadMenu, setShowUploadMenu] = useState(false)
  const [showUrlUpload, setShowUrlUpload] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [urlError, setUrlError] = useState('')
  const [urlLoading, setUrlLoading] = useState(false)
  const uploadBtnRef = useRef<HTMLDivElement>(null)

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

  const loadStats = useCallback(async () => {
    try {
      const [filesRes, foldersRes] = await Promise.all([
        fetch('/api/dashboard/storage/files?path=&recursive=true'),
        fetch('/api/dashboard/storage/folders'),
      ])
      const [allFiles, rootFolders] = await Promise.all([filesRes.json(), foldersRes.json()])
      setStats(computeStats(allFiles, rootFolders))
    } catch (e) {
      console.error('Failed to load stats', e)
    }
  }, [])

  useEffect(() => {
    loadFiles(currentPath)
  }, [currentPath, loadFiles])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  // Close upload dropdown on outside click
  useEffect(() => {
    if (!showUploadMenu) return
    const handler = (e: MouseEvent) => {
      if (uploadBtnRef.current && !uploadBtnRef.current.contains(e.target as Node)) {
        setShowUploadMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showUploadMenu])

  const handleNavigate = useCallback((path: string | null) => {
    setCurrentPath(path)
    setSelectedIds(new Set())
  }, [])

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

  const handleBrowseFiles = () => {
    setShowUploadMenu(false)
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.onchange = async (e) => {
      const fileList = (e.target as HTMLInputElement).files
      if (!fileList) return
      const uploads: UploadingFile[] = Array.from(fileList).map(f => ({ name: f.name, status: 'uploading' as const }))
      setUploading(uploads)

      for (let i = 0; i < fileList.length; i++) {
        const formData = new FormData()
        formData.append('file', fileList[i])
        if (currentPath) formData.append('path', currentPath)
        try {
          const res = await fetch('/api/dashboard/storage/upload', { method: 'POST', body: formData })
          setUploading(prev => prev.map((u, idx) =>
            idx === i ? { ...u, status: res.ok ? 'done' as const : 'error' as const } : u
          ))
        } catch {
          setUploading(prev => prev.map((u, idx) =>
            idx === i ? { ...u, status: 'error' as const } : u
          ))
        }
      }

      setTimeout(() => setUploading([]), 3000)
      await loadFiles(currentPath)
      await loadStats()
    }
    input.click()
  }

  const handleUrlUpload = async () => {
    const url = urlInput.trim()
    if (!url) { setUrlError('Please enter a URL'); return }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      setUrlError('Invalid URL format')
      return
    }

    // Basic extension check on the URL path
    const pathname = new URL(url).pathname
    const ext = pathname.split('.').pop()?.toLowerCase()
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif', 'bmp']
    const docExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'json']
    const archiveExts = ['zip', 'rar', '7z', 'tar', 'gz']
    if (ext && ![...imageExts, ...docExts, ...archiveExts].includes(ext)) {
      setUrlError(`File type ".${ext}" is not supported`)
      return
    }

    setUrlError('')
    setUrlLoading(true)
    setUploading([{ name: url.split('/').pop() || url, status: 'uploading' }])

    try {
      const res = await fetch('/api/dashboard/storage/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, path: currentPath || '' }),
      })
      setUploading([{ name: url.split('/').pop() || url, status: res.ok ? 'done' : 'error' }])
      if (res.ok) {
        setShowUrlUpload(false)
        setUrlInput('')
        await loadFiles(currentPath)
        await loadStats()
      } else {
        const data = await res.json()
        setUrlError(data.error || 'Upload failed')
      }
    } catch {
      setUploading([{ name: url.split('/').pop() || url, status: 'error' }])
      setUrlError('Network error — could not reach server')
    }
    setUrlLoading(false)
    setTimeout(() => setUploading([]), 3000)
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    const parentPath = newFolderParent || ''
    const fullPath = parentPath ? `${parentPath}/${newFolderName.trim()}` : newFolderName.trim()
    try {
      const res = await fetch('/api/dashboard/storage/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: fullPath }),
      })
      if (res.ok) {
        setShowNewFolder(false)
        setNewFolderName('')
        await loadFiles(currentPath)
        await loadStats()
      }
    } catch (e) {
      console.error('Failed to create folder', e)
    }
  }

  const handleRenameFolder = async () => {
    if (!renameTarget || !renameName.trim()) return
    const parentPath = renameTarget.path.substring(0, renameTarget.path.lastIndexOf('/'))
    const newPath = parentPath ? `${parentPath}/${renameName.trim()}` : renameName.trim()
    try {
      const res = await fetch('/api/dashboard/storage/folders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: renameTarget.path, newPath }),
      })
      if (res.ok) {
        setShowRename(false)
        setRenameTarget(null)
        await loadFiles(currentPath)
        await loadStats()
      }
    } catch (e) {
      console.error('Failed to rename folder', e)
    }
  }

  const handleDeleteFolder = async () => {
    if (!deleteFolderTarget) return
    try {
      const res = await fetch(`/api/dashboard/storage/folders?path=${encodeURIComponent(deleteFolderTarget.path)}`, { method: 'DELETE' })
      if (res.ok) {
        setShowDeleteFolder(false)
        setDeleteFolderTarget(null)
        if (currentPath === deleteFolderTarget.path) setCurrentPath(null)
        await loadFiles(currentPath === deleteFolderTarget.path ? null : currentPath)
        await loadStats()
      }
    } catch (e) {
      console.error('Failed to delete folder', e)
    }
  }

  const handleDeleteFiles = async (targets: StorageFile[]) => {
    try {
      for (const file of targets) {
        await fetch(`/api/dashboard/storage/files?path=${encodeURIComponent(file.path)}`, { method: 'DELETE' })
      }
      setShowDeleteFiles(false)
      setDeleteFilesTargets([])
      setSelectedIds(new Set())
      await loadFiles(currentPath)
      await loadStats()
    } catch (e) {
      console.error('Failed to delete files', e)
    }
  }

  const handleMoveFiles = async (paths: string[], targetPath: string | null) => {
    try {
      const res = await fetch('/api/dashboard/storage/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths, targetPath: targetPath || '' }),
      })
      if (res.ok) {
        await loadFiles(currentPath)
        await loadStats()
      }
    } catch (e) {
      console.error('Failed to move files', e)
    }
  }

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <StatGroup columns={4} spacing={16}>
        <Stat bordered icon={<HardDrive className="text-blue-500"/>}>
          <StatLabel >Total Size</StatLabel>
          <StatValue>{formatSize(stats.totalSize)}</StatValue>
        </Stat>
        <Stat bordered icon={<FileImage className="text-emerald-500" />}>
          <StatLabel >Files</StatLabel>
          <StatValue value={stats.totalFiles} />
        </Stat>
        <Stat bordered icon={<FolderOpen className="text-amber-500" />}>
          <StatLabel >Folders</StatLabel>
          <StatValue value={stats.totalFolders} />
        </Stat>
        <Stat bordered icon={<BarChart3 className="text-purple-500" />}>
          <StatLabel >File Types</StatLabel>
          <StatHelpText>
            {stats.fileTypes.length > 0 ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                {stats.fileTypes.map(t => (
                  <span key={t.label} className="text-[10px] font-medium text-foreground/60 bg-muted/50 rounded px-1.5 py-0.5">
                    {t.label} ({t.count})
                  </span>
                ))}
              </div>
            ) : '—'}
          </StatHelpText>
        </Stat>
      </StatGroup>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 m-0">
        <div className="flex items-center ml-auto gap-2">
          <Button
            appearance="ghost"
            size="sm"
            onClick={() => { setNewFolderParent(currentPath); setNewFolderName(''); setShowNewFolder(true) }}
            startIcon={<FolderPlus className="w-4 h-4" />}
          >
            New Folder
          </Button>
          <div className="relative" ref={uploadBtnRef}>
            <Button
              appearance="primary"
              size="sm"
              onClick={() => setShowUploadMenu(!showUploadMenu)}
              startIcon={<Upload className="w-4 h-4" />}
              endIcon={<ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showUploadMenu ? 'rotate-180' : ''}`} />}
            >
              Upload
            </Button>
            {showUploadMenu && (
              <div className="absolute top-full left-0 mt-1.5 -translate-x-5/12 w-52 rounded-xl border border-border/60 bg-background shadow-xl shadow-black/5 z-50 overflow-hidden">
                <button
                  onClick={handleBrowseFiles}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:bg-muted/50 transition-colors text-left"
                >
                  <Monitor className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">Browse Files</span>
                    <p className="text-[11px] text-muted-foreground/50 mt-px">Select files from your device</p>
                  </div>
                </button>
                <div className="h-px bg-border/40 mx-3" />
                <button
                  onClick={() => { setShowUploadMenu(false); setShowUrlUpload(true) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:bg-muted/50 transition-colors text-left"
                >
                  <Globe className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">From URL</span>
                    <p className="text-[11px] text-muted-foreground/50 mt-px">Download from a web address</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload progress */}
      {uploading.length > 0 && (
        <div className="space-y-1.5 rounded-xl border border-border/60 bg-background p-3 shadow-sm">
          {uploading.map((u, i) => (
            <div key={i} className="flex items-center gap-2.5 text-xs">
              <div className={`w-1.5 h-1.5 rounded-full ${
                u.status === 'done' ? 'bg-emerald-500' :
                u.status === 'error' ? 'bg-red-500' :
                'bg-primary animate-pulse'
              }`} />
              <span className="flex-1 truncate font-medium text-foreground/70">{u.name}</span>
              <span className={`font-mono text-[10px] ${
                u.status === 'done' ? 'text-emerald-500' :
                u.status === 'error' ? 'text-red-500' :
                'text-primary/60'
              }`}>
                {u.status === 'done' ? 'Done' : u.status === 'error' ? 'Failed' : 'Uploading...'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-sm flex-wrap">
        <Home className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
        {breadcrumbs.map((crumb, i) => {
          const isLast = i === breadcrumbs.length - 1
          return (
            <span key={crumb.path ?? '__root'} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground/30 shrink-0" />}
              {isLast ? (
                <span className="text-sm font-medium text-foreground/80 px-1.5 py-0.5 rounded-md bg-muted/50">
                  {crumb.label}
                </span>
              ) : (
                <span
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverBreadcrumb(crumb.path) }}
                  onDragLeave={() => setDragOverBreadcrumb(null)}
                  onDrop={async (e) => {
                    e.preventDefault()
                    setDragOverBreadcrumb(null)
                    const raw = e.dataTransfer.getData('text/plain')
                    let paths: string[] = []
                    try { paths = JSON.parse(raw); if (!Array.isArray(paths)) paths = [raw] }
                    catch { paths = [raw] }
                    if (paths.length > 0) {
                      await handleMoveFiles(paths, crumb.path)
                    }
                  }}
                >
                  <button
                    onClick={() => handleNavigate(crumb.path)}
                    className={`text-sm transition-all duration-200 px-1.5 py-0.5 rounded-md ${
                      dragOverBreadcrumb === crumb.path
                        ? 'text-primary font-medium bg-primary/10 border-primary border-dashed border'
                        : 'text-muted-foreground/50 hover:text-foreground/80 hover:bg-muted/50'
                    }`}
                    style={dragOverBreadcrumb === crumb.path ? { animation: 'drop-target-pulse 1.2s ease-in-out infinite' } : undefined}
                  >
                    {crumb.label}
                  </button>
                </span>
              )}
            </span>
          )
        })}
      </div>

      {/* Grid */}
      <FileGrid
        folders={folders}
        files={files}
        loading={loading}
        selectedIds={selectedIds}
        onToggleSelect={(path) => setSelectedIds((prev) => {
          const next = new Set(prev)
          if (next.has(path)) next.delete(path)
          else next.add(path)
          return next
        })}
        onSelectAll={() => setSelectedIds(new Set(files.map(f => f.path)))}
        onDeselectAll={() => setSelectedIds(new Set())}
        onDelete={(targets) => { setDeleteFilesTargets(targets); setShowDeleteFiles(true) }}
        onViewDetail={(file) => setDetailFile(file)}
        onNavigate={(path) => handleNavigate(path)}
        onNewSubfolder={(path) => { setNewFolderParent(path); setNewFolderName(''); setShowNewFolder(true) }}
        onRenameFolder={(folder) => { setRenameTarget(folder); setRenameName(folder.name); setShowRename(true) }}
        onDeleteFolder={(folder) => { setDeleteFolderTarget(folder); setShowDeleteFolder(true) }}
        onMoveFiles={handleMoveFiles}
      />

      {/* Storage Policy Banner */}
      <div className="flex items-start gap-3 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 border border-border/50 p-4 shadow-sm">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 text-primary/70" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-1.5">Storage Policy</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground/70">
            <span>
              Max file size: <strong className="text-foreground/80">{STORAGE_POLICY.maxSizeLabel}</strong>
            </span>
            <span>
              Allowed types: <strong className="text-foreground/80">{STORAGE_POLICY.allowedTypes.join(', ')}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal open={showNewFolder} onClose={() => setShowNewFolder(false)} size="xs" backdrop={"static"} draggable>
        <Modal.Header>
          <Modal.Title>
            <HStack><FaFolderPlus color={"purple"}/> New Folder</HStack>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Input placeholder="Folder name" value={newFolderName} onChange={setNewFolderName} onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder() }} autoFocus />
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setShowNewFolder(false)} appearance="subtle">Cancel</Button>
          <Button onClick={handleCreateFolder} color={"violet"} appearance="primary" disabled={!newFolderName.trim()}>Create</Button>
        </Modal.Footer>
      </Modal>

      <Modal open={showUrlUpload} onClose={() => { if (!urlLoading) { setShowUrlUpload(false); setUrlInput(''); setUrlError('') } }} size="sm" backdrop={"static"}>
        <Modal.Header><Modal.Title>Upload from URL</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Enter a direct URL to an image, document, or other supported file type.
            </p>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Link className="w-4 h-4 text-muted-foreground/40" />
              </div>
              <Input
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={(v) => { setUrlInput(v); setUrlError('') }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !urlLoading) handleUrlUpload() }}
                style={{ paddingLeft: '2.25rem' }}
                autoFocus
              />
            </div>
            {urlError && (
              <p className="text-xs text-red-500 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                {urlError}
              </p>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => { setShowUrlUpload(false); setUrlInput(''); setUrlError('') }} appearance="subtle" disabled={urlLoading}>Cancel</Button>
          <Button onClick={handleUrlUpload} appearance="primary" disabled={!urlInput.trim() || urlLoading} loading={urlLoading}>
            {urlLoading ? 'Downloading...' : 'Upload'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal open={showRename} onClose={() => setShowRename(false)} size="xs" backdrop={"static"} draggable>
        <Modal.Header><Modal.Title>Rename Folder</Modal.Title></Modal.Header>
        <Modal.Body>
          <Input placeholder="Folder name" value={renameName} onChange={setRenameName} onKeyDown={(e) => { if (e.key === 'Enter') handleRenameFolder() }} autoFocus />
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setShowRename(false)} appearance="subtle">Cancel</Button>
          <Button onClick={handleRenameFolder} appearance="primary" disabled={!renameName.trim()}>Rename</Button>
        </Modal.Footer>
      </Modal>

      <Modal open={showDeleteFolder} onClose={() => setShowDeleteFolder(false)} size="xs" backdrop={"static"} draggable>
        <Modal.Header><Modal.Title>Delete Folder</Modal.Title></Modal.Header>
        <Modal.Body>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deleteFolderTarget?.name}</strong>? This will also delete all files inside it.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setShowDeleteFolder(false)} appearance="subtle">Cancel</Button>
          <Button onClick={handleDeleteFolder} color="red" appearance="primary">Delete</Button>
        </Modal.Footer>
      </Modal>

      <Modal open={showDeleteFiles} onClose={() => setShowDeleteFiles(false)} size="xs" backdrop={"static"} draggable>
        <Modal.Header><Modal.Title>Delete Files</Modal.Title></Modal.Header>
        <Modal.Body>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete {deleteFilesTargets.length} file(s)?
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setShowDeleteFiles(false)} appearance="subtle">Cancel</Button>
          <Button onClick={() => { handleDeleteFiles(deleteFilesTargets) }} color="red" appearance="primary">Delete</Button>
        </Modal.Footer>
      </Modal>

      {/* Detail Modal */}
      {detailFile && (
        <Modal open={!!detailFile} onClose={() => setDetailFile(null)} size="md" backdrop={"static"} draggable>
          <Modal.Header><Modal.Title>{detailFile.name}</Modal.Title></Modal.Header>
          <Modal.Body>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-64 shrink-0">
                {detailFile.metadata?.mimetype?.startsWith('image/') ? (
                  <div className="rounded-xl border border-border/60 overflow-hidden bg-gradient-to-br from-muted/50 to-muted/30 shadow-sm">
                    <img src={detailFile.url} alt={detailFile.name} className="w-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-square rounded-xl border border-border/60 bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center shadow-sm">
                    <span className="text-4xl font-bold tracking-tight text-muted-foreground/30">
                      {detailFile.name.split('.').pop()?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-4 text-sm">
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">Name</label>
                  <p className="text-sm font-medium text-foreground/80 mt-0.5">{detailFile.name}</p>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">Storage Path</label>
                  <p className="font-mono text-xs text-foreground/60 mt-0.5 bg-muted/50 rounded-md px-2 py-1.5 break-all">{detailFile.path}</p>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">URL</label>
                  <div className="flex items-center gap-1 mt-0.5 bg-muted/50 rounded-md px-2 py-1.5">
                    <p className="font-mono text-xs text-foreground/60 truncate flex-1 min-w-0">{detailFile.url}</p>
                    <button
                      onClick={() => navigator.clipboard.writeText(detailFile.url)}
                      className="shrink-0 p-1 rounded-md hover:bg-background transition-colors text-muted-foreground/50 hover:text-foreground/80"
                      title="Copy URL"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <a href={detailFile.url} target="_blank" rel="noreferrer" className="shrink-0 p-1 rounded-md hover:bg-background transition-colors text-muted-foreground/50 hover:text-foreground/80" title="Open in new tab">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">Type</label>
                    <p className="text-sm text-foreground/70 mt-0.5">{detailFile.metadata?.mimetype || '—'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">Size</label>
                    <p className="text-sm text-foreground/70 mt-0.5">{detailFile.metadata ? formatSize(detailFile.metadata.size) : '—'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">Created</label>
                    <p className="text-sm text-foreground/70 mt-0.5">{detailFile.created_at ? new Date(detailFile.created_at).toLocaleString() : '—'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">Updated</label>
                    <p className="text-sm text-foreground/70 mt-0.5">{detailFile.updated_at ? new Date(detailFile.updated_at).toLocaleString() : '—'}</p>
                  </div>
                </div>
                {detailFile.id && (
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">File ID</label>
                    <p className="font-mono text-xs text-foreground/60 mt-0.5 bg-muted/50 rounded-md px-2 py-1.5">{detailFile.id}</p>
                  </div>
                )}
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={() => { setDeleteFilesTargets([detailFile]); setShowDeleteFiles(true); setDetailFile(null) }} color="red" appearance="primary" startIcon={<Trash2 className="w-4 h-4" />}>
              Delete
            </Button>
            <Button onClick={() => setDetailFile(null)} appearance="primary">Close</Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  )
}
