/**
 * TimeSeriesDecomposer - 시계열 분해 분석 서비스
 * v4.1: STL 분해 (계절성 + 추세 + 잔차)
 */

// ==================== 타입 정의 ====================

export interface TimeSeriesPoint {
  date: Date
  value: number
}

export interface SeasonalPattern {
  type: 'weekly' | 'monthly' | 'yearly' | 'none'
  peakPeriods: string[]      // 성수기
  troughPeriods: string[]     // 비수기
  amplitude: number           // 계절 변동폭
  strength: number            // 계절성 강도 (0-1)
}

export interface TrendAnalysis {
  direction: 'up' | 'down' | 'stable'
  slope: number               // 기울기 (일일 변화량)
  changePoints: Date[]        // 추세 변화 시점
  acceleration: number        // 가속도
}

export interface AnomalyPoint {
  date: Date
  value: number
  expected: number
  deviation: number
  zScore: number
  possibleCause: string
}

export interface TimeSeriesDecomposition {
  original: number[]          // 원본 데이터
  trend: number[]             // 추세 성분
  seasonal: number[]          // 계절성 성분
  residual: number[]          // 잔차 (이상치)
  
  seasonalPattern: SeasonalPattern
  trendAnalysis: TrendAnalysis
  anomalies: AnomalyPoint[]
  
  metadata: {
    period: number            // 계절성 주기
    dataPoints: number
    dateRange: { start: Date; end: Date }
  }
}

// ==================== 유틸리티 함수 ====================

/**
 * 이동평균 계산
 */
function movingAverage(data: number[], windowSize: number): number[] {
  const result: number[] = []
  const halfWindow = Math.floor(windowSize / 2)
  
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - halfWindow)
    const end = Math.min(data.length, i + halfWindow + 1)
    const window = data.slice(start, end)
    const avg = window.reduce((a, b) => a + b, 0) / window.length
    result.push(avg)
  }
  
  return result
}

/**
 * 로컬 가중 회귀 (LOWESS) - 추세 추출
 */
function lowess(data: number[], windowSize: number, alpha: number = 0.3): number[] {
  const result: number[] = []
  
  for (let i = 0; i < data.length; i++) {
    const weights: number[] = []
    const values: number[] = []
    
    for (let j = 0; j < data.length; j++) {
      const distance = Math.abs(i - j) / windowSize
      const weight = distance <= 1 ? Math.pow(1 - Math.pow(distance, 3), 3) : 0
      weights.push(weight)
      values.push(data[j])
    }
    
    // 가중 평균
    const totalWeight = weights.reduce((a, b) => a + b, 0)
    if (totalWeight > 0) {
      const weightedSum = values.reduce((sum, val, idx) => sum + val * weights[idx], 0)
      result.push(weightedSum / totalWeight)
    } else {
      result.push(data[i])
    }
  }
  
  return result
}

/**
 * 계절성 추출
 */
function extractSeasonality(
  detrended: number[],
  period: number
): number[] {
  if (period <= 1 || detrended.length < period * 2) {
    return new Array(detrended.length).fill(0)
  }
  
  // 각 위치별 평균 계산
  const seasonal: number[] = new Array(period).fill(0)
  const counts: number[] = new Array(period).fill(0)
  
  for (let i = 0; i < detrended.length; i++) {
    const pos = i % period
    seasonal[pos] += detrended[i]
    counts[pos]++
  }
  
  // 평균 계산 및 중앙화
  for (let i = 0; i < period; i++) {
    if (counts[i] > 0) {
      seasonal[i] /= counts[i]
    }
  }
  
  const seasonalMean = seasonal.reduce((a, b) => a + b, 0) / period
  
  // 중앙화 (평균을 0으로)
  for (let i = 0; i < period; i++) {
    seasonal[i] -= seasonalMean
  }
  
  // 전체 데이터에 적용
  const fullSeasonal: number[] = []
  for (let i = 0; i < detrended.length; i++) {
    fullSeasonal.push(seasonal[i % period])
  }
  
  return fullSeasonal
}

/**
 * 계절성 패턴 분석
 */
