'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Calendar, Sparkles, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 미니 스파크라인 컴포넌트
 * 7일간의 데이터를 작은 라인 차트로 표시
 */
function Sparkline({ 
  data, 
  trend,
  width = 60,
  height = 24,
}: { 
  data: number[]
  trend: 'up' | 'down' | 'stable'
  width?: number
  height?: number
}) {
  if (data.length < 2) return null
  
  const padding = 2
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - 2 * padding)
    const y = height - padding - ((value - min) / range) * (height - 2 * padding)
    return `${x},${y}`
  }).join(' ')
  
  const strokeColor = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#64748b'
  
  return (
    <svg 
      width={width} 
      height={height} 
      className="overflow-visible"
      role="img"
      aria-label={`7일 트렌드: ${trend === 'up' ? '상승' : trend === 'down' ? '하락' : '보합'}`}
    >
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 마지막 점 강조 */}
      <circle
        cx={width - padding}
        cy={height - padding - ((data[data.length - 1] - min) / range) * (height - 2 * padding)}
        r="3"
        fill={strokeColor}
      />
    </svg>
  )
}

export interface WeeklyMetric {
  /** 지표명 */
  name: string
  
  /** 7일간 값 (최신순: [7일전, 6일전, ..., 어제]) */
  values: number[]
  
  /** 트렌드 방향 */
  trend: 'up' | 'down' | 'stable'
  
  /** 주간 변화율 (%) - 7일 전 대비 어제 */
  changePercent: number
  
  /** 스파크라인용 정규화 값 (0~1) - 선택적 */
  sparkline?: number[]
}

export interface WeeklyTrendSummaryProps {
  /** 데이터 기준일 (어제) */
  referenceDate: string
  
  /** 주간 범위 */
  weekRange: {
    start: string  // "12/12" 형식
    end: string    // "12/18" 형식
  }
  
  /** 지표별 데이터 */
  metrics: WeeklyMetric[]
  
  /** 주간 하이라이트 */
  highlights?: string[]
  
  /** 로딩 상태 */
  isLoading?: boolean
  
  /** 추가 클래스 */
  className?: string
}

/**
 * WeeklyTrendSummary 컴포넌트
 * 
 * 최근 7일간의 주요 지표 트렌드를 요약하여 표시합니다.
 * 각 지표별로 스파크라인과 변화율을 표시합니다.
 * 
 * @example
 * ```tsx
 * <WeeklyTrendSummary
 *   referenceDate="2024-12-18"
 *   weekRange={{ start: "12/12", end: "12/18" }}
 *   metrics={[
 *     { name: 'GMV', values: [100, 105, 110, 108, 115, 120, 125], trend: 'up', changePercent: 8.3 },
 *     { name: '주문', values: [50, 52, 48, 55, 53, 58, 60], trend: 'up', changePercent: 5.2 },
 *   ]}
 *   highlights={['GMV 7일 연속 상승세', '신규 고객 유입 급증']}
 * />
 * ```
 */
export function WeeklyTrendSummary({
  referenceDate,
  weekRange,
  metrics,
  highlights = [],
  isLoading = false,
  className,
}: WeeklyTrendSummaryProps) {
  // 트렌드 아이콘 선택
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return TrendingUp
      case 'down': return TrendingDown
      default: return Minus
    }
  }
  
  // 트렌드 색상 선택
  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-emerald-600 dark:text-emerald-400'
      case 'down': return 'text-red-600 dark:text-red-400'
      default: return 'text-slate-500 dark:text-slate-400'
    }
  }
  
  // 트렌드 라벨
  const getTrendLabel = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '↗'
      case 'down': return '↘'
      default: return '→'
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 빈 상태
  if (metrics.length === 0) {
    return (
      <div className={cn(
        'bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 lg:p-6 shadow-sm',
        className
      )}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center shadow-sm">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">주간 트렌드</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">최근 7일 지표 흐름</p>
          </div>
        </div>
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">데이터가 없습니다</p>
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
          <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center shadow-sm">
            <TrendingUp className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">주간 트렌드</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              최근 7일 지표 흐름
            </p>
          </div>
        </div>
        
        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">
          <Calendar className="w-3 h-3" aria-hidden="true" />
          {weekRange.start} ~ {weekRange.end}
        </span>
      </div>

      {/* 지표 카드 그리드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {metrics.map((metric, index) => {
          const TrendIcon = getTrendIcon(metric.trend)
          const sparklineData = metric.sparkline || metric.values
          
          return (
            <motion.div
              key={metric.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
            >
              {/* 지표명 + 변화율 */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {metric.name}
                </span>
                <span className={cn(
                  'text-xs font-bold flex items-center gap-0.5',
                  getTrendColor(metric.trend)
                )}>
                  {getTrendLabel(metric.trend)}
                  {metric.changePercent >= 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
                </span>
              </div>
              
              {/* 스파크라인 */}
              <div className="flex items-center justify-center">
                <Sparkline 
                  data={sparklineData} 
                  trend={metric.trend} 
                />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* 주간 하이라이트 */}
      {highlights.length > 0 && (
        <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl border border-cyan-100 dark:border-cyan-800">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
            <span className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">
              주간 하이라이트
            </span>
          </div>
          <ul className="space-y-1.5">
            {highlights.map((highlight, index) => (
              <li 
                key={index} 
                className="text-xs text-cyan-600 dark:text-cyan-400 flex items-start gap-2"
              >
                <span className="text-cyan-400 mt-0.5">•</span>
                {highlight}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default WeeklyTrendSummary

