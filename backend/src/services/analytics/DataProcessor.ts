/**
 * DataProcessor - 고급 데이터 분석 엔진
 * PRD 섹션 2.2 데이터 가공 방법론 구현
 * 
 * 포함 기능:
 * - 코호트 분석 (Cohort Analysis)
 * - RFM 세분화 (RFM Segmentation)
 * - 파레토 분석 (Pareto Analysis)
 * - 상관관계 분석 (Correlation Analysis)
 * - 이상 탐지 (Anomaly Detection)
 * - 시계열 분석 (Time Series Analysis)
 * - 예측 모델 (Forecasting)
 * - 복합 기간 비교 분석
 * 
 * v2.1: 다양한 기간 지원, 예측 기능 추가
 */

// ==================== 타입 정의 ====================

export interface TimeSeriesData {
  dailyAggregation: Array<{ date: string; gmv: number; orders: number; aov: number }>
  weeklyAggregation: Array<{ week: string; gmv: number; orders: number; aov: number }>
  monthlyAggregation: Array<{ month: string; gmv: number; orders: number; aov: number }>
  movingAverage7d: number[]
  movingAverage30d: number[]
  periodOverPeriod: {
    wow: number  // Week over Week
    mom: number  // Month over Month
    yoy: number  // Year over Year
  }
}

export interface CohortData {
  cohortMonth: string
  totalUsers: number
  retentionByMonth: number[]  // [M0, M1, M2, ...]
  ltv: number
  avgOrdersPerUser: number
  avgDaysToFirstPurchase: number
}

export interface CohortAnalysis {
  cohorts: CohortData[]
  firstPurchaseConversion: Array<{
    cohortMonth: string
    registered: number
    converted: number
    conversionRate: number
    avgDaysToFirstPurchase: number
  }>
  overallRetentionCurve: number[]
  bestPerformingCohort: string
  worstPerformingCohort: string
}

export type RFMSegment = 'VIP' | 'Loyal' | 'Potential' | 'New' | 'AtRisk' | 'Dormant' | 'Lost'

export interface RFMCustomer {
  customerId: string
  recency: number      // 마지막 구매 후 경과일
  frequency: number    // 총 구매 횟수
  monetary: number     // 총 구매 금액
  rScore: number       // 1-5
  fScore: number       // 1-5
  mScore: number       // 1-5
  segment: RFMSegment
}

export interface RFMAnalysis {
  segments: Array<{
    segment: RFMSegment
    count: number
    percentage: number
    avgRecency: number
    avgFrequency: number
    avgMonetary: number
    totalRevenue: number
  }>
  segmentMigration: Array<{
    from: RFMSegment
    to: RFMSegment
    count: number
    period: string
  }>
  customers: RFMCustomer[]
  atRiskVIPs: RFMCustomer[]
  reactivationTargets: RFMCustomer[]
}

export interface ParetoAnalysis {
  artistConcentration: {
    top10Percent: { count: number; revenueShare: number; names: string[] }
    top20Percent: { count: number; revenueShare: number }
    bottom50Percent: { count: number; revenueShare: number }
    giniCoefficient: number
  }
  productConcentration: {
    top10Products: { products: string[]; revenueShare: number }
    longTail: { count: number; revenueShare: number }
  }
  countryConcentration: {
    primary: { country: string; share: number }
    secondary: { countries: string[]; share: number }
    herfindahlIndex: number
  }
  customerConcentration: {
    top10Percent: { count: number; revenueShare: number }
    top20Percent: { count: number; revenueShare: number }
  }
}

export interface CorrelationResult {
  variable1: string
  variable2: string
  coefficient: number  // -1 ~ 1
  significance: 'high' | 'medium' | 'low'
  interpretation: string
  sampleSize: number
}

export interface LeadingIndicator {
  indicator: string
  outcome: string
  lagDays: number
  correlation: number
  predictivePower: number
  recommendation: string
}

export interface CorrelationAnalysis {
  correlations: CorrelationResult[]
  leadingIndicators: LeadingIndicator[]
  strongPositive: CorrelationResult[]
  strongNegative: CorrelationResult[]
  matrix: Record<string, Record<string, number>>
}

export interface AnomalyRecord {
  date: string
  metric: string
  actualValue: number
  expectedValue: number
  deviation: number
  zScore: number
  severity: 'critical' | 'warning' | 'info'
  possibleCauses: string[]
}

export interface PatternBreak {
  metric: string
  breakDate: string
  beforePattern: string
  afterPattern: string
  significance: number
  description: string
}

export interface AnomalyDetection {
  anomalies: AnomalyRecord[]
  patternBreaks: PatternBreak[]
  trendChanges: Array<{
    metric: string
    changeDate: string
    beforeTrend: number
    afterTrend: number
    significance: string
  }>
}

// ==================== 예측 관련 타입 ====================

export interface ForecastResult {
  metric: string
  historicalData: Array<{ date: string; value: number }>
  predictions: Array<{ date: string; predicted: number; lower: number; upper: number }>
  trend: 'up' | 'down' | 'stable'
  confidence: number
  seasonality: {
    weekly: boolean
    monthly: boolean
    pattern?: string
  }
  accuracy: {
    mape: number  // Mean Absolute Percentage Error
    rmse: number  // Root Mean Square Error
  }
}

export interface PeriodComparison {
  period1: { start: string; end: string; label: string }
  period2: { start: string; end: string; label: string }
  metrics: {
    gmv: { period1: number; period2: number; change: number; changePercent: number }
    orders: { period1: number; period2: number; change: number; changePercent: number }
    aov: { period1: number; period2: number; change: number; changePercent: number }
    customers: { period1: number; period2: number; change: number; changePercent: number }
  }
  topGrowthSegments: Array<{ segment: string; type: string; growth: number }>
  topDeclineSegments: Array<{ segment: string; type: string; decline: number }>
  insights: string[]
}

export interface MultiPeriodAnalysis {
  periods: Array<{
    label: string
    start: string
    end: string
    gmv: number
    orders: number
    aov: number
    customers: number
  }>
  trends: {
    gmv: { direction: 'up' | 'down' | 'stable'; avgGrowth: number }
    orders: { direction: 'up' | 'down' | 'stable'; avgGrowth: number }
    aov: { direction: 'up' | 'down' | 'stable'; avgGrowth: number }
  }
  seasonalityDetected: boolean
  bestPeriod: string
  worstPeriod: string
  insights: string[]
}

// 기간 프리셋 타입
export type PeriodPreset = '7d' | '30d' | '90d' | '180d' | '365d' | 'custom'

export interface DateRange {
  start: string
  end: string
}

// ==================== DataProcessor 클래스 ====================

export class DataProcessor {
  
  // ==================== 시계열 분석 ====================
  
