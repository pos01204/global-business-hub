/**
 * What-if 시뮬레이션 엔진
 * 시나리오 기반 예측 및 시뮬레이션
 */

import { DataProcessor } from './DataProcessor'
import { GoogleSheetsService } from '../googleSheetsService'
import { sheetsConfig } from '../../config/sheets'

export interface SimulationScenario {
  id: string
  name: string
  description: string
  variables: SimulationVariable[]
  assumptions: string[]
  timeline: string
}

export interface SimulationVariable {
  metric: string
  currentValue: number
  changeType: 'absolute' | 'percentage' | 'multiplier'
  changeValue: number
  description: string
}

export interface SimulationResult {
  scenario: SimulationScenario
  projectedMetrics: {
    gmv: number
    orders: number
    customers: number
    aov: number
    growth: number // %
  }
  confidence: number // 0-100
  assumptions: string[]
  risks: string[]
  recommendations: string[]
  comparison: {
    baseline: {
      gmv: number
      orders: number
      customers: number
    }
    projected: {
      gmv: number
      orders: number
      customers: number
    }
    change: {
      gmv: number // %
      orders: number // %
      customers: number // %
    }
  }
}

export class WhatIfSimulator {
  private sheetsService: GoogleSheetsService
  private dataProcessor: DataProcessor

  constructor() {
    this.sheetsService = new GoogleSheetsService(sheetsConfig)
    this.dataProcessor = new DataProcessor()
  }

  /**
   * 시나리오 시뮬레이션 실행
   */
  async simulate(
    scenario: SimulationScenario,
    period: { start: string; end: string }
  ): Promise<SimulationResult> {
    try {
      // 1. 기준선 데이터 로드
      const baselineData = await this.loadBaselineData(period)
      const baselineMetrics = this.calculateBaselineMetrics(baselineData)

      // 2. 변수 적용 및 예측
      const projectedMetrics = this.applyVariables(
        baselineMetrics,
        scenario.variables
      )

      // 3. 신뢰도 계산
      const confidence = this.calculateConfidence(
        scenario,
        baselineMetrics,
        projectedMetrics
      )

      // 4. 리스크 및 권장사항 생성
      const risks = this.identifyRisks(scenario, projectedMetrics)
      const recommendations = this.generateRecommendations(
        scenario,
        projectedMetrics
      )

      return {
        scenario,
        projectedMetrics,
        confidence,
        assumptions: scenario.assumptions,
        risks,
        recommendations,
        comparison: {
          baseline: {
            gmv: baselineMetrics.gmv,
            orders: baselineMetrics.orders,
            customers: baselineMetrics.customers,
          },
          projected: {
            gmv: projectedMetrics.gmv,
            orders: projectedMetrics.orders,
            customers: projectedMetrics.customers,
          },
          change: {
            gmv:
              baselineMetrics.gmv > 0
                ? ((projectedMetrics.gmv - baselineMetrics.gmv) /
                    baselineMetrics.gmv) *
                  100
                : 0,
            orders:
              baselineMetrics.orders > 0
                ? ((projectedMetrics.orders - baselineMetrics.orders) /
                    baselineMetrics.orders) *
                  100
                : 0,
            customers:
              baselineMetrics.customers > 0
                ? ((projectedMetrics.customers - baselineMetrics.customers) /
                    baselineMetrics.customers) *
                  100
                : 0,
          },
        },
      }
    } catch (error: any) {
      console.error('[WhatIfSimulator] 시뮬레이션 오류:', error)
      throw new Error(`시뮬레이션 실행 중 오류: ${error.message}`)
    }
  }

  /**
   * 여러 시나리오 비교
   */
  async compareScenarios(
    scenarios: SimulationScenario[],
    period: { start: string; end: string }
  ): Promise<SimulationResult[]> {
    const results = await Promise.all(
      scenarios.map((scenario) => this.simulate(scenario, period))
    )

    // 신뢰도 및 성장률 기준 정렬
    return results.sort((a, b) => {
      const scoreA = a.projectedMetrics.growth * (a.confidence / 100)
      const scoreB = b.projectedMetrics.growth * (b.confidence / 100)
      return scoreB - scoreA
    })
  }

