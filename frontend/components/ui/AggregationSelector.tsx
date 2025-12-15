'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export type AggregationType = 'daily' | 'weekly' | 'monthly'

export interface AggregationSelectorProps {
  value: AggregationType
  onChange: (value: AggregationType) => void
  className?: string
}

const options: Array<{ label: string; value: AggregationType }> = [
  { label: '일별', value: 'daily' },
  { label: '주별', value: 'weekly' },
  { label: '월별', value: 'monthly' },
]

export function AggregationSelector({
  value,
  onChange,
  className,
}: AggregationSelectorProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-sm text-slate-600 dark:text-slate-400">집계:</span>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            value === option.value
              ? 'bg-idus-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

