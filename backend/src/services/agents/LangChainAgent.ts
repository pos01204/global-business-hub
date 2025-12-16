/**
 * LangChainAgent - LangChain 기반 AI 분석 에이전트
 * 자연어 쿼리 처리 및 도구 실행 오케스트레이션
 */

import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { 
  ANALYSIS_TOOLS, 
  findToolByName, 
  validateToolInput,
  ToolResult 
} from './AnalysisTools'
import { QueryParser, queryParser, ParsedQuery } from './QueryParser'
import { NaturalLanguageProcessor, naturalLanguageProcessor } from './NaturalLanguageProcessor'
import { BusinessBrainAgent } from './BusinessBrainAgent'

// ==================== 타입 정의 ====================

export interface AgentResponse {
  success: boolean
  response: string
  data?: any
  toolsUsed?: string[]
  parsedQuery?: ParsedQuery
  suggestions?: string[]
  error?: string
}

export interface ConversationContext {
  history: Array<{ role: 'user' | 'assistant'; content: string }>
  currentTopic?: string
  lastAnalysisType?: string
}

// ==================== 시스템 프롬프트 ====================

const SYSTEM_PROMPT = `당신은 Business Brain AI 분석 어시스턴트입니다.
사용자의 비즈니스 관련 질문을 분석하고 적절한 데이터 분석을 수행합니다.

당신의 역할:
1. 사용자의 질문을 이해하고 의도를 파악합니다.
2. 적절한 분석 도구를 선택하여 데이터를 분석합니다.
3. 분석 결과를 명확하고 이해하기 쉬운 한국어로 설명합니다.
4. 추가적인 인사이트나 권장 사항을 제공합니다.

사용 가능한 분석 도구:
- analyze_revenue_trend: 매출 트렌드 분석
- detect_anomalies: 이상치 탐지
- analyze_customer_segment: 고객 세그먼트 분석 (RFM, 코호트, CLV)
- forecast_metrics: 지표 예측
- analyze_pareto: 파레토 분석
- compare_periods: 기간 비교 분석
- analyze_correlation: 상관관계 분석
- run_whatif_simulation: What-if 시뮬레이션

응답 규칙:
- 항상 한국어로 응답합니다.
- 숫자는 적절한 단위와 함께 표시합니다 (예: $1.2M, 1,234건).
- 분석 결과는 구조화된 형식으로 제공합니다.
- 가능하면 실행 가능한 인사이트를 포함합니다.
- 불확실한 경우 추가 질문을 통해 명확히 합니다.`

// ==================== LangChainAgent 클래스 ====================

export class LangChainAgent {
  private llm: ChatOpenAI | null = null
  private businessBrainAgent: BusinessBrainAgent
  private context: ConversationContext

  constructor() {
    this.businessBrainAgent = new BusinessBrainAgent()
    this.context = { history: [] }
    
    // OpenAI API 키가 있는 경우에만 LLM 초기화
    if (process.env.OPENAI_API_KEY) {
      try {
        this.llm = new ChatOpenAI({
          modelName: 'gpt-4-turbo-preview',
          temperature: 0.3,
          maxTokens: 2000,
        })
      } catch (error) {
        console.warn('[LangChainAgent] LLM 초기화 실패, 기본 모드로 동작:', error)
      }
    }
  }

  /**
   * 사용자 쿼리 처리
   */
  async processQuery(query: string): Promise<AgentResponse> {
    try {
      // 1. 쿼리 파싱
      const parsedQuery = queryParser.parse(query)
      console.log('[LangChainAgent] 파싱된 쿼리:', parsedQuery)

      // 2. 도움말 요청 처리
      if (this.isHelpRequest(query)) {
        return {
          success: true,
          response: naturalLanguageProcessor.generateHelpResponse(),
          parsedQuery,
        }
      }

      // 3. 도구 실행
      const toolResults = await this.executeTools(parsedQuery)
      
      // 4. 응답 생성
      const response = await this.generateResponse(parsedQuery, toolResults)

      // 5. 컨텍스트 업데이트
      this.updateContext(query, response.response)

      return {
        ...response,
        parsedQuery,
        toolsUsed: parsedQuery.suggestedTools,
        suggestions: this.generateSuggestions(parsedQuery),
      }
    } catch (error: any) {
      console.error('[LangChainAgent] 처리 오류:', error)
      return {
        success: false,
        response: naturalLanguageProcessor.generateErrorResponse(error.message, query),
        error: error.message,
      }
    }
  }

