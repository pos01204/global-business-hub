/**
 * ECharts 테마 설정
 * Business Brain 시각화를 위한 통일된 테마
 */

// idus 브랜드 컬러 팔레트
export const BRAND_COLORS = {
  primary: '#F97316',      // idus 오렌지
  secondary: '#3B82F6',    // 블루
  success: '#22C55E',      // 그린
  warning: '#F59E0B',      // 앰버
  danger: '#EF4444',       // 레드
  info: '#06B6D4',         // 시안
  purple: '#8B5CF6',       // 퍼플
  pink: '#EC4899',         // 핑크
}

// 차트 색상 팔레트 (순서대로 사용)
export const CHART_COLORS = [
  '#F97316', // idus 오렌지
  '#3B82F6', // 블루
  '#22C55E', // 그린
  '#8B5CF6', // 퍼플
  '#EC4899', // 핑크
  '#06B6D4', // 시안
  '#F59E0B', // 앰버
  '#EF4444', // 레드
  '#14B8A6', // 틸
  '#6366F1', // 인디고
]

// 그라데이션 색상 생성
export function createGradient(color: string, opacity1 = 0.4, opacity2 = 0.05) {
  return {
    type: 'linear' as const,
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      { offset: 0, color: `${color}${Math.round(opacity1 * 255).toString(16).padStart(2, '0')}` },
      { offset: 1, color: `${color}${Math.round(opacity2 * 255).toString(16).padStart(2, '0')}` },
    ],
  }
}

// 라이트 테마 설정
export const lightTheme = {
  backgroundColor: 'transparent',
  textStyle: {
    color: '#334155',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  title: {
    textStyle: {
      color: '#0F172A',
      fontSize: 16,
      fontWeight: 600,
    },
    subtextStyle: {
      color: '#64748B',
      fontSize: 12,
    },
  },
  legend: {
    textStyle: {
      color: '#475569',
      fontSize: 12,
    },
    pageTextStyle: {
      color: '#64748B',
    },
  },
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    textStyle: {
      color: '#1E293B',
      fontSize: 13,
    },
    extraCssText: 'box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); border-radius: 8px;',
  },
  axisPointer: {
    lineStyle: {
      color: '#CBD5E1',
    },
    crossStyle: {
      color: '#CBD5E1',
    },
  },
  xAxis: {
    axisLine: {
      lineStyle: {
        color: '#E2E8F0',
      },
    },
    axisTick: {
      lineStyle: {
        color: '#E2E8F0',
      },
    },
    axisLabel: {
      color: '#64748B',
      fontSize: 11,
    },
    splitLine: {
      lineStyle: {
        color: '#F1F5F9',
        type: 'dashed' as const,
      },
    },
  },
  yAxis: {
    axisLine: {
      show: false,
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      color: '#64748B',
      fontSize: 11,
    },
    splitLine: {
      lineStyle: {
        color: '#F1F5F9',
        type: 'dashed' as const,
      },
    },
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '12%',
    top: '15%',
    containLabel: true,
  },
}

// 다크 테마 설정
export const darkTheme = {
  backgroundColor: 'transparent',
  textStyle: {
    color: '#CBD5E1',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  title: {
    textStyle: {
      color: '#F1F5F9',
      fontSize: 16,
      fontWeight: 600,
    },
    subtextStyle: {
      color: '#94A3B8',
      fontSize: 12,
    },
  },
  legend: {
    textStyle: {
      color: '#94A3B8',
      fontSize: 12,
    },
    pageTextStyle: {
      color: '#64748B',
    },
  },
  tooltip: {
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    borderColor: '#334155',
    borderWidth: 1,
    textStyle: {
      color: '#F1F5F9',
      fontSize: 13,
    },
    extraCssText: 'box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.2); border-radius: 8px;',
  },
  axisPointer: {
    lineStyle: {
      color: '#475569',
    },
    crossStyle: {
      color: '#475569',
    },
  },
  xAxis: {
    axisLine: {
      lineStyle: {
        color: '#334155',
      },
    },
    axisTick: {
      lineStyle: {
        color: '#334155',
      },
    },
    axisLabel: {
      color: '#94A3B8',
      fontSize: 11,
    },
    splitLine: {
      lineStyle: {
        color: '#1E293B',
        type: 'dashed' as const,
      },
    },
  },
  yAxis: {
    axisLine: {
      show: false,
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      color: '#94A3B8',
      fontSize: 11,
    },
    splitLine: {
      lineStyle: {
        color: '#1E293B',
        type: 'dashed' as const,
      },
    },
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '12%',
    top: '15%',
    containLabel: true,
  },
}

// 테마 가져오기 함수
export function getEChartsTheme(isDark: boolean) {
  return isDark ? darkTheme : lightTheme
}

// 숫자 포맷팅 함수들
export function formatNumber(value: number): string {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toFixed(0)
}

export function formatCurrency(value: number, currency = '₩'): string {
  return `${currency}${formatNumber(value)}`
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

// 툴팁 포맷터 생성
export function createTooltipFormatter(
  formatValue: (value: number) => string = formatNumber
) {
  return function(params: any) {
    if (Array.isArray(params)) {
      let result = `<div style="font-weight: 600; margin-bottom: 8px;">${params[0].axisValue}</div>`
      params.forEach((item: any) => {
        const color = item.color
        const marker = `<span style="display:inline-block;margin-right:5px;border-radius:50%;width:10px;height:10px;background-color:${color};"></span>`
        result += `<div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; margin: 4px 0;">
          <span>${marker}${item.seriesName}</span>
          <span style="font-weight: 600;">${formatValue(item.value)}</span>
        </div>`
      })
      return result
    }
    return `${params.name}: ${formatValue(params.value)}`
  }
}

