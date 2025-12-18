'use client'

import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table'
import { Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { hoverEffects } from '@/lib/hover-effects'

export interface DataTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData, any>[]
  searchPlaceholder?: string
  pageSize?: number
  enableColumnFilters?: boolean
  enableSorting?: boolean
  enableGlobalFilter?: boolean
  onRowClick?: (row: TData) => void
  className?: string
}

// AdvancedDataTable은 DataTable의 alias
export type AdvancedDataTableProps<TData> = DataTableProps<TData>

export function DataTable<TData>({
  data,
  columns,
  searchPlaceholder = '검색...',
  pageSize = 20,
  enableColumnFilters = true,
  enableSorting = true,
  enableGlobalFilter = true,
  onRowClick,
  className,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(enableSorting && { 
      getSortedRowModel: getSortedRowModel(),
      onSortingChange: setSorting,
    }),
    ...(enableColumnFilters && { 
      getFilteredRowModel: getFilteredRowModel(),
      onColumnFiltersChange: setColumnFilters,
    }),
    getPaginationRowModel: getPaginationRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    state: { 
      sorting, 
      columnFilters, 
      globalFilter,
    },
    initialState: { 
      pagination: { pageSize } 
    },
  })

  return (
    <div className={cn('space-y-4', className)}>
      {/* 전역 검색 */}
      {enableGlobalFilter && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              placeholder={searchPlaceholder}
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              className={cn(
                'pl-10 pr-4 py-2 w-full border border-slate-200 dark:border-slate-700 rounded-lg',
                'bg-white dark:bg-slate-800',
                hoverEffects.input
              )}
            />
          </div>
          <span className="text-sm text-slate-500">
            총 {table.getFilteredRowModel().rows.length}건
          </span>
        </div>
      )}

      {/* 테이블 */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={cn(
                      'px-4 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-300',
                      header.column.getCanSort() && 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 select-none'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className="text-slate-400">
                          {header.column.getIsSorted() === 'asc' ? (
                            <ChevronUp className="w-4 h-4 text-indigo-500" />
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <ChevronDown className="w-4 h-4 text-indigo-500" />
                          ) : (
                            <ChevronsUpDown className="w-4 h-4" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {table.getRowModel().rows.map(row => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row.original)}
                className={cn(
                  hoverEffects.tableRow,
                  onRowClick && 'cursor-pointer'
                )}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-3 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <select
            value={table.getState().pagination.pageSize}
            onChange={e => table.setPageSize(Number(e.target.value))}
            className="px-2 py-1 border border-slate-200 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-800"
          >
            {[10, 20, 50, 100].map(size => (
              <option key={size} value={size}>{size}개씩 보기</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm transition-colors"
          >
            이전
          </button>
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm transition-colors"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  )
}

// 컬럼 정의 헬퍼
export function createColumn<T>(
  accessorKey: keyof T,
  header: string,
  options?: {
    cell?: (value: any, row: T) => React.ReactNode
    enableSorting?: boolean
    size?: number
  }
): ColumnDef<T, any> {
  return {
    accessorKey: accessorKey as string,
    header,
    cell: options?.cell 
      ? ({ getValue, row }) => options.cell!(getValue(), row.original)
      : ({ getValue }) => getValue(),
    enableSorting: options?.enableSorting ?? true,
    size: options?.size,
  }
}

// AdvancedDataTable은 DataTable의 alias (Phase 2 호환)
export const AdvancedDataTable = DataTable
