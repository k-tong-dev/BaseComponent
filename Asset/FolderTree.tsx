'use client'

import { useState, useEffect, useCallback } from 'react'
import type { StorageFolder } from './types'
import {MdDelete} from "react-icons/md";
import {CiEdit} from "react-icons/ci";
import {IoMdAdd} from "react-icons/io";
import {FaFolder} from "react-icons/fa";

interface FolderTreeProps {
  selectedPath: string | null
  onSelect: (path: string | null) => void
  onNewFolder: (parentPath: string | null) => void
  onRename: (folder: StorageFolder) => void
  onDelete: (folder: StorageFolder) => void
}

function FolderNode({
  name,
  path,
  depth,
  selectedPath,
  onSelect,
  onNewFolder,
  onRename,
  onDelete,
}: {
  name: string
  path: string
  depth: number
  selectedPath: string | null
  onSelect: (path: string | null) => void
  onNewFolder: (parentPath: string | null) => void
  onRename: (folder: StorageFolder) => void
  onDelete: (folder: StorageFolder) => void
}) {
  const [children, setChildren] = useState<{ name: string; path: string }[]>([])
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const isSelected = selectedPath === path

  const loadChildren = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/dashboard/storage/folders?path=${encodeURIComponent(path)}`)
      if (res.ok) {
        const folders = await res.json()
        setChildren(folders.map((f: StorageFolder) => ({ name: f.name, path: f.path })))
      }
    } catch (e) {
      console.error('Failed to list subfolders', e)
    }
    setLoading(false)
  }, [path])

  useEffect(() => {
    if (expanded) loadChildren()
  }, [expanded, loadChildren])

  const hasChildren = children.length > 0 || loading

  return (
    <div>
      <div
        className={`group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors ${
          isSelected ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50'
        }`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
          className="w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground"
        >
          {loading ? (
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
        <span
          onClick={() => onSelect(path)}
          className="flex-1 flex items-center gap-2 truncate"
        >
          <FaFolder className={"text-orange-400"}/>
          <span className="truncate">{name}</span>
        </span>
        <div className="hidden group-hover:flex items-center gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onNewFolder(path) }}
            className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground"
            title="New subfolder"
          >
            <IoMdAdd />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRename({ name, path, id: null }) }}
            className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground"
            title="Rename"
          >
            <CiEdit />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete({ name, path, id: null }) }}
            className="p-1 rounded hover:bg-red-100 text-muted-foreground hover:text-red-600"
            title="Delete"
          >
            <MdDelete />
          </button>
        </div>
      </div>
      {expanded && children.map((child) => (
        <FolderNode
          key={child.path}
          name={child.name}
          path={child.path}
          depth={depth + 1}
          selectedPath={selectedPath}
          onSelect={onSelect}
          onNewFolder={onNewFolder}
          onRename={onRename}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

export function FolderTree({
  selectedPath,
  onSelect,
  onNewFolder,
  onRename,
  onDelete,
}: FolderTreeProps) {
  const [rootFolders, setRootFolders] = useState<StorageFolder[]>([])
  const [loading, setLoading] = useState(true)

  const loadRootFolders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dashboard/storage/folders')
      if (res.ok) setRootFolders(await res.json())
    } catch (e) {
      console.error('Failed to load folders', e)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadRootFolders() }, [loadRootFolders])

  return (
    <div className="space-y-0.5">
      <div
        onClick={() => onSelect(null)}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors ${
          selectedPath === null ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50'
        }`}
      >
        <FaFolder className={"text-blue-400"}/>
        <span>All Assets</span>
      </div>
      {loading ? (
        <div className="px-2 py-1 text-xs text-muted-foreground">Loading...</div>
      ) : (
        rootFolders.map((folder) => (
          <FolderNode
            key={folder.path}
            name={folder.name}
            path={folder.path}
            depth={0}
            selectedPath={selectedPath}
            onSelect={onSelect}
            onNewFolder={onNewFolder}
            onRename={onRename}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  )
}
