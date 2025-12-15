/**
 * 카테고리 기반 라우터
 * 질문을 카테고리로 분류하고 적절한 Flow를 실행
 */

import { openaiService } from '../openaiService'
import { DataAnalystAgent } from './DataAnalystAgent'
import { PerformanceMarketerAgent } from './PerformanceMarketerAgent'
import { BusinessManagerAgent } from './BusinessManagerAgent'
import { BusinessBrainAgent } from './BusinessBrainAgent'
import { EnhancedAgentOrchestrator } from './EnhancedAgentOrchestrator'
import { pageNavigationAgent, PageNavigationAgent } from './PageNavigationAgent'
import { QuestionCategory, CategoryFlow, FlowStep, AgentRole } from './QuestionCategory'
import { AgentContext } from './BaseAgent'
import { nodeBasedWorkflow } from './NodeBasedWorkflow'

export interface AgentResponse {
  response: string
  data?: any
  charts?: any[]
  actions?: Array<{ label: string; action: string; data?: any }>
}

export class CategoryBasedRouter {
  private categoryFlows: Map<QuestionCategory, CategoryFlow>
  private agents: Map<AgentRole, any>
  private enhancedOrchestrator: EnhancedAgentOrchestrator
  private pageNavigationAgent: PageNavigationAgent

  constructor(context: AgentContext = {}) {
    this.categoryFlows = new Map()
    this.agents = new Map()
    this.enhancedOrchestrator = new EnhancedAgentOrchestrator()
    this.pageNavigationAgent = pageNavigationAgent

    // Agent 초기화
    this.agents.set('data-analyst', new DataAnalystAgent(context))
    this.agents.set('performance-marketer', new PerformanceMarketerAgent(context))
    this.agents.set('business-manager', new BusinessManagerAgent(context))
    this.agents.set('business-brain', new BusinessBrainAgent(context))

    // Flow 초기화
    this.initializeFlows()
  }

