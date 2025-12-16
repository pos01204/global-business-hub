/**
 * EChartsForecast - 예측 차트 컴포넌트
 * 신뢰 구간과 함께 예측 결과 시각화
 */

'use client'

import { useMemo } from 'react'
import { EChartsWrapper } from './EChartsWrapper'
import { CHART_COLORS, formatNumber } from '@/lib/echarts-theme'
import type { EChartsOption } from 'echarts'
import type { ForecastResult } from '@/lib/forecast/types'

export interface EChartsForecastProps {
  historicalData: Array<{ date: string; value: number }>
  predictions: ForecastResult[]
  title?: string
  subtitle?: string
  height?: number
  showConfidenceInterval?: boolean
  showChangepoints?: boolean
  changepoints?: Array<{ index: number; date?: string; type: string }>
  valueFormatter?: (value: number) => string
  onDataPointClick?: (params: { date: string; value: number; type: 'historical' | 'predicted' }) => void
  className?: string
}

export function EChartsForecast({
  historicalData,
  predictions,
  title,
  subtitle,
  height = 400,
  showConfidenceInterval = true,
  showChangepoints = false,
  changepoints = [],
  valueFormatter = formatNumber,
  onDataPointClick,
  className,
}: EChartsForecastProps) {
  
  const option = useMemo<EChartsOption>(() => {
    // 안전성 체크
    if (!Array.isArray(historicalData) || historicalData.length === 0) {
      historicalData = []
    }
    if (!Array.isArray(predictions) || predictions.length === 0) {
      predictions = []
    }
    
    // 날짜 배열 생성
    const historicalDates = historicalData.map(d => d.date)
    const predictionDates = predictions.map(p => p.date)
    const allDates = [...historicalDates, ...predictionDates]
    
    // 데이터 배열 생성
    const historicalValues = historicalData.map(d => d.value)
    const lastHistoricalValue = historicalData.length > 0 ? historicalData[historicalData.length - 1]?.value : null
    const predictedValues = [
      ...new Array(Math.max(historicalData.length - 1, 0)).fill(null),
      lastHistoricalValue, // 연결점
      ...predictions.map(p => p.predicted),
    ]
    
    // 신뢰 구간 데이터
    const ci95Upper = showConfidenceInterval ? [
      ...new Array(historicalData.length).fill(null),
      ...predictions.map(p => p.upper95),
    ] : []
    
    const ci95Lower = showConfidenceInterval ? [
      ...new Array(historicalData.length).fill(null),
      ...predictions.map(p => p.lower95),
    ] : []
    
    const ci80Upper = showConfidenceInterval ? [
      ...new Array(historicalData.length).fill(null),
      ...predictions.map(p => p.upper80),
    ] : []
    
    const ci80Lower = showConfidenceInterval ? [
      ...new Array(historicalData.length).fill(null),
      ...predictions.map(p => p.lower80),
    ] : []

    // 시리즈 구성
    const series: any[] = [
      // 실제 데이터
      {
        name: '실제 값',
        type: 'line',
        data: historicalValues,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: {
          width: 2.5,
          color: CHART_COLORS[0],
        },
        itemStyle: {
          color: CHART_COLORS[0],
          borderWidth: 2,
          borderColor: '#fff',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: `${CHART_COLORS[0]}30` },
              { offset: 1, color: `${CHART_COLORS[0]}05` },
            ],
          },
        },
      },
      // 예측 데이터
      {
        name: '예측 값',
        type: 'line',
        data: predictedValues,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: {
          width: 2.5,
          color: CHART_COLORS[1],
          type: 'dashed',
        },
        itemStyle: {
          color: CHART_COLORS[1],
          borderWidth: 2,
          borderColor: '#fff',
        },
      },
    ]

    // 95% 신뢰 구간
    if (showConfidenceInterval && ci95Upper.length > 0) {
      series.push({
        name: '95% 신뢰구간',
        type: 'line',
        data: ci95Upper,
        lineStyle: { opacity: 0 },
        areaStyle: { opacity: 0 },
        stack: 'confidence-95',
        symbol: 'none',
      })
      series.push({
        name: '95% CI Lower',
        type: 'line',
        data: ci95Lower,
        lineStyle: { opacity: 0 },
        areaStyle: {
          color: `${CHART_COLORS[1]}15`,
        },
        stack: 'confidence-95',
        symbol: 'none',
      })
      
      // 80% 신뢰 구간
      series.push({
        name: '80% 신뢰구간',
        type: 'line',
        data: ci80Upper,
        lineStyle: { opacity: 0 },
        areaStyle: { opacity: 0 },
        stack: 'confidence-80',
        symbol: 'none',
      })
      series.push({
        name: '80% CI Lower',
        type: 'line',
        data: ci80Lower,
        lineStyle: { opacity: 0 },
        areaStyle: {
          color: `${CHART_COLORS[1]}25`,
        },
        stack: 'confidence-80',
        symbol: 'none',
      })
    }

    // 변화점 표시
    if (showChangepoints && changepoints.length > 0) {
      series.push({
        name: '변화점',
        type: 'scatter',
        data: changepoints.map(cp => ({
          value: [cp.date || cp.index, historicalData[cp.index]?.value || 0],
          itemStyle: {
            color: cp.type === 'increase' ? '#22C55E' : '#EF4444',
          },
        })),
        symbol: 'triangle',
        symbolSize: 14,
        z: 10,
      })
    }

    // 예측 시작점 마크라인
    const markLine = {
      silent: true,
      symbol: 'none',
      lineStyle: {
        color: '#94A3B8',
        type: 'dashed',
        width: 1,
      },
      data: [
        {
          xAxis: historicalDates[historicalDates.length - 1],
          label: {
            formatter: '예측 시작',
            position: 'end',
            fontSize: 10,
            color: '#64748B',
          },
        },
      ],
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
          type: 'cross',
          label: {
            backgroundColor: '#1E293B',
          },
        },
        formatter: (params: any) => {
          if (!Array.isArray(params)) return ''
          
          const date = params[0]?.axisValue
          let html = `<div style="font-weight: 600; margin-bottom: 8px;">${date}</div>`
          
          params.forEach((item: any) => {
            if (item.value !== null && item.value !== undefined && 
                !item.seriesName.includes('CI') && item.seriesName !== '95% 신뢰구간' && item.seriesName !== '80% 신뢰구간') {
              html += `<div style="display: flex; justify-content: space-between; gap: 16px; margin: 4px 0;">
                <span>${item.marker} ${item.seriesName}</span>
                <span style="font-weight: 600;">${valueFormatter(item.value)}</span>
              </div>`
            }
          })
          
          // 신뢰 구간 정보 추가
          const predictionItem = params.find((p: any) => p.seriesName === '예측 값' && p.value !== null)
          if (predictionItem) {
            const predIdx = allDates.indexOf(date) - historicalData.length
            if (predIdx >= 0 && predictions[predIdx]) {
              const pred = predictions[predIdx]
              html += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E2E8F0;">
                <div style="font-size: 11px; color: #64748B;">신뢰 구간</div>
                <div style="font-size: 12px;">95%: ${valueFormatter(pred.lower95)} ~ ${valueFormatter(pred.upper95)}</div>
                <div style="font-size: 12px;">80%: ${valueFormatter(pred.lower80)} ~ ${valueFormatter(pred.upper80)}</div>
              </div>`
            }
          }
          
          return html
        },
      },
      legend: {
        data: ['실제 값', '예측 값', ...(showChangepoints ? ['변화점'] : [])],
        bottom: 10,
        itemWidth: 16,
        itemHeight: 10,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: title ? '15%' : '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: allDates,
        boundaryGap: false,
        axisLabel: {
          rotate: allDates.length > 20 ? 45 : 0,
          interval: Math.floor(allDates.length / 10),
          formatter: (value: string) => {
            const date = new Date(value)
            return `${date.getMonth() + 1}/${date.getDate()}`
          },
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => valueFormatter(value),
        },
      },
      dataZoom: [
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
          bottom: 35,
        },
      ],
      series: series.map(s => s.name === '실제 값' ? { ...s, markLine } : s),
    }
  }, [historicalData, predictions, title, subtitle, showConfidenceInterval, showChangepoints, changepoints, valueFormatter])

  const handleEvents = useMemo(() => ({
    click: (params: any) => {
      if (onDataPointClick && params.componentType === 'series') {
        const isHistorical = params.seriesName === '실제 값'
        onDataPointClick({
          date: params.name,
          value: params.value,
          type: isHistorical ? 'historical' : 'predicted',
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

export default EChartsForecast

