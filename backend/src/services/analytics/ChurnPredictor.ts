/**
 * ChurnPredictor - 고객 이탈 예측 서비스
 * v4.0: 규칙 기반 스코어링으로 고객 이탈 확률 예측
 */

import { GoogleSheetsService } from '../googleSheets'
import { SHEET_NAMES } from '../../config/sheets'

// ==================== 타입 정의 ====================

export interface ChurnRiskFactor {
  factor: string
  weight: number           // 기여도 (%)
  currentValue: string
  benchmark: string
  trend: 'worsening' | 'stable' | 'improving'
}

export interface ChurnPrediction {
  customerId: string
  customerName: string
  currentSegment: string
  
  churnProbability: number        // 0-100%
  riskLevel: 'critical' | 'high' | 'medium' | 'low'
  daysUntilChurn: number          // 예상 이탈까지 남은 일수
  
  riskFactors: ChurnRiskFactor[]
  
  lifetimeValue: {
    historical: number            // 역사적 LTV
    atRisk: number                // 위험에 처한 가치
  }
  
  recommendedActions: {
    action: string
    expectedImpact: string
    priority: 'high' | 'medium' | 'low'
  }[]
  
  lastOrderDate: string
  totalOrders: number
  avgOrderValue: number
}

export interface ChurnPredictionSummary {
  totalCustomers: number
  atRiskCustomers: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  totalValueAtRisk: number
  avgChurnProbability: number
}

export interface ChurnPredictionResult {
  summary: ChurnPredictionSummary
  predictions: ChurnPrediction[]
  generatedAt: string
}

interface CustomerData {
  customerId: string
  customerName: string
  lastOrderDate: Date
  firstOrderDate: Date
  totalOrders: number
  totalSpent: number
  avgOrderValue: number
  orderHistory: { date: Date; amount: number }[]
  country: string
  favoriteArtist?: string
}

// ==================== 이탈 예측 로직 ====================

/**
 * 구매 간격 분석
 */
