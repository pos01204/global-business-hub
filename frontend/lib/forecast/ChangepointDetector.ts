/**
 * ChangepointDetector - 변화점 탐지 시스템
 * CUSUM 및 기타 알고리즘을 활용한 변화점 탐지
 */

import { statisticsEngine } from '../statistics/StatisticsEngine'
import type { ChangepointResult } from './types'

export interface ChangepointConfig {
  threshold?: number // 탐지 임계값
  minSegmentLength?: number // 최소 세그먼트 길이
  sensitivity?: 'low' | 'medium' | 'high'
}

const DEFAULT_CONFIG: ChangepointConfig = {
  threshold: 2,
  minSegmentLength: 5,
  sensitivity: 'medium',
}

export class ChangepointDetector {
  private config: ChangepointConfig

  constructor(config: Partial<ChangepointConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * CUSUM (Cumulative Sum) 기반 변화점 탐지
   */
  detectByCUSUM(data: number[], dates?: string[]): ChangepointResult[] {
    const changepoints: ChangepointResult[] = []
    const mean = statisticsEngine.summarize(data).mean
    const std = statisticsEngine.summarize(data).std
    
    if (std === 0) return []

    // 민감도에 따른 파라미터 조정
    const sensitivityMultiplier = {
      low: 1.5,
      medium: 1.0,
      high: 0.5,
    }[this.config.sensitivity!]

    const k = std * 0.5 * sensitivityMultiplier // slack value
    const h = this.config.threshold! * std * sensitivityMultiplier // threshold

    let cusumPos = 0
    let cusumNeg = 0
    let lastChangepoint = 0

    for (let i = 1; i < data.length; i++) {
      const diff = data[i] - mean

      cusumPos = Math.max(0, cusumPos + diff - k)
      cusumNeg = Math.max(0, cusumNeg - diff - k)

      // 최소 세그먼트 길이 확인
      if (i - lastChangepoint < this.config.minSegmentLength!) continue

      if (cusumPos > h) {
        const beforeMean = this.calculateMean(data, lastChangepoint, i)
        const afterMean = this.calculateMean(data, i, Math.min(i + 5, data.length))
        
        changepoints.push({
          index: i,
          date: dates?.[i],
          type: 'increase',
          magnitude: (afterMean - beforeMean) / std,
          confidence: Math.min(cusumPos / h, 1),
          beforeMean,
          afterMean,
        })
        cusumPos = 0
        lastChangepoint = i
      }

      if (cusumNeg > h) {
        const beforeMean = this.calculateMean(data, lastChangepoint, i)
        const afterMean = this.calculateMean(data, i, Math.min(i + 5, data.length))
        
        changepoints.push({
          index: i,
          date: dates?.[i],
          type: 'decrease',
          magnitude: (beforeMean - afterMean) / std,
          confidence: Math.min(cusumNeg / h, 1),
          beforeMean,
          afterMean,
        })
        cusumNeg = 0
        lastChangepoint = i
      }
    }

    return changepoints
  }

  /**
   * 이동 윈도우 기반 변화점 탐지
   */
  detectByMovingWindow(data: number[], dates?: string[], windowSize: number = 7): ChangepointResult[] {
    const changepoints: ChangepointResult[] = []
    
    if (data.length < windowSize * 2) return []

    for (let i = windowSize; i < data.length - windowSize; i++) {
      const leftWindow = data.slice(i - windowSize, i)
      const rightWindow = data.slice(i, i + windowSize)
      
      const leftMean = statisticsEngine.summarize(leftWindow).mean
      const rightMean = statisticsEngine.summarize(rightWindow).mean
      const leftStd = statisticsEngine.summarize(leftWindow).std
      const rightStd = statisticsEngine.summarize(rightWindow).std
      
      const pooledStd = Math.sqrt((leftStd ** 2 + rightStd ** 2) / 2)
      
      if (pooledStd === 0) continue
      
      const tStatistic = Math.abs(rightMean - leftMean) / (pooledStd * Math.sqrt(2 / windowSize))
      
      // t-통계량 임계값 (근사)
      const threshold = this.config.threshold! * 1.5
      
      if (tStatistic > threshold) {
        // 이전 변화점과 충분히 떨어져 있는지 확인
        const lastChangepoint = changepoints[changepoints.length - 1]
        if (!lastChangepoint || i - lastChangepoint.index >= this.config.minSegmentLength!) {
          changepoints.push({
            index: i,
            date: dates?.[i],
            type: rightMean > leftMean ? 'increase' : 'decrease',
            magnitude: Math.abs(rightMean - leftMean) / pooledStd,
            confidence: Math.min(tStatistic / (threshold * 2), 1),
            beforeMean: leftMean,
            afterMean: rightMean,
          })
        }
      }
    }

    return changepoints
  }

  /**
   * 추세 변화점 탐지
   */
  detectTrendChanges(data: number[], dates?: string[], windowSize: number = 10): ChangepointResult[] {
    const changepoints: ChangepointResult[] = []
    
    if (data.length < windowSize * 2) return []

    // 각 윈도우의 기울기 계산
    const slopes: number[] = []
    for (let i = 0; i <= data.length - windowSize; i++) {
      const window = data.slice(i, i + windowSize)
      const x = Array.from({ length: windowSize }, (_, j) => j)
      const regression = statisticsEngine.linearRegression(x, window)
      slopes.push(regression.slope)
    }

    // 기울기 변화 탐지
    for (let i = 1; i < slopes.length; i++) {
      const slopeChange = slopes[i] - slopes[i - 1]
      const avgSlope = (Math.abs(slopes[i]) + Math.abs(slopes[i - 1])) / 2
      
      if (avgSlope === 0) continue
      
      const relativeChange = Math.abs(slopeChange) / (avgSlope + 0.001)
      
      if (relativeChange > this.config.threshold!) {
        const dataIndex = i + Math.floor(windowSize / 2)
        const lastChangepoint = changepoints[changepoints.length - 1]
        
        if (!lastChangepoint || dataIndex - lastChangepoint.index >= this.config.minSegmentLength!) {
          changepoints.push({
            index: dataIndex,
            date: dates?.[dataIndex],
            type: 'trend_change',
            magnitude: relativeChange,
            confidence: Math.min(relativeChange / (this.config.threshold! * 2), 1),
            beforeMean: slopes[i - 1],
            afterMean: slopes[i],
          })
        }
      }
    }

    return changepoints
  }

  /**
   * 앙상블 변화점 탐지 (여러 방법 결합)
   */
  detect(data: number[], dates?: string[]): ChangepointResult[] {
    const cusumResults = this.detectByCUSUM(data, dates)
    const windowResults = this.detectByMovingWindow(data, dates)
    const trendResults = this.detectTrendChanges(data, dates)

    // 결과 병합 및 중복 제거
    const allResults = [...cusumResults, ...windowResults, ...trendResults]
    const merged = this.mergeChangepoints(allResults)

    return merged.sort((a, b) => a.index - b.index)
  }

  /**
   * 변화점 병합 (근접한 변화점 통합)
   */
  private mergeChangepoints(changepoints: ChangepointResult[]): ChangepointResult[] {
    if (changepoints.length === 0) return []

    // 인덱스 기준 정렬
    const sorted = [...changepoints].sort((a, b) => a.index - b.index)
    const merged: ChangepointResult[] = []
    let current = sorted[0]

    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i]
      
      // 근접한 변화점 병합
      if (next.index - current.index <= this.config.minSegmentLength!) {
        // 신뢰도가 높은 것 선택
        if (next.confidence > current.confidence) {
          current = next
        }
      } else {
        merged.push(current)
        current = next
      }
    }
    merged.push(current)

