/**
 * 상관관계 분석기
 * 데이터 간 자동 상관관계 발견 및 인사이트 생성
 */

export interface CorrelationResult {
  column1: string
  column2: string
  correlation: number // -1 ~ 1
  strength: 'strong' | 'moderate' | 'weak' | 'none'
  direction: 'positive' | 'negative' | 'none'
  insight?: string
}

export interface AnomalyResult {
  column: string
  value: any
  rowIndex: number
  type: 'outlier' | 'missing' | 'unusual_pattern'
  severity: 'high' | 'medium' | 'low'
  description: string
}

export interface TrendResult {
  column: string
  direction: 'increasing' | 'decreasing' | 'stable' | 'volatile'
  changeRate: number // 퍼센트
  confidence: number
}

export interface AnalysisInsight {
  type: 'correlation' | 'anomaly' | 'trend' | 'pattern'
  title: string
  description: string
  importance: 'high' | 'medium' | 'low'
  relatedColumns: string[]
  actionSuggestion?: string
}

export class CorrelationAnalyzer {
  /**
   * 전체 분석 실행
   */
  analyze(data: any[]): {
    correlations: CorrelationResult[]
    anomalies: AnomalyResult[]
    trends: TrendResult[]
    insights: AnalysisInsight[]
  } {
    if (!Array.isArray(data) || data.length < 2) {
      return { correlations: [], anomalies: [], trends: [], insights: [] }
    }

    const numericColumns = this.getNumericColumns(data)
    const dateColumn = this.getDateColumn(data)

    // 상관관계 분석
    const correlations = this.calculateCorrelations(data, numericColumns)

    // 이상치 탐지
    const anomalies = this.detectAnomalies(data, numericColumns)

    // 트렌드 분석
    const trends = dateColumn
      ? this.analyzeTrends(data, numericColumns, dateColumn)
      : []

    // 인사이트 생성
    const insights = this.generateInsights(correlations, anomalies, trends)

    return { correlations, anomalies, trends, insights }
  }

  /**
   * 숫자 컬럼 추출
   */
  private getNumericColumns(data: any[]): string[] {
    if (data.length === 0) return []

    const sampleRow = data[0]
    return Object.keys(sampleRow).filter((key) => {
      const values = data.slice(0, 10).map((row) => row[key])
      return values.every((v) => v === null || v === undefined || !isNaN(Number(v)))
    })
  }

  /**
   * 날짜 컬럼 추출
   */
  private getDateColumn(data: any[]): string | null {
    if (data.length === 0) return null

    const sampleRow = data[0]
    const dateKeywords = ['date', 'created', 'time', 'timestamp', '날짜', '일시']

    for (const key of Object.keys(sampleRow)) {
      const lowerKey = key.toLowerCase()
      if (dateKeywords.some((kw) => lowerKey.includes(kw))) {
        const value = sampleRow[key]
        if (value && !isNaN(Date.parse(String(value)))) {
          return key
        }
      }
    }

    return null
  }

  /**
   * 상관관계 계산 (피어슨)
   */
  private calculateCorrelations(data: any[], columns: string[]): CorrelationResult[] {
    const results: CorrelationResult[] = []

    for (let i = 0; i < columns.length; i++) {
      for (let j = i + 1; j < columns.length; j++) {
        const col1 = columns[i]
        const col2 = columns[j]

        const values1 = data.map((row) => Number(row[col1])).filter((v) => !isNaN(v))
        const values2 = data.map((row) => Number(row[col2])).filter((v) => !isNaN(v))

        if (values1.length < 3 || values2.length < 3) continue

        const correlation = this.pearsonCorrelation(values1, values2)
        const absCorr = Math.abs(correlation)

        let strength: CorrelationResult['strength'] = 'none'
        if (absCorr >= 0.7) strength = 'strong'
        else if (absCorr >= 0.4) strength = 'moderate'
        else if (absCorr >= 0.2) strength = 'weak'

        const direction: CorrelationResult['direction'] =
          correlation > 0.1 ? 'positive' : correlation < -0.1 ? 'negative' : 'none'

        // 의미 있는 상관관계만 포함
        if (strength !== 'none') {
          results.push({
            column1: col1,
            column2: col2,
            correlation: Math.round(correlation * 100) / 100,
            strength,
            direction,
            insight: this.generateCorrelationInsight(col1, col2, correlation, strength),
          })
        }
      }
    }

    return results.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
  }

