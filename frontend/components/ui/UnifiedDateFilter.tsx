'use client'

import React from 'react'
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { Icon } from './Icon'
import { Calendar, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PeriodPreset } from './PeriodSelector'

export interface UnifiedDateFilterProps {
  startDate: string
  endDate: string
  periodPreset: PeriodPreset
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onPeriodChange: (preset: PeriodPreset, start?: string, end?: string) => void
  onApply?: () => void
  showApplyButton?: boolean
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

export function UnifiedDateFilter({
  startDate,
  endDate,
  periodPreset,
  onStartDateChange,
  onEndDateChange,
  onPeriodChange,
  onApply,
  showApplyButton = true,
  className,
}: UnifiedDateFilterProps) {
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

    onPeriodChange(preset, format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'))
  }

  const handleCustomDateChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      onStartDateChange(value)
      onPeriodChange('custom', value, endDate)
    } else {
      onEndDateChange(value)
      onPeriodChange('custom', startDate, value)
    }
  }

  return (
    <div className={cn('bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4', className)}>
      <div className="flex flex-col gap-4">
        {/* 프리셋 버튼 */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 mr-2">
            <Icon icon={Calendar} size="sm" className="text-slate-500" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">기간 선택:</span>
          </div>
          {presets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePresetClick(preset.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                periodPreset === preset.value
                  ? 'bg-idus-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* 커스텀 날짜 선택 및 조회 버튼 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 flex-1">
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleCustomDateChange('start', e.target.value)}
              className="flex-1 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-idus-500 rounded-lg px-3 py-2"
            />
            <span className="text-slate-400 dark:text-slate-500">~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleCustomDateChange('end', e.target.value)}
              className="flex-1 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-idus-500 rounded-lg px-3 py-2"
            />
          </div>
          {showApplyButton && onApply && (
            <button
              onClick={onApply}
              className="px-6 py-2 bg-idus-500 text-white text-sm font-semibold rounded-lg hover:bg-idus-600 transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <Icon icon={Search} size="sm" />
              조회
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

