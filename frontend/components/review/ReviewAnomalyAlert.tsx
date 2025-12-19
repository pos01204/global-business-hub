'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, 
  AlertCircle, 
  TrendingDown,
  X, 
  ChevronRight, 
  ChevronDown,
  Star,
  User,
  Package,
  Globe,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
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
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-300 dark:border-blue-700',
    iconBg: 'bg-blue-500',
    icon: TrendingDown,
    iconAnimation: '',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    badgeText: '참고',
    accentColor: 'border-l-blue-500',
  },
}

/**
 * 이상 감지 대상 아이콘
 */
const targetIcons = {
  overall: Globe,
  artist: User,
  product: Package,
  country: Globe,
}

export interface ReviewAnomalyAlertProps {
  /** 알림 유형 */
  type: 'critical' | 'warning' | 'info'
  
  /** 이상 감지 대상 */
  target: 'overall' | 'artist' | 'product' | 'country'
  
  /** 대상 이름 (작가명, 상품명 등) */
  targetName?: string
  
  /** 지표 유형 */
  metric: 'rating' | 'nps' | 'negative_reviews'
  
  /** 현재 값 */
  currentValue: number
  
  /** 예상 값 (이동평균 등) */
  expectedValue: number
  
  /** 편차 (%) */
  deviation: number
  
  /** 영향 받은 리뷰 수 */
  affectedReviews: number
  
  /** 감지 시점 */
  detectedAt: string
  
  /** 주요 불만 사항 (선택) */
  mainIssues?: string[]
  
  /** 샘플 리뷰 (번역 전 원문) */
  sampleReviews?: Array<{
    content: string
    language: 'ja' | 'en'
    rating: number
  }>
  
  /** 상세 분석 링크 */
  detailLink?: string
  
  /** 닫기 가능 여부 */
  dismissible?: boolean
  
  /** 닫기 콜백 */
  onDismiss?: () => void
  
  /** 확인 콜백 */
  onAcknowledge?: () => void
  
  /** 추가 클래스 */
  className?: string
}

/**
 * ReviewAnomalyAlert 컴포넌트
 * 리뷰 평점 급락, 부정 리뷰 급증 등 이상 징후 감지 알림
 */
export function ReviewAnomalyAlert({
  type,
  target,
  targetName,
  metric,
  currentValue,
  expectedValue,
  deviation,
  affectedReviews,
  detectedAt,
  mainIssues,
  sampleReviews,
  detailLink,
  dismissible = true,
  onDismiss,
  onAcknowledge,
  className,
}: ReviewAnomalyAlertProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  
  const style = typeStyles[type]
  const IconComponent = style.icon
  const TargetIcon = targetIcons[target]
  
  // 지표별 레이블
  const metricLabels = {
    rating: '평점',
    nps: 'NPS',
    negative_reviews: '부정 리뷰',
  }
  
  // 대상별 레이블
  const targetLabels = {
    overall: '전체',
    artist: '작가',
    product: '상품',
    country: '국가',
  }
  
  // 언어 플래그
  const languageFlags = {
    ja: '🇯🇵',
    en: '🇺🇸',
  }
  
  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }
  
  const handleAcknowledge = () => {
    onAcknowledge?.()
    setIsVisible(false)
  }
  
  // 메시지 생성
  const getMessage = () => {
    const targetText = targetName ? `${targetLabels[target]} "${targetName}"` : targetLabels[target]
    
    if (metric === 'rating') {
      return `${targetText}의 평점이 급락했습니다`
    } else if (metric === 'nps') {
      return `${targetText}의 NPS가 급락했습니다`
    } else {
      return `${targetText}의 부정 리뷰가 급증했습니다`
    }
  }
  
  if (!isVisible) return null
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          'rounded-xl border-l-4 p-4',
          style.bg,
          style.border,
          style.accentColor,
          className
        )}
      >
        {/* 헤더 */}
        <div className="flex items-start gap-3">
          {/* 아이콘 */}
          <div className={cn(
            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
            style.iconBg,
            style.iconAnimation
          )}>
            <IconComponent className="w-5 h-5 text-white" />
          </div>
          
          {/* 내용 */}
          <div className="flex-1 min-w-0">
            {/* 배지 및 제목 */}
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', style.badge)}>
                {style.badgeText}
              </span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {getMessage()}
              </span>
            </div>
            
            {/* 상세 정보 */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400 mt-2">
              <div className="flex items-center gap-1">
                <TargetIcon className="w-4 h-4" />
                <span>
                  현재 {metricLabels[metric]}: <strong className="text-slate-800 dark:text-slate-200">
                    {metric === 'rating' ? `${currentValue.toFixed(1)}점` : currentValue}
                  </strong>
                </span>
              </div>
              <div>
                예상: <strong>{metric === 'rating' ? `${expectedValue.toFixed(1)}점` : expectedValue}</strong>
              </div>
              <div className={cn(
                'font-semibold',
                deviation < 0 ? 'text-red-600' : 'text-emerald-600'
              )}>
                편차: {deviation > 0 ? '+' : ''}{deviation.toFixed(1)}%
              </div>
              <div>
                영향 리뷰: <strong>{affectedReviews}건</strong>
              </div>
            </div>
            
            {/* 감지 시점 */}
            <div className="text-xs text-slate-500 dark:text-slate-500 mt-2">
              감지 시점: {detectedAt} (전일 기준)
            </div>
            
            {/* 주요 불만 사항 */}
            {mainIssues && mainIssues.length > 0 && (
              <div className="mt-3 p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  주요 불만 사항:
                </div>
                <div className="flex flex-wrap gap-1">
                  {mainIssues.map((issue, idx) => (
                    <span 
                      key={idx}
                      className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full"
                    >
                      {issue}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* 샘플 리뷰 (확장 가능) */}
            {sampleReviews && sampleReviews.length > 0 && (
              <div className="mt-3">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  샘플 리뷰 보기 ({sampleReviews.length}건)
                </button>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 space-y-2">
                        {sampleReviews.slice(0, 3).map((review, idx) => (
                          <div 
                            key={idx}
                            className="p-2 bg-white/70 dark:bg-slate-800/70 rounded-lg border border-slate-200 dark:border-slate-700"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm">{languageFlags[review.language]}</span>
                              <div className="flex items-center gap-0.5">
                                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                  {review.rating}/10
                                </span>
                              </div>
                              <span className="text-xs text-slate-400 dark:text-slate-500">
                                ({review.language === 'ja' ? '일본어' : '영어'} 원문)
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                              {review.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            
            {/* 액션 버튼 */}
            <div className="flex items-center gap-2 mt-3">
              {detailLink && (
                <Link
                  href={detailLink}
                  className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300"
                >
                  상세 분석
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
              {onAcknowledge && (
                <button
                  onClick={handleAcknowledge}
                  className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  확인
                </button>
              )}
            </div>
          </div>
          
          {/* 닫기 버튼 */}
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/50 dark:hover:bg-slate-700/50 text-slate-500 dark:text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ReviewAnomalyAlert

