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
 * GMV 값 추출 (컬럼명 정규화)
 * Raw Data 컬럼명: 'Total GMV' (공백 포함, 대문자)
 * 다양한 변환 케이스를 모두 처리
 */
function getOrderGmv(order: any): number {
  const gmvValue = 
    order['Total GMV'] ||           // 원본 컬럼명 (공백 포함)
    order['total GMV'] ||           // 소문자 시작
    order['Total_GMV'] ||           // 언더스코어 변환
    order.total_gmv ||              // 소문자 + 언더스코어
    order.TOTAL_GMV ||              // 대문자 + 언더스코어
    order.totalGmv ||               // camelCase
    order.TotalGMV ||               // PascalCase
    order['total gmv'] ||           // 소문자 + 공백
    order.gmv ||                    // 단순 gmv
    order.GMV ||                    // 대문자 GMV
    0
  return safeNumber(gmvValue)
}

/**
 * 쿠폰 할인액 추출 (order 시트에서)
 */
function getCouponDiscount(order: any): number {
  const couponValue =
    order['아이디어스 쿠폰비 (Item)'] ||
    order['아이디어스_쿠폰비_(Item)'] ||
    order.coupon_discount ||
    order.couponDiscount ||
    0
  return safeNumber(couponValue)
}

/**
 * 작가명 추출 (컬럼명 정규화)
 */
function getArtistName(order: any): string {
  return (
    order['artist_name (kr)'] ||
    order['artist_name(kr)'] ||
    order.artist_name_kr ||
    order.artistNameKr ||
    order.artist_name ||
    order.artistName ||
    ''
  )
}

/**
 * 요일 추출 (0=일요일, 1=월요일, ...)
 */
function getDayOfWeek(dateStr: string): string {
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
  try {
    const date = new Date(dateStr)
    return days[date.getDay()]
  } catch {
    return '알 수 없음'
  }
}

/**
 * 시간대 추출
 */
function getTimeOfDay(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const hour = date.getHours()
    if (hour >= 0 && hour < 6) return '새벽 (0-6시)'
    if (hour >= 6 && hour < 12) return '오전 (6-12시)'
    if (hour >= 12 && hour < 18) return '오후 (12-18시)'
    return '저녁 (18-24시)'
  } catch {
    return '알 수 없음'
  }
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
 * RFM 세그먼트 설명
 */
