// backend/src/routes/couponAnalytics.ts
// 쿠폰 분석 API (Phase 3: 2차 가공 데이터)

import { Router, Request, Response } from 'express'
import { db } from '../db'
import GoogleSheetsService from '../services/googleSheets'
import { sheetsConfig, SHEET_NAMES } from '../config/sheets'
import { CURRENCY } from '../config/constants'
import { COUPON_THRESHOLDS } from '../config/businessRules'

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

// ============================================================
// API 엔드포인트
// ============================================================

/**
 * 쿠폰 분석 요약
 * GET /api/coupon-analytics/summary?startDate=2024-01-01&endDate=2024-12-17
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, compareWithPrevious } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate와 endDate가 필요합니다.'
      })
    }
    
    // 1. 쿠폰 데이터 로드
    let couponData: any[] = []
    try {
      couponData = await sheetsService.getSheetDataAsJson('coupon', false)
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: '쿠폰 데이터를 찾을 수 없습니다.'
      })
    }
    
    // 2. 기간 필터링
    const start = new Date(startDate as string)
    const end = new Date(endDate as string)
    end.setHours(23, 59, 59, 999)
    
    const filteredCoupons = couponData.filter((coupon: any) => {
      try {
        const fromDate = coupon.from_datetime ? new Date(coupon.from_datetime) : null
        const toDate = coupon.to_datetime ? new Date(coupon.to_datetime) : null
        
        if (!fromDate || !toDate) return false
        
        // 기간 내 활성화된 쿠폰
        return (fromDate <= end && toDate >= start)
      } catch {
        return false
      }
    })
    
    // 3. 집계 계산
    let totalIssued = 0
    let totalUsed = 0
    let totalDiscountUsd = 0
    let totalGmvUsd = 0
    
    filteredCoupons.forEach((coupon: any) => {
      totalIssued += safeNumber(coupon.issue_count)
      totalUsed += safeNumber(coupon.used_count)
      totalDiscountUsd += safeNumber(coupon.discount_amount)
      totalGmvUsd += safeNumber(coupon.total_gmv)
    })
    
    const conversionRate = safeDivide(totalUsed, totalIssued)
    const roi = safeDivide(totalGmvUsd, totalDiscountUsd)
    
    let response: any = {
      success: true,
      data: {
        period: { startDate, endDate },
        summary: {
          totalCoupons: filteredCoupons.length,
          totalIssued,
          totalUsed,
          conversionRate: (conversionRate * 100).toFixed(2),
          totalDiscountUsd,
          totalDiscountKrw: totalDiscountUsd * CURRENCY.USD_TO_KRW,
          totalGmvUsd,
          totalGmvKrw: totalGmvUsd * CURRENCY.USD_TO_KRW,
          roi: roi.toFixed(2)
        }
      }
    }
    
    // 4. 이전 기간 비교 (선택)
    if (compareWithPrevious === 'true') {
      const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      const prevEnd = new Date(start.getTime() - 1)
      const prevStart = new Date(prevEnd.getTime() - ((days - 1) * 24 * 60 * 60 * 1000))
      
      const prevCoupons = couponData.filter((coupon: any) => {
        try {
          const fromDate = coupon.from_datetime ? new Date(coupon.from_datetime) : null
          const toDate = coupon.to_datetime ? new Date(coupon.to_datetime) : null
          if (!fromDate || !toDate) return false
          return (fromDate <= prevEnd && toDate >= prevStart)
        } catch {
          return false
        }
      })
      
      let prevIssued = 0, prevUsed = 0, prevDiscount = 0, prevGmv = 0
      prevCoupons.forEach((coupon: any) => {
        prevIssued += safeNumber(coupon.issue_count)
        prevUsed += safeNumber(coupon.used_count)
        prevDiscount += safeNumber(coupon.discount_amount)
        prevGmv += safeNumber(coupon.total_gmv)
      })
      
      const prevConversion = safeDivide(prevUsed, prevIssued)
      const prevRoi = safeDivide(prevGmv, prevDiscount)
      
      const calcChange = (current: number, previous: number): number => {
        if (previous > 0) return ((current - previous) / previous) * 100
        if (current > 0) return 100
        return 0
      }
      
      response.data.comparison = {
        previousPeriod: {
          startDate: prevStart.toISOString().split('T')[0],
          endDate: prevEnd.toISOString().split('T')[0]
        },
        changes: {
          conversionRate: (conversionRate - prevConversion) * 100,
          roi: roi - prevRoi,
          gmv: calcChange(totalGmvUsd, prevGmv),
          issued: calcChange(totalIssued, prevIssued)
        }
      }
    }
    
    res.json(response)
  } catch (error: any) {
    console.error('[CouponAnalytics] Summary failed:', error)
    res.status(500).json({
      success: false,
      error: '쿠폰 분석 요약 조회 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

/**
 * 쿠폰 트렌드 (월별)
 * GET /api/coupon-analytics/trend?startDate=2024-01-01&endDate=2024-12-17
 */
