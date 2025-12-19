'use client'

import React, { useMemo, useState } from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceArea,
  ReferenceLine,
} from 'recharts'
import { format } from 'date-fns'
import { chartTheme } from '@/lib/chart-theme'
import { CustomTooltip } from './ChartTooltip'
import { cn } from '@/lib/utils'

export interface GMVTrendData {
  date: string
  gmv: number
  orders: number
  gmvMA7?: number
  ordersMA7?: number
  /** 전년 동기 GMV (선택적) */
  gmvLastYear?: number
}

/**
 * 시즌 패턴 인터페이스
 */
export interface SeasonPattern {
  /** 패턴 유형 */
  type: 'peak' | 'trough' | 'event'
  /** 라벨 */
  label: string
  /** 이모지 아이콘 */
  emoji?: string
  /** 시작일 (YYYY-MM-DD) */
  startDate: string
  /** 종료일 (YYYY-MM-DD) */
  endDate: string
  /** 전년 동기 대비 (%) */
  yoyComparison?: number
}

export interface GMVTrendChartProps {
  data: GMVTrendData[]
  height?: number
  className?: string
  showMovingAverage?: boolean
  /** 시즌 패턴 데이터 */
  seasonPatterns?: SeasonPattern[]
  /** 시즌 패턴 표시 여부 */
  showSeasonPatterns?: boolean
  /** 전년 동기 데이터 */
  lastYearData?: { date: string; value: number }[]
  /** 전년 동기 라인 표시 여부 */
  showYoYComparison?: boolean
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `₩${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `₩${(value / 1000).toFixed(0)}K`
  }
  return `₩${value.toLocaleString()}`
}

const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr)
    return format(date, 'MM/dd')
  } catch {
    return dateStr
  }
}

/**
 * 시즌 패턴 유형별 색상 설정
 */
const seasonPatternColors = {
  peak: {
    fill: 'rgba(16, 185, 129, 0.1)',    // emerald-500/10
    stroke: 'rgba(16, 185, 129, 0.3)',
    label: '#10b981',
  },
  trough: {
    fill: 'rgba(245, 158, 11, 0.1)',    // amber-500/10
    stroke: 'rgba(245, 158, 11, 0.3)',
    label: '#f59e0b',
  },
  event: {
    fill: 'rgba(59, 130, 246, 0.1)',    // blue-500/10
    stroke: 'rgba(59, 130, 246, 0.3)',
    label: '#3b82f6',
  },
}

export function GMVTrendChart({
  data,
  height = 400,
  className,
  showMovingAverage = true,
  seasonPatterns = [],
  showSeasonPatterns = false,
  lastYearData = [],
  showYoYComparison = false,
}: GMVTrendChartProps) {
  const [hoveredPattern, setHoveredPattern] = useState<string | null>(null)

  // 전년 동기 데이터를 현재 데이터에 병합
  const chartData = useMemo(() => {
    const lastYearMap = new Map(
      lastYearData.map(item => [item.date, item.value])
    )
    
    return data.map((item) => {
      // 전년 동기 날짜 계산 (1년 전)
      const currentDate = new Date(item.date)
      const lastYearDate = new Date(currentDate)
      lastYearDate.setFullYear(lastYearDate.getFullYear() - 1)
      const lastYearDateStr = lastYearDate.toISOString().split('T')[0]
      
      return {
        ...item,
        dateFormatted: formatDate(item.date),
        gmvLastYear: item.gmvLastYear || lastYearMap.get(lastYearDateStr) || null,
      }
    })
  }, [data, lastYearData])

  // 범례 클릭 핸들러 (나중에 구현)
  const handleLegendClick = (e: any) => {
    // Phase 2에서 구현
  }

  // 시즌 패턴 필터링 (현재 데이터 범위 내)
  const visiblePatterns = useMemo(() => {
    if (!showSeasonPatterns || seasonPatterns.length === 0) return []
    
    const dataStartDate = data[0]?.date
    const dataEndDate = data[data.length - 1]?.date
    
    if (!dataStartDate || !dataEndDate) return []
    
    return seasonPatterns.filter(pattern => {
      // 패턴이 데이터 범위와 겹치는지 확인
      return pattern.startDate <= dataEndDate && pattern.endDate >= dataStartDate
    })
  }, [seasonPatterns, showSeasonPatterns, data])

  return (
    <div className={className} style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gmvGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F78C3A" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#F78C3A" stopOpacity={0.3} />
            </linearGradient>
            <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.3} />
            </linearGradient>
          </defs>
          
          <CartesianGrid
            strokeDasharray={chartTheme.grid.strokeDasharray}
            stroke={chartTheme.grid.stroke}
            opacity={chartTheme.grid.opacity}
          />
          
          <XAxis
            dataKey="date"
            tick={{ fill: '#64748B', fontSize: 12 }}
            axisLine={{ stroke: '#E2E8F0' }}
            tickFormatter={formatDate}
          />
          
          {/* 좌측 Y축: GMV */}
          <YAxis
            yAxisId="left"
            orientation="left"
            tick={{ fill: '#64748B', fontSize: 12 }}
            axisLine={{ stroke: '#E2E8F0' }}
            tickFormatter={(value) => {
              if (value >= 1000000) return `₩${(value / 1000000).toFixed(1)}M`
              if (value >= 1000) return `₩${(value / 1000).toFixed(0)}K`
              return `₩${value}`
            }}
            label={{ value: 'GMV', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748B' } }}
          />
          
          {/* 우측 Y축: 주문 건수 */}
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: '#64748B', fontSize: 12 }}
            axisLine={{ stroke: '#E2E8F0' }}
            label={{ value: '주문 건수', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#64748B' } }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          {/* GMV 바 차트 */}
          <Bar
            yAxisId="left"
            dataKey="gmv"
            name="GMV"
            fill="url(#gmvGradient)"
            radius={[4, 4, 0, 0]}
            animationDuration={chartTheme.animation.duration}
          />
          
          {/* 주문 건수 바 차트 */}
          <Bar
            yAxisId="right"
            dataKey="orders"
            name="주문 건수"
            fill="url(#ordersGradient)"
            radius={[4, 4, 0, 0]}
            animationDuration={chartTheme.animation.duration}
          />
          
          {/* GMV 7일 이동평균 라인 */}
          {showMovingAverage && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="gmvMA7"
              name="GMV (7일 이동평균)"
              stroke="#D97706"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#D97706' }}
              strokeDasharray="0"
            />
          )}
          
          {/* 주문 건수 7일 이동평균 라인 */}
          {showMovingAverage && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="ordersMA7"
              name="주문 건수 (7일 이동평균)"
              stroke="#1E40AF"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#1E40AF' }}
              strokeDasharray="0"
            />
          )}

          {/* 전년 동기 GMV 비교 라인 */}
          {showYoYComparison && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="gmvLastYear"
              name="전년 동기 GMV"
              stroke="#94a3b8"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 3, fill: '#94a3b8' }}
              connectNulls
            />
          )}

          {/* 시즌 패턴 오버레이 */}
          {showSeasonPatterns && visiblePatterns.map((pattern, index) => {
            const colors = seasonPatternColors[pattern.type]
            
            return (
              <ReferenceArea
                key={`season-${index}`}
                x1={pattern.startDate}
                x2={pattern.endDate}
                yAxisId="left"
                fill={colors.fill}
                stroke={colors.stroke}
                strokeOpacity={0.5}
                fillOpacity={hoveredPattern === pattern.label ? 0.3 : 0.15}
                onMouseEnter={() => setHoveredPattern(pattern.label)}
                onMouseLeave={() => setHoveredPattern(null)}
                label={{
                  value: `${pattern.emoji || ''} ${pattern.label}`,
                  position: 'top',
                  fill: colors.label,
                  fontSize: 11,
                  fontWeight: 500,
                }}
              />
            )
          })}
          
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="rect"
            onClick={handleLegendClick}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

