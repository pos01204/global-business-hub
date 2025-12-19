'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  FileText,
  Image,
  ThumbsUp,
  MessageCircle,
  Award
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/Tooltip'

export interface ReviewQualityScoreProps {
  /** 전체 품질 점수 (0-100) */
  score: number
  
  /** 등급 */
  grade: 'S' | 'A' | 'B' | 'C' | 'D'
  
  /** 구성 요소 */
  components: {
    /** 상세 리뷰 비율 (100자 이상) */
    detailRate: number
    /** 이미지 포함 비율 */
    imageRate: number
    /** Promoter 비율 */
    promoterRate: number
    /** 응답 완료 비율 (선택) */
    responseRate?: number
  }
  
  /** 전기간 대비 변화 */
  change?: number
  
  /** 트렌드 */
  trend?: 'up' | 'stable' | 'down'
  
  /** 기준 기간 */
  period?: string
  
  /** 로딩 상태 */
  isLoading?: boolean
  
  /** 추가 클래스 */
  className?: string
}

/**
 * 등급별 스타일
 */
const gradeStyles = {
  S: {
    bg: 'bg-gradient-to-br from-amber-400 to-orange-500',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-400',
    label: '최우수',
  },
  A: {
    bg: 'bg-gradient-to-br from-emerald-400 to-teal-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-400',
    label: '우수',
  },
  B: {
    bg: 'bg-gradient-to-br from-sky-400 to-blue-500',
    text: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-400',
    label: '양호',
  },
  C: {
    bg: 'bg-gradient-to-br from-slate-400 to-slate-500',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-400',
    label: '보통',
  },
  D: {
    bg: 'bg-gradient-to-br from-red-400 to-rose-500',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-400',
    label: '개선필요',
  },
}

/**
 * ReviewQualityScore 컴포넌트
 * 리뷰 품질을 종합 점수로 시각화
 */
export function ReviewQualityScore({
  score,
  grade,
  components,
  change,
  trend = 'stable',
  period,
  isLoading = false,
  className,
}: ReviewQualityScoreProps) {
  const gradeStyle = gradeStyles[grade]
  
  // 트렌드 아이콘
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-slate-400'
  
  // 구성요소 설정
  const componentItems = [
    {
      key: 'detailRate',
      label: '상세 리뷰',
      value: components.detailRate,
      icon: FileText,
      tooltip: '100자 이상의 상세한 리뷰 비율',
      color: 'bg-violet-500',
    },
    {
      key: 'imageRate',
      label: '이미지 포함',
      value: components.imageRate,
      icon: Image,
      tooltip: '이미지가 포함된 리뷰 비율',
      color: 'bg-pink-500',
    },
    {
      key: 'promoterRate',
      label: 'Promoter',
      value: components.promoterRate,
      icon: ThumbsUp,
      tooltip: '9-10점을 준 추천 고객 비율',
      color: 'bg-emerald-500',
    },
  ]
  
  // 응답률이 있으면 추가
  if (components.responseRate !== undefined) {
    componentItems.push({
      key: 'responseRate',
      label: '응답 완료',
      value: components.responseRate,
      icon: MessageCircle,
      tooltip: '작가가 응답한 리뷰 비율',
      color: 'bg-sky-500',
    })
  }
  
  if (isLoading) {
    return (
      <div className={cn(
        'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm',
        className
      )}>
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-4" />
          <div className="flex items-center justify-center py-8">
            <div className="w-32 h-32 rounded-full bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="grid grid-cols-4 gap-4 mt-4">
            {[1, 2, 3, 4].map((i) => (
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
          <Award className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            리뷰 품질 점수
          </h3>
        </div>
        {period && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {period}
          </span>
        )}
      </div>
      
      {/* 메인 점수 영역 */}
      <div className="flex items-center justify-center py-6">
        <div className="relative">
          {/* 원형 프로그레스 */}
          <svg className="w-40 h-40 transform -rotate-90">
            {/* 배경 원 */}
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              className="text-slate-200 dark:text-slate-700"
            />
            {/* 진행 원 */}
            <motion.circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="url(#scoreGradient)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 70}
              initial={{ strokeDashoffset: 2 * Math.PI * 70 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 70 * (1 - score / 100) }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
            {/* 그라데이션 정의 */}
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={grade === 'S' ? '#f59e0b' : grade === 'A' ? '#10b981' : grade === 'B' ? '#0ea5e9' : grade === 'C' ? '#64748b' : '#ef4444'} />
                <stop offset="100%" stopColor={grade === 'S' ? '#f97316' : grade === 'A' ? '#14b8a6' : grade === 'B' ? '#3b82f6' : grade === 'C' ? '#475569' : '#f43f5e'} />
              </linearGradient>
            </defs>
          </svg>
          
          {/* 중앙 점수 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span 
              className="text-4xl font-bold text-slate-800 dark:text-slate-100"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              {score}
            </motion.span>
            <span className="text-sm text-slate-500 dark:text-slate-400">/ 100</span>
          </div>
        </div>
        
        {/* 등급 및 변화 */}
        <div className="ml-6 space-y-3">
          {/* 등급 배지 */}
          <div className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold',
            gradeStyle.bg
          )}>
            <span className="text-2xl">{grade}</span>
            <span className="text-sm opacity-90">{gradeStyle.label}</span>
          </div>
          
          {/* 변화율 */}
          {change !== undefined && (
            <div className={cn('flex items-center gap-1', trendColor)}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-sm font-medium">
                {change > 0 ? '+' : ''}{change.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                vs 전기간
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* 구성요소 */}
      <div className={cn(
        'grid gap-3 mt-4',
        componentItems.length === 4 ? 'grid-cols-4' : 'grid-cols-3'
      )}>
        {componentItems.map((item) => (
          <Tooltip key={item.key} content={item.tooltip}>
            <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-help">
              <div className="flex items-center justify-center mb-2">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', item.color)}>
                  <item.icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                {item.label}
              </div>
              <div className="font-bold text-slate-800 dark:text-slate-100">
                {item.value.toFixed(0)}%
              </div>
              {/* 미니 프로그레스 바 */}
              <div className="mt-2 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className={cn('h-full rounded-full', item.color)}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(item.value, 100)}%` }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                />
              </div>
            </div>
          </Tooltip>
        ))}
      </div>
      
      {/* 계산 공식 안내 */}
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          품질 점수 = 상세리뷰(25%) + 이미지(20%) + Promoter(35%) + 응답(20%)
        </p>
      </div>
    </div>
  )
}

export default ReviewQualityScore

