'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate } from '@/lib/formatters'

export interface ForecastFactors {
  /** 최근 7일 일평균 GMV */
  avgDailyGMV: number
  /** 시즌 가중치 (%) */
  seasonWeight: number
  /** 전년 동월 성장률 (%) */
  yoyGrowth: number
}

export interface ForecastData {
  /** 예측 GMV */
  predicted: number
  /** 하한 (95% CI) */
  lowerBound: number
  /** 상한 (95% CI) */
  upperBound: number
  /** 신뢰도 (%) */
  confidence: number
}

export interface MonthlyForecastProps {
  /** 데이터 기준일 (어제) */
  referenceDate: string
  
  /** 현재 월 (YYYY-MM 형식) */
  currentMonth: string
  
  /** 현재까지 실적 */
  actualToDate: number
  
  /** 경과 일수 */
  daysElapsed: number
  
  /** 총 일수 */
  totalDays: number
  
  /** 예측 정보 */
  forecast: ForecastData
  
  /** 월 목표 */
  target: number
  
  /** 예측 달성률 (%) */
  achievementRate: number
  
  /** 예측 근거 */
  factors: ForecastFactors
  
  /** 권장 액션 */
  recommendation?: string
  
  /** 로딩 상태 */
  isLoading?: boolean
  
  /** 추가 클래스 */
  className?: string
}

/**
 * MonthlyForecast 컴포넌트
 * 
 * 금월 GMV 예측값 및 목표 달성률을 시각화합니다.
 * 어제까지의 실적을 기반으로 남은 기간의 GMV를 예측합니다.
 * 
 * @example
 * ```tsx
 * <MonthlyForecast
 *   referenceDate="2024-12-18"
 *   currentMonth="2024-12"
 *   actualToDate={15620000000}
 *   daysElapsed={18}
 *   totalDays={31}
 *   forecast={{
 *     predicted: 26850000000,
 *     lowerBound: 24100000000,
 *     upperBound: 29600000000,
 *     confidence: 85
 *   }}
 *   target={25000000000}
 *   achievementRate={107.4}
 *   factors={{
 *     avgDailyGMV: 890000000,
 *     seasonWeight: 15,
 *     yoyGrowth: 18.2
 *   }}
 *   recommendation="목표 초과 달성 예상 - 재고 확보 점검 권장"
 * />
 * ```
 */
