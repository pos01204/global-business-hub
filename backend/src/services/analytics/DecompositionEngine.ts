/**
 * 매출 변화 분해 엔진
 * 변화의 원인을 다단계로 분해하여 설명
 */

import {
  DecompositionResult,
  SegmentContribution,
  Contributor,
} from './types'

interface DecompositionConfig {
  primaryMetric: string      // 분해할 메트릭 (예: 'Total GMV')
  volumeColumn?: string      // 볼륨 기준 (기본: 행 수)
  segments: Array<{
    name: string
    column: string
  }>
  identifierColumns?: {
    artist?: string
    product?: string
    customer?: string
    country?: string
  }
}

const DEFAULT_CONFIG: Partial<DecompositionConfig> = {
  identifierColumns: {
    artist: 'artist_name (kr)',
    product: 'product_id',
    customer: 'user_id',
    country: 'country',
  },
}

export class DecompositionEngine {
  private config: DecompositionConfig

  constructor(config: DecompositionConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    }
  }

  /**
   * 매출 변화 분해 실행
   */
  async decompose(
    currentData: any[],
    previousData: any[]
  ): Promise<DecompositionResult> {
    const currentTotal = this.sumMetric(currentData)
    const previousTotal = this.sumMetric(previousData)
    const totalChange = currentTotal - previousTotal
    const totalChangePercent = previousTotal > 0 
      ? totalChange / previousTotal 
      : (currentTotal > 0 ? 1 : 0)

    // Level 1: 볼륨 vs 가치 분해
    const volumeValueDecomp = this.decomposeVolumeValue(currentData, previousData)

    // Level 2: 세그먼트별 분해
    const segmentDecomp = this.decomposeBySegments(currentData, previousData)

    // Level 3: 상위 기여자 식별
    const topContributors = this.identifyTopContributors(currentData, previousData)

    // 자연어 설명 생성
    const explanation = this.generateExplanation(
      totalChange,
      totalChangePercent,
      volumeValueDecomp,
      segmentDecomp,
      topContributors
    )

    return {
      period: {
        current: this.extractDateRange(currentData),
        previous: this.extractDateRange(previousData),
      },
      totalChange,
      totalChangePercent,
      decomposition: {
        volumeEffect: volumeValueDecomp.volumeEffect,
        valueEffect: volumeValueDecomp.valueEffect,
        mixEffect: volumeValueDecomp.mixEffect,
        bySegment: segmentDecomp,
        topContributors,
      },
      explanation,
    }
  }

  /**
   * 볼륨 vs 가치 분해 (Laspeyres-Paasche 분해)
   */
  private decomposeVolumeValue(
    currentData: any[],
    previousData: any[]
  ): { volumeEffect: number; valueEffect: number; mixEffect: number } {
    const currVolume = currentData.length
    const prevVolume = previousData.length

    const currTotal = this.sumMetric(currentData)
    const prevTotal = this.sumMetric(previousData)

    const currAvgValue = currVolume > 0 ? currTotal / currVolume : 0
    const prevAvgValue = prevVolume > 0 ? prevTotal / prevVolume : 0

    // 볼륨 효과: (Q1 - Q0) * P0
    const volumeEffect = (currVolume - prevVolume) * prevAvgValue

    // 가치 효과: (P1 - P0) * Q0
    const valueEffect = (currAvgValue - prevAvgValue) * prevVolume

    // 혼합 효과: (Q1 - Q0) * (P1 - P0)
    const mixEffect = (currVolume - prevVolume) * (currAvgValue - prevAvgValue)

    return { volumeEffect, valueEffect, mixEffect }
  }

  /**
   * 세그먼트별 분해
   */
  private decomposeBySegments(
    currentData: any[],
    previousData: any[]
  ): SegmentContribution[] {
    const contributions: SegmentContribution[] = []

    for (const segment of this.config.segments) {
      const segmentContribs = this.decomposeBySegment(
        currentData,
        previousData,
        segment
      )
      contributions.push(...segmentContribs)
    }

    // 기여도 순 정렬
    return contributions.sort(
      (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)
    )
  }

  /**
   * 단일 세그먼트 분해
   */
  private decomposeBySegment(
    currentData: any[],
    previousData: any[],
    segment: { name: string; column: string }
  ): SegmentContribution[] {
    // 세그먼트별 그룹핑
    const currentGroups = this.groupBy(currentData, segment.column)
    const previousGroups = this.groupBy(previousData, segment.column)

    // 모든 세그먼트 값 수집
    const allValues = new Set([
      ...currentGroups.keys(),
      ...previousGroups.keys(),
    ])

    const contributions: SegmentContribution[] = []
    const totalChange = this.sumMetric(currentData) - this.sumMetric(previousData)

    for (const value of allValues) {
      const currData = currentGroups.get(value) || []
      const prevData = previousGroups.get(value) || []

      const currValue = this.sumMetric(currData)
      const prevValue = this.sumMetric(prevData)
      const contribution = currValue - prevValue

      if (Math.abs(contribution) < 0.01) continue // 무시할 수준

      // 주요 원인 판단
      const currVolume = currData.length
      const prevVolume = prevData.length
      const volumeChange = currVolume - prevVolume
      const avgValueChange = 
        (currVolume > 0 ? currValue / currVolume : 0) -
        (prevVolume > 0 ? prevValue / prevVolume : 0)

      let driver: 'volume' | 'value' | 'mix' = 'mix'
      if (Math.abs(volumeChange) > Math.abs(avgValueChange) * prevVolume) {
        driver = 'volume'
      } else if (Math.abs(avgValueChange) * prevVolume > Math.abs(volumeChange) * (prevVolume > 0 ? prevValue / prevVolume : 1)) {
        driver = 'value'
      }

      contributions.push({
        segment: segment.name,
        segmentValue: String(value),
        contribution,
        contributionPercent: totalChange !== 0 ? contribution / totalChange : 0,
        currentValue: currValue,
        previousValue: prevValue,
        driver,
      })
    }

    return contributions
  }

  /**
   * 상위 기여자 식별
   */
  private identifyTopContributors(
    currentData: any[],
    previousData: any[]
  ): Contributor[] {
    const contributors: Contributor[] = []
    const idColumns = this.config.identifierColumns || {}

    // 각 식별자 유형별로 분석
    for (const [type, column] of Object.entries(idColumns)) {
      if (!column) continue

      const currentGroups = this.groupBy(currentData, column)
      const previousGroups = this.groupBy(previousData, column)

      const allIds = new Set([
        ...currentGroups.keys(),
        ...previousGroups.keys(),
      ])

      const totalChange = this.sumMetric(currentData) - this.sumMetric(previousData)

      for (const id of allIds) {
        const currData = currentGroups.get(id) || []
        const prevData = previousGroups.get(id) || []

        const currValue = this.sumMetric(currData)
        const prevValue = this.sumMetric(prevData)
        const contribution = currValue - prevValue

        if (Math.abs(contribution) < 1) continue // 무시할 수준

        contributors.push({
          type: type as 'artist' | 'product' | 'customer' | 'country',
          name: String(id),
          contribution,
          contributionPercent: totalChange !== 0 ? contribution / totalChange : 0,
          isNew: prevData.length === 0 && currData.length > 0,
        })
      }
    }

    // 기여도 절대값 순 정렬, 상위 20개
    return contributors
      .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
      .slice(0, 20)
  }

  /**
   * 자연어 설명 생성
   */
  private generateExplanation(
    totalChange: number,
    totalChangePercent: number,
    volumeValue: { volumeEffect: number; valueEffect: number; mixEffect: number },
    segments: SegmentContribution[],
    contributors: Contributor[]
  ): string {
    const direction = totalChange >= 0 ? '증가' : '감소'
    const absChange = Math.abs(totalChange)
    const absPercent = Math.abs(totalChangePercent * 100).toFixed(1)

    const lines: string[] = []

    // 총 변화
    lines.push(`매출이 ${absPercent}% ${direction}했습니다 (${this.formatCurrency(absChange)}).`)

    // 볼륨 vs 가치
    const volumePercent = totalChange !== 0 
      ? Math.abs(volumeValue.volumeEffect / totalChange * 100).toFixed(0)
      : '0'
    const valuePercent = totalChange !== 0
      ? Math.abs(volumeValue.valueEffect / totalChange * 100).toFixed(0)
      : '0'

    if (Math.abs(volumeValue.volumeEffect) > Math.abs(volumeValue.valueEffect)) {
      lines.push(`주요 원인: 주문 수 변화 (${volumePercent}% 기여)`)
    } else {
      lines.push(`주요 원인: 객단가 변화 (${valuePercent}% 기여)`)
    }

    // 상위 세그먼트
    const topSegments = segments.slice(0, 3)
    if (topSegments.length > 0) {
      const segmentDesc = topSegments
        .map(s => `${s.segment}:${s.segmentValue} (${(s.contributionPercent * 100).toFixed(0)}%)`)
        .join(', ')
      lines.push(`주요 세그먼트: ${segmentDesc}`)
    }

    // 상위 기여자
    const topContribs = contributors.slice(0, 3)
    if (topContribs.length > 0) {
      const contribDesc = topContribs
        .map(c => `${c.name}${c.isNew ? '(신규)' : ''} (${(c.contributionPercent * 100).toFixed(0)}%)`)
        .join(', ')
      lines.push(`주요 기여자: ${contribDesc}`)
    }

    return lines.join(' ')
  }

  /**
   * 헬퍼: 메트릭 합계
   */
  private sumMetric(data: any[]): number {
    return data.reduce((sum, row) => {
      const value = Number(row[this.config.primaryMetric])
      return sum + (isNaN(value) ? 0 : value)
    }, 0)
  }

  /**
   * 헬퍼: 그룹핑
   */
  private groupBy(data: any[], column: string): Map<string, any[]> {
    const groups = new Map<string, any[]>()
    for (const row of data) {
      const key = String(row[column] || 'unknown')
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(row)
    }
    return groups
  }

  /**
   * 헬퍼: 날짜 범위 추출
   */
  private extractDateRange(data: any[]): { start: Date; end: Date } {
    if (data.length === 0) {
      const now = new Date()
      return { start: now, end: now }
    }

    const dates = data
      .map(row => new Date(row.order_created))
      .filter(d => !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())

    return {
      start: dates[0] || new Date(),
      end: dates[dates.length - 1] || new Date(),
    }
  }

  /**
   * 헬퍼: 통화 포맷
   */
  private formatCurrency(value: number): string {
    return `₩${Math.round(value).toLocaleString()}`
  }
}
