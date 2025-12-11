/**
 * ArtistHealthCalculator - 작가 건강도 점수 계산 서비스
 * v4.0: 4차원 종합 건강도 점수 (매출/운영/고객만족/활동성)
 */

import { GoogleSheetsService } from '../googleSheets'
import { SHEET_NAMES } from '../../config/sheets'

// ==================== 타입 정의 ====================

export interface ArtistHealthDimension {
  score: number
  metrics: Record<string, number | string>
  insights: string[]
}

export interface ArtistHealthScore {
  artistId: string
  artistName: string
  overallScore: number
  tier: 'S' | 'A' | 'B' | 'C' | 'D'
  
  dimensions: {
    sales: ArtistHealthDimension & {
      metrics: {
        revenueGrowthMoM: number
        orderCount: number
        aov: number
        revenueShare: number
        totalRevenue: number
      }
    }
    operations: ArtistHealthDimension & {
      metrics: {
        avgShippingDays: number
        delayRate: number
        qcPassRate: number
        pendingOrders: number
      }
    }
    customer: ArtistHealthDimension & {
      metrics: {
        avgRating: number
        repeatCustomerRate: number
        complaintRate: number
        uniqueCustomers: number
      }
    }
    engagement: ArtistHealthDimension & {
      metrics: {
        newProductsLast30Days: number
        activeProductCount: number
        lastActivityDays: number
        orderFrequency: number
      }
    }
  }
  
  alerts: {
    type: 'critical' | 'warning' | 'info'
    message: string
    metric: string
  }[]
  
  recommendations: string[]
  comparisonToAverage: Record<string, number>
}

export interface ArtistHealthSummary {
  totalArtists: number
  tierDistribution: Record<string, number>
  avgOverallScore: number
  topPerformers: { name: string; score: number }[]
  needsAttention: { name: string; score: number; issue: string }[]
}

export interface ArtistHealthResult {
  summary: ArtistHealthSummary
  artists: ArtistHealthScore[]
  generatedAt: string
}

interface ArtistData {
  artistId: string
  artistName: string
  orders: {
    date: Date
    amount: number
    status: string
    shippingDays?: number
    customerId: string
  }[]
  totalRevenue: number
  orderCount: number
  uniqueCustomers: number
  avgRating?: number
  complaintCount: number
  returnCount: number
}

// ==================== 점수 계산 로직 ====================

/**
 * 매출 건강도 계산 (가중치 35%)
 */
function calculateSalesHealth(
  artist: ArtistData,
  allArtistsRevenue: number,
  previousPeriodRevenue: number
): ArtistHealthDimension & { metrics: any } {
  let score = 50
  const insights: string[] = []
  
  // 1. 매출 성장률 (+/- 25점)
  const revenueGrowthMoM = previousPeriodRevenue > 0 
    ? (artist.totalRevenue - previousPeriodRevenue) / previousPeriodRevenue 
    : 0
  
  if (revenueGrowthMoM > 0.2) {
    score += 25
    insights.push('매출 20% 이상 성장')
  } else if (revenueGrowthMoM > 0.1) {
    score += 15
    insights.push('매출 10% 이상 성장')
  } else if (revenueGrowthMoM > 0) {
    score += 5
  } else if (revenueGrowthMoM > -0.1) {
    score -= 10
    insights.push('매출 소폭 감소')
  } else {
    score -= 25
    insights.push('매출 10% 이상 감소')
  }
  
  // 2. 매출 비중 (+/- 15점)
  const revenueShare = allArtistsRevenue > 0 ? artist.totalRevenue / allArtistsRevenue : 0
  if (revenueShare > 0.1) {
    score += 15
    insights.push('상위 매출 작가')
  } else if (revenueShare > 0.05) {
    score += 10
  } else if (revenueShare > 0.01) {
    score += 5
  }
  
  // 3. AOV (+/- 10점)
  const aov = artist.orderCount > 0 ? artist.totalRevenue / artist.orderCount : 0
  if (aov > 80) {
    score += 10
    insights.push('높은 AOV')
  } else if (aov > 50) {
    score += 5
  } else if (aov < 30 && artist.orderCount > 3) {
    score -= 5
    insights.push('낮은 AOV')
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    metrics: {
      revenueGrowthMoM: revenueGrowthMoM * 100,
      orderCount: artist.orderCount,
      aov,
      revenueShare: revenueShare * 100,
      totalRevenue: artist.totalRevenue
    },
    insights
  }
}

