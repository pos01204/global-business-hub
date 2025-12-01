import { BaseAgent, AgentContext } from './BaseAgent'
import { openaiService } from '../openaiService'

export class PerformanceMarketerAgent extends BaseAgent {
  private systemPrompt = `당신은 퍼포먼스 마케터 전문가입니다.
판매 데이터를 분석하여 마케팅 소재를 추출하고, 콘텐츠를 생성하며, CRM 세그먼트를 추출합니다.

주요 역할:
1. 판매 데이터에서 트렌드 및 소재 추출
2. 소재 기반 마케팅 카피 생성
3. 행동 패턴 기반 CRM 세그먼트 생성
4. 마케팅 성과 분석 및 최적화 제안

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
        case 'extract_trends':
          return await this.extractTrends(intent.params)
        case 'generate_copy':
          return await this.generateCopy(intent.params)
        case 'create_segments':
          return await this.createSegments(intent.params)
        case 'analyze_performance':
          return await this.analyzePerformance(intent.params)
        default:
          return await this.handleGeneralQuery(query)
      }
    } catch (error: any) {
      console.error('[PerformanceMarketerAgent] 오류:', error)
      return {
        response: this.getUserFriendlyErrorMessage(error),
        actions: this.getSuggestedActions(),
      }
    }
  }

  /**
   * 사용자 친화적 에러 메시지
   */
  private getUserFriendlyErrorMessage(error: any): string {
    const errorMessage = error?.message || '알 수 없는 오류'
    
    if (errorMessage.includes('API') || errorMessage.includes('OpenAI')) {
      return '🔄 AI 서비스 연결에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.'
    }
    
    return `마케팅 분석 중 문제가 발생했습니다. 다시 시도해주세요.\n\n💡 시도해볼 수 있는 질문:\n- "최근 트렌드 작품 추출해줘"\n- "VIP 고객 세그먼트 만들어줘"\n- "마케팅 성과 분석해줘"`
  }

  /**
   * 제안 액션
   */
  private getSuggestedActions(): Array<{ label: string; action: string; data?: any }> {
    return [
      { label: '📈 트렌드 분석', action: 'query', data: { query: '최근 30일 트렌드 작품 추출해줘' } },
      { label: '👥 세그먼트 생성', action: 'query', data: { query: 'VIP 고객 세그먼트 만들어줘' } },
      { label: '📊 성과 분석', action: 'query', data: { query: '마케팅 채널별 성과 분석해줘' } },
    ]
  }

  /**
   * 트렌드 추출
   */
  private async extractTrends(params: {
    timeRange?: string
    focus?: string
    trendType?: string
  }): Promise<{
    response: string
    data?: any
    charts?: any[]
    actions?: Array<{ label: string; action: string; data?: any }>
  }> {
    // 날짜 범위 계산
    const dateRange = this.parseTimeRange(params.timeRange || '30d')

    // 데이터 조회
    const orderData = await this.getData({
      sheet: 'order',
      dateRange,
    })

    const logisticsData = await this.getData({
      sheet: 'logistics',
      dateRange,
    })

    if (!orderData.success || !logisticsData.success) {
      return {
        response: '데이터를 조회하는 중 오류가 발생했습니다.',
      }
    }

    // 트렌드 분석
    const trends = await this.analyzeTrends(
      orderData.data || [],
      logisticsData.data || [],
      params.focus || 'products'
    )

    // LLM을 통한 인사이트 생성
    const insights = await this.generateTrendInsights(trends, params.trendType)

    return {
      response: insights,
      data: trends,
      charts: await this.createTrendCharts(trends),
      actions: [
        {
          label: '콘텐츠 생성하기',
          action: 'generate_copy',
          data: { trends },
        },
      ],
    }
  }

  /**
   * 콘텐츠 생성
   */
  private async generateCopy(params: {
    material?: any
    copyType?: string
    tone?: string
    targetAudience?: string
  }): Promise<{
    response: string
    data?: any
    charts?: any[]
    actions?: Array<{ label: string; action: string; data?: any }>
  }> {
    const { material, copyType = 'social', tone = 'casual', targetAudience } = params

    const prompt = `${this.systemPrompt}

다음 소재 정보를 바탕으로 마케팅 카피를 생성해주세요:

소재 정보:
${JSON.stringify(material || {}, null, 2)}

요구사항:
- 콘텐츠 타입: ${copyType}
- 톤앤매너: ${tone}
- 타겟 오디언스: ${targetAudience || '일반 고객'}

${copyType === 'social' ? '소셜 미디어 포스트 형식으로 작성하세요 (200-300자, 해시태그 포함)' : ''}
${copyType === 'email' ? '이메일 뉴스레터 형식으로 작성하세요 (300-500자, 명확한 CTA 포함)' : ''}
${copyType === 'blog' ? '블로그 포스트 형식으로 작성하세요 (800-1200자, SEO 최적화)' : ''}

3가지 변형을 생성해주세요.`

    const copies = await this.openaiService.generate(prompt, {
      temperature: 0.8,
      maxTokens: 2000,
    })

    return {
      response: copies,
      data: {
        copies: this.parseCopies(copies),
        material,
        copyType,
        tone,
      },
    }
  }

  /**
   * CRM 세그먼트 생성
   */
  private async createSegments(params: {
    baseSegment?: string
    criteria?: any
  }): Promise<{
    response: string
    data?: any
    charts?: any[]
    actions?: Array<{ label: string; action: string; data?: any }>
  }> {
    const { baseSegment = 'rfm', criteria } = params

    // 고객 데이터 조회
    const usersData = await this.getData({
      sheet: 'users',
    })

    const ordersData = await this.getData({
      sheet: 'order',
    })

    if (!usersData.success || !ordersData.success) {
      return {
        response: '데이터를 조회하는 중 오류가 발생했습니다.',
      }
    }

    // 세그먼트 생성
    const segments = await this.generateSegments(
      usersData.data || [],
      ordersData.data || [],
      baseSegment,
      criteria
    )

    // 세그먼트 설명 생성
    const description = await this.generateSegmentDescription(segments)

    return {
      response: description,
      data: segments,
      charts: await this.createSegmentCharts(segments),
      actions: [
        {
          label: '세그먼트 내보내기',
          action: 'export_segment',
          data: { segments },
        },
      ],
    }
  }

  /**
   * 성과 분석
   */
  private async analyzePerformance(params: {
    timeRange?: string
    channels?: string[]
  }): Promise<{
    response: string
    data?: any
    charts?: any[]
    actions?: Array<{ label: string; action: string; data?: any }>
  }> {
    const dateRange = this.parseTimeRange(params.timeRange || '30d')

    const ordersData = await this.getData({
      sheet: 'order',
      dateRange,
    })

    if (!ordersData.success) {
      return {
        response: '데이터를 조회하는 중 오류가 발생했습니다.',
      }
    }

    // 채널별 성과 분석
    const performance = await this.analyzeChannelPerformance(ordersData.data || [])

    // 인사이트 생성
    const insights = await this.generatePerformanceInsights(performance)

    return {
      response: insights,
      data: performance,
      charts: await this.createPerformanceCharts(performance),
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

    if (lowerQuery.includes('트렌드') || lowerQuery.includes('소재') || lowerQuery.includes('인기')) {
      return {
        type: 'extract_trends',
        params: {
          timeRange: this.extractTimeRange(query),
          focus: lowerQuery.includes('작가') ? 'artists' : lowerQuery.includes('상품') ? 'products' : 'products',
        },
      }
    }

    if (lowerQuery.includes('카피') || lowerQuery.includes('콘텐츠') || lowerQuery.includes('생성')) {
      return {
        type: 'generate_copy',
        params: {
          copyType: lowerQuery.includes('이메일') ? 'email' : lowerQuery.includes('블로그') ? 'blog' : 'social',
          tone: lowerQuery.includes('전문') ? 'professional' : 'casual',
        },
      }
    }

    if (lowerQuery.includes('세그먼트') || lowerQuery.includes('고객 그룹')) {
      return {
        type: 'create_segments',
        params: {},
      }
    }

    if (lowerQuery.includes('성과') || lowerQuery.includes('성능') || lowerQuery.includes('분석')) {
      return {
        type: 'analyze_performance',
        params: {
          timeRange: this.extractTimeRange(query),
        },
      }
    }

    return {
      type: 'general',
      params: {},
    }
  }

  /**
   * 트렌드 분석
   */
  private async analyzeTrends(
    orders: any[],
    logistics: any[],
    focus: string
  ): Promise<any[]> {
    const trends: any[] = []

    if (focus === 'products' || focus === 'artists') {
      // 작가/상품별 집계
      const groups = new Map<string, any[]>()

      for (const item of logistics) {
        const key = focus === 'artists' ? item['artist_name (kr)'] : item['product_name']
        if (!key) continue

        if (!groups.has(key)) {
          groups.set(key, [])
        }
        groups.get(key)!.push(item)
      }

      // 성장률 계산 (간단한 버전)
      for (const [key, items] of groups.entries()) {
        const totalGmv = items.reduce((sum: number, item: any) => {
          const order = orders.find((o) => o.order_code === item.order_code)
          return sum + (Number(order?.['Total GMV']) || 0)
        }, 0)

        trends.push({
          name: key,
          type: focus === 'artists' ? 'artist' : 'product',
          totalGmv,
          orderCount: items.length,
          avgOrderValue: items.length > 0 ? totalGmv / items.length : 0,
        })
      }

      // 정렬
      trends.sort((a, b) => b.totalGmv - a.totalGmv)
    }

    return trends.slice(0, 20)
  }

  /**
   * 트렌드 인사이트 생성
   */
  private async generateTrendInsights(trends: any[], trendType?: string): Promise<string> {
    const topTrends = trends.slice(0, 5)

    const prompt = `${this.systemPrompt}

다음 트렌드 데이터를 분석하여 마케팅 인사이트를 제공해주세요:

트렌드 데이터:
${JSON.stringify(topTrends, null, 2)}

다음을 포함해주세요:
1. 주요 트렌드 요약
2. 마케팅 기회 포인트
3. 추천 액션 아이템
4. 예상 효과

한국어로 작성하세요.`

    return await this.openaiService.generate(prompt, {
      temperature: 0.7,
      maxTokens: 1500,
    })
  }

  /**
   * 세그먼트 생성
   */
  private async generateSegments(
    users: any[],
    orders: any[],
    baseSegment: string,
    criteria?: any
  ): Promise<any[]> {
    // RFM 분석 기반 세그먼트
    const segments: any[] = []

    const userOrderMap = new Map<number, any[]>()

    for (const order of orders) {
      const userId = Number(order.user_id)
      if (!userOrderMap.has(userId)) {
        userOrderMap.set(userId, [])
      }
      userOrderMap.get(userId)!.push(order)
    }

    for (const user of users) {
      const userId = Number(user.ID)
      const userOrders = userOrderMap.get(userId) || []

      if (userOrders.length === 0) continue

      const totalGmv = userOrders.reduce((sum: number, o: any) => sum + (Number(o['Total GMV']) || 0), 0)
      const lastOrderDate = userOrders
        .map((o) => new Date(o.order_created))
        .sort((a, b) => b.getTime() - a.getTime())[0]

      const daysSinceLastOrder = Math.floor(
        (Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      // RFM 점수 계산
      const recency = daysSinceLastOrder <= 30 ? 5 : daysSinceLastOrder <= 60 ? 4 : daysSinceLastOrder <= 90 ? 3 : daysSinceLastOrder <= 180 ? 2 : 1
      const frequency = Math.min(userOrders.length, 5)
      const monetary = totalGmv >= 1000 ? 5 : totalGmv >= 500 ? 4 : totalGmv >= 200 ? 3 : totalGmv >= 100 ? 2 : 1

      // 세그먼트 분류
      let segment = '일반'
      if (recency >= 4 && frequency >= 4 && monetary >= 4) {
        segment = 'VIP'
      } else if (recency <= 2 && frequency >= 3) {
        segment = '이탈 위험'
      } else if (recency <= 1 && frequency === 1) {
        segment = '신규'
      } else if (frequency >= 3 && monetary >= 3) {
        segment = '잠재 VIP'
      }

      segments.push({
        userId,
        userName: user.NAME,
        segment,
        recency,
        frequency,
        monetary,
        totalGmv,
        orderCount: userOrders.length,
        lastOrderDate: lastOrderDate.toISOString().split('T')[0],
      })
    }

    return segments
  }

  /**
   * 세그먼트 설명 생성
   */
  private async generateSegmentDescription(segments: any[]): Promise<string> {
    const segmentCounts = new Map<string, number>()
    for (const seg of segments) {
      segmentCounts.set(seg.segment, (segmentCounts.get(seg.segment) || 0) + 1)
    }

    const prompt = `${this.systemPrompt}

다음 CRM 세그먼트 분석 결과를 설명해주세요:

세그먼트 분포:
${Array.from(segmentCounts.entries())
  .map(([seg, count]) => `- ${seg}: ${count}명`)
  .join('\n')}

각 세그먼트별 특징과 마케팅 전략을 제안해주세요.
한국어로 작성하세요.`

    return await this.openaiService.generate(prompt, {
      temperature: 0.7,
      maxTokens: 1500,
    })
  }

  /**
   * 채널 성과 분석
   */
  private async analyzeChannelPerformance(orders: any[]): Promise<any> {
    const platformGroups = new Map<string, any[]>()
    const pgGroups = new Map<string, any[]>()

    for (const order of orders) {
      const platform = order.platform || '기타'
      const pg = order.PG사 || '기타'

      if (!platformGroups.has(platform)) {
        platformGroups.set(platform, [])
      }
      platformGroups.get(platform)!.push(order)

      if (!pgGroups.has(pg)) {
        pgGroups.set(pg, [])
      }
      pgGroups.get(pg)!.push(order)
    }

    const platformPerformance = Array.from(platformGroups.entries()).map(([platform, orders]) => {
      const totalGmv = orders.reduce((sum: number, o: any) => sum + (Number(o['Total GMV']) || 0), 0)
      return {
        channel: platform,
        totalGmv,
        orderCount: orders.length,
        avgOrderValue: orders.length > 0 ? totalGmv / orders.length : 0,
      }
    })

    const pgPerformance = Array.from(pgGroups.entries()).map(([pg, orders]) => {
      const totalGmv = orders.reduce((sum: number, o: any) => sum + (Number(o['Total GMV']) || 0), 0)
      return {
        channel: pg,
        totalGmv,
        orderCount: orders.length,
        avgOrderValue: orders.length > 0 ? totalGmv / orders.length : 0,
      }
    })

    return {
      platform: platformPerformance,
      pg: pgPerformance,
    }
  }

  /**
   * 성과 인사이트 생성
   */
  private async generatePerformanceInsights(performance: any): Promise<string> {
    const prompt = `${this.systemPrompt}

다음 마케팅 채널 성과 데이터를 분석하여 인사이트를 제공해주세요:

플랫폼별 성과:
${JSON.stringify(performance.platform, null, 2)}

PG사별 성과:
${JSON.stringify(performance.pg, null, 2)}

다음을 포함해주세요:
1. 주요 성과 요약
2. 개선 기회
3. 최적화 제안
4. 예산 배분 제안

한국어로 작성하세요.`

    return await this.openaiService.generate(prompt, {
      temperature: 0.7,
      maxTokens: 1500,
    })
  }

  /**
   * 헬퍼 메서드들
   */
  private parseTimeRange(timeRange: string): { start: string; end: string } {
    const today = new Date()
    const endDate = new Date(today)
    endDate.setHours(23, 59, 59, 999)

    const days = parseInt(timeRange.replace(/[^0-9]/g, '')) || 30
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    }
  }

  private extractTimeRange(query: string): string {
    const match = query.match(/(\d+)(일|days?|주|weeks?|달|months?)/i)
    if (match) {
      return `${match[1]}${match[2].includes('주') || match[2].includes('week') ? 'w' : match[2].includes('달') || match[2].includes('month') ? 'm' : 'd'}`
    }
    return '30d'
  }

  private parseCopies(copies: string): string[] {
    // 간단한 파싱 (실제로는 더 정교한 파싱 필요)
    return copies.split(/\n\n/).filter((c) => c.trim().length > 0)
  }

  private async createTrendCharts(trends: any[]): Promise<any[]> {
    if (trends.length === 0) return []

    const chartData = await this.visualizeData({
      data: trends.slice(0, 10),
      chartType: 'bar',
      xAxis: 'name',
      yAxis: 'totalGmv',
      title: '트렌드 분석',
    })

    return chartData.success ? [chartData.data] : []
  }

  private async createSegmentCharts(segments: any[]): Promise<any[]> {
    if (segments.length === 0) return []

    const segmentCounts = new Map<string, number>()
    for (const seg of segments) {
      segmentCounts.set(seg.segment, (segmentCounts.get(seg.segment) || 0) + 1)
    }

    const chartData = Array.from(segmentCounts.entries()).map(([segment, count]) => ({
      segment,
      count,
    }))

    const pieData = await this.visualizeData({
      data: chartData,
      chartType: 'pie',
      xAxis: 'segment',
      yAxis: 'count',
      title: 'CRM 세그먼트 분포',
    })

    return pieData.success ? [pieData.data] : []
  }

  private async createPerformanceCharts(performance: any): Promise<any[]> {
    const charts: any[] = []

    if (performance.platform && performance.platform.length > 0) {
      const platformChart = await this.visualizeData({
        data: performance.platform,
        chartType: 'bar',
        xAxis: 'channel',
        yAxis: 'totalGmv',
        title: '플랫폼별 성과',
      })
      if (platformChart.success) charts.push(platformChart.data)
    }

    return charts
  }

  private async handleGeneralQuery(query: string): Promise<{
    response: string
    data?: any
    charts?: any[]
    actions?: Array<{ label: string; action: string; data?: any }>
  }> {
    const prompt = `${this.systemPrompt}

사용자 질문: ${query}

위 질문에 대해 퍼포먼스 마케터 관점에서 답변해주세요.
한국어로 작성하세요.`

    const response = await this.openaiService.generate(prompt, {
      temperature: 0.7,
      maxTokens: 1000,
    })

    return { response }
  }
}

