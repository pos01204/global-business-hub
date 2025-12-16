/**
 * ForecastMetrics - 예측 성능 지표 계산
 * MAPE, RMSE, MAE 등 예측 정확도 측정
 */

export interface ForecastAccuracyMetrics {
  mape: number    // Mean Absolute Percentage Error
  rmse: number    // Root Mean Square Error
  mae: number     // Mean Absolute Error
  mse: number     // Mean Square Error
  r2: number      // R-squared (결정 계수)
  bias: number    // 평균 편향
  smape: number   // Symmetric MAPE
  mase: number    // Mean Absolute Scaled Error
}

export interface ForecastComparisonResult {
  date: string
  predicted: number
  actual: number
  error: number
  percentError: number
  absoluteError: number
}

export interface ModelPerformanceRecord {
  modelName: string
  period: string
  metrics: ForecastAccuracyMetrics
  sampleSize: number
  evaluatedAt: string
}

export class ForecastMetricsCalculator {
  /**
   * MAPE (Mean Absolute Percentage Error) 계산
   * 0에 가까울수록 좋음, 일반적으로 10% 미만이면 우수
   */
  calculateMAPE(actual: number[], predicted: number[]): number {
    const n = Math.min(actual.length, predicted.length)
    if (n === 0) return 0

    let sum = 0
    let validCount = 0

    for (let i = 0; i < n; i++) {
      if (actual[i] !== 0) {
        sum += Math.abs((actual[i] - predicted[i]) / actual[i])
        validCount++
      }
    }

    return validCount > 0 ? (sum / validCount) * 100 : 0
  }

  /**
   * SMAPE (Symmetric Mean Absolute Percentage Error) 계산
   * MAPE의 대칭 버전, 0-200% 범위
   */
  calculateSMAPE(actual: number[], predicted: number[]): number {
    const n = Math.min(actual.length, predicted.length)
    if (n === 0) return 0

    let sum = 0
    let validCount = 0

    for (let i = 0; i < n; i++) {
      const denominator = Math.abs(actual[i]) + Math.abs(predicted[i])
      if (denominator !== 0) {
        sum += Math.abs(actual[i] - predicted[i]) / denominator
        validCount++
      }
    }

    return validCount > 0 ? (sum / validCount) * 200 : 0
  }

  /**
   * RMSE (Root Mean Square Error) 계산
   * 큰 오차에 더 민감, 단위가 원래 데이터와 동일
   */
  calculateRMSE(actual: number[], predicted: number[]): number {
    const mse = this.calculateMSE(actual, predicted)
    return Math.sqrt(mse)
  }

  /**
   * MSE (Mean Square Error) 계산
   */
  calculateMSE(actual: number[], predicted: number[]): number {
    const n = Math.min(actual.length, predicted.length)
    if (n === 0) return 0

    let sum = 0
    for (let i = 0; i < n; i++) {
      sum += Math.pow(actual[i] - predicted[i], 2)
    }

    return sum / n
  }

  /**
   * MAE (Mean Absolute Error) 계산
   */
  calculateMAE(actual: number[], predicted: number[]): number {
    const n = Math.min(actual.length, predicted.length)
    if (n === 0) return 0

    let sum = 0
    for (let i = 0; i < n; i++) {
      sum += Math.abs(actual[i] - predicted[i])
    }

    return sum / n
  }

  /**
   * R² (결정 계수) 계산
   * 1에 가까울수록 좋음, 0이면 평균 예측과 동일
   */
  calculateR2(actual: number[], predicted: number[]): number {
    const n = Math.min(actual.length, predicted.length)
    if (n === 0) return 0

    const mean = actual.slice(0, n).reduce((a, b) => a + b, 0) / n
    
    let ssTotal = 0
    let ssResidual = 0

    for (let i = 0; i < n; i++) {
      ssTotal += Math.pow(actual[i] - mean, 2)
      ssResidual += Math.pow(actual[i] - predicted[i], 2)
    }

    return ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0
  }

  /**
   * 편향 (Bias) 계산
   * 양수면 과소 예측, 음수면 과대 예측 경향
   */
  calculateBias(actual: number[], predicted: number[]): number {
    const n = Math.min(actual.length, predicted.length)
    if (n === 0) return 0

    let sum = 0
    for (let i = 0; i < n; i++) {
      sum += predicted[i] - actual[i]
    }

    return sum / n
  }

