/**
 * 인사이트 스코어링 엔진
 * 발견된 인사이트의 중요도를 다차원으로 평가
 */

import {
  BusinessInsight,
  InsightScores,
  BusinessContext,
  InsightCategory,
} from './types'

interface ScoringWeights {
  statisticalSignificance: number
  businessImpact: number
  actionability: number
  urgency: number
  confidence: number
}

interface RawInsight {
  category: InsightCategory
  metric: string
  currentValue: number
  comparisonValue: number
  deviation: number
  sampleSize: number
  zScore?: number
  pValue?: number
  effectSize?: number
  trendDirection?: 'worsening' | 'stable' | 'improving'
  daysToThreshold?: number
  reversible?: boolean
  hasAction?: boolean
  actionLink?: string
  resourceRequired?: 'low' | 'medium' | 'high'
  timeToImpact?: number
  dataQuality?: 'high' | 'medium' | 'low'
  modelAccuracy?: number
  historicalAccuracy?: number
  estimatedRevenueImpact?: number
  affectedCount?: number
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  statisticalSignificance: 0.15,
  businessImpact: 0.35,
  actionability: 0.20,
  urgency: 0.20,
  confidence: 0.10,
}

export class InsightScorer {
  private weights: ScoringWeights

  constructor(weights: Partial<ScoringWeights> = {}) {
    this.weights = { ...DEFAULT_WEIGHTS, ...weights }
  }

  /**
   * 인사이트 스코어링
   */
  score(
    raw: RawInsight,
    context: BusinessContext
  ): BusinessInsight {
    const scores: InsightScores = {
      statisticalSignificance: this.scoreStatisticalSignificance(raw),
      businessImpact: this.scoreBusinessImpact(raw, context),
      actionability: this.scoreActionability(raw),
      urgency: this.scoreUrgency(raw),
      confidence: this.scoreConfidence(raw),
    }

    const totalScore = this.calculateTotalScore(scores)
    const type = this.determineType(scores, raw)
    const priority = this.calculatePriority(totalScore, scores)

    return {
      id: this.generateId(raw),
      type,
      category: raw.category,
      title: this.generateTitle(raw),
      description: this.generateDescription(raw),
      metric: raw.metric,
      currentValue: raw.currentValue,
      comparisonValue: raw.comparisonValue,
      deviation: raw.deviation,
      deviationPercent: raw.comparisonValue !== 0 
        ? raw.deviation / raw.comparisonValue 
        : 0,
      evidence: [{
        metric: raw.metric,
        value: raw.currentValue,
        comparison: `기준값: ${raw.comparisonValue}`,
        change: raw.deviation,
      }],
      recommendation: this.generateRecommendation(raw, type),
      actionLink: raw.actionLink,
      priority,
      scores,
      totalScore,
      createdAt: new Date(),
      expiresAt: this.calculateExpiry(type),
    }
  }

  /**
   * 여러 인사이트 일괄 스코어링 및 필터링
   */
  scoreAndFilter(
    rawInsights: RawInsight[],
    context: BusinessContext,
    options: {
      minScore?: number
      maxCount?: number
      types?: BusinessInsight['type'][]
    } = {}
  ): BusinessInsight[] {
    const { minScore = 40, maxCount = 50, types } = options

    let scored = rawInsights.map(raw => this.score(raw, context))

    // 최소 점수 필터
    scored = scored.filter(i => i.totalScore >= minScore)

    // 타입 필터
    if (types && types.length > 0) {
      scored = scored.filter(i => types.includes(i.type))
    }

    // 우선순위 정렬
    scored.sort((a, b) => b.priority - a.priority)

    // 최대 개수 제한
    return scored.slice(0, maxCount)
  }

  /**
   * 통계적 유의성 점수 (0-100)
   */
  private scoreStatisticalSignificance(raw: RawInsight): number {
    let score = 0

    // 표본 크기 (최대 30점)
    if (raw.sampleSize >= 100) score += 30
    else if (raw.sampleSize >= 50) score += 25
    else if (raw.sampleSize >= 30) score += 20
    else if (raw.sampleSize >= 10) score += 10
    else score += 5

    // p-value 또는 Z-Score (최대 40점)
    if (raw.pValue !== undefined) {
      if (raw.pValue < 0.01) score += 40
      else if (raw.pValue < 0.05) score += 30
      else if (raw.pValue < 0.1) score += 15
    } else if (raw.zScore !== undefined) {
      const absZ = Math.abs(raw.zScore)
      if (absZ > 3) score += 40
      else if (absZ > 2.5) score += 35
      else if (absZ > 2) score += 30
      else if (absZ > 1.5) score += 15
    } else {
      // 편차 기반 추정
      const absDeviation = Math.abs(raw.deviation / (raw.comparisonValue || 1))
      if (absDeviation > 0.5) score += 30
      else if (absDeviation > 0.3) score += 20
      else if (absDeviation > 0.2) score += 10
    }

    // 효과 크기 (최대 30점)
    if (raw.effectSize !== undefined) {
      if (Math.abs(raw.effectSize) > 0.8) score += 30
      else if (Math.abs(raw.effectSize) > 0.5) score += 20
      else if (Math.abs(raw.effectSize) > 0.2) score += 10
    }

    return Math.min(100, score)
  }

