// backend/src/routes/reviewAnalytics.ts
// 리뷰 분석 API (Phase 3: 2차 가공 데이터)

import { Router, Request, Response } from 'express'
import { db } from '../db'
import GoogleSheetsService from '../services/googleSheets'
import { sheetsConfig, SHEET_NAMES } from '../config/sheets'
import { NPS_THRESHOLDS } from '../config/businessRules'

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

/**
 * NPS 계산 (5점 만점 기준)
 * Promoters: 5점
 * Passives: 4점
 * Detractors: 1~3점
 */
function calculateNPS(reviews: any[]): {
  score: number
  promoters: number
  promotersPct: number
  passives: number
  passivesPct: number
  detractors: number
  detractorsPct: number
  total: number
  avgRating: number
} {
  const total = reviews.length
  if (total === 0) {
    return {
      score: 0,
      promoters: 0,
      promotersPct: 0,
      passives: 0,
      passivesPct: 0,
      detractors: 0,
      detractorsPct: 0,
      total: 0,
      avgRating: 0
    }
  }
  
  let totalRating = 0
  let promoters = 0
  let passives = 0
  let detractors = 0
  
  reviews.forEach((review: any) => {
    const rating = safeNumber(review.rating || review.score, 0)
    if (rating < 1 || rating > 5) return
    
    totalRating += rating
    
    if (rating === 5) {
      promoters++
    } else if (rating === 4) {
      passives++
    } else {
      detractors++
    }
  })
  
  const promotersPct = (promoters / total) * 100
  const passivesPct = (passives / total) * 100
  const detractorsPct = (detractors / total) * 100
  
  return {
    score: Math.round(promotersPct - detractorsPct),
    promoters,
    promotersPct,
    passives,
    passivesPct,
    detractors,
    detractorsPct,
    total,
    avgRating: totalRating / total
  }
}

// ============================================================
// API 엔드포인트
// ============================================================

/**
 * NPS 분석
 * GET /api/review-analytics/nps?startDate=2024-01-01&endDate=2024-12-17
 */