function getSegmentDescription(segment: string): string {
  const descriptions: Record<string, string> = {
    'Champions': '최고의 고객입니다. 자주 구매하고, 최근에도 구매했으며, 높은 금액을 지출합니다.',
    'Loyal Customers': '충성 고객입니다. 자주 구매하는 편이며 꾸준한 관계를 유지하고 있습니다.',
    'New Customers': '신규 고객입니다. 최근에 첫 구매를 했으며, 재구매를 유도할 필요가 있습니다.',
    'Potential Loyalists': '잠재적 충성 고객입니다. 적절한 관리로 Champions로 성장할 수 있습니다.',
    'At Risk': '이탈 위험 고객입니다. 이전에는 활발했으나 최근 구매가 줄었습니다. 재활성화가 필요합니다.',
    'Can\'t Lose Them': '잃어서는 안 되는 고객입니다. 높은 가치를 가졌으나 최근 활동이 없습니다.',
    'Hibernating': '휴면 고객입니다. 오랫동안 구매가 없습니다. 재활성화 캠페인을 고려하세요.',
    'Promising': '유망한 고객입니다. 최근 구매가 있으며, 더 많은 참여를 유도할 수 있습니다.',
    'Others': '일반 고객입니다.',
  }
  return descriptions[segment] || '분류되지 않은 고객입니다.'
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
    
    // 주문 데이터 필터링 (GMV 컬럼명 정규화 적용)
    const userOrders = ordersData
      .filter((order: any) => String(order.user_id || order.USER_ID) === String(userId))
      .map((order: any) => {
        const orderDate = order.order_created || order.ORDER_CREATED || order['order_created']
        return {
          orderId: order.order_code || order.ORDER_CODE || order['order_code'],
          orderDate,
          totalAmount: getOrderGmv(order) * CURRENCY.USD_TO_KRW,
          couponDiscount: getCouponDiscount(order) * CURRENCY.USD_TO_KRW,
          itemCount: safeNumber(order.quantity || order['구매수량'], 1),
          status: order.order_status || order.STATUS || order['order_status'] || 'unknown',
          artistName: getArtistName(order),
          productName: order.product_name || order['product_name'] || '',
          country: order.country || order.COUNTRY || '',
          dayOfWeek: getDayOfWeek(orderDate),
          timeOfDay: getTimeOfDay(orderDate),
        }
      })
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
    
    // ============================================================
    // 새로운 분석 데이터 계산
    // ============================================================
    
    // 1. 작가별 구매 집계 (Top Artists)
    const artistOrderMap = new Map<string, { gmv: number, orderCount: number, lastOrder: string }>()
    userOrders.forEach((order: any) => {
      const artistName = order.artistName
      if (!artistName) return
      
      if (!artistOrderMap.has(artistName)) {
        artistOrderMap.set(artistName, { gmv: 0, orderCount: 0, lastOrder: '' })
      }
      const data = artistOrderMap.get(artistName)!
      data.gmv += order.totalAmount
      data.orderCount += 1
      if (!data.lastOrder || new Date(order.orderDate) > new Date(data.lastOrder)) {
        data.lastOrder = order.orderDate
      }
    })
    
    const topArtists = Array.from(artistOrderMap.entries())
      .map(([name, data]) => ({
        name,
        gmv: Math.round(data.gmv),
        orderCount: data.orderCount,
        lastOrder: data.lastOrder,
      }))
      .sort((a, b) => b.gmv - a.gmv)
      .slice(0, 10)
    
    // 작가 목록 (전체)
    const artistList = Array.from(artistOrderMap.keys())
    
    // 2. 쿠폰 통계
    const totalCouponDiscount = userOrders.reduce((sum: number, o: any) => sum + (o.couponDiscount || 0), 0)
    const ordersWithCoupon = userOrders.filter((o: any) => o.couponDiscount > 0).length
    const couponStats = {
      totalSavings: Math.round(totalCouponDiscount),
      usageCount: ordersWithCoupon,
      usageRate: frequency > 0 ? Math.round((ordersWithCoupon / frequency) * 100 * 10) / 10 : 0,
    }
    
    // 3. 구매 패턴 분석
    const dayOfWeekCounts: Record<string, number> = {}
    const timeOfDayCounts: Record<string, number> = {}
    
    userOrders.forEach((order: any) => {
      if (order.dayOfWeek) {
        dayOfWeekCounts[order.dayOfWeek] = (dayOfWeekCounts[order.dayOfWeek] || 0) + 1
      }
      if (order.timeOfDay) {
        timeOfDayCounts[order.timeOfDay] = (timeOfDayCounts[order.timeOfDay] || 0) + 1
      }
    })
    
    // 선호 요일/시간대 찾기
    const preferredDayOfWeek = Object.entries(dayOfWeekCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '알 수 없음'
    const preferredTimeOfDay = Object.entries(timeOfDayCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '알 수 없음'
    
    // 평균 구매 주기 계산
    let avgPurchaseCycle = 0
    if (userOrders.length >= 2) {
      const sortedDates = userOrders
        .map((o: any) => new Date(o.orderDate).getTime())
        .sort((a, b) => a - b)
      
      let totalDays = 0
      for (let i = 1; i < sortedDates.length; i++) {
        totalDays += (sortedDates[i] - sortedDates[i-1]) / (1000 * 60 * 60 * 24)
      }
      avgPurchaseCycle = Math.round(totalDays / (sortedDates.length - 1))
    }
    
    // 고객 가입 후 기간 (월)
    const customerCreatedAt = user.CREATED_AT || user.created_at
    let customerMonths = 0
    if (customerCreatedAt) {
      const createdDate = new Date(customerCreatedAt)
      customerMonths = Math.max(1, Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 30)))
    }
    
    const purchaseFrequencyPerMonth = customerMonths > 0 ? Math.round((frequency / customerMonths) * 10) / 10 : frequency
    
    const purchasePatterns = {
      preferredDayOfWeek,
      preferredTimeOfDay,
      avgPurchaseCycle,
      purchaseFrequencyPerMonth,
      dayOfWeekDistribution: dayOfWeekCounts,
      timeOfDayDistribution: timeOfDayCounts,
    }
    
    // 4. 인사이트 생성
    const insights: Array<{ type: 'info' | 'warning' | 'success', message: string }> = []
    
    // 세그먼트 기반 인사이트
    insights.push({
      type: 'info',
      message: `이 고객은 "${rfm.segment}" 세그먼트에 속합니다.`
    })
    
    // 활동 상태 기반 인사이트
    if (activityStatus === 'churned') {
      insights.push({
        type: 'warning',
        message: `최근 ${recencyDays}일간 구매가 없어 이탈 위험이 높습니다. 재활성화 캠페인을 고려하세요.`
      })
    } else if (activityStatus === 'inactive') {
      insights.push({
        type: 'warning',
        message: `최근 ${recencyDays}일간 구매가 없습니다. 리마인더 이메일을 고려하세요.`
      })
    } else {
      insights.push({
        type: 'success',
        message: `활성 고객입니다. 최근 ${recencyDays}일 전에 구매했습니다.`
      })
    }
    
    // 구매 주기 기반 인사이트
    if (avgPurchaseCycle > 0 && recencyDays > avgPurchaseCycle * 1.5) {
      insights.push({
        type: 'warning',
        message: `평균 구매 주기(${avgPurchaseCycle}일)를 크게 초과했습니다.`
      })
    }
    
    // 선호 작가 인사이트
    if (topArtists.length > 0) {
      insights.push({
        type: 'info',
        message: `선호 작가(${topArtists[0].name})의 신규 작품 출시 시 알림을 고려하세요.`
      })
    }
    
    // 5. 권장 액션
    const recommendedActions: Array<{ label: string, action: string, params?: any }> = []
    
    if (activityStatus === 'churned' || activityStatus === 'inactive') {
      recommendedActions.push({
        label: '재방문 쿠폰 발급',
        action: 'issue_coupon',
        params: { type: 'reactivation', userId }
      })
    }
    
    recommendedActions.push({
      label: '통합 검색에서 조회',
      action: 'navigate',
      params: { path: `/lookup?type=user_id&query=${userId}` }
    })
    
    if (userReviews.length === 0 && frequency > 0) {
      recommendedActions.push({
        label: '리뷰 작성 요청',
        action: 'request_review',
        params: { userId }
      })
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
          // 세그먼트 설명 추가
          segmentDescription: getSegmentDescription(rfm.segment),
        },
        stats: {
          totalOrders: frequency,
          totalSpent: totalMonetary,
          avgOrderValue,
          totalReviews: userReviews.length,
          avgRating: userReviews.length > 0 
            ? Math.round((userReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / userReviews.length) * 10) / 10
            : null,
          couponsUsed: couponStats.usageCount,
          couponSavings: couponStats.totalSavings,
          artistDiversity: artistList.length,
          purchaseFrequencyPerMonth: purchasePatterns.purchaseFrequencyPerMonth,
        },
        orders: userOrders.slice(0, 50), // 최근 50개로 확장
        coupons: userCoupons.slice(0, 10),
        reviews: userReviews.slice(0, 20), // 최근 20개로 확장
        ltv,
        // 새로운 분석 데이터
        topArtists,
        artistList,
        couponStats,
        purchasePatterns,
        insights,
        recommendedActions,
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
      userData.totalGmv += getOrderGmv(order) * CURRENCY.USD_TO_KRW
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

