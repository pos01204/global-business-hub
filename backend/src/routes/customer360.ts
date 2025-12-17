// backend/src/routes/customer360.ts
// 고객 360° 뷰 API (Phase 4)

import { Router, Request, Response } from 'express'
import GoogleSheetsService from '../services/googleSheets'
import { sheetsConfig, SHEET_NAMES } from '../config/sheets'
import { CURRENCY } from '../config/constants'
import { RFM_THRESHOLDS, CUSTOMER_ACTIVITY_THRESHOLDS } from '../config/businessRules'

const router = Router()
const sheetsService = new GoogleSheetsService(sheetsConfig)

// ============================================================
// 유틸리티 함수
// ============================================================

function safeNumber(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined) return defaultValue
  const num = typeof value === 'string' 
    ? parseFloat(value.replace(/[,\s]/g, ''))
    : Number(value)
  return isNaN(num) || !isFinite(num) ? defaultValue : num
}

/**
 * RFM 점수 계산
 */
function calculateRFMScore(recencyDays: number, frequency: number, monetaryKrw: number): {
  r: number
  f: number
  m: number
  score: string
  segment: string
} {
  // Recency 점수 (최근일수록 높음)
  let r = 1
  if (recencyDays <= RFM_THRESHOLDS.RECENCY.HIGH) r = 5
  else if (recencyDays <= 60) r = 4
  else if (recencyDays <= RFM_THRESHOLDS.RECENCY.MEDIUM) r = 3
  else if (recencyDays <= 180) r = 2
  
  // Frequency 점수
  let f = 1
  if (frequency >= RFM_THRESHOLDS.FREQUENCY.HIGH) f = 5
  else if (frequency >= 4) f = 4
  else if (frequency >= 3) f = 3
  else if (frequency >= RFM_THRESHOLDS.FREQUENCY.MEDIUM) f = 2
  
  // Monetary 점수
  let m = 1
  if (monetaryKrw >= RFM_THRESHOLDS.MONETARY.HIGH) m = 5
  else if (monetaryKrw >= 300000) m = 4
  else if (monetaryKrw >= 200000) m = 3
  else if (monetaryKrw >= RFM_THRESHOLDS.MONETARY.MEDIUM) m = 2
  
  const score = `${r}-${f}-${m}`
  
  // 세그먼트 결정
  let segment = 'Others'
  const total = r + f + m
  
  if (r >= 4 && f >= 4 && m >= 4) segment = 'Champions'
  else if (r >= 3 && f >= 4) segment = 'Loyal Customers'
  else if (r >= 4 && f <= 2) segment = 'New Customers'
  else if (r >= 3 && f >= 3) segment = 'Potential Loyalists'
  else if (r <= 2 && f >= 3) segment = 'At Risk'
  else if (r <= 2 && f <= 2 && m >= 3) segment = 'Can\'t Lose Them'
  else if (r <= 2 && f <= 2) segment = 'Hibernating'
  else if (r >= 3) segment = 'Promising'
  
  return { r, f, m, score, segment }
}

/**
 * LTV 추정 (간단한 공식)
 */
function estimateLTV(avgOrderValue: number, purchaseFrequency: number, customerLifespan: number = 3): {
  value: number
  confidence: number
  basis: string
} {
  // LTV = AOV × 구매빈도(연) × 고객수명(년)
  const annualPurchases = purchaseFrequency > 0 ? Math.min(purchaseFrequency * 4, 12) : 1 // 분기당 구매를 연간으로 환산
  const ltv = avgOrderValue * annualPurchases * customerLifespan
  
  // 신뢰도: 데이터 양에 따라
  let confidence = 0.5
  if (purchaseFrequency >= 5) confidence = 0.8
  else if (purchaseFrequency >= 3) confidence = 0.7
  else if (purchaseFrequency >= 2) confidence = 0.6
  
  return {
    value: Math.round(ltv),
    confidence,
    basis: `AOV(₩${avgOrderValue.toLocaleString()}) × 연간 구매(${annualPurchases}회) × 수명(${customerLifespan}년)`
  }
}

// ============================================================
// API 엔드포인트
// ============================================================

