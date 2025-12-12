/**
 * Enhanced Agent Orchestrator
 * v4.2: LLM 기반 작업 분해 및 에이전트 협업 시스템
 * Google Opal 수준의 복잡한 flow 통합 대응
 */

import OpenAI from 'openai'
import { BaseAgent, AgentContext } from './BaseAgent'
import { DataAnalystAgent } from './DataAnalystAgent'
import { PerformanceMarketerAgent } from './PerformanceMarketerAgent'
import { BusinessManagerAgent } from './BusinessManagerAgent'
import { BusinessBrainAgent } from './BusinessBrainAgent'

// ==================== 타입 정의 ====================

export type AgentRole = 
  | 'data-analyst'      // 데이터 분석 전문
  | 'logistics-manager' // 물류 관리 전문
  | 'marketing-strategist' // 마케팅 전략 전문
  | 'customer-specialist' // 고객 관리 전문
  | 'business-brain'    // Business Brain 에이전트
  | 'orchestrator'      // 작업 조율

export interface Task {
  id: string
  description: string
  agent: AgentRole
  dependencies: string[] // 다른 작업 ID
  priority: number // 1: 최우선, 5: 낮음
  expectedOutput: string
}

export interface TaskDecomposition {
  tasks: Task[]
  coordination: 'sequential' | 'parallel' | 'hybrid'
  estimatedTime: number // 분 단위
}

export interface AgentMessage {
  from: AgentRole
  to: AgentRole | 'all'
  type: 'request' | 'response' | 'notification'
  content: any
  taskId: string
  timestamp: Date
}

export interface SharedContext {
  taskId: string
  messages: AgentMessage[]
  intermediateResults: Map<string, any>
  finalResult?: any
}

export interface OrchestratedResult {
  primaryResponse: string
  supplementaryInsights?: string[]
  combinedData?: any
  charts?: any[]
  actions?: Array<{ label: string; action: string; data?: any }>
  agentsUsed: string[]
  analysisInsights?: any[]
  executionTime?: number
}

// ==================== Enhanced Agent Orchestrator ====================

export class EnhancedAgentOrchestrator {
  private openaiClient: OpenAI | null = null
  private agents: Map<AgentRole, BaseAgent>
  private sharedContexts: Map<string, SharedContext> = new Map()
  
  constructor(context: AgentContext = {}) {
    this.agents = new Map()
    // 에이전트 초기화
    this.agents.set('data-analyst', new DataAnalystAgent(context))
    this.agents.set('marketing-strategist', new PerformanceMarketerAgent(context))
    this.agents.set('business-brain', new BusinessBrainAgent(context))
    // BusinessManagerAgent는 business-manager로 매핑
    const businessManager = new BusinessManagerAgent(context)
    this.agents.set('logistics-manager', businessManager as any) // 임시 매핑
    this.agents.set('customer-specialist', businessManager as any) // 임시 매핑
  }

  /**
   * OpenAI 클라이언트 가져오기
   */
  private getOpenAIClient(): OpenAI | null {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[EnhancedAgentOrchestrator] OPENAI_API_KEY가 설정되지 않았습니다.')
      return null
    }
    
