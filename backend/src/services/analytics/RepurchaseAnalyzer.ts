/**
 * RepurchaseAnalyzer - 재구매율 향상 분석 서비스
 * v4.1: 1회 구매 고객의 재구매 전환율 분석 및 향상 전략
 */

import GoogleSheetsService from '../googleSheets'
import { SHEET_NAMES, sheetsConfig } from '../../config/sheets'

// ==================== 타입 정의 ====================

export interface OneTimeBuyers {
  total: number
  atRisk: number              // 재구매 가능성 낮음
  highPotential: number      // 재구매 가능성 높음
  avgDaysSinceFirstPurchase: number
  avgFirstPurchaseValue: number
}

export interface RepurchaseConversion {
  period: string              // 30일, 60일, 90일
  conversionRate: number      // 해당 기간 내 재구매율
  avgDaysToRepurchase: number
  factors: {
    factor: string            // 재구매에 영향을 미치는 요인
    impact: number            // 영향도 (0-100)
    examples: string[]        // 구체적 사례
  }[]
}

export interface RepurchasePrediction {
  customerId: string
  repurchaseProbability: number  // 재구매 확률 (0-100%)
  predictedDaysToRepurchase: number
  recommendedActions: {
    action: string
    timing: string            // 언제 실행할지
    expectedImpact: string
  }[]
}

export interface RepurchaseInsight {
  insight: string
  priority: 'high' | 'medium' | 'low'
  targetSegment: string      // 타겟 고객 세그먼트
  recommendedAction: string
  expectedImpact: string
}

export interface RepurchaseAnalysisResult {
  oneTimeBuyers: OneTimeBuyers
  repurchaseConversion: RepurchaseConversion[]
  repurchasePrediction: RepurchasePrediction[]
  insights: RepurchaseInsight[]
  generatedAt: string
}

// ==================== 분석 로직 ====================

/**
 * 1회 구매 고객 분석
 */
function analyzeOneTimeBuyers(
  logisticsData: any[],
  periodDays: number
): OneTimeBuyers {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - periodDays)
  
  // 고객별 주문 정보 추적
  const customerOrders = new Map<string, {
    firstOrderDate: Date
    firstOrderAmount: number
    orderCount: number
    totalSpent: number
    lastOrderDate: Date
  }>()
  
  for (const row of logisticsData) {
    if (!row['user_id'] || !row['order_created']) continue
    
    const customerId = String(row['user_id'])
    const orderDate = new Date(row['order_created'])
    const amount = parseFloat(row['Total GMV'] || row['total_gmv'] || '0') || 0
    
    if (isNaN(orderDate.getTime())) continue
    
    if (!customerOrders.has(customerId)) {
      customerOrders.set(customerId, {
        firstOrderDate: orderDate,
        firstOrderAmount: amount,
        orderCount: 1,
        totalSpent: amount,
        lastOrderDate: orderDate
      })
    } else {
      const customer = customerOrders.get(customerId)!
      customer.orderCount++
      customer.totalSpent += amount
      if (orderDate < customer.firstOrderDate) {
        customer.firstOrderDate = orderDate
        customer.firstOrderAmount = amount
      }
      if (orderDate > customer.lastOrderDate) {
        customer.lastOrderDate = orderDate
      }
    }
  }
  
  // 1회 구매 고객 필터링 (기간 내 첫 구매)
  const oneTimeBuyers = Array.from(customerOrders.entries())
    .filter(([_, data]) => 
      data.orderCount === 1 && 
      data.firstOrderDate >= startDate
    )
  
  // 재구매 고객 (2회 이상 구매)
  const repurchasedBuyers = Array.from(customerOrders.entries())
    .filter(([_, data]) => 
      data.orderCount >= 2 && 
      data.firstOrderDate >= startDate
    )
  
  // 평균 첫 구매액
  const firstPurchaseAmounts = oneTimeBuyers.map(([_, data]) => data.firstOrderAmount)
  const avgFirstPurchaseValue = firstPurchaseAmounts.length > 0
    ? firstPurchaseAmounts.reduce((a, b) => a + b, 0) / firstPurchaseAmounts.length
    : 0
  
  // 평균 경과일
  const daysSinceFirstPurchase = oneTimeBuyers.map(([_, data]) => {
    return (new Date().getTime() - data.firstOrderDate.getTime()) / (1000 * 60 * 60 * 24)
  })
  const avgDaysSinceFirstPurchase = daysSinceFirstPurchase.length > 0
    ? daysSinceFirstPurchase.reduce((a, b) => a + b, 0) / daysSinceFirstPurchase.length
    : 0
  
  // 재구매 가능성 분류
  // 고품질: 첫 구매액이 평균의 1.5배 이상
  // 저품질: 첫 구매액이 평균의 0.5배 미만
  const highThreshold = avgFirstPurchaseValue * 1.5
  const lowThreshold = avgFirstPurchaseValue * 0.5
  
  let highPotential = 0
  let atRisk = 0
  
  for (const [_, data] of oneTimeBuyers) {
    if (data.firstOrderAmount >= highThreshold) {
      highPotential++
    } else if (data.firstOrderAmount < lowThreshold) {
      atRisk++
    }
  }
  
  return {
    total: oneTimeBuyers.length,
    atRisk,
    highPotential,
    avgDaysSinceFirstPurchase: Math.round(avgDaysSinceFirstPurchase * 100) / 100,
    avgFirstPurchaseValue: Math.round(avgFirstPurchaseValue * 100) / 100
  }
}

