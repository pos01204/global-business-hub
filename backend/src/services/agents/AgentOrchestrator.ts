/**
 * Agent 협업 오케스트레이터
 * 복합 질문 시 다중 Agent 활용 및 결과 통합
 */

import { DataAnalystAgent } from './DataAnalystAgent'
import { PerformanceMarketerAgent } from './PerformanceMarketerAgent'
import { BusinessManagerAgent } from './BusinessManagerAgent'
import { AgentContext } from './BaseAgent'
import { correlationAnalyzer } from './CorrelationAnalyzer'

export interface OrchestratedResult {
  primaryResponse: string
  supplementaryInsights?: string[]
  combinedData?: any
  charts?: any[]
  actions?: Array<{ label: string; action: string; data?: any }>
  agentsUsed: string[]
  analysisInsights?: any[]
}

export interface QueryAnalysis {
  isComplex: boolean
  requiredAgents: string[]
  subQueries: Array<{
    agent: string
    query: string
    priority: number
  }>
  needsCorrelation: boolean
}

export class AgentOrchestrator {
  private dataAnalyst: DataAnalystAgent
  private performanceMarketer: PerformanceMarketerAgent
  private businessManager: BusinessManagerAgent

  constructor(context: AgentContext = {}) {
    this.dataAnalyst = new DataAnalystAgent(context)
    this.performanceMarketer = new PerformanceMarketerAgent(context)
    this.businessManager = new BusinessManagerAgent(context)
  }

  /**
   * 복합 질문 분석
   */
  analyzeQuery(query: string): QueryAnalysis {
    const lowerQuery = query.toLowerCase()

    const requiredAgents: string[] = []
    const subQueries: QueryAnalysis['subQueries'] = []

    // 데이터 분석 필요 여부
    const dataKeywords = ['매출', '주문', '데이터', '분석', '통계', '현황', '조회', '랭킹', '상위']
    if (dataKeywords.some((kw) => lowerQuery.includes(kw))) {
      requiredAgents.push('data_analyst')
      subQueries.push({
        agent: 'data_analyst',
        query: query,
        priority: 1,
      })
    }

    // 마케팅 분석 필요 여부
    const marketingKeywords = ['마케팅', '트렌드', '세그먼트', '고객', '카피', '콘텐츠', '캠페인']
    if (marketingKeywords.some((kw) => lowerQuery.includes(kw))) {
      requiredAgents.push('performance_marketer')
      subQueries.push({
        agent: 'performance_marketer',
        query: query,
        priority: requiredAgents.length === 1 ? 1 : 2,
      })
    }

    // 비즈니스 전략 필요 여부
    const businessKeywords = ['전략', '예측', '시뮬레이션', '인사이트', '성장', '목표']
    if (businessKeywords.some((kw) => lowerQuery.includes(kw))) {
      requiredAgents.push('business_manager')
      subQueries.push({
        agent: 'business_manager',
        query: query,
        priority: requiredAgents.length === 1 ? 1 : 3,
      })
    }

    // 기본값: 데이터 분석가
    if (requiredAgents.length === 0) {
      requiredAgents.push('data_analyst')
      subQueries.push({
        agent: 'data_analyst',
        query: query,
        priority: 1,
      })
    }

    // 상관관계 분석 필요 여부
    const correlationKeywords = ['관계', '연관', '영향', '상관', '원인', '요인']
    const needsCorrelation = correlationKeywords.some((kw) => lowerQuery.includes(kw))

    return {
      isComplex: requiredAgents.length > 1 || needsCorrelation,
      requiredAgents,
      subQueries: subQueries.sort((a, b) => a.priority - b.priority),
      needsCorrelation,
    }
  }

  /**
   * 오케스트레이션 실행
   */
  async orchestrate(query: string, context: AgentContext = {}): Promise<OrchestratedResult> {
    const analysis = this.analyzeQuery(query)

    // 단순 질문은 단일 Agent로 처리
    if (!analysis.isComplex) {
      const agent = this.getAgent(analysis.requiredAgents[0])
      const result = await agent.process(query, context)

      return {
        primaryResponse: result.response,
        combinedData: result.data,
        charts: result.charts,
        actions: result.actions,
        agentsUsed: [analysis.requiredAgents[0]],
      }
    }

    // 복합 질문 처리
    const results: Array<{
      agent: string
      response: string
      data?: any
      charts?: any[]
    }> = []

    // 병렬로 Agent 실행
    const promises = analysis.subQueries.map(async (subQuery) => {
      const agent = this.getAgent(subQuery.agent)
      const result = await agent.process(subQuery.query, context)
      return {
        agent: subQuery.agent,
        ...result,
      }
    })

    const agentResults = await Promise.all(promises)
    results.push(...agentResults)

    // 상관관계 분석
    let analysisInsights: any[] = []
    if (analysis.needsCorrelation) {
      const primaryData = results[0]?.data
      if (Array.isArray(primaryData) && primaryData.length > 0) {
        const correlationResult = correlationAnalyzer.analyze(primaryData)
        analysisInsights = correlationResult.insights
      }
    }

    // 결과 통합
    const combinedResult = this.combineResults(results, analysisInsights)

    return {
      ...combinedResult,
      agentsUsed: analysis.requiredAgents,
      analysisInsights,
    }
  }