function analyzeSeasonalPattern(
  seasonal: number[],
  period: number,
  dates: Date[]
): SeasonalPattern {
  if (period <= 1 || seasonal.length < period) {
    return {
      type: 'none',
      peakPeriods: [],
      troughPeriods: [],
      amplitude: 0,
      strength: 0
    }
  }
  
  // 주기별 값 추출
  const periodValues: number[] = new Array(period).fill(0)
  const periodCounts: number[] = new Array(period).fill(0)
  
  for (let i = 0; i < seasonal.length; i++) {
    const pos = i % period
    periodValues[pos] += seasonal[i]
    periodCounts[pos]++
  }
  
  for (let i = 0; i < period; i++) {
    if (periodCounts[i] > 0) {
      periodValues[i] /= periodCounts[i]
    }
  }
  
  const maxValue = Math.max(...periodValues)
  const minValue = Math.min(...periodValues)
  const amplitude = maxValue - minValue
  
  // 계절성 강도 계산 (변동 계수)
  const mean = periodValues.reduce((a, b) => a + b, 0) / period
  const variance = periodValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period
  const stdDev = Math.sqrt(variance)
  const strength = mean !== 0 ? Math.min(1, stdDev / Math.abs(mean)) : 0
  
  // 피크 및 트로프 기간 식별
  const peakIndices: number[] = []
  const troughIndices: number[] = []
  
  for (let i = 0; i < period; i++) {
    if (periodValues[i] >= maxValue * 0.8) {
      peakIndices.push(i)
    }
    if (periodValues[i] <= minValue * 1.2) {
      troughIndices.push(i)
    }
  }
  
  // 기간 타입 결정
  let type: 'weekly' | 'monthly' | 'yearly' | 'none' = 'none'
  if (period === 7) {
    type = 'weekly'
  } else if (period >= 28 && period <= 31) {
    type = 'monthly'
  } else if (period >= 365 || period >= 52) {
    type = 'yearly'
  } else if (strength > 0.1) {
    type = period <= 7 ? 'weekly' : 'monthly'
  }
  
  // 기간 라벨 생성
  const peakPeriods = peakIndices.map(idx => {
    if (type === 'weekly') {
      const days = ['일', '월', '화', '수', '목', '금', '토']
      return days[idx] || `${idx}일`
    } else if (type === 'monthly') {
      return `${idx + 1}일`
    } else {
      return `${idx}주`
    }
  })
  
  const troughPeriods = troughIndices.map(idx => {
    if (type === 'weekly') {
      const days = ['일', '월', '화', '수', '목', '금', '토']
      return days[idx] || `${idx}일`
    } else if (type === 'monthly') {
      return `${idx + 1}일`
    } else {
      return `${idx}주`
    }
  })
  
  return {
    type,
    peakPeriods,
    troughPeriods,
    amplitude,
    strength
  }
}

/**
 * 추세 분석
 */
function analyzeTrend(
  trend: number[],
  dates: Date[]
): TrendAnalysis {
  if (trend.length < 2) {
    return {
      direction: 'stable',
      slope: 0,
      changePoints: [],
      acceleration: 0
    }
  }
  
  // 선형 회귀로 기울기 계산
  const n = trend.length
  const x = trend.map((_, i) => i)
  const y = trend
  
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  
  // 방향 결정
  const direction: 'up' | 'down' | 'stable' = 
    slope > 0.01 ? 'up' :
    slope < -0.01 ? 'down' : 'stable'
  
  // 변화점 탐지 (추세의 2차 미분)
  const changePoints: Date[] = []
  const secondDerivative: number[] = []
  
  for (let i = 1; i < trend.length - 1; i++) {
    const firstDeriv = trend[i] - trend[i - 1]
    const secondDeriv = (trend[i + 1] - trend[i]) - firstDeriv
    secondDerivative.push(secondDeriv)
  }
  
  // 변화점: 2차 미분이 임계값을 넘는 지점
  const threshold = Math.abs(slope) * 0.5
  for (let i = 1; i < secondDerivative.length; i++) {
    if (Math.abs(secondDerivative[i]) > threshold && 
        Math.sign(secondDerivative[i]) !== Math.sign(secondDerivative[i - 1])) {
      changePoints.push(dates[i + 1])
    }
  }
  
  // 가속도 계산
  const acceleration = secondDerivative.length > 0
    ? secondDerivative.reduce((a, b) => a + b, 0) / secondDerivative.length
    : 0
  
  return {
    direction,
    slope,
    changePoints,
    acceleration
  }
}

/**
 * 이상치 탐지 (잔차 기반)
 */
