/**
 * 질문 카테고리 분류 및 Flow 정의
 */

export enum QuestionCategory {
  // 데이터 조회
  DATA_QUERY = 'data_query',
  // 분석 요청
  ANALYSIS_REQUEST = 'analysis_request',
  // 전략 제안
  STRATEGY_SUGGESTION = 'strategy_suggestion',
  // 인사이트 요청
  INSIGHT_REQUEST = 'insight_request',
  // 액션 실행
  ACTION_EXECUTION = 'action_execution',
  // 페이지 네비게이션
  PAGE_NAVIGATION = 'page_navigation',
  // 복합 질문 (여러 카테고리 포함)
  COMPLEX_QUERY = 'complex_query'
}

export type AgentRole = 
  | 'data-analyst' 
  | 'performance-marketer' 
  | 'business-manager' 
  | 'business-brain'
  | 'orchestrator'

export interface FlowStep {
  stepId: string
  agent: AgentRole
  description: string
  dependencies: string[]
  expectedOutput: string
}

export interface CategoryFlow {
  category: QuestionCategory
  requiredAgents: AgentRole[]
  executionOrder: 'sequential' | 'parallel' | 'hybrid'
  flowSteps: FlowStep[]
}

