'use client'

import React from 'react'
import { Table } from 'rsuite'
import { GanttViewProps } from './types'

const { Column, HeaderCell, Cell } = Table

export function GanttView({ config, loading }: GanttViewProps) {
  const {
    data,
    columns,
    rowKey = 'id',
    height = 500,
    defaultExpandAllRows = true,
    onRowClick,
    onEdit,
    onDelete,
  } = config

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table
        isTree
        defaultExpandAllRows={defaultExpandAllRows}
        bordered
        cellBordered
        rowKey={rowKey}
        height={height}
        data={data}
        shouldUpdateScroll={false}
        onRowClick={(rowData) => {
          if (onRowClick) onRowClick(rowData)
        }}
      >
        {columns.map((column) => (
          <Column
            key={column.key}
            width={column.width}
            flexGrow={column.flexGrow}
            treeCol={column.treeCol}
          >
            <HeaderCell>{column.title}</HeaderCell>
            <Cell dataKey={column.key}>
              {(rowData: any) => {
                if (column.render) {
                  return column.render(rowData)
                }
                return rowData[column.key]
              }}
            </Cell>
          </Column>
        ))}
      </Table>
    </div>
  )
}

export * from './types'