function analyzeOrderInterval(customer: CustomerData): { score: number; factor: ChurnRiskFactor | null } {
  if (customer.orderHistory.length < 2) {
    return { score: 0, factor: null }
  }
  
  // 구매 간격 계산
  const intervals: number[] = []
  for (let i = 1; i < customer.orderHistory.length; i++) {
    const diff = customer.orderHistory[i-1].date.getTime() - customer.orderHistory[i].date.getTime()
    intervals.push(diff / (1000 * 60 * 60 * 24)) // 일 단위
  }
  
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
  const lastOrderDays = (new Date().getTime() - customer.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
  const intervalRatio = lastOrderDays / avgInterval
  
  let score = 0
  let trend: 'worsening' | 'stable' | 'improving' = 'stable'
  
  if (intervalRatio > 3) {
    score = 35
    trend = 'worsening'
  } else if (intervalRatio > 2) {
    score = 25
    trend = 'worsening'
  } else if (intervalRatio > 1.5) {
    score = 15
    trend = 'worsening'
  } else if (intervalRatio > 1.2) {
    score = 5
    trend = 'stable'
  }
  
  if (score > 0) {
    return {
      score,
      factor: {
        factor: '구매 간격 이상',
        weight: score,
        currentValue: `${Math.round(lastOrderDays)}일 경과`,
        benchmark: `평균 ${Math.round(avgInterval)}일 간격`,
        trend
      }
    }
  }
  
  return { score: 0, factor: null }
}

/**
 * 구매 빈도 추세 분석
 */
function analyzeFrequencyTrend(customer: CustomerData): { score: number; factor: ChurnRiskFactor | null } {
  if (customer.orderHistory.length < 3) {
    return { score: 0, factor: null }
  }
  
  // 최근 90일 vs 이전 구매 빈도 비교
  const now = new Date()
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  
  const recentOrders = customer.orderHistory.filter(o => o.date >= ninetyDaysAgo).length
  const totalDays = (now.getTime() - customer.firstOrderDate.getTime()) / (1000 * 60 * 60 * 24)
  const quarterCount = Math.max(1, Math.floor(totalDays / 90))
  const historicalQuarterlyAvg = customer.totalOrders / quarterCount
  
  const freqRatio = recentOrders / historicalQuarterlyAvg
  
  let score = 0
  let trend: 'worsening' | 'stable' | 'improving' = 'stable'
  
  if (freqRatio < 0.3) {
    score = 25
    trend = 'worsening'
  } else if (freqRatio < 0.5) {
    score = 15
    trend = 'worsening'
  } else if (freqRatio < 0.7) {
    score = 8
    trend = 'stable'
  }
  
  if (score > 0) {
    return {
      score,
      factor: {
        factor: '구매 빈도 감소',
        weight: score,
        currentValue: `최근 90일 ${recentOrders}건`,
        benchmark: `분기 평균 ${historicalQuarterlyAvg.toFixed(1)}건`,
        trend
      }
    }
  }
  
  return { score: 0, factor: null }
}

/**
 * AOV 변화 분석
 */
function analyzeAOVChange(customer: CustomerData): { score: number; factor: ChurnRiskFactor | null } {
  if (customer.orderHistory.length < 4) {
    return { score: 0, factor: null }
  }
  
  // 최근 3건 vs 전체 평균
  const recentOrders = customer.orderHistory.slice(0, 3)
  const recentAOV = recentOrders.reduce((sum, o) => sum + o.amount, 0) / recentOrders.length
  const historicalAOV = customer.avgOrderValue
  
  const aovChange = (recentAOV - historicalAOV) / historicalAOV
  
  let score = 0
  let trend: 'worsening' | 'stable' | 'improving' = 'stable'
  
  if (aovChange < -0.3) {
    score = 15
    trend = 'worsening'
  } else if (aovChange < -0.15) {
    score = 8
    trend = 'worsening'
  }
  
  if (score > 0) {
    return {
      score,
      factor: {
        factor: 'AOV 감소',
        weight: score,
        currentValue: `최근 평균 $${recentAOV.toFixed(0)}`,
        benchmark: `전체 평균 $${historicalAOV.toFixed(0)}`,
        trend
      }
    }
  }
  
  return { score: 0, factor: null }
}

/**
 * 마지막 주문 이후 경과일 분석
 */
function analyzeRecency(customer: CustomerData): { score: number; factor: ChurnRiskFactor | null } {
  const daysSinceLastOrder = (new Date().getTime() - customer.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
  
  let score = 0
  let trend: 'worsening' | 'stable' | 'improving' = 'stable'
  
  if (daysSinceLastOrder > 180) {
    score = 20
    trend = 'worsening'
  } else if (daysSinceLastOrder > 120) {
    score = 15
    trend = 'worsening'
  } else if (daysSinceLastOrder > 90) {
    score = 10
    trend = 'worsening'
  } else if (daysSinceLastOrder > 60) {
    score = 5
    trend = 'stable'
  }
  
  if (score > 0) {
    return {
      score,
      factor: {
        factor: '장기 미구매',
        weight: score,
        currentValue: `${Math.round(daysSinceLastOrder)}일 경과`,
        benchmark: '60일 이내 재구매 권장',
        trend
      }
    }
  }
  
  return { score: 0, factor: null }
}

/**
 * 이탈 확률 계산 및 예측 생성
 */
function calculateChurnPrediction(customer: CustomerData): ChurnPrediction {
  const riskFactors: ChurnRiskFactor[] = []
  let totalScore = 0
  
  // 1. 구매 간격 분석 (최대 35점)
  const intervalResult = analyzeOrderInterval(customer)
  totalScore += intervalResult.score
  if (intervalResult.factor) riskFactors.push(intervalResult.factor)
  
  // 2. 구매 빈도 추세 (최대 25점)
  const frequencyResult = analyzeFrequencyTrend(customer)
  totalScore += frequencyResult.score
  if (frequencyResult.factor) riskFactors.push(frequencyResult.factor)
  
  // 3. AOV 변화 (최대 15점)
  const aovResult = analyzeAOVChange(customer)
  totalScore += aovResult.score
  if (aovResult.factor) riskFactors.push(aovResult.factor)
  
  // 4. 마지막 주문 경과일 (최대 20점)
  const recencyResult = analyzeRecency(customer)
  totalScore += recencyResult.score
  if (recencyResult.factor) riskFactors.push(recencyResult.factor)
  
  // 이탈 확률 (최대 100%)
  const churnProbability = Math.min(totalScore, 100)
  
  // 리스크 레벨 결정
  const riskLevel: 'critical' | 'high' | 'medium' | 'low' = 
    churnProbability >= 70 ? 'critical' :
    churnProbability >= 50 ? 'high' :
    churnProbability >= 30 ? 'medium' : 'low'
  
  // 예상 이탈까지 남은 일수 계산
  const avgInterval = customer.orderHistory.length > 1
    ? (customer.lastOrderDate.getTime() - customer.firstOrderDate.getTime()) / 
      (customer.orderHistory.length - 1) / (1000 * 60 * 60 * 24)
    : 90
  const daysSinceLastOrder = (new Date().getTime() - customer.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
  const daysUntilChurn = Math.max(0, Math.round(avgInterval * 3 - daysSinceLastOrder))
  
  // 권장 조치 생성
  const recommendedActions = generateRecommendedActions(riskLevel, riskFactors, customer)
  
  // 현재 세그먼트 결정 (간단한 RFM 기반)
  const currentSegment = determineSegment(customer)
  
  return {
    customerId: customer.customerId,
    customerName: customer.customerName,
    currentSegment,
    churnProbability,
    riskLevel,
    daysUntilChurn,
    riskFactors,
    lifetimeValue: {
      historical: customer.totalSpent,
      atRisk: customer.totalSpent * (churnProbability / 100)
    },
    recommendedActions,
    lastOrderDate: customer.lastOrderDate.toISOString().split('T')[0],
    totalOrders: customer.totalOrders,
    avgOrderValue: customer.avgOrderValue
  }
}

/**
 * 세그먼트 결정
 */
function determineSegment(customer: CustomerData): string {
  const daysSinceLastOrder = (new Date().getTime() - customer.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
  
  if (customer.totalSpent > 500 && customer.totalOrders >= 5) {
    if (daysSinceLastOrder < 60) return 'VIP'
    if (daysSinceLastOrder < 120) return 'VIP (이탈 위험)'
    return 'VIP (이탈)'
  }
  
  if (customer.totalOrders >= 3) {
    if (daysSinceLastOrder < 90) return 'Loyal'
    return 'At Risk'
  }
  
  if (customer.totalOrders === 1) {
    const daysSinceFirst = (new Date().getTime() - customer.firstOrderDate.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceFirst < 30) return 'New'
    return 'Lost'
  }
  
  return 'Potential'
}

/**
 * 권장 조치 생성
 */
function generateRecommendedActions(
  riskLevel: string,
  riskFactors: ChurnRiskFactor[],
  customer: CustomerData
): { action: string; expectedImpact: string; priority: 'high' | 'medium' | 'low' }[] {
  const actions: { action: string; expectedImpact: string; priority: 'high' | 'medium' | 'low' }[] = []
  
  if (riskLevel === 'critical' || riskLevel === 'high') {
    actions.push({
      action: '개인화 리텐션 쿠폰 발급 (15-20% 할인)',
      expectedImpact: '재구매 확률 30% 증가 예상',
      priority: 'high'
    })
    
    if (customer.totalSpent > 300) {
      actions.push({
        action: 'VIP 전용 혜택 안내 이메일 발송',
        expectedImpact: '브랜드 충성도 회복',
        priority: 'high'
      })
    }
  }
  
  const hasAOVDecline = riskFactors.some(f => f.factor.includes('AOV'))
  if (hasAOVDecline) {
    actions.push({
      action: '프리미엄 상품 큐레이션 이메일',
      expectedImpact: 'AOV 회복 가능성',
      priority: 'medium'
    })
  }
  
  const hasFrequencyDecline = riskFactors.some(f => f.factor.includes('빈도'))
  if (hasFrequencyDecline) {
    actions.push({
      action: '신상품/베스트셀러 알림 설정',
      expectedImpact: '방문 빈도 증가',
      priority: 'medium'
    })
  }
  
  if (riskLevel === 'medium') {
    actions.push({
      action: '리마인드 이메일 발송',
      expectedImpact: '재방문 유도',
      priority: 'low'
    })
  }
  
  return actions.slice(0, 3)
}

// ==================== 메인 서비스 ====================

export class ChurnPredictor {
  private sheetsService: GoogleSheetsService
  
  constructor() {
    this.sheetsService = new GoogleSheetsService()
  }
  
  /**
   * 이탈 예측 실행
   */
  async predictChurn(
    period: '30d' | '90d' | '180d' | '365d' = '90d',
    options: {
      minOrders?: number
      riskLevelFilter?: string[]
    } = {}
  ): Promise<ChurnPredictionResult> {
    const minOrders = options.minOrders || 2
    const riskLevelFilter = options.riskLevelFilter
    
    try {
      // 물류 데이터에서 고객 정보 추출
      const logisticsData = await this.sheetsService.getSheetData(SHEET_NAMES.LOGISTICS)
      
      // 기간 필터
      const periodDays = parseInt(period)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - (isNaN(periodDays) ? 90 : periodDays))
      
      // 고객별 데이터 집계
      const customerMap = new Map<string, CustomerData>()
      
      for (const row of logisticsData) {
        if (!row['user_id'] || !row['order_created']) continue
        
        const customerId = String(row['user_id'])
        const orderDate = new Date(row['order_created'])
        const amount = parseFloat(row['Total GMV'] || row['total_gmv'] || '0') || 0
        
        if (isNaN(orderDate.getTime())) continue
        
        if (!customerMap.has(customerId)) {
          customerMap.set(customerId, {
            customerId,
            customerName: `고객 ${customerId}`,
            lastOrderDate: orderDate,
            firstOrderDate: orderDate,
            totalOrders: 0,
            totalSpent: 0,
            avgOrderValue: 0,
            orderHistory: [],
            country: row['country'] || '',
            favoriteArtist: row['artist_name (kr)'] || row['artist_name']
          })
        }
        
        const customer = customerMap.get(customerId)!
        customer.totalOrders++
        customer.totalSpent += amount
        customer.orderHistory.push({ date: orderDate, amount })
        
        if (orderDate > customer.lastOrderDate) {
          customer.lastOrderDate = orderDate
        }
        if (orderDate < customer.firstOrderDate) {
          customer.firstOrderDate = orderDate
        }
      }
      
      // 주문 이력 정렬 (최신순)
      customerMap.forEach(customer => {
        customer.orderHistory.sort((a, b) => b.date.getTime() - a.date.getTime())
        customer.avgOrderValue = customer.totalSpent / customer.totalOrders
      })
      
      // 최소 주문 수 필터링 및 예측 실행
      const predictions: ChurnPrediction[] = []
      
      customerMap.forEach(customer => {
        if (customer.totalOrders >= minOrders) {
          const prediction = calculateChurnPrediction(customer)
          
          // 리스크 레벨 필터
          if (!riskLevelFilter || riskLevelFilter.includes(prediction.riskLevel)) {
            predictions.push(prediction)
          }
        }
      })
      
      // 이탈 확률 기준 정렬 (높은 순)
      predictions.sort((a, b) => b.churnProbability - a.churnProbability)
      
      // 요약 통계 계산
      const summary: ChurnPredictionSummary = {
        totalCustomers: customerMap.size,
        atRiskCustomers: predictions.filter(p => p.riskLevel !== 'low').length,
        criticalCount: predictions.filter(p => p.riskLevel === 'critical').length,
        highCount: predictions.filter(p => p.riskLevel === 'high').length,
        mediumCount: predictions.filter(p => p.riskLevel === 'medium').length,
        lowCount: predictions.filter(p => p.riskLevel === 'low').length,
        totalValueAtRisk: predictions.reduce((sum, p) => sum + p.lifetimeValue.atRisk, 0),
        avgChurnProbability: predictions.length > 0
          ? predictions.reduce((sum, p) => sum + p.churnProbability, 0) / predictions.length
          : 0
      }
      
      return {
        summary,
        predictions: predictions.slice(0, 100), // 상위 100명만 반환
        generatedAt: new Date().toISOString()
      }
      
    } catch (error) {
      console.error('[ChurnPredictor] 예측 오류:', error)
      throw error
    }
  }
  
  /**
   * 특정 고객의 이탈 예측 상세
   */
  async predictCustomerChurn(customerId: string): Promise<ChurnPrediction | null> {
    const result = await this.predictChurn('365d', { minOrders: 1 })
    return result.predictions.find(p => p.customerId === customerId) || null
  }
}

export default ChurnPredictor