    if (!this.openaiClient) {
      this.openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
    }
    return this.openaiClient
  }

  /**
   * LLM 기반 작업 분해
   */
  async decomposeTask(
    query: string,
    context: AgentContext
  ): Promise<TaskDecomposition> {
    const client = this.getOpenAIClient()
    
    if (!client) {
      // 폴백: 기존 키워드 기반 방식
      return this.fallbackDecomposition(query)
    }

    const prompt = `
사용자 질문: "${query}"

이 질문을 해결하기 위해 필요한 작업들을 분해하고, 각 작업에 적합한 에이전트를 할당하세요.

## 사용 가능한 에이전트
1. data-analyst: 데이터 분석, 통계, 트렌드 분석
2. logistics-manager: 물류, 배송, 파이프라인 관리
3. marketing-strategist: 마케팅, 고객 세그먼트, 캠페인
4. customer-specialist: 고객 관리, 이탈 예방, 리텐션
5. business-brain: 경영 인사이트, 건강도 점수, 전략 분석
6. orchestrator: 작업 조율, 결과 통합

## 작업 분해 원칙
1. 각 작업은 하나의 에이전트가 담당할 수 있어야 함
2. 작업 간 의존성을 명확히 표시
3. 우선순위를 설정 (1: 최우선, 5: 낮음)
4. 각 작업의 예상 출력을 명시

응답 형식 (JSON):
{
  "tasks": [
    {
      "id": "task-1",
      "description": "일본 시장 매출 데이터 분석",
      "agent": "data-analyst",
      "dependencies": [],
      "priority": 1,
      "expectedOutput": "일본 시장 매출 트렌드, 전기 대비 변화율, 주요 작가 기여도"
    },
    {
      "id": "task-2",
      "description": "일본 시장 마케팅 캠페인 성과 분석",
      "agent": "marketing-strategist",
      "dependencies": ["task-1"],
      "priority": 2,
      "expectedOutput": "캠페인별 성과, ROI, 타겟 세그먼트 분석"
    }
  ],
  "coordination": "sequential",
  "estimatedTime": 30
}
`

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: '당신은 복잡한 작업을 효율적으로 분해하고 조율하는 전문가입니다. 작업 간 의존성과 우선순위를 정확히 파악합니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })

      const decomposition = JSON.parse(
        response.choices[0]?.message?.content || '{}'
      ) as TaskDecomposition

      // 검증 및 정규화
      if (!decomposition.tasks || decomposition.tasks.length === 0) {
        return this.fallbackDecomposition(query)
      }

      return decomposition
    } catch (error: any) {
      console.error('[EnhancedAgentOrchestrator] 작업 분해 실패:', error.message)
      return this.fallbackDecomposition(query)
    }
  }

  /**
   * 폴백 작업 분해 (키워드 기반)
   */
  private fallbackDecomposition(query: string): TaskDecomposition {
    const lowerQuery = query.toLowerCase()
    const tasks: Task[] = []
    let taskId = 1

    // 데이터 분석 필요 여부
    if (lowerQuery.includes('매출') || lowerQuery.includes('주문') || lowerQuery.includes('데이터')) {
      tasks.push({
        id: `task-${taskId++}`,
        description: query,
        agent: 'data-analyst',
        dependencies: [],
        priority: 1,
        expectedOutput: '데이터 분석 결과'
      })
    }

    // 마케팅 분석 필요 여부
    if (lowerQuery.includes('마케팅') || lowerQuery.includes('캠페인') || lowerQuery.includes('고객')) {
      tasks.push({
        id: `task-${taskId++}`,
        description: query,
        agent: 'marketing-strategist',
        dependencies: tasks.length > 0 ? [tasks[0].id] : [],
        priority: 2,
        expectedOutput: '마케팅 분석 결과'
      })
    }

    // 기본값: 데이터 분석가
    if (tasks.length === 0) {
      tasks.push({
        id: 'task-1',
        description: query,
        agent: 'data-analyst',
        dependencies: [],
        priority: 1,
        expectedOutput: '분석 결과'
      })
    }

    return {
      tasks,
      coordination: tasks.length > 1 ? 'sequential' : 'parallel',
      estimatedTime: tasks.length * 5
    }
  }

  /**
   * 에이전트 간 메시지 전송
   */
  async sendMessage(
    from: AgentRole,
    to: AgentRole | 'all',
    message: AgentMessage
  ): Promise<void> {
    const context = this.sharedContexts.get(message.taskId)
    if (!context) return

    context.messages.push(message)

    // 수신 에이전트에게 알림
    if (to === 'all') {
      this.agents.forEach((agent, role) => {
        if (role !== from && 'receiveMessage' in agent) {
          (agent as any).receiveMessage(message)
        }
      })
    } else {
      const recipient = this.agents.get(to)
      if (recipient && 'receiveMessage' in recipient) {
        (recipient as any).receiveMessage(message)
      }
    }
  }

  /**
   * 중간 결과 저장 및 공유
   */
  async shareIntermediateResult(
    taskId: string,
    resultKey: string,
    result: any
  ): Promise<void> {
    const context = this.sharedContexts.get(taskId)
    if (!context) return

    context.intermediateResults.set(resultKey, result)

    // 관련 에이전트에게 알림
    const notification: AgentMessage = {
      from: 'orchestrator',
      to: 'all',
      type: 'notification',
      content: {
        message: `중간 결과 업데이트: ${resultKey}`,
        result: result
      },
      taskId,
      timestamp: new Date()
    }

    await this.sendMessage('orchestrator', 'all', notification)
  }

  /**
   * 복잡한 질문 처리
   */
  async orchestrateComplexQuery(
    query: string,
    context: AgentContext = {}
  ): Promise<OrchestratedResult> {
    const startTime = Date.now()

    // 1. 작업 분해
    const decomposition = await this.decomposeTask(query, context)
    const taskId = `task-${Date.now()}`

    // 2. 공유 컨텍스트 생성
    const sharedContext: SharedContext = {
      taskId,
      messages: [],
      intermediateResults: new Map()
    }
    this.sharedContexts.set(taskId, sharedContext)

    // 3. 작업 실행 (의존성 고려)
    const taskResults: Map<string, any> = new Map()
    const executedTasks = new Set<string>()

    try {
      // 우선순위 및 의존성 기반 실행
      while (executedTasks.size < decomposition.tasks.length) {
        const readyTasks = decomposition.tasks.filter(
          task =>
            !executedTasks.has(task.id) &&
            task.dependencies.every(dep => executedTasks.has(dep))
        )

        if (readyTasks.length === 0) {
          throw new Error('순환 의존성 또는 실행 불가능한 작업 감지')
        }

        // 우선순위 순으로 정렬
        readyTasks.sort((a, b) => a.priority - b.priority)

        // 병렬 실행 가능한 작업은 동시 실행
        const parallelTasks = readyTasks.filter(
          task => task.priority === readyTasks[0].priority
        )

        const promises = parallelTasks.map(async task => {
          const agent = this.agents.get(task.agent)
          if (!agent) {
            throw new Error(`에이전트를 찾을 수 없음: ${task.agent}`)
          }

          // 중간 결과를 컨텍스트에 포함
          const taskContext: AgentContext = {
            ...context,
            sharedContext,
            previousResults: Array.from(taskResults.entries()).map(([k, v]) => ({
              taskId: k,
              result: v
            }))
          }

          const result = await agent.process(task.description, taskContext)

          // 중간 결과 저장
          taskResults.set(task.id, result)
          await this.shareIntermediateResult(taskId, task.id, result)

          executedTasks.add(task.id)

          return { taskId: task.id, result }
        })

        await Promise.all(promises)
      }

      // 4. 결과 통합
      const integratedResult = await this.integrateResults(
        decomposition,
        taskResults,
        query
      )

      sharedContext.finalResult = integratedResult

      return {
        ...integratedResult,
        agentsUsed: decomposition.tasks.map(t => t.agent),
        executionTime: (Date.now() - startTime) / 1000 // 초 단위
      }
    } catch (error: any) {
      console.error('[EnhancedAgentOrchestrator] 작업 실행 오류:', error.message)
      throw error
    } finally {
      // 컨텍스트 정리 (선택적)
      // this.sharedContexts.delete(taskId)
    }
  }

  /**
   * 결과 통합 (LLM 기반)
   */
  private async integrateResults(
    decomposition: TaskDecomposition,
    taskResults: Map<string, any>,
    originalQuery: string
  ): Promise<Omit<OrchestratedResult, 'agentsUsed' | 'executionTime'>> {
    const client = this.getOpenAIClient()
    
    if (!client) {
      // 폴백: 단순 병합
      return this.fallbackIntegration(taskResults)
    }

    const prompt = `
원래 질문: "${originalQuery}"

다음 작업들의 결과를 종합하여 최종 답변을 생성하세요:

${Array.from(taskResults.entries()).map(([taskId, result]) => {
      const task = decomposition.tasks.find(t => t.id === taskId)
      return `
## 작업: ${task?.description || taskId}
에이전트: ${task?.agent || 'unknown'}
결과:
${JSON.stringify(result, null, 2)}
`
    }).join('\n')}

## 통합 지침
1. 모든 작업 결과를 종합하여 일관된 답변 생성
2. 모순되는 결과가 있으면 설명
3. 우선순위가 높은 작업의 결과를 더 강조
4. 실행 가능한 액션 아이템 제시
5. 추가 분석이 필요한 부분 명시

응답 형식 (JSON):
{
  "primaryResponse": "종합 답변 (2-3문단)",
  "supplementaryInsights": ["보조 인사이트1", "보조 인사이트2"],
  "actions": [
    {
      "label": "액션 라벨",
      "action": "navigate",
      "data": {
        "href": "/path"
      }
    }
  ],
  "charts": [],
  "confidence": 85
}
`

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: '당신은 여러 분석 결과를 종합하여 명확하고 실행 가능한 답변을 제공하는 전문가입니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })

      const integrated = JSON.parse(
        response.choices[0]?.message?.content || '{}'
      ) as Omit<OrchestratedResult, 'agentsUsed' | 'executionTime'>

      return integrated
    } catch (error: any) {
      console.error('[EnhancedAgentOrchestrator] 결과 통합 실패:', error.message)
      return this.fallbackIntegration(taskResults)
    }
  }

  /**
   * 폴백 결과 통합 (단순 병합)
   */
  private fallbackIntegration(
    taskResults: Map<string, any>
  ): Omit<OrchestratedResult, 'agentsUsed' | 'executionTime'> {
    const results = Array.from(taskResults.values())
    
    if (results.length === 0) {
      return {
        primaryResponse: '분석 결과가 없습니다.',
        confidence: 0
      }
    }

    const primaryResult = results[0]
    
    return {
      primaryResponse: primaryResult.response || '분석 완료',
      supplementaryInsights: results.slice(1).map(r => r.response).filter(Boolean),
      combinedData: primaryResult.data,
      charts: primaryResult.charts,
      actions: primaryResult.actions,
      confidence: 70
    }
  }
}

// 싱글톤 인스턴스
export const enhancedAgentOrchestrator = new EnhancedAgentOrchestrator()