/**
 * 운영 건강도 계산 (가중치 25%)
 */
function calculateOperationsHealth(artist: ArtistData): ArtistHealthDimension & { metrics: any } {
  let score = 50
  const insights: string[] = []
  
  // 배송 데이터 계산
  const ordersWithShipping = artist.orders.filter(o => o.shippingDays !== undefined)
  const avgShippingDays = ordersWithShipping.length > 0
    ? ordersWithShipping.reduce((sum, o) => sum + (o.shippingDays || 0), 0) / ordersWithShipping.length
    : 5 // 기본값
  
  // 1. 평균 발송일 (+/- 25점)
  if (avgShippingDays <= 3) {
    score += 25
    insights.push('빠른 발송 (3일 이내)')
  } else if (avgShippingDays <= 5) {
    score += 15
  } else if (avgShippingDays <= 7) {
    score += 5
  } else if (avgShippingDays > 10) {
    score -= 20
    insights.push('발송 지연 주의 필요')
  } else {
    score -= 10
  }
  
  // 2. 지연율 (+/- 15점)
  const delayedOrders = artist.orders.filter(o => 
    o.status?.toLowerCase().includes('delay') || 
    o.status?.toLowerCase().includes('지연') ||
    (o.shippingDays && o.shippingDays > 7)
  ).length
  const delayRate = artist.orderCount > 0 ? delayedOrders / artist.orderCount : 0
  
  if (delayRate < 0.05) {
    score += 15
    insights.push('낮은 지연율')
  } else if (delayRate < 0.1) {
    score += 5
  } else if (delayRate > 0.2) {
    score -= 20
    insights.push('높은 지연율 (20% 이상)')
  } else if (delayRate > 0.15) {
    score -= 10
  }
  
  // 3. 미처리 주문 (+/- 10점)
  const pendingOrders = artist.orders.filter(o => 
    o.status?.toLowerCase().includes('pending') || 
    o.status?.toLowerCase().includes('대기')
  ).length
  
  if (pendingOrders === 0) {
    score += 10
  } else if (pendingOrders <= 2) {
    score += 5
  } else if (pendingOrders > 5) {
    score -= 15
    insights.push(`미처리 주문 ${pendingOrders}건`)
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    metrics: {
      avgShippingDays,
      delayRate: delayRate * 100,
      qcPassRate: 95, // 기본값 (실제 데이터 연동 필요)
      pendingOrders
    },
    insights
  }
}

/**
 * 고객 만족도 계산 (가중치 25%)
 */
function calculateCustomerHealth(artist: ArtistData): ArtistHealthDimension & { metrics: any } {
  let score = 50
  const insights: string[] = []
  
  // 1. 평균 평점 (+/- 20점)
  const avgRating = artist.avgRating || 4.0
  if (avgRating >= 4.5) {
    score += 20
    insights.push('우수한 고객 평가')
  } else if (avgRating >= 4.0) {
    score += 10
  } else if (avgRating >= 3.5) {
    score += 0
  } else if (avgRating < 3.0) {
    score -= 20
    insights.push('낮은 고객 평점')
  } else {
    score -= 10
  }
  
  // 2. 재구매 고객 비율 (+/- 15점)
  const customerOrderCounts: Record<string, number> = {}
  artist.orders.forEach(o => {
    customerOrderCounts[o.customerId] = (customerOrderCounts[o.customerId] || 0) + 1
  })
  const repeatCustomers = Object.values(customerOrderCounts).filter(c => c > 1).length
  const repeatCustomerRate = artist.uniqueCustomers > 0 ? repeatCustomers / artist.uniqueCustomers : 0
  
  if (repeatCustomerRate > 0.3) {
    score += 15
    insights.push('높은 재구매율')
  } else if (repeatCustomerRate > 0.2) {
    score += 10
  } else if (repeatCustomerRate > 0.1) {
    score += 5
  } else if (artist.uniqueCustomers >= 5 && repeatCustomerRate < 0.05) {
    score -= 10
    insights.push('낮은 재구매율')
  }
  
  // 3. 불만/반품율 (+/- 15점)
  const complaintRate = artist.orderCount > 0 
    ? (artist.complaintCount + artist.returnCount) / artist.orderCount 
    : 0
  
  if (complaintRate < 0.02) {
    score += 15
    insights.push('매우 낮은 불만율')
  } else if (complaintRate < 0.05) {
    score += 10
  } else if (complaintRate > 0.1) {
    score -= 15
    insights.push('높은 불만/반품율')
  } else if (complaintRate > 0.07) {
    score -= 5
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    metrics: {
      avgRating,
      repeatCustomerRate: repeatCustomerRate * 100,
      complaintRate: complaintRate * 100,
      uniqueCustomers: artist.uniqueCustomers
    },
    insights
  }
}

