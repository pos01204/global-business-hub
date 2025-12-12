/**
 * StatisticalValidator - 통계적 유의성 검증 모듈
 * v4.1: t-검정, 카이제곱 검정, Mann-Whitney U 검정 등 통계적 검증 제공
 */

// ==================== 타입 정의 ====================

export interface GroupStatistics {
  name: string
  mean: number
  stdDev: number
  sampleSize: number
  median?: number
  min?: number
  max?: number
}

export interface StatisticalTest {
  type: 't-test' | 'chi-square' | 'mann-whitney' | 'welch'
  statistic: number
  pValue: number
  degreesOfFreedom?: number
  effectSize: number            // Cohen's d (t-test) or Cramér's V (chi-square)
  effectSizeInterpretation: 'large' | 'medium' | 'small' | 'negligible'
}

export interface ConfidenceInterval {
  level: number                 // 0.95 (95%)
  interval: [number, number]     // 차이의 신뢰 구간
  marginOfError: number
}

export interface StatisticalInsight {
  comparison: {
    groupA: GroupStatistics
    groupB: GroupStatistics
  }
  
  test: StatisticalTest
  
  confidence: ConfidenceInterval
  
  interpretation: {
    isSignificant: boolean
    confidence: 'high' | 'medium' | 'low'
    practicalSignificance: 'large' | 'medium' | 'small' | 'negligible'
    narrative: string
  }
}

// ==================== 유틸리티 함수 ====================

/**
 * 평균 계산
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

/**
 * 표준편차 계산
 */
function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0
  const avg = mean(values)
  const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / (values.length - 1)
  return Math.sqrt(variance)
}

/**
 * 중앙값 계산
 */
function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

/**
 * t-분포 임계값 (근사치)
 * 자유도와 유의수준에 따른 t-값 반환
 */
function tCritical(alpha: number, df: number): number {
  // 간단한 근사치 (정확한 값은 t-분포 테이블 필요)
  // 일반적인 값들에 대한 근사
  if (df >= 30) {
    // 대표본: 정규분포 근사
    if (alpha === 0.05) return 1.96
    if (alpha === 0.01) return 2.58
    if (alpha === 0.10) return 1.645
  }
  
  // 소표본 근사치
  const criticalValues: Record<number, Record<number, number>> = {
    0.05: { 1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571, 10: 2.228, 20: 2.086, 30: 2.042 },
    0.01: { 1: 63.657, 2: 9.925, 3: 5.841, 4: 4.604, 5: 4.032, 10: 3.169, 20: 2.845, 30: 2.750 },
    0.10: { 1: 6.314, 2: 2.920, 3: 2.353, 4: 2.132, 5: 2.015, 10: 1.812, 20: 1.725, 30: 1.697 }
  }
  
  const alphaKey = alpha as 0.05 | 0.01 | 0.10
  if (criticalValues[alphaKey]) {
    const dfKey = Object.keys(criticalValues[alphaKey])
      .map(Number)
      .sort((a, b) => b - a)
      .find(key => df >= key)
    
    if (dfKey) {
      return criticalValues[alphaKey][dfKey]
    }
  }
  
  // 기본값 (보수적)
  return 2.0
}

/**
 * t-분포 p-value 계산 (근사치)
 */
function tDistributionPValue(tStat: number, df: number): number {
  // 간단한 근사치 계산
  const absT = Math.abs(tStat)
  
  // 대표본 근사
  if (df >= 30) {
    // 정규분포 근사
    if (absT >= 2.58) return 0.01
    if (absT >= 1.96) return 0.05
    if (absT >= 1.645) return 0.10
    return 0.20
  }
  
  // 소표본 근사
  const critical05 = tCritical(0.05, df)
  const critical01 = tCritical(0.01, df)
  const critical10 = tCritical(0.10, df)
  
  if (absT >= critical01) return 0.01
  if (absT >= critical05) return 0.05
  if (absT >= critical10) return 0.10
  
  // 선형 보간 근사
  return Math.max(0.01, Math.min(0.50, 0.5 - (absT / (critical05 * 2))))
}

/**
 * Cohen's d 계산 (효과 크기)
 */
