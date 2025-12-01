import { DataAnalystAgent } from './DataAnalystAgent'
import { PerformanceMarketerAgent } from './PerformanceMarketerAgent'
import { BusinessManagerAgent } from './BusinessManagerAgent'
import { AgentContext } from './BaseAgent'

export type AgentType = 'data_analyst' | 'performance_marketer' | 'business_manager' | 'auto'

export class AgentRouter {
  private dataAnalyst: DataAnalystAgent
  private performanceMarketer: PerformanceMarketerAgent
  private businessManager: BusinessManagerAgent

  constructor(context: AgentContext = {}) {
    this.dataAnalyst = new DataAnalystAgent(context)
    this.performanceMarketer = new PerformanceMarketerAgent(context)
    this.businessManager = new BusinessManagerAgent(context)
  }

  /**
   * Agent 선택 및 라우팅
   */
  async route(query: string, agentType: AgentType = 'auto', context: AgentContext = {}): Promise<{
    agent: string
    response: string
    data?: any
    charts?: any[]
    actions?: Array<{ label: string; action: string; data?: any }>
  }> {
    // Agent 타입 결정
    const selectedAgentType = agentType === 'auto' ? await this.classifyIntent(query) : agentType

    // 적절한 Agent 선택
    let agent: DataAnalystAgent | PerformanceMarketerAgent | BusinessManagerAgent
    let agentName: string

    switch (selectedAgentType) {
      case 'data_analyst':
        agent = this.dataAnalyst
        agentName = '데이터 분석가'
        break
      case 'performance_marketer':
        agent = this.performanceMarketer
        agentName = '퍼포먼스 마케터'
        break
      case 'business_manager':
        agent = this.businessManager
        agentName = '비즈니스 매니저'
        break
      default:
        agent = this.dataAnalyst
        agentName = '데이터 분석가'
    }

    // Agent 실행
    const result = await agent.process(query, context)

    return {
      agent: agentName,
      ...result,
    }
  }

  /**
   * 의도 분류 (자동 Agent 선택)
   */
  private async classifyIntent(query: string): Promise<AgentType> {
    const lowerQuery = query.toLowerCase()

    // Performance Marketer 키워드
    const marketerKeywords = [
      '트렌드',
      '소재',
      '마케팅',
      '카피',
      '콘텐츠',
      '세그먼트',
      '고객 그룹',
      '캠페인',
      '마케터',
      'trend',
      'marketing',
      'copy',
      'content',
      'segment',
      'campaign',
    ]

    // Business Manager 키워드
    const managerKeywords = [
      '전략',
      '예측',
      '시뮬레이션',
      '시나리오',
      '인사이트',
      '목표',
      '성장',
      'strategy',
      'predict',
      'simulation',
      'scenario',
      'insight',
      'goal',
      'growth',
    ]

    // Data Analyst 키워드 (기본값)
    const analystKeywords = [
      '분석',
      '데이터',
      '조회',
      '통계',
      '집계',
      '비교',
      '랭킹',
      '상위',
      'analysis',
      'data',
      'query',
      'statistics',
      'aggregate',
      'compare',
      'ranking',
      'top',
    ]

    const marketerScore = marketerKeywords.filter((kw) => lowerQuery.includes(kw)).length
    const managerScore = managerKeywords.filter((kw) => lowerQuery.includes(kw)).length
    const analystScore = analystKeywords.filter((kw) => lowerQuery.includes(kw)).length

    if (marketerScore > managerScore && marketerScore > analystScore) {
      return 'performance_marketer'
    }

    if (managerScore > marketerScore && managerScore > analystScore) {
      return 'business_manager'
    }

    return 'data_analyst' // 기본값
  }

  /**
   * 사용 가능한 Agent 목록 반환
   */
  getAvailableAgents(): Array<{ type: AgentType; name: string; description: string }> {
    return [
      {
        type: 'data_analyst',
        name: '데이터 분석가',
        description: '데이터 조회, 분석, 통계, 트렌드 분석 등을 수행합니다.',
      },
      {
        type: 'performance_marketer',
        name: '퍼포먼스 마케터',
        description: '트렌드 추출, 마케팅 카피 생성, CRM 세그먼트 생성 등을 수행합니다.',
      },
      {
        type: 'business_manager',
        name: '비즈니스 매니저',
        description: '전략 수립, 메트릭 예측, 시나리오 시뮬레이션 등을 수행합니다.',
      },
      {
        type: 'auto',
        name: '자동 선택',
        description: '질문 내용에 따라 자동으로 적절한 Agent를 선택합니다.',
      },
    ]
  }
}




