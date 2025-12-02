'use client'

import React, { useState } from 'react'
import { Spinner } from './Spinner'
import { EmptyState } from './EmptyState'

export interface Column<T> {
  key: string
  header: string
  width?: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  render?: (value: any, row: T, index: number) => React.ReactNode
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  emptyIcon?: React.ReactNode
  sortable?: boolean
  selectable?: boolean
  selectedRows?: string[]
  onSelectRow?: (id: string) => void
  onSelectAll?: (selected: boolean) => void
  rowKey?: keyof T | ((row: T) => string)
  onRowClick?: (row: T) => void
  stickyHeader?: boolean
  compact?: boolean
  striped?: boolean
  className?: string
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyMessage = '데이터가 없습니다',
  emptyIcon,
  sortable = false,
  selectable = false,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  rowKey = 'id',
  onRowClick,
  stickyHeader = false,
  compact = false,
  striped = false,
  className = '',
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)

  const getRowKey = (row: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(row)
    }
    return String(row[rowKey] ?? index)
  }

  const handleSort = (key: string) => {
    if (!sortable) return

    setSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.direction === 'asc'
          ? { key, direction: 'desc' }
          : null
      }
      return { key, direction: 'asc' }
    })
  }

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]

      if (aVal === bVal) return 0
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      const comparison = aVal < bVal ? -1 : 1
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
  }, [data, sortConfig])

  const allSelected = data.length > 0 && selectedRows.length === data.length

  const cellPadding = compact ? 'px-3 py-2' : 'px-4 py-3'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyMessage}
        size="sm"
      />
    )
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">
        <thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
          <tr className="bg-slate-50 border-b border-slate-200">
            {selectable && (
              <th className={`${cellPadding} w-10`}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#F78C3A] focus:ring-orange-200"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={`
                  ${cellPadding} font-semibold text-slate-600 uppercase tracking-wider text-xs
                  ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}
                  ${(sortable && col.sortable !== false) ? 'cursor-pointer hover:bg-slate-100 select-none' : ''}
                `}
                style={{ width: col.width }}
                onClick={() => col.sortable !== false && handleSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  <span>{col.header}</span>
                  {sortable && col.sortable !== false && (
                    <span className="text-slate-400">
                      {sortConfig?.key === col.key ? (
                        sortConfig.direction === 'asc' ? '↑' : '↓'
                      ) : (
                        '↕'
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, rowIndex) => {
            const key = getRowKey(row, rowIndex)
            const isSelected = selectedRows.includes(key)

            return (
              <tr
                key={key}
                onClick={() => onRowClick?.(row)}
                className={`
                  border-b border-slate-100 transition-colors
                  ${onRowClick ? 'cursor-pointer' : ''}
                  ${isSelected ? 'bg-orange-50' : striped && rowIndex % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}
                  hover:bg-slate-50
                `}
              >
                {selectable && (
                  <td className={cellPadding}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onSelectRow?.(key)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-slate-300 text-[#F78C3A] focus:ring-orange-200"
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`
                      ${cellPadding} text-slate-700
                      ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}
                    `}
                  >
                    {col.render
                      ? col.render(row[col.key], row, rowIndex)
                      : row[col.key]}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable
