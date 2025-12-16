/**
 * Node 기반 Agent 워크플로우 시스템
 * 각 Agent를 Node로 표현하고, 의존성과 실행 순서를 그래프로 관리
 */

import { BaseAgent, AgentContext } from './BaseAgent'
import { DataAnalystAgent } from './DataAnalystAgent'
import { PerformanceMarketerAgent } from './PerformanceMarketerAgent'
import { BusinessManagerAgent } from './BusinessManagerAgent'
import { BusinessBrainAgent } from './BusinessBrainAgent'
import { EnhancedDateParser, DateRange } from './EnhancedDateParser'

export type AgentNodeType = 'data-analyst' | 'performance-marketer' | 'business-manager' | 'business-brain'

export interface AgentNode {
  id: string
  type: AgentNodeType
  agent: BaseAgent
  description: string
  inputs: string[] // 이전 노드의 출력을 입력으로 사용
  outputs: string[] // 이 노드가 생성하는 출력
  dependencies: string[] // 의존하는 노드 ID
}

export interface WorkflowResult {
  nodeId: string
  type: AgentNodeType
  result: {
    response: string
    data?: any
    charts?: any[]
    actions?: Array<{ label: string; action: string; data?: any }>
  }
  executionTime: number
  dateRange?: DateRange
}

export interface WorkflowExecution {
  nodes: AgentNode[]
  results: Map<string, WorkflowResult>
  executionOrder: string[]
  totalTime: number
}

export class NodeBasedWorkflow {
  private nodes: Map<string, AgentNode> = new Map()
  private dateParser: EnhancedDateParser

  constructor() {
    this.dateParser = new EnhancedDateParser()
    this.initializeNodes()
  }

  /**
   * 기본 노드 초기화
   */
  private initializeNodes() {
    // 1. 데이터 분석가 노드
    this.addNode({
      id: 'data-analyst',
      type: 'data-analyst',
      agent: new DataAnalystAgent(),
      description: '데이터 조회 및 분석',
      inputs: ['query', 'dateRange'],
      outputs: ['data', 'analysis'],
      dependencies: []
    })

    // 2. 퍼포먼스 마케터 노드
    this.addNode({
      id: 'performance-marketer',
      type: 'performance-marketer',
      agent: new PerformanceMarketerAgent(),
      description: '마케팅 성과 분석',
      inputs: ['data', 'analysis'],
      outputs: ['marketing-insights', 'recommendations'],
      dependencies: ['data-analyst']
    })

    // 3. 비즈니스 매니저 노드
    this.addNode({
      id: 'business-manager',
      type: 'business-manager',
      agent: new BusinessManagerAgent(),
      description: '비즈니스 전략 수립',
      inputs: ['data', 'analysis', 'marketing-insights'],
      outputs: ['strategy', 'action-items'],
      dependencies: ['data-analyst', 'performance-marketer']
    })

    // 4. 비즈니스 브레인 노드
    this.addNode({
      id: 'business-brain',
      type: 'business-brain',
      agent: new BusinessBrainAgent(),
      description: '종합 인사이트 생성',
      inputs: ['data', 'analysis', 'marketing-insights', 'strategy'],
      outputs: ['comprehensive-insights', 'final-recommendations'],
      dependencies: ['data-analyst', 'performance-marketer', 'business-manager']
    })
  }

  /**
   * 노드 추가
   */
  addNode(node: AgentNode) {
    this.nodes.set(node.id, node)
  }

  /**
   * 노드 제거
   */
  removeNode(nodeId: string) {
    this.nodes.delete(nodeId)
  }

  /**
   * 워크플로우 실행 (의존성 기반 순서 결정)
   */
  async executeWorkflow(
    query: string,
    context: AgentContext = {}
  ): Promise<WorkflowExecution> {
    const startTime = Date.now()
    const results = new Map<string, WorkflowResult>()
    const executionOrder: string[] = []

    // 1. 날짜 범위 추출 (모든 노드에서 공통 사용)
    const dateRange = this.dateParser.parseDateRange(query)
    if (dateRange) {
      console.log('[NodeBasedWorkflow] 날짜 범위 파싱:', {
        query,
        parsed: dateRange,
        currentDate: this.dateParser.getCurrentDateString()
      })
    }

    // 2. 실행 순서 결정 (위상 정렬)
    const executionOrderNodes = this.topologicalSort()

    // 3. 각 노드 순차 실행
    for (const nodeId of executionOrderNodes) {
      const node = this.nodes.get(nodeId)
      if (!node) continue

      const nodeStartTime = Date.now()

      try {
        // 이전 노드들의 결과 수집
        const nodeContext = this.buildNodeContext(node, results, query, dateRange, context)

        // 노드 실행
        const result = await node.agent.process(query, nodeContext)

        const executionTime = Date.now() - nodeStartTime

        results.set(nodeId, {
          nodeId,
          type: node.type,
          result,
          executionTime,
          dateRange: dateRange || undefined
        })

        executionOrder.push(nodeId)

        console.log(`[NodeBasedWorkflow] 노드 실행 완료: ${nodeId} (${executionTime}ms)`)
      } catch (error: any) {
        console.error(`[NodeBasedWorkflow] 노드 실행 실패: ${nodeId}`, error)
        // 에러가 발생해도 다음 노드 계속 실행
        results.set(nodeId, {
          nodeId,
          type: node.type,
          result: {
            response: `오류가 발생했습니다: ${error.message}`,
          },
          executionTime: Date.now() - nodeStartTime,
          dateRange: dateRange || undefined
        })
        executionOrder.push(nodeId)
      }
    }

    return {
      nodes: Array.from(this.nodes.values()),
      results,
      executionOrder,
      totalTime: Date.now() - startTime
    }
  }

