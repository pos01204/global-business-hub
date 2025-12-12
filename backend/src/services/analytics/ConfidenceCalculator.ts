/**
 * ConfidenceCalculator - 신뢰도 및 신뢰 구간 계산 유틸리티
 * v4.2: 데이터 신뢰도 개선 계획 구현
 */

// ==================== 타입 정의 ====================

export type Reliability = 'high' | 'medium' | 'low'

export interface ConfidenceInfo {
  value: number
  confidenceInterval: [number, number]
  confidenceLevel: number
  sampleSize: number
  reliability: Reliability
  dataSource: 'actual' | 'estimated'
  dataQuality?: {
    completeness: number  // 0-1
    accuracy: number      // 0-1
    freshness: number     // hours ago
    missingData: number   // count
  }
  statisticalTest?: {
    type: 'proportion' | 'mean'
    pValue?: number | null
    effectSize?: number | null
    stdDev?: number
  }
}

export interface DataQualityMetrics {
  completeness: number
  accuracy: number
  freshness: number
  missingData: number
}

// ==================== 신뢰도 계산 기준 ====================

/**
 * 표본 크기 기반 신뢰도 판정
 */
export function getReliabilityBySampleSize(sampleSize: number): Reliability {
  if (sampleSize >= 100) return 'high'
  if (sampleSize >= 30) return 'medium'
  return 'low'
}

/**
 * 데이터 품질 기반 신뢰도 판정
 */
export function getReliabilityByDataQuality(quality: DataQualityMetrics): Reliability {
  const avgQuality = (quality.completeness + quality.accuracy) / 2
  if (avgQuality >= 0.9) return 'high'
  if (avgQuality >= 0.7) return 'medium'
  return 'low'
}

/**
 * 종합 신뢰도 (가장 낮은 신뢰도 사용)
 */
export function getOverallReliability(
  sampleSizeReliability: Reliability,
  dataQualityReliability: Reliability,
  statisticalReliability?: Reliability
): Reliability {
  const reliabilities = [sampleSizeReliability, dataQualityReliability]
  if (statisticalReliability) reliabilities.push(statisticalReliability)
  
  if (reliabilities.includes('low')) return 'low'
  if (reliabilities.includes('medium')) return 'medium'
  return 'high'
}

// ==================== 신뢰 구간 계산 ====================

/**
 * 비율(proportion)의 신뢰 구간 계산 (Wilson score interval)
 * @param successCount 성공 횟수
 * @param totalCount 전체 횟수
 * @param confidenceLevel 신뢰 수준 (기본 0.95)
 */
export function calculateProportionConfidenceInterval(
  successCount: number,
  totalCount: number,
  confidenceLevel: number = 0.95
): [number, number] {
  if (totalCount === 0) return [0, 0]
  
  const z = getZScore(confidenceLevel)
  const p = successCount / totalCount
  const n = totalCount
  
  // Wilson score interval
  const denominator = 1 + (z * z) / n
  const center = (p + (z * z) / (2 * n)) / denominator
  const margin = (z / denominator) * Math.sqrt((p * (1 - p) + z * z / (4 * n)) / n)
  
  const lower = Math.max(0, center - margin)
  const upper = Math.min(1, center + margin)
  
  return [lower, upper]
}

/**
 * 평균(mean)의 신뢰 구간 계산 (t-분포 기반)
 * @param mean 평균
 * @param stdDev 표준편차
 * @param sampleSize 표본 크기
 * @param confidenceLevel 신뢰 수준 (기본 0.95)
 */
export function calculateMeanConfidenceInterval(
  mean: number,
  stdDev: number,
  sampleSize: number,
  confidenceLevel: number = 0.95
): [number, number] {
  if (sampleSize === 0) return [0, 0]
  
  const df = sampleSize - 1
  const t = getTCritical(confidenceLevel, df)
  const margin = t * (stdDev / Math.sqrt(sampleSize))
  
  return [mean - margin, mean + margin]
}

