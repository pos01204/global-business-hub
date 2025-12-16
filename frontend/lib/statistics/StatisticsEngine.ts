/**
 * StatisticsEngine - 통계 분석 엔진
 * simple-statistics 기반 고급 통계 분석
 */

// simple-statistics 타입 정의 (라이브러리 설치 전 임시)
// 실제 설치 후 import * as ss from 'simple-statistics' 로 교체

// 기본 통계 함수들 (simple-statistics 없이도 동작하도록)
const ss = {
  mean: (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length,
  
  median: (arr: number[]) => {
    const sorted = [...arr].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  },
  
  standardDeviation: (arr: number[]) => {
    const avg = ss.mean(arr)
    const squareDiffs = arr.map(value => Math.pow(value - avg, 2))
    return Math.sqrt(ss.mean(squareDiffs))
  },
  
  variance: (arr: number[]) => {
    const avg = ss.mean(arr)
    return ss.mean(arr.map(value => Math.pow(value - avg, 2)))
  },
  
  min: (arr: number[]) => Math.min(...arr),
  max: (arr: number[]) => Math.max(...arr),
  sum: (arr: number[]) => arr.reduce((a, b) => a + b, 0),
  
  quantile: (arr: number[], p: number) => {
    const sorted = [...arr].sort((a, b) => a - b)
    const pos = (sorted.length - 1) * p
    const base = Math.floor(pos)
    const rest = pos - base
    if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base])
    }
    return sorted[base]
  },
  
  linearRegression: (points: [number, number][]) => {
    const n = points.length
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0
    
    for (const [x, y] of points) {
      sumX += x
      sumY += y
      sumXY += x * y
      sumXX += x * x
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    return { m: slope, b: intercept }
  },
  
  linearRegressionLine: (mb: { m: number, b: number }) => {
    return (x: number) => mb.m * x + mb.b
  },
  
  rSquared: (actual: number[], predicted: number[]) => {
    const mean = ss.mean(actual)
    const ssTotal = actual.reduce((sum, y) => sum + Math.pow(y - mean, 2), 0)
    const ssResidual = actual.reduce((sum, y, i) => sum + Math.pow(y - predicted[i], 2), 0)
    return 1 - (ssResidual / ssTotal)
  },
  
  sampleCorrelation: (x: number[], y: number[]) => {
    const n = x.length
    const meanX = ss.mean(x)
    const meanY = ss.mean(y)
    const stdX = ss.standardDeviation(x)
    const stdY = ss.standardDeviation(y)
    
    let sum = 0
    for (let i = 0; i < n; i++) {
      sum += (x[i] - meanX) * (y[i] - meanY)
    }
    
    return sum / ((n - 1) * stdX * stdY)
  },
}

// 이상치 탐지 결과 타입
export interface AnomalyResult {
  index: number
  value: number
  zScore?: number
  isAnomaly: boolean
  severity: 'normal' | 'warning' | 'critical'
  method: string
}

// 회귀 분석 결과 타입
export interface RegressionResult {
  slope: number
  intercept: number
  r2: number
  predictions: number[]
  equation: string
}

// 시계열 분해 결과 타입
export interface DecompositionResult {
  trend: number[]
  seasonal: number[]
  residual: number[]
  strength: {
    trend: number
    seasonal: number
  }
}

// 변화점 결과 타입
export interface ChangepointResult {
  index: number
  date?: string
  type: 'increase' | 'decrease' | 'level_shift'
  magnitude: number
  confidence: number
}

// 통계 요약 타입
export interface StatsSummary {
  count: number
  mean: number
  median: number
  min: number
  max: number
  std: number
  variance: number
  q1: number
  q3: number
  iqr: number
  skewness: number
  kurtosis: number
}

export class StatisticsEngine {
  /**
   * 기본 통계 요약
   */
  summarize(data: number[]): StatsSummary {
    if (data.length === 0) {
      return {
        count: 0, mean: 0, median: 0, min: 0, max: 0,
        std: 0, variance: 0, q1: 0, q3: 0, iqr: 0,
        skewness: 0, kurtosis: 0
      }
    }
    
    const mean = ss.mean(data)
    const std = ss.standardDeviation(data)
    const q1 = ss.quantile(data, 0.25)
    const q3 = ss.quantile(data, 0.75)
    
    return {
      count: data.length,
      mean,
      median: ss.median(data),
      min: ss.min(data),
      max: ss.max(data),
      std,
      variance: ss.variance(data),
      q1,
      q3,
      iqr: q3 - q1,
      skewness: this.calculateSkewness(data, mean, std),
      kurtosis: this.calculateKurtosis(data, mean, std),
    }
  }
  
