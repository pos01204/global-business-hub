'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, 
  AlertCircle, 
  TrendingUp, 
  X, 
  ChevronRight, 
  Calendar,
  CheckCircle2,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate } from '@/lib/formatters'
import Link from 'next/link'

/**
 * 알림 유형별 스타일 설정
 */
const typeStyles = {
  critical: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-300 dark:border-red-700',
    iconBg: 'bg-red-500',
    icon: AlertTriangle,
    iconAnimation: 'animate-pulse',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    badgeText: '긴급',
    accentColor: 'border-l-red-500',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-300 dark:border-amber-700',
    iconBg: 'bg-amber-500',
    icon: AlertCircle,
    iconAnimation: '',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    badgeText: '주의',
    accentColor: 'border-l-amber-500',
  },
  positive: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-300 dark:border-emerald-700',
    iconBg: 'bg-emerald-500',
    icon: TrendingUp,
    iconAnimation: '',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    badgeText: '호조',
    accentColor: 'border-l-emerald-500',
  },
}

export interface AnomalyAlertProps {
  /** 알림 유형 */
  type: 'critical' | 'warning' | 'positive'
  
  /** 지표명 */
  metric: string
  
  /** 데이터 기준일 (어제) */
  referenceDate: string
  
  /** 전일 실제 값 */
  actualValue: number
  
  /** 예측/기대 값 */
  expectedValue: number
  
  /** 편차 (%) */
  deviation: number
  
  /** 표준편차 배수 (σ) */
  sigma: number
  
  /** 예상 원인 (선택) */
  possibleCauses?: string[]
  
  /** 상세 분석 링크 */
  analysisLink?: string
  
  /** 닫기 가능 여부 */
  dismissible?: boolean
  
  /** 닫기 콜백 */
  onDismiss?: () => void
  
  /** 확인 콜백 */
  onAcknowledge?: () => void
  
  /** 로딩 상태 */
  isLoading?: boolean
  
  /** 추가 클래스 */
  className?: string
}

/**
 * AnomalyAlert 컴포넌트
 * 
 * 전일 GMV/주문 등 핵심 지표의 이상 감지 알림을 표시합니다.
 * 모든 데이터는 전일 (D-1) 마감 데이터 기준입니다.
 * 
 * @example
 * ```tsx
 * <AnomalyAlert
 *   type="critical"
 *   metric="GMV"
 *   referenceDate="2024-12-18"
 *   actualValue={4520000000}
 *   expectedValue={5910000000}
 *   deviation={-23.5}
 *   sigma={3.2}
 *   possibleCauses={[
 *     "일본 공휴일 영향 (천황 탄생일)",
 *     "결제 시스템 일시적 지연"
 *   ]}
 *   analysisLink="/analytics?tab=anomaly"
 *   onAcknowledge={() => console.log('확인됨')}
 * />
 * ```
 */
export function AnomalyAlert({
  type,
  metric,
  referenceDate,
  actualValue,
  expectedValue,
  deviation,
  sigma,
  possibleCauses,
  analysisLink,
  dismissible = true,
  onDismiss,
  onAcknowledge,
  isLoading = false,
  className,
}: AnomalyAlertProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const [isAcknowledged, setIsAcknowledged] = useState(false)
  
  const style = typeStyles[type]
  const IconComponent = style.icon

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  const handleAcknowledge = () => {
    setIsAcknowledged(true)
    onAcknowledge?.()
  }

  // 편차 라벨 포맷팅
  const getDeviationLabel = () => {
    if (deviation > 0) return `+${deviation.toFixed(1)}%`
    return `${deviation.toFixed(1)}%`
  }

  // 시그마 라벨 포맷팅
  const getSigmaLabel = () => {
    const absSigma = Math.abs(sigma)
    return `±${absSigma.toFixed(1)}σ ${absSigma > 3 ? '초과' : absSigma > 2 ? '이상' : ''}`
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className={cn(
        'rounded-xl border p-4 lg:p-5',
        'bg-slate-50 dark:bg-slate-800/50',
        'border-slate-200 dark:border-slate-700',
        className
      )}>
        <div className="animate-pulse space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn(
            'rounded-xl overflow-hidden border border-l-4',
            style.bg,
            style.border,
            style.accentColor,
            isAcknowledged && 'opacity-60',
            className
          )}
          role="alert"
          aria-live="assertive"
        >
          <div className="p-4 lg:p-5">
            {/* 상단: 아이콘 + 제목 + 기준일 */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shadow-sm',
                  style.iconBg,
                  style.iconAnimation
                )}>
                  <IconComponent className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                      이상 감지: {metric}
                    </h3>
                    <span className={cn(
                      'px-2 py-0.5 text-xs font-bold rounded-full',
                      style.badge
                    )}>
                      {style.badgeText}
                    </span>
                    {isAcknowledged && (
                      <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                        <CheckCircle2 className="w-3 h-3" />
                        확인됨
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                    어제 실적이 예측 대비 {getDeviationLabel()} {deviation < 0 ? '하락' : '상승'}했습니다
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                  <Calendar className="w-3 h-3" aria-hidden="true" />
                  {formatDate(referenceDate, 'short')} 기준
                </span>
                {dismissible && (
                  <button
                    onClick={handleDismiss}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    aria-label="알림 닫기"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                )}
              </div>
            </div>

            {/* 중단: 수치 정보 */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-center border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">어제 실적</div>
                <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {formatCurrency(actualValue)}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-center border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">예측치</div>
                <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {formatCurrency(expectedValue)}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-center border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">편차</div>
                <div className={cn(
                  'text-lg font-bold',
                  deviation < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                )}>
                  {getDeviationLabel()}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ({getSigmaLabel()})
                </div>
              </div>
            </div>

            {/* 예상 원인 (있을 경우) */}
            {possibleCauses && possibleCauses.length > 0 && (
              <div className="mb-4 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  예상 원인
                </div>
                <ul className="space-y-1">
                  {possibleCauses.map((cause, index) => (
                    <li 
                      key={index} 
                      className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2"
                    >
                      <span className="text-slate-400 mt-0.5">•</span>
                      {cause}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 하단: 액션 버튼 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {onAcknowledge && !isAcknowledged && (
                  <button
                    onClick={handleAcknowledge}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors"
                  >
                    확인함
                  </button>
                )}
              </div>
              
              {analysisLink && (
                <Link
                  href={analysisLink}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-800 text-sm font-medium rounded-lg hover:bg-slate-700 dark:hover:bg-slate-200 transition-colors"
                >
                  원인 분석
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * 이상 감지 알림 목록 컴포넌트
 * 여러 개의 이상 감지 알림을 표시할 때 사용
 */
export interface AnomalyAlertListProps {
  alerts: Omit<AnomalyAlertProps, 'onDismiss' | 'onAcknowledge'>[]
  onDismiss?: (index: number) => void
  onAcknowledge?: (index: number) => void
  className?: string
}

export function AnomalyAlertList({
  alerts,
  onDismiss,
  onAcknowledge,
  className,
}: AnomalyAlertListProps) {
  if (alerts.length === 0) return null

  return (
    <div className={cn('space-y-3', className)}>
      {alerts.map((alert, index) => (
        <AnomalyAlert
          key={`${alert.metric}-${index}`}
          {...alert}
          onDismiss={onDismiss ? () => onDismiss(index) : undefined}
          onAcknowledge={onAcknowledge ? () => onAcknowledge(index) : undefined}
        />
      ))}
    </div>
  )
}

export default AnomalyAlert

