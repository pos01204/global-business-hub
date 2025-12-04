/**
 * AI Briefing Generator
 * PRD 섹션 7 - LLM 기반 경영 브리핑 생성
 * 
 * OpenAI API를 활용하여 데이터 기반 자연어 브리핑 생성
 */

import OpenAI from 'openai'
import { BusinessHealthScore, BusinessInsight } from './types'

// OpenAI 클라이언트 (환경변수에서 API 키 로드)
let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('[AIBriefingGenerator] OPENAI_API_KEY가 설정되지 않았습니다.')
    return null
  }
  
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiClient
}

// 브리핑 생성 결과 타입
export interface AIBriefing {
  summary: string
  immediateActions: string[]
  opportunities: string[]
  risks: string[]
  weeklyFocus: string[]
  confidence: number
  generatedAt: Date
  usedLLM: boolean
}

// 브리핑 생성을 위한 입력 데이터
export interface BriefingInput {
  period: { start: string; end: string }
  metrics: {
    totalGmv: number
    gmvChange: number
    orderCount: number
    orderChange: number
    aov: number
    aovChange: number
    newCustomers: number
    repeatRate: number
  }
  healthScore: BusinessHealthScore
  insights: BusinessInsight[]
  anomalies: Array<{ metric: string; description: string }>
  trends: Array<{ metric: string; direction: string; magnitude: number }>
  topCountry?: { name: string; share: number }
  topArtist?: { name: string; revenue: number }
}

/**
 * AI 브리핑 생성기 클래스
 */
export class AIBriefingGenerator {
  
  /**
   * Executive Summary 생성
   */
  async generateExecutiveBriefing(input: BriefingInput): Promise<AIBriefing> {
    const client = getOpenAIClient()
    
    // LLM 사용 불가 시 템플릿 기반 브리핑 생성
    if (!client) {
      return this.generateTemplateBriefing(input)
    }

    try {
      const prompt = this.buildExecutiveSummaryPrompt(input)
      
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '당신은 글로벌 이커머스 비즈니스의 경영 고문입니다. 데이터를 분석하여 경영진에게 명확하고 실행 가능한 인사이트를 제공합니다. 한국어로 응답하세요.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      })

      const content = response.choices[0]?.message?.content || ''
      
      // 응답 파싱
      return this.parseAIResponse(content, input)
    } catch (error: any) {
      console.error('[AIBriefingGenerator] LLM 호출 오류:', error.message)
      // 폴백: 템플릿 기반 브리핑
      return this.generateTemplateBriefing(input)
    }
  }

  /**
   * 인사이트 해석 생성
   */
  async interpretInsight(insight: BusinessInsight): Promise<string> {
    const client = getOpenAIClient()
    
    if (!client) {
      return this.generateTemplateInterpretation(insight)
    }

    try {
      const prompt = this.buildInsightInterpretationPrompt(insight)
      
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '당신은 데이터 분석 전문가입니다. 발견된 패턴을 비즈니스 관점에서 해석하고 실행 가능한 조언을 제공합니다. 한국어로 간결하게 응답하세요.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300,
      })

      return response.choices[0]?.message?.content || this.generateTemplateInterpretation(insight)
    } catch (error: any) {
      console.error('[AIBriefingGenerator] 인사이트 해석 오류:', error.message)
      return this.generateTemplateInterpretation(insight)
    }
  }

  /**
   * Executive Summary 프롬프트 생성 (PRD 섹션 7.1)
   */
  private buildExecutiveSummaryPrompt(input: BriefingInput): string {
    const { period, metrics, healthScore, insights, anomalies, trends, topCountry, topArtist } = input

    const criticalInsights = insights.filter(i => i.type === 'critical')
    const warningInsights = insights.filter(i => i.type === 'warning')
    const opportunityInsights = insights.filter(i => i.type === 'opportunity')

    return `
## 분석 기간
${period.start} ~ ${period.end}

## 핵심 지표
- 총 매출: $${metrics.totalGmv.toLocaleString()} (전기 대비 ${metrics.gmvChange >= 0 ? '+' : ''}${metrics.gmvChange.toFixed(1)}%)
- 주문 건수: ${metrics.orderCount.toLocaleString()}건 (전기 대비 ${metrics.orderChange >= 0 ? '+' : ''}${metrics.orderChange.toFixed(1)}%)
- AOV: $${metrics.aov.toFixed(0)} (전기 대비 ${metrics.aovChange >= 0 ? '+' : ''}${metrics.aovChange.toFixed(1)}%)
- 신규 고객: ${metrics.newCustomers.toLocaleString()}명
- 재구매율: ${metrics.repeatRate.toFixed(1)}%
${topCountry ? `- 주력 시장: ${topCountry.name} (${(topCountry.share * 100).toFixed(1)}%)` : ''}
${topArtist ? `- 최고 매출 작가: ${topArtist.name}` : ''}

## 건강도 점수
- 종합: ${healthScore.overall}/100
- 매출: ${healthScore.dimensions.revenue.score}/100 (${healthScore.dimensions.revenue.trend})
- 고객: ${healthScore.dimensions.customer.score}/100 (${healthScore.dimensions.customer.trend})
- 작가: ${healthScore.dimensions.artist.score}/100 (${healthScore.dimensions.artist.trend})
- 운영: ${healthScore.dimensions.operations.score}/100 (${healthScore.dimensions.operations.trend})

## 발견된 이슈
- 긴급 이슈: ${criticalInsights.length}개
- 주의 사항: ${warningInsights.length}개
- 기회 요인: ${opportunityInsights.length}개

${anomalies.length > 0 ? `## 이상 징후\n${anomalies.slice(0, 3).map(a => `- ${a.metric}: ${a.description}`).join('\n')}` : ''}

${trends.length > 0 ? `## 주요 트렌드\n${trends.slice(0, 3).map(t => `- ${t.metric}: ${t.direction} (${t.magnitude.toFixed(1)}%)`).join('\n')}` : ''}

## 작성 지침
1. 첫 문장에서 전체 비즈니스 상태를 한 줄로 요약
2. 가장 중요한 이슈 2-3개를 우선순위 순으로 언급
3. 즉시 조치가 필요한 항목은 🚨로 표시
4. 기회 요인은 💡로 표시
5. 주의 관찰 항목은 ⚠️로 표시
6. 구체적인 숫자와 비교 기준을 포함
7. 마지막에 이번 주 집중해야 할 3가지 제안

응답 형식:
[요약]
(한 문단의 종합 요약)

[즉시 조치]
- 항목1
- 항목2

[기회]
- 항목1
- 항목2

[리스크]
- 항목1
- 항목2

[이번 주 집중]
1. 첫 번째 집중 사항
2. 두 번째 집중 사항
3. 세 번째 집중 사항
`
  }

  /**
   * 인사이트 해석 프롬프트 생성 (PRD 섹션 7.2)
   */
  private buildInsightInterpretationPrompt(insight: BusinessInsight): string {
    return `
## 발견된 패턴
${insight.title}

## 상세 내용
${insight.description}

## 관련 데이터
- 현재 값: ${insight.currentValue.toLocaleString()}
- 비교 값: ${insight.comparisonValue.toLocaleString()}
- 편차: ${insight.deviationPercent.toFixed(1)}%
- 유형: ${insight.type}
- 카테고리: ${insight.category}

## 해석 요청
1. 이 패턴이 의미하는 바는 무엇인가?
2. 발생 가능한 원인은 무엇인가?
3. 비즈니스에 미치는 영향은?
4. 권장하는 대응 방안은?

간결하고 실행 가능한 형태로 3-4문장으로 답변하세요.
`
  }

  /**
   * AI 응답 파싱
   */
  private parseAIResponse(content: string, input: BriefingInput): AIBriefing {
    const sections = {
      summary: '',
      immediateActions: [] as string[],
      opportunities: [] as string[],
      risks: [] as string[],
      weeklyFocus: [] as string[],
    }

    // 섹션별 파싱
    const summaryMatch = content.match(/\[요약\]([\s\S]*?)(?=\[|$)/i)
    if (summaryMatch) {
      sections.summary = summaryMatch[1].trim()
    }

    const actionsMatch = content.match(/\[즉시 조치\]([\s\S]*?)(?=\[|$)/i)
    if (actionsMatch) {
      sections.immediateActions = this.parseListItems(actionsMatch[1])
    }

    const opportunitiesMatch = content.match(/\[기회\]([\s\S]*?)(?=\[|$)/i)
    if (opportunitiesMatch) {
      sections.opportunities = this.parseListItems(opportunitiesMatch[1])
    }

    const risksMatch = content.match(/\[리스크\]([\s\S]*?)(?=\[|$)/i)
    if (risksMatch) {
      sections.risks = this.parseListItems(risksMatch[1])
    }

    const focusMatch = content.match(/\[이번 주 집중\]([\s\S]*?)(?=\[|$)/i)
    if (focusMatch) {
      sections.weeklyFocus = this.parseListItems(focusMatch[1])
    }

    // 파싱 실패 시 전체 내용을 요약으로 사용
    if (!sections.summary) {
      sections.summary = content.slice(0, 500)
    }

    return {
      ...sections,
      confidence: 85,
      generatedAt: new Date(),
      usedLLM: true,
    }
  }

  /**
   * 리스트 항목 파싱
   */
  private parseListItems(text: string): string[] {
    return text
      .split('\n')
      .map(line => line.replace(/^[-•*\d.)\s]+/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, 5)
  }

  /**
   * 템플릿 기반 브리핑 생성 (LLM 폴백)
   */
  private generateTemplateBriefing(input: BriefingInput): AIBriefing {
    const { metrics, healthScore, insights, topCountry, topArtist } = input

    // 상태 판단
    const overallStatus = healthScore.overall >= 70 ? '양호' : healthScore.overall >= 50 ? '주의 필요' : '위험'
    const gmvTrend = metrics.gmvChange >= 0 ? '성장' : '감소'

    // 요약 생성
    let summary = `비즈니스 건강도 ${healthScore.overall}점으로 전반적으로 ${overallStatus}한 상태입니다. `
    summary += `최근 기간 매출 $${metrics.totalGmv.toLocaleString()}, 주문 ${metrics.orderCount.toLocaleString()}건을 기록했습니다. `
    
    if (metrics.gmvChange !== 0) {
      summary += `전기 대비 매출이 ${Math.abs(metrics.gmvChange).toFixed(1)}% ${gmvTrend}했습니다. `
    }

    if (topCountry) {
      summary += `${topCountry.name} 시장이 ${(topCountry.share * 100).toFixed(0)}%로 가장 큰 비중을 차지합니다. `
    }

    // 즉시 조치 항목
    const immediateActions: string[] = []
    const criticalInsights = insights.filter(i => i.type === 'critical')
    const warningInsights = insights.filter(i => i.type === 'warning')

    criticalInsights.slice(0, 2).forEach(i => {
      immediateActions.push(`🚨 ${i.title}: ${i.recommendation || i.description}`)
    })
    warningInsights.slice(0, 2).forEach(i => {
      immediateActions.push(`⚠️ ${i.title}`)
    })

    if (immediateActions.length === 0) {
      immediateActions.push('현재 긴급 조치가 필요한 항목이 없습니다.')
    }

    // 기회 항목
    const opportunities: string[] = []
    const opportunityInsights = insights.filter(i => i.type === 'opportunity')
    
    opportunityInsights.slice(0, 3).forEach(i => {
      opportunities.push(`💡 ${i.title}`)
    })

    if (metrics.gmvChange > 10) {
      opportunities.push('💡 매출 성장 모멘텀을 활용한 확장 전략 검토')
    }

    if (opportunities.length === 0) {
      opportunities.push('데이터 분석을 통해 새로운 성장 기회를 발굴하세요.')
    }

    // 리스크 항목
    const risks: string[] = []
    
    if (healthScore.dimensions.revenue.trend === 'down') {
      risks.push('매출 하락 추세 - 원인 분석 및 대응 필요')
    }
    if (healthScore.dimensions.customer.score < 50) {
      risks.push('고객 건강도 저하 - 리텐션 전략 점검 필요')
    }
    if (healthScore.dimensions.artist.score < 50) {
      risks.push('작가 포트폴리오 리스크 - 다각화 전략 필요')
    }

    criticalInsights.forEach(i => {
      risks.push(i.description)
    })

    if (risks.length === 0) {
      risks.push('현재 심각한 리스크가 감지되지 않았습니다.')
    }

    // 이번 주 집중 사항
    const weeklyFocus: string[] = []

    if (criticalInsights.length > 0) {
      weeklyFocus.push('긴급 이슈 해결 및 모니터링 강화')
    }
    if (healthScore.dimensions.customer.trend === 'down') {
      weeklyFocus.push('고객 리텐션 캠페인 실행')
    }
    if (opportunityInsights.length > 0) {
      weeklyFocus.push('성장 기회 활용을 위한 액션 플랜 수립')
    }
    
    weeklyFocus.push('주간 성과 리뷰 및 KPI 점검')

    return {
      summary,
      immediateActions: immediateActions.slice(0, 4),
      opportunities: opportunities.slice(0, 4),
      risks: risks.slice(0, 4),
      weeklyFocus: weeklyFocus.slice(0, 3),
      confidence: 70,
      generatedAt: new Date(),
      usedLLM: false,
    }
  }

  /**
   * 템플릿 기반 인사이트 해석 (LLM 폴백)
   */
  private generateTemplateInterpretation(insight: BusinessInsight): string {
    const direction = insight.deviationPercent > 0 ? '증가' : '감소'
    const magnitude = Math.abs(insight.deviationPercent).toFixed(1)

    let interpretation = `${insight.title}이(가) 감지되었습니다. `
    interpretation += `현재 값이 기준 대비 ${magnitude}% ${direction}했습니다. `

    switch (insight.category) {
      case 'revenue':
        interpretation += '매출에 직접적인 영향을 미치는 지표이므로 면밀한 모니터링이 필요합니다.'
        break
      case 'customer':
        interpretation += '고객 행동 변화를 나타내며, 리텐션 전략 점검을 권장합니다.'
        break
      case 'artist':
        interpretation += '작가 생태계의 변화를 나타내며, 포트폴리오 관리가 필요합니다.'
        break
      case 'operations':
        interpretation += '운영 효율성에 영향을 미치며, 프로세스 개선을 검토하세요.'
        break
      default:
        interpretation += '비즈니스 전반에 영향을 미칠 수 있으므로 추가 분석을 권장합니다.'
    }

    if (insight.recommendation) {
      interpretation += ` 권장 조치: ${insight.recommendation}`
    }

    return interpretation
  }
}

// 싱글톤 인스턴스
export const aiBriefingGenerator = new AIBriefingGenerator()

