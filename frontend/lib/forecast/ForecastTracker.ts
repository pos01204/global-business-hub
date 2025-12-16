/**
 * ForecastTracker - 예측 추적 및 성능 관리
 * 예측 기록 저장, 실제 값 비교, 모델 성능 추적
 */

import { forecastMetrics, type ForecastAccuracyMetrics } from './ForecastMetrics'
import type { ForecastResult, ForecastRecord } from './types'

export interface TrackedForecast {
  id: string
  createdAt: string
  metric: string
  period: string
  model: string
  predictions: ForecastResult[]
  actualValues?: number[]
  evaluatedAt?: string
  metrics?: ForecastAccuracyMetrics
  status: 'pending' | 'partial' | 'complete' | 'expired'
}

export interface ModelPerformanceHistory {
  modelName: string
  evaluations: Array<{
    date: string
    metrics: ForecastAccuracyMetrics
    sampleSize: number
  }>
  averageMetrics: ForecastAccuracyMetrics
  trend: 'improving' | 'stable' | 'declining'
}

export interface ForecastTrackerConfig {
  maxRecords?: number
  expirationDays?: number
  storageKey?: string
}

const DEFAULT_CONFIG: ForecastTrackerConfig = {
  maxRecords: 100,
  expirationDays: 90,
  storageKey: 'business-brain-forecast-tracker',
}

export class ForecastTracker {
  private config: ForecastTrackerConfig
  private records: Map<string, TrackedForecast> = new Map()

  constructor(config: Partial<ForecastTrackerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.loadFromStorage()
  }

  /**
   * 새 예측 기록 저장
   */
  trackForecast(
    metric: string,
    period: string,
    model: string,
    predictions: ForecastResult[]
  ): string {
    const id = this.generateId()
    
    const record: TrackedForecast = {
      id,
      createdAt: new Date().toISOString(),
      metric,
      period,
      model,
      predictions,
      status: 'pending',
    }

    this.records.set(id, record)
    this.cleanupOldRecords()
    this.saveToStorage()

    return id
  }

  /**
   * 실제 값 업데이트
   */
  updateActualValues(id: string, actualValues: number[]): boolean {
    const record = this.records.get(id)
    if (!record) return false

    record.actualValues = actualValues
    
    // 예측과 실제 값 비교 가능한 경우 평가
    const predictedValues = record.predictions.map(p => p.predicted)
    const minLength = Math.min(predictedValues.length, actualValues.length)

    if (minLength > 0) {
      record.metrics = forecastMetrics.calculateAllMetrics(
        actualValues.slice(0, minLength),
        predictedValues.slice(0, minLength)
      )
      record.evaluatedAt = new Date().toISOString()
      record.status = minLength >= predictedValues.length ? 'complete' : 'partial'
    }

    this.saveToStorage()
    return true
  }

  /**
   * 특정 기록 조회
   */
  getRecord(id: string): TrackedForecast | undefined {
    return this.records.get(id)
  }

