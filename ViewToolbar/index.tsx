'use client'

import React from 'react'
import { Bookmark, RefreshCw } from 'lucide-react'
import { IoMdTrash } from 'react-icons/io'
import { cn } from '@/lib/utils'
import { useTranslate } from '../i18n'
import { Button } from '@/components/ui/button'
import { Dropdown } from '@/components/ui/dropdown'
import { Search as SearchComponent, type SearchValue } from '../Search'
import { Filter, type FilterValue } from './Filter'
import { GroupBy } from './GroupBy'
import { SavePresetModal } from './SavePresetModal'
import type { UseViewToolbarReturn } from '@/components/Base/ViewToolbar/hooks/useViewToolbar'
import {Whisper, Tooltip} from "rsuite";

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
  /**
   * Called when the user asks for fresh data. Pass the page-level refresh
   * (e.g. `useResource().refresh`) — it re-fetches the record set without
   * reloading the page. The toolbar renders the button only when provided.
   */
  onRefresh?: () => void | Promise<void>
  /** True while a refresh is in flight — spins the button icon. */
  refreshing?: boolean
  children?: React.ReactNode
}

export function ViewToolbar({ toolbar, columns = [], currentViewType = 'list', onRefresh, refreshing = false, children }: ViewToolbarProps) {
  const translate = useTranslate()
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
        {onRefresh && (
          <Whisper placement="top"
                     controlId="control-id-hover"
                     trigger="hover"
                     speaker={<Tooltip>{translate('Refresh data')}</Tooltip>}>
            <Button
                appearance="subtle"
                aria-label={translate('Refresh data')}
                onClick={() => { void onRefresh() }}
                disabled={refreshing}
                className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-sm px-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:cursor-pointer disabled:opacity-60"
            >
              <RefreshCw size={16} className={cn('shrink-0', refreshing && 'animate-spin')} />
              {/*<span>{translate('Refresh')}</span>*/}
            </Button>
          </Whisper>
        )}
        <Dropdown placement="bottomEnd" renderToggle={(props: any, ref: any) => (
          <button
            ref={ref}
            {...props}
            title="View presets"
            className="inline-flex h-9 items-center justify-center rounded-sm px-2 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/60"
          >
            <Bookmark size={16} color="orange" />
          </button>
        )}
        >
          <Dropdown.Item
            onSelect={() => {
              setPresetName('')
              setShowSavePreset(true)
            }}
            icon={<Bookmark className="w-3.5 h-3.5 pointer-events-none" color="orange" />}
            className="text-xs font-medium"
          >
            Save current view
          </Dropdown.Item>
          {presets.map((preset) => (
            <Dropdown.Item
              key={preset.id}
              onSelect={() => handleLoadPreset(preset)}
              className="text-xs"
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="truncate">{preset.name}</span>
                <Button
                  size="sm"
                  color="red"
                  appearance="link"
                  onClick={(e: any) => { e.stopPropagation(); deletePreset(preset.id) }}
                  className="shrink-0 px-1 text-muted-foreground/60 hover:text-red-500"
                  title="Delete preset"
                >
                  <IoMdTrash />
                </Button>
              </span>
            </Dropdown.Item>
          ))}
          {presets.length === 0 && (
            <Dropdown.Item disabled className="justify-center text-xs text-muted-foreground">
              No saved presets
            </Dropdown.Item>
          )}
        </Dropdown>
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
