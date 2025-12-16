/**
 * AdvancedStatistics - 고급 통계 분석 엔진
 * 앙상블 예측, 변화점 탐지, 상관관계 분석 등
 */

import * as ss from 'simple-statistics'

// ==================== 타입 정의 ====================

export interface TimeSeriesPoint {
  date: string
  value: number
}

export interface EnsembleForecastResult {
  predictions: Array<{
    date: string
    value: number
    lower95: number
    upper95: number
    lower80: number
    upper80: number
  }>
  modelMetrics: {
    mape: number
    rmse: number
    mae: number
    r2: number
  }
  modelContributions: Array<{
    name: string
    weight: number
    mape: number
  }>
}

export interface ChangepointResult {
  changepoints: Array<{
    date: string
    index: number
    type: 'increase' | 'decrease' | 'level_shift' | 'trend_change'
    magnitude: number
    confidence: number
    beforeMean: number
    afterMean: number
  }>
  summary: {
    totalChangepoints: number
    significantChangepoints: number
  }
}

export interface CorrelationResult {
  matrix: number[][]
  variables: string[]
  pairs: Array<{
    var1: string
    var2: string
    correlation: number
    pValue: number
    significant: boolean
  }>
  topCorrelations: Array<{
    var1: string
    var2: string
    correlation: number
  }>
}

export interface AnomalyResult {
  anomalies: Array<{
    date: string
    value: number
    expected: number
    deviation: number
    zScore: number
    severity: 'critical' | 'warning' | 'info'
    type: 'spike' | 'drop' | 'outlier'
  }>
  summary: {
    totalPoints: number
    anomalyCount: number
    criticalCount: number
    warningCount: number
  }
}

// ==================== 앙상블 예측 엔진 ====================

export class EnsembleForecastEngine {
  private models: Array<{
    name: string
    weight: number
    predict: (data: number[], periods: number) => number[]
  }>

  constructor() {
    this.models = [
      { name: 'SMA', weight: 0.15, predict: this.simpleMovingAverage.bind(this) },
      { name: 'EMA', weight: 0.20, predict: this.exponentialMovingAverage.bind(this) },
      { name: 'ETS', weight: 0.25, predict: this.exponentialSmoothing.bind(this) },
      { name: 'Linear', weight: 0.20, predict: this.linearRegression.bind(this) },
      { name: 'SeasonalNaive', weight: 0.20, predict: this.seasonalNaive.bind(this) },
    ]
  }

  /**
   * 앙상블 예측 실행
   */
  forecast(data: TimeSeriesPoint[], periods: number = 30): EnsembleForecastResult {
    const values = data.map(d => d.value)
    const lastDate = new Date(data[data.length - 1].date)

    // 각 모델 예측 실행
    const modelPredictions = this.models.map(model => ({
      name: model.name,
      weight: model.weight,
      values: model.predict(values, periods),
      mape: this.calculateMAPE(values, model.predict(values.slice(0, -7), 7), values.slice(-7))
    }))

    // 가중 평균으로 앙상블
    const ensemble = this.weightedAverage(modelPredictions, periods)

    // 부트스트랩으로 신뢰 구간 계산
    const confidenceIntervals = this.bootstrapConfidenceInterval(values, periods, 500)

    // 예측 결과 생성
    const predictions = ensemble.map((value, i) => {
      const date = new Date(lastDate)
      date.setDate(date.getDate() + i + 1)
      
      return {
        date: date.toISOString().split('T')[0],
        value,
        lower95: confidenceIntervals.lower95[i],
        upper95: confidenceIntervals.upper95[i],
        lower80: confidenceIntervals.lower80[i],
        upper80: confidenceIntervals.upper80[i],
      }
    })

    // 모델 성능 지표
    const testPeriod = Math.min(7, Math.floor(values.length * 0.2))
    const trainData = values.slice(0, -testPeriod)
    const testData = values.slice(-testPeriod)
    const testPredictions = this.weightedAverage(
      this.models.map(m => ({
        name: m.name,
        weight: m.weight,
        values: m.predict(trainData, testPeriod),
        mape: 0
      })),
      testPeriod
    )

    return {
      predictions,
      modelMetrics: {
        mape: this.calculateMAPE(trainData, testPredictions, testData),
        rmse: this.calculateRMSE(testPredictions, testData),
        mae: this.calculateMAE(testPredictions, testData),
        r2: this.calculateR2(testPredictions, testData),
      },
      modelContributions: modelPredictions.map(m => ({
        name: m.name,
        weight: m.weight,
        mape: m.mape,
      })),
    }
  }

