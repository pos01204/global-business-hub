'use client'

import React, { useMemo } from 'react'
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
} from 'recharts'
import { format } from 'date-fns'
import { chartTheme } from '@/lib/chart-theme'
import { CustomTooltip } from './ChartTooltip'

export interface GMVTrendData {
  date: string
  gmv: number
  orders: number
  gmvMA7?: number
  ordersMA7?: number
}

export interface GMVTrendChartProps {
  data: GMVTrendData[]
  height?: number
  className?: string
  showMovingAverage?: boolean
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

export function GMVTrendChart({
  data,
  height = 400,
  className,
  showMovingAverage = true,
}: GMVTrendChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      dateFormatted: formatDate(item.date),
    }))
  }, [data])

  // 범례 클릭 핸들러 (나중에 구현)
  const handleLegendClick = (e: any) => {
    // Phase 2에서 구현
  }

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

