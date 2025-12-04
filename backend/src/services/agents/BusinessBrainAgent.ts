/**
 * Business Brain Agent
 * AI 기반 경영 인사이트 시스템의 메인 에이전트
 * 기존 에이전트들과 독립적으로 동작
 */

import { BaseAgent, AgentContext } from './BaseAgent'
import {
  CubeAnalyzer,
  DecompositionEngine,
  InsightScorer,
  HealthScoreCalculator,
  businessBrainCache,
  CACHE_TTL,
  BusinessHealthScore,
  BusinessInsight,
  ExecutiveBriefing,
  DecompositionResult,
  CubeAnalysisResult,
} from '../analytics'

export class BusinessBrainAgent extends BaseAgent {
  private cubeAnalyzer: CubeAnalyzer
  private decompositionEngine: DecompositionEngine
  private insightScorer: InsightScorer
  private healthCalculator: HealthScoreCalculator

  constructor(context: AgentContext = {}) {
    super(context)
    
    // 분석 엔진 초기화
    this.cubeAnalyzer = new CubeAnalyzer({
      dimensions: [
        { name: 'country', column: 'country' },
        { name: 'platform', column: 'platform' },
        { name: 'artist', column: 'artist_name (kr)' },
      ],
      metrics: [
        { name: 'gmv', column: 'Total GMV', aggregation: 'sum' },
        { name: 'orders', column: 'order_id', aggregation: 'count' },
      ],
      minSampleSize: 5,
      deviationThreshold: 0.3,
    })

    this.decompositionEngine = new DecompositionEngine({
      primaryMetric: 'Total GMV',
      segments: [
        { name: 'country', column: 'country' },
        { name: 'platform', column: 'platform' },
      ],
    })

    this.insightScorer = new InsightScorer()
    this.healthCalculator = new HealthScoreCalculator()
  }

  /**
   * 메인 처리 로직
   */
  async process(query: string, context?: AgentContext): Promise<{
    response: string
    data?: any
    charts?: any[]
    actions?: Array<{ label: string; action: string; data?: any }>
  }> {
    const lowerQuery = query.toLowerCase()

    try {
      // 건강도 점수 요청
      if (lowerQuery.includes('건강도') || lowerQuery.includes('health')) {
        const healthScore = await this.calculateHealthScore()
        return {
          response: this.formatHealthScoreResponse(healthScore),
          data: healthScore,
          actions: [
            { label: '상세 분석', action: 'navigate', data: { path: '/business-brain?tab=health' } },
          ],
        }
      }

      // 브리핑 요청
      if (lowerQuery.includes('브리핑') || lowerQuery.includes('요약') || lowerQuery.includes('briefing')) {
        const briefing = await this.generateExecutiveBriefing()
        return {
          response: briefing.summary,
          data: briefing,
          actions: [
            { label: '전체 브리핑', action: 'navigate', data: { path: '/business-brain' } },
          ],
        }
      }

      // 인사이트 요청
      if (lowerQuery.includes('인사이트') || lowerQuery.includes('insight')) {
        const insights = await this.discoverInsights()
        return {
          response: this.formatInsightsResponse(insights),
          data: insights,
          actions: [
            { label: '모든 인사이트', action: 'navigate', data: { path: '/business-brain?tab=insights' } },
          ],
        }
      }

      // 기본 응답
      const briefing = await this.generateExecutiveBriefing()
      return {
        response: briefing.summary,
        data: briefing,
      }
    } catch (error: any) {
      console.error('[BusinessBrainAgent] 처리 오류:', error)
      return {
        response: `분석 중 오류가 발생했습니다: ${error.message}`,
      }
    }
  }