/**
 * 활동성 계산 (가중치 15%)
 */
function calculateEngagementHealth(artist: ArtistData): ArtistHealthDimension & { metrics: any } {
  let score = 50
  const insights: string[] = []
  
  // 마지막 주문일 계산
  const sortedOrders = [...artist.orders].sort((a, b) => b.date.getTime() - a.date.getTime())
  const lastOrderDate = sortedOrders.length > 0 ? sortedOrders[0].date : new Date(0)
  const lastActivityDays = Math.floor((new Date().getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
  
  // 1. 최근 활동 (+/- 25점)
  if (lastActivityDays <= 7) {
    score += 25
    insights.push('최근 활발한 활동')
  } else if (lastActivityDays <= 14) {
    score += 15
  } else if (lastActivityDays <= 30) {
    score += 5
  } else if (lastActivityDays > 60) {
    score -= 25
    insights.push('60일+ 비활성')
  } else if (lastActivityDays > 45) {
    score -= 15
    insights.push('활동 감소')
  }
  
  // 2. 주문 빈도 (+/- 15점)
  const firstOrderDate = sortedOrders.length > 0 ? sortedOrders[sortedOrders.length - 1].date : new Date()
  const activeDays = Math.max(1, (new Date().getTime() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24))
  const orderFrequency = artist.orderCount / (activeDays / 30) // 월간 주문 빈도
  
  if (orderFrequency >= 5) {
    score += 15
    insights.push('높은 주문 빈도')
  } else if (orderFrequency >= 3) {
    score += 10
  } else if (orderFrequency >= 1) {
    score += 5
  } else if (orderFrequency < 0.5 && activeDays > 60) {
    score -= 10
    insights.push('낮은 주문 빈도')
  }
  
  // 3. 고객 다양성 (+/- 10점)
  const customerDiversityRatio = artist.orderCount > 0 ? artist.uniqueCustomers / artist.orderCount : 0
  if (customerDiversityRatio > 0.7) {
    score += 10
    insights.push('다양한 고객층')
  } else if (customerDiversityRatio > 0.5) {
    score += 5
  } else if (customerDiversityRatio < 0.3 && artist.orderCount >= 5) {
    score -= 5
    insights.push('고객 집중도 높음')
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    metrics: {
      newProductsLast30Days: 0, // 상품 데이터 연동 필요
      activeProductCount: 0,
      lastActivityDays,
      orderFrequency
    },
    insights
  }
}

/**
 * 종합 건강도 계산
 */
function calculateOverallHealth(
  sales: ArtistHealthDimension,
  operations: ArtistHealthDimension,
  customer: ArtistHealthDimension,
  engagement: ArtistHealthDimension
): { score: number; tier: 'S' | 'A' | 'B' | 'C' | 'D' } {
  // 가중치: 매출 35%, 운영 25%, 고객 25%, 활동성 15%
  const overall = Math.round(
    sales.score * 0.35 +
    operations.score * 0.25 +
    customer.score * 0.25 +
    engagement.score * 0.15
  )
  
  const tier: 'S' | 'A' | 'B' | 'C' | 'D' = 
    overall >= 85 ? 'S' :
    overall >= 70 ? 'A' :
    overall >= 55 ? 'B' :
    overall >= 40 ? 'C' : 'D'
  
  return { score: overall, tier }
}

/**
 * 알림 생성
 */
function generateAlerts(
  sales: ArtistHealthDimension,
  operations: ArtistHealthDimension,
  customer: ArtistHealthDimension,
  engagement: ArtistHealthDimension
): { type: 'critical' | 'warning' | 'info'; message: string; metric: string }[] {
  const alerts: { type: 'critical' | 'warning' | 'info'; message: string; metric: string }[] = []
  
  // Critical alerts
  if (sales.score < 30) {
    alerts.push({ type: 'critical', message: '매출 심각한 하락', metric: 'sales' })
  }
  if (operations.score < 30) {
    alerts.push({ type: 'critical', message: '운영 효율성 심각 저하', metric: 'operations' })
  }
  if (customer.score < 30) {
    alerts.push({ type: 'critical', message: '고객 만족도 위험 수준', metric: 'customer' })
  }
  
  // Warning alerts
  if (sales.score < 50 && sales.score >= 30) {
    alerts.push({ type: 'warning', message: '매출 하락 추세', metric: 'sales' })
  }
  if (operations.score < 50 && operations.score >= 30) {
    alerts.push({ type: 'warning', message: '발송 지연 증가', metric: 'operations' })
  }
  if (engagement.score < 40) {
    alerts.push({ type: 'warning', message: '활동 감소', metric: 'engagement' })
  }
  
  return alerts
}

/**
 * 권장 조치 생성
 */
function generateRecommendations(
  sales: ArtistHealthDimension,
  operations: ArtistHealthDimension,
  customer: ArtistHealthDimension,
  engagement: ArtistHealthDimension
): string[] {
  const recommendations: string[] = []
  
  if (sales.score < 50) {
    recommendations.push('프로모션 참여 권장')
    recommendations.push('상품 다양화 검토')
  }
  
  if (operations.score < 50) {
    recommendations.push('발송 프로세스 점검 필요')
    recommendations.push('재고 관리 개선')
  }
  
  if (customer.score < 50) {
    recommendations.push('상품 품질 점검')
    recommendations.push('고객 피드백 확인')
  }
  
  if (engagement.score < 50) {
    recommendations.push('신상품 등록 권장')
    recommendations.push('마케팅 지원 검토')
  }
  
  return recommendations.slice(0, 4)
}

// ==================== 메인 서비스 ====================

export class ArtistHealthCalculator {
  private sheetsService: GoogleSheetsService
  
  constructor() {
    this.sheetsService = new GoogleSheetsService()
  }
  
  /**
   * 전체 작가 건강도 계산
   */
  async calculateAllArtistHealth(
    period: '30d' | '90d' | '180d' | '365d' = '90d'
  ): Promise<ArtistHealthResult> {
    try {
      // 물류 데이터 로드
      const logisticsData = await this.sheetsService.getSheetData(SHEET_NAMES.LOGISTICS)
      
      // 기간 필터
      const periodDays = parseInt(period)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - (isNaN(periodDays) ? 90 : periodDays))
      
      const previousStartDate = new Date(startDate)
      previousStartDate.setDate(previousStartDate.getDate() - (isNaN(periodDays) ? 90 : periodDays))
      
      // 작가별 데이터 집계
      const artistMap = new Map<string, ArtistData>()
      const previousPeriodRevenue = new Map<string, number>()
      let totalRevenue = 0
      
      for (const row of logisticsData) {
        const artistName = row['artist_name (kr)'] || row['artist_name'] || row['artist_id']
        if (!artistName) continue
        
        const orderDate = new Date(row['order_created'])
        if (isNaN(orderDate.getTime())) continue
        
        const amount = parseFloat(row['Total GMV'] || row['total_gmv'] || '0') || 0
        const artistId = String(artistName).toLowerCase().replace(/\s+/g, '_')
        
        // 이전 기간 매출 계산
        if (orderDate >= previousStartDate && orderDate < startDate) {
          previousPeriodRevenue.set(artistId, (previousPeriodRevenue.get(artistId) || 0) + amount)
        }
        
        // 현재 기간 필터
        if (orderDate < startDate) continue
        
        if (!artistMap.has(artistId)) {
          artistMap.set(artistId, {
            artistId,
            artistName: String(artistName),
            orders: [],
            totalRevenue: 0,
            orderCount: 0,
            uniqueCustomers: 0,
            complaintCount: 0,
            returnCount: 0
          })
        }
        
        const artist = artistMap.get(artistId)!
        const customerId = row['user_id'] || row['customer_id'] || ''
        
        artist.orders.push({
          date: orderDate,
          amount,
          status: row['status'] || '',
          customerId: String(customerId)
        })
        
        artist.totalRevenue += amount
        artist.orderCount++
        totalRevenue += amount
      }
      
      // 고유 고객 수 계산
      artistMap.forEach(artist => {
        const uniqueCustomerIds = new Set(artist.orders.map(o => o.customerId).filter(id => id))
        artist.uniqueCustomers = uniqueCustomerIds.size
      })
      
      // 건강도 점수 계산
      const artistScores: ArtistHealthScore[] = []
      
      artistMap.forEach((artist, artistId) => {
        if (artist.orderCount < 1) return // 최소 1건 이상
        
        const prevRevenue = previousPeriodRevenue.get(artistId) || 0
        
        const sales = calculateSalesHealth(artist, totalRevenue, prevRevenue)
        const operations = calculateOperationsHealth(artist)
        const customer = calculateCustomerHealth(artist)
        const engagement = calculateEngagementHealth(artist)
        
        const { score: overallScore, tier } = calculateOverallHealth(sales, operations, customer, engagement)
        const alerts = generateAlerts(sales, operations, customer, engagement)
        const recommendations = generateRecommendations(sales, operations, customer, engagement)
        
        artistScores.push({
          artistId: artist.artistId,
          artistName: artist.artistName,
          overallScore,
          tier,
          dimensions: { sales, operations, customer, engagement } as any,
          alerts,
          recommendations,
          comparisonToAverage: {} // 평균 대비는 나중에 계산
        })
      })
      
      // 점수 기준 정렬
      artistScores.sort((a, b) => b.overallScore - a.overallScore)
      
      // 평균 점수 계산 및 비교
      const avgScore = artistScores.length > 0
        ? artistScores.reduce((sum, a) => sum + a.overallScore, 0) / artistScores.length
        : 0
      
      artistScores.forEach(artist => {
        artist.comparisonToAverage = {
          overall: ((artist.overallScore - avgScore) / avgScore * 100) || 0
        }
      })
      
      // 티어별 분포
      const tierDistribution: Record<string, number> = { S: 0, A: 0, B: 0, C: 0, D: 0 }
      artistScores.forEach(a => tierDistribution[a.tier]++)
      
      // 요약 생성
      const summary: ArtistHealthSummary = {
        totalArtists: artistScores.length,
        tierDistribution,
        avgOverallScore: avgScore,
        topPerformers: artistScores.slice(0, 5).map(a => ({ name: a.artistName, score: a.overallScore })),
        needsAttention: artistScores
          .filter(a => a.tier === 'D' || a.tier === 'C')
          .slice(0, 5)
          .map(a => ({
            name: a.artistName,
            score: a.overallScore,
            issue: a.alerts[0]?.message || '종합 점수 낮음'
          }))
      }
      
      return {
        summary,
        artists: artistScores.slice(0, 50), // 상위 50명
        generatedAt: new Date().toISOString()
      }
      
    } catch (error) {
      console.error('[ArtistHealthCalculator] 계산 오류:', error)
      throw error
    }
  }
  
  /**
   * 특정 작가 건강도 조회
   */
  async getArtistHealth(artistId: string): Promise<ArtistHealthScore | null> {
    const result = await this.calculateAllArtistHealth('90d')
    return result.artists.find(a => a.artistId === artistId) || null
  }
}

export default ArtistHealthCalculator

