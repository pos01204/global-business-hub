/**
 * N차원 큐브 분석기
 * 모든 차원 조합에 대해 자동으로 이상치를 탐지
 */

import {
  CubeConfig,
  CubeCell,
  CubeAnalysisResult,
  CubeDimension,
  CubeMetric,
} from './types'

// 기본 설정
const DEFAULT_CONFIG: Partial<CubeConfig> = {
  minSampleSize: 5,
  deviationThreshold: 0.3, // 30%
}

export class CubeAnalyzer {
  private config: CubeConfig

  constructor(config: Partial<CubeConfig>) {
    this.config = {
      dimensions: config.dimensions || [],
      metrics: config.metrics || [],
      minSampleSize: config.minSampleSize ?? DEFAULT_CONFIG.minSampleSize!,
      deviationThreshold: config.deviationThreshold ?? DEFAULT_CONFIG.deviationThreshold!,
    }
  }

  /**
   * 큐브 분석 실행
   */
  async analyze(data: any[]): Promise<CubeAnalysisResult> {
    const startTime = Date.now()

    if (!data || data.length === 0) {
      return this.emptyResult(startTime)
    }

    // 1. 차원별 고유값 추출
    const dimensionValues = this.extractDimensionValues(data)

    // 2. 전체 벤치마크 계산
    const overallBenchmark = this.calculateOverallBenchmark(data)

    // 3. 모든 조합 생성 및 분석
    const combinations = this.generateCombinations(dimensionValues)
    const cells = this.analyzeCells(data, combinations, overallBenchmark)

    // 4. 이상치 필터링
    const anomalies = cells.filter(cell => cell.isAnomaly)

    // 5. 상위/하위 정렬
    const sortedByDeviation = [...anomalies].sort(
      (a, b) => Math.abs(b.deviationPercent) - Math.abs(a.deviationPercent)
    )

    const topPositive = sortedByDeviation
      .filter(c => c.deviationPercent > 0)
      .slice(0, 10)

    const topNegative = sortedByDeviation
      .filter(c => c.deviationPercent < 0)
      .slice(0, 10)

    return {
      config: this.config,
      totalCombinations: combinations.length,
      analyzedCells: cells.length,
      cells,
      anomalies,
      topPositive,
      topNegative,
      executionTime: Date.now() - startTime,
    }
  }

  /**
   * 차원별 고유값 추출
   */
  private extractDimensionValues(data: any[]): Map<string, string[]> {
    const values = new Map<string, string[]>()

    for (const dim of this.config.dimensions) {
      if (dim.values && dim.values.length > 0) {
        // 미리 지정된 값 사용
        values.set(dim.name, dim.values)
      } else {
        // 데이터에서 추출
        const uniqueValues = new Set<string>()
        for (const row of data) {
          const val = row[dim.column]
          if (val !== null && val !== undefined && val !== '') {
            uniqueValues.add(String(val))
          }
        }
        values.set(dim.name, Array.from(uniqueValues))
      }
    }

    return values
  }

  /**
   * 전체 벤치마크 계산
   */
  private calculateOverallBenchmark(data: any[]): Record<string, number> {
    const benchmark: Record<string, number> = {}

    for (const metric of this.config.metrics) {
      benchmark[metric.name] = this.aggregate(data, metric)
    }

    return benchmark
  }

  /**
   * 모든 차원 조합 생성 (Cartesian Product)
   */
  private generateCombinations(
    dimensionValues: Map<string, string[]>
  ): Array<Record<string, string>> {
    const dimensions = this.config.dimensions.map(d => d.name)
    
    if (dimensions.length === 0) {
      return [{}]
    }

    let combinations: Array<Record<string, string>> = [{}]

    for (const dimName of dimensions) {
      const values = dimensionValues.get(dimName) || []
      const newCombinations: Array<Record<string, string>> = []

      for (const combo of combinations) {
        for (const value of values) {
          newCombinations.push({ ...combo, [dimName]: value })
        }
      }

      combinations = newCombinations
    }

    return combinations
  }

  /**
   * 각 셀 분석
   */
  private analyzeCells(
    data: any[],
    combinations: Array<Record<string, string>>,
    overallBenchmark: Record<string, number>
  ): CubeCell[] {
    const cells: CubeCell[] = []

    for (const combo of combinations) {
      // 해당 조합에 맞는 데이터 필터링
      const filteredData = this.filterData(data, combo)

      // 최소 표본 크기 확인
      if (filteredData.length < this.config.minSampleSize) {
        continue
      }

      // 메트릭 계산
      const metrics: Record<string, number> = {}
      for (const metric of this.config.metrics) {
        metrics[metric.name] = this.aggregate(filteredData, metric)
      }

      // 주요 메트릭 기준 편차 계산 (첫 번째 메트릭 사용)
      const primaryMetric = this.config.metrics[0]?.name
      const cellValue = metrics[primaryMetric] || 0
      const benchmarkValue = overallBenchmark[primaryMetric] || 1

      const deviation = cellValue - benchmarkValue
      const deviationPercent = benchmarkValue !== 0 
        ? (deviation / benchmarkValue) 
        : 0

      // 이상치 판정
      const isAnomaly = Math.abs(deviationPercent) > this.config.deviationThreshold

      // 인사이트 자동 생성
      const insights = this.generateCellInsights(
        combo,
        metrics,
        deviationPercent,
        benchmarkValue,
        cellValue,
        filteredData.length
      )
      
      cells.push({
        dimensions: combo,
        metrics,
        sampleSize: filteredData.length,
        benchmark: {
          overall: benchmarkValue,
        },
        deviation,
        deviationPercent,
        isAnomaly,
        anomalyType: isAnomaly 
          ? (deviationPercent > 0 ? 'positive' : 'negative')
          : undefined,
        insights, // v4.1: 인사이트 추가
      })
    }

    return cells
  }

