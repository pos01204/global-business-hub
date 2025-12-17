// backend/src/routes/metrics.ts
// 집계 데이터 조회 API (Phase 2: 1차 가공 데이터)

import { Router, Request, Response } from 'express'
import { db } from '../db'
import { CURRENCY } from '../config/constants'

const router = Router()

// ============================================================
// 일별 기본 지표 조회 API
// ============================================================

/**
 * 일별 기본 지표 조회
 * GET /api/metrics/daily?startDate=2024-12-01&endDate=2024-12-15
 */
router.get('/daily', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, country } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate와 endDate가 필요합니다.'
      })
    }
    
    let query = `
      SELECT 
        date,
        order_count,
        total_gmv_krw,
        total_gmv_usd,
        avg_aov,
        item_count,
        unique_customers,
        new_customers,
        returning_customers,
        unique_artists,
        unique_products,
        jp_order_count,
        jp_gmv_krw,
        jp_gmv_usd,
        jp_unique_customers,
        en_order_count,
        en_gmv_krw,
        en_gmv_usd,
        en_unique_customers,
        delivery_completed_count,
        delivery_rate,
        created_at,
        updated_at
      FROM daily_metrics
      WHERE date BETWEEN $1 AND $2
    `
    const params: any[] = [startDate, endDate]
    
    query += ' ORDER BY date DESC'
    
    const result = await db.query(query, params)
    
    // 국가별 필터링 (클라이언트 측에서 처리하도록 전체 데이터 반환)
    let data = result.rows
    
    if (country === 'JP') {
      data = data.map((row: any) => ({
        ...row,
        order_count: row.jp_order_count,
        total_gmv_krw: row.jp_gmv_krw,
        total_gmv_usd: row.jp_gmv_usd,
        unique_customers: row.jp_unique_customers
      }))
    } else if (country === 'EN') {
      data = data.map((row: any) => ({
        ...row,
        order_count: row.en_order_count,
        total_gmv_krw: row.en_gmv_krw,
        total_gmv_usd: row.en_gmv_usd,
        unique_customers: row.en_unique_customers
      }))
    }
    
    res.json({
      success: true,
      data,
      meta: {
        startDate,
        endDate,
        count: data.length,
        country: country || 'ALL'
      }
    })
  } catch (error: any) {
    console.error('[Metrics] Daily metrics query failed:', error)
    res.status(500).json({
      success: false,
      error: '일별 지표 조회 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

/**
 * 기간 요약 지표 조회
 * GET /api/metrics/summary?startDate=2024-12-01&endDate=2024-12-15
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
    
    // 현재 기간 집계
    const currentResult = await db.query(`
      SELECT 
        SUM(order_count) as total_orders,
        SUM(total_gmv_krw) as total_gmv_krw,
        SUM(total_gmv_usd) as total_gmv_usd,
        AVG(avg_aov) as avg_aov,
        SUM(item_count) as total_items,
        SUM(unique_customers) as total_customers,
        SUM(new_customers) as total_new_customers,
        SUM(returning_customers) as total_returning_customers,
        SUM(unique_artists) as total_artists,
        SUM(unique_products) as total_products,
        AVG(delivery_rate) as avg_delivery_rate,
        COUNT(*) as days_count
      FROM daily_metrics
      WHERE date BETWEEN $1 AND $2
    `, [startDate, endDate])
    
    const current = currentResult.rows[0]
    
    let response: any = {
      success: true,
      data: {
        period: { startDate, endDate },
        summary: {
          totalOrders: parseInt(current.total_orders) || 0,
          totalGmvKrw: parseFloat(current.total_gmv_krw) || 0,
          totalGmvUsd: parseFloat(current.total_gmv_usd) || 0,
          avgAov: parseFloat(current.avg_aov) || 0,
          totalItems: parseInt(current.total_items) || 0,
          totalCustomers: parseInt(current.total_customers) || 0,
          totalNewCustomers: parseInt(current.total_new_customers) || 0,
          totalReturningCustomers: parseInt(current.total_returning_customers) || 0,
          avgDeliveryRate: parseFloat(current.avg_delivery_rate) || 0,
          daysCount: parseInt(current.days_count) || 0
        }
      }
    }
    
    // 이전 기간 비교
    if (compareWithPrevious === 'true') {
      const start = new Date(startDate as string)
      const end = new Date(endDate as string)
      const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      
      const prevEnd = new Date(start.getTime() - 1)
      const prevStart = new Date(prevEnd.getTime() - ((days - 1) * 24 * 60 * 60 * 1000))
      
      const prevResult = await db.query(`
        SELECT 
          SUM(order_count) as total_orders,
          SUM(total_gmv_krw) as total_gmv_krw,
          SUM(new_customers) as total_new_customers,
          AVG(delivery_rate) as avg_delivery_rate
        FROM daily_metrics
        WHERE date BETWEEN $1 AND $2
      `, [prevStart.toISOString().split('T')[0], prevEnd.toISOString().split('T')[0]])
      
      const prev = prevResult.rows[0]
      
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
          ordersChange: calcChange(parseInt(current.total_orders) || 0, parseInt(prev.total_orders) || 0),
          gmvChange: calcChange(parseFloat(current.total_gmv_krw) || 0, parseFloat(prev.total_gmv_krw) || 0),
          newCustomersChange: calcChange(parseInt(current.total_new_customers) || 0, parseInt(prev.total_new_customers) || 0),
          deliveryRateChange: (parseFloat(current.avg_delivery_rate) || 0) - (parseFloat(prev.avg_delivery_rate) || 0)
        }
      }
    }
    
    res.json(response)
  } catch (error: any) {
    console.error('[Metrics] Summary query failed:', error)
    res.status(500).json({
      success: false,
      error: '요약 지표 조회 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

// ============================================================
// 리뷰 지표 조회 API
// ============================================================

/**
 * 일별 리뷰 지표 조회
 * GET /api/metrics/reviews?startDate=2024-12-01&endDate=2024-12-15
 */
router.get('/reviews', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate와 endDate가 필요합니다.'
      })
    }
    
    const result = await db.query(`
      SELECT 
        date,
        review_count,
        avg_rating,
        rating_1,
        rating_2,
        rating_3,
        rating_4,
        rating_5,
        promoters,
        passives,
        detractors,
        nps_score,
        jp_review_count,
        jp_avg_rating,
        en_review_count,
        en_avg_rating,
        created_at,
        updated_at
      FROM daily_review_metrics
      WHERE date BETWEEN $1 AND $2
      ORDER BY date DESC
    `, [startDate, endDate])
    
    res.json({
      success: true,
      data: result.rows,
      meta: {
        startDate,
        endDate,
        count: result.rows.length
      }
    })
  } catch (error: any) {
    console.error('[Metrics] Review metrics query failed:', error)
    res.status(500).json({
      success: false,
      error: '리뷰 지표 조회 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

/**
 * 리뷰 요약 지표 조회
 * GET /api/metrics/reviews/summary?startDate=2024-12-01&endDate=2024-12-15
 */
router.get('/reviews/summary', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate와 endDate가 필요합니다.'
      })
    }
    
    const result = await db.query(`
      SELECT 
        SUM(review_count) as total_reviews,
        AVG(avg_rating) as avg_rating,
        SUM(rating_1) as total_rating_1,
        SUM(rating_2) as total_rating_2,
        SUM(rating_3) as total_rating_3,
        SUM(rating_4) as total_rating_4,
        SUM(rating_5) as total_rating_5,
        SUM(promoters) as total_promoters,
        SUM(passives) as total_passives,
        SUM(detractors) as total_detractors,
        AVG(nps_score) as avg_nps_score
      FROM daily_review_metrics
      WHERE date BETWEEN $1 AND $2
    `, [startDate, endDate])
    
    const data = result.rows[0]
    
    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        summary: {
          totalReviews: parseInt(data.total_reviews) || 0,
          avgRating: parseFloat(data.avg_rating)?.toFixed(2) || 0,
          ratingDistribution: {
            1: parseInt(data.total_rating_1) || 0,
            2: parseInt(data.total_rating_2) || 0,
            3: parseInt(data.total_rating_3) || 0,
            4: parseInt(data.total_rating_4) || 0,
            5: parseInt(data.total_rating_5) || 0
          },
          nps: {
            promoters: parseInt(data.total_promoters) || 0,
            passives: parseInt(data.total_passives) || 0,
            detractors: parseInt(data.total_detractors) || 0,
            score: parseFloat(data.avg_nps_score)?.toFixed(1) || 0
          }
        }
      }
    })
  } catch (error: any) {
    console.error('[Metrics] Review summary query failed:', error)
    res.status(500).json({
      success: false,
      error: '리뷰 요약 지표 조회 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

// ============================================================
// 쿠폰 지표 조회 API
// ============================================================

/**
 * 일별 쿠폰 지표 조회
 * GET /api/metrics/coupons?startDate=2024-12-01&endDate=2024-12-15
 */
router.get('/coupons', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate와 endDate가 필요합니다.'
      })
    }
    
    const result = await db.query(`
      SELECT 
        date,
        active_coupons,
        issued_count,
        used_count,
        conversion_rate,
        total_discount_usd,
        total_discount_krw,
        total_gmv_usd,
        total_gmv_krw,
        roi,
        rate_issued,
        rate_used,
        rate_discount_usd,
        fixed_issued,
        fixed_used,
        fixed_discount_usd,
        jp_issued,
        jp_used,
        jp_gmv_usd,
        en_issued,
        en_used,
        en_gmv_usd,
        created_at,
        updated_at
      FROM daily_coupon_metrics
      WHERE date BETWEEN $1 AND $2
      ORDER BY date DESC
    `, [startDate, endDate])
    
    res.json({
      success: true,
      data: result.rows,
      meta: {
        startDate,
        endDate,
        count: result.rows.length
      }
    })
  } catch (error: any) {
    console.error('[Metrics] Coupon metrics query failed:', error)
    res.status(500).json({
      success: false,
      error: '쿠폰 지표 조회 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

/**
 * 쿠폰 요약 지표 조회
 * GET /api/metrics/coupons/summary?startDate=2024-12-01&endDate=2024-12-15
 */
router.get('/coupons/summary', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate와 endDate가 필요합니다.'
      })
    }
    
    const result = await db.query(`
      SELECT 
        AVG(active_coupons) as avg_active_coupons,
        SUM(issued_count) as total_issued,
        SUM(used_count) as total_used,
        AVG(conversion_rate) as avg_conversion_rate,
        SUM(total_discount_usd) as total_discount_usd,
        SUM(total_discount_krw) as total_discount_krw,
        SUM(total_gmv_usd) as total_gmv_usd,
        SUM(total_gmv_krw) as total_gmv_krw,
        AVG(roi) as avg_roi,
        SUM(rate_issued) as total_rate_issued,
        SUM(rate_used) as total_rate_used,
        SUM(fixed_issued) as total_fixed_issued,
        SUM(fixed_used) as total_fixed_used
      FROM daily_coupon_metrics
      WHERE date BETWEEN $1 AND $2
    `, [startDate, endDate])
    
    const data = result.rows[0]
    const totalUsed = parseInt(data.total_used) || 0
    const totalIssued = parseInt(data.total_issued) || 0
    
    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        summary: {
          avgActiveCoupons: Math.round(parseFloat(data.avg_active_coupons) || 0),
          totalIssued,
          totalUsed,
          overallConversionRate: totalIssued > 0 ? ((totalUsed / totalIssued) * 100).toFixed(2) : 0,
          totalDiscountUsd: parseFloat(data.total_discount_usd) || 0,
          totalDiscountKrw: parseFloat(data.total_discount_krw) || 0,
          totalGmvUsd: parseFloat(data.total_gmv_usd) || 0,
          totalGmvKrw: parseFloat(data.total_gmv_krw) || 0,
          avgRoi: parseFloat(data.avg_roi)?.toFixed(2) || 0,
          byType: {
            rate: {
              issued: parseInt(data.total_rate_issued) || 0,
              used: parseInt(data.total_rate_used) || 0
            },
            fixed: {
              issued: parseInt(data.total_fixed_issued) || 0,
              used: parseInt(data.total_fixed_used) || 0
            }
          }
        }
      }
    })
  } catch (error: any) {
    console.error('[Metrics] Coupon summary query failed:', error)
    res.status(500).json({
      success: false,
      error: '쿠폰 요약 지표 조회 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

// ============================================================
// 트렌드 분석 API
// ============================================================

/**
 * GMV 트렌드 조회
 * GET /api/metrics/trends/gmv?startDate=2024-12-01&endDate=2024-12-15&aggregation=daily
 */
router.get('/trends/gmv', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, aggregation = 'daily' } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate와 endDate가 필요합니다.'
      })
    }
    
    let query: string
    
    if (aggregation === 'weekly') {
      query = `
        SELECT 
          DATE_TRUNC('week', date) as period,
          SUM(order_count) as order_count,
          SUM(total_gmv_krw) as total_gmv_krw,
          SUM(total_gmv_usd) as total_gmv_usd,
          AVG(avg_aov) as avg_aov
        FROM daily_metrics
        WHERE date BETWEEN $1 AND $2
        GROUP BY DATE_TRUNC('week', date)
        ORDER BY period
      `
    } else if (aggregation === 'monthly') {
      query = `
        SELECT 
          DATE_TRUNC('month', date) as period,
          SUM(order_count) as order_count,
          SUM(total_gmv_krw) as total_gmv_krw,
          SUM(total_gmv_usd) as total_gmv_usd,
          AVG(avg_aov) as avg_aov
        FROM daily_metrics
        WHERE date BETWEEN $1 AND $2
        GROUP BY DATE_TRUNC('month', date)
        ORDER BY period
      `
    } else {
      // daily
      query = `
        SELECT 
          date as period,
          order_count,
          total_gmv_krw,
          total_gmv_usd,
          avg_aov
        FROM daily_metrics
        WHERE date BETWEEN $1 AND $2
        ORDER BY date
      `
    }
    
    const result = await db.query(query, [startDate, endDate])
    
    res.json({
      success: true,
      data: result.rows.map((row: any) => ({
        period: row.period.toISOString().split('T')[0],
        orderCount: parseInt(row.order_count) || 0,
        totalGmvKrw: parseFloat(row.total_gmv_krw) || 0,
        totalGmvUsd: parseFloat(row.total_gmv_usd) || 0,
        avgAov: parseFloat(row.avg_aov) || 0
      })),
      meta: {
        startDate,
        endDate,
        aggregation
      }
    })
  } catch (error: any) {
    console.error('[Metrics] GMV trend query failed:', error)
    res.status(500).json({
      success: false,
      error: 'GMV 트렌드 조회 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

export default router