  /**
   * 위상 정렬 (의존성 기반 실행 순서 결정)
   */
  private topologicalSort(): string[] {
    const visited = new Set<string>()
    const tempMark = new Set<string>()
    const result: string[] = []

    const visit = (nodeId: string) => {
      if (tempMark.has(nodeId)) {
        // 순환 의존성 감지
        console.warn(`[NodeBasedWorkflow] 순환 의존성 감지: ${nodeId}`)
        return
      }
      if (visited.has(nodeId)) return

      tempMark.add(nodeId)
      const node = this.nodes.get(nodeId)
      if (node) {
        for (const dep of node.dependencies) {
          visit(dep)
        }
      }
      tempMark.delete(nodeId)
      visited.add(nodeId)
      result.push(nodeId)
    }

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        visit(nodeId)
      }
    }

    return result
  }

  /**
   * 노드 컨텍스트 구축 (이전 노드들의 결과를 입력으로 전달)
   */
  private buildNodeContext(
    node: AgentNode,
    results: Map<string, WorkflowResult>,
    query: string,
    dateRange: DateRange | undefined,
    baseContext: AgentContext
  ): AgentContext {
    const context: AgentContext = {
      ...baseContext,
      query,
      dateRange: dateRange ? {
        start: dateRange.start,
        end: dateRange.end
      } : undefined
    }

    // 의존 노드들의 결과 수집
    const dependencyResults: any = {}
    for (const depId of node.dependencies) {
      const depResult = results.get(depId)
      if (depResult) {
        dependencyResults[depId] = {
          data: depResult.result.data,
          response: depResult.result.response,
          charts: depResult.result.charts,
          actions: depResult.result.actions
        }
      }
    }

    // 노드의 입력에 맞게 컨텍스트 구성
    if (node.inputs.includes('data')) {
      context.previousData = dependencyResults['data-analyst']?.data
    }
    if (node.inputs.includes('analysis')) {
      context.previousAnalysis = dependencyResults['data-analyst']?.response
    }
    if (node.inputs.includes('marketing-insights')) {
      context.previousMarketingInsights = dependencyResults['performance-marketer']?.response
    }
    if (node.inputs.includes('strategy')) {
      context.previousStrategy = dependencyResults['business-manager']?.response
    }

    // 모든 의존 결과를 통합
    context.dependencyResults = dependencyResults

    return context
  }

  /**
   * 워크플로우 결과 통합
   */
  async integrateResults(execution: WorkflowExecution, originalQuery: string): Promise<{
    response: string
    data?: any
    charts?: any[]
    actions?: Array<{ label: string; action: string; data?: any }>
  }> {
    const { results, executionOrder } = execution

    // 최종 노드의 결과를 기본으로 사용
    const finalNodeId = executionOrder[executionOrder.length - 1]
    const finalResult = results.get(finalNodeId)

    if (!finalResult) {
      return {
        response: '워크플로우 실행 결과가 없습니다.'
      }
    }

    // 모든 노드의 결과를 통합
    const allData: any[] = []
    const allCharts: any[] = []
    const allActions: Array<{ label: string; action: string; data?: any }> = []

    for (const nodeId of executionOrder) {
      const result = results.get(nodeId)
      if (result) {
        if (result.result.data) {
          if (Array.isArray(result.result.data)) {
            allData.push(...result.result.data)
          } else {
            allData.push(result.result.data)
          }
        }
        if (result.result.charts) {
          allCharts.push(...result.result.charts)
        }
        if (result.result.actions) {
          allActions.push(...result.result.actions)
        }
      }
    }

    // 중복 제거
    const uniqueActions = Array.from(
      new Map(allActions.map(a => [a.label, a])).values()
    )

    return {
      response: finalResult.result.response,
      data: allData.length > 0 ? allData : finalResult.result.data,
      charts: allCharts.length > 0 ? allCharts : finalResult.result.charts,
      actions: uniqueActions.length > 0 ? uniqueActions : finalResult.result.actions
    }
  }

  /**
   * 필요한 노드만 선택하여 실행 (최적화)
   */
  async executeSelectiveWorkflow(
    query: string,
    requiredNodeTypes: AgentNodeType[],
    context: AgentContext = {}
  ): Promise<WorkflowExecution> {
    // 필요한 노드만 필터링
    const requiredNodes = Array.from(this.nodes.values())
      .filter(node => requiredNodeTypes.includes(node.type))

    // 임시 워크플로우 생성
    const tempWorkflow = new NodeBasedWorkflow()
    for (const node of requiredNodes) {
      tempWorkflow.addNode(node)
    }

    return tempWorkflow.executeWorkflow(query, context)
  }
}

// 싱글톤 인스턴스
export const nodeBasedWorkflow = new NodeBasedWorkflow()