/**
 * Z-score 계산 (정규분포)
 */
function getZScore(confidenceLevel: number): number {
  const alpha = 1 - confidenceLevel
  // 일반적인 신뢰 수준에 대한 Z-score
  if (confidenceLevel === 0.95) return 1.96
  if (confidenceLevel === 0.99) return 2.58
  if (confidenceLevel === 0.90) return 1.645
  // 근사치
  return 1.96
}

/**
 * t-분포 임계값 계산
 */
function getTCritical(confidenceLevel: number, df: number): number {
  const alpha = 1 - confidenceLevel
  
  // 대표본 (df >= 30): 정규분포 근사
  if (df >= 30) {
    if (confidenceLevel === 0.95) return 1.96
    if (confidenceLevel === 0.99) return 2.58
    if (confidenceLevel === 0.90) return 1.645
  }
  
  // 소표본 근사치
  const criticalValues: Record<number, Record<number, number>> = {
    0.05: { 1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571, 10: 2.228, 20: 2.086, 30: 2.042 },
    0.01: { 1: 63.657, 2: 9.925, 3: 5.841, 4: 4.604, 5: 4.032, 10: 3.169, 20: 2.845, 30: 2.750 },
    0.10: { 1: 6.314, 2: 2.920, 3: 2.353, 4: 2.132, 5: 2.015, 10: 1.812, 20: 1.725, 30: 1.697 },
  }
  
  const dfKey = df <= 5 ? df : df <= 10 ? 10 : df <= 20 ? 20 : 30
  const critical = criticalValues[alpha]?.[dfKey]
  
  if (critical) return critical
  
  // 선형 보간 근사
  if (df < 30) {
    const lower = df <= 5 ? df : df <= 10 ? 10 : 20
    const upper = df <= 10 ? 10 : df <= 20 ? 20 : 30
    const lowerVal = criticalValues[alpha]?.[lower] || 2.0
    const upperVal = criticalValues[alpha]?.[upper] || 2.0
    return lowerVal + (upperVal - lowerVal) * ((df - lower) / (upper - lower))
  }
  
  return 2.0
}

// ==================== 데이터 품질 평가 ====================

/**
 * 데이터 품질 평가
 */
export function evaluateDataQuality(
  totalRecords: number,
  missingRecords: number,
  lastUpdateTime: Date,
  accuracyEstimate: number = 0.95 // 기본 정확도 추정치
): DataQualityMetrics {
  const now = new Date()
  const freshness = (now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60) // hours
  
  return {
    completeness: totalRecords > 0 ? 1 - (missingRecords / totalRecords) : 0,
    accuracy: accuracyEstimate,
    freshness,
    missingData: missingRecords
  }
}

/**
 * 데이터 배열로부터 데이터 품질 평가 (v4.2)
 * @param data 데이터 배열
 * @param sheetName 시트 이름 (선택적, 로깅용)
 */
export function assessDataQuality(
  data: any[],
  sheetName?: string
): DataQualityMetrics {
  if (!data || data.length === 0) {
    return {
      completeness: 0,
      accuracy: 0,
      freshness: Infinity,
      missingData: 0
    }
  }

  const totalRecords = data.length
  
  // 필수 필드 체크 (logistics 시트 기준)
  const requiredFields = ['user_id', 'order_created', 'Total GMV']
  let missingRecords = 0
  
  for (const row of data) {
    const hasAllFields = requiredFields.every(field => {
      const value = row[field]
      return value !== null && value !== undefined && value !== ''
    })
    if (!hasAllFields) {
      missingRecords++
    }
  }
  
  // 데이터 정확도 추정 (기본값 0.95, 실제로는 데이터 검증 로직 필요)
  const accuracyEstimate = 0.95
  
  // 데이터 신선도 (실제로는 데이터 소스에서 가져와야 함, 여기서는 기본값)
  const lastUpdateTime = new Date()
  const now = new Date()
  const freshness = 0 // 매일 업데이트되므로 0시간으로 가정
  
  return {
    completeness: totalRecords > 0 ? 1 - (missingRecords / totalRecords) : 0,
    accuracy: accuracyEstimate,
    freshness,
    missingData: missingRecords
  }
}