  /**
   * 도구 실행
   */
  private async executeTools(parsedQuery: ParsedQuery): Promise<Map<string, ToolResult>> {
    const results = new Map<string, ToolResult>()
    const dateRange = queryParser.calculateDateRange(parsedQuery.entities)

    for (const toolName of parsedQuery.suggestedTools) {
      try {
        const startTime = Date.now()
        const result = await this.executeTool(toolName, parsedQuery, dateRange)
        
        results.set(toolName, {
          success: true,
          data: result,
          metadata: {
            executionTime: Date.now() - startTime,
            dataPoints: this.countDataPoints(result),
          },
        })
      } catch (error: any) {
        results.set(toolName, {
          success: false,
          error: error.message,
        })
      }
    }

    return results
  }

  /**
   * 개별 도구 실행
   */
  private async executeTool(
    toolName: string,
    parsedQuery: ParsedQuery,
    dateRange: { startDate: string; endDate: string }
  ): Promise<any> {
    const { entities, intent } = parsedQuery

    switch (toolName) {
      case 'analyze_revenue_trend':
        return await this.businessBrainAgent.analyzeLongTermTrends(
          entities.period || '30d'
        )

      case 'detect_anomalies':
        return await this.businessBrainAgent.runAnomalyDetection(
          'medium'
        )

      case 'analyze_customer_segment':
        if (intent === 'customer_analysis') {
          const analysisType = this.determineCustomerAnalysisType(parsedQuery)
          if (analysisType === 'rfm') {
            return await this.businessBrainAgent.runRFMAnalysis()
          } else if (analysisType === 'cohort') {
            return await this.businessBrainAgent.runCohortAnalysis()
          }
        }
        return await this.businessBrainAgent.runRFMAnalysis()

      case 'forecast_metrics':
        return await this.businessBrainAgent.runForecast(
          entities.period || '90d',
          30
        )

      case 'analyze_pareto':
        return await this.businessBrainAgent.runParetoAnalysis()

      case 'compare_periods':
        if (entities.comparison) {
          // 기본 전월 대비 비교
          const endDate = new Date()
          const startDate = new Date()
          startDate.setMonth(startDate.getMonth() - 1)
          
          const prevEndDate = new Date(startDate)
          prevEndDate.setDate(prevEndDate.getDate() - 1)
          const prevStartDate = new Date(prevEndDate)
          prevStartDate.setMonth(prevStartDate.getMonth() - 1)

          return await this.businessBrainAgent.runPeriodComparison(
            { start: startDate.toISOString().split('T')[0], end: endDate.toISOString().split('T')[0] },
            { start: prevStartDate.toISOString().split('T')[0], end: prevEndDate.toISOString().split('T')[0] },
            '이번 달',
            '지난 달'
          )
        }
        return null

      case 'analyze_correlation':
        return await this.businessBrainAgent.runCorrelationAnalysis()

      case 'run_whatif_simulation':
        // 기본 시뮬레이션 시나리오
        return await this.businessBrainAgent.runWhatIfSimulation({
          name: '기본 시나리오',
          type: 'price_change',
          parameters: { priceChangePercent: 10 },
        })

      default:
        throw new Error(`알 수 없는 도구: ${toolName}`)
    }
  }

  /**
   * 응답 생성
   */
  private async generateResponse(
    parsedQuery: ParsedQuery,
    toolResults: Map<string, ToolResult>
  ): Promise<{ success: boolean; response: string; data?: any }> {
    // 도구 실행 결과 수집
    const successfulResults: any[] = []
    const errors: string[] = []

    for (const [toolName, result] of toolResults) {
      if (result.success && result.data) {
        successfulResults.push({
          tool: toolName,
          ...result.data,
        })
      } else if (result.error) {
        errors.push(`${toolName}: ${result.error}`)
      }
    }

    // 결과가 없는 경우
    if (successfulResults.length === 0) {
      if (errors.length > 0) {
        return {
          success: false,
          response: `분석 중 오류가 발생했습니다:\n${errors.join('\n')}`,
        }
      }
      
      // 기본 브리핑 제공
      const briefing = await this.businessBrainAgent.generateExecutiveBriefing('30d')
      return {
        success: true,
        response: briefing.summary || '요청하신 분석을 수행했습니다.',
        data: briefing,
      }
    }

    // LLM이 있으면 자연어 응답 생성
    if (this.llm) {
      try {
        const llmResponse = await this.generateLLMResponse(parsedQuery, successfulResults)
        return {
          success: true,
          response: llmResponse,
          data: successfulResults,
        }
      } catch (error) {
        console.warn('[LangChainAgent] LLM 응답 생성 실패, 기본 응답 사용')
      }
    }

    // 기본 응답 생성
    const response = naturalLanguageProcessor.generateResponse(
      parsedQuery.intent,
      successfulResults[0],
      parsedQuery
    )

    return {
      success: true,
      response,
      data: successfulResults,
    }
  }

