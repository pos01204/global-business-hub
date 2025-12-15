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

  // 숫자를 만원/억원 단위로 변환하는 함수
  const formatCompactNumber = (val: number): { value: string; unit: string } => {
    if (val >= 100000000) {
      return { value: (val / 100000000).toFixed(1), unit: '억' }
    }
    if (val >= 10000) {
      return { value: (val / 10000).toFixed(0), unit: '만' }
    }
    return { value: val.toLocaleString(), unit: '' }
  }

  // 문자열에서 숫자 추출 (₩, 쉼표 제거)
  const extractNumber = (str: string): number | null => {
    const cleaned = str.replace(/[₩,\s]/g, '')
    const num = parseFloat(cleaned)
    return isNaN(num) ? null : num
  }

  const formatValue = (val: number | string) => {
    if (typeof val === 'number') {
      // 숫자가 10000 이상이면 만원/억원 단위로 변환
      if (val >= 10000) {
        const compact = formatCompactNumber(val)
        return { main: compact.value, unit: compact.unit, full: val.toLocaleString() }
      }
      return { main: val.toLocaleString(), unit: '', full: val.toLocaleString() }
    }
    
    // 문자열인 경우 (₩ 포함 가능)
    if (typeof val === 'string' && (val.includes('₩') || /[\d,]+/.test(val))) {
      const num = extractNumber(val)
      if (num !== null && num >= 10000) {
        const compact = formatCompactNumber(num)
        return { main: compact.value, unit: compact.unit, full: val }
      }
    }
    
    return { main: val, unit: '', full: val }
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
        className="mb-2"
      >
        {(() => {
          const formatted = typeof value === 'number' 
            ? formatValue(displayValue) 
            : formatValue(value)
          
          const displayText = typeof formatted === 'object' ? formatted.main : formatted
          const unit = typeof formatted === 'object' ? formatted.unit : ''
          const fullText = typeof formatted === 'object' ? formatted.full : String(value)
          
          // 숫자가 길면 폰트 크기를 동적으로 조정
          const textLength = displayText.length + (unit ? unit.length : 0) + (suffix ? suffix.length : 0) + (prefix ? prefix.length : 0)
          let fontSize = 'text-3xl'
          if (textLength > 15) {
            fontSize = 'text-xl'
          } else if (textLength > 12) {
            fontSize = 'text-2xl'
          } else if (textLength > 8) {
            fontSize = 'text-2xl'
          }
          
          return (
            <div 
              className={`${fontSize} font-bold text-slate-900 dark:text-slate-100 leading-tight`}
              title={fullText}
            >
              <div className="flex items-baseline gap-1 flex-wrap min-w-0">
                {prefix && <span className="flex-shrink-0">{prefix}</span>}
                <span className="whitespace-nowrap min-w-0">{displayText}</span>
                {unit && (
                  <span className={`${fontSize === 'text-xl' ? 'text-lg' : 'text-xl'} font-semibold text-slate-600 dark:text-slate-400 flex-shrink-0`}>
                    {unit}
                  </span>
                )}
                {suffix && (
                  <span className="text-lg font-normal text-slate-500 dark:text-slate-400 flex-shrink-0">
                    {suffix}
                  </span>
                )}
              </div>
            </div>
          )
        })()}
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

