/**
 * NaturalLanguageProcessor - 자연어 응답 생성기
 * 분석 결과를 자연스러운 한국어로 변환
 */

import { QueryIntent, ParsedQuery } from './QueryParser'

// ==================== 응답 템플릿 ====================

const RESPONSE_TEMPLATES = {
  revenue_analysis: {
    summary: (data: any) => {
      const { totalGmv, orderCount, avgOrderValue, growthRate } = data
      const growthText = growthRate >= 0 ? `${growthRate.toFixed(1)}% 증가` : `${Math.abs(growthRate).toFixed(1)}% 감소`
      return `📊 **매출 분석 결과**\n\n` +
        `- 총 매출: **${formatCurrency(totalGmv)}**\n` +
        `- 주문 수: **${formatNumber(orderCount)}건**\n` +
        `- 평균 주문액: **${formatCurrency(avgOrderValue)}**\n` +
        `- 성장률: **${growthText}**`
    },
    trend: (data: any) => {
      const { trend, peakDay, lowDay } = data
      return `\n\n📈 **트렌드 분석**\n` +
        `- 전반적인 추세: ${trend === 'up' ? '상승' : trend === 'down' ? '하락' : '안정'}\n` +
        `- 최고 매출일: ${peakDay.date} (${formatCurrency(peakDay.value)})\n` +
        `- 최저 매출일: ${lowDay.date} (${formatCurrency(lowDay.value)})`
    },
  },
  customer_analysis: {
    rfm: (data: any) => {
      const { segments, totalCustomers } = data
      let result = `👥 **고객 세그먼트 분석 (RFM)**\n\n`
      result += `총 분석 고객: **${formatNumber(totalCustomers)}명**\n\n`
      
      for (const segment of segments) {
        result += `- **${segment.name}**: ${formatNumber(segment.count)}명 (${segment.percentage.toFixed(1)}%)\n`
      }
      return result
    },
    cohort: (data: any) => {
      const { retentionRates, avgRetention } = data
      return `📅 **코호트 분석**\n\n` +
        `- 평균 리텐션율: **${avgRetention.toFixed(1)}%**\n` +
        `- 1개월 리텐션: ${retentionRates.month1?.toFixed(1) || 'N/A'}%\n` +
        `- 3개월 리텐션: ${retentionRates.month3?.toFixed(1) || 'N/A'}%\n` +
        `- 6개월 리텐션: ${retentionRates.month6?.toFixed(1) || 'N/A'}%`
    },
  },
  anomaly_detection: {
    summary: (data: any) => {
      const { anomalies, totalChecked } = data
      const criticalCount = anomalies.filter((a: any) => a.severity === 'critical').length
      const warningCount = anomalies.filter((a: any) => a.severity === 'warning').length
      
      let result = `🔍 **이상치 탐지 결과**\n\n`
      result += `- 분석 데이터 포인트: ${formatNumber(totalChecked)}개\n`
      result += `- 발견된 이상치: ${anomalies.length}개\n`
      
      if (criticalCount > 0) {
        result += `  - ⚠️ 심각: ${criticalCount}개\n`
      }
      if (warningCount > 0) {
        result += `  - ⚡ 경고: ${warningCount}개\n`
      }
      
      if (anomalies.length > 0) {
        result += `\n**주요 이상치:**\n`
        for (const anomaly of anomalies.slice(0, 3)) {
          result += `- ${anomaly.date}: ${anomaly.metric} ${anomaly.deviation > 0 ? '급등' : '급락'} (${Math.abs(anomaly.deviation).toFixed(1)}σ)\n`
        }
      }
      
      return result
    },
  },
  forecast: {
    summary: (data: any) => {
      const { predictions, confidenceInterval, accuracy } = data
      const lastPrediction = predictions[predictions.length - 1]
      
      return `🔮 **예측 분석 결과**\n\n` +
        `- 예측 기간: ${predictions.length}일\n` +
        `- 예상 최종 값: **${formatCurrency(lastPrediction.value)}**\n` +
        `- 95% 신뢰 구간: ${formatCurrency(confidenceInterval.lower)} ~ ${formatCurrency(confidenceInterval.upper)}\n` +
        `- 모델 정확도 (MAPE): ${accuracy.toFixed(1)}%`
    },
  },
  comparison: {
    summary: (data: any) => {
      const { period1, period2, changes } = data
      
      let result = `⚖️ **기간 비교 분석**\n\n`
      result += `📅 ${period1.label} vs ${period2.label}\n\n`
      
      for (const change of changes) {
        const arrow = change.changePercent >= 0 ? '📈' : '📉'
        const sign = change.changePercent >= 0 ? '+' : ''
        result += `- ${change.metric}: ${arrow} ${sign}${change.changePercent.toFixed(1)}%\n`
        result += `  (${formatValue(change.value1, change.metric)} → ${formatValue(change.value2, change.metric)})\n`
      }
      
      return result
    },
  },
  pareto_analysis: {
    summary: (data: any) => {
      const { topContributors, concentration } = data
      
      let result = `📊 **파레토 분석 (80/20 법칙)**\n\n`
      result += `- 상위 ${concentration.topPercent}%가 전체의 ${concentration.revenuePercent.toFixed(1)}% 기여\n\n`
      result += `**상위 기여자:**\n`
      
      for (const item of topContributors.slice(0, 5)) {
        result += `- ${item.name}: ${formatCurrency(item.value)} (${item.percentage.toFixed(1)}%)\n`
      }
      
      return result
    },
  },
  health_check: {
    summary: (data: any) => {
      const { overallScore, dimensions } = data
      const scoreEmoji = overallScore >= 80 ? '🟢' : overallScore >= 60 ? '🟡' : '🔴'
      
      let result = `🏥 **비즈니스 건강도 점검**\n\n`
      result += `${scoreEmoji} 종합 점수: **${overallScore}/100**\n\n`
      result += `**차원별 점수:**\n`
      
      for (const dim of dimensions) {
        const emoji = dim.score >= 80 ? '✅' : dim.score >= 60 ? '⚠️' : '❌'
        result += `- ${emoji} ${dim.name}: ${dim.score}/100\n`
      }
      
      return result
    },
  },
  briefing: {
    summary: (data: any) => {
      const { highlights, concerns, opportunities } = data
      
      let result = `📋 **경영 브리핑**\n\n`
      
      result += `**🌟 주요 성과:**\n`
      for (const highlight of highlights) {
        result += `- ${highlight}\n`
      }
      
      result += `\n**⚠️ 주의 사항:**\n`
      for (const concern of concerns) {
        result += `- ${concern}\n`
      }
      
      result += `\n**💡 기회 요소:**\n`
      for (const opportunity of opportunities) {
        result += `- ${opportunity}\n`
      }
      
      return result
    },
  },
}

