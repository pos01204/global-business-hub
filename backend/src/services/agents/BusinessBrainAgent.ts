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
  DataProcessor,
  aiBriefingGenerator,
  businessBrainCache,
  CACHE_TTL,
  BusinessHealthScore,
  BusinessInsight,
  ExecutiveBriefing,
  DecompositionResult,
  CubeAnalysisResult,
  CohortAnalysis,
  RFMAnalysis,
  ParetoAnalysis,
  CorrelationAnalysis,
  AnomalyDetection,
  TimeSeriesData,
  ForecastResult,
  PeriodComparison,
  MultiPeriodAnalysis,
  PeriodPreset,
  DateRange,
  BriefingInput,
  TimeSeriesDecomposer,
  TimeSeriesDecomposition,
} from '../analytics'

// 환율 상수 (USD → KRW)
const USD_TO_KRW = 1350

export class BusinessBrainAgent extends BaseAgent {
  private cubeAnalyzer: CubeAnalyzer
  private decompositionEngine: DecompositionEngine
  private insightScorer: InsightScorer
  private healthCalculator: HealthScoreCalculator
  private dataProcessor: DataProcessor
  private timeSeriesDecomposer: TimeSeriesDecomposer

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
    this.dataProcessor = new DataProcessor()
    this.timeSeriesDecomposer = new TimeSeriesDecomposer()
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
   * v2.1: AI 기반 브리핑 생성 지원
   * @param period 분석 기간 프리셋 (기본: 30d)
   */
  async generateExecutiveBriefing(period: PeriodPreset = '30d'): Promise<ExecutiveBriefing> {
    const cacheKey = `briefing:executive:${period}`
    const cached = businessBrainCache.get<ExecutiveBriefing>(cacheKey)
    if (cached) return cached

    try {
      // 기간 계산
      const dateRange = DataProcessor.getDateRangeFromPreset(period)
      const comparisonRange = DataProcessor.getComparisonPeriod(dateRange)
      const now = new Date()
      
      // 현재 기간 데이터
      const logisticsResult = await this.getData({
        sheet: 'logistics',
        dateRange: {
          start: dateRange.start,
          end: dateRange.end,
        },
      })

      // 이전 기간 데이터 (비교용)
      const previousResult = await this.getData({
        sheet: 'logistics',
        dateRange: {
          start: comparisonRange.start,
          end: comparisonRange.end,
        },
      })

      const orderData = logisticsResult.success ? logisticsResult.data : []
      const previousData = previousResult.success ? previousResult.data : []
      console.log(`[BusinessBrain] 브리핑 데이터 조회 (${period}): 현재 ${orderData.length}건, 이전 ${previousData.length}건`)

      // 건강도 점수 계산
      const healthScore = await this.calculateHealthScore(period)

      // 인사이트 발견
      const insights = await this.discoverInsights()

      // 메트릭 계산
      const currentGmv = orderData.reduce((sum: number, row: any) => sum + (Number(row['Total GMV']) || 0), 0)
      const previousGmv = previousData.reduce((sum: number, row: any) => sum + (Number(row['Total GMV']) || 0), 0)
      const currentOrders = orderData.length
      const previousOrders = previousData.length
      const currentAov = currentOrders > 0 ? currentGmv / currentOrders : 0
      const previousAov = previousOrders > 0 ? previousGmv / previousOrders : 0

      // 고객 분석
      const currentCustomers = new Set(orderData.map((row: any) => row.user_id).filter(Boolean))
      const previousCustomers = new Set(previousData.map((row: any) => row.user_id).filter(Boolean))
      const repeatCustomers = [...currentCustomers].filter(c => previousCustomers.has(c))
      const repeatRate = currentCustomers.size > 0 ? (repeatCustomers.length / currentCustomers.size) * 100 : 0

      // 국가/작가 분석
      const countryRevenue = new Map<string, number>()
      const artistRevenue = new Map<string, number>()
      orderData.forEach((row: any) => {
        const country = row.country
        const artist = row['artist_name (kr)']
        const gmv = Number(row['Total GMV']) || 0
        if (country) countryRevenue.set(country, (countryRevenue.get(country) || 0) + gmv)
        if (artist) artistRevenue.set(artist, (artistRevenue.get(artist) || 0) + gmv)
      })
      const sortedCountries = [...countryRevenue.entries()].sort((a, b) => b[1] - a[1])
      const sortedArtists = [...artistRevenue.entries()].sort((a, b) => b[1] - a[1])

      // AI 브리핑 입력 데이터 구성
      const briefingInput: BriefingInput = {
        period: {
          start: dateRange.start,
          end: dateRange.end,
        },
        metrics: {
          totalGmv: currentGmv,
          gmvChange: previousGmv > 0 ? ((currentGmv - previousGmv) / previousGmv) * 100 : 0,
          orderCount: currentOrders,
          orderChange: previousOrders > 0 ? ((currentOrders - previousOrders) / previousOrders) * 100 : 0,
          aov: currentAov,
          aovChange: previousAov > 0 ? ((currentAov - previousAov) / previousAov) * 100 : 0,
          newCustomers: currentCustomers.size - repeatCustomers.length,
          repeatRate,
        },
        healthScore,
        insights,
        anomalies: insights
          .filter(i => i.type === 'critical' || i.type === 'warning')
          .slice(0, 5)
          .map(i => ({ metric: i.metric, description: i.description })),
        trends: insights
          .filter(i => i.deviationPercent !== 0)
          .slice(0, 5)
          .map(i => ({
            metric: i.metric,
            direction: i.deviationPercent > 0 ? '상승' : '하락',
            magnitude: Math.abs(i.deviationPercent),
          })),
        topCountry: sortedCountries[0] ? {
          name: this.getCountryName(sortedCountries[0][0]),
          share: currentGmv > 0 ? sortedCountries[0][1] / currentGmv : 0,
        } : undefined,
        topArtist: sortedArtists[0] ? {
          name: sortedArtists[0][0],
          revenue: sortedArtists[0][1],
        } : undefined,
      }

      // AI 브리핑 생성 시도
      const aiBriefing = await aiBriefingGenerator.generateExecutiveBriefing(briefingInput)

      // 브리핑 생성
      const briefing: ExecutiveBriefing = {
        generatedAt: now,
        period: { start: new Date(dateRange.start), end: new Date(dateRange.end) },
        healthScore,
        summary: aiBriefing.summary || this.generateSummary(healthScore, insights, orderData),
        insights: insights.slice(0, 5),
        immediateActions: aiBriefing.immediateActions.length > 0 
          ? aiBriefing.immediateActions 
          : this.extractImmediateActions(insights),
        weeklyFocus: aiBriefing.weeklyFocus.length > 0 
          ? aiBriefing.weeklyFocus 
          : this.extractWeeklyFocus(insights),
        risks: aiBriefing.risks.length > 0 
          ? aiBriefing.risks 
          : this.extractRisks(insights),
        opportunities: aiBriefing.opportunities.length > 0 
          ? aiBriefing.opportunities 
          : this.extractOpportunities(insights),
      }

      console.log(`[BusinessBrain] 브리핑 생성 완료 (LLM 사용: ${aiBriefing.usedLLM}, 신뢰도: ${aiBriefing.confidence}%)`)

      businessBrainCache.set(cacheKey, briefing, CACHE_TTL.briefing)
      return briefing
    } catch (error: any) {
      console.error('[BusinessBrainAgent] 브리핑 생성 오류:', error)
      throw error
    }
  }

