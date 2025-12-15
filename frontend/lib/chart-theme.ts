// lib/chart-theme.ts
// Recharts 통일된 테마 설정

export const chartTheme = {
  colors: {
    primary: '#F78C3A', // idus Orange
    secondary: '#3B82F6', // Blue
    success: '#10B981', // Green
    warning: '#F59E0B', // Amber
    danger: '#EF4444', // Red
    info: '#06B6D4', // Cyan
    purple: '#8B5CF6', // Purple
    rose: '#F43F5E', // Rose
  },
  grid: {
    stroke: '#E5E7EB',
    strokeWidth: 1,
    strokeDasharray: '3 3',
    opacity: 0.1,
  },
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: 'none',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    padding: '12px',
  },
  animation: {
    duration: 1000,
    easing: 'ease-out',
  },
  // 다크모드 지원
  dark: {
    grid: {
      stroke: '#475569',
      strokeWidth: 1,
      strokeDasharray: '3 3',
      opacity: 0.2,
    },
    tooltip: {
      backgroundColor: 'rgba(30, 41, 59, 0.95)',
      border: 'none',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      padding: '12px',
    },
  },
}

// 차트 색상 팔레트 (여러 데이터 시리즈용)
export const chartColorPalette = [
  chartTheme.colors.primary,
  chartTheme.colors.secondary,
  chartTheme.colors.success,
  chartTheme.colors.warning,
  chartTheme.colors.danger,
  chartTheme.colors.info,
  chartTheme.colors.purple,
  chartTheme.colors.rose,
]

