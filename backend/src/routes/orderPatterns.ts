// backend/src/routes/orderPatterns.ts
// 주문 패턴 분석 API (Phase 4) - 개선 버전

import { Router, Request, Response } from 'express'
import GoogleSheetsService from '../services/googleSheets'
import { sheetsConfig, SHEET_NAMES } from '../config/sheets'
import { CURRENCY } from '../config/constants'

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

function safeDivide(numerator: number, denominator: number, defaultValue: number = 0): number {
  if (denominator === 0) return defaultValue
  return numerator / denominator
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']
const DAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// GMV 필드 추출 (다양한 필드명 대응)
function getGmvValue(order: any): number {
  // Total GMV 필드 (대소문자 및 다양한 형식 대응)
  const gmvFields = ['Total GMV', 'total_gmv', 'TOTAL_GMV', 'Total_GMV', 'totalGmv']
  for (const field of gmvFields) {
    if (order[field] !== undefined && order[field] !== null && order[field] !== '') {
      return safeNumber(order[field])
    }
  }
  return 0
}

// ============================================================
// API 엔드포인트
// ============================================================

/**
 * 요일별 주문 패턴
 * GET /api/order-patterns/by-day?startDate=2024-01-01&endDate=2024-12-17
 */
router.get('/by-day', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate와 endDate가 필요합니다.'
      })
    }
    
    // 주문 데이터 로드
    let ordersData: any[] = []
    try {
      ordersData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.ORDER, false)
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: '주문 데이터를 찾을 수 없습니다.'
      })
    }
    
    const start = new Date(startDate as string)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate as string)
    end.setHours(23, 59, 59, 999)
    
    // 요일별 집계
    const dayStats: Record<number, { orders: number; gmv: number; count: number }> = {}
    for (let i = 0; i < 7; i++) {
      dayStats[i] = { orders: 0, gmv: 0, count: 0 }
    }
    
    const orderCodes = new Set<string>()
    
    ordersData.forEach((order: any) => {
      try {
        const orderDate = new Date(order.order_created || order.ORDER_CREATED)
        if (orderDate < start || orderDate > end) return
        
        const dayOfWeek = orderDate.getDay()
        const orderCode = order.order_code || order.ORDER_CODE
        
        if (!orderCodes.has(orderCode)) {
          orderCodes.add(orderCode)
          dayStats[dayOfWeek].orders++
        }
        
        dayStats[dayOfWeek].gmv += getGmvValue(order) * CURRENCY.USD_TO_KRW
        dayStats[dayOfWeek].count++
      } catch {}
    })
    
    // 결과 변환
    const result = Object.entries(dayStats).map(([day, stats]) => ({
      day: parseInt(day),
      dayName: DAY_NAMES[parseInt(day)],
      dayNameEn: DAY_NAMES_EN[parseInt(day)],
      orders: stats.orders,
      gmv: Math.round(stats.gmv),
      avgOrderValue: stats.orders > 0 ? Math.round(stats.gmv / stats.orders) : 0,
    }))
    
    // 피크 요일 찾기
    const peakDay = result.reduce((max, curr) => curr.orders > max.orders ? curr : max)
    
    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        byDay: result,
        peakDay: {
          day: peakDay.day,
          dayName: peakDay.dayName,
          orders: peakDay.orders,
        }
      }
    })
  } catch (error: any) {
    console.error('[OrderPatterns] By-day failed:', error)
    res.status(500).json({
      success: false,
      error: '요일별 패턴 분석 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

/**
 * 시간대별 주문 패턴
 * GET /api/order-patterns/by-hour?startDate=2024-01-01&endDate=2024-12-17
 */
router.get('/by-hour', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate와 endDate가 필요합니다.'
      })
    }
    
    // 주문 데이터 로드
    let ordersData: any[] = []
    try {
      ordersData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.ORDER, false)
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: '주문 데이터를 찾을 수 없습니다.'
      })
    }
    
    const start = new Date(startDate as string)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate as string)
    end.setHours(23, 59, 59, 999)
    
    // 시간대별 집계
    const hourStats: Record<number, { orders: number; gmv: number }> = {}
    for (let i = 0; i < 24; i++) {
      hourStats[i] = { orders: 0, gmv: 0 }
    }
    
    const orderCodes = new Set<string>()
    
    ordersData.forEach((order: any) => {
      try {
        const orderDate = new Date(order.order_created || order.ORDER_CREATED)
        if (orderDate < start || orderDate > end) return
        
        const hour = orderDate.getHours()
        const orderCode = order.order_code || order.ORDER_CODE
        
        if (!orderCodes.has(orderCode)) {
          orderCodes.add(orderCode)
          hourStats[hour].orders++
        }
        
        hourStats[hour].gmv += getGmvValue(order) * CURRENCY.USD_TO_KRW
      } catch {}
    })
    
    // 결과 변환
    const result = Object.entries(hourStats).map(([hour, stats]) => ({
      hour: parseInt(hour),
      label: `${hour}시`,
      orders: stats.orders,
      gmv: Math.round(stats.gmv),
    }))
    
    // 피크 시간대 찾기
    const peakHour = result.reduce((max, curr) => curr.orders > max.orders ? curr : max)
    
    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        byHour: result,
        peakHour: {
          hour: peakHour.hour,
          label: peakHour.label,
          orders: peakHour.orders,
        }
      }
    })
  } catch (error: any) {
    console.error('[OrderPatterns] By-hour failed:', error)
    res.status(500).json({
      success: false,
      error: '시간대별 패턴 분석 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

/**
 * 국가별 패턴 비교
 * GET /api/order-patterns/by-country?startDate=2024-01-01&endDate=2024-12-17
 */
router.get('/by-country', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate와 endDate가 필요합니다.'
      })
    }
    
    // 주문 데이터 로드
    let ordersData: any[] = []
    try {
      ordersData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.ORDER, false)
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: '주문 데이터를 찾을 수 없습니다.'
      })
    }
    
    const start = new Date(startDate as string)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate as string)
    end.setHours(23, 59, 59, 999)
    
    // 국가별 요일 집계
    const countryDayStats: Record<string, Record<number, { orders: number; gmv: number }>> = {
      JP: {},
      EN: {},
    }
    
    for (let i = 0; i < 7; i++) {
      countryDayStats.JP[i] = { orders: 0, gmv: 0 }
      countryDayStats.EN[i] = { orders: 0, gmv: 0 }
    }
    
    const orderCodes: Record<string, Set<string>> = { JP: new Set(), EN: new Set() }
    
    ordersData.forEach((order: any) => {
      try {
        const orderDate = new Date(order.order_created || order.ORDER_CREATED)
        if (orderDate < start || orderDate > end) return
        
        const dayOfWeek = orderDate.getDay()
        const orderCode = order.order_code || order.ORDER_CODE
        const country = (order.country || order.COUNTRY || '').toUpperCase()
        
        const countryKey = country === 'JP' ? 'JP' : 'EN'
        
        if (!orderCodes[countryKey].has(orderCode)) {
          orderCodes[countryKey].add(orderCode)
          countryDayStats[countryKey][dayOfWeek].orders++
        }
        
        countryDayStats[countryKey][dayOfWeek].gmv += getGmvValue(order) * CURRENCY.USD_TO_KRW
      } catch {}
    })
    
    // 결과 변환
    const result = {
      JP: Object.entries(countryDayStats.JP).map(([day, stats]) => ({
        day: parseInt(day),
        dayName: DAY_NAMES[parseInt(day)],
        orders: stats.orders,
        gmv: Math.round(stats.gmv),
      })),
      EN: Object.entries(countryDayStats.EN).map(([day, stats]) => ({
        day: parseInt(day),
        dayName: DAY_NAMES[parseInt(day)],
        orders: stats.orders,
        gmv: Math.round(stats.gmv),
      })),
    }
    
    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        byCountry: result,
      }
    })
  } catch (error: any) {
    console.error('[OrderPatterns] By-country failed:', error)
    res.status(500).json({
      success: false,
      error: '국가별 패턴 분석 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

/**
 * 월별 트렌드
 * GET /api/order-patterns/monthly-trend?startDate=2024-01-01&endDate=2024-12-17
 */
router.get('/monthly-trend', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate와 endDate가 필요합니다.'
      })
    }
    
    // 주문 데이터 로드
    let ordersData: any[] = []
    try {
      ordersData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.ORDER, false)
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: '주문 데이터를 찾을 수 없습니다.'
      })
    }
    
    const start = new Date(startDate as string)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate as string)
    end.setHours(23, 59, 59, 999)
    
    // 월별 집계
    const monthStats: Record<string, { orders: Set<string>; gmv: number; items: number }> = {}
    
    ordersData.forEach((order: any) => {
      try {
        const orderDate = new Date(order.order_created || order.ORDER_CREATED)
        if (orderDate < start || orderDate > end) return
        
        const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`
        const orderCode = order.order_code || order.ORDER_CODE
        
        if (!monthStats[monthKey]) {
          monthStats[monthKey] = { orders: new Set(), gmv: 0, items: 0 }
        }
        
        monthStats[monthKey].orders.add(orderCode)
        monthStats[monthKey].gmv += getGmvValue(order) * CURRENCY.USD_TO_KRW
        monthStats[monthKey].items += safeNumber(order.quantity, 1)
      } catch {}
    })
    
    // 결과 변환 및 정렬
    const result = Object.entries(monthStats)
      .map(([month, stats]) => ({
        month,
        orders: stats.orders.size,
        gmv: Math.round(stats.gmv),
        items: stats.items,
        avgOrderValue: stats.orders.size > 0 ? Math.round(stats.gmv / stats.orders.size) : 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
    
    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        trend: result,
      }
    })
  } catch (error: any) {
    console.error('[OrderPatterns] Monthly trend failed:', error)
    res.status(500).json({
      success: false,
      error: '월별 트렌드 분석 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

/**
 * 패턴 요약 (개선: 전기간 대비 변화율 추가)
 * GET /api/order-patterns/summary?startDate=2024-01-01&endDate=2024-12-17&includeComparison=true
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, includeComparison } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate와 endDate가 필요합니다.'
      })
    }
    
    // 주문 데이터 로드
    let ordersData: any[] = []
    try {
      ordersData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.ORDER, false)
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: '주문 데이터를 찾을 수 없습니다.'
      })
    }
    
    const start = new Date(startDate as string)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate as string)
    end.setHours(23, 59, 59, 999)
    
    // 현재 기간 집계
    const dayStats: Record<number, number> = {}
    for (let i = 0; i < 7; i++) dayStats[i] = 0
    
    const orderCodes = new Set<string>()
    const userIds = new Set<string>()
    const repeatUsers = new Set<string>()
    let totalGmv = 0
    
    // 고객별 주문 횟수 추적
    const userOrderCount = new Map<string, number>()
    
    ordersData.forEach((order: any) => {
      try {
        const orderDate = new Date(order.order_created || order.ORDER_CREATED)
        if (orderDate < start || orderDate > end) return
        
        const orderCode = order.order_code || order.ORDER_CODE
        const userId = String(order.user_id || order.USER_ID || '')
        
        if (!orderCodes.has(orderCode)) {
          orderCodes.add(orderCode)
          dayStats[orderDate.getDay()]++
          
          if (userId) {
            userIds.add(userId)
            userOrderCount.set(userId, (userOrderCount.get(userId) || 0) + 1)
          }
        }
        
        totalGmv += getGmvValue(order) * CURRENCY.USD_TO_KRW
      } catch {}
    })
    
    // 재구매 고객 계산
    userOrderCount.forEach((count, userId) => {
      if (count >= 2) repeatUsers.add(userId)
    })
    
    // 피크 요일 찾기
    const peakDay = Object.entries(dayStats).reduce((max, [day, count]) => 
      count > max.count ? { day: parseInt(day), count } : max, { day: 0, count: 0 })
    
    // 전기간 대비 계산 (옵션)
    let comparison = null
    if (includeComparison === 'true') {
      const periodDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      const prevEnd = new Date(start.getTime() - 1)
      prevEnd.setHours(23, 59, 59, 999)
      const prevStart = new Date(prevEnd.getTime() - periodDays * 24 * 60 * 60 * 1000)
      prevStart.setHours(0, 0, 0, 0)
      
      const prevOrderCodes = new Set<string>()
      const prevUserIds = new Set<string>()
      let prevGmv = 0
      
      ordersData.forEach((order: any) => {
        try {
          const orderDate = new Date(order.order_created || order.ORDER_CREATED)
          if (orderDate < prevStart || orderDate > prevEnd) return
          
          const orderCode = order.order_code || order.ORDER_CODE
          const userId = String(order.user_id || order.USER_ID || '')
          
          if (!prevOrderCodes.has(orderCode)) {
            prevOrderCodes.add(orderCode)
            if (userId) prevUserIds.add(userId)
          }
          
          prevGmv += getGmvValue(order) * CURRENCY.USD_TO_KRW
        } catch {}
      })
      
      const prevAvgOrderValue = prevOrderCodes.size > 0 ? prevGmv / prevOrderCodes.size : 0
      const currentAvgOrderValue = orderCodes.size > 0 ? totalGmv / orderCodes.size : 0
      
      comparison = {
        previousPeriod: {
          startDate: prevStart.toISOString().split('T')[0],
          endDate: prevEnd.toISOString().split('T')[0],
          totalOrders: prevOrderCodes.size,
          totalGmv: Math.round(prevGmv),
          avgOrderValue: Math.round(prevAvgOrderValue),
          uniqueCustomers: prevUserIds.size,
        },
        changes: {
          orders: safeDivide(orderCodes.size - prevOrderCodes.size, prevOrderCodes.size) * 100,
          gmv: safeDivide(totalGmv - prevGmv, prevGmv) * 100,
          avgOrderValue: safeDivide(currentAvgOrderValue - prevAvgOrderValue, prevAvgOrderValue) * 100,
          customers: safeDivide(userIds.size - prevUserIds.size, prevUserIds.size) * 100,
        }
      }
    }
    
    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        summary: {
          totalOrders: orderCodes.size,
          totalGmv: Math.round(totalGmv),
          avgOrderValue: orderCodes.size > 0 ? Math.round(totalGmv / orderCodes.size) : 0,
          uniqueCustomers: userIds.size,
          repeatCustomers: repeatUsers.size,
          repeatRate: safeDivide(repeatUsers.size, userIds.size) * 100,
          peakDay: {
            day: peakDay.day,
            dayName: DAY_NAMES[peakDay.day],
            orders: peakDay.count,
            percentage: safeDivide(peakDay.count, orderCodes.size) * 100,
          },
        },
        comparison,
      }
    })
  } catch (error: any) {
    console.error('[OrderPatterns] Summary failed:', error)
    res.status(500).json({
      success: false,
      error: '패턴 요약 조회 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

/**
 * 히트맵 데이터 (요일 x 월별)
 * GET /api/order-patterns/heatmap?startDate=2024-01-01&endDate=2024-12-17&metric=orders
 */
router.get('/heatmap', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, metric = 'orders' } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate와 endDate가 필요합니다.'
      })
    }
    
    let ordersData: any[] = []
    try {
      ordersData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.ORDER, false)
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: '주문 데이터를 찾을 수 없습니다.'
      })
    }
    
    const start = new Date(startDate as string)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate as string)
    end.setHours(23, 59, 59, 999)
    
    // 월-요일 매트릭스 초기화
    const heatmapData: Record<string, Record<number, { orders: Set<string>; gmv: number }>> = {}
    
    ordersData.forEach((order: any) => {
      try {
        const orderDate = new Date(order.order_created || order.ORDER_CREATED)
        if (orderDate < start || orderDate > end) return
        
        const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`
        const dayOfWeek = orderDate.getDay()
        const orderCode = order.order_code || order.ORDER_CODE
        
        if (!heatmapData[monthKey]) {
          heatmapData[monthKey] = {}
          for (let i = 0; i < 7; i++) {
            heatmapData[monthKey][i] = { orders: new Set(), gmv: 0 }
          }
        }
        
        heatmapData[monthKey][dayOfWeek].orders.add(orderCode)
        heatmapData[monthKey][dayOfWeek].gmv += getGmvValue(order) * CURRENCY.USD_TO_KRW
      } catch {}
    })
    
    // 결과 변환
    const months = Object.keys(heatmapData).sort()
    const values: number[][] = []
    let maxValue = 0
    let minValue = Infinity
    
    months.forEach(month => {
      const row: number[] = []
      for (let day = 0; day < 7; day++) {
        const cellData = heatmapData[month][day]
        const value = metric === 'gmv' 
          ? Math.round(cellData.gmv)
          : metric === 'aov' && cellData.orders.size > 0
            ? Math.round(cellData.gmv / cellData.orders.size)
            : cellData.orders.size
        
        row.push(value)
        if (value > maxValue) maxValue = value
        if (value < minValue && value > 0) minValue = value
      }
      values.push(row)
    })
    
    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        metric,
        rows: months,
        cols: DAY_NAMES,
        values,
        max: maxValue,
        min: minValue === Infinity ? 0 : minValue,
      }
    })
  } catch (error: any) {
    console.error('[OrderPatterns] Heatmap failed:', error)
    res.status(500).json({
      success: false,
      error: '히트맵 데이터 조회 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

/**
 * 자동 인사이트 생성
 * GET /api/order-patterns/insights?startDate=2024-01-01&endDate=2024-12-17
 */
router.get('/insights', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate와 endDate가 필요합니다.'
      })
    }
    
    let ordersData: any[] = []
    try {
      ordersData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.ORDER, false)
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: '주문 데이터를 찾을 수 없습니다.'
      })
    }
    
    const start = new Date(startDate as string)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate as string)
    end.setHours(23, 59, 59, 999)
    
    // 데이터 집계
    const dayStats: Record<number, { orders: number; gmv: number }> = {}
    for (let i = 0; i < 7; i++) dayStats[i] = { orders: 0, gmv: 0 }
    
    const monthStats: Record<string, { orders: number; gmv: number }> = {}
    const countryStats: Record<string, { orders: number; gmv: number }> = { JP: { orders: 0, gmv: 0 }, EN: { orders: 0, gmv: 0 } }
    
    const orderCodes = new Set<string>()
    const userOrderCount = new Map<string, number>()
    let totalGmv = 0
    
    ordersData.forEach((order: any) => {
      try {
        const orderDate = new Date(order.order_created || order.ORDER_CREATED)
        if (orderDate < start || orderDate > end) return
        
        const orderCode = order.order_code || order.ORDER_CODE
        const userId = String(order.user_id || order.USER_ID || '')
        const country = (order.country || order.COUNTRY || '').toUpperCase()
        const countryKey = country === 'JP' ? 'JP' : 'EN'
        const gmv = getGmvValue(order) * CURRENCY.USD_TO_KRW
        
        if (!orderCodes.has(orderCode)) {
          orderCodes.add(orderCode)
          dayStats[orderDate.getDay()].orders++
          
          const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`
          if (!monthStats[monthKey]) monthStats[monthKey] = { orders: 0, gmv: 0 }
          monthStats[monthKey].orders++
          
          countryStats[countryKey].orders++
          
          if (userId) {
            userOrderCount.set(userId, (userOrderCount.get(userId) || 0) + 1)
          }
        }
        
        dayStats[orderDate.getDay()].gmv += gmv
        
        const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`
        if (!monthStats[monthKey]) monthStats[monthKey] = { orders: 0, gmv: 0 }
        monthStats[monthKey].gmv += gmv
        
        countryStats[countryKey].gmv += gmv
        totalGmv += gmv
      } catch {}
    })
    
    // 인사이트 생성
    const insights: any[] = []
    
    // 1. 피크 요일 인사이트
    const peakDay = Object.entries(dayStats).reduce((max, [day, stats]) => 
      stats.orders > max.orders ? { day: parseInt(day), ...stats } : max, 
      { day: 0, orders: 0, gmv: 0 })
    
    const avgDayOrders = orderCodes.size / 7
    const peakVsAvg = safeDivide(peakDay.orders - avgDayOrders, avgDayOrders) * 100
    
    insights.push({
      type: 'peak_pattern',
      priority: 'high',
      category: '마케팅',
      title: `${DAY_NAMES[peakDay.day]}요일 주문 집중`,
      description: `전체 주문의 ${(safeDivide(peakDay.orders, orderCodes.size) * 100).toFixed(1)}%가 ${DAY_NAMES[peakDay.day]}요일에 발생합니다.`,
      evidence: [
        `${DAY_NAMES[peakDay.day]}요일 주문: ${peakDay.orders}건`,
        `평일 평균 대비 ${peakVsAvg.toFixed(1)}% 높음`,
        `${DAY_NAMES[peakDay.day]}요일 GMV: ₩${Math.round(peakDay.gmv).toLocaleString()}`,
      ],
      action: `${DAY_NAMES[peakDay.day]}요일에 프로모션 및 마케팅 캠페인 집중 권장`,
      impact: { metric: '전환율', expected: '+5~10% 향상 예상' },
    })
    
    // 2. 재구매율 인사이트
    const repeatUsers = [...userOrderCount.values()].filter(c => c >= 2).length
    const totalUsers = userOrderCount.size
    const repeatRate = safeDivide(repeatUsers, totalUsers) * 100
    
    if (repeatRate < 30) {
      insights.push({
        type: 'warning',
        priority: 'critical',
        category: '고객',
        title: '재구매율 개선 필요',
        description: `현재 재구매율이 ${repeatRate.toFixed(1)}%로 낮습니다. 고객 유지 전략이 필요합니다.`,
        evidence: [
          `총 고객 수: ${totalUsers}명`,
          `재구매 고객: ${repeatUsers}명`,
          `재구매율: ${repeatRate.toFixed(1)}%`,
        ],
        action: '이탈 위험 고객 대상 리텐션 쿠폰 발행 권장',
        impact: { metric: 'LTV', expected: '재구매율 10% 상승 시 LTV 15% 증가 예상' },
      })
    } else if (repeatRate >= 50) {
      insights.push({
        type: 'success',
        priority: 'medium',
        category: '고객',
        title: '높은 재구매율 유지',
        description: `재구매율이 ${repeatRate.toFixed(1)}%로 우수합니다.`,
        evidence: [
          `총 고객 수: ${totalUsers}명`,
          `재구매 고객: ${repeatUsers}명`,
        ],
        action: '현재 고객 유지 전략 지속 및 VIP 프로그램 강화 권장',
        impact: { metric: 'LTV', expected: '안정적인 매출 기반 유지' },
      })
    }
    
    // 3. 국가별 비교 인사이트
    const jpShare = safeDivide(countryStats.JP.orders, orderCodes.size) * 100
    const enShare = safeDivide(countryStats.EN.orders, orderCodes.size) * 100
    
    if (Math.abs(jpShare - enShare) > 30) {
      const dominant = jpShare > enShare ? 'JP' : 'EN'
      const weak = jpShare > enShare ? 'EN' : 'JP'
      const dominantLabel = dominant === 'JP' ? '일본' : '영어권'
      const weakLabel = weak === 'JP' ? '일본' : '영어권'
      
      insights.push({
        type: 'comparison',
        priority: 'medium',
        category: '시장',
        title: `${dominantLabel} 시장 집중`,
        description: `${dominantLabel} 시장이 전체 주문의 ${Math.max(jpShare, enShare).toFixed(1)}%를 차지합니다.`,
        evidence: [
          `${dominantLabel} 주문: ${countryStats[dominant].orders}건 (${Math.max(jpShare, enShare).toFixed(1)}%)`,
          `${weakLabel} 주문: ${countryStats[weak].orders}건 (${Math.min(jpShare, enShare).toFixed(1)}%)`,
        ],
        action: `${weakLabel} 시장 특화 프로모션 및 마케팅 강화 검토`,
        impact: { metric: '시장 다변화', expected: `${weakLabel} 비중 10% 상승 시 리스크 분산 효과` },
      })
    }
    
    // 4. 월별 트렌드 인사이트
    const sortedMonths = Object.entries(monthStats).sort((a, b) => a[0].localeCompare(b[0]))
    if (sortedMonths.length >= 2) {
      const lastMonth = sortedMonths[sortedMonths.length - 1]
      const prevMonth = sortedMonths[sortedMonths.length - 2]
      const monthGrowth = safeDivide(lastMonth[1].gmv - prevMonth[1].gmv, prevMonth[1].gmv) * 100
      
      if (Math.abs(monthGrowth) > 10) {
        insights.push({
          type: monthGrowth > 0 ? 'trend_up' : 'trend_down',
          priority: monthGrowth > 0 ? 'medium' : 'high',
          category: '성과',
          title: `월간 GMV ${monthGrowth > 0 ? '성장' : '하락'}`,
          description: `${lastMonth[0]} GMV가 전월 대비 ${Math.abs(monthGrowth).toFixed(1)}% ${monthGrowth > 0 ? '상승' : '하락'}했습니다.`,
          evidence: [
            `${lastMonth[0]} GMV: ₩${Math.round(lastMonth[1].gmv).toLocaleString()}`,
            `${prevMonth[0]} GMV: ₩${Math.round(prevMonth[1].gmv).toLocaleString()}`,
          ],
          action: monthGrowth > 0 
            ? '성장 모멘텀 유지를 위한 캠페인 확대 검토'
            : '매출 하락 원인 분석 및 긴급 프로모션 검토',
          impact: { metric: 'GMV', expected: monthGrowth > 0 ? '추세 지속 시 연간 목표 초과 달성 가능' : '추세 지속 시 연간 목표 미달 위험' },
        })
      }
    }
    
    // 5. 평균 주문액 인사이트
    const avgOrderValue = safeDivide(totalGmv, orderCodes.size)
    if (avgOrderValue > 0) {
      insights.push({
        type: 'info',
        priority: 'low',
        category: '매출',
        title: '평균 주문액 현황',
        description: `평균 주문액은 ₩${Math.round(avgOrderValue).toLocaleString()}입니다.`,
        evidence: [
          `총 GMV: ₩${Math.round(totalGmv).toLocaleString()}`,
          `총 주문: ${orderCodes.size}건`,
        ],
        action: '번들 상품 및 교차 판매로 AOV 상승 기회 모색',
        impact: { metric: 'AOV', expected: 'AOV 10% 상승 시 동일 트래픽으로 매출 10% 증가' },
      })
    }
    
    // 우선순위 정렬
    const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
    insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    
    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        insights,
        generatedAt: new Date().toISOString(),
      }
    })
  } catch (error: any) {
    console.error('[OrderPatterns] Insights failed:', error)
    res.status(500).json({
      success: false,
      error: '인사이트 생성 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

/**
 * 국가별 상세 비교
 * GET /api/order-patterns/country-detail?startDate=2024-01-01&endDate=2024-12-17
 */
router.get('/country-detail', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate와 endDate가 필요합니다.'
      })
    }
    
    let ordersData: any[] = []
    try {
      ordersData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.ORDER, false)
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: '주문 데이터를 찾을 수 없습니다.'
      })
    }
    
    const start = new Date(startDate as string)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate as string)
    end.setHours(23, 59, 59, 999)
    
    // 국가별 상세 집계
    const countryDetail: Record<string, {
      orders: Set<string>
      gmv: number
      customers: Set<string>
      dayPattern: Record<number, number>
      monthPattern: Record<string, number>
    }> = {
      JP: { orders: new Set(), gmv: 0, customers: new Set(), dayPattern: {}, monthPattern: {} },
      EN: { orders: new Set(), gmv: 0, customers: new Set(), dayPattern: {}, monthPattern: {} },
    }
    
    for (let i = 0; i < 7; i++) {
      countryDetail.JP.dayPattern[i] = 0
      countryDetail.EN.dayPattern[i] = 0
    }
    
    ordersData.forEach((order: any) => {
      try {
        const orderDate = new Date(order.order_created || order.ORDER_CREATED)
        if (orderDate < start || orderDate > end) return
        
        const orderCode = order.order_code || order.ORDER_CODE
        const userId = String(order.user_id || order.USER_ID || '')
        const country = (order.country || order.COUNTRY || '').toUpperCase()
        const countryKey = country === 'JP' ? 'JP' : 'EN'
        const gmv = getGmvValue(order) * CURRENCY.USD_TO_KRW
        const dayOfWeek = orderDate.getDay()
        const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`
        
        if (!countryDetail[countryKey].orders.has(orderCode)) {
          countryDetail[countryKey].orders.add(orderCode)
          countryDetail[countryKey].dayPattern[dayOfWeek]++
          
          if (!countryDetail[countryKey].monthPattern[monthKey]) {
            countryDetail[countryKey].monthPattern[monthKey] = 0
          }
          countryDetail[countryKey].monthPattern[monthKey]++
          
          if (userId) countryDetail[countryKey].customers.add(userId)
        }
        
        countryDetail[countryKey].gmv += gmv
      } catch {}
    })
    
    // 결과 변환
    const totalOrders = countryDetail.JP.orders.size + countryDetail.EN.orders.size
    const totalGmv = countryDetail.JP.gmv + countryDetail.EN.gmv
    
    const result = {
      JP: {
        label: '일본 (JP)',
        flag: '🇯🇵',
        orders: countryDetail.JP.orders.size,
        orderShare: safeDivide(countryDetail.JP.orders.size, totalOrders) * 100,
        gmv: Math.round(countryDetail.JP.gmv),
        gmvShare: safeDivide(countryDetail.JP.gmv, totalGmv) * 100,
        avgOrderValue: Math.round(safeDivide(countryDetail.JP.gmv, countryDetail.JP.orders.size)),
        uniqueCustomers: countryDetail.JP.customers.size,
        dayPattern: Object.entries(countryDetail.JP.dayPattern).map(([day, orders]) => ({
          day: parseInt(day),
          dayName: DAY_NAMES[parseInt(day)],
          orders,
        })),
        monthTrend: Object.entries(countryDetail.JP.monthPattern)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([month, orders]) => ({ month, orders })),
      },
      EN: {
        label: '영어권 (EN)',
        flag: '🌍',
        orders: countryDetail.EN.orders.size,
        orderShare: safeDivide(countryDetail.EN.orders.size, totalOrders) * 100,
        gmv: Math.round(countryDetail.EN.gmv),
        gmvShare: safeDivide(countryDetail.EN.gmv, totalGmv) * 100,
        avgOrderValue: Math.round(safeDivide(countryDetail.EN.gmv, countryDetail.EN.orders.size)),
        uniqueCustomers: countryDetail.EN.customers.size,
        dayPattern: Object.entries(countryDetail.EN.dayPattern).map(([day, orders]) => ({
          day: parseInt(day),
          dayName: DAY_NAMES[parseInt(day)],
          orders,
        })),
        monthTrend: Object.entries(countryDetail.EN.monthPattern)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([month, orders]) => ({ month, orders })),
      },
    }
    
    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        countryDetail: result,
        totals: {
          orders: totalOrders,
          gmv: Math.round(totalGmv),
        }
      }
    })
  } catch (error: any) {
    console.error('[OrderPatterns] Country detail failed:', error)
    res.status(500).json({
      success: false,
      error: '국가별 상세 분석 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

export default router

