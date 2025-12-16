/**
 * EChartsTrendChart - 고급 트렌드 차트
 * 시계열 데이터 시각화 + 예측 + 변화점 표시
 */

'use client'

import { useMemo } from 'react'
import { EChartsWrapper } from './EChartsWrapper'
import { 
  CHART_COLORS, 
  createGradient, 
  formatNumber, 
  formatCurrency,
  createTooltipFormatter 
} from '@/lib/echarts-theme'
import { statisticsEngine } from '@/lib/statistics/StatisticsEngine'
import type { EChartsOption } from 'echarts'

export interface TrendDataPoint {
  date: string
  value: number
  [key: string]: any
}

export interface TrendSeries {
  name: string
  data: TrendDataPoint[]
  color?: string
  type?: 'line' | 'bar' | 'area'
  showForecast?: boolean
  forecastPeriods?: number
  showTrendLine?: boolean
  showMovingAverage?: boolean
  maWindow?: number
}

export interface EChartsTrendChartProps {
  series: TrendSeries[]
  title?: string
  subtitle?: string
  height?: number
  showLegend?: boolean
  showDataZoom?: boolean
  showChangepoints?: boolean
  valueFormatter?: (value: number) => string
  dateFormatter?: (date: string) => string
  onDataPointClick?: (params: { seriesName: string; date: string; value: number }) => void
  className?: string
}

export function EChartsTrendChart({
  series,
  title,
  subtitle,
  height = 400,
  showLegend = true,
  showDataZoom = true,
  showChangepoints = false,
  valueFormatter = formatNumber,
  dateFormatter = (d) => d,
  onDataPointClick,
  className,
}: EChartsTrendChartProps) {
  
  const option = useMemo<EChartsOption>(() => {
    // X축 날짜 추출 (첫 번째 시리즈 기준)
    const dates = series[0]?.data.map(d => dateFormatter(d.date)) || []
    
    // 시리즈 데이터 생성
    const chartSeries: any[] = []
    const legendData: string[] = []
    
    series.forEach((s, idx) => {
      const color = s.color || CHART_COLORS[idx % CHART_COLORS.length]
      const values = s.data.map(d => d.value)
      
      legendData.push(s.name)
      
      // 메인 시리즈
      if (s.type === 'bar') {
        chartSeries.push({
          name: s.name,
          type: 'bar',
          data: values,
          itemStyle: {
            color,
            borderRadius: [4, 4, 0, 0],
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: `${color}40`,
            },
          },
        })
      } else {
        // Line or Area
        chartSeries.push({
          name: s.name,
          type: 'line',
          data: values,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: values.length < 30,
          lineStyle: {
            width: 2.5,
            color,
          },
          itemStyle: {
            color,
            borderWidth: 2,
            borderColor: '#fff',
          },
          areaStyle: s.type === 'area' ? {
            color: createGradient(color, 0.3, 0.02),
          } : undefined,
          emphasis: {
            focus: 'series',
            itemStyle: {
              shadowBlur: 10,
              shadowColor: `${color}60`,
            },
          },
        })
      }
      
      // 이동 평균선
      if (s.showMovingAverage) {
        const maValues = statisticsEngine.movingAverage(values, s.maWindow || 7)
        legendData.push(`${s.name} MA${s.maWindow || 7}`)
        
        chartSeries.push({
          name: `${s.name} MA${s.maWindow || 7}`,
          type: 'line',
          data: maValues,
          smooth: true,
          symbol: 'none',
          lineStyle: {
            width: 2,
            color,
            type: 'dashed',
            opacity: 0.7,
          },
        })
      }
      
      // 트렌드 라인 (선형 회귀)
      if (s.showTrendLine) {
        const x = values.map((_, i) => i)
        const regression = statisticsEngine.linearRegression(x, values)
        legendData.push(`${s.name} 추세`)
        
        chartSeries.push({
          name: `${s.name} 추세`,
          type: 'line',
          data: regression.predictions,
          smooth: false,
          symbol: 'none',
          lineStyle: {
            width: 1.5,
            color: '#94A3B8',
            type: 'dotted',
          },
        })
      }
      
      // 예측
      if (s.showForecast && s.forecastPeriods) {
        const forecast = statisticsEngine.forecast(values, s.forecastPeriods)
        const forecastData = new Array(values.length).fill(null).concat(forecast.values)
        legendData.push(`${s.name} 예측`)
        
        chartSeries.push({
          name: `${s.name} 예측`,
          type: 'line',
          data: forecastData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: {
            width: 2,
            color,
            type: 'dashed',
          },
          itemStyle: {
            color,
            opacity: 0.6,
          },
        })
      }
      
      // 변화점 표시
      if (showChangepoints) {
        const changepoints = statisticsEngine.detectChangepoints(values)
        
        if (changepoints.length > 0) {
          chartSeries.push({
            name: '변화점',
            type: 'scatter',
            data: changepoints.map(cp => ({
              value: [cp.index, values[cp.index]],
              itemStyle: {
                color: cp.type === 'increase' ? '#22C55E' : '#EF4444',
              },
            })),
            symbol: 'triangle',
            symbolSize: 12,
            z: 10,
          })
        }
      }
    })
    
    return {
      title: title ? {
        text: title,
        subtext: subtitle,
        left: 'center',
      } : undefined,
      legend: showLegend ? {
        data: legendData,
        bottom: showDataZoom ? 50 : 10,
        type: 'scroll',
        itemWidth: 16,
        itemHeight: 10,
        textStyle: {
          fontSize: 12,
        },
      } : undefined,
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#1E293B',
          },
        },
        formatter: createTooltipFormatter(valueFormatter),
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: showDataZoom ? '18%' : '15%',
        top: title ? '15%' : '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: series.some(s => s.type === 'bar'),
        axisLabel: {
          rotate: dates.length > 15 ? 45 : 0,
          interval: dates.length > 30 ? Math.floor(dates.length / 15) : 0,
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => valueFormatter(value),
        },
      },
      dataZoom: showDataZoom ? [
        {
          type: 'inside',
          start: 0,
          end: 100,
        },
        {
          type: 'slider',
          start: 0,
          end: 100,
          height: 20,
          bottom: 10,
          borderColor: '#E2E8F0',
          fillerColor: 'rgba(249, 115, 22, 0.1)',
          handleStyle: {
            color: '#F97316',
            borderColor: '#F97316',
          },
        },
      ] : undefined,
      series: chartSeries,
    }
  }, [series, title, subtitle, showLegend, showDataZoom, showChangepoints, valueFormatter, dateFormatter])
  
  const handleEvents = useMemo(() => ({
    click: (params: any) => {
      if (onDataPointClick && params.componentType === 'series') {
        onDataPointClick({
          seriesName: params.seriesName,
          date: params.name,
          value: params.value,
        })
      }
    },
  }), [onDataPointClick])
  
  return (
    <EChartsWrapper
      option={option}
      height={height}
      onEvents={handleEvents}
      className={className}
    />
  )
}

export default EChartsTrendChart