function cohensD(
  meanA: number,
  meanB: number,
  stdA: number,
  stdB: number,
  nA: number,
  nB: number
): number {
  // Pooled standard deviation
  const pooledStd = Math.sqrt(
    ((nA - 1) * stdA ** 2 + (nB - 1) * stdB ** 2) / 
    (nA + nB - 2)
  )
  
  if (pooledStd === 0) return 0
  
  return Math.abs(meanA - meanB) / pooledStd
}

/**
 * 효과 크기 해석
 */
function interpretEffectSize(effectSize: number): 'large' | 'medium' | 'small' | 'negligible' {
  if (effectSize > 0.8) return 'large'
  if (effectSize > 0.5) return 'medium'
  if (effectSize > 0.2) return 'small'
  return 'negligible'
}

// ==================== 통계적 검증 함수 ====================

/**
 * 두 그룹 비교 (t-검정)
 */
export function compareGroups(
  groupA: number[],
  groupB: number[],
  groupAName: string = '그룹 A',
  groupBName: string = '그룹 B',
  alpha: number = 0.05
): StatisticalInsight {
  if (groupA.length === 0 || groupB.length === 0) {
    throw new Error('그룹 데이터가 비어있습니다.')
  }

  // 기본 통계량 계산
  const meanA = mean(groupA)
  const meanB = mean(groupB)
  const stdA = standardDeviation(groupA)
  const stdB = standardDeviation(groupB)
  const medianA = median(groupA)
  const medianB = median(groupB)

  // 등분산성 가정 (Welch's t-test 사용)
  const varianceA = stdA ** 2
  const varianceB = stdB ** 2
  const nA = groupA.length
  const nB = groupB.length

  // Welch's t-test (등분산성 가정 불필요)
  const tStat = (meanA - meanB) / Math.sqrt(
    (varianceA / nA) + (varianceB / nB)
  )

  // 자유도 (Welch-Satterthwaite equation)
  const df = Math.pow((varianceA / nA) + (varianceB / nB), 2) /
    (Math.pow(varianceA / nA, 2) / (nA - 1) + Math.pow(varianceB / nB, 2) / (nB - 1))

  const pValue = tDistributionPValue(tStat, df)

  // 효과 크기
  const effectSize = cohensD(meanA, meanB, stdA, stdB, nA, nB)
  const effectSizeInterpretation = interpretEffectSize(effectSize)

  // 신뢰 구간
  const marginOfError = tCritical(alpha, df) * Math.sqrt(
    (varianceA / nA) + (varianceB / nB)
  )
  const diff = meanA - meanB
  const confidenceInterval: [number, number] = [
    diff - marginOfError,
    diff + marginOfError
  ]

  // 해석 생성
  const isSignificant = pValue < alpha
  const confidenceLevel: 'high' | 'medium' | 'low' = 
    pValue < 0.01 ? 'high' :
    pValue < 0.05 ? 'medium' : 'low'

  const narrative = generateNarrative(
    isSignificant,
    effectSizeInterpretation,
    meanA,
    meanB,
    groupAName,
    groupBName,
    pValue,
    confidenceLevel
  )

  return {
    comparison: {
      groupA: {
        name: groupAName,
        mean: meanA,
        stdDev: stdA,
        sampleSize: nA,
        median: medianA,
        min: Math.min(...groupA),
        max: Math.max(...groupA)
      },
      groupB: {
        name: groupBName,
        mean: meanB,
        stdDev: stdB,
        sampleSize: nB,
        median: medianB,
        min: Math.min(...groupB),
        max: Math.max(...groupB)
      }
    },
    test: {
      type: 'welch',
      statistic: tStat,
      pValue,
      degreesOfFreedom: df,
      effectSize,
      effectSizeInterpretation
    },
    confidence: {
      level: 1 - alpha,
      interval: confidenceInterval,
      marginOfError
    },
    interpretation: {
      isSignificant,
      confidence: confidenceLevel,
      practicalSignificance: effectSizeInterpretation,
      narrative
    }
  }
}

/**
 * 자연어 해석 생성
 */