/**
 * 고객 검색
 * GET /api/customer-360/search?q=검색어&type=email|userId
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, type = 'email', limit = 20 } = req.query
    
    if (!q || (q as string).length < 2) {
      return res.status(400).json({
        success: false,
        error: '검색어는 최소 2자 이상이어야 합니다.'
      })
    }
    
    // 사용자 데이터 로드
    let usersData: any[] = []
    try {
      usersData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.USERS, false)
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: '사용자 데이터를 찾을 수 없습니다.'
      })
    }
    
    const searchTerm = (q as string).toLowerCase()
    const limitNum = parseInt(limit as string) || 20
    
    // 검색
    const results = usersData
      .filter((user: any) => {
        if (type === 'userId') {
          return String(user.ID || user.id || user.user_id || '').toLowerCase().includes(searchTerm)
        }
        // email 또는 기타
        const email = (user.EMAIL || user.email || '').toLowerCase()
        const name = (user.NAME || user.name || '').toLowerCase()
        return email.includes(searchTerm) || name.includes(searchTerm)
      })
      .slice(0, limitNum)
      .map((user: any) => ({
        userId: user.ID || user.id || user.user_id,
        email: user.EMAIL || user.email,
        name: user.NAME || user.name,
        country: user.COUNTRY || user.country,
        createdAt: user.CREATED_AT || user.created_at,
      }))
    
    res.json({
      success: true,
      data: {
        query: q,
        type,
        count: results.length,
        results
      }
    })
  } catch (error: any) {
    console.error('[Customer360] Search failed:', error)
    res.status(500).json({
      success: false,
      error: '고객 검색 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

/**
 * 고객 360° 뷰
 * GET /api/customer-360/:userId
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId가 필요합니다.'
      })
    }
    
    // 데이터 로드
    const [usersData, ordersData, couponsData, reviewsData] = await Promise.all([
      sheetsService.getSheetDataAsJson(SHEET_NAMES.USERS, false).catch(() => []),
      sheetsService.getSheetDataAsJson(SHEET_NAMES.ORDER, false).catch(() => []),
      sheetsService.getSheetDataAsJson('coupon', false).catch(() => []),
      sheetsService.getSheetDataAsJson(SHEET_NAMES.REVIEW, false).catch(() => []),
    ])
    
    // 사용자 찾기
    const user = usersData.find((u: any) => 
      String(u.ID || u.id || u.user_id) === String(userId)
    )
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '해당 고객을 찾을 수 없습니다.'
      })
    }
    
    // 주문 데이터 필터링
    const userOrders = ordersData
      .filter((order: any) => String(order.user_id || order.USER_ID) === String(userId))
      .map((order: any) => ({
        orderId: order.order_code || order.ORDER_CODE,
        orderDate: order.order_created || order.ORDER_CREATED,
        totalAmount: safeNumber(order.total_gmv) * CURRENCY.USD_TO_KRW,
        itemCount: safeNumber(order.quantity, 1),
        status: order.order_status || order.STATUS || 'unknown',
        artistName: order['artist_name (kr)'] || order.artist_name,
        productName: order.product_name,
      }))
      .sort((a: any, b: any) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
    
    // 쿠폰 사용 이력 (userId로 필터링 - 실제 데이터 구조에 따라 조정 필요)
    const userCoupons = couponsData
      .filter((coupon: any) => {
        // 쿠폰 데이터에 사용자 정보가 있는 경우
        const couponUserId = coupon.user_id || coupon.USER_ID
        return couponUserId && String(couponUserId) === String(userId)
      })
      .map((coupon: any) => ({
        couponId: coupon.coupon_id,
        couponName: coupon.coupon_name || coupon.title,
        usedDate: coupon.used_date || coupon.to_datetime,
        discountAmount: safeNumber(coupon.discount_amount) * CURRENCY.USD_TO_KRW,
      }))
    
    // 리뷰 이력
    const userReviews = reviewsData
      .filter((review: any) => String(review.user_id || review.USER_ID) === String(userId))
      .map((review: any) => ({
        reviewId: review.review_id || review.id,
        productName: review.product_name || review.PRODUCT_NAME,
        artistName: review.artist_name || review['artist_name (kr)'],
        rating: safeNumber(review.rating || review.score, 0),
        content: review.content || review.review_content || '',
        date: review.created_at || review.review_date,
      }))
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    // RFM 계산
    const now = new Date()
    const lastOrderDate = userOrders.length > 0 ? new Date(userOrders[0].orderDate) : null
    const recencyDays = lastOrderDate 
      ? Math.floor((now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
      : 999
    const frequency = userOrders.length
    const totalMonetary = userOrders.reduce((sum: number, o: any) => sum + o.totalAmount, 0)
    
    const rfm = calculateRFMScore(recencyDays, frequency, totalMonetary)
    
    // LTV 추정
    const avgOrderValue = frequency > 0 ? totalMonetary / frequency : 0
    const ltv = estimateLTV(avgOrderValue, frequency)
    
    // 고객 세그먼트 (활동 상태)
    let activityStatus = 'inactive'
    if (recencyDays <= CUSTOMER_ACTIVITY_THRESHOLDS.ACTIVE_DAYS) {
      activityStatus = 'active'
    } else if (recencyDays <= CUSTOMER_ACTIVITY_THRESHOLDS.INACTIVE_DAYS) {
      activityStatus = 'inactive'
    } else {
      activityStatus = 'churned'
    }
    
    res.json({
      success: true,
      data: {
        profile: {
          userId: user.ID || user.id || user.user_id,
          email: user.EMAIL || user.email,
          name: user.NAME || user.name,
          country: user.COUNTRY || user.country,
          createdAt: user.CREATED_AT || user.created_at,
          lastOrderDate: lastOrderDate?.toISOString() || null,
          activityStatus,
          segment: rfm.segment,
        },
        rfm: {
          recency: recencyDays,
          frequency,
          monetary: totalMonetary,
          scores: { r: rfm.r, f: rfm.f, m: rfm.m },
          score: rfm.score,
          segment: rfm.segment,
        },
        stats: {
          totalOrders: frequency,
          totalSpent: totalMonetary,
          avgOrderValue,
          totalReviews: userReviews.length,
          avgRating: userReviews.length > 0 
            ? userReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / userReviews.length
            : null,
          couponsUsed: userCoupons.length,
        },
        orders: userOrders.slice(0, 20), // 최근 20개
        coupons: userCoupons.slice(0, 10),
        reviews: userReviews.slice(0, 10),
        ltv,
      }
    })
  } catch (error: any) {
    console.error('[Customer360] Get customer failed:', error)
    res.status(500).json({
      success: false,
      error: '고객 정보 조회 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

/**
 * 고객 세그먼트 요약
 * GET /api/customer-360/segments/summary
 */
