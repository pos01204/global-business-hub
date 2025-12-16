/**
 * EChartsBarChart - 고급 바 차트
 * 파레토 분석, 비교 분석 등에 사용
 */

'use client'

import { useMemo } from 'react'
import { EChartsWrapper } from './EChartsWrapper'
import { CHART_COLORS, createGradient, formatNumber, formatPercent } from '@/lib/echarts-theme'
import type { EChartsOption } from 'echarts'

export interface BarDataItem {
  name: string
  value: number
  color?: string
  [key: string]: any
}

export interface BarSeries {
  name: string
  data: number[]
  color?: string
  stack?: string
  showLabel?: boolean
}

export interface EChartsBarChartProps {
  // 단일 시리즈 (간단한 바 차트)
  data?: BarDataItem[]
  // 다중 시리즈
  series?: BarSeries[]
  categories?: string[]
  title?: string
  subtitle?: string
  height?: number
  horizontal?: boolean
  showPareto?: boolean
  showLabels?: boolean
  showLegend?: boolean
  stacked?: boolean
  valueFormatter?: (value: number) => string
  onBarClick?: (item: { name: string; value: number; seriesName?: string }) => void
  className?: string
}

export function EChartsBarChart({
  data,
  series,
  categories,
  title,
  subtitle,
  height = 350,
  horizontal = false,
  showPareto = false,
  showLabels = false,
  showLegend = true,
  stacked = false,
  valueFormatter = formatNumber,
  onBarClick,
  className,
}: EChartsBarChartProps) {
  
  const option = useMemo<EChartsOption>(() => {
    // 단일 시리즈 모드
    if (data && !series) {
      const sortedData = showPareto 
        ? [...data].sort((a, b) => b.value - a.value)
        : data
      
      const names = sortedData.map(d => d.name)
      const values = sortedData.map(d => d.value)
      const colors = sortedData.map((d, idx) => d.color || CHART_COLORS[idx % CHART_COLORS.length])
      
      // 파레토 누적 비율 계산
      let paretoData: number[] = []
      if (showPareto) {
        const total = values.reduce((a, b) => a + b, 0)
        let cumulative = 0
        paretoData = values.map(v => {
          cumulative += v
          return (cumulative / total) * 100
        })
      }
      
      const chartSeries: any[] = [
        {
          name: title || 'Value',
          type: 'bar',
          data: values.map((v, idx) => ({
            value: v,
            itemStyle: {
              color: createGradient(colors[idx], 0.9, 0.6),
              borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
            },
          })),
          barWidth: '65%',
          barMaxWidth: 40,
          label: {
            show: showLabels,
            position: horizontal ? 'right' : 'top',
            formatter: (params: any) => valueFormatter(params.value),
            fontSize: 11,
            fontWeight: 600,
            color: '#1E293B',
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 12,
              shadowColor: 'rgba(0, 0, 0, 0.25)',
            },
            focus: 'series',
          },
        },
      ]
      
      // 파레토 라인 추가
      if (showPareto) {
        chartSeries.push({
          name: '누적 비율',
          type: 'line',
          yAxisIndex: 1,
          data: paretoData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 2,
            color: '#EF4444',
          },
          itemStyle: {
            color: '#EF4444',
            borderWidth: 2,
            borderColor: '#fff',
          },
          label: {
            show: showLabels,
            position: 'top',
            formatter: (params: any) => `${params.value.toFixed(1)}%`,
            fontSize: 10,
            color: '#EF4444',
          },
        })
      }
      
      return {
        title: title ? {
          text: title,
          subtext: subtitle,
          left: 'center',
        } : undefined,
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow',
          },
          formatter: (params: any) => {
            const bar = params.find((p: any) => p.seriesType === 'bar')
            const line = params.find((p: any) => p.seriesType === 'line')
            
            let html = `<div style="font-weight: 600; margin-bottom: 8px;">${bar?.name}</div>`
            html += `<div style="display: flex; justify-content: space-between; gap: 16px;">
              <span>${bar?.marker} 값</span>
              <span style="font-weight: 600;">${valueFormatter(bar?.value)}</span>
            </div>`
            
            if (line) {
              html += `<div style="display: flex; justify-content: space-between; gap: 16px;">
                <span>${line.marker} 누적</span>
                <span style="font-weight: 600;">${line.value.toFixed(1)}%</span>
              </div>`
            }
            
            return html
          },
        },
        legend: showLegend ? (showPareto ? {
          data: [title || 'Value', '누적 비율'],
          bottom: 10,
        } : {
          show: false,
        }) : undefined,
        grid: {
          left: '3%',
          right: showPareto ? '8%' : '4%',
          bottom: showPareto ? '15%' : '10%',
          top: title ? '15%' : '10%',
          containLabel: true,
        },
        xAxis: {
          type: horizontal ? 'value' : 'category',
          data: horizontal ? undefined : names,
          axisLabel: horizontal ? {
            formatter: (value: number) => valueFormatter(value),
          } : {
            rotate: names.length > 8 ? 45 : 0,
            interval: 0,
            fontSize: 11,
          },
        },
        yAxis: showPareto ? [
          {
            type: horizontal ? 'category' : 'value',
            data: horizontal ? names : undefined,
            axisLabel: horizontal ? {
              fontSize: 11,
            } : {
              formatter: (value: number) => valueFormatter(value),
            },
          },
          {
            type: 'value',
            position: 'right',
            min: 0,
            max: 100,
            axisLabel: {
              formatter: '{value}%',
            },
            splitLine: {
              show: false,
            },
          },
        ] : {
          type: horizontal ? 'category' : 'value',
          data: horizontal ? names : undefined,
          axisLabel: horizontal ? {
            fontSize: 11,
          } : {
            formatter: (value: number) => valueFormatter(value),
          },
        },
        series: chartSeries,
      }
    }
    
    // 다중 시리즈 모드
    if (series && categories) {
      const chartSeries = series.map((s, idx) => ({
        name: s.name,
        type: 'bar',
        stack: stacked ? (s.stack || 'total') : undefined,
        data: s.data,
        itemStyle: {
          color: s.color || CHART_COLORS[idx % CHART_COLORS.length],
          borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
        },
        label: {
          show: s.showLabel ?? showLabels,
          position: horizontal ? 'right' : 'top',
          formatter: (params: any) => valueFormatter(params.value),
          fontSize: 10,
        },
        emphasis: {
          focus: 'series',
        },
      }))
      
      return {
        title: title ? {
          text: title,
          subtext: subtitle,
          left: 'center',
        } : undefined,
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow',
          },
        },
        legend: showLegend ? {
          data: series.map(s => s.name),
          bottom: 10,
          type: 'scroll',
        } : { show: false },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          top: title ? '15%' : '10%',
          containLabel: true,
        },
        xAxis: {
          type: horizontal ? 'value' : 'category',
          data: horizontal ? undefined : categories,
          axisLabel: horizontal ? {
            formatter: (value: number) => valueFormatter(value),
          } : {
            rotate: categories.length > 8 ? 45 : 0,
            interval: 0,
            fontSize: 11,
          },
        },
        yAxis: {
          type: horizontal ? 'category' : 'value',
          data: horizontal ? categories : undefined,
          axisLabel: horizontal ? {
            fontSize: 11,
          } : {
            formatter: (value: number) => valueFormatter(value),
          },
        },
        series: chartSeries,
      }
    }
    
    return {}
  }, [data, series, categories, title, subtitle, horizontal, showPareto, showLabels, showLegend, stacked, valueFormatter])
  
  const handleEvents = useMemo(() => ({
    click: (params: any) => {
      if (onBarClick && params.componentType === 'series' && params.seriesType === 'bar') {
        onBarClick({
          name: params.name,
          value: params.value,
          seriesName: params.seriesName,
        })
      }
    },
  }), [onBarClick])
  
  return (
    <EChartsWrapper
      option={option}
      height={height}
      onEvents={handleEvents}
      className={className}
    />
  )
}

export default EChartsBarChart

