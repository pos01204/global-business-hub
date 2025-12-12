/**
 * Business Brain Analytics Engine
 * 기존 기능과 독립적으로 동작하는 고급 분석 모듈
 */

export { CubeAnalyzer } from './CubeAnalyzer'
export { DecompositionEngine } from './DecompositionEngine'
export { InsightScorer } from './InsightScorer'
export { HealthScoreCalculator } from './HealthScoreCalculator'
export { BusinessBrainCache, businessBrainCache, CACHE_TTL } from './BusinessBrainCache'
export { DataProcessor } from './DataProcessor'
export { AIBriefingGenerator, aiBriefingGenerator } from './AIBriefingGenerator'

// v4.0 추가 서비스
export { mapActionsToInsight, mapActionsToInsights } from './InsightActionMapper'
export { exportData, getSupportedExportTypes } from './ExportService'
export { ChurnPredictor } from './ChurnPredictor'
export { ArtistHealthCalculator } from './ArtistHealthCalculator'

// v4.1 추가 서비스
export { NewUserAcquisitionAnalyzer, newUserAcquisitionAnalyzer } from './NewUserAcquisitionAnalyzer'
export { RepurchaseAnalyzer, repurchaseAnalyzer } from './RepurchaseAnalyzer'
export { TimeSeriesDecomposer, timeSeriesDecomposer } from './TimeSeriesDecomposer'
export type { 
  TimeSeriesDecomposition,
  TimeSeriesPoint,
  SeasonalPattern,
  TrendAnalysis,
  AnomalyPoint
} from './TimeSeriesDecomposer'

// v4.1 Phase 2: 통계적 유의성 검증
export { StatisticalValidator, statisticalValidator, compareGroups, compareCategorical } from './StatisticalValidator'
export type {
  StatisticalInsight,
  GroupStatistics,
  StatisticalTest,
  ConfidenceInterval
} from './StatisticalValidator'

// v4.1 Phase 2: 인과관계 추론
export { CausalInferenceEngine, causalInferenceEngine } from './CausalInferenceEngine'
export type {
  CausalAnalysis,
  Observation,
  PotentialCause
} from './CausalInferenceEngine'

// v4.2: 데이터 신뢰도 개선
export {
  ConfidenceCalculator,
  calculateProportionConfidence,
  calculateMeanConfidence,
  calculateCountConfidence,
  evaluateDataQuality,
  getReliabilityBySampleSize,
  getReliabilityByDataQuality,
  getOverallReliability
} from './ConfidenceCalculator'
export type {
  ConfidenceInfo,
  Reliability,
  DataQualityMetrics
} from './ConfidenceCalculator'

// Types
export * from './types'
export * from './DataProcessor'
export * from './AIBriefingGenerator'