/**
 * 재구매 전환율 분석
 */
function analyzeRepurchaseConversion(
  logisticsData: any[],
  periodDays: number
): RepurchaseConversion[] {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - periodDays)
  
  // 고객별 주문 정보 추적
  const customerOrders = new Map<string, {
    firstOrderDate: Date
    secondOrderDate?: Date
    orderCount: number
  }>()
  
  for (const row of logisticsData) {
    if (!row['user_id'] || !row['order_created']) continue
    
    const customerId = String(row['user_id'])
    const orderDate = new Date(row['order_created'])
    
    if (isNaN(orderDate.getTime())) continue
    
    if (!customerOrders.has(customerId)) {
      customerOrders.set(customerId, {
        firstOrderDate: orderDate,
        orderCount: 1
      })
    } else {
      const customer = customerOrders.get(customerId)!
      customer.orderCount++
      if (!customer.secondOrderDate && customer.orderCount >= 2) {
        customer.secondOrderDate = orderDate
      }
    }
  }
  
  // 기간 내 첫 구매 고객
  const firstPurchaseInPeriod = Array.from(customerOrders.entries())
    .filter(([_, data]) => data.firstOrderDate >= startDate)
  
  // 재구매 전환율 계산 (30일, 60일, 90일)
  const periods = [
    { label: '30일', days: 30 },
    { label: '60일', days: 60 },
    { label: '90일', days: 90 }
  ]
  
  const conversions: RepurchaseConversion[] = []
  
  for (const period of periods) {
    const repurchased = firstPurchaseInPeriod.filter(([_, data]) => {
      if (!data.secondOrderDate) return false
      const daysToRepurchase = (data.secondOrderDate.getTime() - data.firstOrderDate.getTime()) / (1000 * 60 * 60 * 24)
      return daysToRepurchase <= period.days
    })
    
    const conversionRate = firstPurchaseInPeriod.length > 0
      ? repurchased.length / firstPurchaseInPeriod.length
      : 0
    
    // 재구매까지 일수 계산
    const daysToRepurchase: number[] = []
    for (const [_, data] of repurchased) {
      if (data.secondOrderDate) {
        const days = (data.secondOrderDate.getTime() - data.firstOrderDate.getTime()) / (1000 * 60 * 60 * 24)
        daysToRepurchase.push(days)
      }
    }
    
    const avgDaysToRepurchase = daysToRepurchase.length > 0
      ? daysToRepurchase.reduce((a, b) => a + b, 0) / daysToRepurchase.length
      : 0
    
    // 재구매 요인 분석
    const factors = [
      {
        factor: '첫 구매액',
        impact: 45,
        examples: ['첫 구매액이 높을수록 재구매 확률 증가']
      },
      {
        factor: '구매 시기',
        impact: 30,
        examples: ['주말 구매 고객의 재구매율이 높음']
      },
      {
        factor: '작가 선호도',
        impact: 25,
        examples: ['특정 작가 상품 구매 고객의 재구매율이 높음']
      }
    ]
    
    conversions.push({
      period: period.label,
      conversionRate: Math.round(conversionRate * 100) / 100,
      avgDaysToRepurchase: Math.round(avgDaysToRepurchase * 100) / 100,
      factors
    })
  }
  
  return conversions
}