  /**
   * Agent 인스턴스 반환
   */
  private getAgent(agentType: string): DataAnalystAgent | PerformanceMarketerAgent | BusinessManagerAgent {
    switch (agentType) {
      case 'performance_marketer':
        return this.performanceMarketer
      case 'business_manager':
        return this.businessManager
      default:
        return this.dataAnalyst
    }
  }

  /**
   * 결과 통합
   */
  private combineResults(
    results: Array<{
      agent: string
      response: string
      data?: any
      charts?: any[]
    }>,
    analysisInsights: any[]
  ): Omit<OrchestratedResult, 'agentsUsed' | 'analysisInsights'> {
    if (results.length === 0) {
      return {
        primaryResponse: '분석 결과가 없습니다.',
      }
    }

    // 주요 응답 (첫 번째 Agent)
    const primaryResult = results[0]
    let primaryResponse = primaryResult.response

    // 보조 인사이트 (다른 Agent들)
    const supplementaryInsights: string[] = []
    for (let i = 1; i < results.length; i++) {
      const result = results[i]
      // 응답에서 핵심 인사이트만 추출
      const insight = this.extractKeyInsight(result.response, result.agent)
      if (insight) {
        supplementaryInsights.push(insight)
      }
    }

    // 상관관계 인사이트 추가
    if (analysisInsights.length > 0) {
      const topInsight = analysisInsights[0]
      supplementaryInsights.push(`📊 ${topInsight.title}: ${topInsight.description}`)
    }

    // 보조 인사이트가 있으면 응답에 추가
    if (supplementaryInsights.length > 0) {
      primaryResponse += '\n\n🔗 추가 인사이트:\n' + supplementaryInsights.map((i) => `• ${i}`).join('\n')
    }

    // 차트 통합
    const allCharts: any[] = []
    for (const result of results) {
      if (result.charts) {
        allCharts.push(...result.charts)
      }
    }

    // 액션 통합
    const allActions: Array<{ label: string; action: string; data?: any }> = []
    const seenLabels = new Set<string>()

    for (const result of results) {
      const actions = (result as any).actions || []
      for (const action of actions) {
        if (!seenLabels.has(action.label)) {
          seenLabels.add(action.label)
          allActions.push(action)
        }
      }
    }

    return {
      primaryResponse,
      supplementaryInsights: supplementaryInsights.length > 0 ? supplementaryInsights : undefined,
      combinedData: primaryResult.data,
      charts: allCharts.length > 0 ? allCharts : undefined,
      actions: allActions.length > 0 ? allActions.slice(0, 5) : undefined,
    }
  }

  /**
   * 응답에서 핵심 인사이트 추출
   */
  private extractKeyInsight(response: string, agent: string): string | null {
    // 첫 번째 의미 있는 문장 추출
    const sentences = response.split(/[.!?]\s+/).filter((s) => s.length > 20)

    if (sentences.length === 0) return null

    // Agent별 접두사
    const prefix: Record<string, string> = {
      performance_marketer: '마케팅 관점',
      business_manager: '비즈니스 관점',
      data_analyst: '데이터 관점',
    }

    const firstSentence = sentences[0].trim()
    return `[${prefix[agent] || agent}] ${firstSentence}`
  }

  /**
   * 특정 분석 유형에 대한 심층 분석
   */
  async deepAnalysis(
    query: string,
    analysisType: 'correlation' | 'trend' | 'comparison',
    context: AgentContext = {}
  ): Promise<OrchestratedResult> {
    // 먼저 데이터 조회
    const dataResult = await this.dataAnalyst.process(query, context)

    if (!dataResult.data || !Array.isArray(dataResult.data) || dataResult.data.length === 0) {
      return {
        primaryResponse: dataResult.response,
        agentsUsed: ['data_analyst'],
      }
    }

    // 분석 유형별 추가 분석
    let additionalInsights: string[] = []
    let analysisInsights: any[] = []

    switch (analysisType) {
      case 'correlation':
        const correlationResult = correlationAnalyzer.analyze(dataResult.data)
        analysisInsights = correlationResult.insights

        if (correlationResult.correlations.length > 0) {
          additionalInsights.push(
            `발견된 상관관계: ${correlationResult.correlations
              .slice(0, 3)
              .map((c) => `${c.column1}-${c.column2}(${c.correlation})`)
              .join(', ')}`
          )
        }

        if (correlationResult.anomalies.length > 0) {
          additionalInsights.push(`이상치 ${correlationResult.anomalies.length}건 감지됨`)
        }
        break

      case 'trend':
        const trendResult = correlationAnalyzer.analyze(dataResult.data)
        analysisInsights = trendResult.insights.filter((i) => i.type === 'trend')

        for (const trend of trendResult.trends.slice(0, 3)) {
          additionalInsights.push(
            `${trend.column}: ${trend.direction} (${trend.changeRate > 0 ? '+' : ''}${trend.changeRate}%)`
          )
        }
        break

      case 'comparison':
        // 비교 분석은 데이터 분석가가 처리
        break
    }

    // 응답 강화
    let enhancedResponse = dataResult.response
    if (additionalInsights.length > 0) {
      enhancedResponse += '\n\n📈 심층 분석 결과:\n' + additionalInsights.map((i) => `• ${i}`).join('\n')
    }

    return {
      primaryResponse: enhancedResponse,
      supplementaryInsights: additionalInsights,
      combinedData: dataResult.data,
      charts: dataResult.charts,
      actions: dataResult.actions,
      agentsUsed: ['data_analyst'],
      analysisInsights,
    }
  }
}

export const agentOrchestrator = new AgentOrchestrator()