// ==================== 메인 계산 함수 ====================

/**
 * 비율 지표의 신뢰도 정보 계산
 */
export function calculateProportionConfidence(
  successCount: number,
  totalCount: number,
  dataSource: 'actual' | 'estimated' = 'actual',
  dataQuality?: DataQualityMetrics,
  confidenceLevel: number = 0.95
): ConfidenceInfo {
  const value = totalCount > 0 ? successCount / totalCount : 0
  const confidenceInterval = calculateProportionConfidenceInterval(successCount, totalCount, confidenceLevel)
  const sampleSizeReliability = getReliabilityBySampleSize(totalCount)
  
  let overallReliability = sampleSizeReliability
  if (dataQuality) {
    const qualityReliability = getReliabilityByDataQuality(dataQuality)
    overallReliability = getOverallReliability(sampleSizeReliability, qualityReliability)
  }
  
  return {
    value,
    confidenceInterval,
    confidenceLevel,
    sampleSize: totalCount,
    reliability: overallReliability,
    dataSource,
    dataQuality,
    statisticalTest: {
      type: 'proportion',
      pValue: null, // 단일 비율이므로 검증 불필요
      effectSize: null
    }
  }
}

/**
 * 평균 지표의 신뢰도 정보 계산
 */
export function calculateMeanConfidence(
  values: number[],
  dataSource: 'actual' | 'estimated' = 'actual',
  dataQuality?: DataQualityMetrics,
  confidenceLevel: number = 0.95
): ConfidenceInfo {
  if (values.length === 0) {
    return {
      value: 0,
      confidenceInterval: [0, 0],
      confidenceLevel,
      sampleSize: 0,
      reliability: 'low',
      dataSource,
      dataQuality
    }
  }
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1)
  const stdDev = Math.sqrt(variance)
  
  const confidenceInterval = calculateMeanConfidenceInterval(mean, stdDev, values.length, confidenceLevel)
  const sampleSizeReliability = getReliabilityBySampleSize(values.length)
  
  let overallReliability = sampleSizeReliability
  if (dataQuality) {
    const qualityReliability = getReliabilityByDataQuality(dataQuality)
    overallReliability = getOverallReliability(sampleSizeReliability, qualityReliability)
  }
  
  return {
    value: mean,
    confidenceInterval,
    confidenceLevel,
    sampleSize: values.length,
    reliability: overallReliability,
    dataSource,
    dataQuality,
    statisticalTest: {
      type: 'mean',
      stdDev,
      pValue: null, // 단일 평균이므로 검증 불필요
      effectSize: null
    }
  }
}

/**
 * 카운트 지표의 신뢰도 정보 계산 (포아송 분포 근사)
 */
export function calculateCountConfidence(
  count: number,
  dataSource: 'actual' | 'estimated' = 'actual',
  dataQuality?: DataQualityMetrics,
  confidenceLevel: number = 0.95
): ConfidenceInfo {
  // 포아송 분포 근사: 평균 = 분산 = count
  const stdDev = Math.sqrt(count)
  const confidenceInterval = calculateMeanConfidenceInterval(count, stdDev, Math.max(1, count), confidenceLevel)
  const sampleSizeReliability = getReliabilityBySampleSize(count)
  
  let overallReliability = sampleSizeReliability
  if (dataQuality) {
    const qualityReliability = getReliabilityByDataQuality(dataQuality)
    overallReliability = getOverallReliability(sampleSizeReliability, qualityReliability)
  }
  
  return {
    value: count,
    confidenceInterval: [
      Math.max(0, Math.round(confidenceInterval[0])),
      Math.round(confidenceInterval[1])
    ] as [number, number],
    confidenceLevel,
    sampleSize: count,
    reliability: overallReliability,
    dataSource,
    dataQuality
  }
}