  /**
   * 기준선 데이터 로드
   */
  private async loadBaselineData(period: {
    start: string
    end: string
  }): Promise<any[]> {
    const data = await this.sheetsService.getSheetDataAsJson('logistics', true)
    const startDate = new Date(period.start)
    const endDate = new Date(period.end)

    return data.filter((row: any) => {
      const orderDate = new Date(row.order_created)
      return orderDate >= startDate && orderDate <= endDate
    })
  }

  /**
   * 기준선 메트릭 계산
   */
  private calculateBaselineMetrics(data: any[]): {
    gmv: number
    orders: number
    customers: number
    aov: number
  } {
    const gmv = data.reduce(
      (sum, row) => sum + (Number(row['Total GMV']) || 0),
      0
    )
    const orders = data.length
    const uniqueCustomers = new Set(
      data.map((row) => row.user_id).filter(Boolean)
    ).size
    const aov = orders > 0 ? gmv / orders : 0

    return { gmv, orders, customers: uniqueCustomers, aov }
  }

  /**
   * 변수 적용 및 예측
   */
  private applyVariables(
    baseline: { gmv: number; orders: number; customers: number; aov: number },
    variables: SimulationVariable[]
  ): {
    gmv: number
    orders: number
    customers: number
    aov: number
    growth: number
  } {
    let projectedGmv = baseline.gmv
    let projectedOrders = baseline.orders
    let projectedCustomers = baseline.customers
    let projectedAov = baseline.aov

    // 변수별 적용
    for (const variable of variables) {
      const { metric, changeType, changeValue, currentValue } = variable

      let newValue: number
      if (changeType === 'absolute') {
        newValue = currentValue + changeValue
      } else if (changeType === 'percentage') {
        newValue = currentValue * (1 + changeValue / 100)
      } else {
        // multiplier
        newValue = currentValue * changeValue
      }

      // 메트릭별 영향 계산
      switch (metric) {
        case 'gmv':
          projectedGmv = newValue
          break
        case 'orders':
          projectedOrders = newValue
          if (baseline.orders > 0) {
            projectedAov = projectedGmv / projectedOrders
          }
          break
        case 'customers':
          projectedCustomers = newValue
          break
        case 'aov':
          projectedAov = newValue
          projectedGmv = projectedOrders * projectedAov
          break
        case 'conversion_rate':
          // 전환율 변화 → 주문 수 변화
          const conversionImpact = changeValue / 100
          projectedOrders = baseline.orders * (1 + conversionImpact)
          projectedGmv = projectedOrders * projectedAov
          break
        case 'retention_rate':
          // 리텐션율 변화 → 고객 수 변화
          const retentionImpact = changeValue / 100
          projectedCustomers = baseline.customers * (1 + retentionImpact)
          break
      }
    }

    const growth =
      baseline.gmv > 0
        ? ((projectedGmv - baseline.gmv) / baseline.gmv) * 100
        : 0

    return {
      gmv: Math.max(0, projectedGmv),
      orders: Math.max(0, Math.round(projectedOrders)),
      customers: Math.max(0, Math.round(projectedCustomers)),
      aov: Math.max(0, projectedAov),
      growth,
    }
  }

  /**
   * 신뢰도 계산
   */
  private calculateConfidence(
    scenario: SimulationScenario,
    baseline: { gmv: number; orders: number; customers: number; aov: number },
    projected: {
      gmv: number
      orders: number
      customers: number
      aov: number
      growth: number
    }
  ): number {
    let confidence = 70 // 기본 신뢰도

    // 1. 변수 개수에 따른 조정 (변수가 적을수록 신뢰도 높음)
    if (scenario.variables.length <= 2) {
      confidence += 10
    } else if (scenario.variables.length > 4) {
      confidence -= 10
    }

    // 2. 변화 폭에 따른 조정 (큰 변화는 불확실성 증가)
    const maxChange = Math.max(
      ...scenario.variables.map((v) => Math.abs(v.changeValue))
    )
    if (maxChange > 50) {
      confidence -= 15
    } else if (maxChange < 10) {
      confidence += 5
    }

    // 3. 데이터 품질 (기준선 데이터 양)
    const dataQuality = baseline.orders
    if (dataQuality > 1000) {
      confidence += 10
    } else if (dataQuality < 100) {
      confidence -= 10
    }

    // 4. 가정의 명확성
    if (scenario.assumptions.length > 0) {
      confidence += 5
    }

    return Math.max(0, Math.min(100, confidence))
  }

