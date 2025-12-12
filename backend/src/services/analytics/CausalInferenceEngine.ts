/**
 * CausalInferenceEngine - 인과관계 추론 엔진
 * v4.1: 상관관계를 넘어 인과관계 추론 및 원인 분석
 */

import { compareGroups } from './StatisticalValidator'

// ==================== 타입 정의 ====================

export interface Observation {
  metric: string
  change: number
  changePercent: number
  period: { start: Date; end: Date }
  baseline: number
  current: number
}

export interface PotentialCause {
  cause: string
  type: 'internal' | 'external' | 'seasonal' | 'operational'
  correlation: number              // 상관계수 (-1 ~ 1)
  temporalOrder: 'before' | 'during' | 'after' | 'unknown'
  strength: 'strong' | 'medium' | 'weak'
  evidence: string[]
  estimatedImpact: number          // 예상 기여도 (%)
  confidence: 'high' | 'medium' | 'low'
}

export interface CausalAnalysis {
  observation: Observation
  potentialCauses: PotentialCause[]
  mostLikelyCause: PotentialCause | null
  alternativeExplanations: string[]
  recommendations: {
    action: string
    rationale: string
    expectedImpact: string
  }[]
}

// ==================== 분석 로직 ====================

/**
 * 상관계수 계산 (Pearson)
 */
function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0

  const meanX = x.reduce((a, b) => a + b, 0) / x.length
  const meanY = y.reduce((a, b) => a + b, 0) / y.length

  let numerator = 0
  let sumSqX = 0
  let sumSqY = 0

  for (let i = 0; i < x.length; i++) {
    const dx = x[i] - meanX
    const dy = y[i] - meanY
    numerator += dx * dy
    sumSqX += dx * dx
    sumSqY += dy * dy
  }

  const denominator = Math.sqrt(sumSqX * sumSqY)
  return denominator === 0 ? 0 : numerator / denominator
}

/**
 * 시계열 데이터에서 시간적 순서 판단
 */
function determineTemporalOrder(
  causeDates: Date[],
  effectDates: Date[]
): 'before' | 'during' | 'after' | 'unknown' {
  if (causeDates.length === 0 || effectDates.length === 0) return 'unknown'

  const avgCauseDate = causeDates.reduce((sum, d) => sum + d.getTime(), 0) / causeDates.length
  const avgEffectDate = effectDates.reduce((sum, d) => sum + d.getTime(), 0) / effectDates.length

  const diff = avgCauseDate - avgEffectDate
  const daysDiff = diff / (1000 * 60 * 60 * 24)

  if (daysDiff < -7) return 'before'  // 원인이 7일 이상 먼저
  if (daysDiff > 7) return 'after'    // 원인이 7일 이상 나중
  return 'during'                     // 동시 발생
}

/**
 * 원인 강도 판단
 */
function determineStrength(
  correlation: number,
  temporalOrder: string,
  estimatedImpact: number
): 'strong' | 'medium' | 'weak' {
  let score = 0

  // 상관계수 기여
  if (Math.abs(correlation) > 0.7) score += 3
  else if (Math.abs(correlation) > 0.4) score += 2
  else if (Math.abs(correlation) > 0.2) score += 1

  // 시간적 순서 기여
  if (temporalOrder === 'before') score += 2
  else if (temporalOrder === 'during') score += 1

  // 예상 기여도 기여
  if (estimatedImpact > 50) score += 2
  else if (estimatedImpact > 30) score += 1

  if (score >= 5) return 'strong'
  if (score >= 3) return 'medium'
  return 'weak'
}

/**
 * 신뢰도 판단
 */
function determineConfidence(
  correlation: number,
  temporalOrder: string,
  sampleSize: number,
  evidenceCount: number
): 'high' | 'medium' | 'low' {
  let score = 0

  // 상관계수 기여
  if (Math.abs(correlation) > 0.6) score += 2
  else if (Math.abs(correlation) > 0.3) score += 1

  // 시간적 순서 기여
  if (temporalOrder === 'before') score += 2
  else if (temporalOrder === 'during') score += 1

  // 표본 크기 기여
  if (sampleSize > 100) score += 1
  else if (sampleSize > 30) score += 0.5

  // 증거 수 기여
  if (evidenceCount >= 3) score += 1
  else if (evidenceCount >= 2) score += 0.5

  if (score >= 5) return 'high'
  if (score >= 3) return 'medium'
  return 'low'
}

/**
 * 잠재적 원인 분석
 */