  // 단순 이동 평균
  private simpleMovingAverage(data: number[], periods: number): number[] {
    const window = Math.min(7, data.length)
    const lastValues = data.slice(-window)
    const avg = ss.mean(lastValues)
    return Array(periods).fill(avg)
  }

  // 지수 이동 평균
  private exponentialMovingAverage(data: number[], periods: number): number[] {
    const alpha = 0.3
    let ema = data[0]
    
    for (let i = 1; i < data.length; i++) {
      ema = alpha * data[i] + (1 - alpha) * ema
    }
    
    const predictions: number[] = []
    for (let i = 0; i < periods; i++) {
      predictions.push(ema)
    }
    
    return predictions
  }

  // 지수 평활법 (Holt's method)
  private exponentialSmoothing(data: number[], periods: number): number[] {
    const alpha = 0.3
    const beta = 0.1
    
    let level = data[0]
    let trend = data.length > 1 ? data[1] - data[0] : 0
    
    for (let i = 1; i < data.length; i++) {
      const prevLevel = level
      level = alpha * data[i] + (1 - alpha) * (level + trend)
      trend = beta * (level - prevLevel) + (1 - beta) * trend
    }
    
    const predictions: number[] = []
    for (let i = 1; i <= periods; i++) {
      predictions.push(Math.max(0, level + i * trend))
    }
    
    return predictions
  }

  // 선형 회귀
  private linearRegression(data: number[], periods: number): number[] {
    const x = data.map((_, i) => i)
    const regression = ss.linearRegression(x.map((xi, i) => [xi, data[i]]))
    const line = ss.linearRegressionLine(regression)
    
    const predictions: number[] = []
    for (let i = 0; i < periods; i++) {
      predictions.push(Math.max(0, line(data.length + i)))
    }
    
    return predictions
  }

  // 계절성 나이브
  private seasonalNaive(data: number[], periods: number): number[] {
    const seasonLength = 7 // 주간 계절성 가정
    const predictions: number[] = []
    
    for (let i = 0; i < periods; i++) {
      const idx = (data.length - seasonLength + (i % seasonLength)) % data.length
      predictions.push(data[idx])
    }
    
    return predictions
  }

  // 가중 평균 계산
  private weightedAverage(
    predictions: Array<{ values: number[]; weight: number }>,
    periods: number
  ): number[] {
    const totalWeight = predictions.reduce((sum, p) => sum + p.weight, 0)
    
    return Array.from({ length: periods }, (_, i) =>
      predictions.reduce((sum, p) => sum + (p.values[i] || 0) * p.weight, 0) / totalWeight
    )
  }

  // 부트스트랩 신뢰 구간
  private bootstrapConfidenceInterval(
    data: number[],
    periods: number,
    iterations: number
  ): { lower95: number[]; upper95: number[]; lower80: number[]; upper80: number[] } {
    const samples: number[][] = []
    
    for (let iter = 0; iter < iterations; iter++) {
      // 리샘플링
      const resample = Array.from({ length: data.length }, () => 
        data[Math.floor(Math.random() * data.length)]
      )
      
      // 예측
      const prediction = this.exponentialSmoothing(resample, periods)
      samples.push(prediction)
    }
    
    // 백분위수 계산
    const lower95: number[] = []
    const upper95: number[] = []
    const lower80: number[] = []
    const upper80: number[] = []
    
    for (let i = 0; i < periods; i++) {
      const values = samples.map(s => s[i]).sort((a, b) => a - b)
      lower95.push(ss.quantile(values, 0.025))
      upper95.push(ss.quantile(values, 0.975))
      lower80.push(ss.quantile(values, 0.10))
      upper80.push(ss.quantile(values, 0.90))
    }
    
    return { lower95, upper95, lower80, upper80 }
  }