  /**
   * MASE (Mean Absolute Scaled Error) 계산
   * 나이브 예측 대비 상대적 성능, 1 미만이면 나이브보다 우수
   */
  calculateMASE(actual: number[], predicted: number[]): number {
    const n = Math.min(actual.length, predicted.length)
    if (n < 2) return 0

    // 나이브 예측 MAE (전일 값 사용)
    let naiveMAE = 0
    for (let i = 1; i < actual.length; i++) {
      naiveMAE += Math.abs(actual[i] - actual[i - 1])
    }
    naiveMAE /= (actual.length - 1)

    if (naiveMAE === 0) return 0

    const mae = this.calculateMAE(actual, predicted)
    return mae / naiveMAE
  }

  /**
   * 모든 지표 계산
   */
  calculateAllMetrics(actual: number[], predicted: number[]): ForecastAccuracyMetrics {
    return {
      mape: this.calculateMAPE(actual, predicted),
      rmse: this.calculateRMSE(actual, predicted),
      mae: this.calculateMAE(actual, predicted),
      mse: this.calculateMSE(actual, predicted),
      r2: this.calculateR2(actual, predicted),
      bias: this.calculateBias(actual, predicted),
      smape: this.calculateSMAPE(actual, predicted),
      mase: this.calculateMASE(actual, predicted),
    }
  }

  /**
   * 예측 vs 실제 상세 비교
   */
  compareForecasts(
    actual: number[],
    predicted: number[],
    dates?: string[]
  ): ForecastComparisonResult[] {
    const n = Math.min(actual.length, predicted.length)
    const results: ForecastComparisonResult[] = []

    for (let i = 0; i < n; i++) {
      const error = predicted[i] - actual[i]
      const percentError = actual[i] !== 0 
        ? ((predicted[i] - actual[i]) / actual[i]) * 100 
        : 0

      results.push({
        date: dates?.[i] || `Day ${i + 1}`,
        predicted: predicted[i],
        actual: actual[i],
        error,
        percentError,
        absoluteError: Math.abs(error),
      })
    }

    return results
  }

  /**
   * 성능 등급 평가
   */
  evaluatePerformanceGrade(metrics: ForecastAccuracyMetrics): {
    grade: 'A' | 'B' | 'C' | 'D' | 'F'
    description: string
    recommendations: string[]
  } {
    const { mape, r2, mase } = metrics
    const recommendations: string[] = []

    // MAPE 기준 등급
    let grade: 'A' | 'B' | 'C' | 'D' | 'F'
    let description: string

    if (mape < 10 && r2 > 0.9) {
      grade = 'A'
      description = '매우 우수한 예측 성능'
    } else if (mape < 20 && r2 > 0.7) {
      grade = 'B'
      description = '양호한 예측 성능'
    } else if (mape < 30 && r2 > 0.5) {
      grade = 'C'
      description = '보통 수준의 예측 성능'
    } else if (mape < 50) {
      grade = 'D'
      description = '개선이 필요한 예측 성능'
    } else {
      grade = 'F'
      description = '예측 모델 재검토 필요'
    }

    // 권장사항 생성
    if (mape > 20) {
      recommendations.push('MAPE가 높습니다. 추가 특성 변수를 고려하세요.')
    }
    if (r2 < 0.5) {
      recommendations.push('R²가 낮습니다. 모델 복잡도를 높이거나 데이터를 검토하세요.')
    }
    if (mase > 1) {
      recommendations.push('나이브 예측보다 성능이 낮습니다. 모델 재검토가 필요합니다.')
    }
    if (Math.abs(metrics.bias) > metrics.mae * 0.3) {
      recommendations.push(`예측 편향이 있습니다 (${metrics.bias > 0 ? '과대' : '과소'} 예측 경향).`)
    }

    if (recommendations.length === 0) {
      recommendations.push('현재 예측 모델이 잘 작동하고 있습니다.')
    }

    return { grade, description, recommendations }
  }
}

// 싱글톤 인스턴스
export const forecastMetrics = new ForecastMetricsCalculator()

