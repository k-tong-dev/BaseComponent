'use client'

import React from 'react'
import { Bookmark } from 'lucide-react'
import { IoMdTrash } from 'react-icons/io'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Search as SearchComponent, type SearchValue } from '../Search'
import { Filter, type FilterValue } from './Filter'
import { GroupBy } from './GroupBy'
import { SavePresetModal } from './SavePresetModal'
import type { UseViewToolbarReturn } from '@/components/Base/ViewToolbar/hooks/useViewToolbar'

interface ColumnField {
  key: string
  title: string
  type?: string
  filterOptions?: { value: string; label: string }[]
  filterable?: boolean
  groupable?: boolean
}

interface ViewToolbarProps {
  toolbar: UseViewToolbarReturn
  columns?: ColumnField[]
  currentViewType?: string
  children?: React.ReactNode
}

export function ViewToolbar({ toolbar, columns = [], currentViewType = 'list', children }: ViewToolbarProps) {
  const {
    searchValues,
    setSearchValues,
    filterValues,
    setFilterValues,
    groupByField,
    setGroupByField,
    showSavePreset,
    setShowSavePreset,
    presetName,
    setPresetName,
    presets,
    deletePreset,
    handleSavePreset,
    handleLoadPreset,
  } = toolbar

  const searchFields = columns.map(col => ({
    key: col.key,
    label: col.title,
    type: 'text' as const,
  }))

  const filterFields: any = columns
    .filter(col => col.filterable !== false)
    .map(col => ({
      key: col.key,
      label: col.title,
      type: col.type || 'text' || 'string',
      options: col.filterOptions,
    }))

  const groupByFields = columns
    .filter(col => col.groupable !== false)
    .map(col => ({
      key: col.key,
      label: col.title,
    }))

  return (
    <>
      <div className="flex items-center gap-2">
        <SearchComponent
          fields={searchFields}
          onSearchChange={setSearchValues}
          placeholder="Search..."
          width={400}
        />
        <Filter
          fields={filterFields}
          value={filterValues}
          onChange={setFilterValues}
        />
        <GroupBy
          fields={groupByFields}
          value={groupByField}
          onChange={setGroupByField}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="md"
              style={{
                backgroundColor: 'transparent',
                borderWidth: "0.5px",
                boxShadow: 'none',
              }}
              className={"inline-flex items-center justify-center " +
                  "rounded-sm " +
                  "text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"}
              title="View presets"
            >
              <Bookmark size={16} color="orange" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => {
                setPresetName('')
                setShowSavePreset(true)
              }}
              className="text-xs cursor-pointer font-medium hover:bg-muted/70 hover:text-foreground focus:bg-muted/70 focus:text-foreground"
            >
              <Bookmark className="w-3.5 h-3.5" color="orange" />
              Save current view
            </DropdownMenuItem>
            {presets.length > 0 && <div className="h-px bg-border/40 mx-2 my-1" />}
            {presets.map((preset) => (
              <div key={preset.id} className="flex items-center group">
                <DropdownMenuItem
                  onClick={() => handleLoadPreset(preset)}
                  className="text-xs cursor-pointer flex-1 hover:bg-muted/70 hover:text-foreground focus:bg-muted/70 focus:text-foreground"
                >
                  {preset.name}
                </DropdownMenuItem>
                <Button
                  size="sm"
                  color="red"
                  appearance="link"
                  onClick={() => deletePreset(preset.id)}
                  className="shrink-0 px-2 py-1 text-muted-foreground/50 hover:text-red-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete preset"
                >
                  <IoMdTrash />
                </Button>
              </div>
            ))}
            {presets.length === 0 && (
              <p className="px-2 py-2 text-xs text-muted-foreground text-center">No saved presets</p>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        {children}
      </div>

      <SavePresetModal
        open={showSavePreset}
        presetName={presetName}
        onPresetNameChange={setPresetName}
        onSave={() => handleSavePreset(currentViewType)}
        onClose={() => setShowSavePreset(false)}
      />
    </>
  )
}
