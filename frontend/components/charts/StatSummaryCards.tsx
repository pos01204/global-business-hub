'use client'

import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StatCardData {
  label: string
  value: number | string
  change?: number
  trend?: 'up' | 'down' | 'stable'
  date?: string
  format?: 'currency' | 'number' | 'percent'
}

export interface StatSummaryCardsProps {
  stats: StatCardData[]
  className?: string
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

const formatValue = (value: number | string, format?: 'currency' | 'number' | 'percent'): string => {
  if (typeof value === 'string') return value
  
  switch (format) {
    case 'currency':
      return formatCurrency(value)
    case 'percent':
      return `${value.toFixed(1)}%`
    case 'number':
    default:
      return value.toLocaleString()
  }
}

export function StatSummaryCards({ stats, className }: StatSummaryCardsProps) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4 mb-6', className)}>
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
        >
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
            {stat.label}
          </p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
            {formatValue(stat.value, stat.format)}
          </p>
          {stat.change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {stat.trend === 'up' && (
                <>
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {stat.change > 0 ? '+' : ''}{stat.change.toFixed(1)}%
                  </span>
                </>
              )}
              {stat.trend === 'down' && (
                <>
                  <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-xs font-medium text-red-600 dark:text-red-400">
                    {stat.change.toFixed(1)}%
                  </span>
                </>
              )}
              {stat.trend === 'stable' && (
                <>
                  <Minus className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-400">
                    {stat.change.toFixed(1)}%
                  </span>
                </>
              )}
            </div>
          )}
          {stat.date && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {stat.date}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

