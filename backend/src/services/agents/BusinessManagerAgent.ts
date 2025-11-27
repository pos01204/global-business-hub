import { BaseAgent, AgentContext } from './BaseAgent'
import { openaiService } from '../openaiService'

export class BusinessManagerAgent extends BaseAgent {
  private systemPrompt = `당신은 비즈니스 매니저 전문가입니다.
정제된 데이터를 바탕으로 판매 전략을 수립하고, 비즈니스 의사결정을 지원합니다.

주요 역할:
1. 비즈니스 전략 분석 및 제안
2. 비즈니스 메트릭 예측
3. 비즈니스 시나리오 시뮬레이션
4. 데이터 기반 비즈니스 인사이트 생성

답변은 한국어로 작성하세요.`

  async process(query: string, context: AgentContext = {}): Promise<{
    response: string
    data?: any
    charts?: any[]
    actions?: Array<{ label: string; action: string; data?: any }>
  }> {
    try {
      const intent = await this.analyzeIntent(query)

      switch (intent.type) {
        case 'analyze_strategy':
          return await this.analyzeStrategy(intent.params)
        case 'predict_metrics':
          return await this.predictMetrics(intent.params)
        case 'simulate_scenario':
          return await this.simulateScenario(intent.params)
        case 'generate_insights':
          return await this.generateInsights(intent.params)
        default:
          return await this.handleGeneralQuery(query)
      }
    } catch (error: any) {
      return {
        response: `비즈니스 분석 중 오류가 발생했습니다: ${error.message}`,
      }
    }
  }

  /**
   * 전략 분석
   */
  private async analyzeStrategy(params: {
    focusArea?: string
    goals?: string[]
  }): Promise<{
    response: string
    data?: any
    charts?: any[]
    actions?: Array<{ label: string; action: string; data?: any }>
  }> {
    const { focusArea = 'sales', goals = [] } = params

    // 현재 상태 분석
    const currentState = await this.analyzeCurrentState(focusArea)

    // 전략 제안 생성
    const strategies = await this.generateStrategies(currentState, focusArea, goals)

    return {
      response: strategies.response,
      data: {
        currentState,
        strategies: strategies.data,
      },
      charts: await this.createStrategyCharts(currentState, strategies.data),
      actions: [
        {
          label: '전략 상세 보기',
          action: 'view_strategy',
          data: { strategies: strategies.data },
        },
      ],
    }
  }

  /**
   * 메트릭 예측
   */
  private async predictMetrics(params: {
    metrics?: string[]
    timeHorizon?: string
  }): Promise<{
    response: string
    data?: any
    charts?: any[]
    actions?: Array<{ label: string; action: string; data?: any }>
  }> {
    const { metrics = ['revenue', 'orders'], timeHorizon = '3months' } = params

    // 과거 데이터 조회
    const historicalData = await this.getHistoricalData(timeHorizon)

    // 예측 수행
    const predictions = await this.performPrediction(historicalData, metrics, timeHorizon)

    // 예측 설명 생성
    const explanation = await this.generatePredictionExplanation(predictions, timeHorizon)

    return {
      response: explanation,
      data: predictions,
      charts: await this.createPredictionCharts(predictions),
    }
  }

  /**
   * 시나리오 시뮬레이션
   */
  private async simulateScenario(params: {
    scenario?: any
  }): Promise<{
    response: string
    data?: any
    charts?: any[]
    actions?: Array<{ label: string; action: string; data?: any }>
  }> {
    const { scenario } = params

    // 현재 상태 조회
    const currentState = await this.getCurrentState()

    // 시나리오 시뮬레이션
    const simulation = await this.performSimulation(currentState, scenario)

    // 시뮬레이션 결과 설명
    const explanation = await this.generateSimulationExplanation(simulation, scenario)

    return {
      response: explanation,
      data: simulation,
      charts: await this.createSimulationCharts(simulation),
    }
  }

