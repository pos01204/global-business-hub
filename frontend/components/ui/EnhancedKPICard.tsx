'use client'

import React, { useState, useEffect, memo } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { Icon } from './Icon'
import { Tooltip } from './Tooltip'
import { TrendingUp, TrendingDown, Info } from 'lucide-react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface EnhancedKPICardProps {
  title: string
  value: string | number
  change?: number
  icon?: LucideIcon
  tooltip?: string
  detailInfo?: string
  className?: string
  suffix?: string
  prefix?: string
}

export const EnhancedKPICard = memo(function EnhancedKPICard({
  title,
  value,
  change,
  icon,
  tooltip,
  detailInfo,
  className,
  suffix,
  prefix,
}: EnhancedKPICardProps) {
  const [showDetail, setShowDetail] = useState(false)
  const [displayValue, setDisplayValue] = useState(0)
  const isPositive = change !== undefined && change > 0

  // 숫자 카운트업 애니메이션
  useEffect(() => {
    if (typeof value === 'number') {
      const duration = 1000
      const steps = 60
      const increment = value / steps
      let current = 0
      const timer = setInterval(() => {
        current += increment
        if (current >= value) {
          setDisplayValue(value)
          clearInterval(timer)
        } else {
          setDisplayValue(current)
        }
      }, duration / steps)
      return () => clearInterval(timer)
    }
  }, [value])

  const formatValue = (val: number | string) => {
    if (typeof val === 'number') {
      return val.toLocaleString()
    }
    return val
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all group',
        className
      )}
      onMouseEnter={() => setShowDetail(true)}
      onMouseLeave={() => setShowDetail(false)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {title}
          </h3>
          {tooltip && (
            <Tooltip content={tooltip}>
              <Info className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-help transition-colors" />
            </Tooltip>
          )}
        </div>
        {icon && <Icon icon={icon} size="lg" variant="primary" />}
      </div>

      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2"
      >
        {prefix}
        {typeof value === 'number' ? formatValue(displayValue) : value}
        {suffix && (
          <span className="text-lg font-normal text-slate-500 dark:text-slate-400 ml-1">
            {suffix}
          </span>
        )}
      </motion.div>

      {change !== undefined && (
        <div
          className={cn(
            'flex items-center gap-1 text-sm font-medium',
            isPositive
              ? 'text-success dark:text-success'
              : 'text-danger dark:text-danger'
          )}
        >
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>{Math.abs(change).toFixed(1)}%</span>
        </div>
      )}

      {/* 호버 시 상세 정보 표시 */}
      {showDetail && detailInfo && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700"
        >
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {detailInfo}
          </p>
        </motion.div>
      )}
    </motion.div>
  )
})

