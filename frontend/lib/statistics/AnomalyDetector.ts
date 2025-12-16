/**
 * AnomalyDetector - 이상치 탐지 알고리즘
 * 다양한 방법을 통한 이상치 탐지 및 분류
 */

import { statisticsEngine } from './StatisticsEngine'

// 이상치 결과 타입
export interface AnomalyResult {
  index: number
  value: number
  date?: string
  isAnomaly: boolean
  severity: 'normal' | 'warning' | 'critical'
  score: number // 0-1 사이의 이상 점수
  method: string
  details: {
    zScore?: number
    iqrDistance?: number
    maDeviation?: number
  }
}

// 이상치 요약 타입
export interface AnomalySummary {
  totalPoints: number
  anomalyCount: number
  criticalCount: number
  warningCount: number
  anomalyRate: number
  topAnomalies: AnomalyResult[]
  affectedPeriods: string[]
}

// 이상치 탐지 설정
export interface AnomalyDetectionConfig {
  zScoreThreshold?: number
  iqrMultiplier?: number
  maWindow?: number
  maThreshold?: number
  minConsecutive?: number
  useEnsemble?: boolean
}

const DEFAULT_CONFIG: AnomalyDetectionConfig = {
  zScoreThreshold: 3,
  iqrMultiplier: 1.5,
  maWindow: 7,
  maThreshold: 2,
  minConsecutive: 1,
  useEnsemble: true,
}

export class AnomalyDetector {
  private config: AnomalyDetectionConfig

