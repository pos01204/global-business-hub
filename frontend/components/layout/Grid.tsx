'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface GridProps {
  children: React.ReactNode
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const gapMap = {
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
  xl: 'gap-12',
}

const colClassMap: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
}

export function Grid({
  children,
  cols = { default: 1, md: 2, lg: 3 },
  gap = 'md',
  className,
}: GridProps) {
  const colClasses = [
    cols.default ? colClassMap[cols.default] : 'grid-cols-1',
    cols.sm ? `sm:${colClassMap[cols.sm]}` : '',
    cols.md ? `md:${colClassMap[cols.md]}` : '',
    cols.lg ? `lg:${colClassMap[cols.lg]}` : '',
    cols.xl ? `xl:${colClassMap[cols.xl]}` : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cn('grid', gapMap[gap], colClasses, className)}>
      {children}
    </div>
  )
}

