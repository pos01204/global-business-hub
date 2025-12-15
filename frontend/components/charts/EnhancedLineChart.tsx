'use client'

import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { chartTheme } from '@/lib/chart-theme'

export interface EnhancedLineChartProps {
  data: any[]
  dataKey: string
  name?: string
  xAxisKey?: string
  color?: string
  showArea?: boolean
  height?: number
  className?: string
}

export const EnhancedLineChart = memo(function EnhancedLineChart({
  data,
  dataKey,
  name,
  xAxisKey = 'date',
  color = chartTheme.colors.primary,
  showArea = false,
  height = 300,
  className,
}: EnhancedLineChartProps) {
  const gradientId = `gradient-${dataKey}-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className={className} style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        {showArea ? (
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray={chartTheme.grid.strokeDasharray}
              stroke={chartTheme.grid.stroke}
              opacity={chartTheme.grid.opacity}
            />
            <XAxis
              dataKey={xAxisKey}
              tick={{ fill: '#64748B', fontSize: 12 }}
              axisLine={{ stroke: '#E2E8F0' }}
            />
            <YAxis
              tick={{ fill: '#64748B', fontSize: 12 }}
              axisLine={{ stroke: '#E2E8F0' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: chartTheme.tooltip.backgroundColor,
                border: chartTheme.tooltip.border,
                borderRadius: chartTheme.tooltip.borderRadius,
                boxShadow: chartTheme.tooltip.boxShadow,
                padding: chartTheme.tooltip.padding,
              }}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              name={name}
              stroke={color}
              fill={`url(#${gradientId})`}
              strokeWidth={2}
              animationDuration={chartTheme.animation.duration}
            />
          </AreaChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid
              strokeDasharray={chartTheme.grid.strokeDasharray}
              stroke={chartTheme.grid.stroke}
              opacity={chartTheme.grid.opacity}
            />
            <XAxis
              dataKey={xAxisKey}
              tick={{ fill: '#64748B', fontSize: 12 }}
              axisLine={{ stroke: '#E2E8F0' }}
            />
            <YAxis
              tick={{ fill: '#64748B', fontSize: 12 }}
              axisLine={{ stroke: '#E2E8F0' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: chartTheme.tooltip.backgroundColor,
                border: chartTheme.tooltip.border,
                borderRadius: chartTheme.tooltip.borderRadius,
                boxShadow: chartTheme.tooltip.boxShadow,
                padding: chartTheme.tooltip.padding,
              }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              name={name}
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, r: 4 }}
              activeDot={{ r: 6 }}
              animationDuration={chartTheme.animation.duration}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

