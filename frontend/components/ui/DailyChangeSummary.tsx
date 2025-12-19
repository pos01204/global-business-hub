'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  AlertTriangle, 
  AlertCircle, 
  TrendingUp, 
  Minus, 
  ChevronRight, 
  Calendar, 
  ClipboardList,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate, formatNumber, formatCurrency, formatPercent } from '@/lib/formatters'
import Link from 'next/link'

/**
 * 심각도별 스타일 설정
 */
const severityConfig = {
  critical: {
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-l-red-500',
    label: '긴급',
    labelBg: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
  },
  warning: {
    icon: AlertCircle,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-l-amber-500',
    label: '주목',
    labelBg: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
  },
  positive: {
    icon: TrendingUp,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-l-emerald-500',
    label: '긍정',
    labelBg: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
  },
  neutral: {
    icon: Minus,
    color: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-50 dark:bg-slate-800',
    border: 'border-l-slate-400',
    label: '참고',
    labelBg: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
  },
}

export interface DailyChange {
  /** 심각도 */
  severity: 'critical' | 'warning' | 'positive' | 'neutral'
  
  /** 지표명 */
  metric: string
  
  /** 이전 값 (그저께) */
  previousValue: number
  
  /** 현재 값 (어제) */
  currentValue: number
  
  /** 변화율 (%) */
  changePercent: number
  
  /** 변화량 (절대값) */
  changeAbsolute: number
  
  /** 설명 */
  description: string
  
  /** 필요 액션 */
  actionRequired?: string
  
  /** 상세 링크 */
  link?: string
  
  /** 값 포맷 유형 */
  valueType?: 'currency' | 'number' | 'percent'
}

export interface DailyChangeSummaryProps {
  /** 데이터 기준일 (어제) */
  referenceDate: string
  
  /** 변화 목록 */
  changes: DailyChange[]
  
  /** 최대 표시 항목 수 */
  maxItems?: number
  
  /** 상세 분석 링크 */
  detailLink?: string
  
  /** 로딩 상태 */
  isLoading?: boolean
  
  /** 추가 클래스 */
  className?: string
}

/**
 * DailyChangeSummary 컴포넌트
 * 
 * 어제 발생한 주요 변화 사항을 요약하여 표시합니다.
 * 심각도별로 그룹화하여 긴급한 항목을 먼저 표시합니다.
 * 
 * @example
 * ```tsx
 * <DailyChangeSummary
 *   referenceDate="2024-12-18"
 *   changes={[
 *     {
 *       severity: 'critical',
 *       metric: '배송 완료율',
 *       previousValue: 85.2,
 *       currentValue: 78.3,
 *       changePercent: -6.9,
 *       changeAbsolute: -6.9,
 *       description: '배송 완료율이 급격히 하락했습니다',
 *       actionRequired: '물류 센터 점검 필요',
 *       valueType: 'percent'
 *     }
 *   ]}
 *   detailLink="/analytics"
 * />
 * ```
 */
export function DailyChangeSummary({
  referenceDate,
  changes,
  maxItems = 6,
  detailLink,
  isLoading = false,
  className,
}: DailyChangeSummaryProps) {
  // 심각도 순으로 정렬
  const sortedChanges = useMemo(() => {
    const severityOrder = { critical: 0, warning: 1, positive: 2, neutral: 3 }
    return [...changes]
      .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
      .slice(0, maxItems)
  }, [changes, maxItems])

  // 심각도별 그룹화
  const groupedChanges = useMemo(() => {
    return sortedChanges.reduce((acc, change) => {
      if (!acc[change.severity]) acc[change.severity] = []
      acc[change.severity].push(change)
      return acc
    }, {} as Record<string, DailyChange[]>)
  }, [sortedChanges])

  // 값 포맷팅
  const formatValue = (value: number, type?: string) => {
    switch (type) {
      case 'currency':
        return formatCurrency(value)
      case 'percent':
        return formatPercent(value)
      default:
        return formatNumber(value)
    }
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className={cn(
        'bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 lg:p-6 shadow-sm',
        className
      )}>
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
            </div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 빈 상태
  if (changes.length === 0) {
    return (
      <div className={cn(
        'bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 lg:p-6 shadow-sm',
        className
      )}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-slate-600 rounded-xl flex items-center justify-center shadow-sm">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">어제 주요 변화</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              전일 대비 주요 지표 변동 사항
            </p>
          </div>
        </div>
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">어제 특별한 변화가 없습니다</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 lg:p-6 shadow-sm',
      className
    )}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-600 rounded-xl flex items-center justify-center shadow-sm">
            <ClipboardList className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">어제 주요 변화</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              전일 대비 주요 지표 변동 사항
            </p>
          </div>
        </div>
        
        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">
          <Calendar className="w-3 h-3" aria-hidden="true" />
          {formatDate(referenceDate, 'short')}
        </span>
      </div>

      {/* 변화 목록 */}
      <div className="space-y-4">
        {(['critical', 'warning', 'positive', 'neutral'] as const).map(severity => {
          const items = groupedChanges[severity]
          if (!items || items.length === 0) return null
          
          const config = severityConfig[severity]
          const SeverityIcon = config.icon
          
          return (
            <div key={severity}>
              {/* 심각도 라벨 */}
              <div className="flex items-center gap-2 mb-2">
                <span className={cn(
                  'text-xs font-semibold px-2 py-0.5 rounded-full',
                  config.labelBg
                )}>
                  {config.label}
                </span>
                <span className="text-xs text-slate-400">
                  {items.length}건
                </span>
              </div>
              
              {/* 변화 항목 */}
              <div className="space-y-2">
                {items.map((change, index) => (
                  <motion.div
                    key={`${change.metric}-${index}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className={cn(
                      'p-3 rounded-lg border-l-4',
                      config.bg,
                      config.border
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* 지표명 + 변화율 */}
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {change.metric}
                          </span>
                          <span className={cn(
                            'inline-flex items-center gap-0.5 text-xs font-bold',
                            change.changePercent >= 0 
                              ? 'text-emerald-600 dark:text-emerald-400' 
                              : 'text-red-600 dark:text-red-400'
                          )}>
                            {change.changePercent >= 0 ? (
                              <ArrowUpRight className="w-3 h-3" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3" />
                            )}
                            {change.changePercent >= 0 ? '+' : ''}{change.changePercent.toFixed(1)}%
                          </span>
                        </div>
                        
                        {/* 설명 */}
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                          {change.description}
                        </p>
                        
                        {/* 값 변화 */}
                        <p className="text-xs text-slate-500 dark:text-slate-500">
                          {formatValue(change.previousValue, change.valueType)} → {formatValue(change.currentValue, change.valueType)}
                        </p>
                        
                        {/* 필요 액션 */}
                        {change.actionRequired && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {change.actionRequired}
                          </p>
                        )}
                      </div>
                      
                      {/* 상세 링크 */}
                      {change.link && (
                        <Link
                          href={change.link}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                          aria-label={`${change.metric} 상세 보기`}
                        >
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </Link>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* 상세 보기 링크 */}
      {detailLink && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Link
            href={detailLink}
            className="flex items-center justify-center gap-1 text-sm text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium transition-colors"
          >
            상세 분석 보기
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  )
}

export default DailyChangeSummary

