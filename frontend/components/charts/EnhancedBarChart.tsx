'use client'

import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { chartTheme, chartColorPalette } from '@/lib/chart-theme'

export interface EnhancedBarChartProps {
  data: any[]
  dataKeys: string | string[]
  xAxisKey?: string
  names?: string | string[]
  colors?: string | string[]
  height?: number
  className?: string
  horizontal?: boolean
  stacked?: boolean
}

export function EnhancedBarChart({
  data,
  dataKeys,
  xAxisKey = 'name',
  names,
  colors,
  height = 300,
  className,
  horizontal = false,
  stacked = false,
}: EnhancedBarChartProps) {
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
        <BarChart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
        >
          <CartesianGrid
            strokeDasharray={chartTheme.grid.strokeDasharray}
            stroke={chartTheme.grid.stroke}
            opacity={chartTheme.grid.opacity}
          />
          <XAxis
            type={horizontal ? 'number' : 'category'}
            dataKey={horizontal ? undefined : xAxisKey}
            tick={{ fill: '#64748B', fontSize: 12 }}
            axisLine={{ stroke: '#E2E8F0' }}
          />
          <YAxis
            type={horizontal ? 'category' : 'number'}
            dataKey={horizontal ? xAxisKey : undefined}
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
          {keysArray.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              name={namesArray[index] || key}
              fill={colorsArray[index] || chartColorPalette[index]}
              stackId={stacked ? 'stack' : undefined}
              radius={[4, 4, 0, 0]}
              animationDuration={chartTheme.animation.duration}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

