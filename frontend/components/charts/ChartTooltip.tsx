'use client'

import React from 'react'
import { formatCurrency } from '@/lib/formatters'

// ============================================================
// 공통 차트 툴팁 컴포넌트 (Recharts용)
// ============================================================

export interface ChartTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
  valueFormatter?: (value: number) => string
  labelFormatter?: (label: string) => string
  className?: string
}

/**
 * Recharts용 커스텀 툴팁 컴포넌트
 * 통일된 스타일과 포맷팅 제공
 */
export function CustomChartTooltip({
  active,
  payload,
  label,
  valueFormatter = formatCurrency,
  labelFormatter = (l) => l,
  className = '',
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  return (
    <div
      className={`
        bg-white dark:bg-slate-800 
        border border-slate-200 dark:border-slate-700 
        rounded-lg shadow-lg 
        px-4 py-3 
        text-sm
        ${className}
      `}
    >
      {label && (
        <p className="font-semibold text-slate-800 dark:text-slate-200 mb-2 border-b border-slate-100 dark:border-slate-700 pb-2">
          {labelFormatter(label)}
        </p>
      )}
      <div className="space-y-1.5">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-600 dark:text-slate-400">
                {entry.name || entry.dataKey}
              </span>
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {typeof entry.value === 'number'
                ? valueFormatter(entry.value)
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// GMV 전용 툴팁
// ============================================================

export function GMVTooltip(props: ChartTooltipProps) {
  return (
    <CustomChartTooltip
      {...props}
      valueFormatter={(value) => {
        if (value >= 100000000) return `₩${(value / 100000000).toFixed(1)}억`
        if (value >= 10000) return `₩${(value / 10000).toFixed(0)}만`
        return `₩${value.toLocaleString()}`
      }}
    />
  )
}

// ============================================================
// 퍼센트 전용 툴팁
// ============================================================

export function PercentTooltip(props: ChartTooltipProps) {
  return (
    <CustomChartTooltip
      {...props}
      valueFormatter={(value) => `${value.toFixed(1)}%`}
    />
  )
}

// ============================================================
// 주문 수 전용 툴팁
// ============================================================

export function OrderCountTooltip(props: ChartTooltipProps) {
  return (
    <CustomChartTooltip
      {...props}
      valueFormatter={(value) => `${value.toLocaleString()}건`}
    />
  )
}

// ============================================================
// 날짜 레이블 포맷터
// ============================================================

export function DateLabelFormatter(label: string): string {
  // YYYY-MM-DD 형식을 MM월 DD일로 변환
  if (/^\d{4}-\d{2}-\d{2}$/.test(label)) {
    const [, month, day] = label.split('-')
    return `${parseInt(month)}월 ${parseInt(day)}일`
  }
  // YYYY-MM 형식을 YYYY년 MM월로 변환
  if (/^\d{4}-\d{2}$/.test(label)) {
    const [year, month] = label.split('-')
    return `${year}년 ${parseInt(month)}월`
  }
  return label
}

// ============================================================
// 복합 툴팁 (GMV + 주문수)
// ============================================================

export function CompositeTooltip({
  active,
  payload,
  label,
  labelFormatter = DateLabelFormatter,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg px-4 py-3 text-sm">
      {label && (
        <p className="font-semibold text-slate-800 dark:text-slate-200 mb-2 border-b border-slate-100 dark:border-slate-700 pb-2">
          {labelFormatter(label)}
        </p>
      )}
      <div className="space-y-1.5">
        {payload.map((entry: any, index: number) => {
          let formattedValue = entry.value
          
          // 데이터 키에 따라 포맷팅
          if (entry.dataKey?.toLowerCase().includes('gmv') || 
              entry.dataKey?.toLowerCase().includes('revenue') ||
              entry.dataKey?.toLowerCase().includes('amount')) {
            if (entry.value >= 100000000) {
              formattedValue = `₩${(entry.value / 100000000).toFixed(1)}억`
            } else if (entry.value >= 10000) {
              formattedValue = `₩${(entry.value / 10000).toFixed(0)}만`
            } else {
              formattedValue = `₩${entry.value.toLocaleString()}`
            }
          } else if (entry.dataKey?.toLowerCase().includes('rate') ||
                     entry.dataKey?.toLowerCase().includes('percent')) {
            formattedValue = `${entry.value.toFixed(1)}%`
          } else if (entry.dataKey?.toLowerCase().includes('order') ||
                     entry.dataKey?.toLowerCase().includes('count')) {
            formattedValue = `${entry.value.toLocaleString()}건`
          } else if (typeof entry.value === 'number') {
            formattedValue = entry.value.toLocaleString()
          }

          return (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-slate-600 dark:text-slate-400">
                  {entry.name || entry.dataKey}
                </span>
              </div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formattedValue}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// Export
// ============================================================

// 기본 커스텀 툴팁 (default)
export default CustomChartTooltip

// 기존 코드 호환용 alias (Recharts 커스텀 툴팁)
export const CustomTooltip = CustomChartTooltip