  /**
   * 리스크 식별
   */
  private identifyRisks(
    scenario: SimulationScenario,
    projected: {
      gmv: number
      orders: number
      customers: number
      aov: number
      growth: number
    }
  ): string[] {
    const risks: string[] = []

    // 1. 과도한 성장 가정
    if (projected.growth > 50) {
      risks.push('과도한 성장 가정으로 인한 리스크 존재')
    }

    // 2. 고객 수 감소
    if (projected.customers < 0) {
      risks.push('고객 수 감소 시나리오는 비현실적일 수 있음')
    }

    // 3. 변수 간 상충
    const hasConflictingVars = scenario.variables.some((v1, i) =>
      scenario.variables.slice(i + 1).some((v2) => {
        if (v1.metric === 'orders' && v2.metric === 'aov') {
          return false // 정상적인 관계
        }
        return v1.metric === v2.metric && v1.changeValue * v2.changeValue < 0
      })
    )
    if (hasConflictingVars) {
      risks.push('일부 변수 간 상충 가능성 존재')
    }

    // 4. 가정의 불확실성
    if (scenario.assumptions.length === 0) {
      risks.push('명시적 가정 부족으로 인한 불확실성')
    }

    return risks
  }

  /**
   * 권장사항 생성
   */
  private generateRecommendations(
    scenario: SimulationScenario,
    projected: {
      gmv: number
      orders: number
      customers: number
      aov: number
      growth: number
    }
  ): string[] {
    const recommendations: string[] = []

    // 1. 성장 기회
    if (projected.growth > 10) {
      recommendations.push(
        `예상 성장률 ${projected.growth.toFixed(1)}% 달성을 위한 실행 계획 수립 권장`
      )
    }

    // 2. 모니터링
    recommendations.push(
      '시뮬레이션 결과 달성을 위한 주간 모니터링 체계 구축 권장'
    )

    // 3. 단계적 실행
    if (scenario.variables.length > 2) {
      recommendations.push(
        '여러 변수 동시 변경보다 단계적 실행을 통한 검증 권장'
      )
    }

    // 4. 리스크 관리
    if (projected.growth < 0) {
      recommendations.push('부정적 시나리오에 대한 대응 계획 수립 권장')
    }

    return recommendations
  }

  /**
   * 사전 정의된 시나리오 템플릿
   */
  static getTemplateScenarios(): SimulationScenario[] {
    return [
      {
        id: 'template-1',
        name: 'AOV 10% 증가 시나리오',
        description: '객단가를 10% 증가시켰을 때의 영향',
        variables: [
          {
            metric: 'aov',
            currentValue: 0, // 실제 값으로 대체 필요
            changeType: 'percentage',
            changeValue: 10,
            description: '객단가 10% 증가',
          },
        ],
        assumptions: [
          '주문 수는 동일하게 유지됨',
          '고객 행동 변화 없음',
        ],
        timeline: '1-2개월',
      },
      {
        id: 'template-2',
        name: '신규 고객 20% 증가 시나리오',
        description: '신규 고객 유입을 20% 증가시켰을 때의 영향',
        variables: [
          {
            metric: 'customers',
            currentValue: 0, // 실제 값으로 대체 필요
            changeType: 'percentage',
            changeValue: 20,
            description: '신규 고객 20% 증가',
          },
        ],
        assumptions: [
          '기존 고객 행동은 동일',
          '신규 고객의 AOV는 평균과 동일',
        ],
        timeline: '2-3개월',
      },
      {
        id: 'template-3',
        name: '전환율 5%p 개선 시나리오',
        description: '전환율을 5%p 개선했을 때의 영향',
        variables: [
          {
            metric: 'conversion_rate',
            currentValue: 0, // 실제 값으로 대체 필요
            changeType: 'absolute',
            changeValue: 5,
            description: '전환율 5%p 개선',
          },
        ],
        assumptions: [
          '방문자 수는 동일',
          'AOV는 동일하게 유지',
        ],
        timeline: '1-2개월',
      },
    ]
  }
}