  // MAPE 계산
  private calculateMAPE(train: number[], predictions: number[], actual: number[]): number {
    if (predictions.length !== actual.length) return 100
    
    let sum = 0
    let count = 0
    
    for (let i = 0; i < actual.length; i++) {
      if (actual[i] !== 0) {
        sum += Math.abs((actual[i] - predictions[i]) / actual[i])
        count++
      }
    }
    
    return count > 0 ? (sum / count) * 100 : 100
  }

  // RMSE 계산
  private calculateRMSE(predictions: number[], actual: number[]): number {
    const squaredErrors = predictions.map((p, i) => Math.pow(p - actual[i], 2))
    return Math.sqrt(ss.mean(squaredErrors))
  }

  // MAE 계산
  private calculateMAE(predictions: number[], actual: number[]): number {
    const absoluteErrors = predictions.map((p, i) => Math.abs(p - actual[i]))
    return ss.mean(absoluteErrors)
  }

  // R² 계산
  private calculateR2(predictions: number[], actual: number[]): number {
    const meanActual = ss.mean(actual)
    const ssRes = actual.reduce((sum, a, i) => sum + Math.pow(a - predictions[i], 2), 0)
    const ssTot = actual.reduce((sum, a) => sum + Math.pow(a - meanActual, 2), 0)
    return ssTot === 0 ? 0 : 1 - (ssRes / ssTot)
  }
}

// ==================== 변화점 탐지 ====================

export class ChangepointDetector {
  /**
   * CUSUM 알고리즘으로 변화점 탐지
   */
  detect(data: TimeSeriesPoint[], threshold: number = 2): ChangepointResult {
    const values = data.map(d => d.value)
    const changepoints: ChangepointResult['changepoints'] = []
    
    // CUSUM 계산
    const mean = ss.mean(values)
    const std = ss.standardDeviation(values)
    
    let cusumPos = 0
    let cusumNeg = 0
    const k = std * 0.5 // 슬랙 파라미터
    const h = threshold * std // 임계값
    
    for (let i = 1; i < values.length; i++) {
      const deviation = values[i] - mean
      
      cusumPos = Math.max(0, cusumPos + deviation - k)
      cusumNeg = Math.min(0, cusumNeg + deviation + k)
      
      // 변화점 감지
      if (cusumPos > h || cusumNeg < -h) {
        const beforeMean = ss.mean(values.slice(Math.max(0, i - 7), i))
        const afterMean = ss.mean(values.slice(i, Math.min(values.length, i + 7)))
        const magnitude = afterMean - beforeMean
        
        changepoints.push({
          date: data[i].date,
          index: i,
          type: magnitude > 0 ? 'increase' : 'decrease',
          magnitude: Math.abs(magnitude),
          confidence: Math.min(Math.abs(cusumPos > h ? cusumPos : cusumNeg) / h, 1),
          beforeMean,
          afterMean,
        })
        
        // CUSUM 리셋
        cusumPos = 0
        cusumNeg = 0
      }
    }
    
    // 추세 변화 탐지 (이동 윈도우)
    const windowSize = 7
    for (let i = windowSize; i < values.length - windowSize; i++) {
      const beforeSlope = this.calculateSlope(values.slice(i - windowSize, i))
      const afterSlope = this.calculateSlope(values.slice(i, i + windowSize))
      
      if (Math.sign(beforeSlope) !== Math.sign(afterSlope) && 
          Math.abs(beforeSlope - afterSlope) > std * 0.5) {
        
        // 중복 체크
        const isDuplicate = changepoints.some(cp => Math.abs(cp.index - i) < 3)
        if (!isDuplicate) {
          changepoints.push({
            date: data[i].date,
            index: i,
            type: 'trend_change',
            magnitude: Math.abs(afterSlope - beforeSlope),
            confidence: 0.7,
            beforeMean: ss.mean(values.slice(i - windowSize, i)),
            afterMean: ss.mean(values.slice(i, i + windowSize)),
          })
        }
      }
    }
    
    // 날짜순 정렬
    changepoints.sort((a, b) => a.index - b.index)
    
    return {
      changepoints,
      summary: {
        totalChangepoints: changepoints.length,
        significantChangepoints: changepoints.filter(cp => cp.confidence > 0.7).length,
      },
    }
  }
  