  /**
   * 왜도 계산
   */
  private calculateSkewness(data: number[], mean: number, std: number): number {
    if (std === 0) return 0
    const n = data.length
    const sum = data.reduce((acc, val) => acc + Math.pow((val - mean) / std, 3), 0)
    return (n / ((n - 1) * (n - 2))) * sum
  }
  
  /**
   * 첨도 계산
   */
  private calculateKurtosis(data: number[], mean: number, std: number): number {
    if (std === 0) return 0
    const n = data.length
    const sum = data.reduce((acc, val) => acc + Math.pow((val - mean) / std, 4), 0)
    return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum - 
           (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3))
  }
  
  /**
   * Z-score 기반 이상치 탐지
   */
  detectZScoreAnomalies(data: number[], threshold = 3): AnomalyResult[] {
    const mean = ss.mean(data)
    const std = ss.standardDeviation(data)
    
    if (std === 0) {
      return data.map((value, index) => ({
        index,
        value,
        zScore: 0,
        isAnomaly: false,
        severity: 'normal' as const,
        method: 'z-score'
      }))
    }
    
    return data.map((value, index) => {
      const zScore = (value - mean) / std
      const absZ = Math.abs(zScore)
      
      return {
        index,
        value,
        zScore,
        isAnomaly: absZ > threshold,
        severity: absZ > threshold * 1.5 ? 'critical' : 
                  absZ > threshold ? 'warning' : 'normal',
        method: 'z-score'
      }
    })
  }
  
  /**
   * IQR 기반 이상치 탐지
   */
  detectIQRAnomalies(data: number[], multiplier = 1.5): AnomalyResult[] {
    const q1 = ss.quantile(data, 0.25)
    const q3 = ss.quantile(data, 0.75)
    const iqr = q3 - q1
    const lowerBound = q1 - multiplier * iqr
    const upperBound = q3 + multiplier * iqr
    
    return data.map((value, index) => {
      const isAnomaly = value < lowerBound || value > upperBound
      const distance = value < lowerBound 
        ? (lowerBound - value) / iqr 
        : value > upperBound 
          ? (value - upperBound) / iqr 
          : 0
      
      return {
        index,
        value,
        isAnomaly,
        severity: distance > 3 ? 'critical' : 
                  distance > 1.5 ? 'warning' : 'normal',
        method: 'iqr'
      }
    })
  }
  
  /**
   * 앙상블 이상치 탐지 (Z-score + IQR)
   */
  detectAnomalies(data: number[]): AnomalyResult[] {
    const zScoreResults = this.detectZScoreAnomalies(data)
    const iqrResults = this.detectIQRAnomalies(data)
    
    return data.map((value, index) => {
      const zResult = zScoreResults[index]
      const iqrResult = iqrResults[index]
      
      // 두 방법 모두 이상치로 판단하면 더 신뢰
      const isAnomaly = zResult.isAnomaly || iqrResult.isAnomaly
      const severity = (zResult.severity === 'critical' || iqrResult.severity === 'critical') 
        ? 'critical'
        : (zResult.severity === 'warning' || iqrResult.severity === 'warning')
          ? 'warning'
          : 'normal'
      
      return {
        index,
        value,
        zScore: zResult.zScore,
        isAnomaly,
        severity,
        method: zResult.isAnomaly && iqrResult.isAnomaly 
          ? 'ensemble' 
          : zResult.isAnomaly ? 'z-score' : 'iqr'
      }
    })
  }
  
  /**
   * 선형 회귀 분석
   */
  linearRegression(x: number[], y: number[]): RegressionResult {
    const points: [number, number][] = x.map((xi, i) => [xi, y[i]])
    const regression = ss.linearRegression(points)
    const line = ss.linearRegressionLine(regression)
    const predictions = x.map(line)
    const r2 = ss.rSquared(y, predictions)
    
    return {
      slope: regression.m,
      intercept: regression.b,
      r2,
      predictions,
      equation: `y = ${regression.m.toFixed(4)}x + ${regression.b.toFixed(4)}`
    }
  }
  
  /**
   * 이동 평균 계산
   */
  movingAverage(data: number[], window: number): number[] {
    const result: number[] = []
    
    for (let i = 0; i < data.length; i++) {
      if (i < window - 1) {
        // 윈도우 크기보다 작은 경우 가능한 데이터로 평균
        result.push(ss.mean(data.slice(0, i + 1)))
      } else {
        result.push(ss.mean(data.slice(i - window + 1, i + 1)))
      }
    }
    
    return result
  }
  
  /**
   * 지수 이동 평균 계산
   */
  exponentialMovingAverage(data: number[], alpha = 0.3): number[] {
    const result: number[] = [data[0]]
    
    for (let i = 1; i < data.length; i++) {
      result.push(alpha * data[i] + (1 - alpha) * result[i - 1])
    }
    
    return result
  }
  
  /**
   * 변화점 탐지 (CUSUM 기반)
   */
  detectChangepoints(data: number[], threshold = 2): ChangepointResult[] {
    const mean = ss.mean(data)
    const std = ss.standardDeviation(data)
    const changepoints: ChangepointResult[] = []
    
    let cusumPos = 0
    let cusumNeg = 0
    const k = std * 0.5 // slack value
    const h = threshold * std // threshold
    
    for (let i = 1; i < data.length; i++) {
      const diff = data[i] - mean
      
      cusumPos = Math.max(0, cusumPos + diff - k)
      cusumNeg = Math.max(0, cusumNeg - diff - k)
      
      if (cusumPos > h) {
        changepoints.push({
          index: i,
          type: 'increase',
          magnitude: (data[i] - data[i - 1]) / std,
          confidence: Math.min(cusumPos / h, 1)
        })
        cusumPos = 0
      }
      
      if (cusumNeg > h) {
        changepoints.push({
          index: i,
          type: 'decrease',
          magnitude: (data[i - 1] - data[i]) / std,
          confidence: Math.min(cusumNeg / h, 1)
        })
        cusumNeg = 0
      }
    }
    
    return changepoints
  }
  
  /**
   * 단순 시계열 분해
   */
  decompose(data: number[], period: number): DecompositionResult {
    // 트렌드 (이동 평균)
    const trend = this.movingAverage(data, period)
    
    // 디트렌드
    const detrended = data.map((v, i) => v - trend[i])
    
    // 계절성 추출
    const seasonal: number[] = []
    for (let i = 0; i < period; i++) {
      const seasonalValues = detrended.filter((_, idx) => idx % period === i)
      seasonal.push(ss.mean(seasonalValues))
    }
    
    // 전체 계절성 배열
    const fullSeasonal = data.map((_, i) => seasonal[i % period])
    
    // 잔차
    const residual = data.map((v, i) => v - trend[i] - fullSeasonal[i])
    
    // 강도 계산
    const varResidual = ss.variance(residual)
    const varDetrended = ss.variance(detrended)
    const varDeseasoned = ss.variance(data.map((v, i) => v - fullSeasonal[i]))
    
    return {
      trend,
      seasonal: fullSeasonal,
      residual,
      strength: {
        trend: Math.max(0, 1 - varResidual / varDeseasoned),
        seasonal: Math.max(0, 1 - varResidual / varDetrended)
      }
    }
  }
  
  /**
   * 상관관계 분석
   */
  correlation(x: number[], y: number[]): number {
    return ss.sampleCorrelation(x, y)
  }
  
  /**
   * 성장률 계산
   */
  growthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / Math.abs(previous)) * 100
  }
  
  /**
   * CAGR (연평균 성장률) 계산
   */
  cagr(startValue: number, endValue: number, years: number): number {
    if (startValue <= 0 || years <= 0) return 0
    return (Math.pow(endValue / startValue, 1 / years) - 1) * 100
  }
  
  /**
   * 예측 (단순 선형 회귀 기반)
   */
  forecast(data: number[], periods: number): { values: number[], confidence: number } {
    const x = data.map((_, i) => i)
    const regression = this.linearRegression(x, data)
    
    const predictions: number[] = []
    for (let i = 0; i < periods; i++) {
      const nextX = data.length + i
      predictions.push(regression.slope * nextX + regression.intercept)
    }
    
    return {
      values: predictions,
      confidence: regression.r2
    }
  }
}

// 싱글톤 인스턴스
export const statisticsEngine = new StatisticsEngine()

