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
  // 모바일 카드뷰 모드
  viewMode?: 'table' | 'card'
  cardRender?: (row: T, index: number) => React.ReactNode
  mobileColumns?: string[] // 모바일에서 표시할 컬럼 키
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
  viewMode = 'table',
  cardRender,
  mobileColumns,
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

  // 카드뷰 모드 렌더링
  if (viewMode === 'card') {
    return (
      <div className={`space-y-3 ${className}`}>
        {sortedData.map((row, index) => {
          const key = getRowKey(row, index)
          const isSelected = selectedRows.includes(key)

          if (cardRender) {
            return (
              <div
                key={key}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'cursor-pointer' : ''}
              >
                {cardRender(row, index)}
              </div>
            )
          }

          // 기본 카드 레이아웃
          return (
            <div
              key={key}
              onClick={() => onRowClick?.(row)}
              className={`
                p-4 bg-white dark:bg-slate-900 rounded-xl border transition-all
                ${isSelected ? 'border-[#F78C3A] bg-orange-50 dark:bg-orange-900/20' : 'border-slate-200 dark:border-slate-700'}
                ${onRowClick ? 'cursor-pointer hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600' : ''}
              `}
            >
              {selectable && (
                <div className="flex justify-end mb-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelectRow?.(key)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[#F78C3A] focus:ring-orange-200"
                  />
                </div>
              )}
              <div className="space-y-2">
                {(mobileColumns ? columns.filter(c => mobileColumns.includes(c.key)) : columns).map((col) => (
                  <div key={col.key} className="flex justify-between items-start gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">{col.header}</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100 text-right">
                      {col.render ? col.render(row[col.key], row, index) : row[col.key]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">
        <thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
          <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            {selectable && (
              <th className={`${cellPadding} w-10`}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[#F78C3A] focus:ring-orange-200 dark:focus:ring-orange-900/30 dark:bg-slate-700"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={`
                  ${cellPadding} font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-xs
                  ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}
                  ${(sortable && col.sortable !== false) ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 select-none' : ''}
                `}
                style={{ width: col.width }}
                onClick={() => col.sortable !== false && handleSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  <span>{col.header}</span>
                  {sortable && col.sortable !== false && (
                    <span className="text-slate-400 dark:text-slate-500">
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
                  border-b border-slate-100 dark:border-slate-800 transition-colors
                  ${onRowClick ? 'cursor-pointer' : ''}
                  ${isSelected ? 'bg-orange-50 dark:bg-orange-900/20' : striped && rowIndex % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-800/50' : 'bg-white dark:bg-slate-900'}
                  hover:bg-slate-50 dark:hover:bg-slate-800
                `}
              >
                {selectable && (
                  <td className={cellPadding}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onSelectRow?.(key)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[#F78C3A] focus:ring-orange-200 dark:focus:ring-orange-900/30 dark:bg-slate-700"
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`
                      ${cellPadding} text-slate-700 dark:text-slate-300
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
