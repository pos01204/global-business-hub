'use client'

import React, { useMemo } from 'react'
import {
  AreaChart,
  BarChart,
  DonutChart,
  LineChart,
  Card,
  Metric,
  Text,
  Flex,
  BadgeDelta,
  ProgressBar,
  SparkAreaChart,
  SparkLineChart,
  SparkBarChart,
} from '@tremor/react'
import { cn } from '@/lib/utils'

// ========================================
// 공통 타입 정의
// ========================================

export interface ChartDataPoint {
  date: string
  [key: string]: string | number
}

export interface TremorChartProps {
  data: ChartDataPoint[]
  categories: string[]
  index?: string
  colors?: string[]
  className?: string
  height?: string
  showLegend?: boolean
  showGridLines?: boolean
  showAnimation?: boolean
  valueFormatter?: (value: number) => string
  yAxisWidth?: number
}

// ========================================
// 통합 Area Chart
// ========================================

export interface UnifiedAreaChartProps extends TremorChartProps {
  stack?: boolean
  curveType?: 'linear' | 'natural' | 'monotone' | 'step'
  connectNulls?: boolean
}

export function UnifiedAreaChart({
  data,
  categories,
  index = 'date',
  colors = ['indigo', 'cyan', 'amber', 'rose', 'emerald'],
  className,
  height = 'h-72',
  showLegend = true,
  showGridLines = true,
  showAnimation = true,
  valueFormatter,
  yAxisWidth = 56,
  stack = false,
  curveType = 'natural',
  connectNulls = true,
}: UnifiedAreaChartProps) {
  const defaultFormatter = (value: number) => {
    if (value >= 1000000) return `₩${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `₩${(value / 1000).toFixed(0)}K`
    return `₩${value.toLocaleString()}`
  }

  return (
    <AreaChart
      className={cn(height, className)}
      data={data}
      index={index}
      categories={categories}
      colors={colors}
      valueFormatter={valueFormatter || defaultFormatter}
      showLegend={showLegend}
      showGridLines={showGridLines}
      showAnimation={showAnimation}
      yAxisWidth={yAxisWidth}
      stack={stack}
      curveType={curveType}
      connectNulls={connectNulls}
    />
  )
}

// ========================================
// 통합 Bar Chart
// ========================================

export interface UnifiedBarChartProps extends TremorChartProps {
  layout?: 'vertical' | 'horizontal'
  stack?: boolean
  relative?: boolean
}

export function UnifiedBarChart({
  data,
  categories,
  index = 'date',
  colors = ['indigo', 'cyan', 'amber', 'rose', 'emerald'],
  className,
  height = 'h-72',
  showLegend = true,
  showGridLines = true,
  showAnimation = true,
  valueFormatter,
  yAxisWidth = 56,
  layout = 'vertical',
  stack = false,
  relative = false,
}: UnifiedBarChartProps) {
  const defaultFormatter = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
    return value.toLocaleString()
  }

  return (
    <BarChart
      className={cn(height, className)}
      data={data}
      index={index}
      categories={categories}
      colors={colors}
      valueFormatter={valueFormatter || defaultFormatter}
      showLegend={showLegend}
      showGridLines={showGridLines}
      showAnimation={showAnimation}
      yAxisWidth={yAxisWidth}
      layout={layout}
      stack={stack}
      relative={relative}
    />
  )
}

// ========================================
// 통합 Line Chart
// ========================================

export interface UnifiedLineChartProps extends TremorChartProps {
  curveType?: 'linear' | 'natural' | 'monotone' | 'step'
  connectNulls?: boolean
}

export function UnifiedLineChart({
  data,
  categories,
  index = 'date',
  colors = ['indigo', 'cyan', 'amber', 'rose', 'emerald'],
  className,
  height = 'h-72',
  showLegend = true,
  showGridLines = true,
  showAnimation = true,
  valueFormatter,
  yAxisWidth = 56,
  curveType = 'natural',
  connectNulls = true,
}: UnifiedLineChartProps) {
  const defaultFormatter = (value: number) => {
    if (value >= 1000000) return `₩${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `₩${(value / 1000).toFixed(0)}K`
    return `₩${value.toLocaleString()}`
  }

  return (
    <LineChart
      className={cn(height, className)}
      data={data}
      index={index}
      categories={categories}
      colors={colors}
      valueFormatter={valueFormatter || defaultFormatter}
      showLegend={showLegend}
      showGridLines={showGridLines}
      showAnimation={showAnimation}
      yAxisWidth={yAxisWidth}
      curveType={curveType}
      connectNulls={connectNulls}
    />
  )
}

// ========================================
// 통합 Donut Chart
// ========================================

export interface UnifiedDonutChartProps {
  data: { name: string; value: number }[]
  category?: string
  index?: string
  colors?: string[]
  className?: string
  variant?: 'donut' | 'pie'
  showLabel?: boolean
  showAnimation?: boolean
  valueFormatter?: (value: number) => string
  label?: string
}

export function UnifiedDonutChart({
  data,
  category = 'value',
  index = 'name',
  colors = ['indigo', 'cyan', 'amber', 'rose', 'emerald', 'violet', 'fuchsia'],
  className,
  variant = 'donut',
  showLabel = true,
  showAnimation = true,
  valueFormatter,
  label,
}: UnifiedDonutChartProps) {
  const defaultFormatter = (value: number) => {
    if (value >= 1000000) return `₩${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `₩${(value / 1000).toFixed(0)}K`
    return `₩${value.toLocaleString()}`
  }

  return (
    <DonutChart
      className={cn('h-60', className)}
      data={data}
      category={category}
      index={index}
      colors={colors}
      variant={variant}
      showLabel={showLabel}
      showAnimation={showAnimation}
      valueFormatter={valueFormatter || defaultFormatter}
      label={label}
    />
  )
}

// ========================================
// Spark Charts (미니 차트)
// ========================================

export interface SparkChartProps {
  data: { value: number }[]
  className?: string
  colors?: string[]
}

export function UnifiedSparkAreaChart({
  data,
  className,
  colors = ['indigo'],
}: SparkChartProps) {
  return (
    <SparkAreaChart
      className={cn('h-10 w-36', className)}
      data={data}
      categories={['value']}
      index="index"
      colors={colors}
    />
  )
}

export function UnifiedSparkLineChart({
  data,
  className,
  colors = ['indigo'],
}: SparkChartProps) {
  return (
    <SparkLineChart
      className={cn('h-10 w-36', className)}
      data={data}
      categories={['value']}
      index="index"
      colors={colors}
    />
  )
}

export function UnifiedSparkBarChart({
  data,
  className,
  colors = ['indigo'],
}: SparkChartProps) {
  return (
    <SparkBarChart
      className={cn('h-10 w-36', className)}
      data={data}
      categories={['value']}
      index="index"
      colors={colors}
    />
  )
}

// ========================================
// KPI 카드 with Spark Chart
// ========================================

export interface TremorKPICardProps {
  title: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease' | 'unchanged'
  sparkData?: { value: number }[]
  sparkType?: 'area' | 'line' | 'bar'
  progressValue?: number
  progressMax?: number
  className?: string
  color?: string
  tooltip?: string
}

export function TremorKPICard({
  title,
  value,
  change,
  changeType,
  sparkData,
  sparkType = 'area',
  progressValue,
  progressMax,
  className,
  color = 'indigo',
  tooltip,
}: TremorKPICardProps) {
  const deltaType = changeType || (change ? (change > 0 ? 'increase' : change < 0 ? 'decrease' : 'unchanged') : 'unchanged')
  
  const formattedValue = typeof value === 'number' 
    ? value >= 1000000 
      ? `₩${(value / 1000000).toFixed(1)}M`
      : value >= 1000
        ? `₩${(value / 1000).toFixed(0)}K`
        : `₩${value.toLocaleString()}`
    : value

  const SparkComponent = sparkType === 'area' 
    ? UnifiedSparkAreaChart 
    : sparkType === 'line' 
      ? UnifiedSparkLineChart 
      : UnifiedSparkBarChart

  return (
    <Card className={cn('max-w-xs mx-auto', className)} decoration="top" decorationColor={color}>
      <Flex alignItems="start">
        <div>
          <Text>{title}</Text>
          <Metric>{formattedValue}</Metric>
        </div>
        {sparkData && sparkData.length > 0 && (
          <SparkComponent data={sparkData} colors={[color]} />
        )}
      </Flex>
      
      {change !== undefined && (
        <Flex className="mt-4 space-x-2">
          <BadgeDelta deltaType={deltaType} size="xs">
            {Math.abs(change).toFixed(1)}%
          </BadgeDelta>
          <Text className="truncate">vs. 이전 기간</Text>
        </Flex>
      )}
      
      {progressValue !== undefined && progressMax !== undefined && (
        <div className="mt-4">
          <Flex>
            <Text>{progressValue.toLocaleString()}</Text>
            <Text>{progressMax.toLocaleString()}</Text>
          </Flex>
          <ProgressBar value={(progressValue / progressMax) * 100} className="mt-2" color={color as any} />
        </div>
      )}
    </Card>
  )
}

// ========================================
// 비교 차트 (이전 기간 대비)
// ========================================

export interface ComparisonChartProps {
  currentData: ChartDataPoint[]
  previousData: ChartDataPoint[]
  category: string
  index?: string
  className?: string
  height?: string
  valueFormatter?: (value: number) => string
}

export function ComparisonChart({
  currentData,
  previousData,
  category,
  index = 'date',
  className,
  height = 'h-72',
  valueFormatter,
}: ComparisonChartProps) {
  const mergedData = useMemo(() => {
    return currentData.map((current, i) => ({
      [index]: current[index],
      '현재 기간': current[category] as number,
      '이전 기간': previousData[i]?.[category] as number || 0,
    }))
  }, [currentData, previousData, category, index])

  return (
    <AreaChart
      className={cn(height, className)}
      data={mergedData}
      index={index}
      categories={['현재 기간', '이전 기간']}
      colors={['indigo', 'slate']}
      valueFormatter={valueFormatter}
      showLegend={true}
      showGridLines={true}
      showAnimation={true}
    />
  )
}

// ========================================
// 목표 대비 진행률 차트
// ========================================

export interface GoalProgressChartProps {
  data: {
    name: string
    current: number
    target: number
    color?: string
  }[]
  className?: string
}

export function GoalProgressChart({ data, className }: GoalProgressChartProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {data.map((item) => {
        const progress = Math.min((item.current / item.target) * 100, 100)
        const color = item.color || (progress >= 100 ? 'emerald' : progress >= 70 ? 'amber' : 'rose')
        
        return (
          <div key={item.name}>
            <Flex>
              <Text>{item.name}</Text>
              <Text>{progress.toFixed(0)}%</Text>
            </Flex>
            <ProgressBar value={progress} color={color as any} className="mt-2" />
            <Flex className="mt-1">
              <Text className="text-xs text-slate-500">
                {item.current.toLocaleString()} / {item.target.toLocaleString()}
              </Text>
            </Flex>
          </div>
        )
      })}
    </div>
  )
}