  /**
   * Flow 초기화
   */
  private initializeFlows() {
    // 1. 데이터 조회 Flow
    this.categoryFlows.set(QuestionCategory.DATA_QUERY, {
      category: QuestionCategory.DATA_QUERY,
      requiredAgents: ['data-analyst'],
      executionOrder: 'sequential',
      flowSteps: [
        {
          stepId: 'query-parse',
          agent: 'data-analyst',
          description: '질문에서 데이터 요구사항 추출',
          dependencies: [],
          expectedOutput: 'ExtractedIntent with sheets, dateRange, filters'
        },
        {
          stepId: 'data-fetch',
          agent: 'data-analyst',
          description: '데이터 조회 및 필터링',
          dependencies: ['query-parse'],
          expectedOutput: 'Filtered and aggregated data'
        },
        {
          stepId: 'response-generate',
          agent: 'data-analyst',
          description: '자연어 응답 생성',
          dependencies: ['data-fetch'],
          expectedOutput: 'Natural language response with data'
        }
      ]
    })

    // 2. 분석 요청 Flow
    this.categoryFlows.set(QuestionCategory.ANALYSIS_REQUEST, {
      category: QuestionCategory.ANALYSIS_REQUEST,
      requiredAgents: ['data-analyst', 'business-brain'],
      executionOrder: 'hybrid',
      flowSteps: [
        {
          stepId: 'data-analysis',
          agent: 'data-analyst',
          description: '데이터 분석 및 통계 계산',
          dependencies: [],
          expectedOutput: 'Statistical analysis results'
        },
        {
          stepId: 'insight-generation',
          agent: 'business-brain',
          description: '인사이트 생성 및 해석',
          dependencies: ['data-analysis'],
          expectedOutput: 'Business insights and recommendations'
        },
        {
          stepId: 'response-integration',
          agent: 'data-analyst',
          description: '결과 통합 및 응답 생성',
          dependencies: ['data-analysis', 'insight-generation'],
          expectedOutput: 'Integrated response with insights'
        }
      ]
    })

    // 3. 전략 제안 Flow
    this.categoryFlows.set(QuestionCategory.STRATEGY_SUGGESTION, {
      category: QuestionCategory.STRATEGY_SUGGESTION,
      requiredAgents: ['business-manager', 'business-brain'],
      executionOrder: 'sequential',
      flowSteps: [
        {
          stepId: 'current-state-analysis',
          agent: 'business-brain',
          description: '현재 비즈니스 상태 분석',
          dependencies: [],
          expectedOutput: 'Current business state metrics'
        },
        {
          stepId: 'strategy-generation',
          agent: 'business-manager',
          description: '전략 제안 생성',
          dependencies: ['current-state-analysis'],
          expectedOutput: 'Strategic recommendations'
        },
        {
          stepId: 'action-planning',
          agent: 'business-manager',
          description: '실행 계획 수립',
          dependencies: ['strategy-generation'],
          expectedOutput: 'Action plan with priorities'
        }
      ]
    })

    // 4. 인사이트 요청 Flow
    this.categoryFlows.set(QuestionCategory.INSIGHT_REQUEST, {
      category: QuestionCategory.INSIGHT_REQUEST,
      requiredAgents: ['business-brain'],
      executionOrder: 'sequential',
      flowSteps: [
        {
          stepId: 'insight-discovery',
          agent: 'business-brain',
          description: '인사이트 발견 및 분석',
          dependencies: [],
          expectedOutput: 'Business insights'
        }
      ]
    })

    // 5. 복합 질문 Flow
    this.categoryFlows.set(QuestionCategory.COMPLEX_QUERY, {
      category: QuestionCategory.COMPLEX_QUERY,
      requiredAgents: ['data-analyst', 'business-brain', 'business-manager'],
      executionOrder: 'hybrid',
      flowSteps: [
        {
          stepId: 'query-decomposition',
          agent: 'data-analyst',
          description: '질문을 하위 작업으로 분해',
          dependencies: [],
          expectedOutput: 'TaskDecomposition with sub-tasks'
        },
        {
          stepId: 'parallel-data-tasks',
          agent: 'data-analyst',
          description: '병렬 데이터 조회 작업',
          dependencies: ['query-decomposition'],
          expectedOutput: 'Multiple data results'
        },
        {
          stepId: 'insight-analysis',
          agent: 'business-brain',
          description: '인사이트 분석',
          dependencies: ['parallel-data-tasks'],
          expectedOutput: 'Business insights'
        },
        {
          stepId: 'strategy-synthesis',
          agent: 'business-manager',
          description: '전략 통합',
          dependencies: ['insight-analysis'],
          expectedOutput: 'Integrated strategy'
        },
        {
          stepId: 'final-integration',
          agent: 'data-analyst',
          description: '최종 결과 통합',
          dependencies: ['parallel-data-tasks', 'insight-analysis', 'strategy-synthesis'],
          expectedOutput: 'Comprehensive response'
        }
      ]
    })
  }

  /**
   * 질문 카테고리 분류 및 Flow 선택
   */
  async routeByCategory(
    query: string,
    context: AgentContext
  ): Promise<{
    category: QuestionCategory
    flow: CategoryFlow
    response: AgentResponse
  }> {
    // 1. 페이지 네비게이션 의도 확인 (보조 정보로만 사용)
    const navIntent = await this.pageNavigationAgent.extractNavigationIntent(query)
    
    // 2. 일반 카테고리 분류 및 Flow 실행 (항상 먼저 실행)
    const category = await this.classifyCategory(query, context)
    const flow = this.categoryFlows.get(category) || this.categoryFlows.get(QuestionCategory.DATA_QUERY)!
    const response = await this.executeFlow(flow, query, context)

    // 3. 페이지 네비게이션 의도가 매우 명확한 경우(confidence > 0.95 && isPrimaryAction)에만 즉시 이동 제안
    // 하지만 답변은 항상 먼저 제공
    if (navIntent && navIntent.confidence > 0.95 && navIntent.isPrimaryAction) {
      // 매우 명확한 페이지 이동 요청인 경우, 답변과 함께 즉시 이동 제안
      // 예: "대시보드로 이동해줘" 같은 명확한 이동 요청
      return {
        category,
        flow,
        response: {
          ...response,
          actions: [
            {
              label: `${navIntent.targetPage}로 이동`,
              action: 'navigate',
              data: {
                path: navIntent.path,
                params: navIntent.params
              }
            },
            ...(response.actions || [])
          ]
        }
      }
    }

    // 4. 일반적인 경우: 답변을 먼저 제공하고, 관련 페이지 제안을 보조 액션으로 추가
    const enhancedResponse = await this.addPageSuggestions(response, category, query)
    
    // 5. 페이지 네비게이션 의도가 있는 경우(confidence > 0.7) 보조 액션으로 추가
    if (navIntent && navIntent.confidence > 0.7 && !navIntent.isPrimaryAction) {
      // 기존 액션 중 동일한 페이지로의 네비게이션이 있는지 확인
      const hasExistingNav = enhancedResponse.actions?.some(
        action => action.action === 'navigate' && action.data?.path === navIntent.path
      )
      
      if (!hasExistingNav) {
        enhancedResponse.actions = [
          ...(enhancedResponse.actions || []),
          {
            label: `${navIntent.targetPage}에서 상세 확인`,
            action: 'navigate',
            data: {
              path: navIntent.path,
              params: navIntent.params
            }
          }
        ]
      }
    }

    return {
      category,
      flow,
      response: enhancedResponse
    }
  }

