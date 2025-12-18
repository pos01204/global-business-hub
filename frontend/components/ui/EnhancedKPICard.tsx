'use client'

import React, { useState, useEffect, memo } from 'react'
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import { Icon } from './Icon'
import { Tooltip } from './Tooltip'
import { TrendingUp, TrendingDown, Info, Sparkles } from 'lucide-react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { hoverEffects, cardHoverVariants } from '@/lib/hover-effects'
import { BrandFeedback } from '@/components/brand'

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
  variant?: 'default' | 'gradient' | 'glass' | 'bordered' | 'hero'
  accentColor?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
  /** 주요 KPI 강조 표시 (시선 정지점) */
  isPrimary?: boolean
  /** 긴급/경고 상태 펄스 애니메이션 */
  isUrgent?: boolean
  /** 브랜드 이모션 피드백 표시 */
  showBrandFeedback?: boolean
}

const accentColors = {
  blue: 'from-blue-500/10 to-indigo-500/10 border-blue-200 dark:border-blue-800',
  green: 'from-emerald-500/10 to-teal-500/10 border-emerald-200 dark:border-emerald-800',
  purple: 'from-purple-500/10 to-pink-500/10 border-purple-200 dark:border-purple-800',
  orange: 'from-orange-500/10 to-amber-500/10 border-orange-200 dark:border-orange-800',
  red: 'from-red-500/10 to-rose-500/10 border-red-200 dark:border-red-800',
}

const variantStyles = {
  default: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
  gradient: 'bg-gradient-to-br border',
  glass: 'bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-white/20 dark:border-slate-700/50',
  bordered: 'bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600',
  hero: 'bg-gradient-to-br from-idus-500/10 to-orange-500/5 dark:from-idus-500/20 dark:to-orange-500/10 border-2 border-idus-500/30 dark:border-idus-500/40 shadow-lg shadow-idus-500/10',
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
  variant = 'default',
  accentColor = 'blue',
  isPrimary = false,
  isUrgent = false,
  showBrandFeedback = false,
}: EnhancedKPICardProps) {
  const [showDetail, setShowDetail] = useState(false)
  const [displayValue, setDisplayValue] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
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

  // Primary KPI는 hero variant 자동 적용
  const effectiveVariant = isPrimary ? 'hero' : variant

  return (
    <motion.div
      variants={cardHoverVariants}
      initial="initial"
      animate={isHovered ? "hover" : "initial"}
      whileHover="hover"
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        'rounded-xl p-6 shadow-md transition-all duration-300 group relative overflow-hidden',
        variantStyles[effectiveVariant],
        effectiveVariant === 'gradient' && accentColors[accentColor],
        hoverEffects.card,
        // Primary KPI 강조 스타일
        isPrimary && 'ring-2 ring-idus-500/20 dark:ring-idus-500/30',
        // 긴급 상태 펄스 애니메이션
        isUrgent && 'animate-pulse-urgent',
        className
      )}
      onMouseEnter={() => {
        setShowDetail(true)
        setIsHovered(true)
      }}
      onMouseLeave={() => {
        setShowDetail(false)
        setIsHovered(false)
      }}
      role="article"
      aria-label={`${title}: ${typeof value === 'number' ? value.toLocaleString() : value}${suffix || ''}`}
    >
      {/* 호버 시 배경 그라데이션 효과 */}
      <motion.div
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-0 pointer-events-none',
          accentColors[accentColor]
        )}
        animate={{ opacity: isHovered ? 0.5 : 0 }}
        transition={{ duration: 0.3 }}
      />
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
          {showBrandFeedback ? (
            <BrandFeedback change={change} size="sm" showLabel={false} />
          ) : isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>{Math.abs(change).toFixed(1)}%</span>
        </div>
      )}

      {/* 호버 시 상세 정보 표시 */}
      <AnimatePresence>
        {showDetail && detailInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="pt-4 border-t border-slate-200 dark:border-slate-700 relative z-10"
          >
            <div className="flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {detailInfo}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 호버 시 상단 액센트 라인 (Primary는 항상 표시) */}
      <motion.div
        className={cn(
          'absolute top-0 left-0 right-0 h-1 rounded-t-xl',
          isPrimary && 'bg-gradient-to-r from-idus-500 to-orange-400',
          !isPrimary && accentColor === 'blue' && 'bg-gradient-to-r from-blue-500 to-indigo-500',
          !isPrimary && accentColor === 'green' && 'bg-gradient-to-r from-emerald-500 to-teal-500',
          !isPrimary && accentColor === 'purple' && 'bg-gradient-to-r from-purple-500 to-pink-500',
          !isPrimary && accentColor === 'orange' && 'bg-gradient-to-r from-orange-500 to-amber-500',
          !isPrimary && accentColor === 'red' && 'bg-gradient-to-r from-red-500 to-rose-500',
        )}
        initial={{ scaleX: isPrimary ? 1 : 0 }}
        animate={{ scaleX: isPrimary || isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{ transformOrigin: 'left' }}
      />

      {/* Primary KPI 배지 */}
      {isPrimary && (
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-idus-500 text-white text-[10px] font-bold rounded-full shadow-sm">
          핵심
        </div>
      )}

      {/* 긴급 상태 표시 */}
      {isUrgent && (
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full shadow-sm animate-pulse">
          <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
          긴급
        </div>
      )}
    </motion.div>
  )
})