  private calculateSlope(values: number[]): number {
    const x = values.map((_, i) => i)
    const regression = ss.linearRegression(x.map((xi, i) => [xi, values[i]]))
    return regression.m
  }
}

// ==================== 이상치 탐지 ====================

export class AnomalyDetector {
  /**
   * Z-score와 IQR을 결합한 이상치 탐지
   */
  detect(
    data: TimeSeriesPoint[],
    sensitivity: 'low' | 'medium' | 'high' = 'medium'
  ): AnomalyResult {
    const values = data.map(d => d.value)
    const thresholds = {
      low: { zScore: 3.5, iqr: 2.5 },
      medium: { zScore: 2.5, iqr: 1.5 },
      high: { zScore: 2.0, iqr: 1.0 },
    }
    
    const threshold = thresholds[sensitivity]
    const anomalies: AnomalyResult['anomalies'] = []
    
    // 통계량 계산
    const mean = ss.mean(values)
    const std = ss.standardDeviation(values)
    const q1 = ss.quantile(values, 0.25)
    const q3 = ss.quantile(values, 0.75)
    const iqr = q3 - q1
    
    // 이동 평균으로 예상값 계산
    const windowSize = 7
    
    for (let i = 0; i < values.length; i++) {
      const value = values[i]
      const zScore = (value - mean) / std
      
      // IQR 기반 이상치 판정
      const lowerBound = q1 - threshold.iqr * iqr
      const upperBound = q3 + threshold.iqr * iqr
      
      // 이동 평균으로 예상값
      const windowStart = Math.max(0, i - windowSize)
      const windowEnd = Math.min(values.length, i + windowSize)
      const expected = ss.mean(values.slice(windowStart, windowEnd).filter((_, j) => windowStart + j !== i))
      
      const isZScoreAnomaly = Math.abs(zScore) > threshold.zScore
      const isIQRAnomaly = value < lowerBound || value > upperBound
      
      if (isZScoreAnomaly || isIQRAnomaly) {
        const deviation = value - expected
        
        anomalies.push({
          date: data[i].date,
          value,
          expected,
          deviation,
          zScore,
          severity: Math.abs(zScore) > 3.5 ? 'critical' : 
                   Math.abs(zScore) > 2.5 ? 'warning' : 'info',
          type: deviation > 0 ? 'spike' : 'drop',
        })
      }
    }
    
    return {
      anomalies,
      summary: {
        totalPoints: values.length,
        anomalyCount: anomalies.length,
        criticalCount: anomalies.filter(a => a.severity === 'critical').length,
        warningCount: anomalies.filter(a => a.severity === 'warning').length,
      },
    }
  }
}

// ==================== 상관관계 분석 ====================