function analyzePotentialCauses(
  observation: Observation,
  data: any[],
  candidateCauses: Array<{
    name: string
    type: 'internal' | 'external' | 'seasonal' | 'operational'
    values: number[]
    dates: Date[]
    description: string
  }>
): PotentialCause[] {
  const causes: PotentialCause[] = []

  // 관찰 기간 데이터 추출
  const observationValues = data
    .filter(row => {
      const date = new Date(row.date || row.order_created)
      return date >= observation.period.start && date <= observation.period.end
    })
    .map(row => parseFloat(row[observation.metric] || row.value || '0') || 0)

  for (const candidate of candidateCauses) {
    // 상관계수 계산
    const correlation = calculateCorrelation(candidate.values, observationValues)

    // 시간적 순서 판단
    const temporalOrder = determineTemporalOrder(candidate.dates, 
      data.filter(row => {
        const date = new Date(row.date || row.order_created)
        return date >= observation.period.start && date <= observation.period.end
      }).map(row => new Date(row.date || row.order_created))
    )

    // 예상 기여도 추정 (상관계수 기반)
    const estimatedImpact = Math.abs(correlation) * 100

    // 강도 판단
    const strength = determineStrength(correlation, temporalOrder, estimatedImpact)

    // 신뢰도 판단
    const sampleSize = Math.min(candidate.values.length, observationValues.length)
    const evidenceCount = Math.abs(correlation) > 0.3 ? 2 : 1
    const confidence = determineConfidence(correlation, temporalOrder, sampleSize, evidenceCount)

    // 증거 수집
    const evidence: string[] = []
    if (Math.abs(correlation) > 0.5) {
      evidence.push(`높은 상관계수 (${correlation.toFixed(2)})`)
    }
    if (temporalOrder === 'before') {
      evidence.push('시간적 선행성 (원인이 결과보다 먼저 발생)')
    }
    if (estimatedImpact > 30) {
      evidence.push(`높은 예상 기여도 (${estimatedImpact.toFixed(0)}%)`)
    }

    causes.push({
      cause: candidate.name,
      type: candidate.type,
      correlation,
      temporalOrder,
      strength,
      evidence,
      estimatedImpact,
      confidence
    })
  }

  // 상관계수 및 강도 기준 정렬
  return causes.sort((a, b) => {
    const scoreA = Math.abs(a.correlation) * (a.strength === 'strong' ? 3 : a.strength === 'medium' ? 2 : 1)
    const scoreB = Math.abs(b.correlation) * (b.strength === 'strong' ? 3 : b.strength === 'medium' ? 2 : 1)
    return scoreB - scoreA
  })
}

/**
 * 권장 조치 생성
 */
function generateRecommendations(
  observation: Observation,
  mostLikelyCause: PotentialCause | null
): Array<{ action: string; rationale: string; expectedImpact: string }> {
  const recommendations: Array<{ action: string; rationale: string; expectedImpact: string }> = []

  if (!mostLikelyCause) {
    recommendations.push({
      action: '추가 데이터 수집 및 분석',
      rationale: '명확한 원인을 식별하기 위해 더 많은 데이터가 필요합니다.',
      expectedImpact: '원인 식별 정확도 향상'
    })
    return recommendations
  }

  // 원인 타입별 권장 조치
  if (mostLikelyCause.type === 'internal') {
    if (observation.change < 0) {
      recommendations.push({
        action: `${mostLikelyCause.cause} 관련 프로세스 개선`,
        rationale: `${mostLikelyCause.cause}가 ${observation.metric} 감소의 주요 원인으로 추정됩니다.`,
        expectedImpact: `${Math.abs(observation.changePercent)}% 회복 가능`
      })
    } else {
      recommendations.push({
        action: `${mostLikelyCause.cause} 성공 요인 확대 적용`,
        rationale: `${mostLikelyCause.cause}가 ${observation.metric} 증가의 주요 원인으로 추정됩니다.`,
        expectedImpact: `추가 ${observation.changePercent * 0.5}% 성장 가능`
      })
    }
  } else if (mostLikelyCause.type === 'external') {
    recommendations.push({
      action: '외부 요인 모니터링 및 대응 전략 수립',
      rationale: `${mostLikelyCause.cause}는 외부 요인으로 직접 제어가 어렵습니다.`,
      expectedImpact: '리스크 완화 및 기회 포착'
    })
  } else if (mostLikelyCause.type === 'seasonal') {
    recommendations.push({
      action: '계절성 패턴 반영한 계획 수립',
      rationale: `${mostLikelyCause.cause}는 계절적 패턴으로 예측 가능합니다.`,
      expectedImpact: '계절성 대비 강화'
    })
  } else if (mostLikelyCause.type === 'operational') {
    recommendations.push({
      action: `${mostLikelyCause.cause} 운영 프로세스 개선`,
      rationale: `${mostLikelyCause.cause}는 운영상의 문제로 개선 가능합니다.`,
      expectedImpact: `${Math.abs(observation.changePercent)}% 개선 가능`
    })
  }

  return recommendations
}