  /**
   * 인사이트 생성
   */
  private async generateInsights(params: {
    focus?: string
  }): Promise<{
    response: string
    data?: any
    charts?: any[]
    actions?: Array<{ label: string; action: string; data?: any }>
  }> {
    const { focus = 'sales' } = params

    // 데이터 조회 및 분석
    const analysis = await this.performComprehensiveAnalysis(focus)

    // 인사이트 생성
    const insights = await this.generateBusinessInsights(analysis, focus)

    return {
      response: insights,
      data: analysis,
      charts: await this.createInsightCharts(analysis),
    }
  }

  /**
   * 의도 분석
   */
  private async analyzeIntent(query: string): Promise<{
    type: string
    params: any
  }> {
    const lowerQuery = query.toLowerCase()

    if (lowerQuery.includes('전략') || lowerQuery.includes('strategy')) {
      return {
        type: 'analyze_strategy',
        params: {
          focusArea: lowerQuery.includes('매출') ? 'sales' : lowerQuery.includes('성장') ? 'growth' : 'sales',
          goals: [],
        },
      }
    }

    if (lowerQuery.includes('예측') || lowerQuery.includes('predict') || lowerQuery.includes('전망')) {
      return {
        type: 'predict_metrics',
        params: {
          timeHorizon: this.extractTimeHorizon(query),
        },
      }
    }

    if (lowerQuery.includes('시뮬레이션') || lowerQuery.includes('시나리오') || lowerQuery.includes('시뮬')) {
      return {
        type: 'simulate_scenario',
        params: {},
      }
    }

    if (lowerQuery.includes('인사이트') || lowerQuery.includes('insight')) {
      return {
        type: 'generate_insights',
        params: {},
      }
    }

    return {
      type: 'general',
      params: {},
    }
  }

  /**
   * 현재 상태 분석
   */
  private async analyzeCurrentState(focusArea: string): Promise<any> {
    const dateRange = this.getRecentDateRange(30)

    const ordersData = await this.getData({
      sheet: 'order',
      dateRange,
    })

    if (!ordersData.success) {
      return {}
    }

    const orders = ordersData.data || []

    // 기본 메트릭 계산
    const totalGmv = orders.reduce((sum: number, o: any) => sum + (Number(o['Total GMV']) || 0), 0)
    const orderCount = orders.length
    const avgOrderValue = orderCount > 0 ? totalGmv / orderCount : 0

    // 플랫폼별 분포
    const platformGroups = new Map<string, number>()
    for (const order of orders) {
      const platform = order.platform || '기타'
      platformGroups.set(platform, (platformGroups.get(platform) || 0) + Number(order['Total GMV']) || 0)
    }

    // 국가별 분포 (logistics 데이터 필요)
    const logisticsData = await this.getData({
      sheet: 'logistics',
      dateRange,
    })

    const countryGroups = new Map<string, number>()
    if (logisticsData.success && logisticsData.data) {
      for (const item of logisticsData.data) {
        const country = item.country || '기타'
        countryGroups.set(country, (countryGroups.get(country) || 0) + 1)
      }
    }

    return {
      metrics: {
        totalGmv,
        orderCount,
        avgOrderValue,
      },
      platformDistribution: Array.from(platformGroups.entries()).map(([platform, gmv]) => ({
        platform,
        gmv,
        percentage: (gmv / totalGmv) * 100,
      })),
      countryDistribution: Array.from(countryGroups.entries()).map(([country, count]) => ({
        country,
        count,
      })),
    }
  }

