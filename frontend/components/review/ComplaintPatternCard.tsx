'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ChevronDown,
  ChevronUp,
  Package,
  Star,
  Clock,
  MessageSquare,
  Palette,
  DollarSign,
  HelpCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ComplaintPattern {
  /** 키워드 */
  keyword: string
  /** 분류 (배송, 품질, 가격, 서비스 등) */
  category: 'delivery' | 'quality' | 'packaging' | 'size' | 'color' | 'different' | 'price' | 'service' | 'other'
  /** 언급 횟수 */
  count: number
  /** 전체 부정 리뷰 중 비율 */
  percentage: number
  /** 추세 */
  trend: 'up' | 'stable' | 'down'
  /** 예시 리뷰 (원문) */
  sampleReviews?: Array<{
    content: string
    language: 'ja' | 'en'
    rating: number
  }>
}

export interface ComplaintPatternCardProps {
  /** 불만 패턴 목록 */
  patterns: ComplaintPattern[]
  
  /** 분석 기간 */
  period: string
  
  /** 총 부정 리뷰 수 */
  totalNegativeReviews: number
  
  /** 로딩 상태 */
  isLoading?: boolean
  
  /** 전체 보기 링크 */
  detailLink?: string
  
  /** 추가 클래스 */
  className?: string
}

/**
 * 카테고리별 아이콘 및 스타일
 */
const categoryConfig = {
  delivery: { icon: Clock, label: '배송 지연', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  quality: { icon: Star, label: '상품 품질', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  packaging: { icon: Package, label: '포장 상태', color: 'text-violet-600', bg: 'bg-violet-100 dark:bg-violet-900/30' },
  size: { icon: Palette, label: '사이즈 불일치', color: 'text-pink-600', bg: 'bg-pink-100 dark:bg-pink-900/30' },
  color: { icon: Palette, label: '색상 차이', color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/30' },
  different: { icon: AlertCircle, label: '사진과 다름', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
  price: { icon: DollarSign, label: '가격 문제', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  service: { icon: MessageSquare, label: '서비스 불만', color: 'text-sky-600', bg: 'bg-sky-100 dark:bg-sky-900/30' },
  other: { icon: HelpCircle, label: '기타', color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-800' },
}

/**
 * 언어 플래그
 */
const languageFlags = {
  ja: '🇯🇵',
  en: '🇺🇸',
}

/**
 * ComplaintPatternCard 컴포넌트
 * 부정 리뷰에서 반복되는 불만 유형 시각화
 */
export function ComplaintPatternCard({
  patterns,
  period,
  totalNegativeReviews,
  isLoading = false,
  detailLink,
  className,
}: ComplaintPatternCardProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  
  // 트렌드 아이콘
  const getTrendIcon = (trend: 'up' | 'stable' | 'down') => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-red-500" />
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-emerald-500" />
    return <Minus className="w-4 h-4 text-slate-400" />
  }
  
  const getTrendLabel = (trend: 'up' | 'stable' | 'down') => {
    if (trend === 'up') return '증가'
    if (trend === 'down') return '감소'
    return '유지'
  }
  
  if (isLoading) {
    return (
      <div className={cn(
        'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm',
        className
      )}>
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className={cn(
      'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm',
      className
    )}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            불만 패턴 분석
          </h3>
          <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">
            Detractor 기준
          </span>
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          총 {totalNegativeReviews}건 | {period}
        </div>
      </div>
      
      {/* 패턴 목록 */}
      {patterns.length > 0 ? (
        <div className="space-y-3">
          {patterns.map((pattern, idx) => {
            const config = categoryConfig[pattern.category] || categoryConfig.other
            const isExpanded = expandedIdx === idx
            
            return (
              <div 
                key={idx}
                className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden"
              >
                {/* 메인 행 */}
                <div 
                  className={cn(
                    'flex items-center justify-between p-4 cursor-pointer transition-colors',
                    config.bg,
                    'hover:opacity-90'
                  )}
                  onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', config.bg)}>
                      <config.icon className={cn('w-4 h-4', config.color)} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                          {idx + 1}. {pattern.keyword}
                        </span>
                        <span className={cn('text-xs', config.color)}>
                          ({config.label})
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        언급: {pattern.count}건 ({pattern.percentage.toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-sm">
                      {getTrendIcon(pattern.trend)}
                      <span className={cn(
                        pattern.trend === 'up' ? 'text-red-600' :
                        pattern.trend === 'down' ? 'text-emerald-600' : 'text-slate-500'
                      )}>
                        {getTrendLabel(pattern.trend)}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>
                
                {/* 샘플 리뷰 (확장) */}
                <AnimatePresence>
                  {isExpanded && pattern.sampleReviews && pattern.sampleReviews.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                          샘플 리뷰 (원문)
                        </p>
                        <div className="space-y-2">
                          {pattern.sampleReviews.slice(0, 3).map((review, reviewIdx) => (
                            <div 
                              key={reviewIdx}
                              className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm">{languageFlags[review.language]}</span>
                                <div className="flex items-center gap-0.5">
                                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                  <span className="text-xs text-slate-600 dark:text-slate-400">
                                    {review.rating}/10
                                  </span>
                                </div>
                                <span className="text-xs text-slate-400">
                                  ({review.language === 'ja' ? '일본어' : '영어'})
                                </span>
                              </div>
                              <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                                "{review.content}"
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>분석할 부정 리뷰가 없습니다.</p>
        </div>
      )}
      
      {/* 전체 보기 링크 */}
      {detailLink && patterns.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-center">
          <a 
            href={detailLink}
            className="text-sm text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-medium"
          >
            전체 패턴 보기 →
          </a>
        </div>
      )}
    </div>
  )
}

export default ComplaintPatternCard