  /**
   * 피어슨 상관계수 계산
   */
  private pearsonCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length)
    if (n < 2) return 0

    const meanX = x.reduce((a, b) => a + b, 0) / n
    const meanY = y.reduce((a, b) => a + b, 0) / n

    let numerator = 0
    let denomX = 0
    let denomY = 0

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX
      const dy = y[i] - meanY
      numerator += dx * dy
      denomX += dx * dx
      denomY += dy * dy
    }

    const denominator = Math.sqrt(denomX * denomY)
    return denominator === 0 ? 0 : numerator / denominator
  }

  /**
   * 이상치 탐지
   */
  private detectAnomalies(data: any[], columns: string[]): AnomalyResult[] {
    const anomalies: AnomalyResult[] = []

    for (const column of columns) {
      const values = data.map((row, idx) => ({ value: Number(row[column]), idx }))
        .filter((v) => !isNaN(v.value))

      if (values.length < 5) continue

      const numericValues = values.map((v) => v.value)
      const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length
      const std = Math.sqrt(
        numericValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / numericValues.length
      )

      // Z-score 기반 이상치 탐지
      for (const { value, idx } of values) {
        const zScore = std === 0 ? 0 : Math.abs((value - mean) / std)

        if (zScore > 3) {
          anomalies.push({
            column,
            value,
            rowIndex: idx,
            type: 'outlier',
            severity: zScore > 4 ? 'high' : 'medium',
            description: `${column}의 값 ${value}가 평균(${mean.toFixed(2)})에서 ${zScore.toFixed(1)} 표준편차 벗어남`,
          })
        }
      }
    }

    return anomalies.slice(0, 10) // 상위 10개만
  }

  /**
   * 트렌드 분석
   */
  private analyzeTrends(
    data: any[],
    columns: string[],
    dateColumn: string
  ): TrendResult[] {
    const results: TrendResult[] = []

    // 날짜순 정렬
    const sortedData = [...data].sort((a, b) => {
      const dateA = new Date(a[dateColumn])
      const dateB = new Date(b[dateColumn])
      return dateA.getTime() - dateB.getTime()
    })

    for (const column of columns) {
      const values = sortedData.map((row) => Number(row[column])).filter((v) => !isNaN(v))

      if (values.length < 3) continue

      // 선형 회귀로 트렌드 방향 계산
      const { slope, rSquared } = this.linearRegression(values)

      const firstHalf = values.slice(0, Math.floor(values.length / 2))
      const secondHalf = values.slice(Math.floor(values.length / 2))

      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

      const changeRate = firstAvg !== 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0

      // 변동성 계산
      const volatility = this.calculateVolatility(values)

      let direction: TrendResult['direction'] = 'stable'
      if (volatility > 0.3) {
        direction = 'volatile'
      } else if (slope > 0.01 && changeRate > 5) {
        direction = 'increasing'
      } else if (slope < -0.01 && changeRate < -5) {
        direction = 'decreasing'
      }

      results.push({
        column,
        direction,
        changeRate: Math.round(changeRate * 10) / 10,
        confidence: Math.round(rSquared * 100),
      })
    }

    return results
  }

  /**
   * 선형 회귀
   */
  private linearRegression(values: number[]): { slope: number; rSquared: number } {
    const n = values.length
    const x = Array.from({ length: n }, (_, i) => i)
    const y = values

    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // R² 계산
    const meanY = sumY / n
    const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0)
    const ssResidual = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept
      return sum + Math.pow(yi - predicted, 2)
    }, 0)

    const rSquared = ssTotal === 0 ? 0 : 1 - ssResidual / ssTotal

    return { slope, rSquared }
  }

  /**
   * 변동성 계산
   */
  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0

    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length

    return mean === 0 ? 0 : Math.sqrt(variance) / Math.abs(mean)
  }

  /**
   * 상관관계 인사이트 생성
   */
  private generateCorrelationInsight(
    col1: string,
    col2: string,
    correlation: number,
    strength: string
  ): string {
    const direction = correlation > 0 ? '양의' : '음의'
    return `${col1}과 ${col2} 사이에 ${strength === 'strong' ? '강한' : '중간 정도의'} ${direction} 상관관계가 있습니다.`
  }

  /**
   * 종합 인사이트 생성
   */
  private generateInsights(
    correlations: CorrelationResult[],
    anomalies: AnomalyResult[],
    trends: TrendResult[]
  ): AnalysisInsight[] {
    const insights: AnalysisInsight[] = []

    // 강한 상관관계 인사이트
    const strongCorrelations = correlations.filter((c) => c.strength === 'strong')
    if (strongCorrelations.length > 0) {
      const top = strongCorrelations[0]
      insights.push({
        type: 'correlation',
        title: '강한 상관관계 발견',
        description: top.insight || `${top.column1}과 ${top.column2}가 밀접하게 연관되어 있습니다.`,
        importance: 'high',
        relatedColumns: [top.column1, top.column2],
        actionSuggestion: '이 두 지표를 함께 모니터링하세요.',
      })
    }

    // 이상치 인사이트
    const highSeverityAnomalies = anomalies.filter((a) => a.severity === 'high')
    if (highSeverityAnomalies.length > 0) {
      insights.push({
        type: 'anomaly',
        title: '이상치 감지',
        description: `${highSeverityAnomalies.length}개의 비정상적인 데이터 포인트가 발견되었습니다.`,
        importance: 'high',
        relatedColumns: [...new Set(highSeverityAnomalies.map((a) => a.column))],
        actionSuggestion: '데이터 품질을 확인하거나 특이 상황을 조사하세요.',
      })
    }

    // 트렌드 인사이트
    const significantTrends = trends.filter(
      (t) => (t.direction === 'increasing' || t.direction === 'decreasing') && Math.abs(t.changeRate) > 10
    )
    for (const trend of significantTrends.slice(0, 2)) {
      insights.push({
        type: 'trend',
        title: `${trend.column} ${trend.direction === 'increasing' ? '상승' : '하락'} 추세`,
        description: `${trend.column}이(가) ${Math.abs(trend.changeRate).toFixed(1)}% ${trend.direction === 'increasing' ? '증가' : '감소'}했습니다.`,
        importance: Math.abs(trend.changeRate) > 20 ? 'high' : 'medium',
        relatedColumns: [trend.column],
        actionSuggestion:
          trend.direction === 'increasing'
            ? '성장 요인을 분석하고 유지 전략을 수립하세요.'
            : '하락 원인을 파악하고 개선 방안을 마련하세요.',
      })
    }

    return insights.sort((a, b) => {
      const importanceOrder = { high: 0, medium: 1, low: 2 }
      return importanceOrder[a.importance] - importanceOrder[b.importance]
    })
  }
}

export const correlationAnalyzer = new CorrelationAnalyzer()