// ==================== 포맷팅 유틸리티 ====================

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`
  }
  return `$${value.toFixed(0)}`
}

function formatNumber(value: number): string {
  return value.toLocaleString('ko-KR')
}

function formatValue(value: number, metric: string): string {
  if (metric === 'gmv' || metric === 'revenue' || metric === 'aov') {
    return formatCurrency(value)
  }
  return formatNumber(value)
}

// ==================== NaturalLanguageProcessor 클래스 ====================

export class NaturalLanguageProcessor {
  /**
   * 분석 결과를 자연어 응답으로 변환
   */
  generateResponse(
    intent: QueryIntent,
    data: any,
    parsedQuery: ParsedQuery
  ): string {
    const template = RESPONSE_TEMPLATES[intent as keyof typeof RESPONSE_TEMPLATES]
    
    if (!template) {
      return this.generateGenericResponse(data, parsedQuery)
    }

    let response = ''

    // 메인 요약
    if ('summary' in template && typeof template.summary === 'function') {
      response += template.summary(data)
    }

    // 추가 섹션들
    for (const [key, generator] of Object.entries(template)) {
      if (key !== 'summary' && typeof generator === 'function' && data[key]) {
        response += '\n' + generator(data[key])
      }
    }

    // 액션 제안 추가
    response += this.generateActionSuggestions(intent, data)

    return response
  }

  /**
   * 일반적인 응답 생성
   */
  private generateGenericResponse(data: any, parsedQuery: ParsedQuery): string {
    return `📊 **분석 결과**\n\n` +
      `요청하신 "${parsedQuery.originalQuery}"에 대한 분석이 완료되었습니다.\n\n` +
      `자세한 내용은 대시보드에서 확인해 주세요.`
  }

  /**
   * 액션 제안 생성
   */
  private generateActionSuggestions(intent: QueryIntent, data: any): string {
    const suggestions: Record<QueryIntent, string[]> = {
      revenue_analysis: [
        '📈 트렌드 분석을 통해 성장 패턴을 확인해 보세요.',
        '🔍 세그먼트별 상세 분석을 진행해 보세요.',
      ],
      customer_analysis: [
        '🎯 이탈 위험 고객에 대한 리텐션 캠페인을 고려해 보세요.',
        '💎 VIP 고객 대상 특별 프로모션을 기획해 보세요.',
      ],
      trend_analysis: [
        '🔮 향후 예측 분석을 실행해 보세요.',
        '⚖️ 전년 동기 대비 비교 분석을 해 보세요.',
      ],
      anomaly_detection: [
        '🔬 이상치의 원인을 파악하기 위해 상세 분석을 진행하세요.',
        '📧 담당자에게 알림을 보내 조치를 취하세요.',
      ],
      forecast: [
        '📊 예측 정확도를 높이기 위해 더 많은 데이터를 활용해 보세요.',
        '🎯 목표 달성을 위한 액션 플랜을 수립하세요.',
      ],
      comparison: [
        '📈 성과가 좋았던 기간의 전략을 벤치마킹하세요.',
        '🔍 성과 차이의 원인을 심층 분석해 보세요.',
      ],
      pareto_analysis: [
        '🌟 상위 기여자에 대한 집중 관리 전략을 수립하세요.',
        '📈 하위 그룹의 성장 가능성을 분석해 보세요.',
      ],
      correlation_analysis: [
        '🔗 상관관계가 높은 변수들을 활용한 전략을 수립하세요.',
      ],
      simulation: [
        '🧪 다양한 시나리오를 추가로 테스트해 보세요.',
      ],
      health_check: [
        '🏥 점수가 낮은 영역에 대한 개선 계획을 수립하세요.',
      ],
      briefing: [
        '📅 정기적인 브리핑 일정을 설정하세요.',
      ],
      general: [],
    }

    const intentSuggestions = suggestions[intent] || []
    
    if (intentSuggestions.length === 0) {
      return ''
    }

    return `\n\n---\n💡 **추천 액션:**\n` + intentSuggestions.map(s => `- ${s}`).join('\n')
  }

  /**
   * 에러 응답 생성
   */
  generateErrorResponse(error: string, query: string): string {
    return `❌ **분석 중 오류가 발생했습니다**\n\n` +
      `요청: "${query}"\n` +
      `오류: ${error}\n\n` +
      `다시 시도하거나 질문을 다르게 표현해 주세요.`
  }

  /**
   * 도움말 응답 생성
   */
  generateHelpResponse(): string {
    return `🤖 **Business Brain 도움말**\n\n` +
      `저는 비즈니스 데이터 분석을 도와드리는 AI입니다.\n\n` +
      `**질문 예시:**\n` +
      `- "최근 30일 매출 분석해줘"\n` +
      `- "이번 달 고객 세그먼트 분석"\n` +
      `- "매출 이상치 탐지해줘"\n` +
      `- "다음 달 매출 예측"\n` +
      `- "전월 대비 성과 비교"\n` +
      `- "상위 작가 파레토 분석"\n` +
      `- "비즈니스 건강도 점검"\n\n` +
      `무엇이든 물어보세요! 📊`
  }
}

// 싱글톤 인스턴스
export const naturalLanguageProcessor = new NaturalLanguageProcessor()

