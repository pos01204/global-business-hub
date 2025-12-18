'use client'

import { useState, useRef, useEffect } from 'react'
import { format, subDays, startOfMonth, endOfMonth, startOfYear, subMonths } from 'date-fns'
import { ko } from 'date-fns/locale'
import { DayPicker, DateRange } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { Calendar, ChevronDown } from 'lucide-react'

const presets = [
  { label: '오늘', getValue: () => ({ from: new Date(), to: new Date() }) },
  { label: '어제', getValue: () => ({ from: subDays(new Date(), 1), to: subDays(new Date(), 1) }) },
  { label: '최근 7일', getValue: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
  { label: '최근 30일', getValue: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
  { label: '최근 90일', getValue: () => ({ from: subDays(new Date(), 89), to: new Date() }) },
  { label: '이번 달', getValue: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  { label: '지난 달', getValue: () => {
    const lastMonth = subMonths(new Date(), 1)
    return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) }
  }},
  { label: '올해', getValue: () => ({ from: startOfYear(new Date()), to: new Date() }) },
]

export interface DateRangePickerProps {
  value: DateRange | undefined
  onChange: (range: DateRange | undefined) => void
  placeholder?: string
  className?: string
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = '기간 선택',
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayValue = value?.from
    ? `${format(value.from, 'yyyy.MM.dd', { locale: ko })} - ${
        value.to ? format(value.to, 'yyyy.MM.dd', { locale: ko }) : '...'
      }`
    : placeholder

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* 트리거 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-300 transition-colors"
      >
        <Calendar className="w-4 h-4 text-slate-400" />
        <span className="text-sm">{displayValue}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 드롭다운 */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 flex gap-4">
          {/* 프리셋 */}
          <div className="w-32 border-r border-slate-200 dark:border-slate-700 pr-4">
            <p className="text-xs text-slate-500 mb-3 font-medium">빠른 선택</p>
            <div className="space-y-1">
              {presets.map(preset => (
                <button
                  key={preset.label}
                  onClick={() => {
                    onChange(preset.getValue())
                    setIsOpen(false)
                  }}
                  className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* 캘린더 */}
          <DayPicker
            mode="range"
            selected={value}
            onSelect={onChange}
            locale={ko}
            numberOfMonths={2}
            showOutsideDays
            classNames={{
              months: 'flex gap-4',
              caption: 'flex justify-center py-2 relative items-center',
              caption_label: 'text-sm font-medium',
              nav: 'flex items-center',
              nav_button: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
              table: 'w-full border-collapse',
              head_row: 'flex',
              head_cell: 'text-slate-500 rounded-md w-9 font-normal text-xs',
              row: 'flex w-full mt-1',
              cell: 'text-center text-sm p-0 relative',
              day: 'h-9 w-9 p-0 font-normal rounded-md hover:bg-slate-100 dark:hover:bg-slate-700',
              day_selected: 'bg-indigo-600 text-white hover:bg-indigo-600',
              day_today: 'bg-slate-100 dark:bg-slate-700 font-semibold',
              day_outside: 'text-slate-300 dark:text-slate-600',
              day_disabled: 'text-slate-300',
              day_range_middle: 'bg-indigo-100 dark:bg-indigo-900/30 rounded-none',
              day_range_end: 'rounded-r-md',
              day_range_start: 'rounded-l-md',
            }}
          />
        </div>
      )}
    </div>
  )
}

// 간단한 버튼 프리셋 날짜 선택기
interface DatePresetButtonsProps {
  value: string
  onChange: (value: string) => void
  presets?: { label: string; value: string }[]
}

export function DatePresetButtons({
  value,
  onChange,
  presets: customPresets,
}: DatePresetButtonsProps) {
  const defaultPresets = [
    { label: '최근 7일', value: '7d' },
    { label: '최근 30일', value: '30d' },
    { label: '최근 90일', value: '90d' },
    { label: '이번 달', value: 'this_month' },
    { label: '지난 달', value: 'last_month' },
    { label: '올해', value: 'this_year' },
    { label: '작년', value: 'last_year' },
  ]

  const buttons = customPresets || defaultPresets

  return (
    <div className="flex flex-wrap gap-2">
      {buttons.map(preset => (
        <button
          key={preset.value}
          onClick={() => onChange(preset.value)}
          className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
            value === preset.value
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
          }`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  )
}

