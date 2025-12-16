/**
 * EChartsRadar - 고급 레이더 차트
 * 건강도 점수, 다차원 비교 등에 사용
 */

'use client'

import { useMemo } from 'react'
import { EChartsWrapper } from './EChartsWrapper'
import { CHART_COLORS, createGradient } from '@/lib/echarts-theme'
import type { EChartsOption } from 'echarts'

export interface RadarIndicator {
  name: string
  max: number
  min?: number
}

export interface RadarSeries {
  name: string
  values: number[]
  color?: string
}

export interface EChartsRadarProps {
  indicators: RadarIndicator[]
  series: RadarSeries[]
  title?: string
  subtitle?: string
  height?: number
  showLegend?: boolean
  shape?: 'polygon' | 'circle'
  fillOpacity?: number
  onAreaClick?: (seriesName: string) => void
  className?: string
}

export function EChartsRadar({
  indicators,
  series,
  title,
  subtitle,
  height = 350,
  showLegend = true,
  shape = 'polygon',
  fillOpacity = 0.3,
  onAreaClick,
  className,
}: EChartsRadarProps) {
  
  const option = useMemo<EChartsOption>(() => {
    const radarSeries = series.map((s, idx) => {
      const color = s.color || CHART_COLORS[idx % CHART_COLORS.length]
      
      return {
        name: s.name,
        value: s.values,
        lineStyle: {
          width: 2,
          color,
        },
        areaStyle: {
          color: createGradient(color, fillOpacity, fillOpacity * 0.3),
        },
        itemStyle: {
          color,
          borderWidth: 2,
          borderColor: '#fff',
        },
        symbol: 'circle',
        symbolSize: 6,
      }
    })
    
    return {
      title: title ? {
        text: title,
        subtext: subtitle,
        left: 'center',
      } : undefined,
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const data = params.data
          let html = `<div style="font-weight: 600; margin-bottom: 8px;">${data.name}</div>`
          
          indicators.forEach((ind, idx) => {
            const value = data.value[idx]
            const percent = ((value / ind.max) * 100).toFixed(1)
            html += `<div style="display: flex; justify-content: space-between; gap: 16px; margin: 2px 0;">
              <span>${ind.name}</span>
              <span style="font-weight: 600;">${value.toFixed(1)} (${percent}%)</span>
            </div>`
          })
          
          return html
        },
      },
      legend: showLegend ? {
        data: series.map(s => s.name),
        bottom: 10,
        itemWidth: 14,
        itemHeight: 14,
      } : undefined,
      radar: {
        indicator: indicators.map(ind => ({
          name: ind.name,
          max: ind.max,
          min: ind.min || 0,
        })),
        shape,
        center: ['50%', '50%'],
        radius: '65%',
        axisName: {
          color: '#64748B',
          fontSize: 11,
        },
        splitNumber: 4,
        splitLine: {
          lineStyle: {
            color: '#E2E8F0',
          },
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: ['rgba(241, 245, 249, 0.5)', 'rgba(255, 255, 255, 0.5)'],
          },
        },
        axisLine: {
          lineStyle: {
            color: '#E2E8F0',
          },
        },
      },
      series: [
        {
          type: 'radar',
          data: radarSeries,
          emphasis: {
            lineStyle: {
              width: 3,
            },
            areaStyle: {
              opacity: fillOpacity + 0.2,
            },
          },
        },
      ],
    }
  }, [indicators, series, title, subtitle, showLegend, shape, fillOpacity])
  
  const handleEvents = useMemo(() => ({
    click: (params: any) => {
      if (onAreaClick && params.componentType === 'series') {
        onAreaClick(params.data.name)
      }
    },
  }), [onAreaClick])
  
  return (
    <EChartsWrapper
      option={option}
      height={height}
      onEvents={handleEvents}
      className={className}
    />
  )
}

export default EChartsRadar

