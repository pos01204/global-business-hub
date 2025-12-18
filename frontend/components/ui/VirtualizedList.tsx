'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface VirtualizedListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  estimateSize?: number
  overscan?: number
  className?: string
  containerClassName?: string
  onEndReached?: () => void
  endReachedThreshold?: number
  gap?: number
}

export function VirtualizedList<T>({
  items,
  renderItem,
  estimateSize = 60,
  overscan = 5,
  className = 'h-[600px]',
  containerClassName,
  onEndReached,
  endReachedThreshold = 0.8,
  gap = 0,
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)
  const endReachedRef = useRef(false)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    gap,
  })

  const handleScroll = useCallback(() => {
    if (!onEndReached || !parentRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = parentRef.current
    const scrollRatio = (scrollTop + clientHeight) / scrollHeight

    if (scrollRatio > endReachedThreshold && !endReachedRef.current) {
      endReachedRef.current = true
      onEndReached()
    } else if (scrollRatio < endReachedThreshold) {
      endReachedRef.current = false
    }
  }, [onEndReached, endReachedThreshold])

  return (
    <div
      ref={parentRef}
      className={cn('overflow-auto', className)}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
        className={containerClassName}
      >
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {renderItem(items[virtualRow.index], virtualRow.index)}
          </div>
        ))}
      </div>
    </div>
  )
}

// 그리드 형태의 가상화 리스트
interface VirtualizedGridProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  columns: number
  rowHeight?: number
  overscan?: number
  className?: string
  gap?: number
}

export function VirtualizedGrid<T>({
  items,
  renderItem,
  columns,
  rowHeight = 200,
  overscan = 2,
  className = 'h-[600px]',
  gap = 16,
}: VirtualizedGridProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)
  const rowCount = Math.ceil(items.length / columns)

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight + gap,
    overscan,
  })

  return (
    <div
      ref={parentRef}
      className={cn('overflow-auto', className)}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map(virtualRow => {
          const rowIndex = virtualRow.index
          const startIndex = rowIndex * columns
          const rowItems = items.slice(startIndex, startIndex + columns)

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: `${gap}px`,
                paddingBottom: `${gap}px`,
              }}
            >
              {rowItems.map((item, colIndex) => (
                <div key={startIndex + colIndex}>
                  {renderItem(item, startIndex + colIndex)}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

