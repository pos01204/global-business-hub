'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Info,
  ShoppingCart,
  Star,
  Lightbulb
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/Tooltip'

export interface RatingRepurchaseData {
  rating: number        // 1-10
  repurchaseRate: number  // 0-100%
  sampleSize: number
}

export interface ReviewImpactAnalysisProps {
  /** 평점별 재구매율 데이터 */
  ratingRepurchase: RatingRepurchaseData[]
  
  /** 상관계수 */
  correlation: number
  
  /** 통계적 유의성 (p-value) */
  pValue: number
  
  /** 인사이트 */
  insight?: string
  
  /** 기준 기간 */
  period?: string
  
  /** 로딩 상태 */
  isLoading?: boolean
  
  /** 추가 클래스 */
  className?: string
}

/**
 * 상관계수 해석
 */
function interpretCorrelation(r: number): { label: string; color: string } {
  const absR = Math.abs(r)
  if (absR >= 0.7) return { label: '강한 상관', color: 'text-emerald-600' }
  if (absR >= 0.4) return { label: '중간 상관', color: 'text-amber-600' }
  if (absR >= 0.2) return { label: '약한 상관', color: 'text-sky-600' }
  return { label: '거의 없음', color: 'text-slate-500' }
}

/**
 * p-value 해석
 */
function interpretPValue(p: number): { label: string; significant: boolean } {
  if (p < 0.001) return { label: '매우 유의미 (p < 0.001)', significant: true }
  if (p < 0.01) return { label: '유의미 (p < 0.01)', significant: true }
  if (p < 0.05) return { label: '유의미 (p < 0.05)', significant: true }
  return { label: '유의미하지 않음', significant: false }
}

/**
 * ReviewImpactAnalysis 컴포넌트
 * 리뷰 평점이 재구매율에 미치는 영향 시각화
 */
export function ReviewImpactAnalysis({
  ratingRepurchase,
  correlation,
  pValue,
  insight,
  period,
  isLoading = false,
  className,
}: ReviewImpactAnalysisProps) {
  const correlationInfo = interpretCorrelation(correlation)
  const pValueInfo = interpretPValue(pValue)
  
  // 최대 재구매율 (차트 스케일링용)
  const maxRepurchase = Math.max(...ratingRepurchase.map(d => d.repurchaseRate), 10)
  
  if (isLoading) {
    return (
      <div className={cn(
        'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm',
        className
      )}>
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-4" />
          <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
          <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded" />
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-sky-500" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            리뷰-재구매 상관 분석
          </h3>
          <Tooltip content="리뷰 평점이 고객의 재구매율에 미치는 영향을 분석합니다.">
            <Info className="w-4 h-4 text-slate-400 cursor-help" />
          </Tooltip>
        </div>
        {period && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {period}
          </span>
        )}
      </div>
      
      {/* 차트 영역 */}
      <div className="mb-6">
        <div className="flex items-end gap-1 h-48 px-2">
          {ratingRepurchase.map((data, idx) => {
            const height = (data.repurchaseRate / maxRepurchase) * 100
            const barColor = data.rating >= 9 ? 'bg-emerald-500' :
                            data.rating >= 7 ? 'bg-slate-400' :
                            'bg-red-500'
            
            return (
              <Tooltip 
                key={data.rating}
                content={`${data.rating}점: 재구매율 ${data.repurchaseRate.toFixed(1)}% (n=${data.sampleSize})`}
              >
                <div className="flex-1 flex flex-col items-center gap-1">
                  <motion.div
                    className={cn('w-full rounded-t', barColor)}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ duration: 0.5, delay: idx * 0.05 }}
                  />
                  <span className="text-xs text-slate-500">{data.rating}</span>
                </div>
              </Tooltip>
            )
          })}
        </div>
        
        {/* 축 레이블 */}
        <div className="flex justify-between mt-2 px-2">
          <span className="text-xs text-slate-500">평점</span>
          <span className="text-xs text-slate-500">재구매율 (%)</span>
        </div>
      </div>
      
      {/* 통계 요약 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">상관계수</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {correlation.toFixed(2)}
            </span>
            <span className={cn('text-sm font-medium', correlationInfo.color)}>
              ({correlationInfo.label})
            </span>
          </div>
        </div>
        
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart className="w-4 h-4 text-sky-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">통계적 유의성</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-sm font-medium px-2 py-0.5 rounded',
              pValueInfo.significant 
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            )}>
              {pValueInfo.label}
            </span>
          </div>
        </div>
      </div>
      
      {/* 인사이트 */}
      {insight && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {insight}
            </p>
          </div>
        </div>
      )}
      
      {/* NPS 분류별 재구매율 요약 */}
      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          NPS 분류별 재구매율
        </h4>
        <div className="grid grid-cols-3 gap-3">
          {/* Promoters (9-10점) */}
          <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Promoters (9-10점)</p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
              {(() => {
                const promoters = ratingRepurchase.filter(d => d.rating >= 9)
                if (promoters.length === 0) return '0%'
                const avg = promoters.reduce((sum, d) => sum + d.repurchaseRate, 0) / promoters.length
                return `${avg.toFixed(1)}%`
              })()}
            </p>
          </div>
          
          {/* Passives (7-8점) */}
          <div className="text-center p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Passives (7-8점)</p>
            <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
              {(() => {
                const passives = ratingRepurchase.filter(d => d.rating >= 7 && d.rating <= 8)
                if (passives.length === 0) return '0%'
                const avg = passives.reduce((sum, d) => sum + d.repurchaseRate, 0) / passives.length
                return `${avg.toFixed(1)}%`
              })()}
            </p>
          </div>
          
          {/* Detractors (1-6점) */}
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-xs text-red-600 dark:text-red-400 mb-1">Detractors (1-6점)</p>
            <p className="text-lg font-bold text-red-700 dark:text-red-300">
              {(() => {
                const detractors = ratingRepurchase.filter(d => d.rating <= 6)
                if (detractors.length === 0) return '0%'
                const avg = detractors.reduce((sum, d) => sum + d.repurchaseRate, 0) / detractors.length
                return `${avg.toFixed(1)}%`
              })()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReviewImpactAnalysis

