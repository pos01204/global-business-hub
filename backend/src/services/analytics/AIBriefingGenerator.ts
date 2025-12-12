/**
 * AI Briefing Generator
 * PRD 섹션 7 - LLM 기반 경영 브리핑 생성
 * 
 * OpenAI API를 활용하여 데이터 기반 자연어 브리핑 생성
 */

import OpenAI from 'openai'
import { BusinessHealthScore, BusinessInsight, EnhancedBriefingInput, BriefingInput } from './types'
import { CausalInferenceEngine, CausalAnalysis } from './CausalInferenceEngine'

// BriefingInput은 types.ts로 이동했으므로 여기서는 export 제거

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

// BriefingInput은 types.ts로 이동됨

/**
 * AI 브리핑 생성기 클래스
 */
export class AIBriefingGenerator {
  
  /**
   * Executive Summary 생성
   * v4.2: EnhancedBriefingInput 지원 추가
   */
  async generateExecutiveBriefing(
    input: BriefingInput | EnhancedBriefingInput
  ): Promise<AIBriefing> {
    const client = getOpenAIClient()
    
    // LLM 사용 불가 시 템플릿 기반 브리핑 생성
    if (!client) {
      return this.generateTemplateBriefing(input)
    }

    try {
      // EnhancedBriefingInput인지 확인
      const isEnhanced = 'businessContext' in input
      
      const prompt = isEnhanced
        ? this.buildEnhancedExecutiveSummaryPrompt(input as EnhancedBriefingInput)
        : this.buildExecutiveSummaryPrompt(input)
      
      const systemPrompt = isEnhanced
        ? this.buildSystemPrompt((input as EnhancedBriefingInput).businessContext)
        : '당신은 글로벌 이커머스 비즈니스의 경영 고문입니다. 데이터를 분석하여 경영진에게 명확하고 실행 가능한 인사이트를 제공합니다. 한국어로 응답하세요.'
      
      // v4.2: GPT-4o 모델 사용 (향상된 분석 품질)
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
      const useEnhancedModel = model === 'gpt-4o' || model === 'gpt-4-turbo-preview' || isEnhanced
      
      const response = await client.chat.completions.create({
        model: useEnhancedModel ? 'gpt-4o' : 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,  // v4.2: 더 일관된 결과
        max_tokens: 2500,  // v4.2: 더 상세한 브리핑
        top_p: 0.9,
        frequency_penalty: 0.3,
        presence_penalty: 0.3
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
   * 인과관계 분석을 통합한 인사이트 해석 (v4.2)
   */
  async interpretInsightWithCausality(
    insight: BusinessInsight,
    causalAnalysis?: CausalAnalysis
  ): Promise<string> {
    const client = getOpenAIClient()
    
    if (!client) {
      return this.generateTemplateInterpretation(insight)
    }

    const prompt = `
## 발견된 인사이트
- 제목: ${insight.title}
- 설명: ${insight.description}
- 유형: ${insight.type}
- 통계적 유의성: ${insight.scores?.statisticalSignificance || 'N/A'}/100

## 인과관계 분석 결과
${causalAnalysis ? `
- 주요 원인: ${causalAnalysis.mostLikelyCause ? `${causalAnalysis.mostLikelyCause.cause} (영향도: ${causalAnalysis.mostLikelyCause.estimatedImpact}%, 신뢰도: ${causalAnalysis.mostLikelyCause.confidence})` : 'N/A'}
- 잠재적 원인들:
${causalAnalysis.potentialCauses.map(c => `  - ${c.cause} (영향도: ${c.estimatedImpact}%, 신뢰도: ${c.confidence})`).join('\n')}
- 예상 효과: ${causalAnalysis.recommendations.map(r => r.expectedImpact).join(', ')}
` : '- 인과관계 분석 없음'}

## 작성 지침
1. 인사이트를 비즈니스 관점에서 해석
2. 인과관계 분석 결과를 바탕으로 근본 원인 설명
3. 구체적인 액션 제안 (누가, 무엇을, 언제까지)
4. 예상 효과를 정량적으로 제시

응답 형식:
[해석]
(인사이트의 의미와 비즈니스 영향)

[근본 원인]
- 원인1: [설명] (영향도: X%)
- 원인2: [설명] (영향도: Y%)

[권장 액션]
1. [액션1] (담당자: [이름], 일정: [날짜], 예상 효과: [정량적])
2. [액션2] (담당자: [이름], 일정: [날짜], 예상 효과: [정량적])

[모니터링 지표]
- [지표1]: [목표값] (현재: [현재값])
- [지표2]: [목표값] (현재: [현재값])
`

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: '당신은 데이터 분석 전문가이자 비즈니스 전략가입니다. 인사이트를 깊이 있게 해석하고 실행 가능한 조언을 제공합니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 500
      })

      return response.choices[0]?.message?.content || this.generateTemplateInterpretation(insight)
    } catch (error: any) {
      console.error('[AIBriefingGenerator] 인과관계 분석 통합 해석 오류:', error.message)
      return this.generateTemplateInterpretation(insight)
    }
  }

  /**
   * 시스템 프롬프트 생성 (v4.2)
   */
  private buildSystemPrompt(businessContext: EnhancedBriefingInput['businessContext']): string {
    return `당신은 아이디어스(idus) 글로벌 서비스의 경영 고문입니다.

## 비즈니스 배경
- 운영 기간: ${businessContext.businessAge}년
- 주요 시장: ${businessContext.marketFocus.join(', ')}
- 현재 목표: ${businessContext.businessGoals.join(', ')}
${Object.keys(businessContext.serviceLaunch).length > 0 ? `- 서비스 런칭: ${Object.entries(businessContext.serviceLaunch).map(([market, date]) => `${market}: ${date}`).join(', ')}` : ''}

## 역할
데이터를 깊이 있게 분석하여 경영진에게 명확하고 실행 가능한 인사이트를 제공합니다. 모든 주장은 데이터로 뒷받침되어야 하며, 통계적 유의성을 고려해야 합니다.

## 작성 원칙
1. 구체성: 숫자, 날짜, 담당자 등 구체적 정보 포함
2. 실행 가능성: 제안된 액션이 실제로 실행 가능해야 함
3. 데이터 기반: 모든 주장이 데이터로 뒷받침되어야 함
4. 통계적 엄밀성: 통계적으로 유의하지 않은 변화는 과대 해석하지 않음

한국어로 응답하세요.`
  }

  /**
   * 향상된 Executive Summary 프롬프트 생성 (v4.2)
   */
  private buildEnhancedExecutiveSummaryPrompt(input: EnhancedBriefingInput): string {
    const {
      period,
      metrics,
      healthScore,
      insights,
      anomalies,
      trends,
      topCountry,
      topArtist,
      businessContext,
      historicalContext,
      statisticalContext
    } = input

    const criticalInsights = insights.filter((i: BusinessInsight) => i.type === 'critical')
    const warningInsights = insights.filter((i: BusinessInsight) => i.type === 'warning')
    const opportunityInsights = insights.filter((i: BusinessInsight) => i.type === 'opportunity')
    const significantInsights = insights.filter((i: BusinessInsight) => 
      i.scores?.statisticalSignificance && i.scores.statisticalSignificance >= 70
    )

    // 1. 비즈니스 컨텍스트 섹션
    const businessContextSection = `
## 비즈니스 컨텍스트
- 운영 기간: ${businessContext.businessAge}년
- 주요 시장: ${businessContext.marketFocus.join(', ')}
- 현재 목표: ${businessContext.businessGoals.join(', ')}
${Object.keys(businessContext.serviceLaunch).length > 0 ? `- 일본 현지화 서비스: ${businessContext.serviceLaunch['JP'] ? `${businessContext.serviceLaunch['JP']} 런칭 (데이터 축적 중)` : 'N/A'}` : ''}
`

    // 2. 비교 분석 섹션
    let comparisonSection = `
## 비교 분석
### 전기 대비
- 매출: ${metrics.gmvChange >= 0 ? '+' : ''}${metrics.gmvChange.toFixed(1)}%
- 주문: ${metrics.orderChange >= 0 ? '+' : ''}${metrics.orderChange.toFixed(1)}%
`

    if (historicalContext?.yearOverYear) {
      const yoyGmvChange = ((metrics.totalGmv / historicalContext.yearOverYear.metrics.totalGmv - 1) * 100)
      const yoyOrderChange = ((metrics.orderCount / historicalContext.yearOverYear.metrics.orderCount - 1) * 100)
      comparisonSection += `
### 전년 동기 대비
- 매출: ${yoyGmvChange >= 0 ? '+' : ''}${yoyGmvChange.toFixed(1)}%
- 주문: ${yoyOrderChange >= 0 ? '+' : ''}${yoyOrderChange.toFixed(1)}%
`
    } else {
      comparisonSection += `
### 전년 동기 대비
- 전년 동기 데이터 없음 (신규 비즈니스)
`
    }

    if (historicalContext?.seasonalPatterns && historicalContext.seasonalPatterns.length > 0) {
      comparisonSection += `
### 계절성 고려
${historicalContext.seasonalPatterns.map(p => {
        const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
        return `- ${monthNames[p.month - 1]}: 평균 ${p.avgChange >= 0 ? '+' : ''}${p.avgChange.toFixed(1)}% 변화 (역사적 패턴)`
      }).join('\n')}
`
    }

    // 3. 통계적 유의성 섹션
    let statisticalSection = ''
    if (statisticalContext?.significanceTests && statisticalContext.significanceTests.length > 0) {
      statisticalSection = `
## 통계적 검증
${statisticalContext.significanceTests.map(test => `
- ${test.metric}: ${test.isSignificant ? '✅ 유의함' : '⚠️ 유의하지 않음'} (p=${test.pValue.toFixed(3)})
  - 효과 크기: ${test.effectSize.toFixed(3)} (${test.interpretation})
`).join('')}
`
    }

    if (statisticalContext?.dataQuality) {
      statisticalSection += `
### 데이터 신뢰도
- 데이터 품질 점수: ${statisticalContext.dataQuality.overall}/100
- 샘플 크기: ${statisticalContext.dataQuality.sampleSize}
- 결측치 비율: ${(statisticalContext.dataQuality.missingRate * 100).toFixed(1)}%
- 완전성: ${(statisticalContext.dataQuality.completeness * 100).toFixed(1)}%
- 정확도: ${(statisticalContext.dataQuality.accuracy * 100).toFixed(1)}%
`
    }

    // 4. 강화된 작성 지침
    const enhancedGuidelines = `
## 작성 지침 (엄격히 준수)

### 1. 요약 작성 원칙
- 첫 문장: 비즈니스 전체 상태를 한 줄로 요약 (숫자 포함)
- 두 번째 문단: 가장 중요한 변화 1개를 구체적으로 설명
- 세 번째 문단: 통계적으로 유의한 인사이트 1-2개 언급

### 2. 즉시 조치 항목 작성
- 🚨 표시는 통계적으로 유의하고 즉시 대응이 필요한 항목만
- 각 항목은 다음 형식:
  "[문제] → [원인 분석] → [구체적 액션] → [예상 효과]"
- 예시: "일본 시장 매출 20% 감소 (p<0.05) → A작가 신작 지연 영향 → 작가 연락 및 프로모션 준비 → 예상 회복: +15%"

### 3. 기회 항목 작성
- 💡 표시는 데이터로 뒷받침되는 성장 기회만
- 각 항목은 다음 형식:
  "[기회] → [근거] → [실행 방안] → [예상 효과]"
- 예시: "신규 유저 유입 증가 (+30%) → 재구매율 낮음 (15%) → 재구매 촉진 캠페인 → 예상 효과: 재구매율 +10%p"

### 4. 리스크 항목 작성
- ⚠️ 표시는 통계적으로 유의하거나 추세가 명확한 위험만
- 각 항목은 다음 형식:
  "[리스크] → [근거] → [모니터링 지표] → [대응 계획]"
- 예시: "고객 이탈 위험 증가 → 6개월 미구매 고객 +15% → 주간 이탈률 모니터링 → 이탈 예방 캠페인 준비"

### 5. 이번 주 집중 사항
- 우선순위 1: 가장 긴급하고 효과가 큰 항목
- 우선순위 2: 중기 전략적 중요 항목
- 우선순위 3: 모니터링 및 데이터 수집 항목
- 각 항목은 구체적인 액션과 담당자/일정 포함

### 6. 금지 사항
- ❌ 일반적이고 추상적인 표현 ("성장 전략 수립", "고객 만족도 향상")
- ❌ 데이터로 뒷받침되지 않는 추측
- ❌ 통계적으로 유의하지 않은 변화를 과대 해석
- ❌ 실행 불가능한 제안

### 7. 필수 포함 사항
- ✅ 모든 숫자는 비교 기준 명시 (전기 대비, 전년 동기 대비)
- ✅ 통계적 유의성 언급 (p-value 또는 신뢰구간)
- ✅ 데이터 신뢰도 표시 (샘플 크기, 데이터 품질)
- ✅ 구체적인 액션 아이템 (누가, 무엇을, 언제까지)
`

    return `
${businessContextSection}
${comparisonSection}
${statisticalSection}

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
- 통계적으로 유의한 인사이트: ${significantInsights.length}개

${anomalies.length > 0 ? `## 이상 징후\n${anomalies.slice(0, 3).map((a: { metric: string; description: string }) => `- ${a.metric}: ${a.description}`).join('\n')}` : ''}

${trends.length > 0 ? `## 주요 트렌드\n${trends.slice(0, 3).map((t: { metric: string; direction: string; magnitude: number }) => `- ${t.metric}: ${t.direction} (${t.magnitude > 0 ? '+' : ''}${t.magnitude.toFixed(1)}%)`).join('\n')}` : ''}

${enhancedGuidelines}

${this.getFewShotExamples()}

응답 형식 (엄격히 준수):
[요약]
(3문단: 전체 상태 → 주요 변화 → 통계적 인사이트)

[즉시 조치]
🚨 항목1: [문제] → [원인] → [액션] → [효과]
🚨 항목2: [문제] → [원인] → [액션] → [효과]

[기회]
💡 항목1: [기회] → [근거] → [방안] → [효과]
💡 항목2: [기회] → [근거] → [방안] → [효과]

[리스크]
⚠️ 항목1: [리스크] → [근거] → [모니터링] → [대응]
⚠️ 항목2: [리스크] → [근거] → [모니터링] → [대응]

[이번 주 집중]
1. [우선순위 1]: [구체적 액션] (담당자: [이름], 일정: [날짜])
2. [우선순위 2]: [구체적 액션] (담당자: [이름], 일정: [날짜])
3. [우선순위 3]: [구체적 액션] (담당자: [이름], 일정: [날짜])
`
  }

  /**
   * Executive Summary 프롬프트 생성 (PRD 섹션 7.1) - v4.1 고도화
   */
  private buildExecutiveSummaryPrompt(input: BriefingInput): string {
    const { period, metrics, healthScore, insights, anomalies, trends, topCountry, topArtist } = input

    const criticalInsights = insights.filter((i: BusinessInsight) => i.type === 'critical')
    const warningInsights = insights.filter((i: BusinessInsight) => i.type === 'warning')
    const opportunityInsights = insights.filter((i: BusinessInsight) => i.type === 'opportunity')

    // v4.1: 통계적 유의성 정보 포함
    const significantInsights = insights.filter((i: BusinessInsight) => 
      i.scores?.statisticalSignificance && i.scores.statisticalSignificance >= 70
    )

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

## 발견된 이슈 (통계적 검증 포함)
- 긴급 이슈: ${criticalInsights.length}개 (통계적으로 유의한 항목: ${criticalInsights.filter((i: BusinessInsight) => i.scores?.statisticalSignificance && i.scores.statisticalSignificance >= 70).length}개)
- 주의 사항: ${warningInsights.length}개
- 기회 요인: ${opportunityInsights.length}개
- 통계적으로 유의한 인사이트: ${significantInsights.length}개

${anomalies.length > 0 ? `## 이상 징후\n${anomalies.slice(0, 3).map((a: { metric: string; description: string }) => `- ${a.metric}: ${a.description}`).join('\n')}` : ''}

${trends.length > 0 ? `## 주요 트렌드\n${trends.slice(0, 3).map((t: { metric: string; direction: string; magnitude: number }) => `- ${t.metric}: ${t.direction} (${t.magnitude > 0 ? '+' : ''}${t.magnitude.toFixed(1)}%)`).join('\n')}` : ''}

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

## 해석 요청 (v4.1 개선)
1. 이 패턴이 의미하는 바는 무엇인가? (통계적 유의성 고려)
2. 발생 가능한 원인은 무엇인가? (인과관계 vs 상관관계 구분)
3. 비즈니스에 미치는 영향은? (구체적인 수치와 예상 효과 포함)
4. 권장하는 대응 방안은? (우선순위와 예상 효과 포함)

간결하고 실행 가능한 형태로 3-4문장으로 답변하세요. 통계적으로 유의한 인사이트는 이를 명시하세요.
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
   * Few-shot 예시 추가 (v4.2)
   */
  private getFewShotExamples(): string {
    return `
## 예시 1: 긍정적 변화
[요약]
비즈니스 건강도 75점으로 양호한 상태입니다. 최근 30일간 매출 $150,000, 주문 1,200건을 기록했으며, 전기 대비 매출이 +15.3% 증가했습니다 (p<0.01, 통계적으로 유의함). 신규 유저 유입이 +30% 증가했으나 재구매율은 15%로 낮아 개선 기회가 있습니다.

[즉시 조치]
🚨 재구매율 개선 필요: 현재 15% (업계 평균 25%) → 신규 유저 유입 증가했으나 재구매 전환 부족 → 재구매 촉진 캠페인 실행 (쿠폰 발급, 이메일 마케팅) → 예상 효과: 재구매율 +10%p, 매출 +$20,000

[기회]
💡 신규 유저 품질 향상: 신규 유저 유입 +30% (통계적으로 유의, p<0.05) → 첫 구매 평균 금액 $45 (전기 $38 대비 +18%) → 신규 유저 타겟 프로모션 확대 → 예상 효과: 신규 유저 LTV +20%

[이번 주 집중]
1. 재구매 촉진 캠페인 실행 (담당자: 마케팅팀, 일정: 이번 주 금요일까지)
2. 신규 유저 온보딩 프로세스 개선 (담당자: CX팀, 일정: 다음 주 월요일까지)
3. 주간 재구매율 모니터링 (담당자: 데이터팀, 일정: 매일)

---

## 예시 2: 부정적 변화
[요약]
비즈니스 건강도 58점으로 주의가 필요한 상태입니다. 최근 30일간 매출 $120,000, 주문 950건을 기록했으며, 전기 대비 매출이 -12.5% 감소했습니다 (p<0.05, 통계적으로 유의함). 일본 시장 매출이 -20% 감소한 것이 주요 원인으로 분석됩니다.

[즉시 조치]
🚨 일본 시장 매출 급감: -20% (p<0.05) → A작가 신작 출시 지연 및 B작가 재고 부족 → 작가 연락 및 재고 확보, 프로모션 준비 → 예상 효과: 다음 주 +15% 회복

[리스크]
⚠️ 고객 이탈 위험: 6개월 미구매 고객 +15% (추세 지속) → 주간 이탈률 모니터링 강화 → 이탈 예방 캠페인 준비 (다음 주 실행)

[이번 주 집중]
1. 일본 시장 매출 회복 조치 (담당자: 운영팀, 일정: 이번 주 수요일까지)
2. 작가 재고 현황 점검 (담당자: 물류팀, 일정: 이번 주 목요일까지)
3. 고객 이탈률 모니터링 (담당자: 데이터팀, 일정: 매일)
`
  }

  /**
   * 템플릿 기반 브리핑 생성 (LLM 폴백)
   */
  private generateTemplateBriefing(input: BriefingInput | EnhancedBriefingInput): AIBriefing {
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
    const criticalInsights = insights.filter((i: BusinessInsight) => i.type === 'critical')
    const warningInsights = insights.filter((i: BusinessInsight) => i.type === 'warning')

    criticalInsights.slice(0, 2).forEach((i: BusinessInsight) => {
      immediateActions.push(`🚨 ${i.title}: ${i.recommendation || i.description}`)
    })
    warningInsights.slice(0, 2).forEach((i: BusinessInsight) => {
      immediateActions.push(`⚠️ ${i.title}`)
    })

    if (immediateActions.length === 0) {
      immediateActions.push('현재 긴급 조치가 필요한 항목이 없습니다.')
    }

    // 기회 항목
    const opportunities: string[] = []
    const opportunityInsights = insights.filter((i: BusinessInsight) => i.type === 'opportunity')
    
    opportunityInsights.slice(0, 3).forEach((i: BusinessInsight) => {
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

    criticalInsights.forEach((i: BusinessInsight) => {
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
   * 브리핑 품질 검증 (v4.2)
   */
  async validateBriefingQuality(briefing: AIBriefing): Promise<{
    specificity: number
    actionability: number
    dataBacking: number
    overall: number
    issues: string[]
  }> {
    const client = getOpenAIClient()
    
    if (!client) {
      return {
        specificity: 50,
        actionability: 50,
        dataBacking: 50,
        overall: 50,
        issues: ['LLM 사용 불가']
      }
    }

    const prompt = `
다음 브리핑의 품질을 평가하세요:

${JSON.stringify(briefing, null, 2)}

평가 기준:
1. 구체성: 숫자, 날짜, 담당자 등 구체적 정보 포함 여부
2. 실행 가능성: 제안된 액션이 실제로 실행 가능한지
3. 데이터 기반: 모든 주장이 데이터로 뒷받침되는지

각 항목을 0-100점으로 평가하고, 개선 필요 사항을 제시하세요.

응답 형식 (JSON):
{
  "specificity": 85,
  "actionability": 90,
  "dataBacking": 80,
  "overall": 85,
  "issues": ["일부 액션에 담당자 정보 부족", "예상 효과 정량화 부족"]
}
`

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: '당신은 문서 품질 평가 전문가입니다. 객관적이고 구체적인 평가를 제공합니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      })

      const quality = JSON.parse(response.choices[0]?.message?.content || '{}')
      return {
        specificity: quality.specificity || 50,
        actionability: quality.actionability || 50,
        dataBacking: quality.dataBacking || 50,
        overall: quality.overall || 50,
        issues: quality.issues || []
      }
    } catch (error: any) {
      console.error('[AIBriefingGenerator] 품질 검증 실패:', error.message)
      return {
        specificity: 50,
        actionability: 50,
        dataBacking: 50,
        overall: 50,
        issues: ['품질 검증 실패']
      }
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



