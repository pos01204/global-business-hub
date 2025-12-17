// backend/src/routes/orderPatterns.ts
// 주문 패턴 분석 API (Phase 4)

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

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']
const DAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

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
        
        dayStats[dayOfWeek].gmv += safeNumber(order.total_gmv) * CURRENCY.USD_TO_KRW
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
        
        hourStats[hour].gmv += safeNumber(order.total_gmv) * CURRENCY.USD_TO_KRW
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
        
        countryDayStats[countryKey][dayOfWeek].gmv += safeNumber(order.total_gmv) * CURRENCY.USD_TO_KRW
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
        monthStats[monthKey].gmv += safeNumber(order.total_gmv) * CURRENCY.USD_TO_KRW
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
 * 패턴 요약
 * GET /api/order-patterns/summary?startDate=2024-01-01&endDate=2024-12-17
 */
router.get('/summary', async (req: Request, res: Response) => {
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
    
    // 집계
    const dayStats: Record<number, number> = {}
    const hourStats: Record<number, number> = {}
    for (let i = 0; i < 7; i++) dayStats[i] = 0
    for (let i = 0; i < 24; i++) hourStats[i] = 0
    
    const orderCodes = new Set<string>()
    let totalGmv = 0
    
    ordersData.forEach((order: any) => {
      try {
        const orderDate = new Date(order.order_created || order.ORDER_CREATED)
        if (orderDate < start || orderDate > end) return
        
        const orderCode = order.order_code || order.ORDER_CODE
        if (!orderCodes.has(orderCode)) {
          orderCodes.add(orderCode)
          dayStats[orderDate.getDay()]++
          hourStats[orderDate.getHours()]++
        }
        
        totalGmv += safeNumber(order.total_gmv) * CURRENCY.USD_TO_KRW
      } catch {}
    })
    
    // 피크 찾기
    const peakDay = Object.entries(dayStats).reduce((max, [day, count]) => 
      count > max.count ? { day: parseInt(day), count } : max, { day: 0, count: 0 })
    const peakHour = Object.entries(hourStats).reduce((max, [hour, count]) => 
      count > max.count ? { hour: parseInt(hour), count } : max, { hour: 0, count: 0 })
    
    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        summary: {
          totalOrders: orderCodes.size,
          totalGmv: Math.round(totalGmv),
          avgOrderValue: orderCodes.size > 0 ? Math.round(totalGmv / orderCodes.size) : 0,
          peakDay: {
            day: peakDay.day,
            dayName: DAY_NAMES[peakDay.day],
            orders: peakDay.count,
          },
          peakHour: {
            hour: peakHour.hour,
            label: `${peakHour.hour}시`,
            orders: peakHour.count,
          },
        }
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

export default router