router.get('/trend', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, aggregation = 'monthly' } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate와 endDate가 필요합니다.'
      })
    }
    
    // DB에서 일별 쿠폰 지표 조회
    const result = await db.query(`
      SELECT 
        ${aggregation === 'monthly' ? "TO_CHAR(date, 'YYYY-MM') as period" : 'date as period'},
        SUM(issued_count) as total_issued,
        SUM(used_count) as total_used,
        SUM(total_discount_usd) as total_discount,
        SUM(total_gmv_usd) as total_gmv,
        AVG(conversion_rate) as avg_conversion,
        AVG(roi) as avg_roi
      FROM daily_coupon_metrics
      WHERE date BETWEEN $1 AND $2
      GROUP BY ${aggregation === 'monthly' ? "TO_CHAR(date, 'YYYY-MM')" : 'date'}
      ORDER BY period
    `, [startDate, endDate])
    
    const trendData = result.rows.map((row: any) => ({
      period: row.period,
      issued: parseInt(row.total_issued) || 0,
      used: parseInt(row.total_used) || 0,
      conversionRate: (parseFloat(row.avg_conversion) * 100).toFixed(2),
      discount: parseFloat(row.total_discount) || 0,
      gmv: parseFloat(row.total_gmv) || 0,
      roi: parseFloat(row.avg_roi)?.toFixed(2) || 0
    }))
    
    res.json({
      success: true,
      data: {
        aggregation,
        trend: trendData
      }
    })
  } catch (error: any) {
    console.error('[CouponAnalytics] Trend failed:', error)
    res.status(500).json({
      success: false,
      error: '쿠폰 트렌드 조회 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

/**
 * 쿠폰 유형별 분석
 * GET /api/coupon-analytics/by-type?startDate=2024-01-01&endDate=2024-12-17
 */
router.get('/by-type', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate와 endDate가 필요합니다.'
      })
    }
    
    // 쿠폰 데이터 로드
    let couponData: any[] = []
    try {
      couponData = await sheetsService.getSheetDataAsJson('coupon', false)
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: '쿠폰 데이터를 찾을 수 없습니다.'
      })
    }
    
    const start = new Date(startDate as string)
    const end = new Date(endDate as string)
    end.setHours(23, 59, 59, 999)
    
    // 유형별 집계
    const byType: Record<string, any> = {
      RATE: { count: 0, issued: 0, used: 0, discount: 0, gmv: 0 },
      FIXED: { count: 0, issued: 0, used: 0, discount: 0, gmv: 0 }
    }
    
    couponData.forEach((coupon: any) => {
      try {
        const fromDate = coupon.from_datetime ? new Date(coupon.from_datetime) : null
        const toDate = coupon.to_datetime ? new Date(coupon.to_datetime) : null
        if (!fromDate || !toDate) return
        if (!(fromDate <= end && toDate >= start)) return
        
        const type = (coupon.discount_type || '').toUpperCase()
        if (type === 'RATE' || type === 'FIXED') {
          byType[type].count++
          byType[type].issued += safeNumber(coupon.issue_count)
          byType[type].used += safeNumber(coupon.used_count)
          byType[type].discount += safeNumber(coupon.discount_amount)
          byType[type].gmv += safeNumber(coupon.total_gmv)
        }
      } catch {}
    })
    
    // 전환율 및 ROI 계산
    Object.keys(byType).forEach(type => {
      const data = byType[type]
      data.conversionRate = safeDivide(data.used, data.issued) * 100
      data.roi = safeDivide(data.gmv, data.discount)
    })
    
    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        byType
      }
    })
  } catch (error: any) {
    console.error('[CouponAnalytics] By-type failed:', error)
    res.status(500).json({
      success: false,
      error: '유형별 쿠폰 분석 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

/**
 * 쿠폰 국가별 분석
 * GET /api/coupon-analytics/by-country?startDate=2024-01-01&endDate=2024-12-17
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
    
    // 쿠폰 데이터 로드
    let couponData: any[] = []
    try {
      couponData = await sheetsService.getSheetDataAsJson('coupon', false)
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: '쿠폰 데이터를 찾을 수 없습니다.'
      })
    }
    
    const start = new Date(startDate as string)
    const end = new Date(endDate as string)
    end.setHours(23, 59, 59, 999)
    
    // 국가별 집계
    const byCountry: Record<string, any> = {
      JP: { count: 0, issued: 0, used: 0, discount: 0, gmv: 0 },
      EN: { count: 0, issued: 0, used: 0, discount: 0, gmv: 0 }
    }
    
    couponData.forEach((coupon: any) => {
      try {
        const fromDate = coupon.from_datetime ? new Date(coupon.from_datetime) : null
        const toDate = coupon.to_datetime ? new Date(coupon.to_datetime) : null
        if (!fromDate || !toDate) return
        if (!(fromDate <= end && toDate >= start)) return
        
        const country = (coupon.coupon_country || '').toUpperCase()
        if (country === 'JP') {
          byCountry.JP.count++
          byCountry.JP.issued += safeNumber(coupon.issue_count)
          byCountry.JP.used += safeNumber(coupon.used_count)
          byCountry.JP.discount += safeNumber(coupon.discount_amount)
          byCountry.JP.gmv += safeNumber(coupon.total_gmv)
        } else {
          byCountry.EN.count++
          byCountry.EN.issued += safeNumber(coupon.issue_count)
          byCountry.EN.used += safeNumber(coupon.used_count)
          byCountry.EN.discount += safeNumber(coupon.discount_amount)
          byCountry.EN.gmv += safeNumber(coupon.total_gmv)
        }
      } catch {}
    })
    
    // 전환율 및 ROI 계산
    Object.keys(byCountry).forEach(country => {
      const data = byCountry[country]
      data.conversionRate = safeDivide(data.used, data.issued) * 100
      data.roi = safeDivide(data.gmv, data.discount)
    })
    
    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        byCountry
      }
    })
  } catch (error: any) {
    console.error('[CouponAnalytics] By-country failed:', error)
    res.status(500).json({
      success: false,
      error: '국가별 쿠폰 분석 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

/**
 * TOP 성과 쿠폰
 * GET /api/coupon-analytics/top-performers?startDate=2024-01-01&endDate=2024-12-17&limit=10
 */
router.get('/top-performers', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate와 endDate가 필요합니다.'
      })
    }
    
    // 쿠폰 데이터 로드
    let couponData: any[] = []
    try {
      couponData = await sheetsService.getSheetDataAsJson('coupon', false)
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: '쿠폰 데이터를 찾을 수 없습니다.'
      })
    }
    
    const start = new Date(startDate as string)
    const end = new Date(endDate as string)
    end.setHours(23, 59, 59, 999)
    
    // 기간 필터링 및 지표 계산
    const couponsWithMetrics = couponData
      .filter((coupon: any) => {
        try {
          const fromDate = coupon.from_datetime ? new Date(coupon.from_datetime) : null
          const toDate = coupon.to_datetime ? new Date(coupon.to_datetime) : null
          if (!fromDate || !toDate) return false
          return (fromDate <= end && toDate >= start)
        } catch {
          return false
        }
      })
      .map((coupon: any) => {
        const issued = safeNumber(coupon.issue_count)
        const used = safeNumber(coupon.used_count)
        const discount = safeNumber(coupon.discount_amount)
        const gmv = safeNumber(coupon.total_gmv)
        
        return {
          couponId: coupon.coupon_id,
          couponName: coupon.coupon_name || coupon.title || `쿠폰 ${coupon.coupon_id}`,
          discountType: coupon.discount_type,
          couponType: coupon.coupon_type,
          country: coupon.coupon_country,
          issued,
          used,
          conversionRate: safeDivide(used, issued) * 100,
          discount,
          gmv,
          roi: safeDivide(gmv, discount)
        }
      })
      .filter((c: any) => c.issued > 0) // 발급된 쿠폰만
    
    const limitNum = parseInt(limit as string) || 10
    
    // TOP by Conversion Rate
    const byConversion = [...couponsWithMetrics]
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, limitNum)
    
    // TOP by ROI
    const byRoi = [...couponsWithMetrics]
      .sort((a, b) => b.roi - a.roi)
      .slice(0, limitNum)
    
    // TOP by GMV
    const byGmv = [...couponsWithMetrics]
      .sort((a, b) => b.gmv - a.gmv)
      .slice(0, limitNum)
    
    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        topPerformers: {
          byConversion,
          byRoi,
          byGmv
        }
      }
    })
  } catch (error: any) {
    console.error('[CouponAnalytics] Top-performers failed:', error)
    res.status(500).json({
      success: false,
      error: 'TOP 쿠폰 분석 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

/**
 * 실패 쿠폰 분석
 * GET /api/coupon-analytics/failures?startDate=2024-01-01&endDate=2024-12-17
 */
router.get('/failures', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate와 endDate가 필요합니다.'
      })
    }
    
    // 쿠폰 데이터 로드
    let couponData: any[] = []
    try {
      couponData = await sheetsService.getSheetDataAsJson('coupon', false)
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: '쿠폰 데이터를 찾을 수 없습니다.'
      })
    }
    
    const start = new Date(startDate as string)
    const end = new Date(endDate as string)
    end.setHours(23, 59, 59, 999)
    
    const failedCoupons: any = {
      zeroUsage: [],
      lowConversion: []
    }
    
    couponData.forEach((coupon: any) => {
      try {
        const fromDate = coupon.from_datetime ? new Date(coupon.from_datetime) : null
        const toDate = coupon.to_datetime ? new Date(coupon.to_datetime) : null
        if (!fromDate || !toDate) return
        if (!(fromDate <= end && toDate >= start)) return
        
        const issued = safeNumber(coupon.issue_count)
        const used = safeNumber(coupon.used_count)
        
        if (issued === 0) return // 발급되지 않은 쿠폰 제외
        
        const conversionRate = safeDivide(used, issued) * 100
        
        const couponInfo = {
          couponId: coupon.coupon_id,
          couponName: coupon.coupon_name || coupon.title || `쿠폰 ${coupon.coupon_id}`,
          discountType: coupon.discount_type,
          issued,
          used,
          conversionRate: conversionRate.toFixed(2)
        }
        
        if (used === 0) {
          // 사용률 0%
          failedCoupons.zeroUsage.push({
            ...couponInfo,
            possibleReason: analyzePossibleReason(coupon)
          })
        } else if (conversionRate < COUPON_THRESHOLDS.LOW_CONVERSION_RATE) {
          // 낮은 전환율 (기본 5% 미만)
          failedCoupons.lowConversion.push(couponInfo)
        }
      } catch {}
    })
    
    // 정렬 (발급 수 기준 내림차순)
    failedCoupons.zeroUsage.sort((a: any, b: any) => b.issued - a.issued)
    failedCoupons.lowConversion.sort((a: any, b: any) => parseFloat(a.conversionRate) - parseFloat(b.conversionRate))
    
    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        failures: failedCoupons,
        summary: {
          zeroUsageCount: failedCoupons.zeroUsage.length,
          lowConversionCount: failedCoupons.lowConversion.length,
          threshold: COUPON_THRESHOLDS.LOW_CONVERSION_RATE
        }
      }
    })
  } catch (error: any) {
    console.error('[CouponAnalytics] Failures failed:', error)
    res.status(500).json({
      success: false,
      error: '실패 쿠폰 분석 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

/**
 * 자동 인사이트 생성
 * GET /api/coupon-analytics/insights?startDate=2024-01-01&endDate=2024-12-17
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
    
    // 쿠폰 데이터 로드
    let couponData: any[] = []
    try {
      couponData = await sheetsService.getSheetDataAsJson('coupon', false)
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: '쿠폰 데이터를 찾을 수 없습니다.'
      })
    }
    
    const start = new Date(startDate as string)
    const end = new Date(endDate as string)
    end.setHours(23, 59, 59, 999)
    
    const insights: any[] = []
    
    // 기간 내 쿠폰 필터링
    const filteredCoupons = couponData.filter((coupon: any) => {
      try {
        const fromDate = coupon.from_datetime ? new Date(coupon.from_datetime) : null
        const toDate = coupon.to_datetime ? new Date(coupon.to_datetime) : null
        if (!fromDate || !toDate) return false
        return (fromDate <= end && toDate >= start)
      } catch {
        return false
      }
    })
    
    // 전체 지표 계산
    let totalIssued = 0, totalUsed = 0, totalDiscount = 0, totalGmv = 0
    let zeroUsageCount = 0
    let highRoiCoupons: any[] = []
    
    filteredCoupons.forEach((coupon: any) => {
      const issued = safeNumber(coupon.issue_count)
      const used = safeNumber(coupon.used_count)
      const discount = safeNumber(coupon.discount_amount)
      const gmv = safeNumber(coupon.total_gmv)
      
      totalIssued += issued
      totalUsed += used
      totalDiscount += discount
      totalGmv += gmv
      
      if (issued > 0 && used === 0) zeroUsageCount++
      
      const roi = safeDivide(gmv, discount)
      if (roi >= COUPON_THRESHOLDS.HIGH_ROI) {
        highRoiCoupons.push({
          name: coupon.coupon_name || coupon.title,
          roi
        })
      }
    })
    
    const overallConversion = safeDivide(totalUsed, totalIssued) * 100
    const overallRoi = safeDivide(totalGmv, totalDiscount)
    
    // 인사이트 생성
    
    // 1. 전체 전환율 분석
    if (overallConversion < COUPON_THRESHOLDS.LOW_CONVERSION_RATE) {
      insights.push({
        type: 'warning',
        category: 'conversion',
        message: `전체 쿠폰 전환율이 ${overallConversion.toFixed(1)}%로 낮습니다.`,
        action: '쿠폰 노출 위치 및 할인 조건을 검토해보세요.',
        priority: 'high'
      })
    } else if (overallConversion >= COUPON_THRESHOLDS.HIGH_CONVERSION_RATE) {
      insights.push({
        type: 'success',
        category: 'conversion',
        message: `전체 쿠폰 전환율이 ${overallConversion.toFixed(1)}%로 우수합니다.`,
        action: '현재 전략을 유지하고 성공 요인을 분석해보세요.',
        priority: 'low'
      })
    }
    
    // 2. 미사용 쿠폰 분석
    if (zeroUsageCount > 0) {
      const zeroUsagePct = (zeroUsageCount / filteredCoupons.length) * 100
      insights.push({
        type: 'warning',
        category: 'unused',
        message: `${zeroUsageCount}개 쿠폰(${zeroUsagePct.toFixed(1)}%)이 전혀 사용되지 않았습니다.`,
        action: '미사용 쿠폰의 조건과 노출 경로를 점검하세요.',
        priority: zeroUsagePct > 20 ? 'high' : 'medium'
      })
    }
    
    // 3. ROI 분석
    if (overallRoi < COUPON_THRESHOLDS.LOW_ROI) {
      insights.push({
        type: 'warning',
        category: 'roi',
        message: `전체 ROI가 ${overallRoi.toFixed(1)}로 낮습니다.`,
        action: '할인율을 조정하거나 최소 구매 금액 조건을 검토하세요.',
        priority: 'high'
      })
    }
    
    // 4. 고성과 쿠폰 분석
    if (highRoiCoupons.length > 0) {
      insights.push({
        type: 'success',
        category: 'top_performer',
        message: `${highRoiCoupons.length}개 쿠폰이 높은 ROI(${COUPON_THRESHOLDS.HIGH_ROI}+)를 기록했습니다.`,
        action: `성공 쿠폰: ${highRoiCoupons.slice(0, 3).map(c => c.name).join(', ')}`,
        priority: 'low'
      })
    }
    
    // 우선순위 정렬
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    insights.sort((a, b) => priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder])
    
    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        insights,
        metrics: {
          totalCoupons: filteredCoupons.length,
          overallConversion: overallConversion.toFixed(2),
          overallRoi: overallRoi.toFixed(2),
          zeroUsageCount
        }
      }
    })
  } catch (error: any) {
    console.error('[CouponAnalytics] Insights failed:', error)
    res.status(500).json({
      success: false,
      error: '쿠폰 인사이트 생성 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

// ============================================================
// 헬퍼 함수
// ============================================================

/**
 * 미사용 쿠폰의 가능한 원인 분석
 */
function analyzePossibleReason(coupon: any): string {
  const reasons: string[] = []
  
  // 할인율/금액 분석
  const discountValue = safeNumber(coupon.discount_value)
  const discountType = (coupon.discount_type || '').toUpperCase()
  
  if (discountType === 'RATE' && discountValue < 5) {
    reasons.push('할인율이 너무 낮음')
  }
  if (discountType === 'FIXED' && discountValue < 1) {
    reasons.push('할인 금액이 너무 낮음')
  }
  
  // 최소 구매 금액 분석
  const minPurchase = safeNumber(coupon.min_purchase)
  if (minPurchase > 100) {
    reasons.push('최소 구매 금액이 높음')
  }
  
  // 기간 분석
  const fromDate = coupon.from_datetime ? new Date(coupon.from_datetime) : null
  const toDate = coupon.to_datetime ? new Date(coupon.to_datetime) : null
  if (fromDate && toDate) {
    const durationDays = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
    if (durationDays < 3) {
      reasons.push('사용 기간이 너무 짧음')
    }
  }
  
  if (reasons.length === 0) {
    reasons.push('노출 부족 또는 타겟팅 문제 가능')
  }
  
  return reasons.join(', ')
}

export default router