  /**
   * 모든 기록 조회
   */
  getAllRecords(): TrackedForecast[] {
    return Array.from(this.records.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  /**
   * 특정 지표의 기록 조회
   */
  getRecordsByMetric(metric: string): TrackedForecast[] {
    return this.getAllRecords().filter(r => r.metric === metric)
  }

  /**
   * 평가 완료된 기록만 조회
   */
  getEvaluatedRecords(): TrackedForecast[] {
    return this.getAllRecords().filter(r => r.status === 'complete' || r.status === 'partial')
  }

  /**
   * 모델별 성능 이력 조회
   */
  getModelPerformanceHistory(modelName: string): ModelPerformanceHistory | null {
    const records = this.getEvaluatedRecords().filter(r => r.model === modelName)
    
    if (records.length === 0) return null

    const evaluations = records
      .filter(r => r.metrics)
      .map(r => ({
        date: r.evaluatedAt!,
        metrics: r.metrics!,
        sampleSize: r.actualValues?.length || 0,
      }))

    // 평균 지표 계산
    const avgMetrics = this.calculateAverageMetrics(evaluations.map(e => e.metrics))

    // 트렌드 계산
    const trend = this.calculatePerformanceTrend(evaluations)

    return {
      modelName,
      evaluations,
      averageMetrics: avgMetrics,
      trend,
    }
  }

  /**
   * 전체 모델 성능 요약
   */
  getPerformanceSummary(): Array<{
    model: string
    recordCount: number
    avgMAPE: number
    avgR2: number
    trend: 'improving' | 'stable' | 'declining'
  }> {
    const models = new Set(this.getAllRecords().map(r => r.model))
    const summaries: Array<{
      model: string
      recordCount: number
      avgMAPE: number
      avgR2: number
      trend: 'improving' | 'stable' | 'declining'
    }> = []

    models.forEach(model => {
      const history = this.getModelPerformanceHistory(model)
      if (history) {
        summaries.push({
          model,
          recordCount: history.evaluations.length,
          avgMAPE: history.averageMetrics.mape,
          avgR2: history.averageMetrics.r2,
          trend: history.trend,
        })
      }
    })

    return summaries.sort((a, b) => a.avgMAPE - b.avgMAPE)
  }

  /**
   * 예측 정확도 리포트 생성
   */
  generateAccuracyReport(id: string): {
    record: TrackedForecast
    comparison: Array<{
      date: string
      predicted: number
      actual: number
      error: number
      percentError: number
    }>
    grade: { grade: string; description: string; recommendations: string[] }
  } | null {
    const record = this.records.get(id)
    if (!record || !record.actualValues || !record.metrics) return null

    const predictedValues = record.predictions.map(p => p.predicted)
    const dates = record.predictions.map(p => p.date)
    
    const comparison = forecastMetrics.compareForecasts(
      record.actualValues,
      predictedValues,
      dates
    )

    const grade = forecastMetrics.evaluatePerformanceGrade(record.metrics)

    return {
      record,
      comparison,
      grade,
    }
  }

  /**
   * 기록 삭제
   */
  deleteRecord(id: string): boolean {
    const deleted = this.records.delete(id)
    if (deleted) {
      this.saveToStorage()
    }
    return deleted
  }

  /**
   * 모든 기록 삭제
   */
  clearAllRecords(): void {
    this.records.clear()
    this.saveToStorage()
  }

  // Private methods

  private generateId(): string {
    return `forecast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private cleanupOldRecords(): void {
    const now = new Date()
    const expirationMs = this.config.expirationDays! * 24 * 60 * 60 * 1000

    // 만료된 기록 삭제
    this.records.forEach((record, id) => {
      const createdAt = new Date(record.createdAt)
      if (now.getTime() - createdAt.getTime() > expirationMs) {
        this.records.delete(id)
      }
    })

    // 최대 개수 초과 시 오래된 것부터 삭제
    if (this.records.size > this.config.maxRecords!) {
      const sorted = Array.from(this.records.entries())
        .sort((a, b) => new Date(b[1].createdAt).getTime() - new Date(a[1].createdAt).getTime())
      
      const toDelete = sorted.slice(this.config.maxRecords!)
      toDelete.forEach(([id]) => this.records.delete(id))
    }
  }

  private calculateAverageMetrics(metricsArray: ForecastAccuracyMetrics[]): ForecastAccuracyMetrics {
    if (metricsArray.length === 0) {
      return { mape: 0, rmse: 0, mae: 0, mse: 0, r2: 0, bias: 0, smape: 0, mase: 0 }
    }

    const sum = metricsArray.reduce((acc, m) => ({
      mape: acc.mape + m.mape,
      rmse: acc.rmse + m.rmse,
      mae: acc.mae + m.mae,
      mse: acc.mse + m.mse,
      r2: acc.r2 + m.r2,
      bias: acc.bias + m.bias,
      smape: acc.smape + m.smape,
      mase: acc.mase + m.mase,
    }), { mape: 0, rmse: 0, mae: 0, mse: 0, r2: 0, bias: 0, smape: 0, mase: 0 })

    const n = metricsArray.length
    return {
      mape: sum.mape / n,
      rmse: sum.rmse / n,
      mae: sum.mae / n,
      mse: sum.mse / n,
      r2: sum.r2 / n,
      bias: sum.bias / n,
      smape: sum.smape / n,
      mase: sum.mase / n,
    }
  }

  private calculatePerformanceTrend(
    evaluations: Array<{ date: string; metrics: ForecastAccuracyMetrics }>
  ): 'improving' | 'stable' | 'declining' {
    if (evaluations.length < 3) return 'stable'

    const sorted = [...evaluations].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    const recentMAPE = sorted.slice(-3).map(e => e.metrics.mape)
    const olderMAPE = sorted.slice(0, 3).map(e => e.metrics.mape)

    const recentAvg = recentMAPE.reduce((a, b) => a + b, 0) / recentMAPE.length
    const olderAvg = olderMAPE.reduce((a, b) => a + b, 0) / olderMAPE.length

    const change = (recentAvg - olderAvg) / olderAvg

    if (change < -0.1) return 'improving'
    if (change > 0.1) return 'declining'
    return 'stable'
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(this.config.storageKey!)
      if (stored) {
        const data = JSON.parse(stored)
        this.records = new Map(Object.entries(data))
      }
    } catch (e) {
      console.warn('Failed to load forecast tracker data:', e)
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const data = Object.fromEntries(this.records)
      localStorage.setItem(this.config.storageKey!, JSON.stringify(data))
    } catch (e) {
      console.warn('Failed to save forecast tracker data:', e)
    }
  }
}

// 싱글톤 인스턴스
export const forecastTracker = new ForecastTracker()