export class CorrelationAnalyzer {
  /**
   * 다변량 상관관계 분석
   */
  analyze(
    datasets: Array<{ name: string; values: number[] }>,
    significanceLevel: number = 0.05
  ): CorrelationResult {
    const n = datasets.length
    const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0))
    const pairs: CorrelationResult['pairs'] = []
    
    // 상관계수 행렬 계산
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 1
        } else if (j > i) {
          const correlation = this.pearsonCorrelation(
            datasets[i].values,
            datasets[j].values
          )
          matrix[i][j] = correlation
          matrix[j][i] = correlation
          
          // p-value 계산 (t-test 근사)
          const sampleSize = Math.min(datasets[i].values.length, datasets[j].values.length)
          const pValue = this.calculatePValue(correlation, sampleSize)
          
          pairs.push({
            var1: datasets[i].name,
            var2: datasets[j].name,
            correlation,
            pValue,
            significant: pValue < significanceLevel,
          })
        }
      }
    }
    
    // 상위 상관관계 추출
    const topCorrelations = pairs
      .filter(p => p.significant)
      .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
      .slice(0, 10)
      .map(p => ({
        var1: p.var1,
        var2: p.var2,
        correlation: p.correlation,
      }))
    
    return {
      matrix,
      variables: datasets.map(d => d.name),
      pairs,
      topCorrelations,
    }
  }
  
  private pearsonCorrelation(x: number[], y: number[]): number {
    const minLength = Math.min(x.length, y.length)
    const xTrim = x.slice(0, minLength)
    const yTrim = y.slice(0, minLength)
    
    return ss.sampleCorrelation(xTrim, yTrim)
  }
  
  private calculatePValue(r: number, n: number): number {
    if (n < 3) return 1
    
    const t = r * Math.sqrt((n - 2) / (1 - r * r))
    const df = n - 2
    
    // t-분포 CDF 근사 (양측 검정)
    const x = df / (df + t * t)
    const pValue = this.incompleteBeta(df / 2, 0.5, x)
    
    return pValue
  }
  
  // 불완전 베타 함수 근사
  private incompleteBeta(a: number, b: number, x: number): number {
    // 간단한 근사 사용
    if (x === 0) return 0
    if (x === 1) return 1
    
    const bt = Math.exp(
      this.logGamma(a + b) - this.logGamma(a) - this.logGamma(b) +
      a * Math.log(x) + b * Math.log(1 - x)
    )
    
    if (x < (a + 1) / (a + b + 2)) {
      return bt * this.betaCF(a, b, x) / a
    }
    return 1 - bt * this.betaCF(b, a, 1 - x) / b
  }
  
  private logGamma(x: number): number {
    const c = [
      76.18009172947146, -86.50532032941677, 24.01409824083091,
      -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5
    ]
    
    let y = x
    let tmp = x + 5.5
    tmp -= (x + 0.5) * Math.log(tmp)
    let ser = 1.000000000190015
    
    for (let j = 0; j < 6; j++) {
      ser += c[j] / ++y
    }
    
    return -tmp + Math.log(2.5066282746310005 * ser / x)
  }
  
  private betaCF(a: number, b: number, x: number): number {
    const maxIterations = 100
    const epsilon = 3e-7
    
    let qab = a + b
    let qap = a + 1
    let qam = a - 1
    let c = 1
    let d = 1 - qab * x / qap
    
    if (Math.abs(d) < 1e-30) d = 1e-30
    d = 1 / d
    let h = d
    
    for (let m = 1; m <= maxIterations; m++) {
      const m2 = 2 * m
      let aa = m * (b - m) * x / ((qam + m2) * (a + m2))
      
      d = 1 + aa * d
      if (Math.abs(d) < 1e-30) d = 1e-30
      c = 1 + aa / c
      if (Math.abs(c) < 1e-30) c = 1e-30
      d = 1 / d
      h *= d * c
      
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2))
      d = 1 + aa * d
      if (Math.abs(d) < 1e-30) d = 1e-30
      c = 1 + aa / c
      if (Math.abs(c) < 1e-30) c = 1e-30
      d = 1 / d
      const del = d * c
      h *= del
      
      if (Math.abs(del - 1) < epsilon) break
    }
    
    return h
  }
}

// 싱글톤 인스턴스 내보내기
export const ensembleForecastEngine = new EnsembleForecastEngine()
export const changepointDetector = new ChangepointDetector()
export const anomalyDetector = new AnomalyDetector()
export const correlationAnalyzer = new CorrelationAnalyzer()