    return merged
  }

  /**
   * 구간 평균 계산
   */
  private calculateMean(data: number[], start: number, end: number): number {
    const segment = data.slice(start, end)
    if (segment.length === 0) return 0
    return segment.reduce((a, b) => a + b, 0) / segment.length
  }

  /**
   * 변화점 해석 생성
   */
  interpretChangepoint(cp: ChangepointResult): string {
    const direction = cp.type === 'increase' ? '상승' : 
                      cp.type === 'decrease' ? '하락' : 
                      '추세 변화'
    
    const magnitude = cp.magnitude > 2 ? '급격한' : 
                      cp.magnitude > 1 ? '유의미한' : '약한'
    
    const confidence = cp.confidence > 0.8 ? '높은 신뢰도' : 
                       cp.confidence > 0.5 ? '중간 신뢰도' : '낮은 신뢰도'

    return `${cp.date || `인덱스 ${cp.index}`}에서 ${magnitude} ${direction} 감지 (${confidence})`
  }

  /**
   * 변화점 요약 생성
   */
  summarize(changepoints: ChangepointResult[]): {
    totalChangepoints: number
    increases: number
    decreases: number
    trendChanges: number
    avgConfidence: number
    significantChanges: ChangepointResult[]
  } {
    const increases = changepoints.filter(cp => cp.type === 'increase').length
    const decreases = changepoints.filter(cp => cp.type === 'decrease').length
    const trendChanges = changepoints.filter(cp => cp.type === 'trend_change').length
    const avgConfidence = changepoints.length > 0
      ? changepoints.reduce((sum, cp) => sum + cp.confidence, 0) / changepoints.length
      : 0
    const significantChanges = changepoints
      .filter(cp => cp.confidence > 0.7 && cp.magnitude > 1)
      .sort((a, b) => b.magnitude - a.magnitude)
      .slice(0, 5)

    return {
      totalChangepoints: changepoints.length,
      increases,
      decreases,
      trendChanges,
      avgConfidence,
      significantChanges,
    }
  }
}

// 싱글톤 인스턴스
export const changepointDetector = new ChangepointDetector()