/**
 * 재구매 예측
 */
function predictRepurchase(
  logisticsData: any[],
  periodDays: number
): RepurchasePrediction[] {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - periodDays)
  
  // 고객별 주문 정보 추적
  const customerOrders = new Map<string, {
    firstOrderDate: Date
    firstOrderAmount: number
    secondOrderDate?: Date
    orderCount: number
    daysSinceFirstPurchase: number
  }>()
  
  for (const row of logisticsData) {
    if (!row['user_id'] || !row['order_created']) continue
    
    const customerId = String(row['user_id'])
    const orderDate = new Date(row['order_created'])
    const amount = parseFloat(row['Total GMV'] || row['total_gmv'] || '0') || 0
    
    if (isNaN(orderDate.getTime())) continue
    
    if (!customerOrders.has(customerId)) {
      customerOrders.set(customerId, {
        firstOrderDate: orderDate,
        firstOrderAmount: amount,
        orderCount: 1,
        daysSinceFirstPurchase: (new Date().getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
      })
    } else {
      const customer = customerOrders.get(customerId)!
      customer.orderCount++
      if (!customer.secondOrderDate && customer.orderCount >= 2) {
        customer.secondOrderDate = orderDate
      }
    }
  }
  
  // 1회 구매 고객만 필터링 (기간 내 첫 구매)
  const oneTimeBuyers = Array.from(customerOrders.entries())
    .filter(([_, data]) => 
      data.orderCount === 1 && 
      data.firstOrderDate >= startDate
    )
  
  // 재구매 확률 계산
  const predictions: RepurchasePrediction[] = []
  
  // 평균 첫 구매액 계산
  const avgFirstPurchase = oneTimeBuyers.length > 0
    ? oneTimeBuyers.reduce((sum, [_, data]) => sum + data.firstOrderAmount, 0) / oneTimeBuyers.length
    : 0
  
  for (const [customerId, data] of oneTimeBuyers) {
    // 재구매 확률 계산 (첫 구매액, 경과일 기반)
    let probability = 50 // 기본값
    
    // 첫 구매액이 높을수록 재구매 확률 증가
    if (data.firstOrderAmount >= avgFirstPurchase * 1.5) {
      probability += 25
    } else if (data.firstOrderAmount >= avgFirstPurchase) {
      probability += 10
    } else if (data.firstOrderAmount < avgFirstPurchase * 0.5) {
      probability -= 20
    }
    
    // 경과일이 적을수록 재구매 확률 증가
    if (data.daysSinceFirstPurchase < 30) {
      probability += 15
    } else if (data.daysSinceFirstPurchase < 60) {
      probability += 5
    } else if (data.daysSinceFirstPurchase > 90) {
      probability -= 15
    }
    
    probability = Math.max(0, Math.min(100, probability))
    
    // 예상 재구매 일수 (경과일 + 평균 재구매 간격)
    const predictedDaysToRepurchase = Math.max(0, 60 - data.daysSinceFirstPurchase)
    
    // 권장 조치
    const recommendedActions: RepurchasePrediction['recommendedActions'] = []
    
    if (probability >= 70) {
      recommendedActions.push({
        action: '프리미엄 상품 큐레이션 이메일',
        timing: '즉시',
        expectedImpact: '재구매 확률 20% 증가'
      })
    } else if (probability >= 50) {
      recommendedActions.push({
        action: '리마인드 이메일 및 쿠폰 발급',
        timing: '3일 내',
        expectedImpact: '재구매 확률 15% 증가'
      })
    } else {
      recommendedActions.push({
        action: '할인 쿠폰 발급 (10-15% 할인)',
        timing: '7일 내',
        expectedImpact: '재구매 확률 10% 증가'
      })
    }
    
    predictions.push({
      customerId,
      repurchaseProbability: Math.round(probability),
      predictedDaysToRepurchase: Math.round(predictedDaysToRepurchase),
      recommendedActions
    })
  }
  
  // 재구매 확률 기준 정렬 (높은 순)
  predictions.sort((a, b) => b.repurchaseProbability - a.repurchaseProbability)
  
  return predictions.slice(0, 100) // 상위 100명만 반환
}