router.get('/nps', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, compareWithPrevious } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate와 endDate가 필요합니다.'
      })
    }
    
    // 리뷰 데이터 로드
    let reviewData: any[] = []
    try {
      reviewData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.REVIEW, false)
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: '리뷰 데이터를 찾을 수 없습니다.'
      })
    }
    
    const start = new Date(startDate as string)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate as string)
    end.setHours(23, 59, 59, 999)
    
    // 기간 필터링
    const filteredReviews = reviewData.filter((review: any) => {
      try {
        const dateField = review.created_at || review.review_date || review.date
        if (!dateField) return false
        const reviewDate = new Date(dateField)
        return reviewDate >= start && reviewDate <= end
      } catch {
        return false
      }
    })
    
    const nps = calculateNPS(filteredReviews)
    
    let response: any = {
      success: true,
      data: {
        period: { startDate, endDate },
        nps: {
          score: nps.score,
          interpretation: interpretNPS(nps.score),
          breakdown: {
            promoters: {
              count: nps.promoters,
              percentage: nps.promotersPct.toFixed(1)
            },
            passives: {
              count: nps.passives,
              percentage: nps.passivesPct.toFixed(1)
            },
            detractors: {
              count: nps.detractors,
              percentage: nps.detractorsPct.toFixed(1)
            }
          },
          totalReviews: nps.total,
          avgRating: nps.avgRating.toFixed(2)
        }
      }
    }
    
    // 이전 기간 비교
    if (compareWithPrevious === 'true') {
      const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      const prevEnd = new Date(start.getTime() - 1)
      const prevStart = new Date(prevEnd.getTime() - ((days - 1) * 24 * 60 * 60 * 1000))
      
      const prevReviews = reviewData.filter((review: any) => {
        try {
          const dateField = review.created_at || review.review_date || review.date
          if (!dateField) return false
          const reviewDate = new Date(dateField)
          return reviewDate >= prevStart && reviewDate <= prevEnd
        } catch {
          return false
        }
      })
      
      const prevNps = calculateNPS(prevReviews)
      
      response.data.comparison = {
        previousPeriod: {
          startDate: prevStart.toISOString().split('T')[0],
          endDate: prevEnd.toISOString().split('T')[0]
        },
        previousNps: prevNps.score,
        change: nps.score - prevNps.score,
        trend: nps.score > prevNps.score ? 'up' : nps.score < prevNps.score ? 'down' : 'stable'
      }
    }
    
    res.json(response)
  } catch (error: any) {
    console.error('[ReviewAnalytics] NPS failed:', error)
    res.status(500).json({
      success: false,
      error: 'NPS 분석 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

/**
 * 리뷰 트렌드
 * GET /api/review-analytics/trend?startDate=2024-01-01&endDate=2024-12-17
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
    
    // DB에서 일별 리뷰 지표 조회
    const result = await db.query(`
      SELECT 
        ${aggregation === 'monthly' ? "TO_CHAR(date, 'YYYY-MM') as period" : 'date as period'},
        SUM(review_count) as total_reviews,
        AVG(avg_rating) as avg_rating,
        SUM(rating_1) as rating_1,
        SUM(rating_2) as rating_2,
        SUM(rating_3) as rating_3,
        SUM(rating_4) as rating_4,
        SUM(rating_5) as rating_5,
        AVG(nps_score) as avg_nps
      FROM daily_review_metrics
      WHERE date BETWEEN $1 AND $2
      GROUP BY ${aggregation === 'monthly' ? "TO_CHAR(date, 'YYYY-MM')" : 'date'}
      ORDER BY period
    `, [startDate, endDate])
    
    const trendData = result.rows.map((row: any) => ({
      period: row.period,
      totalReviews: parseInt(row.total_reviews) || 0,
      avgRating: parseFloat(row.avg_rating)?.toFixed(2) || 0,
      npsScore: Math.round(parseFloat(row.avg_nps) || 0),
      ratingDistribution: {
        1: parseInt(row.rating_1) || 0,
        2: parseInt(row.rating_2) || 0,
        3: parseInt(row.rating_3) || 0,
        4: parseInt(row.rating_4) || 0,
        5: parseInt(row.rating_5) || 0
      }
    }))
    
    res.json({
      success: true,
      data: {
        aggregation,
        trend: trendData
      }
    })
  } catch (error: any) {
    console.error('[ReviewAnalytics] Trend failed:', error)
    res.status(500).json({
      success: false,
      error: '리뷰 트렌드 조회 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

/**
 * 국가별 리뷰 분석
 * GET /api/review-analytics/by-country?startDate=2024-01-01&endDate=2024-12-17
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
    
    // 리뷰 데이터 로드
    let reviewData: any[] = []
    try {
      reviewData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.REVIEW, false)
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: '리뷰 데이터를 찾을 수 없습니다.'
      })
    }
    
    const start = new Date(startDate as string)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate as string)
    end.setHours(23, 59, 59, 999)
    
    // 국가별 분류
    const jpReviews: any[] = []
    const enReviews: any[] = []
    
    reviewData.forEach((review: any) => {
      try {
        const dateField = review.created_at || review.review_date || review.date
        if (!dateField) return
        const reviewDate = new Date(dateField)
        if (reviewDate < start || reviewDate > end) return
        
        const country = (review.country || '').toUpperCase()
        if (country === 'JP') {
          jpReviews.push(review)
        } else {
          enReviews.push(review)
        }
      } catch {}
    })
    
    const jpNps = calculateNPS(jpReviews)
    const enNps = calculateNPS(enReviews)
    
    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        byCountry: {
          JP: {
            totalReviews: jpNps.total,
            avgRating: jpNps.avgRating.toFixed(2),
            npsScore: jpNps.score,
            interpretation: interpretNPS(jpNps.score),
            breakdown: {
              promoters: jpNps.promoters,
              passives: jpNps.passives,
              detractors: jpNps.detractors
            }
          },
          EN: {
            totalReviews: enNps.total,
            avgRating: enNps.avgRating.toFixed(2),
            npsScore: enNps.score,
            interpretation: interpretNPS(enNps.score),
            breakdown: {
              promoters: enNps.promoters,
              passives: enNps.passives,
              detractors: enNps.detractors
            }
          }
        }
      }
    })
  } catch (error: any) {
    console.error('[ReviewAnalytics] By-country failed:', error)
    res.status(500).json({
      success: false,
      error: '국가별 리뷰 분석 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

/**
 * 작가별 리뷰 분석
 * GET /api/review-analytics/by-artist?startDate=2024-01-01&endDate=2024-12-17&limit=20
 */
router.get('/by-artist', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, limit = 20, sortBy = 'count' } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate와 endDate가 필요합니다.'
      })
    }
    
    // 리뷰 데이터 로드
    let reviewData: any[] = []
    try {
      reviewData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.REVIEW, false)
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: '리뷰 데이터를 찾을 수 없습니다.'
      })
    }
    
    const start = new Date(startDate as string)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate as string)
    end.setHours(23, 59, 59, 999)
    
    // 작가별 집계
    const artistMap: Map<string, any[]> = new Map()
    
    reviewData.forEach((review: any) => {
      try {
        const dateField = review.created_at || review.review_date || review.date
        if (!dateField) return
        const reviewDate = new Date(dateField)
        if (reviewDate < start || reviewDate > end) return
        
        const artistName = review.artist_name || review['artist_name (kr)'] || 'Unknown'
        if (!artistMap.has(artistName)) {
          artistMap.set(artistName, [])
        }
        artistMap.get(artistName)!.push(review)
      } catch {}
    })
    
    // 작가별 NPS 계산
    const artistStats = Array.from(artistMap.entries()).map(([artistName, reviews]) => {
      const nps = calculateNPS(reviews)
      return {
        artistName,
        reviewCount: nps.total,
        avgRating: nps.avgRating,
        npsScore: nps.score,
        promoters: nps.promoters,
        detractors: nps.detractors
      }
    })
    
    // 정렬
    if (sortBy === 'rating') {
      artistStats.sort((a, b) => b.avgRating - a.avgRating)
    } else if (sortBy === 'nps') {
      artistStats.sort((a, b) => b.npsScore - a.npsScore)
    } else {
      artistStats.sort((a, b) => b.reviewCount - a.reviewCount)
    }
    
    const limitNum = parseInt(limit as string) || 20
    
    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        totalArtists: artistStats.length,
        byArtist: artistStats.slice(0, limitNum).map(stat => ({
          ...stat,
          avgRating: stat.avgRating.toFixed(2)
        }))
      }
    })
  } catch (error: any) {
    console.error('[ReviewAnalytics] By-artist failed:', error)
    res.status(500).json({
      success: false,
      error: '작가별 리뷰 분석 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

/**
 * 평점 분포 분석
 * GET /api/review-analytics/rating-distribution?startDate=2024-01-01&endDate=2024-12-17
 */
router.get('/rating-distribution', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate와 endDate가 필요합니다.'
      })
    }
    
    // 리뷰 데이터 로드
    let reviewData: any[] = []
    try {
      reviewData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.REVIEW, false)
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: '리뷰 데이터를 찾을 수 없습니다.'
      })
    }
    
    const start = new Date(startDate as string)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate as string)
    end.setHours(23, 59, 59, 999)
    
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    let total = 0
    
    reviewData.forEach((review: any) => {
      try {
        const dateField = review.created_at || review.review_date || review.date
        if (!dateField) return
        const reviewDate = new Date(dateField)
        if (reviewDate < start || reviewDate > end) return
        
        const rating = safeNumber(review.rating || review.score, 0)
        if (rating >= 1 && rating <= 5) {
          distribution[rating as keyof typeof distribution]++
          total++
        }
      } catch {}
    })
    
    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        totalReviews: total,
        distribution: Object.entries(distribution).map(([rating, count]) => ({
          rating: parseInt(rating),
          count,
          percentage: total > 0 ? ((count / total) * 100).toFixed(1) : 0
        })),
        avgRating: total > 0 
          ? (Object.entries(distribution).reduce((sum, [r, c]) => sum + parseInt(r) * c, 0) / total).toFixed(2)
          : 0
      }
    })
  } catch (error: any) {
    console.error('[ReviewAnalytics] Rating distribution failed:', error)
    res.status(500).json({
      success: false,
      error: '평점 분포 분석 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

/**
 * 리뷰 인사이트 생성
 * GET /api/review-analytics/insights?startDate=2024-01-01&endDate=2024-12-17
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
    
    // 리뷰 데이터 로드
    let reviewData: any[] = []
    try {
      reviewData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.REVIEW, false)
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: '리뷰 데이터를 찾을 수 없습니다.'
      })
    }
    
    const start = new Date(startDate as string)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate as string)
    end.setHours(23, 59, 59, 999)
    
    // 기간 필터링
    const filteredReviews = reviewData.filter((review: any) => {
      try {
        const dateField = review.created_at || review.review_date || review.date
        if (!dateField) return false
        const reviewDate = new Date(dateField)
        return reviewDate >= start && reviewDate <= end
      } catch {
        return false
      }
    })
    
    const nps = calculateNPS(filteredReviews)
    const insights: any[] = []
    
    // 1. NPS 점수 분석
    if (nps.score >= NPS_THRESHOLDS.EXCELLENT) {
      insights.push({
        type: 'success',
        category: 'nps',
        message: `NPS ${nps.score}점으로 매우 우수합니다!`,
        action: '현재 고객 만족 전략을 유지하고 성공 사례를 공유하세요.',
        priority: 'low'
      })
    } else if (nps.score >= NPS_THRESHOLDS.GOOD) {
      insights.push({
        type: 'info',
        category: 'nps',
        message: `NPS ${nps.score}점으로 양호합니다.`,
        action: 'Passive 고객을 Promoter로 전환하는 전략을 고려해보세요.',
        priority: 'medium'
      })
    } else if (nps.score >= NPS_THRESHOLDS.NEEDS_IMPROVEMENT) {
      insights.push({
        type: 'warning',
        category: 'nps',
        message: `NPS ${nps.score}점으로 개선이 필요합니다.`,
        action: 'Detractor 고객의 불만 사항을 파악하고 개선하세요.',
        priority: 'high'
      })
    } else {
      insights.push({
        type: 'error',
        category: 'nps',
        message: `NPS ${nps.score}점으로 심각한 수준입니다.`,
        action: '즉각적인 고객 만족도 개선 조치가 필요합니다.',
        priority: 'critical'
      })
    }
    
    // 2. Detractor 비율 분석
    if (nps.detractorsPct > 30) {
      insights.push({
        type: 'warning',
        category: 'detractors',
        message: `Detractor 비율이 ${nps.detractorsPct.toFixed(1)}%로 높습니다.`,
        action: '1~3점 리뷰의 공통 불만 사항을 분석하세요.',
        priority: 'high'
      })
    }
    
    // 3. 평균 평점 분석
    if (nps.avgRating < 3.5) {
      insights.push({
        type: 'warning',
        category: 'rating',
        message: `평균 평점 ${nps.avgRating.toFixed(2)}점으로 낮습니다.`,
        action: '제품 품질 및 서비스 개선이 필요합니다.',
        priority: 'high'
      })
    } else if (nps.avgRating >= 4.5) {
      insights.push({
        type: 'success',
        category: 'rating',
        message: `평균 평점 ${nps.avgRating.toFixed(2)}점으로 우수합니다.`,
        action: '높은 평점의 리뷰를 마케팅에 활용해보세요.',
        priority: 'low'
      })
    }
    
    // 4. 리뷰 수 분석
    if (nps.total < 10) {
      insights.push({
        type: 'info',
        category: 'volume',
        message: `리뷰 수(${nps.total}건)가 적어 통계적 신뢰도가 낮습니다.`,
        action: '리뷰 작성 유도 캠페인을 고려해보세요.',
        priority: 'medium'
      })
    }
    
    // 우선순위 정렬
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    insights.sort((a, b) => 
      (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) - 
      (priorityOrder[b.priority as keyof typeof priorityOrder] || 4)
    )
    
    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        insights,
        metrics: {
          npsScore: nps.score,
          avgRating: nps.avgRating.toFixed(2),
          totalReviews: nps.total,
          promotersPct: nps.promotersPct.toFixed(1),
          detractorsPct: nps.detractorsPct.toFixed(1)
        }
      }
    })
  } catch (error: any) {
    console.error('[ReviewAnalytics] Insights failed:', error)
    res.status(500).json({
      success: false,
      error: '리뷰 인사이트 생성 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

// ============================================================
// 헬퍼 함수
// ============================================================

/**
 * NPS 점수 해석
 */
function interpretNPS(score: number): string {
  if (score >= NPS_THRESHOLDS.EXCELLENT) return '매우 우수'
  if (score >= NPS_THRESHOLDS.GOOD) return '양호'
  if (score >= NPS_THRESHOLDS.NEEDS_IMPROVEMENT) return '개선 필요'
  return '심각'
}

export default router