  /**
   * 전략 생성
   */
  private async generateStrategies(
    currentState: any,
    focusArea: string,
    goals: string[]
  ): Promise<{ response: string; data: any[] }> {
    const prompt = `${this.systemPrompt}

현재 비즈니스 상태:
${JSON.stringify(currentState, null, 2)}

집중 영역: ${focusArea}
목표: ${goals.length > 0 ? goals.join(', ') : '매출 증대'}

위 정보를 바탕으로 구체적인 비즈니스 전략을 제안해주세요.
각 전략에 대해 다음을 포함해주세요:
1. 전략명
2. 설명
3. 구체적인 액션 아이템
4. 예상 효과
5. 실행 기간
6. 성공 지표

JSON 형식으로 반환해주세요:
{
  "strategies": [
    {
      "name": "전략명",
      "description": "설명",
      "actions": ["액션1", "액션2"],
      "expectedImpact": {
        "revenueIncrease": 0.15,
        "timeToImpact": "3months"
      },
      "successMetrics": ["지표1", "지표2"]
    }
  ],
  "summary": "전략 요약"
}`

    const response = await this.openaiService.generate(prompt, {
      temperature: 0.7,
      maxTokens: 2000,
    })

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(response)

      return {
        response: parsed.summary || response,
        data: parsed.strategies || [],
      }
    } catch {
      return {
        response,
        data: [],
      }
    }
  }

  /**
   * 예측 수행
   */
  private async performPrediction(
    historicalData: any[],
    metrics: string[],
    timeHorizon: string
  ): Promise<any> {
    // 간단한 선형 추세 예측
    const predictions: any = {}

    if (metrics.includes('revenue')) {
      const recentGmv = historicalData
        .slice(-30)
        .reduce((sum: number, d: any) => sum + (d.gmv || 0), 0)
      const avgDailyGmv = recentGmv / 30

      const days = this.parseTimeHorizon(timeHorizon)
      const predictedGmv = avgDailyGmv * days

      predictions.revenue = {
        baseline: predictedGmv,
        optimistic: predictedGmv * 1.2,
        pessimistic: predictedGmv * 0.8,
        confidence: 0.75,
      }
    }

    if (metrics.includes('orders')) {
      const recentOrders = historicalData.slice(-30).reduce((sum: number, d: any) => sum + (d.orderCount || 0), 0)
      const avgDailyOrders = recentOrders / 30

      const days = this.parseTimeHorizon(timeHorizon)
      const predictedOrders = avgDailyOrders * days

      predictions.orders = {
        baseline: predictedOrders,
        optimistic: predictedOrders * 1.2,
        pessimistic: predictedOrders * 0.8,
        confidence: 0.75,
      }
    }

    return predictions
  }

  /**
   * 헬퍼 메서드들
   */
  private async getHistoricalData(timeHorizon: string): Promise<any[]> {
    const days = this.parseTimeHorizon(timeHorizon) * 2 // 더 많은 데이터 수집
    const dateRange = this.getRecentDateRange(days)

    const ordersData = await this.getData({
      sheet: 'order',
      dateRange,
    })

    if (!ordersData.success) return []

    // 일별 집계
    const dailyGroups = new Map<string, any[]>()

    for (const order of ordersData.data || []) {
      const dateKey = new Date(order.order_created).toISOString().split('T')[0]
      if (!dailyGroups.has(dateKey)) {
        dailyGroups.set(dateKey, [])
      }
      dailyGroups.get(dateKey)!.push(order)
    }

    return Array.from(dailyGroups.entries())
      .map(([date, orders]) => {
        const gmv = orders.reduce((sum: number, o: any) => sum + (Number(o['Total GMV']) || 0), 0)
        return {
          date,
          gmv,
          orderCount: orders.length,
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  private async getCurrentState(): Promise<any> {
    return await this.analyzeCurrentState('sales')
  }

  private async performSimulation(currentState: any, scenario: any): Promise<any> {
    // 간단한 시뮬레이션 로직
    return {
      baseline: currentState.metrics,
      scenario: {
        ...currentState.metrics,
        totalGmv: currentState.metrics.totalGmv * 1.1, // 예시: 10% 증가
      },
      change: {
        revenue: 0.1,
      },
    }
  }

  private async performComprehensiveAnalysis(focus: string): Promise<any> {
    const currentState = await this.analyzeCurrentState(focus)
    return currentState
  }

  private async generatePredictionExplanation(predictions: any, timeHorizon: string): Promise<string> {
    const prompt = `${this.systemPrompt}

다음 예측 결과를 설명해주세요:

예측 기간: ${timeHorizon}
예측 결과:
${JSON.stringify(predictions, null, 2)}

예측 근거와 함께 설명해주세요.
한국어로 작성하세요.`

    return await this.openaiService.generate(prompt, {
      temperature: 0.7,
      maxTokens: 1500,
    })
  }

  private async generateSimulationExplanation(simulation: any, scenario: any): Promise<string> {
    const prompt = `${this.systemPrompt}

다음 시뮬레이션 결과를 설명해주세요:

시뮬레이션 결과:
${JSON.stringify(simulation, null, 2)}

시나리오의 영향과 함께 설명해주세요.
한국어로 작성하세요.`

    return await this.openaiService.generate(prompt, {
      temperature: 0.7,
      maxTokens: 1500,
    })
  }

  private async generateBusinessInsights(analysis: any, focus: string): Promise<string> {
    const prompt = `${this.systemPrompt}

다음 비즈니스 분석 결과를 바탕으로 인사이트를 생성해주세요:

분석 결과:
${JSON.stringify(analysis, null, 2)}

집중 영역: ${focus}

다음을 포함해주세요:
1. 주요 인사이트
2. 기회 포인트
3. 위험 요소
4. 액션 아이템

한국어로 작성하세요.`

    return await this.openaiService.generate(prompt, {
      temperature: 0.7,
      maxTokens: 2000,
    })
  }

  private async createStrategyCharts(currentState: any, strategies: any[]): Promise<any[]> {
    const charts: any[] = []

    if (currentState.platformDistribution) {
      const chart = await this.visualizeData({
        data: currentState.platformDistribution,
        chartType: 'bar',
        xAxis: 'platform',
        yAxis: 'gmv',
        title: '플랫폼별 매출 분포',
      })
      if (chart.success) charts.push(chart.data)
    }

    return charts
  }

  private async createPredictionCharts(predictions: any): Promise<any[]> {
    // 예측 차트 생성 로직
    return []
  }

  private async createSimulationCharts(simulation: any): Promise<any[]> {
    // 시뮬레이션 차트 생성 로직
    return []
  }

  private async createInsightCharts(analysis: any): Promise<any[]> {
    return await this.createStrategyCharts(analysis, [])
  }

  private async handleGeneralQuery(query: string): Promise<{
    response: string
    data?: any
    charts?: any[]
    actions?: Array<{ label: string; action: string; data?: any }>
  }> {
    const prompt = `${this.systemPrompt}

사용자 질문: ${query}

위 질문에 대해 비즈니스 매니저 관점에서 답변해주세요.
한국어로 작성하세요.`

    const response = await this.openaiService.generate(prompt, {
      temperature: 0.7,
      maxTokens: 1000,
    })

    return { response }
  }

  private getRecentDateRange(days: number): { start: string; end: string } {
    const today = new Date()
    const endDate = new Date(today)
    endDate.setHours(23, 59, 59, 999)

    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    }
  }

  private extractTimeHorizon(query: string): string {
    if (query.includes('1개월') || query.includes('1month')) return '1month'
    if (query.includes('3개월') || query.includes('3months')) return '3months'
    if (query.includes('6개월') || query.includes('6months')) return '6months'
    if (query.includes('1년') || query.includes('1year')) return '1year'
    return '3months'
  }

  private parseTimeHorizon(timeHorizon: string): number {
    const match = timeHorizon.match(/(\d+)(month|year|day)/i)
    if (!match) return 90

    const value = parseInt(match[1])
    const unit = match[2].toLowerCase()

    if (unit === 'year') return value * 365
    if (unit === 'month') return value * 30
    return value
  }
}

