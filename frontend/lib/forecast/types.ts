/**
 * 예측 시스템 타입 정의
 * Phase 2: 앙상블 예측 엔진
 */

// 예측 결과 타입
export interface ForecastResult {
  date: string
  predicted: number
  lower95: number
  upper95: number
  lower80: number
  upper80: number
}

// 앙상블 예측 결과
export interface EnsembleForecastResult {
  predictions: ForecastResult[]
  modelContributions: Array<{
    name: string
    weight: number
    predictions: number[]
  }>
  metrics: {
    ensembleAgreement: number // 모델 간 일치도 (0-1)
    averageUncertainty: number // 평균 불확실성
  }
  confidence: number // 전체 신뢰도 (0-1)
}

// 예측 모델 인터페이스
export interface ForecastModel {
  name: string
  weight: number
  predict(data: number[], periods: number): number[]
}

// 신뢰 구간 결과
export interface ConfidenceIntervalResult {
  lower95: number[]
  upper95: number[]
  lower80: number[]
  upper80: number[]
}

// 예측 성능 지표
export interface ForecastMetrics {
  mape: number // Mean Absolute Percentage Error
  rmse: number // Root Mean Square Error
  mae: number // Mean Absolute Error
  mse: number // Mean Square Error
  r2: number // R-squared
  bias: number // 평균 편향
}

// 예측 추적 기록
export interface ForecastRecord {
  id: string
  createdAt: string
  metric: string
  period: number
  predictions: ForecastResult[]
  actualValues?: number[]
  metrics?: ForecastMetrics
  status: 'pending' | 'validated' | 'expired'
}

// 변화점 결과
export interface ChangepointResult {
  index: number
  date?: string
  type: 'increase' | 'decrease' | 'level_shift' | 'trend_change'
  magnitude: number
  confidence: number
  beforeMean: number
  afterMean: number
}

// 시계열 분해 결과
export interface DecompositionResult {
  trend: number[]
  seasonal: number[]
  residual: number[]
  seasonalStrength: number
  trendStrength: number
}