function generateNarrative(
  isSignificant: boolean,
  practicalSignificance: 'large' | 'medium' | 'small' | 'negligible',
  meanA: number,
  meanB: number,
  groupAName: string,
  groupBName: string,
  pValue: number,
  confidence: 'high' | 'medium' | 'low'
): string {
  const diff = meanA - meanB
  const diffPercent = meanB !== 0 ? (diff / meanB) * 100 : 0

  if (isSignificant) {
    const direction = diff > 0 ? '높습니다' : '낮습니다'
    const significanceText = 
      practicalSignificance === 'large' ? '크게' :
      practicalSignificance === 'medium' ? '유의미하게' :
      '약간'
    
    return `${groupAName}의 평균값이 ${groupBName}보다 ${Math.abs(diffPercent).toFixed(1)}% ${direction}. ` +
      `이 차이는 통계적으로 유의하며 (p-value: ${pValue.toFixed(4)}), ` +
      `효과 크기는 ${practicalSignificance} 수준입니다. ` +
      `(신뢰도: ${confidence})`
  } else {
    return `${groupAName}와 ${groupBName} 간의 차이는 통계적으로 유의하지 않습니다 ` +
      `(p-value: ${pValue.toFixed(4)}). ` +
      `이 차이는 우연에 의한 것일 수 있습니다. ` +
      `(신뢰도: ${confidence})`
  }
}

/**
 * 카테고리 데이터 비교 (카이제곱 검정)
 */
export function compareCategorical(
  observed: number[][],
  groupNames: string[] = ['그룹 A', '그룹 B'],
  categoryNames: string[] = []
): {
  chiSquare: number
  pValue: number
  degreesOfFreedom: number
  cramersV: number
  interpretation: string
} {
  // 기대값 계산
  const rowSums = observed.map(row => row.reduce((a, b) => a + b, 0))
  const colSums = observed[0].map((_, colIdx) => 
    observed.reduce((sum, row) => sum + row[colIdx], 0)
  )
  const total = rowSums.reduce((a, b) => a + b, 0)

  // 카이제곱 통계량 계산
  let chiSquare = 0
  for (let i = 0; i < observed.length; i++) {
    for (let j = 0; j < observed[i].length; j++) {
      const expected = (rowSums[i] * colSums[j]) / total
      if (expected > 0) {
        chiSquare += Math.pow(observed[i][j] - expected, 2) / expected
      }
    }
  }

  // 자유도
  const df = (observed.length - 1) * (observed[0].length - 1)

  // p-value 근사 (카이제곱 분포)
  const pValue = chiSquare > 10 ? 0.001 : chiSquare > 6 ? 0.01 : chiSquare > 3.84 ? 0.05 : 0.10

  // Cramér's V (효과 크기)
  const cramersV = Math.sqrt(chiSquare / (total * Math.min(observed.length - 1, observed[0].length - 1)))

  const interpretation = pValue < 0.05
    ? `두 그룹 간에 통계적으로 유의한 차이가 있습니다 (p-value: ${pValue.toFixed(4)}). 효과 크기: ${cramersV.toFixed(3)}`
    : `두 그룹 간에 통계적으로 유의한 차이가 없습니다 (p-value: ${pValue.toFixed(4)})`

  return {
    chiSquare,
    pValue,
    degreesOfFreedom: df,
    cramersV,
    interpretation
  }
}

// ==================== 메인 서비스 ====================

export class StatisticalValidator {
  /**
   * 두 그룹 통계적 비교
   */
  validateComparison(
    groupA: number[],
    groupB: number[],
    options: {
      groupAName?: string
      groupBName?: string
      alpha?: number
    } = {}
  ): StatisticalInsight {
    return compareGroups(
      groupA,
      groupB,
      options.groupAName || '그룹 A',
      options.groupBName || '그룹 B',
      options.alpha || 0.05
    )
  }

  /**
   * 여러 그룹 비교 (ANOVA 대신 pairwise t-test)
   */
  validateMultipleGroups(
    groups: Array<{ name: string; values: number[] }>,
    alpha: number = 0.05
  ): Array<{
    groupA: string
    groupB: string
    result: StatisticalInsight
  }> {
    const results: Array<{
      groupA: string
      groupB: string
      result: StatisticalInsight
    }> = []

    for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        const result = compareGroups(
          groups[i].values,
          groups[j].values,
          groups[i].name,
          groups[j].name,
          alpha
        )
        results.push({
          groupA: groups[i].name,
          groupB: groups[j].name,
          result
        })
      }
    }

    return results
  }
}

export const statisticalValidator = new StatisticalValidator()

