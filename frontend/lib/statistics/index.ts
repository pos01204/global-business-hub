/**
 * 통계 분석 모듈
 * Business Brain 고급 분석을 위한 통계 유틸리티
 */

export { StatisticsEngine, statisticsEngine } from './StatisticsEngine'
export type { 
  AnomalyResult, 
  RegressionResult, 
  DecompositionResult, 
  ChangepointResult,
  StatsSummary 
} from './StatisticsEngine'

export { AnomalyDetector, anomalyDetector } from './AnomalyDetector'
export type { 
  AnomalyResult as DetectorAnomalyResult,
  AnomalySummary,
  AnomalyDetectionConfig 
} from './AnomalyDetector'

export { ABTestAnalyzer, abTestAnalyzer } from './ABTestAnalyzer'
export type { 
  ABTestResult,
  ABTestConfig 
} from './ABTestAnalyzer'