export function MonthlyForecast({
  referenceDate,
  currentMonth,
  actualToDate,
  daysElapsed,
  totalDays,
  forecast,
  target,
  achievementRate,
  factors,
  recommendation,
  isLoading = false,
  className,
}: MonthlyForecastProps) {
  // 진행률 계산
  const progressPercent = (daysElapsed / totalDays) * 100
  const actualPercent = (actualToDate / target) * 100
  const forecastPercent = (forecast.predicted / target) * 100
  
  // 상태 판단
  const isOnTrack = achievementRate >= 100
  const isAtRisk = achievementRate < 90
  const isExceeding = achievementRate > 110

  // 월 이름 추출
  const monthName = currentMonth.split('-')[1]

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
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-full" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            ))}
          </div>
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
          <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center shadow-sm">
            <Target className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">
              {monthName}월 GMV 예측
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              어제까지 실적 기반 예측
            </p>
          </div>
        </div>
        
        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">
          <Calendar className="w-3 h-3" aria-hidden="true" />
          {formatDate(referenceDate, 'short')} 기준
        </span>
      </div>

      {/* 프로그레스 바 */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            현재까지 실적 ({daysElapsed}/{totalDays}일)
          </span>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {actualPercent.toFixed(1)}%
          </span>
        </div>
        
        {/* 복합 프로그레스 바 */}
        <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
          {/* 현재 실적 */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(actualPercent, 100)}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full absolute top-0 left-0"
          />
          
          {/* 예측 영역 (현재 실적 이후) */}
          {forecastPercent > actualPercent && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(forecastPercent - actualPercent, 100 - actualPercent)}%` }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="h-full bg-violet-300/50 dark:bg-violet-400/30 rounded-r-full absolute top-0"
              style={{ left: `${Math.min(actualPercent, 100)}%` }}
            />
          )}
          
          {/* 100% 기준선 */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-slate-400 dark:bg-slate-500 z-10" 
            style={{ left: 'calc(100% - 1px)' }} 
          />
        </div>
        
        {/* 범례 */}
        <div className="flex items-center justify-between mt-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-violet-500" />
            <span className="text-slate-600 dark:text-slate-400">
              {formatCurrency(actualToDate)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-violet-300/50" />
            <span className="text-slate-500 dark:text-slate-500">
              예측: {formatCurrency(forecast.predicted)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="text-slate-500 dark:text-slate-500">
              목표: {formatCurrency(target)}
            </span>
          </div>
        </div>
      </div>

      {/* 핵심 지표 */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-center">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">월 목표</div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {formatCurrency(target)}
          </div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-center">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">예측 달성률</div>
          <div className={cn(
            'text-sm font-bold flex items-center justify-center gap-1',
            isExceeding ? 'text-emerald-600 dark:text-emerald-400' :
            isOnTrack ? 'text-blue-600 dark:text-blue-400' :
            isAtRisk ? 'text-red-600 dark:text-red-400' :
            'text-amber-600 dark:text-amber-400'
          )}>
            {isExceeding && <TrendingUp className="w-3.5 h-3.5" />}
            {isOnTrack && !isExceeding && <CheckCircle2 className="w-3.5 h-3.5" />}
            {!isOnTrack && <AlertCircle className="w-3.5 h-3.5" />}
            {achievementRate.toFixed(1)}%
          </div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-center">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">신뢰도</div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {forecast.confidence}%
          </div>
        </div>
      </div>

      {/* 예측 신뢰구간 */}
      <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
        <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
          95% 신뢰구간
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">
            {formatCurrency(forecast.lowerBound)}
          </span>
          <span className="text-violet-600 dark:text-violet-400 font-bold">
            {formatCurrency(forecast.predicted)}
          </span>
          <span className="text-slate-600 dark:text-slate-400">
            {formatCurrency(forecast.upperBound)}
          </span>
        </div>
        <div className="mt-2 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden relative">
          {/* 신뢰구간 범위 */}
          <div 
            className="absolute h-full bg-violet-200 dark:bg-violet-800 rounded-full"
            style={{
              left: `${(forecast.lowerBound / forecast.upperBound) * 50}%`,
              right: `${50 - (forecast.predicted / forecast.upperBound) * 50}%`,
            }}
          />
          {/* 예측값 마커 */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-violet-500 rounded-full"
            style={{ left: `${(forecast.predicted / forecast.upperBound) * 100}%` }}
          />
        </div>
      </div>

      {/* 예측 근거 */}
      <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-100 dark:border-violet-800 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" aria-hidden="true" />
          <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
            예측 근거
          </span>
        </div>
        <ul className="space-y-1.5 text-xs text-violet-600 dark:text-violet-400">
          <li className="flex items-start gap-2">
            <span className="text-violet-400 mt-0.5">•</span>
            최근 7일 일평균 GMV: {formatCurrency(factors.avgDailyGMV)}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-violet-400 mt-0.5">•</span>
            시즌 가중치 적용: {factors.seasonWeight >= 0 ? '+' : ''}{factors.seasonWeight}%
          </li>
          <li className="flex items-start gap-2">
            <span className="text-violet-400 mt-0.5">•</span>
            전년 동월 성장률 반영: {factors.yoyGrowth >= 0 ? '+' : ''}{factors.yoyGrowth}%
          </li>
        </ul>
      </div>

      {/* 권장 액션 */}
      {recommendation && (
        <div className={cn(
          'p-3 rounded-xl flex items-start gap-2',
          isExceeding 
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800' 
            : isOnTrack
            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800'
            : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800'
        )}>
          {isExceeding ? (
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : isOnTrack ? (
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          )}
          <span className={cn(
            'text-xs font-medium',
            isExceeding 
              ? 'text-emerald-700 dark:text-emerald-300' 
              : isOnTrack
              ? 'text-blue-700 dark:text-blue-300'
              : 'text-amber-700 dark:text-amber-300'
          )}>
            {recommendation}
          </span>
        </div>
      )}
    </div>
  )
}

export default MonthlyForecast

