/**
 * EChartsPieChart - 고급 파이/도넛 차트
 * RFM 세그먼트, 카테고리 분포 등에 사용
 */

'use client'

import { useMemo } from 'react'
import { EChartsWrapper } from './EChartsWrapper'
import { CHART_COLORS, formatNumber, formatPercent } from '@/lib/echarts-theme'
import type { EChartsOption } from 'echarts'

export interface PieDataItem {
  name: string
  value: number
  color?: string
  itemStyle?: any
}

export interface EChartsPieChartProps {
  data: PieDataItem[]
  title?: string
  subtitle?: string
  height?: number
  type?: 'pie' | 'doughnut' | 'rose'
  showLegend?: boolean
  legendPosition?: 'bottom' | 'right'
  showLabels?: boolean
  showPercentage?: boolean
  valueFormatter?: (value: number) => string
  centerText?: string
  centerSubtext?: string
  onSliceClick?: (item: PieDataItem) => void
  className?: string
}

export function EChartsPieChart({
  data,
  title,
  subtitle,
  height = 350,
  type = 'doughnut',
  showLegend = true,
  legendPosition = 'bottom',
  showLabels = true,
  showPercentage = true,
  valueFormatter = formatNumber,
  centerText,
  centerSubtext,
  onSliceClick,
  className,
}: EChartsPieChartProps) {
  
  const option = useMemo<EChartsOption>(() => {
    const total = data.reduce((sum, d) => sum + d.value, 0)
    
    // 색상 적용
    const coloredData = data.map((d, idx) => ({
      ...d,
      itemStyle: {
        color: d.color || CHART_COLORS[idx % CHART_COLORS.length],
        ...d.itemStyle,
      },
    }))
    
    // 반지름 설정
    const radius = type === 'doughnut' 
      ? ['45%', '70%'] 
      : type === 'rose' 
        ? ['20%', '70%']
        : ['0%', '70%']
    
    // 레전드 위치
    const legendConfig = showLegend ? {
      orient: legendPosition === 'right' ? 'vertical' as const : 'horizontal' as const,
      ...(legendPosition === 'right' 
        ? { right: '5%', top: 'center' }
        : { bottom: 10, left: 'center' }
      ),
      type: 'scroll' as const,
      itemWidth: 12,
      itemHeight: 12,
      textStyle: {
        fontSize: 12,
      },
      formatter: (name: string) => {
        const item = data.find(d => d.name === name)
        if (!item) return name
        const percent = ((item.value / total) * 100).toFixed(1)
        return `${name} (${percent}%)`
      },
    } : undefined
    
    // 센터 텍스트 (도넛 차트용)
    const graphic = (type === 'doughnut' && (centerText || centerSubtext)) ? [
      {
        type: 'group' as const,
        left: 'center',
        top: 'center',
        children: [
          centerText ? {
            type: 'text' as const,
            style: {
              text: centerText,
              textAlign: 'center' as const,
              fill: '#1E293B',
              fontSize: 24,
              fontWeight: 700,
            },
            top: centerSubtext ? -15 : 0,
          } : null,
          centerSubtext ? {
            type: 'text' as const,
            style: {
              text: centerSubtext,
              textAlign: 'center' as const,
              fill: '#64748B',
              fontSize: 12,
            },
            top: centerText ? 15 : 0,
          } : null,
        ].filter(Boolean),
      },
    ] : undefined
    
    return {
      title: title ? {
        text: title,
        subtext: subtitle,
        left: 'center',
      } : undefined,
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const percent = ((params.value / total) * 100).toFixed(1)
          return `
            <div style="font-weight: 600; margin-bottom: 4px;">
              ${params.marker} ${params.name}
            </div>
            <div style="display: flex; justify-content: space-between; gap: 16px;">
              <span>값</span>
              <span style="font-weight: 600;">${valueFormatter(params.value)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 16px;">
              <span>비율</span>
              <span style="font-weight: 600;">${percent}%</span>
            </div>
          `
        },
      },
      legend: legendConfig,
      graphic,
      series: [
        {
          name: title || 'Distribution',
          type: 'pie',
          radius,
          center: legendPosition === 'right' ? ['40%', '50%'] : ['50%', '45%'],
          roseType: type === 'rose' ? 'radius' : undefined,
          data: coloredData,
          label: {
            show: showLabels,
            formatter: (params: any) => {
              if (showPercentage) {
                const percent = ((params.value / total) * 100).toFixed(1)
                return `${params.name}\n${percent}%`
              }
              return params.name
            },
            fontSize: 11,
            lineHeight: 16,
          },
          labelLine: {
            show: showLabels,
            length: 15,
            length2: 10,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 20,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.2)',
            },
            label: {
              show: true,
              fontSize: 13,
              fontWeight: 'bold',
            },
          },
          itemStyle: {
            borderRadius: 4,
            borderColor: '#fff',
            borderWidth: 2,
          },
          animationType: 'scale',
          animationEasing: 'elasticOut',
          animationDelay: (idx: number) => idx * 50,
        },
      ],
    }
  }, [data, title, subtitle, type, showLegend, legendPosition, showLabels, showPercentage, valueFormatter, centerText, centerSubtext])
  
  const handleEvents = useMemo(() => ({
    click: (params: any) => {
      if (onSliceClick && params.componentType === 'series') {
        onSliceClick({
          name: params.name,
          value: params.value,
        })
      }
    },
  }), [onSliceClick])
  
  return (
    <EChartsWrapper
      option={option}
      height={height}
      onEvents={handleEvents}
      className={className}
    />
  )
}

export default EChartsPieChart

