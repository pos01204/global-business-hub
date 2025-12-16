/**
 * EChartsHeatmap - 고급 히트맵 차트
 * 코호트 분석, 상관관계 매트릭스 등에 사용
 */

'use client'

import { useMemo } from 'react'
import { EChartsWrapper } from './EChartsWrapper'
import { formatPercent, formatNumber } from '@/lib/echarts-theme'
import type { EChartsOption } from 'echarts'

export interface HeatmapCell {
  x: number | string
  y: number | string
  value: number
  label?: string
}

export interface EChartsHeatmapProps {
  data: HeatmapCell[]
  xLabels: string[]
  yLabels: string[]
  title?: string
  subtitle?: string
  height?: number
  colorRange?: [string, string] | [string, string, string]
  valueFormatter?: (value: number) => string
  showValues?: boolean
  minValue?: number
  maxValue?: number
  onCellClick?: (cell: HeatmapCell) => void
  className?: string
}

export function EChartsHeatmap({
  data,
  xLabels,
  yLabels,
  title,
  subtitle,
  height = 400,
  colorRange = ['#FEF3C7', '#F97316', '#7C2D12'],
  valueFormatter = (v) => formatPercent(v),
  showValues = true,
  minValue,
  maxValue,
  onCellClick,
  className,
}: EChartsHeatmapProps) {
  
  const option = useMemo<EChartsOption>(() => {
    // 데이터 변환 (ECharts 형식)
    const heatmapData = data.map(cell => {
      const xIndex = typeof cell.x === 'string' ? xLabels.indexOf(cell.x) : cell.x
      const yIndex = typeof cell.y === 'string' ? yLabels.indexOf(cell.y) : cell.y
      return [xIndex, yIndex, cell.value]
    })
    
    // 값 범위 계산
    const values = data.map(d => d.value).filter(v => v !== null && v !== undefined)
    const min = minValue ?? Math.min(...values)
    const max = maxValue ?? Math.max(...values)
    
    return {
      title: title ? {
        text: title,
        subtext: subtitle,
        left: 'center',
      } : undefined,
      tooltip: {
        position: 'top',
        formatter: (params: any) => {
          const [xIdx, yIdx, value] = params.data
          return `
            <div style="font-weight: 600; margin-bottom: 4px;">
              ${yLabels[yIdx]} → ${xLabels[xIdx]}
            </div>
            <div style="font-size: 16px; font-weight: 700; color: #F97316;">
              ${valueFormatter(value)}
            </div>
          `
        },
      },
      grid: {
        left: '12%',
        right: '10%',
        top: title ? '15%' : '8%',
        bottom: '15%',
      },
      xAxis: {
        type: 'category',
        data: xLabels,
        splitArea: {
          show: true,
        },
        axisLabel: {
          rotate: xLabels.length > 10 ? 45 : 0,
          interval: 0,
          fontSize: 11,
        },
        axisTick: {
          alignWithLabel: true,
        },
      },
      yAxis: {
        type: 'category',
        data: yLabels,
        splitArea: {
          show: true,
        },
        axisLabel: {
          fontSize: 11,
        },
      },
      visualMap: {
        min,
        max,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        inRange: {
          color: colorRange,
        },
        textStyle: {
          fontSize: 11,
        },
        formatter: (value: number) => valueFormatter(value),
      },
      series: [
        {
          name: title || 'Heatmap',
          type: 'heatmap',
          data: heatmapData,
          label: {
            show: showValues,
            fontSize: 10,
            formatter: (params: any) => {
              const value = params.data[2]
              if (value === null || value === undefined) return ''
              return valueFormatter(value)
            },
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.3)',
            },
          },
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 1,
            borderRadius: 2,
          },
        },
      ],
    }
  }, [data, xLabels, yLabels, title, subtitle, colorRange, valueFormatter, showValues, minValue, maxValue])
  
  const handleEvents = useMemo(() => ({
    click: (params: any) => {
      if (onCellClick && params.componentType === 'series') {
        const [xIdx, yIdx, value] = params.data
        onCellClick({
          x: xLabels[xIdx],
          y: yLabels[yIdx],
          value,
        })
      }
    },
  }), [onCellClick, xLabels, yLabels])
  
  return (
    <EChartsWrapper
      option={option}
      height={height}
      onEvents={handleEvents}
      className={className}
    />
  )
}

export default EChartsHeatmap