router.get('/segments/summary', async (req: Request, res: Response) => {
  try {
    // 사용자 및 주문 데이터 로드
    const [usersData, ordersData] = await Promise.all([
      sheetsService.getSheetDataAsJson(SHEET_NAMES.USERS, false).catch(() => []),
      sheetsService.getSheetDataAsJson(SHEET_NAMES.ORDER, false).catch(() => []),
    ])
    
    // 사용자별 주문 집계
    const userOrderMap = new Map<string, { orders: any[], totalGmv: number }>()
    
    ordersData.forEach((order: any) => {
      const uid = String(order.user_id || order.USER_ID)
      if (!uid) return
      
      if (!userOrderMap.has(uid)) {
        userOrderMap.set(uid, { orders: [], totalGmv: 0 })
      }
      
      const userData = userOrderMap.get(uid)!
      userData.orders.push(order)
      userData.totalGmv += safeNumber(order.total_gmv) * CURRENCY.USD_TO_KRW
    })
    
    // 세그먼트별 집계
    const segmentCounts: Record<string, number> = {}
    const now = new Date()
    
    usersData.forEach((user: any) => {
      const uid = String(user.ID || user.id || user.user_id)
      const orderData = userOrderMap.get(uid)
      
      if (!orderData || orderData.orders.length === 0) {
        segmentCounts['No Purchase'] = (segmentCounts['No Purchase'] || 0) + 1
        return
      }
      
      // 최근 주문일 계산
      const sortedOrders = orderData.orders.sort((a: any, b: any) => 
        new Date(b.order_created || b.ORDER_CREATED).getTime() - 
        new Date(a.order_created || a.ORDER_CREATED).getTime()
      )
      const lastOrderDate = new Date(sortedOrders[0].order_created || sortedOrders[0].ORDER_CREATED)
      const recencyDays = Math.floor((now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
      
      const rfm = calculateRFMScore(recencyDays, orderData.orders.length, orderData.totalGmv)
      segmentCounts[rfm.segment] = (segmentCounts[rfm.segment] || 0) + 1
    })
    
    res.json({
      success: true,
      data: {
        totalCustomers: usersData.length,
        segments: Object.entries(segmentCounts)
          .map(([segment, count]) => ({
            segment,
            count,
            percentage: ((count / usersData.length) * 100).toFixed(1)
          }))
          .sort((a, b) => b.count - a.count)
      }
    })
  } catch (error: any) {
    console.error('[Customer360] Segments summary failed:', error)
    res.status(500).json({
      success: false,
      error: '세그먼트 요약 조회 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

export default router