  /**
   * 건강도 점수 계산
   * @param period 분석 기간 프리셋 (기본: 30d)
   */
  async calculateHealthScore(period: PeriodPreset = '30d'): Promise<BusinessHealthScore> {
    const cacheKey = `health:score:${period}`
    const cached = businessBrainCache.get<BusinessHealthScore>(cacheKey)
    if (cached) return cached

    try {
      // 기간 계산
      const dateRange = DataProcessor.getDateRangeFromPreset(period)
      const comparisonRange = DataProcessor.getComparisonPeriod(dateRange)

      const [currentResult, previousResult] = await Promise.all([
        this.getData({
          sheet: 'logistics',
          dateRange: {
            start: dateRange.start,
            end: dateRange.end,
          },
        }),
        this.getData({
          sheet: 'logistics',
          dateRange: {
            start: comparisonRange.start,
            end: comparisonRange.end,
          },
        }),
      ])
      
      console.log(`[BusinessBrain] 건강도 데이터 (${period}): 현재 ${currentResult.data?.length || 0}건, 이전 ${previousResult.data?.length || 0}건`)

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
      // 데이터 조회 - logistics 시트 사용
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const logisticsResult = await this.getData({
        sheet: 'logistics',
        dateRange: {
          start: thirtyDaysAgo.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0],
        },
      })

      const orderData = logisticsResult.success ? logisticsResult.data : []

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
          sheet: 'logistics',
          dateRange: { start: startDate, end: endDate },
        }),
        this.getData({
          sheet: 'logistics',
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

      const logisticsResult = await this.getData({
        sheet: 'logistics',
        dateRange: params.dateRange || {
          start: thirtyDaysAgo.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0],
        },
      })

      const orderData = logisticsResult.success ? logisticsResult.data : []
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

      const logisticsResult = await this.getData({
        sheet: 'logistics',
        dateRange: {
          start: thirtyDaysAgo.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0],
        },
      })

      const orderData = logisticsResult.success ? logisticsResult.data : []
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

      // 6. VIP 고객 이탈 징후 체크 (PRD 추가)
      const customerSpending = new Map<string, { current: number; previous: number }>()
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
      
      // 60일 전 데이터도 조회
      const previousResult = await this.getData({
        sheet: 'logistics',
        dateRange: {
          start: sixtyDaysAgo.toISOString().split('T')[0],
          end: thirtyDaysAgo.toISOString().split('T')[0],
        },
      })
      const previousData = previousResult.success ? previousResult.data : []

      // 이전 기간 고객 지출
      previousData.forEach((row: any) => {
        const customerId = row.user_id
        const gmv = Number(row['Total GMV']) || 0
        if (customerId) {
          const existing = customerSpending.get(customerId) || { current: 0, previous: 0 }
          existing.previous += gmv
          customerSpending.set(customerId, existing)
        }
      })

      // 현재 기간 고객 지출
      orderData.forEach((row: any) => {
        const customerId = row.user_id
        const gmv = Number(row['Total GMV']) || 0
        if (customerId) {
          const existing = customerSpending.get(customerId) || { current: 0, previous: 0 }
          existing.current += gmv
          customerSpending.set(customerId, existing)
        }
      })

      // VIP 정의: 이전 기간 상위 20% 고객
      const previousSpenders = [...customerSpending.entries()]
        .filter(([, s]) => s.previous > 0)
        .sort((a, b) => b[1].previous - a[1].previous)
      const vipThreshold = Math.ceil(previousSpenders.length * 0.2)
      const previousVips = previousSpenders.slice(0, vipThreshold)
      
      // VIP 중 이탈 위험 (현재 기간 구매 없음)
      const atRiskVips = previousVips.filter(([, s]) => s.current === 0)
      const vipAtRiskRate = previousVips.length > 0 ? atRiskVips.length / previousVips.length : 0

      checks.push({
        name: 'VIP 고객 이탈 징후',
        status: vipAtRiskRate > 0.3 ? 'fail' : vipAtRiskRate > 0.15 ? 'warning' : 'pass',
        message: vipAtRiskRate > 0.3
          ? `VIP 고객 ${atRiskVips.length}명(${(vipAtRiskRate * 100).toFixed(1)}%)이 최근 30일간 구매하지 않았습니다. 긴급 리텐션 필요!`
          : vipAtRiskRate > 0.15
          ? `VIP 고객 ${atRiskVips.length}명이 이탈 위험 상태입니다.`
          : 'VIP 고객 유지율이 양호합니다.',
        value: vipAtRiskRate * 100,
        threshold: 15,
      })

      // 7. 물류 병목 누적 체크 (PRD 추가)
      const DELAYED_STATUSES = ['14일+ 미입고', '7-14일 미입고', '지연', 'delayed', 'overdue', '미입고']
      let delayedCount = 0
      let longDelayedCount = 0  // 14일 이상

      orderData.forEach((row: any) => {
        const status = String(row.status || row.logistics_status || row['물류상태'] || '').toLowerCase()
        if (DELAYED_STATUSES.some(s => status.includes(s.toLowerCase()))) {
          delayedCount += 1
          if (status.includes('14일') || status.includes('14+')) {
            longDelayedCount += 1
          }
        }
      })

      const delayedRatio = orderData.length > 0 ? delayedCount / orderData.length : 0
      const longDelayedRatio = orderData.length > 0 ? longDelayedCount / orderData.length : 0

      checks.push({
        name: '물류 병목 누적',
        status: longDelayedRatio > 0.1 ? 'fail' : delayedRatio > 0.15 ? 'warning' : 'pass',
        message: longDelayedRatio > 0.1
          ? `14일 이상 지연 건이 ${longDelayedCount}건(${(longDelayedRatio * 100).toFixed(1)}%)입니다. 즉시 조치 필요!`
          : delayedRatio > 0.15
          ? `지연 건이 ${delayedCount}건(${(delayedRatio * 100).toFixed(1)}%)으로 누적 중입니다.`
          : '물류 처리가 원활합니다.',
        value: delayedRatio * 100,
        threshold: 15,
      })

      // 8. 품질 이슈 확산 체크 (PRD 추가)
      // 리뷰 데이터 조회 시도
      let lowRatingCount = 0
      let totalReviews = 0
      
      try {
        const reviewResult = await this.getData({
          sheet: 'review',
          dateRange: {
            start: thirtyDaysAgo.toISOString().split('T')[0],
            end: now.toISOString().split('T')[0],
          },
        })
        
        if (reviewResult.success && reviewResult.data) {
          reviewResult.data.forEach((review: any) => {
            const rating = Number(review.rating || review.score || review['평점'])
            if (!isNaN(rating)) {
              totalReviews += 1
              if (rating <= 2) {
                lowRatingCount += 1
              }
            }
          })
        }
      } catch {
        // 리뷰 시트가 없는 경우 스킵
      }

      const lowRatingRatio = totalReviews > 0 ? lowRatingCount / totalReviews : 0

      checks.push({
        name: '품질 이슈 (저평점 비율)',
        status: lowRatingRatio > 0.15 ? 'fail' : lowRatingRatio > 0.08 ? 'warning' : 'pass',
        message: totalReviews > 0
          ? lowRatingRatio > 0.15
            ? `저평점(1-2점) 리뷰가 ${lowRatingCount}건(${(lowRatingRatio * 100).toFixed(1)}%)으로 급증했습니다. 품질 점검 필요!`
            : lowRatingRatio > 0.08
            ? `저평점 리뷰가 ${(lowRatingRatio * 100).toFixed(1)}%입니다. 모니터링 권장.`
            : '고객 만족도가 양호합니다.'
          : '리뷰 데이터가 없습니다.',
        value: lowRatingRatio * 100,
        threshold: 8,
      })

      // 9. 시즌성 미반영 체크 (YoY 비교)
      // 작년 동기 데이터 조회
      const lastYearStart = new Date(thirtyDaysAgo)
      lastYearStart.setFullYear(lastYearStart.getFullYear() - 1)
      const lastYearEnd = new Date(now)
      lastYearEnd.setFullYear(lastYearEnd.getFullYear() - 1)

      try {
        const lastYearResult = await this.getData({
          sheet: 'logistics',
          dateRange: {
            start: lastYearStart.toISOString().split('T')[0],
            end: lastYearEnd.toISOString().split('T')[0],
          },
        })

        if (lastYearResult.success && lastYearResult.data && lastYearResult.data.length > 0) {
          const lastYearGmv = lastYearResult.data.reduce((sum: number, row: any) => 
            sum + (Number(row['Total GMV']) || 0), 0)
          const yoyChange = lastYearGmv > 0 ? (totalGmv - lastYearGmv) / lastYearGmv : 0

          checks.push({
            name: '시즌성 분석 (YoY)',
            status: Math.abs(yoyChange) > 0.3 ? 'warning' : 'pass',
            message: Math.abs(yoyChange) > 0.3
              ? `전년 동기 대비 ${yoyChange > 0 ? '+' : ''}${(yoyChange * 100).toFixed(1)}% 변화. 시즌 요인 점검 필요.`
              : `전년 동기 대비 ${yoyChange > 0 ? '+' : ''}${(yoyChange * 100).toFixed(1)}%로 안정적입니다.`,
            value: yoyChange * 100,
            threshold: 30,
          })
        }
      } catch {
        // 작년 데이터가 없는 경우 스킵
      }

      const failCount = checks.filter(c => c.status === 'fail').length
      const warningCount = checks.filter(c => c.status === 'warning').length

      const result = {
        checks,
        summary: failCount > 0
          ? `🚨 ${failCount}개의 심각한 이슈와 ${warningCount}개의 주의 사항이 발견되었습니다.`
          : warningCount > 0
          ? `⚠️ ${warningCount}개의 주의 사항이 있습니다.`
          : '✅ 모든 체크 항목이 정상입니다.',
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
   * v2.2: 대시보드와 동일한 방식으로 기간 전반부/후반부 비교
   */
  async analyzeLongTermTrends(period: PeriodPreset = '90d'): Promise<{
    trends: Array<{
      metric: string
      direction: 'up' | 'down' | 'stable'
      magnitude: number
      period: string
      significance: 'high' | 'medium' | 'low'
      implication: string
    }>
    timeSeries?: TimeSeriesData  // v4.3: 차트용 시계열 데이터
  }> {
    const cacheKey = `long-term-trends:${period}`
    const cached = businessBrainCache.get<any>(cacheKey)
    if (cached) return cached

    try {
      const dateRange = DataProcessor.getDateRangeFromPreset(period)
      const periodDays = this.getPeriodDays(period)

      const logisticsResult = await this.getData({
        sheet: 'logistics',
        dateRange: {
          start: dateRange.start,
          end: dateRange.end,
        },
      })

      const orderData = logisticsResult.success ? logisticsResult.data : []
      console.log(`[BusinessBrain] 트렌드 분석 - 조회된 데이터: ${orderData.length}건, 기간: ${dateRange.start} ~ ${dateRange.end}`)
      
      const trends: Array<{
        metric: string
        direction: 'up' | 'down' | 'stable'
        magnitude: number
        period: string
        significance: 'high' | 'medium' | 'low'
        implication: string
      }> = []

      // 데이터가 없으면 빈 트렌드 반환
      if (orderData.length === 0) {
        console.log(`[BusinessBrain] 트렌드 분석 - 데이터 없음`)
        return { trends: [] }
      }

      // 대시보드와 동일한 방식: 기간을 전반부/후반부로 나눠서 비교
      const halfPeriod = Math.floor(periodDays / 2)
      const now = new Date()
      
      const secondHalfEnd = new Date(now)
      const secondHalfStart = new Date(now)
      secondHalfStart.setDate(secondHalfStart.getDate() - halfPeriod + 1)
      
      const firstHalfEnd = new Date(secondHalfStart)
      firstHalfEnd.setDate(firstHalfEnd.getDate() - 1)
      const firstHalfStart = new Date(firstHalfEnd)
      firstHalfStart.setDate(firstHalfStart.getDate() - halfPeriod + 1)

      // 기간별 데이터 필터링
      const filterByPeriod = (data: any[], start: Date, end: Date) => {
        return data.filter((row: any) => {
          const dateStr = row.order_created?.split('T')[0] || row.order_created?.split(' ')[0]
          if (!dateStr) return false
          const rowDate = new Date(dateStr)
          return rowDate >= start && rowDate <= end
        })
      }

      const firstHalfData = filterByPeriod(orderData, firstHalfStart, firstHalfEnd)
      const secondHalfData = filterByPeriod(orderData, secondHalfStart, secondHalfEnd)

      console.log(`[BusinessBrain] 트렌드 분석 - 전반부(${firstHalfStart.toISOString().split('T')[0]} ~ ${firstHalfEnd.toISOString().split('T')[0]}): ${firstHalfData.length}건`)
      console.log(`[BusinessBrain] 트렌드 분석 - 후반부(${secondHalfStart.toISOString().split('T')[0]} ~ ${secondHalfEnd.toISOString().split('T')[0]}): ${secondHalfData.length}건`)

      // 메트릭 계산
      const calcMetrics = (data: any[]) => {
        const gmv = data.reduce((sum, row) => sum + (Number(row['Total GMV']) || 0), 0)
        const orders = data.length
        const customers = new Set(data.map(row => row.user_id).filter(Boolean)).size
        const aov = orders > 0 ? gmv / orders : 0
        return { gmv, orders, customers, aov }
      }

      const firstMetrics = calcMetrics(firstHalfData)
      const secondMetrics = calcMetrics(secondHalfData)

      console.log(`[BusinessBrain] 트렌드 분석 - 전반부 GMV: $${firstMetrics.gmv.toFixed(0)}, 후반부 GMV: $${secondMetrics.gmv.toFixed(0)}`)

      // 변화율 계산 함수
      const calcChange = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0
        return ((current - previous) / previous) * 100
      }

      // GMV 트렌드
      const gmvChange = calcChange(secondMetrics.gmv, firstMetrics.gmv)
      if (firstMetrics.gmv > 0 || secondMetrics.gmv > 0) {
        trends.push({
          metric: '총 매출 (GMV)',
          direction: gmvChange > 5 ? 'up' : gmvChange < -5 ? 'down' : 'stable',
          magnitude: Math.abs(gmvChange),
          period: `${periodDays}일`,
          significance: Math.abs(gmvChange) > 20 ? 'high' : Math.abs(gmvChange) > 10 ? 'medium' : 'low',
          implication: gmvChange > 10
            ? '매출이 건강하게 성장하고 있습니다.'
            : gmvChange < -10
            ? '매출 하락 추세에 대한 원인 분석이 필요합니다.'
            : '매출이 안정적으로 유지되고 있습니다.',
        })
      }

      // 주문 건수 트렌드
      const orderChange = calcChange(secondMetrics.orders, firstMetrics.orders)
      if (firstMetrics.orders > 0 || secondMetrics.orders > 0) {
        trends.push({
          metric: '주문 건수',
          direction: orderChange > 5 ? 'up' : orderChange < -5 ? 'down' : 'stable',
          magnitude: Math.abs(orderChange),
          period: `${periodDays}일`,
          significance: Math.abs(orderChange) > 20 ? 'high' : Math.abs(orderChange) > 10 ? 'medium' : 'low',
          implication: orderChange > 10
            ? '주문 건수가 증가하고 있습니다.'
            : orderChange < -10
            ? '주문 건수 감소에 대한 대응이 필요합니다.'
            : '주문 건수가 안정적입니다.',
        })
      }

      // AOV 트렌드
      const aovChange = calcChange(secondMetrics.aov, firstMetrics.aov)
      if (firstMetrics.aov > 0 || secondMetrics.aov > 0) {
        trends.push({
          metric: '평균 주문 금액 (AOV)',
          direction: aovChange > 3 ? 'up' : aovChange < -3 ? 'down' : 'stable',
          magnitude: Math.abs(aovChange),
          period: `${periodDays}일`,
          significance: Math.abs(aovChange) > 15 ? 'high' : Math.abs(aovChange) > 7 ? 'medium' : 'low',
          implication: aovChange > 7
            ? '객단가가 상승하고 있습니다. 프리미엄 상품 전략이 효과적입니다.'
            : aovChange < -7
            ? '객단가 하락 추세입니다. 할인 의존도나 상품 믹스를 점검하세요.'
            : '객단가가 안정적으로 유지되고 있습니다.',
        })
      }

      // 활성 고객 수 트렌드
      const customerChange = calcChange(secondMetrics.customers, firstMetrics.customers)
      if (firstMetrics.customers > 0 || secondMetrics.customers > 0) {
        trends.push({
          metric: '활성 고객 수',
          direction: customerChange > 5 ? 'up' : customerChange < -5 ? 'down' : 'stable',
          magnitude: Math.abs(customerChange),
          period: `${periodDays}일`,
          significance: Math.abs(customerChange) > 20 ? 'high' : Math.abs(customerChange) > 10 ? 'medium' : 'low',
          implication: customerChange > 10
            ? '고객 기반이 확대되고 있습니다.'
            : customerChange < -0.1
            ? '고객 이탈이 우려됩니다. 리텐션 전략을 강화하세요.'
            : '고객 기반이 안정적입니다.',
        })
      }

      // v4.3: 차트용 시계열 데이터 생성
      const timeSeries = this.dataProcessor.processTimeSeries(
        orderData,
        'order_created',
        ['Total GMV'],
        'daily'
      )
      
      const result = { trends, timeSeries }
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
    const totalGmvUsd = orderData.reduce((sum, row) => sum + (Number(row['Total GMV']) || 0), 0)
    const totalGmvKrw = totalGmvUsd * USD_TO_KRW
    const totalOrders = orderData.length
    const aov = totalOrders > 0 ? totalGmvKrw / totalOrders : 0

    // 국가별 매출 분석
    const countryRevenue = new Map<string, number>()
    orderData.forEach((row: any) => {
      const country = row.country || 'Unknown'
      countryRevenue.set(country, (countryRevenue.get(country) || 0) + (Number(row['Total GMV']) || 0) * USD_TO_KRW)
    })
    const sortedCountries = [...countryRevenue.entries()].sort((a, b) => b[1] - a[1])
    const topCountry = sortedCountries[0]

    // 작가별 매출 분석
    const artistRevenue = new Map<string, number>()
    orderData.forEach((row: any) => {
      const artist = row['artist_name (kr)'] || 'Unknown'
      artistRevenue.set(artist, (artistRevenue.get(artist) || 0) + (Number(row['Total GMV']) || 0) * USD_TO_KRW)
    })
    const sortedArtists = [...artistRevenue.entries()].sort((a, b) => b[1] - a[1])
    const topArtist = sortedArtists[0]

    const criticalCount = insights.filter(i => i.type === 'critical').length
    const warningCount = insights.filter(i => i.type === 'warning').length
    const opportunityCount = insights.filter(i => i.type === 'opportunity').length

    // 풍부한 요약 생성
    const gmvFormatted = Math.round(totalGmvKrw).toLocaleString()
    const aovFormatted = Math.round(aov).toLocaleString()
    let summary = `비즈니스 건강도 ${healthScore.overall}점. `
    summary += `최근 30일 매출 ₩${gmvFormatted}, 주문 ${totalOrders.toLocaleString()}건, 평균 객단가 ₩${aovFormatted}. `

    if (topCountry) {
      const topCountryShare = totalGmvKrw > 0 ? (topCountry[1] / totalGmvKrw * 100).toFixed(0) : 0
      summary += `${this.getCountryName(topCountry[0])} 시장이 ${topCountryShare}%로 최대 비중. `
    }

    if (topArtist && topArtist[0] !== 'Unknown') {
      summary += `${topArtist[0]} 작가가 최고 매출. `
    }

    if (criticalCount > 0) {
      summary += `🚨 ${criticalCount}개 긴급 이슈. `
    }
    if (warningCount > 0) {
      summary += `⚠️ ${warningCount}개 주의 사항. `
    }
    if (opportunityCount > 0) {
      summary += `💡 ${opportunityCount}개 성장 기회 발견.`
    }

    return summary
  }

  private getCountryName(code: string): string {
    const countries: Record<string, string> = {
      JP: '일본',
      US: '미국',
      TW: '대만',
      HK: '홍콩',
      SG: '싱가포르',
      KR: '한국',
      CN: '중국',
      AU: '호주',
      CA: '캐나다',
      GB: '영국',
      DE: '독일',
      FR: '프랑스',
    }
    return countries[code] || code
  }

  private getPeriodDays(period: PeriodPreset): number {
    const days: Record<PeriodPreset, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '180d': 180,
      '365d': 365,
      'custom': 30,
    }
    return days[period] || 30
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
    // Total GMV는 USD 단위
    return `$${Math.round(value).toLocaleString()}`
  }

  // ==================== 새로운 분석 메서드 (PRD 미구현 영역) ====================

  /**
   * 코호트 분석 실행
   * PRD 섹션 2.2.2 - 가입 월별 코호트, 리텐션, LTV
   */
  async runCohortAnalysis(): Promise<CohortAnalysis> {
    const cacheKey = 'cohort-analysis'
    const cached = businessBrainCache.get<CohortAnalysis>(cacheKey)
    if (cached) return cached

    try {
      const now = new Date()
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

      const logisticsResult = await this.getData({
        sheet: 'logistics',
        dateRange: {
          start: ninetyDaysAgo.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0],
        },
      })

      const orderData = logisticsResult.success ? logisticsResult.data : []
      const result = this.dataProcessor.runCohortAnalysis([], orderData, 'order_created')

      businessBrainCache.set(cacheKey, result, CACHE_TTL.insights)
      return result
    } catch (error: any) {
      console.error('[BusinessBrainAgent] 코호트 분석 오류:', error)
      throw error
    }
  }

  /**
   * RFM 세분화 실행
   * PRD 섹션 2.2.3 - 7개 세그먼트, 이동 추적
   */
  async runRFMAnalysis(): Promise<RFMAnalysis> {
    const cacheKey = 'rfm-analysis'
    const cached = businessBrainCache.get<RFMAnalysis>(cacheKey)
    if (cached) return cached

    try {
      const now = new Date()
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

      const logisticsResult = await this.getData({
        sheet: 'logistics',
        dateRange: {
          start: ninetyDaysAgo.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0],
        },
      })

      const orderData = logisticsResult.success ? logisticsResult.data : []
      const result = this.dataProcessor.runRFMSegmentation(orderData, {
        analysisDate: now,
      })

      businessBrainCache.set(cacheKey, result, CACHE_TTL.insights)
      return result
    } catch (error: any) {
      console.error('[BusinessBrainAgent] RFM 분석 오류:', error)
      throw error
    }
  }

  /**
   * 파레토 분석 실행
   * PRD 섹션 2.2.4 - 작가/상품/국가 집중도
   */
  async runParetoAnalysis(): Promise<ParetoAnalysis> {
    const cacheKey = 'pareto-analysis'
    const cached = businessBrainCache.get<ParetoAnalysis>(cacheKey)
    if (cached) return cached

    try {
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const logisticsResult = await this.getData({
        sheet: 'logistics',
        dateRange: {
          start: thirtyDaysAgo.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0],
        },
      })

      const orderData = logisticsResult.success ? logisticsResult.data : []
      const result = this.dataProcessor.runParetoAnalysis(orderData, 'artist_name (kr)', 'Total GMV')

      businessBrainCache.set(cacheKey, result, CACHE_TTL.insights)
      return result
    } catch (error: any) {
      console.error('[BusinessBrainAgent] 파레토 분석 오류:', error)
      throw error
    }
  }

  /**
   * 상관관계 분석 실행
   * PRD 섹션 2.2.5 - 변수 간 상관관계, 선행 지표 발견
   */
  async runCorrelationAnalysis(): Promise<CorrelationAnalysis> {
    const cacheKey = 'correlation-analysis'
    const cached = businessBrainCache.get<CorrelationAnalysis>(cacheKey)
    if (cached) return cached

    try {
      const now = new Date()
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

      const logisticsResult = await this.getData({
        sheet: 'logistics',
        dateRange: {
          start: ninetyDaysAgo.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0],
        },
      })

      const orderData = logisticsResult.success ? logisticsResult.data : []
      const result = this.dataProcessor.analyzeCorrelations(orderData, [
        'gmv', 'orders', 'uniqueCustomers'
      ])

      businessBrainCache.set(cacheKey, result, CACHE_TTL.insights)
      return result
    } catch (error: any) {
      console.error('[BusinessBrainAgent] 상관관계 분석 오류:', error)
      throw error
    }
  }

  /**
   * 이상 탐지 실행
   * PRD 섹션 2.2.6 - Z-score 기반 이상치 감지
   */
  async runAnomalyDetection(
    sensitivity: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<AnomalyDetection> {
    const cacheKey = `anomaly-detection:${sensitivity}`
    const cached = businessBrainCache.get<AnomalyDetection>(cacheKey)
    if (cached) return cached

    try {
      const now = new Date()
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

      const logisticsResult = await this.getData({
        sheet: 'logistics',
        dateRange: {
          start: ninetyDaysAgo.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0],
        },
      })

      const orderData = logisticsResult.success ? logisticsResult.data : []
      
      // 시계열 데이터 생성
      const timeSeries = this.dataProcessor.processTimeSeries(
        orderData,
        'order_created',
        ['Total GMV'],
        'daily'
      )

      const result = this.dataProcessor.detectAnomalies(timeSeries, sensitivity)

      businessBrainCache.set(cacheKey, result, CACHE_TTL.insights)
      return result
    } catch (error: any) {
      console.error('[BusinessBrainAgent] 이상 탐지 오류:', error)
      throw error
    }
  }

  /**
   * 시계열 분석 실행
   * PRD 섹션 2.2.1 - 일별/주별/월별 집계, 이동평균
   */
  async runTimeSeriesAnalysis(): Promise<TimeSeriesData> {
    const cacheKey = 'timeseries-analysis'
    const cached = businessBrainCache.get<TimeSeriesData>(cacheKey)
    if (cached) return cached

    try {
      const now = new Date()
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

      const logisticsResult = await this.getData({
        sheet: 'logistics',
        dateRange: {
          start: ninetyDaysAgo.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0],
        },
      })

      const orderData = logisticsResult.success ? logisticsResult.data : []
      const result = this.dataProcessor.processTimeSeries(
        orderData,
        'order_created',
        ['Total GMV'],
        'daily'
      )

      businessBrainCache.set(cacheKey, result, CACHE_TTL.insights)
      return result
    } catch (error: any) {
      console.error('[BusinessBrainAgent] 시계열 분석 오류:', error)
      throw error
    }
  }

  /**
   * 종합 고급 분석 실행
   * 모든 분석을 병렬로 실행하고 결과 통합
   */
  async runAdvancedAnalytics(): Promise<{
    cohort: CohortAnalysis
    rfm: RFMAnalysis
    pareto: ParetoAnalysis
    correlation: CorrelationAnalysis
    anomaly: AnomalyDetection
    timeSeries: TimeSeriesData
  }> {
    const cacheKey = 'advanced-analytics'
    const cached = businessBrainCache.get<any>(cacheKey)
    if (cached) return cached

    try {
      const [cohort, rfm, pareto, correlation, anomaly, timeSeries] = await Promise.all([
        this.runCohortAnalysis(),
        this.runRFMAnalysis(),
        this.runParetoAnalysis(),
        this.runCorrelationAnalysis(),
        this.runAnomalyDetection('medium'),
        this.runTimeSeriesAnalysis(),
      ])

      const result = { cohort, rfm, pareto, correlation, anomaly, timeSeries }
      businessBrainCache.set(cacheKey, result, CACHE_TTL.insights)
      return result
    } catch (error: any) {
      console.error('[BusinessBrainAgent] 고급 분석 오류:', error)
      throw error
    }
  }

  // ==================== 기간별 분석 메서드 (v2.1) ====================

  /**
   * 기간 기반 분석 실행
   * 다양한 기간 프리셋 지원 (7d, 30d, 90d, 180d, 365d, custom)
   */
  async runAnalysisWithPeriod(
    analysisType: 'rfm' | 'pareto' | 'cohort' | 'anomaly' | 'timeseries',
    period: PeriodPreset = '30d',
    customRange?: DateRange
  ): Promise<any> {
    const dateRange = DataProcessor.getDateRangeFromPreset(period, customRange)
    const cacheKey = `${analysisType}-${period}-${dateRange.start}-${dateRange.end}`
    
    const cached = businessBrainCache.get<any>(cacheKey)
    if (cached) return cached

    try {
      const logisticsResult = await this.getData({
        sheet: 'logistics',
        dateRange: {
          start: dateRange.start,
          end: dateRange.end,
        },
      })

      const orderData = logisticsResult.success ? logisticsResult.data : []
      let result: any

      switch (analysisType) {
        case 'rfm':
          result = this.dataProcessor.runRFMSegmentation(orderData, {
            analysisDate: new Date(dateRange.end),
          })
          break
        case 'pareto':
          result = this.dataProcessor.runParetoAnalysis(orderData, 'artist_name (kr)', 'Total GMV')
          break
        case 'cohort':
          result = this.dataProcessor.runCohortAnalysis([], orderData, 'order_created')
          break
        case 'anomaly':
          const timeSeries = this.dataProcessor.processTimeSeries(orderData, 'order_created', ['Total GMV'], 'daily')
          result = this.dataProcessor.detectAnomalies(timeSeries, 'medium')
          break
        case 'timeseries':
          result = this.dataProcessor.processTimeSeries(orderData, 'order_created', ['Total GMV'], 'daily')
          break
      }

      businessBrainCache.set(cacheKey, result, CACHE_TTL.insights)
      return { ...result, period: { preset: period, ...dateRange } }
    } catch (error: any) {
      console.error(`[BusinessBrainAgent] 기간별 ${analysisType} 분석 오류:`, error)
      throw error
    }
  }

  /**
   * 매출 예측 실행
   */
  async runForecast(
    period: PeriodPreset = '90d',
    forecastDays: number = 30,
    customRange?: DateRange
  ): Promise<ForecastResult> {
    const dateRange = DataProcessor.getDateRangeFromPreset(period, customRange)
    const cacheKey = `forecast-${period}-${forecastDays}-${dateRange.start}`
    
    const cached = businessBrainCache.get<ForecastResult>(cacheKey)
    if (cached) return cached

    try {
      const logisticsResult = await this.getData({
        sheet: 'logistics',
        dateRange: {
          start: dateRange.start,
          end: dateRange.end,
        },
      })

      const orderData = logisticsResult.success ? logisticsResult.data : []
      const result = this.dataProcessor.forecast(orderData, 'order_created', forecastDays)

      businessBrainCache.set(cacheKey, result, CACHE_TTL.insights)
      return result
    } catch (error: any) {
      console.error('[BusinessBrainAgent] 예측 오류:', error)
      throw error
    }
  }

  /**
   * 기간 비교 분석 실행
   */
  async runPeriodComparison(
    period1: DateRange,
    period2: DateRange,
    period1Label?: string,
    period2Label?: string
  ): Promise<PeriodComparison> {
    const cacheKey = `comparison-${period1.start}-${period1.end}-${period2.start}-${period2.end}`
    
    const cached = businessBrainCache.get<PeriodComparison>(cacheKey)
    if (cached) return cached

    try {
      // 두 기간을 포함하는 전체 범위 조회
      const allStart = period1.start < period2.start ? period1.start : period2.start
      const allEnd = period1.end > period2.end ? period1.end : period2.end

      const logisticsResult = await this.getData({
        sheet: 'logistics',
        dateRange: {
          start: allStart,
          end: allEnd,
        },
      })

      const orderData = logisticsResult.success ? logisticsResult.data : []
      const result = this.dataProcessor.comparePeriods(
        orderData,
        period1,
        period2,
        period1Label || `${period1.start} ~ ${period1.end}`,
        period2Label || `${period2.start} ~ ${period2.end}`
      )

      businessBrainCache.set(cacheKey, result, CACHE_TTL.insights)
      return result
    } catch (error: any) {
      console.error('[BusinessBrainAgent] 기간 비교 오류:', error)
      throw error
    }
  }

  /**
   * 다중 기간 트렌드 분석
   */
  async runMultiPeriodAnalysis(
    periodType: 'weekly' | 'monthly' | 'quarterly' = 'monthly',
    numPeriods: number = 6
  ): Promise<MultiPeriodAnalysis> {
    const cacheKey = `multi-period-${periodType}-${numPeriods}`
    
    const cached = businessBrainCache.get<MultiPeriodAnalysis>(cacheKey)
    if (cached) return cached

    try {
      // 충분한 기간의 데이터 조회 (더 넉넉하게)
      const daysNeeded = periodType === 'weekly' ? numPeriods * 7 + 14 :
                        periodType === 'monthly' ? numPeriods * 35 + 35 :
                        numPeriods * 100 + 100
      
      const now = new Date()
      const startDate = new Date(now.getTime() - daysNeeded * 24 * 60 * 60 * 1000)

      console.log(`[BusinessBrain] 다중 기간 분석 - 조회 기간: ${startDate.toISOString().split('T')[0]} ~ ${now.toISOString().split('T')[0]}`)

      const logisticsResult = await this.getData({
        sheet: 'logistics',
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0],
        },
      })

      const orderData = logisticsResult.success ? logisticsResult.data : []
      console.log(`[BusinessBrain] 다중 기간 분석 - 조회된 데이터: ${orderData.length}건`)
      
      // 데이터 샘플 확인
      if (orderData.length > 0) {
        const sampleDates = orderData.slice(0, 5).map((row: any) => row.order_created)
        console.log(`[BusinessBrain] 다중 기간 분석 - 샘플 날짜: ${sampleDates.join(', ')}`)
      }

      const result = this.dataProcessor.analyzeMultiplePeriods(orderData, periodType, numPeriods)
      
      console.log(`[BusinessBrain] 다중 기간 분석 결과 - 기간 수: ${result.periods.length}, 첫 기간 GMV: ${result.periods[0]?.gmv || 0}`)

      businessBrainCache.set(cacheKey, result, CACHE_TTL.insights)
      return result
    } catch (error: any) {
      console.error('[BusinessBrainAgent] 다중 기간 분석 오류:', error)
      throw error
    }
  }

  /**
   * 종합 인사이트 분석 (기간 기반)
   * 선택한 기간에 대한 모든 분석을 실행하고 핵심 인사이트 추출
   */
  async runComprehensiveAnalysis(
    period: PeriodPreset = '30d',
    customRange?: DateRange
  ): Promise<{
    period: { preset: string; start: string; end: string }
    summary: {
      gmv: number
      orders: number
      aov: number
      customers: number
      artists: number
    }
    comparison: PeriodComparison | null
    forecast: ForecastResult
    topInsights: string[]
    risks: string[]
    opportunities: string[]
    recommendations: string[]
  }> {
    const dateRange = DataProcessor.getDateRangeFromPreset(period, customRange)
    const cacheKey = `comprehensive-${period}-${dateRange.start}-${dateRange.end}`
    
    const cached = businessBrainCache.get<any>(cacheKey)
    if (cached) return cached

    try {
      // 현재 기간 데이터 조회
      const logisticsResult = await this.getData({
        sheet: 'logistics',
        dateRange: {
          start: dateRange.start,
          end: dateRange.end,
        },
      })

      const orderData = logisticsResult.success ? logisticsResult.data : []

      // 요약 계산
      const gmv = orderData.reduce((sum: number, row: any) => sum + (Number(row['Total GMV']) || 0), 0)
      const orders = orderData.length
      const customers = new Set(orderData.map((row: any) => row.user_id).filter(Boolean)).size
      const artists = new Set(orderData.map((row: any) => row['artist_name (kr)']).filter(Boolean)).size

      // 병렬 분석 실행
      const comparisonPeriod = DataProcessor.getComparisonPeriod(dateRange)
      
      // 비교: period1=이전기간, period2=현재기간 (변화율 = (현재-이전)/이전)
      const [comparison, forecast, pareto, rfm] = await Promise.all([
        this.runPeriodComparison(comparisonPeriod, dateRange, '이전 기간', '현재 기간').catch((e) => {
          console.error('[BusinessBrain] 기간 비교 실패:', e.message)
          return null
        }),
        this.runForecast(period, 14, customRange).catch(() => null),
        this.dataProcessor.runParetoAnalysis(orderData, 'artist_name (kr)', 'Total GMV'),
        this.dataProcessor.runRFMSegmentation(orderData, { analysisDate: new Date(dateRange.end) }),
      ])

      // 인사이트 추출
      const topInsights: string[] = []
      const risks: string[] = []
      const opportunities: string[] = []
      const recommendations: string[] = []

      // 비교 기반 인사이트 (이전 기간 데이터가 있는 경우에만)
      if (comparison && comparison.metrics.gmv.comparable) {
        topInsights.push(...comparison.insights)
        
        // 실제 비교가 가능한 경우에만 변화율 기반 인사이트 추가
        if (comparison.metrics.gmv.changePercent !== null && comparison.metrics.gmv.changePercent < -10) {
          risks.push(`매출이 이전 기간 대비 ${Math.abs(comparison.metrics.gmv.changePercent).toFixed(1)}% 감소했습니다.`)
        }
        if (comparison.metrics.customers.changePercent !== null && comparison.metrics.customers.changePercent < -15) {
          risks.push(`활성 고객이 ${Math.abs(comparison.metrics.customers.changePercent).toFixed(1)}% 감소했습니다.`)
        }
        
        if (comparison.topGrowthSegments.length > 0) {
          const topGrowth = comparison.topGrowthSegments[0]
          opportunities.push(`${topGrowth.type === 'country' ? '국가' : '작가'} "${topGrowth.segment}"이(가) ${topGrowth.growth.toFixed(1)}% 성장했습니다.`)
        }
      } else if (comparison && !comparison.metrics.gmv.comparable && comparison.metrics.gmv.period2 > 0) {
        // 이전 기간 데이터가 없고 현재 기간에만 데이터가 있는 경우
        topInsights.push(`선택한 기간에 총 $${comparison.metrics.gmv.period2.toLocaleString()} 매출이 발생했습니다.`)
        topInsights.push('이전 비교 기간에 데이터가 없어 성장률 분석이 제한됩니다.')
      }

      // 집중도 기반 인사이트
      if (pareto.artistConcentration.top10Percent.revenueShare > 0.6) {
        risks.push(`상위 10% 작가가 매출의 ${(pareto.artistConcentration.top10Percent.revenueShare * 100).toFixed(1)}%를 차지합니다. 포트폴리오 다각화가 필요합니다.`)
      }

      // RFM 기반 인사이트
      const atRiskCount = rfm.atRiskVIPs.length
      if (atRiskCount > 0) {
        risks.push(`${atRiskCount}명의 VIP 고객이 이탈 위험 상태입니다.`)
        recommendations.push('이탈 위험 VIP 고객에게 리텐션 캠페인을 진행하세요.')
      }

      const vipSegment = rfm.segments.find(s => s.segment === 'VIP')
      if (vipSegment && vipSegment.percentage < 0.1) {
        opportunities.push('VIP 고객 비율이 낮습니다. 충성 고객 육성 프로그램을 검토하세요.')
      }

      // 예측 기반 인사이트
      if (forecast && forecast.trend === 'down') {
        risks.push('향후 매출 하락이 예상됩니다. 선제적 대응이 필요합니다.')
      } else if (forecast && forecast.trend === 'up') {
        opportunities.push(`향후 ${forecast.predictions.length}일간 매출 상승이 예상됩니다.`)
      }

      // 기본 추천
      if (recommendations.length === 0) {
        recommendations.push('현재 성과를 유지하면서 신규 고객 확보에 집중하세요.')
        recommendations.push('고객 세그먼트별 맞춤 마케팅 전략을 수립하세요.')
      }

      const result = {
        period: { preset: period, ...dateRange },
        summary: {
          gmv,
          orders,
          aov: orders > 0 ? gmv / orders : 0,
          customers,
          artists,
        },
        comparison,
        forecast: forecast || this.dataProcessor['emptyForecast'](),
        topInsights: topInsights.slice(0, 5),
        risks: risks.slice(0, 5),
        opportunities: opportunities.slice(0, 5),
        recommendations: recommendations.slice(0, 5),
      }

      businessBrainCache.set(cacheKey, result, CACHE_TTL.insights)
      return result
    } catch (error: any) {
      console.error('[BusinessBrainAgent] 종합 분석 오류:', error)
      throw error
    }
  }

  /**
   * 시계열 분해 분석 (v4.1)
   * STL 분해: 계절성 + 추세 + 잔차
   */
  async decomposeTimeSeries(
    period: PeriodPreset = '90d',
    metric: 'gmv' | 'orders' | 'aov' = 'gmv',
    periodType?: number
  ): Promise<TimeSeriesDecomposition> {
    const cacheKey = `timeseries-decompose:${period}:${metric}:${periodType || 'auto'}`
    
    const cached = businessBrainCache.get<TimeSeriesDecomposition>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      // 데이터 로드
      const result = await this.getData({
        sheet: 'logistics',
        skipCache: false
      })
      
      if (!result.success || !result.data || result.data.length === 0) {
        throw new Error('분석할 데이터가 없습니다.')
      }

      const logisticsData = result.data

      // 기간 필터
      const periodDays = period === '7d' ? 7 :
                        period === '30d' ? 30 :
                        period === '90d' ? 90 :
                        period === '180d' ? 180 :
                        period === '365d' ? 365 : 90
      
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - periodDays)
      
      const filteredData = logisticsData.filter((row: any) => {
        const orderDate = new Date(row['order_created'])
        return !isNaN(orderDate.getTime()) && orderDate >= startDate
      })

      if (filteredData.length === 0) {
        throw new Error('선택한 기간에 데이터가 없습니다.')
      }

      // 일별 데이터 집계
      const dailyData = this.timeSeriesDecomposer.aggregateToDaily(
        filteredData.map((row: any) => ({
          date: new Date(row['order_created']),
          value: metric === 'gmv' 
            ? parseFloat(row['Total GMV'] || row['total_gmv'] || '0') || 0
            : metric === 'orders'
            ? 1
            : parseFloat(row['Total GMV'] || row['total_gmv'] || '0') || 0
        })),
        'date',
        'value'
      )

      if (dailyData.length < 2) {
        throw new Error('시계열 분해를 위한 최소 데이터 포인트가 부족합니다.')
      }

      // 시계열 분해 실행
      const decomposition = this.timeSeriesDecomposer.decompose(
        dailyData,
        periodType
      )

      businessBrainCache.set(cacheKey, decomposition, CACHE_TTL.decomposition)
      return decomposition
    } catch (error: any) {
      console.error('[BusinessBrainAgent] 시계열 분해 오류:', error)
      throw error
    }
  }
}