  /**
   * 비즈니스 영향도 점수 (0-100)
   */
  private scoreBusinessImpact(raw: RawInsight, context: BusinessContext): number {
    let score = 0

    // 매출 영향 (최대 40점)
    if (raw.estimatedRevenueImpact !== undefined && context.totalRevenue > 0) {
      const revenueRatio = Math.abs(raw.estimatedRevenueImpact) / context.totalRevenue
      if (revenueRatio > 0.1) score += 40
      else if (revenueRatio > 0.05) score += 30
      else if (revenueRatio > 0.01) score += 20
      else if (revenueRatio > 0.001) score += 10
    } else {
      // 편차 기반 추정
      const absDeviation = Math.abs(raw.deviation / (raw.comparisonValue || 1))
      if (absDeviation > 0.3) score += 25
      else if (absDeviation > 0.2) score += 15
      else if (absDeviation > 0.1) score += 10
    }

    // 영향받는 대상 수 (최대 30점)
    if (raw.affectedCount !== undefined && context.totalCustomers > 0) {
      const affectedRatio = raw.affectedCount / context.totalCustomers
      if (affectedRatio > 0.2) score += 30
      else if (affectedRatio > 0.1) score += 20
      else if (affectedRatio > 0.05) score += 10
    }

    // 전략적 카테고리 (최대 30점)
    const strategicCategories: InsightCategory[] = ['revenue', 'customer']
    if (strategicCategories.includes(raw.category)) {
      score += 20
    }

    return Math.min(100, score)
  }

  /**
   * 실행 가능성 점수 (0-100)
   */
  private scoreActionability(raw: RawInsight): number {
    let score = 30 // 기본 점수

    // 명확한 액션 존재 (최대 40점)
    if (raw.hasAction) score += 40
    else if (raw.actionLink) score += 30

    // 리소스 요구 수준 (최대 20점)
    if (raw.resourceRequired === 'low') score += 20
    else if (raw.resourceRequired === 'medium') score += 10

    // 효과까지 시간 (최대 10점)
    if (raw.timeToImpact !== undefined) {
      if (raw.timeToImpact <= 7) score += 10
      else if (raw.timeToImpact <= 30) score += 5
    }

    return Math.min(100, score)
  }

  /**
   * 긴급성 점수 (0-100)
   */
  private scoreUrgency(raw: RawInsight): number {
    let score = 20 // 기본 점수

    // 트렌드 방향 (최대 40점)
    if (raw.trendDirection === 'worsening') score += 40
    else if (raw.trendDirection === 'stable') score += 10

    // 임계점까지 시간 (최대 40점)
    if (raw.daysToThreshold !== undefined) {
      if (raw.daysToThreshold <= 3) score += 40
      else if (raw.daysToThreshold <= 7) score += 30
      else if (raw.daysToThreshold <= 14) score += 20
      else if (raw.daysToThreshold <= 30) score += 10
    }

    // 되돌릴 수 없는 경우 (최대 20점)
    if (raw.reversible === false) score += 20

    return Math.min(100, score)
  }

  /**
   * 신뢰도 점수 (0-100)
   */
  private scoreConfidence(raw: RawInsight): number {
    let score = 50 // 기본 점수

    // 데이터 품질 (±20점)
    if (raw.dataQuality === 'high') score += 20
    else if (raw.dataQuality === 'medium') score += 10
    else if (raw.dataQuality === 'low') score -= 20

    // 모델 정확도 (최대 30점)
    if (raw.modelAccuracy !== undefined) {
      score += raw.modelAccuracy * 30
    }

    // 과거 정확도 (최대 20점)
    if (raw.historicalAccuracy !== undefined) {
      score += raw.historicalAccuracy * 20
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * 총점 계산
   */
  private calculateTotalScore(scores: InsightScores): number {
    return Object.entries(scores).reduce((total, [key, value]) => {
      const weight = this.weights[key as keyof ScoringWeights]
      return total + value * weight
    }, 0)
  }

  /**
   * 인사이트 타입 결정
   */
  private determineType(
    scores: InsightScores,
    raw: RawInsight
  ): BusinessInsight['type'] {
    // 긴급성이 높고 부정적 편차
    if (scores.urgency >= 70 && raw.deviation < 0) {
      return 'critical'
    }

    // 비즈니스 영향도가 높고 부정적
    if (scores.businessImpact >= 60 && raw.deviation < 0) {
      return 'warning'
    }

    // 긍정적 편차
    if (raw.deviation > 0 && scores.businessImpact >= 40) {
      return 'opportunity'
    }

    return 'info'
  }

  /**
   * 우선순위 계산
   */
  private calculatePriority(totalScore: number, scores: InsightScores): number {
    // 기본 우선순위 = 총점
    let priority = totalScore

    // 긴급성 가중치 추가
    if (scores.urgency >= 80) priority += 20
    else if (scores.urgency >= 60) priority += 10

    // 비즈니스 영향도 가중치 추가
    if (scores.businessImpact >= 80) priority += 15
    else if (scores.businessImpact >= 60) priority += 5

    return Math.min(100, priority)
  }

  /**
   * ID 생성
   */
  private generateId(raw: RawInsight): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 6)
    return `insight_${raw.category}_${timestamp}_${random}`
  }

