// Enhanced Charts Components (Recharts 기반)
export { EnhancedLineChart } from './EnhancedLineChart'
export type { EnhancedLineChartProps } from './EnhancedLineChart'

export { EnhancedBarChart } from './EnhancedBarChart'
export type { EnhancedBarChartProps } from './EnhancedBarChart'

export { EnhancedAreaChart } from './EnhancedAreaChart'
export type { EnhancedAreaChartProps } from './EnhancedAreaChart'

export { EnhancedDoughnutChart } from './EnhancedDoughnutChart'
export type { EnhancedDoughnutChartProps } from './EnhancedDoughnutChart'

export { GMVTrendChart } from './GMVTrendChart'
export type { GMVTrendChartProps, GMVTrendData } from './GMVTrendChart'

// 차트 툴팁 컴포넌트 (Phase 2 커스터마이징)
export {
  CustomChartTooltip,
  GMVTooltip,
  PercentTooltip,
  OrderCountTooltip,
  CompositeTooltip,
  DateLabelFormatter,
} from './ChartTooltip'

export type { ChartTooltipProps } from './ChartTooltip'

export { StatSummaryCards } from './StatSummaryCards'
export type { StatSummaryCardsProps, StatCardData } from './StatSummaryCards'

// Tremor 기반 통합 차트 컴포넌트 (Phase 2)
export {
  UnifiedAreaChart,
  UnifiedBarChart,
  UnifiedLineChart,
  UnifiedDonutChart,
  UnifiedSparkAreaChart,
  UnifiedSparkLineChart,
  UnifiedSparkBarChart,
  TremorKPICard,
  ComparisonChart,
  GoalProgressChart,
} from './TremorCharts'

export type {
  ChartDataPoint,
  TremorChartProps,
  UnifiedAreaChartProps,
  UnifiedBarChartProps,
  UnifiedLineChartProps,
  UnifiedDonutChartProps,
  SparkChartProps,
  TremorKPICardProps,
  ComparisonChartProps,
  GoalProgressChartProps,
} from './TremorCharts'

// Nivo 기반 고급 시각화 컴포넌트 (Phase 2)
export {
  PipelineSankey,
  ActivityCalendar,
  HierarchySunburst,
  CohortHeatMap,
  createPipelineSankeyData,
} from './NivoCharts'

export type {
  SankeyNode,
  SankeyLink,
  SankeyData,
  PipelineSankeyProps,
  CalendarDataPoint,
  ActivityCalendarProps,
  SunburstDataNode,
  HierarchySunburstProps,
  HeatMapDataPoint,
  CohortHeatMapProps,
  PipelineStage,
} from './NivoCharts'

// 지도 시각화 컴포넌트 (Phase 2)
export {
  CountryGMVMap,
  AsiaRegionMap,
  countryCodeMap,
  convertToCountryData,
} from './GeoMap'

export type {
  CountryData as GeoCountryData,
  CountryGMVMapProps,
  AsiaRegionMapProps,
} from './GeoMap'

// === Phase 3: 대시보드 지표 확장 차트 컴포넌트 ===

// Season Pattern for GMVTrendChart
export type { SeasonPattern } from './GMVTrendChart'

// Country Contribution (국가별 GMV 기여도)
export { CountryContribution } from './CountryContribution'
export type { 
  CountryContributionProps, 
  CountryData as ContributionCountryData,
  TopContributor 
} from './CountryContribution'

// Monthly Forecast (금월 GMV 예측)
export { MonthlyForecast } from './MonthlyForecast'
export type { 
  MonthlyForecastProps, 
  ForecastData, 
  ForecastFactors 
} from './MonthlyForecast'

