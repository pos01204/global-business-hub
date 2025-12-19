'use client'

import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip } from './Tooltip'

/**
 * 성장률 배지 스타일 설정
 * - dod: 전일 대비 (어제 vs 그저께)
 * - wow: 전주 동일 대비 (어제 vs 7일 전)
 * - mom: 전월 동기 대비 (어제 vs 30일 전)
 * - yoy: 전년 동기 대비 (어제 vs 365일 전)
 */
const badgeStyles = {
  dod: {
    bg: 'bg-slate-100 dark:bg-slate-700',
    text: 'text-slate-700 dark:text-slate-300',
    label: '전일비',
    tooltip: '어제 vs 그저께',
  },
  wow: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    label: '전주비',
    tooltip: '어제 vs 7일 전',
  },
  mom: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
    label: '전월비',
    tooltip: '어제 vs 30일 전',
  },
  yoy: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    label: '전년비',
    tooltip: '어제 vs 365일 전',
  },
}

const sizeStyles = {
  xs: 'text-[9px] px-1 py-0.5 gap-0.5',
  sm: 'text-[10px] px-1.5 py-0.5 gap-0.5',
  md: 'text-xs px-2 py-1 gap-1',
}

const iconSizes = {
  xs: 'w-2 h-2',
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
}

export interface GrowthBadgesProps {
  /** 전일 대비 성장률 (DoD) - 어제 vs 그저께 */
  dod?: number
  
  /** 전주 동일 대비 성장률 (WoW) - 어제 vs 7일 전 */
  wow?: number
  
  /** 전월 동기 대비 성장률 (MoM) - 어제 vs 30일 전 */
  mom?: number
  
  /** 전년 동기 대비 성장률 (YoY) - 어제 vs 365일 전 */
  yoy?: number
  
  /** 표시할 배지 개수 (기본: 2) */
  maxBadges?: number
  
  /** 크기 */
  size?: 'xs' | 'sm' | 'md'
  
  /** 레이블 표시 여부 */
  showLabel?: boolean
  
  /** 세로 배치 여부 */
  vertical?: boolean
  
  /** 추가 클래스 */
  className?: string
}

/**
 * GrowthBadges 컴포넌트
 * 
 * KPI 카드 내에서 다중 기간 성장률을 배지 형태로 표시합니다.
 * 모든 비교는 "어제" 기준으로 수행됩니다.
 * 
 * @example
 * ```tsx
 * <GrowthBadges
 *   dod={8.3}
 *   wow={5.2}
 *   mom={12.1}
 *   yoy={23.5}
 *   maxBadges={2}
 *   size="sm"
 * />
 * ```
 */
export function GrowthBadges({
  dod,
  wow,
  mom,
  yoy,
  maxBadges = 2,
  size = 'sm',
  showLabel = true,
  vertical = false,
  className,
}: GrowthBadgesProps) {
  // 배지 데이터 구성 (우선순위: 전일비 → 전주비 → 전월비 → 전년비)
  const badges: { key: keyof typeof badgeStyles; value: number }[] = []
  
  if (dod !== undefined && !isNaN(dod)) badges.push({ key: 'dod', value: dod })
  if (wow !== undefined && !isNaN(wow)) badges.push({ key: 'wow', value: wow })
  if (mom !== undefined && !isNaN(mom)) badges.push({ key: 'mom', value: mom })
  if (yoy !== undefined && !isNaN(yoy)) badges.push({ key: 'yoy', value: yoy })

  const displayBadges = badges.slice(0, maxBadges)

  // 값 포맷팅
  const formatValue = (value: number) => {
    const prefix = value > 0 ? '+' : ''
    return `${prefix}${value.toFixed(1)}%`
  }

  // 트렌드 아이콘 선택
  const getTrendIcon = (value: number) => {
    if (value > 0.5) return TrendingUp
    if (value < -0.5) return TrendingDown
    return Minus
  }

  // 트렌드 색상 선택
  const getTrendColor = (value: number) => {
    if (value > 0.5) return 'text-emerald-600 dark:text-emerald-400'
    if (value < -0.5) return 'text-red-600 dark:text-red-400'
    return 'text-slate-500 dark:text-slate-400'
  }

  if (displayBadges.length === 0) return null

  return (
    <div 
      className={cn(
        'flex items-center gap-1',
        vertical && 'flex-col items-start',
        className
      )}
      role="group"
      aria-label="성장률 지표"
    >
      {displayBadges.map(({ key, value }) => {
        const style = badgeStyles[key]
        const TrendIcon = getTrendIcon(value)
        
        return (
          <Tooltip 
            key={key} 
            content={`${style.tooltip}: ${formatValue(value)}`}
          >
            <div 
              className={cn(
                'inline-flex items-center rounded-full font-medium cursor-help transition-all duration-200',
                'hover:scale-105 hover:shadow-sm',
                style.bg,
                style.text,
                sizeStyles[size]
              )}
              role="status"
              aria-label={`${style.label} ${formatValue(value)}`}
            >
              {showLabel && (
                <span className="font-semibold">{style.label}</span>
              )}
              <TrendIcon 
                className={cn(
                  'flex-shrink-0',
                  iconSizes[size],
                  getTrendColor(value)
                )} 
                aria-hidden="true"
              />
              <span className={getTrendColor(value)}>
                {formatValue(value)}
              </span>
            </div>
          </Tooltip>
        )
      })}
    </div>
  )
}

/**
 * 단일 성장률 배지 컴포넌트
 * 개별 배지를 직접 렌더링할 때 사용
 */
export interface SingleGrowthBadgeProps {
  type: 'dod' | 'wow' | 'mom' | 'yoy'
  value: number
  size?: 'xs' | 'sm' | 'md'
  showLabel?: boolean
  className?: string
}

export function SingleGrowthBadge({
  type,
  value,
  size = 'sm',
  showLabel = true,
  className,
}: SingleGrowthBadgeProps) {
  const style = badgeStyles[type]
  
  const formatValue = (val: number) => {
    const prefix = val > 0 ? '+' : ''
    return `${prefix}${val.toFixed(1)}%`
  }

  const getTrendIcon = (val: number) => {
    if (val > 0.5) return TrendingUp
    if (val < -0.5) return TrendingDown
    return Minus
  }

  const getTrendColor = (val: number) => {
    if (val > 0.5) return 'text-emerald-600 dark:text-emerald-400'
    if (val < -0.5) return 'text-red-600 dark:text-red-400'
    return 'text-slate-500 dark:text-slate-400'
  }

  const TrendIcon = getTrendIcon(value)

  return (
    <Tooltip content={`${style.tooltip}: ${formatValue(value)}`}>
      <div 
        className={cn(
          'inline-flex items-center rounded-full font-medium cursor-help transition-all duration-200',
          'hover:scale-105 hover:shadow-sm',
          style.bg,
          style.text,
          sizeStyles[size],
          className
        )}
        role="status"
        aria-label={`${style.label} ${formatValue(value)}`}
      >
        {showLabel && (
          <span className="font-semibold">{style.label}</span>
        )}
        <TrendIcon 
          className={cn(
            'flex-shrink-0',
            iconSizes[size],
            getTrendColor(value)
          )} 
          aria-hidden="true"
        />
        <span className={getTrendColor(value)}>
          {formatValue(value)}
        </span>
      </div>
    </Tooltip>
  )
}

export default GrowthBadges

