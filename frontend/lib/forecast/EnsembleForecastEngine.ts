/**
 * EnsembleForecastEngine - 앙상블 예측 엔진
 * 다중 모델을 결합한 예측 시스템
 */

import { statisticsEngine } from '../statistics/StatisticsEngine'
import type { 
  ForecastModel, 
  ForecastResult, 
  EnsembleForecastResult,
  ConfidenceIntervalResult,
  ForecastMetrics 
} from './types'

export class EnsembleForecastEngine {
  private models: ForecastModel[]

  constructor() {
    this.models = [
      { name: 'SMA', weight: 0.15, predict: this.simpleMovingAverage.bind(this) },
      { name: 'EMA', weight: 0.20, predict: this.exponentialMovingAverage.bind(this) },
      { name: 'ETS', weight: 0.30, predict: this.exponentialSmoothing.bind(this) },
      { name: 'Linear', weight: 0.20, predict: this.linearTrend.bind(this) },
      { name: 'SeasonalNaive', weight: 0.15, predict: this.seasonalNaive.bind(this) },
    ]
  }

  /**
   * 앙상블 예측 수행
   */
  forecast(
    data: number[],
    periods: number = 30,
    dates?: string[]
  ): EnsembleForecastResult {
    if (data.length < 7) {
      throw new Error('예측을 위해 최소 7개의 데이터 포인트가 필요합니다.')
    }

    // 각 모델의 예측 실행
    const modelPredictions = this.models.map(model => ({
      name: model.name,
      weight: model.weight,
      predictions: model.predict(data, periods),
    }))

    // 가중 평균으로 앙상블 예측 계산
    const ensemblePredictions = this.weightedAverage(modelPredictions, periods)

    // 부트스트랩 신뢰 구간 계산
    const confidenceIntervals = this.bootstrapConfidenceInterval(data, periods, 500)

    // 미래 날짜 생성
    const futureDates = this.generateFutureDates(dates, periods)

    // 최종 예측 결과 생성
    const predictions: ForecastResult[] = ensemblePredictions.map((pred, i) => ({
      date: futureDates[i],
      predicted: pred,
      lower95: confidenceIntervals.lower95[i],
      upper95: confidenceIntervals.upper95[i],
      lower80: confidenceIntervals.lower80[i],
      upper80: confidenceIntervals.upper80[i],
    }))

    // 모델 간 일치도 계산
    const ensembleAgreement = this.calculateAgreement(modelPredictions)

    // 평균 불확실성 계산
    const averageUncertainty = this.calculateUncertainty(confidenceIntervals)

    return {
      predictions,
      modelContributions: modelPredictions,
      metrics: {
        ensembleAgreement,
        averageUncertainty,
      },
      confidence: ensembleAgreement * (1 - averageUncertainty),
    }
  }

  /**
   * 단순 이동평균 예측
   */
  private simpleMovingAverage(data: number[], periods: number): number[] {
    const window = Math.min(7, Math.floor(data.length / 2))
    const lastValues = data.slice(-window)
    const mean = lastValues.reduce((a, b) => a + b, 0) / lastValues.length
    
    // 약간의 추세 반영
    const trend = (data[data.length - 1] - data[data.length - window]) / window
    
    return Array.from({ length: periods }, (_, i) => 
      Math.max(0, mean + trend * (i + 1) * 0.3)
    )
  }

  /**
   * 지수 이동평균 예측
   */
  private exponentialMovingAverage(data: number[], periods: number): number[] {
    const alpha = 0.3 // 평활 계수
    const ema = statisticsEngine.exponentialMovingAverage(data, alpha)
    const lastEma = ema[ema.length - 1]
    
    // 추세 계산
    const trend = (ema[ema.length - 1] - ema[ema.length - 7]) / 7
    
    const predictions: number[] = []
    let current = lastEma
    
    for (let i = 0; i < periods; i++) {
      current = current + trend * 0.5
      predictions.push(Math.max(0, current))
    }
    
    return predictions
  }

