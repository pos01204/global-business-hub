'use client'

import React from 'react'
import { format } from 'date-fns'

interface TooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
    dataKey: string
  }>
  label?: string
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `₩${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `₩${(value / 1000).toFixed(0)}K`
  }
  return `₩${value.toLocaleString()}`
}

const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr)
    return format(date, 'yyyy년 MM월 dd일')
  } catch {
    return dateStr
  }
}

export function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const gmvEntry = payload.find((p) => p.dataKey === 'gmv' || p.name === 'GMV')
  const ordersEntry = payload.find((p) => p.dataKey === 'orders' || p.name === '주문 건수')
  const gmvMAEntry = payload.find((p) => p.name?.includes('GMV') && p.name?.includes('이동평균'))
  const ordersMAEntry = payload.find((p) => p.name?.includes('주문') && p.name?.includes('이동평균'))

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl p-4 border border-slate-200 dark:border-slate-800 min-w-[200px]">
      <p className="font-semibold text-slate-900 dark:text-slate-100 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
        {label ? formatDate(label) : ''}
      </p>
      
      <div className="space-y-2">
        {/* GMV */}
        {gmvEntry && (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: '#F78C3A' }}
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">GMV</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(gmvEntry.value)}
            </span>
          </div>
        )}
        
        {/* 주문 건수 */}
        {ordersEntry && (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: '#3B82F6' }}
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">주문 건수</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {ordersEntry.value}건
            </span>
          </div>
        )}
        
        {/* GMV 이동평균 */}
        {gmvMAEntry && (
          <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full border-2"
                style={{ borderColor: '#D97706', backgroundColor: 'transparent' }}
              />
              <span className="text-xs text-slate-500 dark:text-slate-500">GMV (7일 이동평균)</span>
            </div>
            <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">
              {formatCurrency(gmvMAEntry.value)}
            </span>
          </div>
        )}
        
        {/* 주문 건수 이동평균 */}
        {ordersMAEntry && (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full border-2"
                style={{ borderColor: '#1E40AF', backgroundColor: 'transparent' }}
              />
              <span className="text-xs text-slate-500 dark:text-slate-500">주문 건수 (7일 이동평균)</span>
            </div>
            <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">
              {ordersMAEntry.value}건
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

