'use client'

import React from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { chartTheme, chartColorPalette } from '@/lib/chart-theme'

export interface EnhancedAreaChartProps {
  data: any[]
  dataKeys: string | string[]
  xAxisKey?: string
  names?: string | string[]
  colors?: string | string[]
  height?: number
  className?: string
  stacked?: boolean
}

export function EnhancedAreaChart({
  data,
  dataKeys,
  xAxisKey = 'date',
  names,
  colors,
  height = 300,
  className,
  stacked = false,
}: EnhancedAreaChartProps) {
  const keysArray = Array.isArray(dataKeys) ? dataKeys : [dataKeys]
  const namesArray = names
    ? Array.isArray(names)
      ? names
      : [names]
    : keysArray
  const colorsArray = colors
    ? Array.isArray(colors)
      ? colors
      : [colors]
    : chartColorPalette

  return (
    <div className={className} style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            {keysArray.map((key, index) => {
              const gradientId = `gradient-${key}-${index}`
              const color = colorsArray[index] || chartColorPalette[index]
              return (
                <linearGradient
                  key={gradientId}
                  id={gradientId}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              )
            })}
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
          {keysArray.length > 1 && (
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="rect"
            />
          )}
          {keysArray.map((key, index) => {
            const gradientId = `gradient-${key}-${index}`
            const color = colorsArray[index] || chartColorPalette[index]
            return (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                name={namesArray[index] || key}
                stroke={color}
                fill={`url(#${gradientId})`}
                strokeWidth={2}
                stackId={stacked ? 'stack' : undefined}
                animationDuration={chartTheme.animation.duration}
              />
            )
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