  /**
   * 지수 평활법 (Holt's Linear)
   */
  private exponentialSmoothing(data: number[], periods: number): number[] {
    const alpha = 0.3 // 레벨 평활 계수
    const beta = 0.1 // 추세 평활 계수
    
    // 초기화
    let level = data[0]
    let trend = (data[Math.min(6, data.length - 1)] - data[0]) / Math.min(6, data.length - 1)
    
    // 학습
    for (let i = 1; i < data.length; i++) {
      const prevLevel = level
      level = alpha * data[i] + (1 - alpha) * (level + trend)
      trend = beta * (level - prevLevel) + (1 - beta) * trend
    }
    
    // 예측
    return Array.from({ length: periods }, (_, i) => 
      Math.max(0, level + (i + 1) * trend)
    )
  }

  /**
   * 선형 추세 예측
   */
  private linearTrend(data: number[], periods: number): number[] {
    const x = data.map((_, i) => i)
    const regression = statisticsEngine.linearRegression(x, data)
    
    return Array.from({ length: periods }, (_, i) => 
      Math.max(0, regression.slope * (data.length + i) + regression.intercept)
    )
  }

  /**
   * 계절성 나이브 예측
   */
  private seasonalNaive(data: number[], periods: number): number[] {
    const seasonLength = 7 // 주간 계절성 가정
    const predictions: number[] = []
    
    for (let i = 0; i < periods; i++) {
      const seasonalIndex = (data.length + i) % seasonLength
      const historicalValues: number[] = []
      
      // 같은 계절 인덱스의 과거 값들 수집
      for (let j = seasonalIndex; j < data.length; j += seasonLength) {
        historicalValues.push(data[j])
      }
      
      if (historicalValues.length > 0) {
        // 최근 값에 가중치 부여
        const weights = historicalValues.map((_, idx) => Math.pow(0.9, historicalValues.length - idx - 1))
        const weightSum = weights.reduce((a, b) => a + b, 0)
        const weighted = historicalValues.reduce((sum, val, idx) => sum + val * weights[idx], 0) / weightSum
        predictions.push(Math.max(0, weighted))
      } else {
        predictions.push(Math.max(0, data[data.length - 1]))
      }
    }
    
    return predictions
  }

  /**
   * 가중 평균 계산
   */
  private weightedAverage(
    modelPredictions: Array<{ name: string; weight: number; predictions: number[] }>,
    periods: number
  ): number[] {
    const totalWeight = modelPredictions.reduce((sum, m) => sum + m.weight, 0)
    
    return Array.from({ length: periods }, (_, i) =>
      modelPredictions.reduce(
        (sum, model) => sum + model.predictions[i] * model.weight,
        0
      ) / totalWeight
    )
  }

  /**
   * 부트스트랩 신뢰 구간 계산
   */
  private bootstrapConfidenceInterval(
    data: number[],
    periods: number,
    iterations: number = 500
  ): ConfidenceIntervalResult {
    const bootstrapPredictions: number[][] = Array.from({ length: periods }, () => [])
    
    for (let iter = 0; iter < iterations; iter++) {
      // 부트스트랩 샘플 생성
      const sample = this.generateBootstrapSample(data)
      
      // 단순 예측 (빠른 계산을 위해)
      const predictions = this.simpleMovingAverage(sample, periods)
      
      predictions.forEach((pred, i) => {
        bootstrapPredictions[i].push(pred)
      })
    }
    
    // 분위수 계산
    const lower95: number[] = []
    const upper95: number[] = []
    const lower80: number[] = []
    const upper80: number[] = []
    
    bootstrapPredictions.forEach(preds => {
      const sorted = [...preds].sort((a, b) => a - b)
      lower95.push(sorted[Math.floor(iterations * 0.025)])
      upper95.push(sorted[Math.floor(iterations * 0.975)])
      lower80.push(sorted[Math.floor(iterations * 0.1)])
      upper80.push(sorted[Math.floor(iterations * 0.9)])
    })
    
    return { lower95, upper95, lower80, upper80 }
  }

  /**
   * 부트스트랩 샘플 생성
   */
  private generateBootstrapSample(data: number[]): number[] {
    const n = data.length
    const sample: number[] = []
    
    // 블록 부트스트랩 (시계열 의존성 유지)
    const blockSize = Math.max(3, Math.floor(Math.sqrt(n)))
    
    while (sample.length < n) {
      const startIdx = Math.floor(Math.random() * (n - blockSize))
      for (let i = 0; i < blockSize && sample.length < n; i++) {
        sample.push(data[startIdx + i])
      }
    }
    
    return sample.slice(0, n)
  }