  /**
   * LLM을 사용한 응답 생성
   */
  private async generateLLMResponse(
    parsedQuery: ParsedQuery,
    results: any[]
  ): Promise<string> {
    if (!this.llm) {
      throw new Error('LLM이 초기화되지 않았습니다')
    }

    const messages = [
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage(`
사용자 질문: "${parsedQuery.originalQuery}"

분석 결과:
${JSON.stringify(results, null, 2)}

위 분석 결과를 바탕으로 사용자에게 명확하고 이해하기 쉬운 한국어 응답을 작성해주세요.
주요 인사이트와 권장 사항을 포함해주세요.
`),
    ]

    const response = await this.llm.invoke(messages)
    const parser = new StringOutputParser()
    return await parser.invoke(response)
  }

  /**
   * 도움말 요청 확인
   */
  private isHelpRequest(query: string): boolean {
    const helpKeywords = ['도움말', '도움', 'help', '사용법', '어떻게', '뭘 할 수 있', '기능']
    return helpKeywords.some(keyword => query.toLowerCase().includes(keyword))
  }

  /**
   * 고객 분석 유형 결정
   */
  private determineCustomerAnalysisType(parsedQuery: ParsedQuery): string {
    const query = parsedQuery.originalQuery.toLowerCase()
    
    if (query.includes('rfm') || query.includes('세그먼트')) return 'rfm'
    if (query.includes('코호트') || query.includes('리텐션')) return 'cohort'
    if (query.includes('clv') || query.includes('생애가치')) return 'clv'
    
    return 'rfm' // 기본값
  }

  /**
   * 데이터 포인트 수 계산
   */
  private countDataPoints(data: any): number {
    if (Array.isArray(data)) return data.length
    if (data?.trends) return data.trends.length
    if (data?.segments) return data.segments.length
    return 1
  }

  /**
   * 컨텍스트 업데이트
   */
  private updateContext(query: string, response: string): void {
    this.context.history.push(
      { role: 'user', content: query },
      { role: 'assistant', content: response }
    )

    // 최근 10개 대화만 유지
    if (this.context.history.length > 20) {
      this.context.history = this.context.history.slice(-20)
    }
  }

  /**
   * 추천 질문 생성
   */
  private generateSuggestions(parsedQuery: ParsedQuery): string[] {
    const suggestions: Record<string, string[]> = {
      revenue_analysis: [
        '전월 대비 매출 비교해줘',
        '매출 이상치 탐지해줘',
        '다음 달 매출 예측해줘',
      ],
      customer_analysis: [
        '이탈 위험 고객 분석해줘',
        '고객 코호트 분석해줘',
        'VIP 고객 현황 알려줘',
      ],
      trend_analysis: [
        '최근 90일 트렌드 분석해줘',
        '변화점 탐지해줘',
        '향후 전망 분석해줘',
      ],
      anomaly_detection: [
        '이상치 원인 분석해줘',
        '상세 트렌드 보여줘',
        '관련 지표 상관관계 분석해줘',
      ],
      forecast: [
        '예측 정확도 분석해줘',
        '시나리오별 예측 비교해줘',
        '목표 달성 가능성 분석해줘',
      ],
      general: [
        '오늘의 브리핑 보여줘',
        '비즈니스 건강도 점검해줘',
        '주요 인사이트 알려줘',
      ],
    }

    return suggestions[parsedQuery.intent] || suggestions.general
  }

  /**
   * 대화 컨텍스트 초기화
   */
  resetContext(): void {
    this.context = { history: [] }
  }
}

// 싱글톤 인스턴스
export const langChainAgent = new LangChainAgent()