function detectAnomalies(
  residual: number[],
  dates: Date[],
  original: number[],
  trend: number[]
): AnomalyPoint[] {
  if (residual.length === 0) return []
  
  // 통계량 계산
  const mean = residual.reduce((a, b) => a + b, 0) / residual.length
  const variance = residual.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / residual.length
  const stdDev = Math.sqrt(variance)
  
  if (stdDev === 0) return []
  
  // Z-score 계산 및 이상치 식별
  const anomalies: AnomalyPoint[] = []
  const threshold = 2.5 // 2.5 표준편차 이상
  
  for (let i = 0; i < residual.length; i++) {
    const zScore = Math.abs((residual[i] - mean) / stdDev)
    
    if (zScore > threshold) {
      const expected = trend[i] + (i < trend.length ? 0 : mean)
      const deviation = original[i] - expected
      
      // 가능한 원인 추론
      let possibleCause = '이상 패턴 감지'
      if (deviation > 0) {
        if (zScore > 3) {
          possibleCause = '대규모 프로모션 또는 이벤트'
        } else {
          possibleCause = '일시적 수요 증가'
        }
      } else {
        if (zScore > 3) {
          possibleCause = '시스템 장애 또는 외부 요인'
        } else {
          possibleCause = '일시적 수요 감소'
        }
      }
      
      anomalies.push({
        date: dates[i],
        value: original[i],
        expected,
        deviation,
        zScore,
        possibleCause
      })
    }
  }
  
  // Z-score 기준 정렬
  return anomalies.sort((a, b) => b.zScore - a.zScore)
}

// ==================== 메인 서비스 ====================

export class TimeSeriesDecomposer {
  /**
   * 시계열 분해 실행
   */
  decompose(
    data: TimeSeriesPoint[],
    period?: number
  ): TimeSeriesDecomposition {
    if (data.length < 2) {
      throw new Error('시계열 데이터가 부족합니다. 최소 2개 이상의 데이터 포인트가 필요합니다.')
    }
    
    // 데이터 정렬
    const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime())
    const values = sortedData.map(d => d.value)
    const dates = sortedData.map(d => d.date)
    
    // 계절성 주기 자동 감지 (데이터 길이 기반)
    let detectedPeriod = period
    if (!detectedPeriod) {
      if (data.length >= 365) {
        detectedPeriod = 365 // 연간
      } else if (data.length >= 30) {
        detectedPeriod = 7 // 주간
      } else {
        detectedPeriod = Math.max(2, Math.floor(data.length / 3))
      }
    }
    
    // 1. 추세 추출 (LOWESS 사용)
    const trendWindow = Math.max(3, Math.floor(data.length / 10))
    const trend = lowess(values, trendWindow)
    
    // 2. 추세 제거
    const detrended = values.map((val, i) => val - trend[i])
    
    // 3. 계절성 추출
    const seasonal = extractSeasonality(detrended, detectedPeriod)
    
    // 4. 잔차 계산
    const residual = values.map((val, i) => 
      val - trend[i] - seasonal[i]
    )
    
    // 5. 계절성 패턴 분석
    const seasonalPattern = analyzeSeasonalPattern(seasonal, detectedPeriod, dates)
    
    // 6. 추세 분석
    const trendAnalysis = analyzeTrend(trend, dates)
    
    // 7. 이상치 탐지
    const anomalies = detectAnomalies(residual, dates, values, trend)
    
    return {
      original: values,
      trend,
      seasonal,
      residual,
      seasonalPattern,
      trendAnalysis,
      anomalies,
      metadata: {
        period: detectedPeriod,
        dataPoints: data.length,
        dateRange: {
          start: dates[0],
          end: dates[dates.length - 1]
        }
      }
    }
  }
  
  /**
   * 일별 데이터로 변환 (집계)
   */
  aggregateToDaily(
    data: { date: Date; value: number }[],
    dateColumn: string = 'date',
    valueColumn: string = 'value'
  ): TimeSeriesPoint[] {
    const dailyMap = new Map<string, { sum: number; count: number }>()
    
    for (const row of data) {
      const date = row.date || (row as any)[dateColumn]
      if (!date) continue
      
      const dateKey = new Date(date).toISOString().split('T')[0]
      const value = row.value || (row as any)[valueColumn] || 0
      
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { sum: 0, count: 0 })
      }
      
      const daily = dailyMap.get(dateKey)!
      daily.sum += value
      daily.count++
    }
    
    return Array.from(dailyMap.entries())
      .map(([dateKey, daily]) => ({
        date: new Date(dateKey),
        value: daily.count > 0 ? daily.sum / daily.count : daily.sum
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }
}

export const timeSeriesDecomposer = new TimeSeriesDecomposer()

