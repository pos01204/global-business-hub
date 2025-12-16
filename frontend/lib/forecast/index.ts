/**
 * 예측 시스템 모듈
 * Business Brain 고급 예측 기능
 */

// 타입
export type {
  ForecastResult,
  EnsembleForecastResult,
  ForecastModel,
  ConfidenceIntervalResult,
  ForecastMetrics,
  ForecastRecord,
  ChangepointResult,
  DecompositionResult,
} from './types'

// 앙상블 예측 엔진
export { EnsembleForecastEngine, ensembleForecastEngine } from './EnsembleForecastEngine'

// 변화점 탐지
export { ChangepointDetector, changepointDetector } from './ChangepointDetector'
export type { ChangepointConfig } from './ChangepointDetector'

// 예측 성능 지표
export { ForecastMetricsCalculator, forecastMetrics } from './ForecastMetrics'
export type { 
  ForecastAccuracyMetrics, 
  ForecastComparisonResult,
  ModelPerformanceRecord 
} from './ForecastMetrics'

// 예측 추적
export { ForecastTracker, forecastTracker } from './ForecastTracker'
export type { 
  TrackedForecast, 
  ModelPerformanceHistory,
  ForecastTrackerConfig 
} from './ForecastTracker'

