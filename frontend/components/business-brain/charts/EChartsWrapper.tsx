/**
 * EChartsWrapper - ECharts 래퍼 컴포넌트
 * Business Brain 시각화를 위한 통합 차트 컴포넌트
 */

'use client'

import { useRef, useEffect, useMemo, useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption, ECharts } from 'echarts'
import { getEChartsTheme, CHART_COLORS } from '@/lib/echarts-theme'

// 다크모드 감지 훅
function useIsDarkMode() {
  // SSR 안전하게 처리
  if (typeof window === 'undefined') return false
  
  // 현재는 간단하게 body 클래스로 감지
  // 실제로는 next-themes 등을 사용하면 더 좋음
  return document.documentElement.classList.contains('dark')
}

export interface EChartsWrapperProps {
  option: EChartsOption
  height?: number | string
  loading?: boolean
  showLoading?: boolean
  theme?: 'light' | 'dark' | 'auto'
  onEvents?: Record<string, (params: any, chart: ECharts) => void>
  onChartReady?: (chart: ECharts) => void
  className?: string
  style?: React.CSSProperties
  notMerge?: boolean
  lazyUpdate?: boolean
}

export function EChartsWrapper({
  option,
  height = 400,
  loading = false,
  showLoading = false,
  theme = 'auto',
  onEvents,
  onChartReady,
  className = '',
  style,
  notMerge = true,
  lazyUpdate = true,
}: EChartsWrapperProps) {
  const chartRef = useRef<ReactECharts>(null)
  
  // 다크모드 감지
  const systemIsDark = useIsDarkMode()
  const isDark = theme === 'auto' ? systemIsDark : theme === 'dark'
  
  // 테마 적용된 옵션 생성
  const mergedOption = useMemo(() => {
    const themeConfig = getEChartsTheme(isDark)
    
    return {
      ...themeConfig,
      ...option,
      // 색상 팔레트 기본 적용
      color: option.color || CHART_COLORS,
      // 애니메이션 설정
      animation: option.animation !== false,
      animationDuration: 800,
      animationEasing: 'cubicOut',
    }
  }, [option, isDark])
  
  // 차트 인스턴스 가져오기
  const getChartInstance = useCallback(() => {
    return chartRef.current?.getEchartsInstance()
  }, [])
  
  // 차트 리사이즈 처리
  useEffect(() => {
    const chart = getChartInstance()
    if (!chart) return
    
    const handleResize = () => {
      chart.resize()
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [getChartInstance])
  
  // 차트 준비 완료 콜백
  const handleChartReady = useCallback((chart: ECharts) => {
    onChartReady?.(chart)
  }, [onChartReady])
  
  // 로딩 설정
  const loadingOption = {
    text: '데이터 로딩 중...',
    color: '#F97316',
    textColor: isDark ? '#CBD5E1' : '#475569',
    maskColor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
    zlevel: 0,
    fontSize: 14,
    spinnerRadius: 12,
    lineWidth: 3,
  }
  
  // 높이 스타일 처리
  const heightStyle = typeof height === 'number' ? `${height}px` : height
  
  return (
    <div 
      className={`echarts-wrapper ${className}`}
      style={{ 
        width: '100%', 
        height: heightStyle,
        ...style 
      }}
    >
      <ReactECharts
        ref={chartRef}
        option={mergedOption}
        style={{ width: '100%', height: '100%' }}
        opts={{ renderer: 'canvas' }}
        showLoading={loading || showLoading}
        loadingOption={loadingOption}
        onEvents={onEvents}
        onChartReady={handleChartReady}
        notMerge={notMerge}
        lazyUpdate={lazyUpdate}
      />
    </div>
  )
}

export default EChartsWrapper