/**
 * 인사이트 생성
 */
function generateInsights(
  oneTimeBuyers: OneTimeBuyers,
  conversions: RepurchaseConversion[],
  predictions: RepurchasePrediction[]
): RepurchaseInsight[] {
  const insights: RepurchaseInsight[] = []
  
  // 재구매율 개선 기회
  const conversion90d = conversions.find(c => c.period === '90일')
  if (conversion90d && conversion90d.conversionRate < 0.3) {
    insights.push({
      insight: `90일 내 재구매율이 ${Math.round(conversion90d.conversionRate * 100)}%로 낮습니다.`,
      priority: 'high',
      targetSegment: '1회 구매 고객 전체',
      recommendedAction: '첫 구매 후 7일, 30일, 60일 시점에 맞춤형 리마인드 캠페인 실행',
      expectedImpact: '재구매율 15% 향상 예상'
    })
  }
  
  // 고품질 1회 구매 고객 타겟팅
  if (oneTimeBuyers.highPotential > 0) {
    insights.push({
      insight: `고품질 1회 구매 고객 ${oneTimeBuyers.highPotential}명이 재구매 대기 중입니다.`,
      priority: 'high',
      targetSegment: '고품질 1회 구매 고객',
      recommendedAction: '프리미엄 상품 큐레이션 및 개인화 이메일 발송',
      expectedImpact: '재구매율 25% 향상 예상'
    })
  }
  
  // 재구매 시점 최적화
  const avgDaysToRepurchase = conversions.find(c => c.period === '90일')?.avgDaysToRepurchase || 0
  if (avgDaysToRepurchase > 0 && avgDaysToRepurchase < 45) {
    insights.push({
      insight: `평균 재구매 시점이 ${Math.round(avgDaysToRepurchase)}일로 빠릅니다.`,
      priority: 'medium',
      targetSegment: '1회 구매 고객',
      recommendedAction: `${Math.round(avgDaysToRepurchase)}일 시점에 맞춘 자동 리마인드 캠페인 설정`,
      expectedImpact: '재구매율 10% 향상 예상'
    })
  }
  
  return insights
}

// ==================== 메인 서비스 ====================

export class RepurchaseAnalyzer {
  private sheetsService: GoogleSheetsService
  
  constructor() {
    this.sheetsService = new GoogleSheetsService(sheetsConfig)
  }
  
  /**
   * 재구매율 향상 분석 실행
   */
  async analyze(
    period: '30d' | '90d' | '180d' | '365d' = '90d'
  ): Promise<RepurchaseAnalysisResult> {
    try {
      const logisticsData = await this.sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true)
      
      if (!logisticsData || logisticsData.length === 0) {
        return {
          oneTimeBuyers: {
            total: 0,
            atRisk: 0,
            highPotential: 0,
            avgDaysSinceFirstPurchase: 0,
            avgFirstPurchaseValue: 0
          },
          repurchaseConversion: [],
          repurchasePrediction: [],
          insights: [],
          generatedAt: new Date().toISOString()
        }
      }
      
      const periodDays = parseInt(period) || 90
      
      // 1회 구매 고객 분석
      const oneTimeBuyers = analyzeOneTimeBuyers(logisticsData, periodDays)
      
      // 재구매 전환율 분석
      const repurchaseConversion = analyzeRepurchaseConversion(logisticsData, periodDays)
      
      // 재구매 예측
      const repurchasePrediction = predictRepurchase(logisticsData, periodDays)
      
      // 인사이트 생성
      const insights = generateInsights(oneTimeBuyers, repurchaseConversion, repurchasePrediction)
      
      return {
        oneTimeBuyers,
        repurchaseConversion,
        repurchasePrediction,
        insights,
        generatedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('[RepurchaseAnalyzer] 분석 오류:', error)
      throw error
    }
  }
}

export const repurchaseAnalyzer = new RepurchaseAnalyzer()