  /**
   * 시계열 데이터 가공
   */
  processTimeSeries(
    data: any[],
    dateColumn: string,
    valueColumns: string[],
    granularity: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): TimeSeriesData {
    // 일별 집계
    const dailyMap = new Map<string, { gmv: number; orders: number }>()
    
    data.forEach(row => {
      const dateStr = this.extractDate(row[dateColumn])
      if (!dateStr) return
      
      const existing = dailyMap.get(dateStr) || { gmv: 0, orders: 0 }
      existing.gmv += Number(row['Total GMV']) || 0
      existing.orders += 1
      dailyMap.set(dateStr, existing)
    })

    // 정렬된 일별 데이터
    const sortedDates = [...dailyMap.keys()].sort()
    const dailyAggregation = sortedDates.map(date => {
      const d = dailyMap.get(date)!
      return {
        date,
        gmv: d.gmv,
        orders: d.orders,
        aov: d.orders > 0 ? d.gmv / d.orders : 0,
      }
    })

    // 주별 집계
    const weeklyMap = new Map<string, { gmv: number; orders: number }>()
    dailyAggregation.forEach(d => {
      const week = this.getWeekNumber(d.date)
      const existing = weeklyMap.get(week) || { gmv: 0, orders: 0 }
      existing.gmv += d.gmv
      existing.orders += d.orders
      weeklyMap.set(week, existing)
    })

    const weeklyAggregation = [...weeklyMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([week, d]) => ({
        week,
        gmv: d.gmv,
        orders: d.orders,
        aov: d.orders > 0 ? d.gmv / d.orders : 0,
      }))

    // 월별 집계
    const monthlyMap = new Map<string, { gmv: number; orders: number }>()
    dailyAggregation.forEach(d => {
      const month = d.date.substring(0, 7)
      const existing = monthlyMap.get(month) || { gmv: 0, orders: 0 }
      existing.gmv += d.gmv
      existing.orders += d.orders
      monthlyMap.set(month, existing)
    })

    const monthlyAggregation = [...monthlyMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, d]) => ({
        month,
        gmv: d.gmv,
        orders: d.orders,
        aov: d.orders > 0 ? d.gmv / d.orders : 0,
      }))

    // 이동평균 계산
    const gmvValues = dailyAggregation.map(d => d.gmv)
    const movingAverage7d = this.calculateMovingAverage(gmvValues, 7)
    const movingAverage30d = this.calculateMovingAverage(gmvValues, 30)

    // 기간 대비 변화율
    const periodOverPeriod = this.calculatePeriodOverPeriod(dailyAggregation, weeklyAggregation, monthlyAggregation)

    return {
      dailyAggregation,
      weeklyAggregation,
      monthlyAggregation,
      movingAverage7d,
      movingAverage30d,
      periodOverPeriod,
    }
  }

  // ==================== 코호트 분석 ====================

  /**
   * 코호트 분석 실행
   */
  runCohortAnalysis(
    users: any[],
    orders: any[],
    cohortColumn: string = 'created_at'
  ): CohortAnalysis {
    // 사용자별 첫 주문 월 (코호트 정의)
    const userCohorts = new Map<string, string>()
    const userOrders = new Map<string, any[]>()

    // 주문을 사용자별로 그룹화
    orders.forEach(order => {
      const userId = order.user_id
      if (!userId) return

      const orderDate = this.extractDate(order.order_created)
      if (!orderDate) return

      if (!userOrders.has(userId)) {
        userOrders.set(userId, [])
      }
      userOrders.get(userId)!.push({ ...order, orderDate })
    })

    // 각 사용자의 코호트 (첫 주문 월) 결정
    userOrders.forEach((orders, userId) => {
      const sortedOrders = orders.sort((a, b) => a.orderDate.localeCompare(b.orderDate))
      const firstOrderMonth = sortedOrders[0].orderDate.substring(0, 7)
      userCohorts.set(userId, firstOrderMonth)
    })

    // 코호트별 데이터 집계
    const cohortData = new Map<string, {
      users: Set<string>
      ordersByMonth: Map<string, Set<string>>
      totalGmv: number
      totalOrders: number
    }>()

    userOrders.forEach((orders, userId) => {
      const cohort = userCohorts.get(userId)!
      
      if (!cohortData.has(cohort)) {
        cohortData.set(cohort, {
          users: new Set(),
          ordersByMonth: new Map(),
          totalGmv: 0,
          totalOrders: 0,
        })
      }

      const cd = cohortData.get(cohort)!
      cd.users.add(userId)

      orders.forEach(order => {
        const orderMonth = order.orderDate.substring(0, 7)
        if (!cd.ordersByMonth.has(orderMonth)) {
          cd.ordersByMonth.set(orderMonth, new Set())
        }
        cd.ordersByMonth.get(orderMonth)!.add(userId)
        cd.totalGmv += Number(order['Total GMV']) || 0
        cd.totalOrders += 1
      })
    })

    // 코호트 분석 결과 생성
    const cohorts: CohortData[] = []
    const sortedCohortMonths = [...cohortData.keys()].sort()

    sortedCohortMonths.forEach(cohortMonth => {
      const cd = cohortData.get(cohortMonth)!
      const totalUsers = cd.users.size
      
      // 리텐션 계산 (M0, M1, M2, ...)
      const retentionByMonth: number[] = []
      const allMonths = [...cd.ordersByMonth.keys()].sort()
      
      for (let i = 0; i < 12; i++) {
        const targetMonth = this.addMonths(cohortMonth, i)
        const activeUsers = cd.ordersByMonth.get(targetMonth)?.size || 0
        const retention = totalUsers > 0 ? activeUsers / totalUsers : 0
        retentionByMonth.push(retention)
      }

      cohorts.push({
        cohortMonth,
        totalUsers,
        retentionByMonth,
        ltv: totalUsers > 0 ? cd.totalGmv / totalUsers : 0,
        avgOrdersPerUser: totalUsers > 0 ? cd.totalOrders / totalUsers : 0,
        avgDaysToFirstPurchase: 0, // 사용자 데이터 필요
      })
    })

    // 전체 리텐션 곡선 (평균)
    const overallRetentionCurve: number[] = []
    for (let i = 0; i < 12; i++) {
      const retentions = cohorts.map(c => c.retentionByMonth[i] || 0)
      const avgRetention = retentions.length > 0 
        ? retentions.reduce((a, b) => a + b, 0) / retentions.length 
        : 0
      overallRetentionCurve.push(avgRetention)
    }

    // 최고/최저 성과 코호트
    const cohortsByLtv = [...cohorts].sort((a, b) => b.ltv - a.ltv)
    const bestPerformingCohort = cohortsByLtv[0]?.cohortMonth || ''
    const worstPerformingCohort = cohortsByLtv[cohortsByLtv.length - 1]?.cohortMonth || ''

    return {
      cohorts,
      firstPurchaseConversion: [], // 사용자 가입 데이터 필요
      overallRetentionCurve,
      bestPerformingCohort,
      worstPerformingCohort,
    }
  }

  // ==================== RFM 세분화 ====================

  /**
   * RFM 세분화 실행
   */
  runRFMSegmentation(
    orders: any[],
    config: {
      recencyBuckets?: number[]
      frequencyBuckets?: number[]
      monetaryBuckets?: number[]
      analysisDate?: Date
    } = {}
  ): RFMAnalysis {
    const analysisDate = config.analysisDate || new Date()
    
    // 고객별 RFM 지표 계산
    const customerMetrics = new Map<string, {
      lastOrderDate: Date
      orderCount: number
      totalSpent: number
    }>()

    orders.forEach(order => {
      const customerId = order.user_id
      if (!customerId) return

      const orderDate = new Date(order.order_created)
      const gmv = Number(order['Total GMV']) || 0

      if (!customerMetrics.has(customerId)) {
        customerMetrics.set(customerId, {
          lastOrderDate: orderDate,
          orderCount: 0,
          totalSpent: 0,
        })
      }

      const cm = customerMetrics.get(customerId)!
      if (orderDate > cm.lastOrderDate) {
        cm.lastOrderDate = orderDate
      }
      cm.orderCount += 1
      cm.totalSpent += gmv
    })

    // RFM 값 계산
    const rfmData: Array<{
      customerId: string
      recency: number
      frequency: number
      monetary: number
    }> = []

    customerMetrics.forEach((metrics, customerId) => {
      const recency = Math.floor(
        (analysisDate.getTime() - metrics.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      rfmData.push({
        customerId,
        recency,
        frequency: metrics.orderCount,
        monetary: metrics.totalSpent,
      })
    })

    // 분위수 계산
    const recencyValues = rfmData.map(r => r.recency).sort((a, b) => a - b)
    const frequencyValues = rfmData.map(r => r.frequency).sort((a, b) => a - b)
    const monetaryValues = rfmData.map(r => r.monetary).sort((a, b) => a - b)

    const getQuintile = (values: number[], value: number, inverse: boolean = false): number => {
      const index = values.findIndex(v => v >= value)
      const percentile = index >= 0 ? index / values.length : 1
      const quintile = Math.ceil(percentile * 5) || 1
      return inverse ? 6 - quintile : quintile  // Recency는 낮을수록 좋음
    }

    // 고객별 RFM 점수 및 세그먼트 할당
    const customers: RFMCustomer[] = rfmData.map(r => {
      const rScore = getQuintile(recencyValues, r.recency, true)  // 낮을수록 좋음
      const fScore = getQuintile(frequencyValues, r.frequency, false)
      const mScore = getQuintile(monetaryValues, r.monetary, false)
      
      const segment = this.determineRFMSegment(rScore, fScore, mScore)

      return {
        customerId: r.customerId,
        recency: r.recency,
        frequency: r.frequency,
        monetary: r.monetary,
        rScore,
        fScore,
        mScore,
        segment,
      }
    })

    // 세그먼트별 집계
    const segmentStats = new Map<RFMSegment, {
      count: number
      totalRecency: number
      totalFrequency: number
      totalMonetary: number
    }>()

    const allSegments: RFMSegment[] = ['VIP', 'Loyal', 'Potential', 'New', 'AtRisk', 'Dormant', 'Lost']
    allSegments.forEach(seg => {
      segmentStats.set(seg, { count: 0, totalRecency: 0, totalFrequency: 0, totalMonetary: 0 })
    })

    customers.forEach(c => {
      const stats = segmentStats.get(c.segment)!
      stats.count += 1
      stats.totalRecency += c.recency
      stats.totalFrequency += c.frequency
      stats.totalMonetary += c.monetary
    })

    const totalCustomers = customers.length
    const segments = allSegments.map(segment => {
      const stats = segmentStats.get(segment)!
      return {
        segment,
        count: stats.count,
        percentage: totalCustomers > 0 ? stats.count / totalCustomers : 0,
        avgRecency: stats.count > 0 ? stats.totalRecency / stats.count : 0,
        avgFrequency: stats.count > 0 ? stats.totalFrequency / stats.count : 0,
        avgMonetary: stats.count > 0 ? stats.totalMonetary / stats.count : 0,
        totalRevenue: stats.totalMonetary,
      }
    })

    // 위험 VIP 및 재활성화 대상 추출
    const atRiskVIPs = customers.filter(c => 
      c.segment === 'AtRisk' && c.monetary > this.getPercentile(monetaryValues, 80)
    )

    const reactivationTargets = customers.filter(c =>
      (c.segment === 'Dormant' || c.segment === 'AtRisk') && c.frequency >= 3
    )

    return {
      segments,
      segmentMigration: [], // 이전 기간 데이터 필요
      customers,
      atRiskVIPs,
      reactivationTargets,
    }
  }

  /**
   * RFM 점수로 세그먼트 결정
   */
  private determineRFMSegment(r: number, f: number, m: number): RFMSegment {
    const avg = (r + f + m) / 3

    // VIP: 모든 점수가 높음 (4-5)
    if (r >= 4 && f >= 4 && m >= 4) return 'VIP'
    
    // Loyal: 빈도와 금액이 높음
    if (f >= 4 && m >= 3) return 'Loyal'
    
    // AtRisk: 과거에 좋았으나 최근 활동 없음
    if (r <= 2 && f >= 3) return 'AtRisk'
    
    // Dormant: 오래 전 구매, 적은 빈도
    if (r <= 2 && f <= 2) return 'Dormant'
    
    // Lost: 모든 점수가 낮음
    if (avg <= 2) return 'Lost'
    
    // New: 최근 구매, 낮은 빈도
    if (r >= 4 && f <= 2) return 'New'
    
    // Potential: 중간 수준
    return 'Potential'
  }

  // ==================== 파레토 분석 ====================

  /**
   * 파레토 분석 실행
   */
  runParetoAnalysis(
    data: any[],
    groupColumn: string,
    valueColumn: string
  ): ParetoAnalysis {
    // 작가별 매출 집계
    const artistRevenue = new Map<string, number>()
    const countryRevenue = new Map<string, number>()
    const customerRevenue = new Map<string, number>()
    let totalRevenue = 0

    data.forEach(row => {
      const gmv = Number(row['Total GMV']) || 0
      totalRevenue += gmv

      const artist = row['artist_name (kr)']
      if (artist) {
        artistRevenue.set(artist, (artistRevenue.get(artist) || 0) + gmv)
      }

      const country = row.country
      if (country) {
        countryRevenue.set(country, (countryRevenue.get(country) || 0) + gmv)
      }

      const customer = row.user_id
      if (customer) {
        customerRevenue.set(customer, (customerRevenue.get(customer) || 0) + gmv)
      }
    })

    // 작가 집중도
    const sortedArtists = [...artistRevenue.entries()].sort((a, b) => b[1] - a[1])
    const artistCount = sortedArtists.length
    const top10ArtistCount = Math.ceil(artistCount * 0.1)
    const top20ArtistCount = Math.ceil(artistCount * 0.2)
    const bottom50ArtistCount = Math.floor(artistCount * 0.5)

    const top10ArtistRevenue = sortedArtists.slice(0, top10ArtistCount).reduce((sum, [, rev]) => sum + rev, 0)
    const top20ArtistRevenue = sortedArtists.slice(0, top20ArtistCount).reduce((sum, [, rev]) => sum + rev, 0)
    const bottom50ArtistRevenue = sortedArtists.slice(-bottom50ArtistCount).reduce((sum, [, rev]) => sum + rev, 0)

    const artistConcentration = {
      top10Percent: {
        count: top10ArtistCount,
        revenueShare: totalRevenue > 0 ? top10ArtistRevenue / totalRevenue : 0,
        names: sortedArtists.slice(0, top10ArtistCount).map(([name]) => name),
      },
      top20Percent: {
        count: top20ArtistCount,
        revenueShare: totalRevenue > 0 ? top20ArtistRevenue / totalRevenue : 0,
      },
      bottom50Percent: {
        count: bottom50ArtistCount,
        revenueShare: totalRevenue > 0 ? bottom50ArtistRevenue / totalRevenue : 0,
      },
      giniCoefficient: this.calculateGiniCoefficient(sortedArtists.map(([, rev]) => rev)),
    }

    // 국가 집중도
    const sortedCountries = [...countryRevenue.entries()].sort((a, b) => b[1] - a[1])
    const primaryCountry = sortedCountries[0]
    const secondaryCountries = sortedCountries.slice(1, 4)

    const countryConcentration = {
      primary: {
        country: primaryCountry?.[0] || '',
        share: totalRevenue > 0 && primaryCountry ? primaryCountry[1] / totalRevenue : 0,
      },
      secondary: {
        countries: secondaryCountries.map(([c]) => c),
        share: totalRevenue > 0 
          ? secondaryCountries.reduce((sum, [, rev]) => sum + rev, 0) / totalRevenue 
          : 0,
      },
      herfindahlIndex: this.calculateHerfindahlIndex(sortedCountries.map(([, rev]) => rev), totalRevenue),
    }

    // 고객 집중도
    const sortedCustomers = [...customerRevenue.entries()].sort((a, b) => b[1] - a[1])
    const customerCount = sortedCustomers.length
    const top10CustomerCount = Math.ceil(customerCount * 0.1)
    const top20CustomerCount = Math.ceil(customerCount * 0.2)

    const top10CustomerRevenue = sortedCustomers.slice(0, top10CustomerCount).reduce((sum, [, rev]) => sum + rev, 0)
    const top20CustomerRevenue = sortedCustomers.slice(0, top20CustomerCount).reduce((sum, [, rev]) => sum + rev, 0)

    const customerConcentration = {
      top10Percent: {
        count: top10CustomerCount,
        revenueShare: totalRevenue > 0 ? top10CustomerRevenue / totalRevenue : 0,
      },
      top20Percent: {
        count: top20CustomerCount,
        revenueShare: totalRevenue > 0 ? top20CustomerRevenue / totalRevenue : 0,
      },
    }

    return {
      artistConcentration,
      productConcentration: {
        top10Products: { products: [], revenueShare: 0 },
        longTail: { count: 0, revenueShare: 0 },
      },
      countryConcentration,
      customerConcentration,
    }
  }

  // ==================== 상관관계 분석 ====================

  /**
   * 상관관계 분석 실행
   */
  analyzeCorrelations(
    data: any[],
    columns: string[]
  ): CorrelationAnalysis {
    const correlations: CorrelationResult[] = []
    const matrix: Record<string, Record<string, number>> = {}

    // 일별 데이터로 변환
    const dailyData = this.aggregateByDate(data)

    // 모든 변수 쌍에 대해 상관계수 계산
    for (let i = 0; i < columns.length; i++) {
      matrix[columns[i]] = {}
      for (let j = 0; j < columns.length; j++) {
        if (i === j) {
          matrix[columns[i]][columns[j]] = 1
          continue
        }

        const values1 = dailyData.map(d => d[columns[i]] || 0)
        const values2 = dailyData.map(d => d[columns[j]] || 0)
        
        const coefficient = this.calculatePearsonCorrelation(values1, values2)
        matrix[columns[i]][columns[j]] = coefficient

        if (i < j) {  // 중복 방지
          correlations.push({
            variable1: columns[i],
            variable2: columns[j],
            coefficient,
            significance: this.getCorrelationSignificance(coefficient, values1.length),
            interpretation: this.interpretCorrelation(columns[i], columns[j], coefficient),
            sampleSize: values1.length,
          })
        }
      }
    }

    // 강한 상관관계 필터링
    const strongPositive = correlations.filter(c => c.coefficient >= 0.5)
    const strongNegative = correlations.filter(c => c.coefficient <= -0.5)

    // 선행 지표 탐지
    const leadingIndicators = this.detectLeadingIndicators(dailyData, columns)

    return {
      correlations,
      leadingIndicators,
      strongPositive,
      strongNegative,
      matrix,
    }
  }

  /**
   * 선행 지표 탐지
   */
  private detectLeadingIndicators(
    dailyData: any[],
    columns: string[]
  ): LeadingIndicator[] {
    const indicators: LeadingIndicator[] = []
    const outcomeMetrics = ['gmv', 'orders', 'revenue']
    const potentialIndicators = columns.filter(c => !outcomeMetrics.includes(c))

    for (const indicator of potentialIndicators) {
      for (const outcome of outcomeMetrics) {
        // 1-14일 시차로 상관관계 테스트
        for (const lag of [1, 3, 7, 14]) {
          const indicatorValues = dailyData.slice(0, -lag).map(d => d[indicator] || 0)
          const outcomeValues = dailyData.slice(lag).map(d => d[outcome] || 0)

          if (indicatorValues.length < 10) continue

          const correlation = this.calculatePearsonCorrelation(indicatorValues, outcomeValues)
          
          if (Math.abs(correlation) >= 0.4) {
            indicators.push({
              indicator,
              outcome,
              lagDays: lag,
              correlation,
              predictivePower: Math.abs(correlation),
              recommendation: this.generateLeadingIndicatorRecommendation(indicator, outcome, lag, correlation),
            })
          }
        }
      }
    }

    // 예측력 순으로 정렬
    return indicators.sort((a, b) => b.predictivePower - a.predictivePower).slice(0, 10)
  }

  // ==================== 이상 탐지 ====================

  /**
   * 이상 탐지 실행
   */
  detectAnomalies(
    timeSeries: TimeSeriesData,
    sensitivity: 'low' | 'medium' | 'high' = 'medium'
  ): AnomalyDetection {
    const thresholds = {
      low: 3,      // 3 표준편차
      medium: 2,   // 2 표준편차
      high: 1.5,   // 1.5 표준편차
    }
    const threshold = thresholds[sensitivity]

    const anomalies: AnomalyRecord[] = []
    const patternBreaks: PatternBreak[] = []

    // GMV 이상 탐지
    const gmvValues = timeSeries.dailyAggregation.map(d => d.gmv)
    const gmvMean = this.mean(gmvValues)
    const gmvStd = this.standardDeviation(gmvValues)

    timeSeries.dailyAggregation.forEach((day, index) => {
      const zScore = gmvStd > 0 ? (day.gmv - gmvMean) / gmvStd : 0
      
      if (Math.abs(zScore) >= threshold) {
        anomalies.push({
          date: day.date,
          metric: 'GMV',
          actualValue: day.gmv,
          expectedValue: gmvMean,
          deviation: day.gmv - gmvMean,
          zScore,
          severity: Math.abs(zScore) >= 3 ? 'critical' : Math.abs(zScore) >= 2 ? 'warning' : 'info',
          possibleCauses: this.suggestAnomalyCauses(day.date, zScore > 0 ? 'spike' : 'drop'),
        })
      }
    })

    // 주문 건수 이상 탐지
    const orderValues = timeSeries.dailyAggregation.map(d => d.orders)
    const orderMean = this.mean(orderValues)
    const orderStd = this.standardDeviation(orderValues)

    timeSeries.dailyAggregation.forEach((day) => {
      const zScore = orderStd > 0 ? (day.orders - orderMean) / orderStd : 0
      
      if (Math.abs(zScore) >= threshold) {
        anomalies.push({
          date: day.date,
          metric: 'Orders',
          actualValue: day.orders,
          expectedValue: orderMean,
          deviation: day.orders - orderMean,
          zScore,
          severity: Math.abs(zScore) >= 3 ? 'critical' : Math.abs(zScore) >= 2 ? 'warning' : 'info',
          possibleCauses: this.suggestAnomalyCauses(day.date, zScore > 0 ? 'spike' : 'drop'),
        })
      }
    })

    // 패턴 이탈 탐지 (트렌드 변화)
    const trendChanges = this.detectTrendChanges(gmvValues, timeSeries.dailyAggregation.map(d => d.date))
    trendChanges.forEach(change => {
      patternBreaks.push({
        metric: 'GMV',
        breakDate: change.date,
        beforePattern: change.beforeTrend > 0 ? '상승' : change.beforeTrend < 0 ? '하락' : '안정',
        afterPattern: change.afterTrend > 0 ? '상승' : change.afterTrend < 0 ? '하락' : '안정',
        significance: Math.abs(change.afterTrend - change.beforeTrend),
        description: `${change.date}부터 트렌드가 ${change.beforeTrend > 0 ? '상승' : '하락'}에서 ${change.afterTrend > 0 ? '상승' : '하락'}으로 변화`,
      })
    })

    return {
      anomalies: anomalies.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore)),
      patternBreaks,
      trendChanges: trendChanges.map(c => ({
        metric: 'GMV',
        changeDate: c.date,
        beforeTrend: c.beforeTrend,
        afterTrend: c.afterTrend,
        significance: Math.abs(c.afterTrend - c.beforeTrend) > 0.1 ? 'high' : 'medium',
      })),
    }
  }

  // ==================== 헬퍼 메서드 ====================

  private extractDate(dateValue: any): string {
    if (!dateValue) return ''
    const str = String(dateValue)
    return str.split('T')[0].split(' ')[0]
  }

  private getWeekNumber(dateStr: string): string {
    const date = new Date(dateStr)
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
    const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
    return `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
  }

  private addMonths(monthStr: string, months: number): string {
    const [year, month] = monthStr.split('-').map(Number)
    const date = new Date(year, month - 1 + months, 1)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  }

  private calculateMovingAverage(values: number[], window: number): number[] {
    const result: number[] = []
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - window + 1)
      const windowValues = values.slice(start, i + 1)
      result.push(windowValues.reduce((a, b) => a + b, 0) / windowValues.length)
    }
    return result
  }

  private calculatePeriodOverPeriod(
    daily: TimeSeriesData['dailyAggregation'],
    weekly: TimeSeriesData['weeklyAggregation'],
    monthly: TimeSeriesData['monthlyAggregation']
  ): TimeSeriesData['periodOverPeriod'] {
    // WoW
    const recentWeek = weekly[weekly.length - 1]?.gmv || 0
    const previousWeek = weekly[weekly.length - 2]?.gmv || 0
    const wow = previousWeek > 0 ? (recentWeek - previousWeek) / previousWeek : 0

    // MoM
    const recentMonth = monthly[monthly.length - 1]?.gmv || 0
    const previousMonth = monthly[monthly.length - 2]?.gmv || 0
    const mom = previousMonth > 0 ? (recentMonth - previousMonth) / previousMonth : 0

    // YoY (12개월 전 비교)
    const recentMonthData = monthly[monthly.length - 1]
    const yearAgoMonth = monthly.find(m => {
      if (!recentMonthData) return false
      const [y1, m1] = recentMonthData.month.split('-').map(Number)
      const [y2, m2] = m.month.split('-').map(Number)
      return y2 === y1 - 1 && m2 === m1
    })
    const yoy = yearAgoMonth && yearAgoMonth.gmv > 0
      ? (recentMonthData.gmv - yearAgoMonth.gmv) / yearAgoMonth.gmv
      : 0

    return { wow, mom, yoy }
  }

  private getPercentile(sortedValues: number[], percentile: number): number {
    const index = Math.ceil(sortedValues.length * percentile / 100) - 1
    return sortedValues[Math.max(0, index)]
  }

  private calculateGiniCoefficient(values: number[]): number {
    if (values.length === 0) return 0
    
    const sorted = [...values].sort((a, b) => a - b)
    const n = sorted.length
    const mean = sorted.reduce((a, b) => a + b, 0) / n
    
    if (mean === 0) return 0

    let sumDiff = 0
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        sumDiff += Math.abs(sorted[i] - sorted[j])
      }
    }

    return sumDiff / (2 * n * n * mean)
  }

  private calculateHerfindahlIndex(values: number[], total: number): number {
    if (total === 0) return 0
    return values.reduce((sum, v) => sum + Math.pow(v / total, 2), 0)
  }

  private aggregateByDate(data: any[]): any[] {
    const dailyMap = new Map<string, any>()

    data.forEach(row => {
      const date = this.extractDate(row.order_created)
      if (!date) return

      if (!dailyMap.has(date)) {
        dailyMap.set(date, { date, gmv: 0, orders: 0, customers: new Set() })
      }

      const d = dailyMap.get(date)!
      d.gmv += Number(row['Total GMV']) || 0
      d.orders += 1
      if (row.user_id) d.customers.add(row.user_id)
    })

    return [...dailyMap.values()]
      .map(d => ({ ...d, uniqueCustomers: d.customers.size }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  private calculatePearsonCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length)
    if (n < 2) return 0

    const meanX = this.mean(x.slice(0, n))
    const meanY = this.mean(y.slice(0, n))

    let numerator = 0
    let denomX = 0
    let denomY = 0

    for (let i = 0; i < n; i++) {
      const diffX = x[i] - meanX
      const diffY = y[i] - meanY
      numerator += diffX * diffY
      denomX += diffX * diffX
      denomY += diffY * diffY
    }

    const denominator = Math.sqrt(denomX * denomY)
    return denominator > 0 ? numerator / denominator : 0
  }

  private getCorrelationSignificance(r: number, n: number): 'high' | 'medium' | 'low' {
    // t-통계량 기반 유의성 판단
    const t = r * Math.sqrt((n - 2) / (1 - r * r))
    const absT = Math.abs(t)
    
    if (absT > 2.576) return 'high'   // p < 0.01
    if (absT > 1.96) return 'medium'  // p < 0.05
    return 'low'
  }

  private interpretCorrelation(var1: string, var2: string, r: number): string {
    const strength = Math.abs(r) >= 0.7 ? '강한' : Math.abs(r) >= 0.4 ? '중간 정도의' : '약한'
    const direction = r > 0 ? '양의' : '음의'
    
    return `${var1}와(과) ${var2} 사이에 ${strength} ${direction} 상관관계가 있습니다 (r=${r.toFixed(2)})`
  }

  private generateLeadingIndicatorRecommendation(
    indicator: string,
    outcome: string,
    lag: number,
    correlation: number
  ): string {
    const direction = correlation > 0 ? '증가' : '감소'
    return `${indicator}의 변화가 ${lag}일 후 ${outcome}의 ${direction}를 예측합니다. 이를 선행 지표로 활용하세요.`
  }

  private mean(values: number[]): number {
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
  }

  private standardDeviation(values: number[]): number {
    if (values.length < 2) return 0
    const avg = this.mean(values)
    const squareDiffs = values.map(v => Math.pow(v - avg, 2))
    return Math.sqrt(this.mean(squareDiffs))
  }

  private suggestAnomalyCauses(date: string, type: 'spike' | 'drop'): string[] {
    const dayOfWeek = new Date(date).getDay()
    const causes: string[] = []

    if (type === 'spike') {
      causes.push('프로모션 또는 마케팅 캠페인 효과')
      causes.push('시즌 수요 증가')
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        causes.push('주말 쇼핑 증가')
      }
      causes.push('바이럴 또는 언론 노출')
    } else {
      causes.push('시스템 장애 또는 결제 오류')
      causes.push('재고 부족')
      causes.push('경쟁사 프로모션')
      causes.push('시즌 비수기')
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        causes.push('평일 수요 감소')
      }
    }

    return causes
  }

  private detectTrendChanges(
    values: number[],
    dates: string[]
  ): Array<{ date: string; beforeTrend: number; afterTrend: number }> {
    const changes: Array<{ date: string; beforeTrend: number; afterTrend: number }> = []
    const windowSize = 7

    for (let i = windowSize; i < values.length - windowSize; i++) {
      const beforeWindow = values.slice(i - windowSize, i)
      const afterWindow = values.slice(i, i + windowSize)

      const beforeTrend = this.calculateTrendSlope(beforeWindow)
      const afterTrend = this.calculateTrendSlope(afterWindow)

      // 트렌드 방향이 바뀌거나 크게 변화한 경우
      if (
        (beforeTrend > 0.05 && afterTrend < -0.05) ||
        (beforeTrend < -0.05 && afterTrend > 0.05) ||
        Math.abs(afterTrend - beforeTrend) > 0.15
      ) {
        changes.push({
          date: dates[i],
          beforeTrend,
          afterTrend,
        })
      }
    }

    return changes
  }

  private calculateTrendSlope(values: number[]): number {
    const n = values.length
    if (n < 2) return 0

    const xMean = (n - 1) / 2
    const yMean = this.mean(values)

    let numerator = 0
    let denominator = 0

    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (values[i] - yMean)
      denominator += (i - xMean) * (i - xMean)
    }

    return denominator > 0 ? numerator / denominator / yMean : 0
  }

  // ==================== 예측 기능 ====================

  /**
   * 시계열 예측 (단순 지수 평활법 + 트렌드)
   */
  forecast(
    data: any[],
    dateColumn: string,
    forecastDays: number = 30
  ): ForecastResult {
    // 일별 데이터 집계
    const dailyMap = new Map<string, number>()
    data.forEach(row => {
      const dateStr = this.extractDate(row[dateColumn])
      if (!dateStr) return
      dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + (Number(row['Total GMV']) || 0))
    })

    const sortedDates = [...dailyMap.keys()].sort()
    const historicalData = sortedDates.map(date => ({
      date,
      value: dailyMap.get(date) || 0,
    }))

    const values = historicalData.map(d => d.value)
    if (values.length < 7) {
      return this.emptyForecast()
    }

    // 트렌드 계산
    const trend = this.calculateTrendSlope(values)
    const trendDirection = trend > 0.02 ? 'up' : trend < -0.02 ? 'down' : 'stable'

    // 시즌성 감지 (요일별 패턴)
    const weeklyPattern = this.detectWeeklySeasonality(historicalData)
    const monthlyPattern = this.detectMonthlySeasonality(historicalData)

    // Holt-Winters 유사 예측 (단순화 버전)
    const alpha = 0.3  // 레벨 평활 계수
    const beta = 0.1   // 트렌드 평활 계수
    
    let level = values[values.length - 1]
    let trendValue = (values[values.length - 1] - values[Math.max(0, values.length - 7)]) / 7

    // 예측 생성
    const predictions: Array<{ date: string; predicted: number; lower: number; upper: number }> = []
    const lastDate = new Date(sortedDates[sortedDates.length - 1])
    const stdDev = this.standardDeviation(values)

    for (let i = 1; i <= forecastDays; i++) {
      const futureDate = new Date(lastDate)
      futureDate.setDate(futureDate.getDate() + i)
      const dateStr = futureDate.toISOString().split('T')[0]

      // 기본 예측
      let predicted = level + trendValue * i

      // 요일 시즌성 적용
      if (weeklyPattern.detected) {
        const dayOfWeek = futureDate.getDay()
        predicted *= weeklyPattern.factors[dayOfWeek]
      }

      // 신뢰 구간 (점점 넓어짐)
      const uncertainty = stdDev * Math.sqrt(i) * 0.5
      
      predictions.push({
        date: dateStr,
        predicted: Math.max(0, predicted),
        lower: Math.max(0, predicted - uncertainty * 1.96),
        upper: predicted + uncertainty * 1.96,
      })
    }

    // 정확도 계산 (마지막 7일 백테스트)
    const { mape, rmse } = this.calculateForecastAccuracy(values)

    return {
      metric: 'GMV',
      historicalData,
      predictions,
      trend: trendDirection,
      confidence: Math.max(0, Math.min(100, 100 - mape)),
      seasonality: {
        weekly: weeklyPattern.detected,
        monthly: monthlyPattern.detected,
        pattern: weeklyPattern.detected ? '주말 매출 변동' : undefined,
      },
      accuracy: { mape, rmse },
    }
  }

  /**
   * 요일별 시즌성 감지
   */
  private detectWeeklySeasonality(data: Array<{ date: string; value: number }>): {
    detected: boolean
    factors: number[]
  } {
    const dayTotals: number[] = [0, 0, 0, 0, 0, 0, 0]
    const dayCounts: number[] = [0, 0, 0, 0, 0, 0, 0]

    data.forEach(d => {
      const dayOfWeek = new Date(d.date).getDay()
      dayTotals[dayOfWeek] += d.value
      dayCounts[dayOfWeek] += 1
    })

    const dayAverages = dayTotals.map((total, i) => dayCounts[i] > 0 ? total / dayCounts[i] : 0)
    const overallAverage = this.mean(dayAverages.filter(a => a > 0))
    
    if (overallAverage === 0) {
      return { detected: false, factors: [1, 1, 1, 1, 1, 1, 1] }
    }

    const factors = dayAverages.map(avg => avg > 0 ? avg / overallAverage : 1)
    
    // 변동 계수로 시즌성 판단
    const cv = this.standardDeviation(factors) / this.mean(factors)
    
    return {
      detected: cv > 0.1,  // 10% 이상 변동 시 시즌성 있음
      factors,
    }
  }

  /**
   * 월별 시즌성 감지
   */
  private detectMonthlySeasonality(data: Array<{ date: string; value: number }>): {
    detected: boolean
  } {
    const monthTotals = new Map<number, { total: number; count: number }>()

    data.forEach(d => {
      const month = new Date(d.date).getMonth()
      const existing = monthTotals.get(month) || { total: 0, count: 0 }
      existing.total += d.value
      existing.count += 1
      monthTotals.set(month, existing)
    })

    const monthAverages = [...monthTotals.values()]
      .filter(m => m.count > 0)
      .map(m => m.total / m.count)

    if (monthAverages.length < 3) {
      return { detected: false }
    }

    const cv = this.standardDeviation(monthAverages) / this.mean(monthAverages)
    return { detected: cv > 0.15 }
  }

  /**
   * 예측 정확도 계산
   */
  private calculateForecastAccuracy(values: number[]): { mape: number; rmse: number } {
    if (values.length < 14) {
      return { mape: 20, rmse: 0 }
    }

    // 마지막 7일을 테스트셋으로 사용
    const trainValues = values.slice(0, -7)
    const testValues = values.slice(-7)

    // 단순 이동평균 예측
    const movingAvg = this.mean(trainValues.slice(-7))
    
    let sumAbsPercentError = 0
    let sumSquaredError = 0

    testValues.forEach(actual => {
      const error = actual - movingAvg
      sumAbsPercentError += actual > 0 ? Math.abs(error / actual) : 0
      sumSquaredError += error * error
    })

    return {
      mape: (sumAbsPercentError / testValues.length) * 100,
      rmse: Math.sqrt(sumSquaredError / testValues.length),
    }
  }

  /**
   * 빈 예측 결과
   */
  private emptyForecast(): ForecastResult {
    return {
      metric: 'GMV',
      historicalData: [],
      predictions: [],
      trend: 'stable',
      confidence: 0,
      seasonality: { weekly: false, monthly: false },
      accuracy: { mape: 100, rmse: 0 },
    }
  }

  // ==================== 복합 기간 비교 분석 ====================

  /**
   * 두 기간 비교 분석
   */
  comparePeriods(
    data: any[],
    period1: DateRange,
    period2: DateRange,
    period1Label: string = '기간 1',
    period2Label: string = '기간 2'
  ): PeriodComparison {
    // 기간별 데이터 필터링
    const data1 = data.filter(row => {
      const date = this.extractDate(row.order_created)
      return date >= period1.start && date <= period1.end
    })

    const data2 = data.filter(row => {
      const date = this.extractDate(row.order_created)
      return date >= period2.start && date <= period2.end
    })

    // 기간별 메트릭 계산
    const metrics1 = this.calculatePeriodMetrics(data1)
    const metrics2 = this.calculatePeriodMetrics(data2)

    // 변화율 계산
    const calcChange = (v1: number, v2: number) => ({
      period1: v1,
      period2: v2,
      change: v2 - v1,
      changePercent: v1 > 0 ? ((v2 - v1) / v1) * 100 : 0,
    })

    // 세그먼트별 성장/하락 분석
    const { topGrowth, topDecline } = this.analyzeSegmentChanges(data1, data2)

    // 인사이트 생성
    const insights = this.generatePeriodComparisonInsights(metrics1, metrics2, period1Label, period2Label)

    return {
      period1: { ...period1, label: period1Label },
      period2: { ...period2, label: period2Label },
      metrics: {
        gmv: calcChange(metrics1.gmv, metrics2.gmv),
        orders: calcChange(metrics1.orders, metrics2.orders),
        aov: calcChange(metrics1.aov, metrics2.aov),
        customers: calcChange(metrics1.customers, metrics2.customers),
      },
      topGrowthSegments: topGrowth,
      topDeclineSegments: topDecline,
      insights,
    }
  }

  /**
   * 다중 기간 분석 (트렌드 파악)
   */
  analyzeMultiplePeriods(
    data: any[],
    periodType: 'weekly' | 'monthly' | 'quarterly',
    numPeriods: number = 6
  ): MultiPeriodAnalysis {
    const now = new Date()
    const periods: MultiPeriodAnalysis['periods'] = []

    for (let i = numPeriods - 1; i >= 0; i--) {
      const { start, end, label } = this.getPeriodBounds(now, periodType, i)
      
      const periodData = data.filter(row => {
        const date = this.extractDate(row.order_created)
        return date >= start && date <= end
      })

      const metrics = this.calculatePeriodMetrics(periodData)
      periods.push({
        label,
        start,
        end,
        ...metrics,
      })
    }

    // 트렌드 계산
    const gmvValues = periods.map(p => p.gmv)
    const orderValues = periods.map(p => p.orders)
    const aovValues = periods.map(p => p.aov)

    const gmvTrend = this.calculateTrendSlope(gmvValues)
    const orderTrend = this.calculateTrendSlope(orderValues)
    const aovTrend = this.calculateTrendSlope(aovValues)

    // 시즌성 감지
    const seasonalityDetected = this.detectPeriodSeasonality(periods)

    // 최고/최저 기간
    const sortedByGmv = [...periods].sort((a, b) => b.gmv - a.gmv)
    
    // 인사이트 생성
    const insights = this.generateMultiPeriodInsights(periods, gmvTrend, orderTrend, aovTrend)

    return {
      periods,
      trends: {
        gmv: { 
          direction: gmvTrend > 0.05 ? 'up' : gmvTrend < -0.05 ? 'down' : 'stable',
          avgGrowth: gmvTrend * 100,
        },
        orders: {
          direction: orderTrend > 0.05 ? 'up' : orderTrend < -0.05 ? 'down' : 'stable',
          avgGrowth: orderTrend * 100,
        },
        aov: {
          direction: aovTrend > 0.03 ? 'up' : aovTrend < -0.03 ? 'down' : 'stable',
          avgGrowth: aovTrend * 100,
        },
      },
      seasonalityDetected,
      bestPeriod: sortedByGmv[0]?.label || '',
      worstPeriod: sortedByGmv[sortedByGmv.length - 1]?.label || '',
      insights,
    }
  }

  /**
   * 기간 메트릭 계산
   */
  private calculatePeriodMetrics(data: any[]): {
    gmv: number
    orders: number
    aov: number
    customers: number
  } {
    const gmv = data.reduce((sum, row) => sum + (Number(row['Total GMV']) || 0), 0)
    const orders = data.length
    const customers = new Set(data.map(row => row.user_id).filter(Boolean)).size

    return {
      gmv,
      orders,
      aov: orders > 0 ? gmv / orders : 0,
      customers,
    }
  }

  /**
   * 기간 경계 계산
   */
  private getPeriodBounds(
    baseDate: Date,
    periodType: 'weekly' | 'monthly' | 'quarterly',
    periodsAgo: number
  ): { start: string; end: string; label: string } {
    const date = new Date(baseDate)
    
    switch (periodType) {
      case 'weekly': {
        date.setDate(date.getDate() - (periodsAgo * 7))
        const weekStart = new Date(date)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        return {
          start: weekStart.toISOString().split('T')[0],
          end: weekEnd.toISOString().split('T')[0],
          label: `${weekStart.getMonth() + 1}/${weekStart.getDate()} 주`,
        }
      }
      case 'monthly': {
        date.setMonth(date.getMonth() - periodsAgo)
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        return {
          start: monthStart.toISOString().split('T')[0],
          end: monthEnd.toISOString().split('T')[0],
          label: `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`,
        }
      }
      case 'quarterly': {
        const quarter = Math.floor(date.getMonth() / 3) - periodsAgo
        const year = date.getFullYear() + Math.floor(quarter / 4)
        const q = ((quarter % 4) + 4) % 4
        const qStart = new Date(year, q * 3, 1)
        const qEnd = new Date(year, q * 3 + 3, 0)
        return {
          start: qStart.toISOString().split('T')[0],
          end: qEnd.toISOString().split('T')[0],
          label: `${year} Q${q + 1}`,
        }
      }
    }
  }

  /**
   * 세그먼트별 변화 분석
   */
  private analyzeSegmentChanges(
    data1: any[],
    data2: any[]
  ): {
    topGrowth: Array<{ segment: string; type: string; growth: number }>
    topDecline: Array<{ segment: string; type: string; decline: number }>
  } {
    const segments: Array<{ segment: string; type: string; growth: number }> = []

    // 국가별 분석
    const country1 = this.groupByField(data1, 'country')
    const country2 = this.groupByField(data2, 'country')
    
    const allCountries = new Set([...country1.keys(), ...country2.keys()])
    allCountries.forEach(country => {
      const v1 = country1.get(country) || 0
      const v2 = country2.get(country) || 0
      if (v1 > 0) {
        segments.push({
          segment: country,
          type: 'country',
          growth: ((v2 - v1) / v1) * 100,
        })
      }
    })

    // 작가별 분석
    const artist1 = this.groupByField(data1, 'artist_name (kr)')
    const artist2 = this.groupByField(data2, 'artist_name (kr)')
    
    const allArtists = new Set([...artist1.keys(), ...artist2.keys()])
    allArtists.forEach(artist => {
      const v1 = artist1.get(artist) || 0
      const v2 = artist2.get(artist) || 0
      if (v1 > 0) {
        segments.push({
          segment: artist,
          type: 'artist',
          growth: ((v2 - v1) / v1) * 100,
        })
      }
    })

    // 정렬
    const sorted = segments.sort((a, b) => b.growth - a.growth)
    
    return {
      topGrowth: sorted.filter(s => s.growth > 0).slice(0, 5),
      topDecline: sorted.filter(s => s.growth < 0).slice(-5).reverse().map(s => ({
        ...s,
        decline: Math.abs(s.growth),
      })),
    }
  }

  /**
   * 필드별 그룹화
   */
  private groupByField(data: any[], field: string): Map<string, number> {
    const result = new Map<string, number>()
    data.forEach(row => {
      const key = row[field]
      if (key) {
        result.set(key, (result.get(key) || 0) + (Number(row['Total GMV']) || 0))
      }
    })
    return result
  }

  /**
   * 기간 시즌성 감지
   */
  private detectPeriodSeasonality(periods: MultiPeriodAnalysis['periods']): boolean {
    if (periods.length < 4) return false
    
    const gmvValues = periods.map(p => p.gmv)
    const cv = this.standardDeviation(gmvValues) / this.mean(gmvValues)
    
    return cv > 0.2  // 20% 이상 변동 시 시즌성
  }

  /**
   * 기간 비교 인사이트 생성
   */
  private generatePeriodComparisonInsights(
    metrics1: ReturnType<typeof this.calculatePeriodMetrics>,
    metrics2: ReturnType<typeof this.calculatePeriodMetrics>,
    label1: string,
    label2: string
  ): string[] {
    const insights: string[] = []

    const gmvChange = metrics1.gmv > 0 ? ((metrics2.gmv - metrics1.gmv) / metrics1.gmv) * 100 : 0
    const orderChange = metrics1.orders > 0 ? ((metrics2.orders - metrics1.orders) / metrics1.orders) * 100 : 0
    const aovChange = metrics1.aov > 0 ? ((metrics2.aov - metrics1.aov) / metrics1.aov) * 100 : 0
    const customerChange = metrics1.customers > 0 ? ((metrics2.customers - metrics1.customers) / metrics1.customers) * 100 : 0

    // GMV 인사이트
    if (Math.abs(gmvChange) > 10) {
      insights.push(
        gmvChange > 0
          ? `💹 ${label2} 매출이 ${label1} 대비 ${gmvChange.toFixed(1)}% 성장했습니다.`
          : `📉 ${label2} 매출이 ${label1} 대비 ${Math.abs(gmvChange).toFixed(1)}% 감소했습니다.`
      )
    }

    // 주문 vs AOV 분석
    if (orderChange > 5 && aovChange < -5) {
      insights.push('📊 주문 건수는 증가했으나 객단가가 하락했습니다. 저가 상품 비중 증가 또는 할인 영향을 점검하세요.')
    } else if (orderChange < -5 && aovChange > 5) {
      insights.push('📊 주문 건수는 감소했으나 객단가가 상승했습니다. 프리미엄 고객 집중 전략이 효과적입니다.')
    }

    // 고객 인사이트
    if (customerChange > 15) {
      insights.push(`👥 신규 고객 유입이 ${customerChange.toFixed(1)}% 증가했습니다. 마케팅 효과를 분석하세요.`)
    } else if (customerChange < -15) {
      insights.push(`⚠️ 활성 고객이 ${Math.abs(customerChange).toFixed(1)}% 감소했습니다. 리텐션 전략이 필요합니다.`)
    }

    return insights
  }

  /**
   * 다중 기간 인사이트 생성
   */
  private generateMultiPeriodInsights(
    periods: MultiPeriodAnalysis['periods'],
    gmvTrend: number,
    orderTrend: number,
    aovTrend: number
  ): string[] {
    const insights: string[] = []

    // 전체 트렌드
    if (gmvTrend > 0.1) {
      insights.push('📈 매출이 지속적으로 성장하고 있습니다. 현재 전략을 유지하세요.')
    } else if (gmvTrend < -0.1) {
      insights.push('📉 매출이 지속적으로 하락하고 있습니다. 원인 분석과 대응이 필요합니다.')
    } else {
      insights.push('➡️ 매출이 안정적으로 유지되고 있습니다.')
    }

    // AOV 트렌드
    if (aovTrend < -0.05 && orderTrend > 0) {
      insights.push('💡 주문은 증가하나 객단가가 하락 중입니다. 업셀링/크로스셀링 전략을 검토하세요.')
    }

    // 변동성 분석
    const gmvValues = periods.map(p => p.gmv)
    const cv = this.standardDeviation(gmvValues) / this.mean(gmvValues)
    if (cv > 0.3) {
      insights.push('⚠️ 매출 변동성이 높습니다. 안정적인 수익원 확보가 필요합니다.')
    }

    // 최근 추이
    if (periods.length >= 2) {
      const recent = periods[periods.length - 1]
      const previous = periods[periods.length - 2]
      const recentChange = previous.gmv > 0 ? ((recent.gmv - previous.gmv) / previous.gmv) * 100 : 0
      
      if (recentChange > 20) {
        insights.push(`🚀 최근 기간(${recent.label}) 매출이 급성장했습니다 (+${recentChange.toFixed(1)}%).`)
      } else if (recentChange < -20) {
        insights.push(`🚨 최근 기간(${recent.label}) 매출이 급감했습니다 (${recentChange.toFixed(1)}%).`)
      }
    }

    return insights
  }

  // ==================== 유틸리티: 기간 프리셋 ====================

  /**
   * 기간 프리셋을 날짜 범위로 변환
   */
  static getDateRangeFromPreset(preset: PeriodPreset, customRange?: DateRange): DateRange {
    const now = new Date()
    const end = now.toISOString().split('T')[0]
    
    switch (preset) {
      case '7d': {
        const start = new Date(now)
        start.setDate(start.getDate() - 6)
        return { start: start.toISOString().split('T')[0], end }
      }
      case '30d': {
        const start = new Date(now)
        start.setDate(start.getDate() - 29)
        return { start: start.toISOString().split('T')[0], end }
      }
      case '90d': {
        const start = new Date(now)
        start.setDate(start.getDate() - 89)
        return { start: start.toISOString().split('T')[0], end }
      }
      case '180d': {
        const start = new Date(now)
        start.setDate(start.getDate() - 179)
        return { start: start.toISOString().split('T')[0], end }
      }
      case '365d': {
        const start = new Date(now)
        start.setDate(start.getDate() - 364)
        return { start: start.toISOString().split('T')[0], end }
      }
      case 'custom':
        return customRange || { start: end, end }
      default:
        return { start: end, end }
    }
  }

  /**
   * 비교 기간 계산 (이전 동일 기간)
   */
  static getComparisonPeriod(dateRange: DateRange): DateRange {
    const start = new Date(dateRange.start)
    const end = new Date(dateRange.end)
    const duration = end.getTime() - start.getTime()
    
    const compEnd = new Date(start.getTime() - 1)  // 현재 기간 시작 전날
    const compStart = new Date(compEnd.getTime() - duration)
    
    return {
      start: compStart.toISOString().split('T')[0],
      end: compEnd.toISOString().split('T')[0],
    }
  }
}