  /**
   * 경영 브리핑 생성
   */
  async generateExecutiveBriefing(): Promise<ExecutiveBriefing> {
    const cacheKey = 'briefing:executive'
    const cached = businessBrainCache.get<ExecutiveBriefing>(cacheKey)
    if (cached) return cached

    try {
      // 데이터 조회
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      
      const orderResult = await this.getData({
        sheet: 'order',
        dateRange: {
          start: thirtyDaysAgo.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0],
        },
      })

      const orderData = orderResult.success ? orderResult.data : []

      // 건강도 점수 계산
      const healthScore = await this.calculateHealthScore()

      // 인사이트 발견
      const insights = await this.discoverInsights()

      // 브리핑 생성
      const briefing: ExecutiveBriefing = {
        generatedAt: now,
        period: { start: thirtyDaysAgo, end: now },
        healthScore,
        summary: this.generateSummary(healthScore, insights, orderData),
        insights: insights.slice(0, 5),
        immediateActions: this.extractImmediateActions(insights),
        weeklyFocus: this.extractWeeklyFocus(insights),
        risks: this.extractRisks(insights),
        opportunities: this.extractOpportunities(insights),
      }

      businessBrainCache.set(cacheKey, briefing, CACHE_TTL.briefing)
      return briefing
    } catch (error: any) {
      console.error('[BusinessBrainAgent] 브리핑 생성 오류:', error)
      throw error
    }
  }

  /**
   * 건강도 점수 계산
   */
  async calculateHealthScore(): Promise<BusinessHealthScore> {
    const cacheKey = 'health:score'
    const cached = businessBrainCache.get<BusinessHealthScore>(cacheKey)
    if (cached) return cached

    try {
      // 데이터 조회
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

      const [currentResult, previousResult] = await Promise.all([
        this.getData({
          sheet: 'order',
          dateRange: {
            start: thirtyDaysAgo.toISOString().split('T')[0],
            end: now.toISOString().split('T')[0],
          },
        }),
        this.getData({
          sheet: 'order',
          dateRange: {
            start: sixtyDaysAgo.toISOString().split('T')[0],
            end: thirtyDaysAgo.toISOString().split('T')[0],
          },
        }),
      ])

      const currentData = currentResult.success ? currentResult.data : []
      const previousData = previousResult.success ? previousResult.data : []

      const healthScore = this.healthCalculator.calculate(currentData, previousData)
      
      businessBrainCache.set(cacheKey, healthScore, CACHE_TTL.healthScore)
      return healthScore
    } catch (error: any) {
      console.error('[BusinessBrainAgent] 건강도 계산 오류:', error)
      throw error
    }
  }

  /**
   * 인사이트 발견
   */
  async discoverInsights(): Promise<BusinessInsight[]> {
    const cacheKey = 'insights:all'
    const cached = businessBrainCache.get<BusinessInsight[]>(cacheKey)
    if (cached) return cached

    try {
      // 데이터 조회
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const orderResult = await this.getData({
        sheet: 'order',
        dateRange: {
          start: thirtyDaysAgo.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0],
        },
      })

      const orderData = orderResult.success ? orderResult.data : []

      // 큐브 분석으로 이상치 탐지
      const cubeResult = await this.cubeAnalyzer.analyze(orderData)

      // 이상치를 인사이트로 변환
      const insights = this.insightScorer.scoreAnomalies(cubeResult.anomalies)

      businessBrainCache.set(cacheKey, insights, CACHE_TTL.insights)
      return insights
    } catch (error: any) {
      console.error('[BusinessBrainAgent] 인사이트 발견 오류:', error)
      throw error
    }
  }

  /**
   * 매출 변화 분해
   */
  async decomposeRevenueChange(
    startDate: string,
    endDate: string,
    compareWith: string = 'previous'
  ): Promise<DecompositionResult> {
    const cacheKey = `decomposition:${startDate}:${endDate}:${compareWith}`
    const cached = businessBrainCache.get<DecompositionResult>(cacheKey)
    if (cached) return cached

    try {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const duration = end.getTime() - start.getTime()
      
      const prevEnd = new Date(start.getTime() - 1)
      const prevStart = new Date(prevEnd.getTime() - duration)

      const [currentResult, previousResult] = await Promise.all([
        this.getData({
          sheet: 'order',
          dateRange: { start: startDate, end: endDate },
        }),
        this.getData({
          sheet: 'order',
          dateRange: {
            start: prevStart.toISOString().split('T')[0],
            end: prevEnd.toISOString().split('T')[0],
          },
        }),
      ])

      const currentData = currentResult.success ? currentResult.data : []
      const previousData = previousResult.success ? previousResult.data : []

      const result = await this.decompositionEngine.decompose(currentData, previousData)

      businessBrainCache.set(cacheKey, result, CACHE_TTL.decomposition)
      return result
    } catch (error: any) {
      console.error('[BusinessBrainAgent] 분해 분석 오류:', error)
      throw error
    }
  }

  /**
   * 큐브 분석 실행
   */
  async runCubeAnalysis(params: {
    dimensions?: string[]
    metrics?: string[]
    dateRange?: { start: string; end: string }
  }): Promise<CubeAnalysisResult> {
    const cacheKey = `cube:${JSON.stringify(params)}`
    const cached = businessBrainCache.get<CubeAnalysisResult>(cacheKey)
    if (cached) return cached

    try {
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const orderResult = await this.getData({
        sheet: 'order',
        dateRange: params.dateRange || {
          start: thirtyDaysAgo.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0],
        },
      })

      const orderData = orderResult.success ? orderResult.data : []
      const result = await this.cubeAnalyzer.analyze(orderData)

      businessBrainCache.set(cacheKey, result, CACHE_TTL.cubeAnalysis)
      return result
    } catch (error: any) {
      console.error('[BusinessBrainAgent] 큐브 분석 오류:', error)
      throw error
    }
  }

  /**
   * 휴먼 에러 체크 실행
   * PRD 섹션 3.3 - 사람이 놓치기 쉬운 항목 자동 검증
   */
  async runHumanErrorChecks(): Promise<{
    checks: Array<{
      name: string
      status: 'pass' | 'warning' | 'fail'
      message: string
      value?: number
      threshold?: number
    }>
    summary: string
  }> {
    const cacheKey = 'human-error-checks'
    const cached = businessBrainCache.get<any>(cacheKey)
    if (cached) return cached

    try {
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const orderResult = await this.getData({
        sheet: 'order',
        dateRange: {
          start: thirtyDaysAgo.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0],
        },
      })

      const orderData = orderResult.success ? orderResult.data : []
      const checks: Array<{
        name: string
        status: 'pass' | 'warning' | 'fail'
        message: string
        value?: number
        threshold?: number
      }> = []

      // 1. 작가 집중도 체크 (Top 1 작가 > 15%)
      const artistRevenue = new Map<string, number>()
      let totalGmv = 0
      orderData.forEach((row: any) => {
        const artist = row['artist_name (kr)']
        const gmv = Number(row['Total GMV']) || 0
        totalGmv += gmv
        if (artist) {
          artistRevenue.set(artist, (artistRevenue.get(artist) || 0) + gmv)
        }
      })
      const sortedArtists = [...artistRevenue.entries()].sort((a, b) => b[1] - a[1])
      const top1Share = totalGmv > 0 && sortedArtists.length > 0 
        ? sortedArtists[0][1] / totalGmv 
        : 0

      checks.push({
        name: '작가 집중도',
        status: top1Share > 0.15 ? 'warning' : 'pass',
        message: top1Share > 0.15 
          ? `상위 1명 작가(${sortedArtists[0]?.[0]})가 매출의 ${(top1Share * 100).toFixed(1)}%를 차지합니다.`
          : '작가 매출 분포가 적절합니다.',
        value: top1Share * 100,
        threshold: 15,
      })

      // 2. 국가 집중도 체크 (단일 국가 > 60%)
      const countryRevenue = new Map<string, number>()
      orderData.forEach((row: any) => {
        const country = row.country
        const gmv = Number(row['Total GMV']) || 0
        if (country) {
          countryRevenue.set(country, (countryRevenue.get(country) || 0) + gmv)
        }
      })
      const sortedCountries = [...countryRevenue.entries()].sort((a, b) => b[1] - a[1])
      const topCountryShare = totalGmv > 0 && sortedCountries.length > 0
        ? sortedCountries[0][1] / totalGmv
        : 0

      checks.push({
        name: '국가 집중도',
        status: topCountryShare > 0.6 ? 'warning' : 'pass',
        message: topCountryShare > 0.6
          ? `${sortedCountries[0]?.[0]} 시장이 매출의 ${(topCountryShare * 100).toFixed(1)}%를 차지합니다.`
          : '국가별 매출 분포가 적절합니다.',
        value: topCountryShare * 100,
        threshold: 60,
      })

      // 3. 상위 5명 작가 집중도 (> 50%)
      const top5Revenue = sortedArtists.slice(0, 5).reduce((sum, [, rev]) => sum + rev, 0)
      const top5Share = totalGmv > 0 ? top5Revenue / totalGmv : 0

      checks.push({
        name: '상위 5명 작가 의존도',
        status: top5Share > 0.5 ? 'fail' : top5Share > 0.4 ? 'warning' : 'pass',
        message: top5Share > 0.5
          ? `상위 5명 작가가 매출의 ${(top5Share * 100).toFixed(1)}%를 차지합니다. 리스크 분산이 필요합니다.`
          : '작가 포트폴리오가 적절히 분산되어 있습니다.',
        value: top5Share * 100,
        threshold: 50,
      })

      // 4. 일별 매출 변동성 체크
      const dailyGmv = new Map<string, number>()
      orderData.forEach((row: any) => {
        const date = row.order_created?.split('T')[0] || row.order_created?.split(' ')[0]
        const gmv = Number(row['Total GMV']) || 0
        if (date) {
          dailyGmv.set(date, (dailyGmv.get(date) || 0) + gmv)
        }
      })
      const dailyValues = [...dailyGmv.values()]
      const avgDaily = dailyValues.length > 0 ? dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length : 0
      const variance = dailyValues.length > 0
        ? dailyValues.reduce((sum, v) => sum + Math.pow(v - avgDaily, 2), 0) / dailyValues.length
        : 0
      const volatility = avgDaily > 0 ? Math.sqrt(variance) / avgDaily : 0

      checks.push({
        name: '매출 변동성',
        status: volatility > 0.5 ? 'warning' : 'pass',
        message: volatility > 0.5
          ? `일별 매출 변동성이 ${(volatility * 100).toFixed(1)}%로 높습니다.`
          : '매출이 안정적입니다.',
        value: volatility * 100,
        threshold: 50,
      })

      // 5. 주문 건수 추이 체크
      const recentWeek = dailyValues.slice(-7)
      const previousWeek = dailyValues.slice(-14, -7)
      const recentAvg = recentWeek.length > 0 ? recentWeek.reduce((a, b) => a + b, 0) / recentWeek.length : 0
      const previousAvg = previousWeek.length > 0 ? previousWeek.reduce((a, b) => a + b, 0) / previousWeek.length : 0
      const weeklyChange = previousAvg > 0 ? (recentAvg - previousAvg) / previousAvg : 0

      checks.push({
        name: '주간 매출 추이',
        status: weeklyChange < -0.2 ? 'fail' : weeklyChange < -0.1 ? 'warning' : 'pass',
        message: weeklyChange < -0.2
          ? `최근 1주 매출이 전주 대비 ${(weeklyChange * 100).toFixed(1)}% 감소했습니다.`
          : weeklyChange < -0.1
          ? `최근 1주 매출이 소폭 감소했습니다 (${(weeklyChange * 100).toFixed(1)}%).`
          : '매출 추이가 양호합니다.',
        value: weeklyChange * 100,
        threshold: -10,
      })

      const failCount = checks.filter(c => c.status === 'fail').length
      const warningCount = checks.filter(c => c.status === 'warning').length

      const result = {
        checks,
        summary: failCount > 0
          ? `${failCount}개의 심각한 이슈와 ${warningCount}개의 주의 사항이 발견되었습니다.`
          : warningCount > 0
          ? `${warningCount}개의 주의 사항이 있습니다.`
          : '모든 체크 항목이 정상입니다.',
      }

      businessBrainCache.set(cacheKey, result, CACHE_TTL.insights)
      return result
    } catch (error: any) {
      console.error('[BusinessBrainAgent] 휴먼 에러 체크 오류:', error)
      throw error
    }
  }

  /**
   * 장기 트렌드 분석
   * PRD 섹션 3.1 - 다차원 분석 매트릭스
   */
  async analyzeLongTermTrends(): Promise<{
    trends: Array<{
      metric: string
      direction: 'up' | 'down' | 'stable'
      magnitude: number
      period: string
      significance: 'high' | 'medium' | 'low'
      implication: string
    }>
  }> {
    const cacheKey = 'long-term-trends'
    const cached = businessBrainCache.get<any>(cacheKey)
    if (cached) return cached

    try {
      const now = new Date()
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

      const orderResult = await this.getData({
        sheet: 'order',
        dateRange: {
          start: ninetyDaysAgo.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0],
        },
      })

      const orderData = orderResult.success ? orderResult.data : []
      const trends: Array<{
        metric: string
        direction: 'up' | 'down' | 'stable'
        magnitude: number
        period: string
        significance: 'high' | 'medium' | 'low'
        implication: string
      }> = []

      // 월별 데이터 집계
      const monthlyData = new Map<string, { gmv: number; orders: number; customers: Set<string> }>()
      orderData.forEach((row: any) => {
        const date = row.order_created?.split('T')[0] || row.order_created?.split(' ')[0]
        if (!date) return
        const month = date.substring(0, 7) // YYYY-MM
        if (!monthlyData.has(month)) {
          monthlyData.set(month, { gmv: 0, orders: 0, customers: new Set() })
        }
        const data = monthlyData.get(month)!
        data.gmv += Number(row['Total GMV']) || 0
        data.orders += 1
        if (row.user_id) data.customers.add(row.user_id)
      })

      const months = [...monthlyData.keys()].sort()
      if (months.length >= 2) {
        const firstMonth = monthlyData.get(months[0])!
        const lastMonth = monthlyData.get(months[months.length - 1])!

        // GMV 트렌드
        const gmvChange = firstMonth.gmv > 0 ? (lastMonth.gmv - firstMonth.gmv) / firstMonth.gmv : 0
        trends.push({
          metric: '총 매출 (GMV)',
          direction: gmvChange > 0.05 ? 'up' : gmvChange < -0.05 ? 'down' : 'stable',
          magnitude: Math.abs(gmvChange * 100),
          period: '90일',
          significance: Math.abs(gmvChange) > 0.2 ? 'high' : Math.abs(gmvChange) > 0.1 ? 'medium' : 'low',
          implication: gmvChange > 0.1
            ? '매출이 건강하게 성장하고 있습니다.'
            : gmvChange < -0.1
            ? '매출 하락 추세에 대한 원인 분석이 필요합니다.'
            : '매출이 안정적으로 유지되고 있습니다.',
        })

        // 주문 건수 트렌드
        const orderChange = firstMonth.orders > 0 ? (lastMonth.orders - firstMonth.orders) / firstMonth.orders : 0
        trends.push({
          metric: '주문 건수',
          direction: orderChange > 0.05 ? 'up' : orderChange < -0.05 ? 'down' : 'stable',
          magnitude: Math.abs(orderChange * 100),
          period: '90일',
          significance: Math.abs(orderChange) > 0.2 ? 'high' : Math.abs(orderChange) > 0.1 ? 'medium' : 'low',
          implication: orderChange > 0.1
            ? '주문 건수가 증가하고 있습니다.'
            : orderChange < -0.1
            ? '주문 건수 감소에 대한 대응이 필요합니다.'
            : '주문 건수가 안정적입니다.',
        })

        // AOV 트렌드
        const firstAov = firstMonth.orders > 0 ? firstMonth.gmv / firstMonth.orders : 0
        const lastAov = lastMonth.orders > 0 ? lastMonth.gmv / lastMonth.orders : 0
        const aovChange = firstAov > 0 ? (lastAov - firstAov) / firstAov : 0
        trends.push({
          metric: '평균 주문 금액 (AOV)',
          direction: aovChange > 0.03 ? 'up' : aovChange < -0.03 ? 'down' : 'stable',
          magnitude: Math.abs(aovChange * 100),
          period: '90일',
          significance: Math.abs(aovChange) > 0.15 ? 'high' : Math.abs(aovChange) > 0.08 ? 'medium' : 'low',
          implication: aovChange > 0.05
            ? '객단가가 상승하고 있습니다. 프리미엄 전략이 효과적입니다.'
            : aovChange < -0.05
            ? '객단가 하락 추세입니다. 할인 의존도나 상품 믹스를 점검하세요.'
            : '객단가가 안정적으로 유지되고 있습니다.',
        })

        // 고객 수 트렌드
        const customerChange = firstMonth.customers.size > 0
          ? (lastMonth.customers.size - firstMonth.customers.size) / firstMonth.customers.size
          : 0
        trends.push({
          metric: '활성 고객 수',
          direction: customerChange > 0.05 ? 'up' : customerChange < -0.05 ? 'down' : 'stable',
          magnitude: Math.abs(customerChange * 100),
          period: '90일',
          significance: Math.abs(customerChange) > 0.2 ? 'high' : Math.abs(customerChange) > 0.1 ? 'medium' : 'low',
          implication: customerChange > 0.1
            ? '고객 기반이 확대되고 있습니다.'
            : customerChange < -0.1
            ? '고객 이탈이 우려됩니다. 리텐션 전략을 강화하세요.'
            : '고객 기반이 안정적입니다.',
        })
      }

      const result = { trends }
      businessBrainCache.set(cacheKey, result, CACHE_TTL.insights)
      return result
    } catch (error: any) {
      console.error('[BusinessBrainAgent] 장기 트렌드 분석 오류:', error)
      throw error
    }
  }

  /**
   * 전략 제안 생성
   * PRD 섹션 4.1 - 핵심 기능 구조
   */
  async generateStrategicRecommendations(): Promise<{
    shortTerm: Array<{ title: string; description: string; priority: 'high' | 'medium' | 'low' }>
    midTerm: Array<{ title: string; description: string; priority: 'high' | 'medium' | 'low' }>
    longTerm: Array<{ title: string; description: string; priority: 'high' | 'medium' | 'low' }>
  }> {
    const cacheKey = 'strategic-recommendations'
    const cached = businessBrainCache.get<any>(cacheKey)
    if (cached) return cached

    try {
      // 데이터 수집
      const [healthScore, humanErrorChecks, trends] = await Promise.all([
        this.calculateHealthScore(),
        this.runHumanErrorChecks(),
        this.analyzeLongTermTrends(),
      ])

      const shortTerm: Array<{ title: string; description: string; priority: 'high' | 'medium' | 'low' }> = []
      const midTerm: Array<{ title: string; description: string; priority: 'high' | 'medium' | 'low' }> = []
      const longTerm: Array<{ title: string; description: string; priority: 'high' | 'medium' | 'low' }> = []

      // 휴먼 에러 체크 기반 단기 제안
      for (const check of humanErrorChecks.checks) {
        if (check.status === 'fail') {
          shortTerm.push({
            title: `${check.name} 개선`,
            description: check.message,
            priority: 'high',
          })
        } else if (check.status === 'warning') {
          shortTerm.push({
            title: `${check.name} 모니터링`,
            description: check.message,
            priority: 'medium',
          })
        }
      }

      // 건강도 기반 중기 제안
      const { dimensions } = healthScore
      if (dimensions.revenue.score < 60) {
        midTerm.push({
          title: '매출 성장 전략 수립',
          description: '매출 건강도가 낮습니다. 신규 고객 유치 및 객단가 향상 전략을 검토하세요.',
          priority: 'high',
        })
      }
      if (dimensions.customer.score < 60) {
        midTerm.push({
          title: '고객 리텐션 프로그램 강화',
          description: '고객 건강도가 낮습니다. 재구매율 향상 및 VIP 관리 프로그램을 강화하세요.',
          priority: 'high',
        })
      }
      if (dimensions.artist.score < 60) {
        midTerm.push({
          title: '작가 포트폴리오 다각화',
          description: '작가 건강도가 낮습니다. 신규 작가 발굴 및 중위권 작가 육성에 집중하세요.',
          priority: 'high',
        })
      }
      if (dimensions.operations.score < 60) {
        midTerm.push({
          title: '운영 효율성 개선',
          description: '운영 효율성이 낮습니다. 물류 프로세스 최적화 및 품질 관리를 강화하세요.',
          priority: 'high',
        })
      }

      // 트렌드 기반 장기 제안
      for (const trend of trends.trends) {
        if (trend.direction === 'down' && trend.significance === 'high') {
          longTerm.push({
            title: `${trend.metric} 하락 대응`,
            description: trend.implication,
            priority: 'high',
          })
        } else if (trend.direction === 'up' && trend.significance === 'high') {
          longTerm.push({
            title: `${trend.metric} 성장 가속화`,
            description: `${trend.implication} 이 모멘텀을 유지하기 위한 투자를 검토하세요.`,
            priority: 'medium',
          })
        }
      }

      // 기본 장기 제안 추가
      if (longTerm.length === 0) {
        longTerm.push({
          title: '시장 다각화 검토',
          description: '새로운 국가/지역 시장 진출을 통한 성장 기회를 탐색하세요.',
          priority: 'medium',
        })
      }

      const result = { shortTerm, midTerm, longTerm }
      businessBrainCache.set(cacheKey, result, CACHE_TTL.insights)
      return result
    } catch (error: any) {
      console.error('[BusinessBrainAgent] 전략 제안 생성 오류:', error)
      throw error
    }
  }

  // ==================== 헬퍼 메서드 ====================

  private generateSummary(
    healthScore: BusinessHealthScore,
    insights: BusinessInsight[],
    orderData: any[]
  ): string {
    const totalGmv = orderData.reduce((sum, row) => sum + (Number(row['Total GMV']) || 0), 0)
    const totalOrders = orderData.length

    const criticalCount = insights.filter(i => i.type === 'critical').length
    const opportunityCount = insights.filter(i => i.type === 'opportunity').length

    let summary = `비즈니스 건강도 ${healthScore.overall}점. `
    summary += `최근 30일 매출 ${this.formatCurrency(totalGmv)}, 주문 ${totalOrders.toLocaleString()}건. `

    if (criticalCount > 0) {
      summary += `주의가 필요한 ${criticalCount}개 이슈가 있습니다. `
    }
    if (opportunityCount > 0) {
      summary += `${opportunityCount}개의 성장 기회가 발견되었습니다.`
    }

    return summary
  }

  private extractImmediateActions(insights: BusinessInsight[]): string[] {
    return insights
      .filter(i => i.type === 'critical' || i.type === 'warning')
      .slice(0, 3)
      .map(i => i.recommendation || i.title)
  }

  private extractWeeklyFocus(insights: BusinessInsight[]): string[] {
    return insights
      .filter(i => i.type === 'opportunity')
      .slice(0, 3)
      .map(i => i.title)
  }

  private extractRisks(insights: BusinessInsight[]): string[] {
    return insights
      .filter(i => i.type === 'critical' || i.type === 'warning')
      .slice(0, 5)
      .map(i => i.description)
  }

  private extractOpportunities(insights: BusinessInsight[]): string[] {
    return insights
      .filter(i => i.type === 'opportunity')
      .slice(0, 5)
      .map(i => i.description)
  }

  private formatHealthScoreResponse(score: BusinessHealthScore): string {
    const { overall, dimensions } = score
    let response = `비즈니스 건강도: ${overall}/100\n\n`
    response += `📊 매출: ${dimensions.revenue.score}점 (${this.getTrendEmoji(dimensions.revenue.trend)})\n`
    response += `👥 고객: ${dimensions.customer.score}점 (${this.getTrendEmoji(dimensions.customer.trend)})\n`
    response += `🎨 작가: ${dimensions.artist.score}점 (${this.getTrendEmoji(dimensions.artist.trend)})\n`
    response += `⚙️ 운영: ${dimensions.operations.score}점 (${this.getTrendEmoji(dimensions.operations.trend)})`
    return response
  }

  private formatInsightsResponse(insights: BusinessInsight[]): string {
    if (insights.length === 0) {
      return '현재 특별한 인사이트가 없습니다.'
    }

    const top5 = insights.slice(0, 5)
    let response = `발견된 인사이트 ${insights.length}개:\n\n`
    
    for (const insight of top5) {
      const icon = this.getInsightIcon(insight.type)
      response += `${icon} ${insight.title}\n`
    }

    return response
  }

  private getTrendEmoji(trend: 'up' | 'down' | 'stable'): string {
    return trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️'
  }

  private getInsightIcon(type: string): string {
    const icons: Record<string, string> = {
      critical: '🚨',
      warning: '⚠️',
      opportunity: '💡',
      info: '📊',
    }
    return icons[type] || '📌'
  }

  private formatCurrency(value: number): string {
    return `₩${Math.round(value).toLocaleString()}`
  }
}
