/**
 * Business Brain 차트 컴포넌트 모음
 * v4.3: Business Brain 시각화 개선
 * v5.0: ECharts 기반 고급 차트 추가
 */

// 기존 Chart.js 기반 차트 (레거시)
export { LineChart } from './LineChart'
export type { LineChartData } from './LineChart'

export { BarChart } from './BarChart'
export type { BarChartData } from './BarChart'

export { DoughnutChart } from './DoughnutChart'
export type { DoughnutChartData } from './DoughnutChart'

export { RadarChart } from './RadarChart'
export type { RadarChartData } from './RadarChart'

export { HeatmapChart } from './HeatmapChart'
export type { HeatmapData } from './HeatmapChart'

// v5.0: ECharts 기반 고급 차트
export { EChartsWrapper } from './EChartsWrapper'
export type { EChartsWrapperProps } from './EChartsWrapper'

export { EChartsTrendChart } from './EChartsTrendChart'
export type { TrendDataPoint, TrendSeries, EChartsTrendChartProps } from './EChartsTrendChart'

export { EChartsHeatmap } from './EChartsHeatmap'
export type { HeatmapCell, EChartsHeatmapProps } from './EChartsHeatmap'

export { EChartsPieChart } from './EChartsPieChart'
export type { PieDataItem, EChartsPieChartProps } from './EChartsPieChart'

export { EChartsBarChart } from './EChartsBarChart'
export type { BarDataItem, BarSeries, EChartsBarChartProps } from './EChartsBarChart'

export { EChartsRadar } from './EChartsRadar'
export type { RadarIndicator, RadarSeries, EChartsRadarProps } from './EChartsRadar'

export { EChartsForecast } from './EChartsForecast'
export type { EChartsForecastProps } from './EChartsForecast'