// ==================== 메인 서비스 ====================

export class CausalInferenceEngine {
  /**
   * 인과관계 분석 실행
   */
  analyze(
    observation: Observation,
    candidateCauses: Array<{
      name: string
      type: 'internal' | 'external' | 'seasonal' | 'operational'
      values: number[]
      dates: Date[]
      description: string
    }>,
    historicalData: any[] = []
  ): CausalAnalysis {
    // 잠재적 원인 분석
    const potentialCauses = analyzePotentialCauses(observation, historicalData, candidateCauses)

    // 가장 가능성 높은 원인
    const mostLikelyCause = potentialCauses.length > 0 && potentialCauses[0].confidence !== 'low'
      ? potentialCauses[0]
      : null

    // 대안 설명
    const alternativeExplanations: string[] = []
    if (potentialCauses.length === 0) {
      alternativeExplanations.push('데이터 부족으로 인한 원인 식별 불가')
    } else if (potentialCauses.length > 1 && potentialCauses[1].strength === 'strong') {
      alternativeExplanations.push(`${potentialCauses[1].cause}도 중요한 요인일 수 있습니다.`)
    }
    if (mostLikelyCause && mostLikelyCause.confidence === 'medium') {
      alternativeExplanations.push('추가 검증이 필요합니다.')
    }

    // 권장 조치
    const recommendations = generateRecommendations(observation, mostLikelyCause)

    return {
      observation,
      potentialCauses,
      mostLikelyCause,
      alternativeExplanations,
      recommendations
    }
  }

  /**
   * 간단한 인과관계 분석 (자동 후보 생성)
   */
  analyzeSimple(
    metric: string,
    baselinePeriod: { start: Date; end: Date },
    currentPeriod: { start: Date; end: Date },
    data: any[]
  ): CausalAnalysis {
    // 관찰 생성
    const baselineData = data.filter(row => {
      const date = new Date(row.date || row.order_created)
      return date >= baselinePeriod.start && date <= baselinePeriod.end
    })
    const currentData = data.filter(row => {
      const date = new Date(row.date || row.order_created)
      return date >= currentPeriod.start && date <= currentPeriod.end
    })

    const baselineValue = baselineData.reduce((sum, row) => 
      sum + (parseFloat(row[metric] || row.value || '0') || 0), 0) / baselineData.length
    const currentValue = currentData.reduce((sum, row) => 
      sum + (parseFloat(row[metric] || row.value || '0') || 0), 0) / currentData.length

    const change = currentValue - baselineValue
    const changePercent = baselineValue !== 0 ? (change / baselineValue) * 100 : 0

    const observation: Observation = {
      metric,
      change,
      changePercent,
      period: currentPeriod,
      baseline: baselineValue,
      current: currentValue
    }

    // 자동 후보 생성 (작가, 국가, 기간 등)
    const candidateCauses: Array<{
      name: string
      type: 'internal' | 'external' | 'seasonal' | 'operational'
      values: number[]
      dates: Date[]
      description: string
    }> = []

    // 작가별 변화 분석
    const artists = new Set(data.map(row => row['artist_name (kr)'] || row.artist).filter(Boolean))
    for (const artist of Array.from(artists).slice(0, 5)) {
      const artistData = data.filter(row => (row['artist_name (kr)'] || row.artist) === artist)
      candidateCauses.push({
        name: `${artist} 작가 성과 변화`,
        type: 'internal',
        values: artistData.map(row => parseFloat(row[metric] || row.value || '0') || 0),
        dates: artistData.map(row => new Date(row.date || row.order_created)),
        description: `${artist} 작가의 ${metric} 변화`
      })
    }

    // 국가별 변화 분석
    const countries = new Set(data.map(row => row.country).filter(Boolean))
    for (const country of Array.from(countries).slice(0, 3)) {
      const countryData = data.filter(row => row.country === country)
      candidateCauses.push({
        name: `${country} 시장 변화`,
        type: 'external',
        values: countryData.map(row => parseFloat(row[metric] || row.value || '0') || 0),
        dates: countryData.map(row => new Date(row.date || row.order_created)),
        description: `${country} 시장의 ${metric} 변화`
      })
    }

    return this.analyze(observation, candidateCauses, data)
  }
}

export const causalInferenceEngine = new CausalInferenceEngine()