  /**
   * 데이터 필터링
   */
  private filterData(
    data: any[],
    filters: Record<string, string>
  ): any[] {
    return data.filter(row => {
      for (const dim of this.config.dimensions) {
        const filterValue = filters[dim.name]
        if (filterValue !== undefined) {
          const rowValue = String(row[dim.column] || '')
          if (rowValue !== filterValue) {
            return false
          }
        }
      }
      return true
    })
  }

  /**
   * 집계 계산
   */
  private aggregate(data: any[], metric: CubeMetric): number {
    if (data.length === 0) return 0

    const values = data
      .map(row => Number(row[metric.column]))
      .filter(v => !isNaN(v))

    if (values.length === 0) return 0

    switch (metric.aggregation) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0)
      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length
      case 'count':
        return values.length
      case 'max':
        return Math.max(...values)
      case 'min':
        return Math.min(...values)
      default:
        return values.reduce((a, b) => a + b, 0)
    }
  }

  /**
   * 빈 결과 반환
   */
  private emptyResult(startTime: number): CubeAnalysisResult {
    return {
      config: this.config,
      totalCombinations: 0,
      analyzedCells: 0,
      cells: [],
      anomalies: [],
      topPositive: [],
      topNegative: [],
      executionTime: Date.now() - startTime,
    }
  }

  /**
   * 셀별 인사이트 자동 생성 (v4.1)
   */
  private generateCellInsights(
    dimensions: Record<string, string>,
    metrics: Record<string, number>,
    deviationPercent: number,
    benchmark: number,
    cellValue: number,
    sampleSize: number
  ): string[] {
    const insights: string[] = []
    
    // 차원 정보 수집
    const dimEntries = Object.entries(dimensions)
    const dimString = dimEntries.map(([key, val]) => `${key}: ${val}`).join(', ')
    
    // 주요 메트릭 이름
    const primaryMetric = this.config.metrics[0]?.name || 'value'
    
    // 편차 기반 인사이트
    if (Math.abs(deviationPercent) > 0.5) {
      // 50% 이상 편차
      if (deviationPercent > 0) {
        insights.push(
          `[${dimString}] ${primaryMetric}가 전체 평균 대비 ${Math.round(deviationPercent * 100)}% 높습니다. ` +
          `(${cellValue.toFixed(0)} vs ${benchmark.toFixed(0)})`
        )
        
        if (deviationPercent > 1.0) {
          insights.push(
            `이 조합은 상위 5% 성과를 보이고 있습니다. ` +
            `다른 차원과의 교차 분석을 통해 성공 요인을 파악할 수 있습니다.`
          )
        }
      } else {
        insights.push(
          `[${dimString}] ${primaryMetric}가 전체 평균 대비 ${Math.round(Math.abs(deviationPercent) * 100)}% 낮습니다. ` +
          `(${cellValue.toFixed(0)} vs ${benchmark.toFixed(0)})`
        )
        
        if (deviationPercent < -0.5) {
          insights.push(
            `이 조합의 성과 개선이 필요합니다. ` +
            `다른 차원과의 비교를 통해 개선 포인트를 식별할 수 있습니다.`
          )
        }
      }
    }
    
    // 표본 크기 기반 인사이트
    if (sampleSize < 10) {
      insights.push(
        `표본 크기가 작아(${sampleSize}건) 통계적 신뢰도가 낮을 수 있습니다. ` +
        `더 많은 데이터 수집이 필요합니다.`
      )
    } else if (sampleSize > 100) {
      insights.push(
        `충분한 표본 크기(${sampleSize}건)로 신뢰할 수 있는 분석 결과입니다.`
      )
    }
    
    // 다차원 교차 분석 제안
    if (dimEntries.length >= 2) {
      insights.push(
        `다차원 교차 분석: ${dimEntries.length}개 차원이 교차되어 있습니다. ` +
        `각 차원의 개별 기여도를 분석하면 더 깊은 인사이트를 얻을 수 있습니다.`
      )
    }
    
    return insights
  }

  /**
   * 특정 차원으로 드릴다운
   */
  async drillDown(
    data: any[],
    fixedDimensions: Record<string, string>,
    drillDimension: CubeDimension
  ): Promise<CubeAnalysisResult> {
    // 고정 차원으로 필터링
    const filteredData = this.filterData(data, fixedDimensions)

    // 드릴 차원만으로 새 분석기 생성
    const drillAnalyzer = new CubeAnalyzer({
      dimensions: [drillDimension],
      metrics: this.config.metrics,
      minSampleSize: this.config.minSampleSize,
      deviationThreshold: this.config.deviationThreshold,
    })

    return drillAnalyzer.analyze(filteredData)
  }
}
