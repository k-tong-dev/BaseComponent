'use client'

import { useState, useEffect } from 'react'
import { Upload, X, File as FileIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { AssetPickerModal } from '@/components/Base/Asset/AssetPickerModal'
import type { StorageFile } from '@/components/Base/Asset/types'

export type UploadedFile = StorageFile & { file?: File }

export interface FileFieldProps {
  files: UploadedFile[]
  maxFiles?: number
  uploadText?: string
  label?: string
  readonly?: boolean
  error?: string | null
  /** Accepted MIME types for the device picker (default: images). */
  accept?: string
  /** Folder inside the bucket that device uploads are stored under. */
  uploadPath?: string
  onRemove: (index: number) => void
  onAssetSelected?: (asset: StorageFile) => void
}

const isImageUrl = (url: unknown): url is string =>
  typeof url === 'string' &&
  (/\.(jpg|jpeg|png|webp|avif|gif|svg|bmp)(\?.*)?$/i.test(url) || url.startsWith('blob:') || url.startsWith('data:image/'))

/** A file is previewable as an image if its URL looks like one or its MIME says so. */
const isImageFile = (file: UploadedFile): boolean =>
  isImageUrl(file?.url) || Boolean(file?.metadata?.mimetype?.startsWith('image/'))

const animationsStyle = `
@keyframes fileEnter {
  from { opacity: 0; transform: scale(0.92) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes fileExit {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0.92); }
}
`

function SlideCarousel({
  files,
  isSingle,
  enteringIndex,
  readonly,
  onRemove,
}: {
  files: UploadedFile[]
  isSingle: boolean
  enteringIndex: number | null
  readonly?: boolean
  onRemove: (index: number) => void
}) {
  const [slide, setSlide] = useState(0)
  const total = files.length

  useEffect(() => {
    if (slide >= total) setSlide(Math.max(0, total - 1))
  }, [total, slide])

  const prev = () => setSlide(Math.max(0, slide - 1))
  const next = () => setSlide(Math.min(total - 1, slide + 1))

  if (total === 0 || !files[slide]) return null

  const file = files[slide]

  return (
    <div className="relative w-full">
      <div className="relative overflow-hidden rounded-xl border border-border/60 bg-background">
        <FilePreview
          file={file}
          index={slide}
          isSingle={isSingle}
          entering={enteringIndex === slide}
          readonly={readonly}
          onRemove={onRemove}
        />
        {total > 1 && (
          <>
            {slide > 0 && (
              <button
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border/60 text-muted-foreground hover:text-foreground hover:bg-background/90 transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {slide < total - 1 && (
              <button
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border/60 text-muted-foreground hover:text-foreground hover:bg-background/90 transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>
      {total > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {files.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-200 ${i === slide ? 'w-5 bg-violet-500' : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FileField({
  files,
  maxFiles,
  uploadText,
  label,
  readonly,
  error,
  accept,
  uploadPath,
  onRemove,
  onAssetSelected,
}: FileFieldProps) {
  const [enteringIndex, setEnteringIndex] = useState<number | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  const isSingle = maxFiles === 1
  const displayFiles = files.filter(f => f.url)
  const fileCount = displayFiles.length
  const atMax = maxFiles ? fileCount >= maxFiles : false
  const canPick = !atMax || isSingle

  useEffect(() => {
    if (displayFiles.length > 0) {
      const lastIdx = displayFiles.length - 1
      setEnteringIndex(lastIdx)
      const timer = setTimeout(() => setEnteringIndex(null), 300)
      return () => clearTimeout(timer)
    }
  }, [displayFiles.length])

  return (
    <>
      <style>{animationsStyle}</style>
      <div className="space-y-2">
        {!readonly && canPick && (
          <button
            onClick={() => setPickerOpen(true)}
            type="button"
            className="group flex w-full items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-3 py-2.5 text-left transition-all duration-300 hover:border-primary/50 hover:bg-muted/40"
          >
            <span className="pointer-events-none flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground transition group-hover:text-primary">
              <Upload className="h-4 w-4" />
            </span>
            <span className="pointer-events-none min-w-0">
              <span className="block truncate text-xs font-medium text-foreground">
                {uploadText || (isSingle && fileCount > 0 ? 'Click to replace…' : `Click to upload${label ? ` ${label.toLowerCase()}` : ''}`)}
              </span>
              <span className="block text-[10px] text-muted-foreground">
                {maxFiles ? (isSingle ? 'Single image' : `Up to ${maxFiles} files`) : 'JPG, PNG, WEBP'}
              </span>
            </span>
          </button>
        )}

        {error && <p className="text-red-500 text-xs">{error}</p>}

        {displayFiles.length > 0 && (
          isSingle && displayFiles[0] ? (
            <div className="w-full max-w-[220px]">
              <FilePreview
                file={displayFiles[0]}
                index={0}
                isSingle
                entering={enteringIndex === 0}
                readonly={readonly}
                onRemove={onRemove}
              />
            </div>
          ) : (
            <div className="group">
              <SlideCarousel
                files={displayFiles}
                isSingle={false}
                enteringIndex={enteringIndex}
                readonly={readonly}
                onRemove={onRemove}
              />
            </div>
          )
        )}

        {displayFiles.length === 0 && !error && (
          <p className="text-muted-foreground text-xs">No files uploaded yet</p>
        )}

        {maxFiles && fileCount > 0 && (
          <p className="text-[11px] text-muted-foreground/60">{fileCount} / {maxFiles} file{maxFiles > 1 ? 's' : ''}</p>
        )}
      </div>

      <AssetPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        maxFiles={maxFiles}
        accept={accept}
        uploadPath={uploadPath}
        title={label ? `Select ${label}` : undefined}
        onSelect={(asset) => {
          onAssetSelected?.(asset)
        }}
      />
    </>
  )
}

function FilePreview({
  file,
  index,
  isSingle,
  entering,
  readonly,
  onRemove,
}: {
  file: UploadedFile
  index: number
  isSingle: boolean
  entering: boolean
  readonly?: boolean
  onRemove: (index: number) => void
}) {
  const [loaded, setLoaded] = useState(false)
  const [removing, setRemoving] = useState(false)

  const handleRemove = () => {
    setRemoving(true)
    setTimeout(() => onRemove(index), 200)
  }

  return (
    <div
      className={`
        group relative overflow-hidden rounded-xl border border-border/60 bg-background
        transition-all duration-200
        ${entering ? 'animate-[fileEnter_0.25s_ease-out]' : ''}
        ${removing ? 'animate-[fileExit_0.2s_ease-in_forwards]' : ''}
        ${isSingle ? 'w-full' : 'w-full aspect-[4/3]'}
      `}
    >
      {isImageFile(file) ? (
        <div className={`relative w-full ${isSingle ? 'h-32 sm:h-40' : 'w-full h-full'}`}>
          <img
            src={file.url}
            alt=""
            className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setLoaded(true)}
          />
          {!loaded && (
            <div className="absolute inset-0 bg-muted/30 animate-pulse flex items-center justify-center">
              <FileIcon className="w-6 h-6 text-muted-foreground/40" />
            </div>
          )}
        </div>
      ) : (
        <div className={`flex items-center justify-center bg-muted/20 ${isSingle ? 'h-32 sm:h-40' : 'w-full h-full'}`}>
          <FileIcon className="w-10 h-10 text-muted-foreground/40" />
        </div>
      )}

      {!readonly && (
        <button
          onClick={handleRemove}
          className={`
            absolute top-2 right-2 p-1.5 rounded-full
            bg-background/80 backdrop-blur-sm border border-border/60
            text-muted-foreground hover:text-destructive hover:bg-destructive/10
            opacity-0 group-hover:opacity-100 transition-opacity duration-150
            ${isSingle ? '' : 'md:opacity-0 opacity-100'}
          `}
          title="Remove file"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {isSingle && file.file && (
        <div className="px-3 py-2 text-xs text-muted-foreground truncate border-t border-border/40 bg-muted/10">
          {file.file.name}
        </div>
      )}
    </div>
  )
}