  /**
   * 카테고리 분류 (LLM 기반)
   */
  private async classifyCategory(
    query: string,
    context: AgentContext
  ): Promise<QuestionCategory> {
    // OpenAI 연결 확인
    const isConnected = await openaiService.checkConnection()
    
    if (!isConnected) {
      return this.fallbackCategoryClassification(query)
    }

    const prompt = `
사용자 질문: "${query}"

다음 카테고리 중 가장 적합한 것을 선택하세요:

1. DATA_QUERY: 단순 데이터 조회 요청 (예: "금일 매출", "일본 시장 주문 건수")
2. ANALYSIS_REQUEST: 데이터 분석 요청 (예: "매출 트렌드 분석", "작가 성과 비교")
3. STRATEGY_SUGGESTION: 전략 제안 요청 (예: "매출 증대 방안", "고객 이탈 방지 전략")
4. INSIGHT_REQUEST: 인사이트 요청 (예: "주요 인사이트", "건강도 점수")
5. ACTION_EXECUTION: 액션 실행 요청 (예: "쿠폰 생성", "리포트 다운로드")
6. PAGE_NAVIGATION: 페이지 이동 요청 (예: "대시보드로 이동", "성과 분석 페이지 보여줘")
7. COMPLEX_QUERY: 복합 질문 (여러 카테고리 포함)

응답 형식 (JSON):
{
  "category": "data_query",
  "confidence": 0.95,
  "reasoning": "단순 데이터 조회 요청이므로 DATA_QUERY"
}
`

    try {
      // generateChat 사용 (JSON 모드 지원)
      const response = await openaiService.generateChat(
        [
          {
            role: 'system',
            content: '당신은 사용자 질문을 정확히 분류하는 전문가입니다. 응답은 반드시 JSON 형식이어야 합니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        {
          temperature: 0.2,
          maxTokens: 500
        }
      )

      const result = JSON.parse(response || '{}')

      return (result.category as QuestionCategory) || QuestionCategory.DATA_QUERY
    } catch (error) {
      console.error('[CategoryBasedRouter] 카테고리 분류 실패:', error)
      return this.fallbackCategoryClassification(query)
    }
  }

  /**
   * 폴백 카테고리 분류 (키워드 기반)
   */
  private fallbackCategoryClassification(query: string): QuestionCategory {
    const lowerQuery = query.toLowerCase()

    if (lowerQuery.includes('이동') || lowerQuery.includes('보여줘') || lowerQuery.includes('페이지')) {
      return QuestionCategory.PAGE_NAVIGATION
    }

    if (lowerQuery.includes('전략') || lowerQuery.includes('방안') || lowerQuery.includes('제안')) {
      return QuestionCategory.STRATEGY_SUGGESTION
    }

    if (lowerQuery.includes('인사이트') || lowerQuery.includes('건강도') || lowerQuery.includes('브리핑')) {
      return QuestionCategory.INSIGHT_REQUEST
    }

    if (lowerQuery.includes('분석') || lowerQuery.includes('트렌드') || lowerQuery.includes('비교')) {
      return QuestionCategory.ANALYSIS_REQUEST
    }

    if (lowerQuery.includes('생성') || lowerQuery.includes('다운로드') || lowerQuery.includes('실행')) {
      return QuestionCategory.ACTION_EXECUTION
    }

    // 기본값: 데이터 조회
    return QuestionCategory.DATA_QUERY
  }

  /**
   * Flow 실행 (Node 기반 워크플로우 사용)
   */
  private async executeFlow(
    flow: CategoryFlow,
    query: string,
    context: AgentContext
  ): Promise<AgentResponse> {
    // 복합 질문인 경우 Node 기반 워크플로우 사용
    if (flow.category === QuestionCategory.COMPLEX_QUERY || 
        flow.executionOrder === 'hybrid' ||
        flow.requiredAgents.length > 1) {
      return this.executeNodeBasedWorkflow(flow, query, context)
    }

    // 단순 질문은 기존 방식 사용
    return this.executeSimpleFlow(flow, query, context)
  }

  /**
   * Node 기반 워크플로우 실행
   */
  private async executeNodeBasedWorkflow(
    flow: CategoryFlow,
    query: string,
    context: AgentContext
  ): Promise<AgentResponse> {
    try {
      // 필요한 노드 타입 결정
      const requiredNodeTypes = flow.requiredAgents.map(role => {
        switch (role) {
          case 'data-analyst': return 'data-analyst' as const
          case 'performance-marketer': return 'performance-marketer' as const
          case 'business-manager': return 'business-manager' as const
          case 'business-brain': return 'business-brain' as const
          default: return 'data-analyst' as const
        }
      })

      // 워크플로우 실행
      const execution = await nodeBasedWorkflow.executeSelectiveWorkflow(
        query,
        requiredNodeTypes,
        context
      )

      // 결과 통합
      const integratedResult = await nodeBasedWorkflow.integrateResults(execution, query)

      console.log('[CategoryBasedRouter] Node 기반 워크플로우 완료:', {
        category: flow.category,
        nodesExecuted: execution.executionOrder,
        totalTime: execution.totalTime
      })

      return integratedResult
    } catch (error: any) {
      console.error('[CategoryBasedRouter] Node 기반 워크플로우 실패:', error)
      // 폴백: 기존 방식 사용
      return this.executeSimpleFlow(flow, query, context)
    }
  }

  /**
   * 단순 Flow 실행 (기존 방식)
   */
  private async executeSimpleFlow(
    flow: CategoryFlow,
    query: string,
    context: AgentContext
  ): Promise<AgentResponse> {
    const stepResults: Map<string, any> = new Map()
    const executedSteps = new Set<string>()

    // 의존성 기반 실행
    while (executedSteps.size < flow.flowSteps.length) {
      const readySteps = flow.flowSteps.filter(
        step =>
          !executedSteps.has(step.stepId) &&
          step.dependencies.every(dep => executedSteps.has(dep))
      )

      if (readySteps.length === 0) {
        throw new Error('순환 의존성 또는 실행 불가능한 단계 감지')
      }

      // 병렬 실행 가능한 단계는 동시 실행
      const promises = readySteps.map(async step => {
        // AgentRole을 AgentType으로 매핑
        const agentTypeMap: Record<AgentRole, string> = {
          'data-analyst': 'data_analyst',
          'performance-marketer': 'performance_marketer',
          'business-manager': 'business_manager',
          'business-brain': 'business_brain',
          'orchestrator': 'data_analyst' // 폴백
        }

        const agent = this.agents.get(step.agent)
        if (!agent) {
          console.warn(`[CategoryBasedRouter] Agent를 찾을 수 없음: ${step.agent}, 기본 Agent 사용`)
          // 기본 Agent 사용
          const defaultAgent = this.agents.get('data-analyst')
          if (!defaultAgent) {
            throw new Error(`기본 Agent를 찾을 수 없음`)
          }
          
          const stepContext: AgentContext = {
            ...context,
            previousStepResults: Array.from(stepResults.entries()).map(([k, v]) => ({
              stepId: k,
              result: v
            }))
          }

          const stepQuery = executedSteps.size === 0 ? query : step.description
          const result = await defaultAgent.process(stepQuery, stepContext)
          stepResults.set(step.stepId, result)
          executedSteps.add(step.stepId)
          return { stepId: step.stepId, result }
        }

        const stepContext: AgentContext = {
          ...context,
          previousStepResults: Array.from(stepResults.entries()).map(([k, v]) => ({
            stepId: k,
            result: v
          }))
        }

        // 첫 번째 단계는 원본 쿼리 사용, 이후 단계는 description 사용
        const stepQuery = executedSteps.size === 0 ? query : step.description

        const result = await agent.process(stepQuery, stepContext)
        stepResults.set(step.stepId, result)
        executedSteps.add(step.stepId)

        return { stepId: step.stepId, result }
      })

      await Promise.all(promises)
    }

    // 최종 단계 결과 반환
    const finalStep = flow.flowSteps[flow.flowSteps.length - 1]
    const finalResult = stepResults.get(finalStep.stepId)

    // 결과 통합
    if (flow.executionOrder === 'hybrid' && stepResults.size > 1) {
      return this.integrateResults(flow, stepResults, query)
    }

    return finalResult || { response: '응답을 생성할 수 없습니다.' }
  }

  /**
   * 결과 통합
   */
  private async integrateResults(
    flow: CategoryFlow,
    stepResults: Map<string, any>,
    originalQuery: string
  ): Promise<AgentResponse> {
    // 단순 병합 (향후 LLM 기반 통합으로 개선 가능)
    const results = Array.from(stepResults.values())
    
    // 첫 번째 결과를 기본으로 사용
    const primaryResult = results[0] || { response: '', data: null, charts: [], actions: [] }

    // 모든 결과의 데이터, 차트, 액션 통합
    const integratedData = results
      .map(r => r.data)
      .filter(d => d !== undefined && d !== null)
      .flat()

    const integratedCharts = results
      .map(r => r.charts)
      .filter(c => c !== undefined && Array.isArray(c))
      .flat()

    const integratedActions = results
      .map(r => r.actions)
      .filter(a => a !== undefined && Array.isArray(a))
      .flat()

    return {
      response: primaryResult.response || '분석이 완료되었습니다.',
      data: integratedData.length > 0 ? integratedData : primaryResult.data,
      charts: integratedCharts.length > 0 ? integratedCharts : primaryResult.charts,
      actions: integratedActions.length > 0 ? integratedActions : primaryResult.actions
    }
  }

  /**
   * 응답에 관련 페이지 제안 추가
   * 페이지 제안은 보조 도구로만 사용되며, 응답의 품질을 해치지 않도록 주의
   */
  private async addPageSuggestions(
    response: AgentResponse,
    category: QuestionCategory,
    query: string
  ): Promise<AgentResponse> {
    // 응답이 비어있거나 에러인 경우 페이지 제안하지 않음
    if (!response.response || response.response.includes('오류') || response.response.includes('에러')) {
      return response
    }

    const suggestions = this.pageNavigationAgent.getSuggestedPages(category)

    // 기존 액션과 중복되지 않는 제안만 추가
    const existingPaths = (response.actions || [])
      .filter(a => a.action === 'navigate')
      .map(a => a.data?.path)
      .filter(Boolean)

    const newSuggestions = suggestions
      .filter(s => !existingPaths.includes(s.path))
      .map(s => ({
        label: s.label,
        action: 'navigate' as const,
        data: {
          path: s.path,
          params: s.params
        }
      }))

    // 제안이 3개 이상이면 가장 관련성 높은 것만 선택
    const finalSuggestions = newSuggestions.slice(0, 2)

    return {
      ...response,
      actions: [
        ...(response.actions || []),
        ...finalSuggestions
      ]
    }
  }

  /**
   * 네비게이션 Flow 반환
   */
  private getNavigationFlow(): CategoryFlow {
    return {
      category: QuestionCategory.PAGE_NAVIGATION,
      requiredAgents: [],
      executionOrder: 'sequential',
      flowSteps: []
    }
  }
}

