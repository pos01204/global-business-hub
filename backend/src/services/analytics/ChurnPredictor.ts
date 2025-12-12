/**
 * ChurnPredictor - 고객 이탈 예측 서비스
 * v4.0: 규칙 기반 스코어링으로 고객 이탈 확률 예측
 */

import GoogleSheetsService from '../googleSheets'
import { SHEET_NAMES, sheetsConfig } from '../../config/sheets'

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
  
  churnStatus: 'at_risk' | 'churned'  // 이탈 위험 vs 이미 이탈 완료
  churnProbability: number        // 0-100% (churned인 경우 100)
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'churned'
  daysSinceLastOrder: number      // 마지막 주문 경과일
  daysUntilChurn: number          // 예상 이탈까지 남은 일수 (churned인 경우 0)
  
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
  churnedCustomers: number        // 이미 이탈 완료 고객 수
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  churnedCount: number            // 이탈 완료 고객 수
  totalValueAtRisk: number
  totalValueChurned: number       // 이미 이탈한 고객의 LTV
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
  const daysSinceLastOrder = (new Date().getTime() - customer.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
  
  // 6개월(180일) 이상 미구매 고객은 이미 이탈한 것으로 분류
  // 새로운 비즈니스 특성상 고객 재구매 주기가 짧으며, 6개월 이상 미구매 시 재활성화 가능성 낮음
  const CHURNED_THRESHOLD_DAYS = 180
  
  if (daysSinceLastOrder >= CHURNED_THRESHOLD_DAYS) {
    // 이미 이탈 완료 고객
    return {
      customerId: customer.customerId,
      customerName: customer.customerName,
      currentSegment: determineSegment(customer),
      churnStatus: 'churned',
      churnProbability: 100,
      riskLevel: 'churned',
      daysSinceLastOrder: Math.round(daysSinceLastOrder),
      daysUntilChurn: 0,
      riskFactors: [{
        factor: '장기 미구매 (이탈 완료)',
        weight: 100,
        currentValue: `${Math.round(daysSinceLastOrder)}일 경과`,
        benchmark: '6개월 이상 미구매 시 이탈로 간주',
        trend: 'worsening'
      }],
      lifetimeValue: {
        historical: customer.totalSpent,
        atRisk: customer.totalSpent
      },
      recommendedActions: [{
        action: '이탈 고객 재활성화 캠페인',
        expectedImpact: '응답률 모니터링 후 조정',
        priority: 'low'
      }],
      lastOrderDate: customer.lastOrderDate.toISOString().split('T')[0],
      totalOrders: customer.totalOrders,
      avgOrderValue: customer.avgOrderValue
    }
  }
  
  // 이탈 위험 고객 분석
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
  const daysUntilChurn = Math.max(0, Math.round(avgInterval * 3 - daysSinceLastOrder))
  
  // 권장 조치 생성
  const recommendedActions = generateRecommendedActions(riskLevel, riskFactors, customer)
  
  // 현재 세그먼트 결정 (간단한 RFM 기반)
  const currentSegment = determineSegment(customer)
  
  return {
    customerId: customer.customerId,
    customerName: customer.customerName,
    currentSegment,
    churnStatus: 'at_risk',
    churnProbability,
    riskLevel,
    daysSinceLastOrder: Math.round(daysSinceLastOrder),
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
    this.sheetsService = new GoogleSheetsService(sheetsConfig)
  }
  
  /**
   * 이탈 예측 실행
   */
  async predictChurn(
    period: '30d' | '90d' | '180d' | '365d' = '90d',
    options: {
      minOrders?: number
      riskLevelFilter?: string[]
      includeChurned?: boolean  // 이탈 완료 고객 포함 여부 (기본값: false)
    } = {}
  ): Promise<ChurnPredictionResult> {
    const minOrders = options.minOrders || 2
    const riskLevelFilter = options.riskLevelFilter
    const includeChurned = options.includeChurned ?? false  // 기본값: 이탈 완료 고객 제외
    
    try {
      // 물류 데이터에서 고객 정보 추출
      const logisticsData = await this.sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true)
      
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
      
      // 이탈 확률 기준 정렬 (높은 순, 이탈 완료 고객은 별도로)
      const churnedPredictions = predictions.filter(p => p.churnStatus === 'churned')
      const atRiskPredictions = predictions.filter(p => p.churnStatus === 'at_risk')
      
      atRiskPredictions.sort((a, b) => b.churnProbability - a.churnProbability)
      churnedPredictions.sort((a, b) => b.daysSinceLastOrder - a.daysSinceLastOrder)
      
      // 이탈 위험 고객과 이탈 완료 고객을 분리하여 반환
      // includeChurned가 false면 이탈 완료 고객 제외
      const sortedPredictions = includeChurned 
        ? [...atRiskPredictions, ...churnedPredictions]
        : atRiskPredictions
      
      // 요약 통계 계산
      const churnedCustomers = churnedPredictions.length
      const atRiskCustomers = atRiskPredictions.filter(p => p.riskLevel !== 'low').length
      
      const summary: ChurnPredictionSummary = {
        totalCustomers: customerMap.size,
        atRiskCustomers,
        churnedCustomers,
        criticalCount: atRiskPredictions.filter(p => p.riskLevel === 'critical').length,
        highCount: atRiskPredictions.filter(p => p.riskLevel === 'high').length,
        mediumCount: atRiskPredictions.filter(p => p.riskLevel === 'medium').length,
        lowCount: atRiskPredictions.filter(p => p.riskLevel === 'low').length,
        churnedCount: churnedCustomers,
        totalValueAtRisk: atRiskPredictions.reduce((sum, p) => sum + p.lifetimeValue.atRisk, 0),
        totalValueChurned: churnedPredictions.reduce((sum, p) => sum + p.lifetimeValue.historical, 0),
        avgChurnProbability: atRiskPredictions.length > 0
          ? atRiskPredictions.reduce((sum, p) => sum + p.churnProbability, 0) / atRiskPredictions.length
          : 0
      }
      
      return {
        summary,
        predictions: sortedPredictions.slice(0, 100), // 상위 100명만 반환 (이탈 위험 우선)
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