  /**
   * 모델 간 일치도 계산
   */
  private calculateAgreement(
    modelPredictions: Array<{ predictions: number[] }>
  ): number {
    if (modelPredictions.length < 2) return 1
    
    const periods = modelPredictions[0].predictions.length
    let totalCorrelation = 0
    let comparisons = 0
    
    for (let i = 0; i < modelPredictions.length; i++) {
      for (let j = i + 1; j < modelPredictions.length; j++) {
        const corr = statisticsEngine.correlation(
          modelPredictions[i].predictions,
          modelPredictions[j].predictions
        )
        if (!isNaN(corr)) {
          totalCorrelation += Math.abs(corr)
          comparisons++
        }
      }
    }
    
    return comparisons > 0 ? totalCorrelation / comparisons : 0.5
  }

  /**
   * 불확실성 계산
   */
  private calculateUncertainty(ci: ConfidenceIntervalResult): number {
    const ranges = ci.upper95.map((upper, i) => upper - ci.lower95[i])
    const avgRange = ranges.reduce((a, b) => a + b, 0) / ranges.length
    const avgValue = (ci.upper95.reduce((a, b) => a + b, 0) + ci.lower95.reduce((a, b) => a + b, 0)) / (2 * ci.upper95.length)
    
    // 상대적 불확실성 (0-1 범위로 정규화)
    return Math.min(avgRange / (avgValue * 2 + 1), 1)
  }

  /**
   * 미래 날짜 생성
   */
  private generateFutureDates(existingDates: string[] | undefined, periods: number): string[] {
    const lastDate = existingDates && existingDates.length > 0
      ? new Date(existingDates[existingDates.length - 1])
      : new Date()
    
    return Array.from({ length: periods }, (_, i) => {
      const date = new Date(lastDate)
      date.setDate(date.getDate() + i + 1)
      return date.toISOString().split('T')[0]
    })
  }

  /**
   * 예측 성능 평가
   */
  evaluatePerformance(actual: number[], predicted: number[]): ForecastMetrics {
    const n = Math.min(actual.length, predicted.length)
    if (n === 0) {
      return { mape: 0, rmse: 0, mae: 0, mse: 0, r2: 0, bias: 0 }
    }
    
    let sumAbsError = 0
    let sumSquaredError = 0
    let sumAbsPercentError = 0
    let sumError = 0
    
    for (let i = 0; i < n; i++) {
      const error = predicted[i] - actual[i]
      sumAbsError += Math.abs(error)
      sumSquaredError += error ** 2
      sumError += error
      if (actual[i] !== 0) {
        sumAbsPercentError += Math.abs(error / actual[i])
      }
    }
    
    const mae = sumAbsError / n
    const mse = sumSquaredError / n
    const rmse = Math.sqrt(mse)
    const mape = (sumAbsPercentError / n) * 100
    const bias = sumError / n
    
    // R² 계산
    const actualMean = actual.slice(0, n).reduce((a, b) => a + b, 0) / n
    const ssTotal = actual.slice(0, n).reduce((sum, val) => sum + (val - actualMean) ** 2, 0)
    const ssResidual = sumSquaredError
    const r2 = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0
    
    return { mape, rmse, mae, mse, r2, bias }
  }

  /**
   * 모델 가중치 업데이트 (성능 기반)
   */
  updateWeights(performances: Map<string, ForecastMetrics>): void {
    // MAPE 기반 가중치 계산 (낮을수록 좋음)
    const mapeScores: Map<string, number> = new Map()
    let totalInverseMape = 0
    
    this.models.forEach(model => {
      const perf = performances.get(model.name)
      if (perf && perf.mape > 0) {
        const inverseMape = 1 / (perf.mape + 1)
        mapeScores.set(model.name, inverseMape)
        totalInverseMape += inverseMape
      }
    })
    
    // 가중치 정규화
    if (totalInverseMape > 0) {
      this.models.forEach(model => {
        const score = mapeScores.get(model.name)
        if (score !== undefined) {
          model.weight = score / totalInverseMape
        }
      })
    }
  }
}

// 싱글톤 인스턴스
export const ensembleForecastEngine = new EnsembleForecastEngine()

