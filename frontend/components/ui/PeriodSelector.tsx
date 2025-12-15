'use client'

import React from 'react'
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { Icon } from './Icon'
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PeriodPreset = '7d' | '30d' | '90d' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'custom'

export interface PeriodSelectorProps {
  value: PeriodPreset
  startDate?: string
  endDate?: string
  onChange: (preset: PeriodPreset, startDate?: string, endDate?: string) => void
  showCustom?: boolean
  className?: string
}

const presets = [
  { label: '최근 7일', value: '7d' as const },
  { label: '최근 30일', value: '30d' as const },
  { label: '최근 90일', value: '90d' as const },
  { label: '이번 달', value: 'thisMonth' as const },
  { label: '지난 달', value: 'lastMonth' as const },
  { label: '올해', value: 'thisYear' as const },
  { label: '작년', value: 'lastYear' as const },
]

export function PeriodSelector({
  value,
  startDate,
  endDate,
  onChange,
  showCustom = true,
  className,
}: PeriodSelectorProps) {
  const handlePresetClick = (preset: PeriodPreset) => {
    const today = new Date()
    let start: Date
    let end: Date = today

    switch (preset) {
      case '7d':
        start = subDays(today, 6)
        break
      case '30d':
        start = subDays(today, 29)
        break
      case '90d':
        start = subDays(today, 89)
        break
      case 'thisMonth':
        start = startOfMonth(today)
        end = endOfMonth(today)
        break
      case 'lastMonth':
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        start = startOfMonth(lastMonth)
        end = endOfMonth(lastMonth)
        break
      case 'thisYear':
        start = startOfYear(today)
        end = endOfYear(today)
        break
      case 'lastYear':
        const lastYear = new Date(today.getFullYear() - 1, 0, 1)
        start = startOfYear(lastYear)
        end = endOfYear(lastYear)
        break
      default:
        return
    }

    onChange(preset, format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'))
  }

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {presets.map((preset) => (
        <button
          key={preset.value}
          onClick={() => handlePresetClick(preset.value)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            value === preset.value
              ? 'bg-idus-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          )}
        >
          {preset.label}
        </button>
      ))}
      {showCustom && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
          <Icon icon={Calendar} size="sm" className="text-slate-500" />
          <input
            type="date"
            value={startDate || ''}
            onChange={(e) => {
              if (e.target.value && endDate) {
                onChange('custom', e.target.value, endDate)
              }
            }}
            className="bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-300"
          />
          <span className="text-slate-500">~</span>
          <input
            type="date"
            value={endDate || ''}
            onChange={(e) => {
              if (e.target.value && startDate) {
                onChange('custom', startDate, e.target.value)
              }
            }}
            className="bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-300"
          />
        </div>
      )}
    </div>
  )
}