  /**
   * 제목 생성
   */
  private generateTitle(raw: RawInsight): string {
    const direction = raw.deviation >= 0 ? '상승' : '하락'
    const percent = Math.abs(raw.deviation / (raw.comparisonValue || 1) * 100).toFixed(1)
    return `${raw.metric} ${percent}% ${direction}`
  }

  /**
   * 설명 생성
   */
  private generateDescription(raw: RawInsight): string {
    const direction = raw.deviation >= 0 ? '증가' : '감소'
    const current = raw.currentValue.toLocaleString()
    const comparison = raw.comparisonValue.toLocaleString()
    return `${raw.metric}이(가) ${comparison}에서 ${current}으로 ${direction}했습니다.`
  }

  /**
   * 추천 액션 생성
   */
  private generateRecommendation(
    raw: RawInsight,
    type: BusinessInsight['type']
  ): string {
    if (type === 'critical') {
      return '즉시 원인을 파악하고 대응 조치를 취하세요.'
    }
    if (type === 'warning') {
      return '추이를 모니터링하고 필요시 조치를 준비하세요.'
    }
    if (type === 'opportunity') {
      return '성공 요인을 분석하고 확대 적용을 검토하세요.'
    }
    return '참고 정보로 활용하세요.'
  }

  /**
   * 만료 시간 계산
   */
  private calculateExpiry(type: BusinessInsight['type']): Date {
    const now = new Date()
    switch (type) {
      case 'critical':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000) // 1일
      case 'warning':
        return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) // 3일
      case 'opportunity':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7일
      default:
        return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) // 14일
    }
  }

  /**
   * 큐브 분석 이상치를 인사이트로 변환
   */
  scoreAnomalies(anomalies: Array<{
    dimensions: Record<string, string>
    metrics: Record<string, number>
    sampleSize: number
    deviation: number
    deviationPercent: number
    anomalyType?: 'positive' | 'negative'
  }>): BusinessInsight[] {
    const defaultContext: BusinessContext = {
      totalRevenue: 1000000,
      totalOrders: 1000,
      totalCustomers: 500,
      totalArtists: 50,
      period: { start: new Date(), end: new Date() },
    }

    return anomalies.map(anomaly => {
      const dimensionStr = Object.entries(anomaly.dimensions)
        .map(([k, v]) => `${k}:${v}`)
        .join(', ')

      const primaryMetric = Object.keys(anomaly.metrics)[0] || 'value'
      const metricValue = anomaly.metrics[primaryMetric] || 0

      const raw: RawInsight = {
        category: this.inferCategory(anomaly.dimensions),
        metric: `${dimensionStr} - ${primaryMetric}`,
        currentValue: metricValue,
        comparisonValue: metricValue / (1 + anomaly.deviationPercent),
        deviation: anomaly.deviation,
        sampleSize: anomaly.sampleSize,
        trendDirection: anomaly.anomalyType === 'negative' ? 'worsening' : 'improving',
      }

      return this.score(raw, defaultContext)
    })
  }

  /**
   * 차원에서 카테고리 추론
   */
  private inferCategory(dimensions: Record<string, string>): InsightCategory {
    const keys = Object.keys(dimensions).map(k => k.toLowerCase())
    
    if (keys.some(k => k.includes('country') || k.includes('region'))) {
      return 'geographic'
    }
    if (keys.some(k => k.includes('artist'))) {
      return 'artist'
    }
    if (keys.some(k => k.includes('product'))) {
      return 'product'
    }
    if (keys.some(k => k.includes('customer') || k.includes('user'))) {
      return 'customer'
    }
    return 'revenue'
  }
}