  constructor(config: Partial<AnomalyDetectionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Z-score 기반 이상치 탐지
   */
  detectByZScore(data: number[], dates?: string[]): AnomalyResult[] {
    const results = statisticsEngine.detectZScoreAnomalies(data, this.config.zScoreThreshold)
    
    return results.map((r, idx) => ({
      ...r,
      date: dates?.[idx],
      score: Math.min(Math.abs(r.zScore || 0) / (this.config.zScoreThreshold! * 2), 1),
      method: 'z-score',
      details: {
        zScore: r.zScore,
      },
    }))
  }

  /**
   * IQR 기반 이상치 탐지
   */
  detectByIQR(data: number[], dates?: string[]): AnomalyResult[] {
    const results = statisticsEngine.detectIQRAnomalies(data, this.config.iqrMultiplier)
    
    return results.map((r, idx) => {
      const stats = statisticsEngine.summarize(data)
      const iqr = stats.q3 - stats.q1
      const distance = r.isAnomaly 
        ? Math.abs(r.value - (r.value < stats.q1 ? stats.q1 : stats.q3)) / iqr
        : 0
      
      return {
        ...r,
        date: dates?.[idx],
        score: Math.min(distance / 3, 1),
        method: 'iqr',
        details: {
          iqrDistance: distance,
        },
      }
    })
  }

  /**
   * 이동평균 편차 기반 이상치 탐지
   */
  detectByMovingAverage(data: number[], dates?: string[]): AnomalyResult[] {
    const ma = statisticsEngine.movingAverage(data, this.config.maWindow!)
    const deviations = data.map((v, i) => Math.abs(v - ma[i]))
    const devStats = statisticsEngine.summarize(deviations)
    const threshold = devStats.mean + this.config.maThreshold! * devStats.std

    return data.map((value, index) => {
      const deviation = deviations[index]
      const isAnomaly = deviation > threshold
      const score = Math.min(deviation / (threshold * 2), 1)

      return {
        index,
        value,
        date: dates?.[index],
        isAnomaly,
        severity: score > 0.7 ? 'critical' : score > 0.4 ? 'warning' : 'normal',
        score,
        method: 'moving-average',
        details: {
          maDeviation: deviation,
        },
      }
    })
  }

  /**
   * 앙상블 이상치 탐지 (여러 방법 결합)
   */
  detectEnsemble(data: number[], dates?: string[]): AnomalyResult[] {
    const zScoreResults = this.detectByZScore(data, dates)
    const iqrResults = this.detectByIQR(data, dates)
    const maResults = this.detectByMovingAverage(data, dates)

    return data.map((value, index) => {
      const zScore = zScoreResults[index]
      const iqr = iqrResults[index]
      const ma = maResults[index]

      // 가중 평균 점수 계산
      const weights = { zScore: 0.4, iqr: 0.35, ma: 0.25 }
      const combinedScore = 
        zScore.score * weights.zScore +
        iqr.score * weights.iqr +
        ma.score * weights.ma

      // 최소 2개 방법에서 이상치로 판단되면 이상치
      const anomalyVotes = [zScore.isAnomaly, iqr.isAnomaly, ma.isAnomaly].filter(Boolean).length
      const isAnomaly = anomalyVotes >= 2 || combinedScore > 0.7

      return {
        index,
        value,
        date: dates?.[index],
        isAnomaly,
        severity: combinedScore > 0.7 ? 'critical' : combinedScore > 0.4 ? 'warning' : 'normal',
        score: combinedScore,
        method: 'ensemble',
        details: {
          zScore: zScore.details.zScore,
          iqrDistance: iqr.details.iqrDistance,
          maDeviation: ma.details.maDeviation,
        },
      }
    })
  }

  /**
   * 메인 탐지 함수
   */
  detect(data: number[], dates?: string[]): AnomalyResult[] {
    if (this.config.useEnsemble) {
      return this.detectEnsemble(data, dates)
    }
    return this.detectByZScore(data, dates)
  }

  /**
   * 연속 이상치 탐지 (스파이크 vs 지속적 이상)
   */
  detectConsecutive(data: number[], dates?: string[]): {
    results: AnomalyResult[]
    consecutiveGroups: Array<{
      startIndex: number
      endIndex: number
      length: number
      avgScore: number
    }>
  } {
    const results = this.detect(data, dates)
    const groups: Array<{
      startIndex: number
      endIndex: number
      length: number
      avgScore: number
    }> = []

    let currentGroup: { start: number; scores: number[] } | null = null

    results.forEach((r, idx) => {
      if (r.isAnomaly) {
        if (!currentGroup) {
          currentGroup = { start: idx, scores: [r.score] }
        } else {
          currentGroup.scores.push(r.score)
        }
      } else if (currentGroup) {
        if (currentGroup.scores.length >= this.config.minConsecutive!) {
          groups.push({
            startIndex: currentGroup.start,
            endIndex: idx - 1,
            length: currentGroup.scores.length,
            avgScore: currentGroup.scores.reduce((a, b) => a + b, 0) / currentGroup.scores.length,
          })
        }
        currentGroup = null
      }
    })

    // 마지막 그룹 처리
    if (currentGroup && currentGroup.scores.length >= this.config.minConsecutive!) {
      groups.push({
        startIndex: currentGroup.start,
        endIndex: results.length - 1,
        length: currentGroup.scores.length,
        avgScore: currentGroup.scores.reduce((a, b) => a + b, 0) / currentGroup.scores.length,
      })
    }

    return { results, consecutiveGroups: groups }
  }

  /**
   * 이상치 요약 생성
   */
  summarize(data: number[], dates?: string[]): AnomalySummary {
    const results = this.detect(data, dates)
    const anomalies = results.filter(r => r.isAnomaly)
    const critical = anomalies.filter(r => r.severity === 'critical')
    const warning = anomalies.filter(r => r.severity === 'warning')

    // 상위 이상치 (점수 기준)
    const topAnomalies = [...anomalies]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    // 영향받은 기간
    const affectedPeriods = anomalies
      .filter(a => a.date)
      .map(a => a.date!)

    return {
      totalPoints: data.length,
      anomalyCount: anomalies.length,
      criticalCount: critical.length,
      warningCount: warning.length,
      anomalyRate: anomalies.length / data.length,
      topAnomalies,
      affectedPeriods,
    }
  }

  /**
   * 이상치 원인 추정
   */
  inferCause(
    result: AnomalyResult,
    context?: {
      previousValues?: number[]
      externalEvents?: Array<{ date: string; event: string }>
    }
  ): string[] {
    const causes: string[] = []

    if (result.severity === 'critical') {
      if (result.details.zScore && Math.abs(result.details.zScore) > 4) {
        causes.push('극단적인 값 - 데이터 입력 오류 가능성')
      }
      if (result.details.maDeviation && result.details.maDeviation > 0) {
        causes.push('급격한 추세 변화')
      }
    }

    if (result.score > 0.5) {
      causes.push('통계적으로 비정상적인 값')
    }

    // 외부 이벤트 확인
    if (context?.externalEvents && result.date) {
      const matchingEvent = context.externalEvents.find(e => e.date === result.date)
      if (matchingEvent) {
        causes.push(`외부 이벤트: ${matchingEvent.event}`)
      }
    }

    if (causes.length === 0) {
      causes.push('원인 불명 - 추가 조사 필요')
    }

    return causes
  }
}

// 싱글톤 인스턴스
export const anomalyDetector = new AnomalyDetector()

