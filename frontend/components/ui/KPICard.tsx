'use client'

import React from 'react'

export interface KPICardProps {
  title: string
  value: string | number
  suffix?: string
  prefix?: string
  change?: {
    value: number
    period?: string
  }
  icon?: React.ReactNode
  trend?: number[]
  color?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  suffix,
  prefix,
  change,
  icon,
  trend,
  color = 'default',
  size = 'md',
  className = '',
}) => {
  const colorStyles = {
    default: 'before:bg-gradient-to-r before:from-[#F78C3A] before:to-orange-300',
    success: 'before:bg-gradient-to-r before:from-emerald-500 before:to-emerald-300',
    warning: 'before:bg-gradient-to-r before:from-amber-500 before:to-amber-300',
    danger: 'before:bg-gradient-to-r before:from-red-500 before:to-red-300',
    info: 'before:bg-gradient-to-r before:from-blue-500 before:to-blue-300',
  }

  const sizes = {
    sm: {
      container: 'p-3',
      value: 'text-xl',
      title: 'text-xs',
      icon: 'w-8 h-8 text-lg',
    },
    md: {
      container: 'p-4',
      value: 'text-2xl',
      title: 'text-sm',
      icon: 'w-10 h-10 text-xl',
    },
    lg: {
      container: 'p-5',
      value: 'text-3xl',
      title: 'text-sm',
      icon: 'w-12 h-12 text-2xl',
    },
  }

  const formatChange = (val: number) => {
    if (!isFinite(val) || isNaN(val)) return '-'
    const sign = val >= 0 ? '+' : ''
    return `${sign}${val.toFixed(1)}%`
  }

  return (
    <div
      className={`
        relative bg-white rounded-xl border border-slate-200 overflow-hidden
        transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5
        before:absolute before:top-0 before:left-0 before:right-0 before:h-1
        ${colorStyles[color]}
        ${sizes[size].container}
        ${className}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className={`text-slate-500 font-medium mb-1 ${sizes[size].title}`}>
            {title}
          </p>
          <p className={`font-bold text-slate-900 ${sizes[size].value}`}>
            {prefix}
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix && (
              <span className="text-slate-500 font-normal text-base ml-0.5">
                {suffix}
              </span>
            )}
          </p>
          {change && (
            <p
              className={`text-xs font-medium mt-1 flex items-center gap-1 ${
                change.value >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              <span>{change.value >= 0 ? '↑' : '↓'}</span>
              <span>{formatChange(change.value)}</span>
              {change.period && (
                <span className="text-slate-400 font-normal">vs {change.period}</span>
              )}
            </p>
          )}
        </div>
        {icon && (
          <div
            className={`
              flex-shrink-0 rounded-lg bg-slate-50 flex items-center justify-center
              ${sizes[size].icon}
            `}
          >
            {icon}
          </div>
        )}
      </div>

      {/* 미니 스파크라인 (선택적) */}
      {trend && trend.length > 0 && (
        <div className="mt-3 h-8 flex items-end gap-0.5">
          {trend.map((val, idx) => {
            const max = Math.max(...trend)
            const height = max > 0 ? (val / max) * 100 : 0
            return (
              <div
                key={idx}
                className="flex-1 bg-slate-200 rounded-t transition-all hover:bg-[#F78C3A]"
                style={{ height: `${Math.max(height, 5)}%` }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export default KPICard
