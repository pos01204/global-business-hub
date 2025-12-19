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
 * NPS 계산 (10점 만점 기준 - Raw Data 형식)
 * Promoters: 9-10점
 * Passives: 7-8점
 * Detractors: 1-6점
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
    if (rating < 1 || rating > 10) return
    
    totalRating += rating
    
    // 10점 만점 기준 NPS 분류
    if (rating >= 9) {
      promoters++
    } else if (rating >= 7) {
      passives++
    } else {
      detractors++
    }
  })
  
  const validTotal = promoters + passives + detractors
  const promotersPct = validTotal > 0 ? (promoters / validTotal) * 100 : 0
  const passivesPct = validTotal > 0 ? (passives / validTotal) * 100 : 0
  const detractorsPct = validTotal > 0 ? (detractors / validTotal) * 100 : 0
  
  return {
    score: Math.round(promotersPct - detractorsPct),
    promoters,
    promotersPct,
    passives,
    passivesPct,
    detractors,
    detractorsPct,
    total: validTotal,
    avgRating: validTotal > 0 ? totalRating / validTotal : 0
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
        const dateField = review.dt || review.created_at || review.review_date || review.date
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
          const dateField = review.dt || review.created_at || review.review_date || review.date
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
        const dateField = review.dt || review.created_at || review.review_date || review.date
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
        const dateField = review.dt || review.created_at || review.review_date || review.date
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
 * 상품별 리뷰 분석
 * GET /api/review-analytics/by-product?startDate=2024-01-01&endDate=2024-12-17&limit=20
 */
router.get('/by-product', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, limit = 20 } = req.query
    
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
    
    // 상품별 집계
    const productMap: Map<number, any[]> = new Map()
    
    reviewData.forEach((review: any) => {
      try {
        const dateField = review.dt || review.created_at || review.review_date || review.date
        if (!dateField) return
        const reviewDate = new Date(dateField)
        if (reviewDate < start || reviewDate > end) return
        
        const productId = safeNumber(review.product_id || review.productId)
        if (productId === 0) return
        
        if (!productMap.has(productId)) {
          productMap.set(productId, [])
        }
        productMap.get(productId)!.push(review)
      } catch {}
    })
    
    // 상품별 NPS 계산
    const productStats = Array.from(productMap.entries()).map(([productId, reviews]) => {
      const nps = calculateNPS(reviews)
      return {
        productId,
        productName: reviews[0]?.product_name || reviews[0]?.productName || `상품 ${productId}`,
        reviewCount: nps.total,
        avgRating: nps.avgRating,
        npsScore: nps.score,
        promoters: nps.promoters,
        detractors: nps.detractors
      }
    })
    
    // 리뷰 수 기준 정렬
    productStats.sort((a, b) => b.reviewCount - a.reviewCount)
    
    const limitNum = parseInt(limit as string) || 20
    
    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        totalProducts: productStats.length,
        byProduct: productStats.slice(0, limitNum).map(stat => ({
          ...stat,
          avgRating: stat.avgRating.toFixed(2)
        }))
      }
    })
  } catch (error: any) {
    console.error('[ReviewAnalytics] By-product failed:', error)
    res.status(500).json({
      success: false,
      error: '상품별 리뷰 분석 중 오류가 발생했습니다.',
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
    
    // 10점 만점 기준 분포
    const distribution: Record<number, number> = {}
    for (let i = 1; i <= 10; i++) {
      distribution[i] = 0
    }
    let total = 0
    let totalRating = 0
    
    reviewData.forEach((review: any) => {
      try {
        const dateField = review.dt || review.created_at || review.review_date || review.date
        if (!dateField) return
        const reviewDate = new Date(dateField)
        if (reviewDate < start || reviewDate > end) return
        
        const rating = safeNumber(review.rating || review.score, 0)
        if (rating >= 1 && rating <= 10) {
          distribution[rating]++
          total++
          totalRating += rating
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
          percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
        })),
        avgRating: total > 0 
          ? (totalRating / total).toFixed(2)
          : '0.00'
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
 * 리뷰 내용 및 이미지 분석
 * GET /api/review-analytics/content-analysis?startDate=2024-01-01&endDate=2024-12-17
 */
router.get('/content-analysis', async (req: Request, res: Response) => {
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
        const dateField = review.dt || review.created_at || review.review_date || review.date
        if (!dateField) return false
        const reviewDate = new Date(dateField)
        return reviewDate >= start && reviewDate <= end
      } catch {
        return false
      }
    })
    
    // 이미지 분석
    let totalWithImages = 0
    let totalImages = 0
    const imageCountDist: Record<number, number> = {}
    
    // 리뷰 길이 분석
    let totalLength = 0
    let reviewLengths: number[] = []
    let detailedReviews = 0 // 100자 이상
    
    filteredReviews.forEach((review: any) => {
      const imageCnt = safeNumber(review.image_cnt || review.imageCount, 0)
      if (imageCnt > 0) {
        totalWithImages++
        totalImages += imageCnt
        imageCountDist[imageCnt] = (imageCountDist[imageCnt] || 0) + 1
      }
      
      const contentLen = safeNumber(review.contents_len || review.contentLength || (review.contents?.length || 0), 0)
      if (contentLen > 0) {
        totalLength += contentLen
        reviewLengths.push(contentLen)
        if (contentLen >= 100) detailedReviews++
      }
    })
    
    const avgImageCount = totalWithImages > 0 ? totalImages / totalWithImages : 0
    const avgReviewLength = reviewLengths.length > 0 ? totalLength / reviewLengths.length : 0
    const imageRate = filteredReviews.length > 0 ? (totalWithImages / filteredReviews.length) * 100 : 0
    const detailedReviewRate = filteredReviews.length > 0 ? (detailedReviews / filteredReviews.length) * 100 : 0
    
    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        imageAnalysis: {
          totalWithImages,
          totalImages,
          avgImageCount: avgImageCount.toFixed(1),
          imageRate: imageRate.toFixed(1),
          distribution: Object.entries(imageCountDist).map(([count, num]) => ({
            imageCount: parseInt(count),
            reviewCount: num
          })).sort((a, b) => a.imageCount - b.imageCount)
        },
        contentAnalysis: {
          totalReviews: filteredReviews.length,
          totalLength,
          avgReviewLength: Math.round(avgReviewLength),
          detailedReviews,
          detailedReviewRate: detailedReviewRate.toFixed(1),
          lengthDistribution: {
            short: reviewLengths.filter(l => l < 50).length,
            medium: reviewLengths.filter(l => l >= 50 && l < 100).length,
            long: reviewLengths.filter(l => l >= 100).length
          }
        }
      }
    })
  } catch (error: any) {
    console.error('[ReviewAnalytics] Content analysis failed:', error)
    res.status(500).json({
      success: false,
      error: '리뷰 내용 분석 중 오류가 발생했습니다.',
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
        const dateField = review.dt || review.created_at || review.review_date || review.date
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

/**
 * 리뷰 품질 점수
 * GET /api/review-analytics/quality-score?startDate=2024-01-01&endDate=2024-12-18
 */
router.get('/quality-score', async (req: Request, res: Response) => {
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
        const dateField = review.dt || review.created_at || review.review_date || review.date
        if (!dateField) return false
        const reviewDate = new Date(dateField)
        return reviewDate >= start && reviewDate <= end
      } catch {
        return false
      }
    })
    
    if (filteredReviews.length === 0) {
      return res.json({
        success: true,
        data: {
          score: 0,
          grade: 'D',
          components: { detailRate: 0, imageRate: 0, promoterRate: 0, responseRate: 0 },
          previousScore: 0,
          change: 0,
          trend: 'stable'
        }
      })
    }
    
    // 구성요소 계산
    let detailedCount = 0  // 100자 이상 리뷰
    let imageCount = 0     // 이미지 포함 리뷰
    let promoterCount = 0  // 9-10점 리뷰
    let responseCount = 0  // 응답 완료 리뷰 (가정)
    
    filteredReviews.forEach((review: any) => {
      const contentLen = safeNumber(review.contents_len || review.contentLength || (review.contents?.length || 0), 0)
      if (contentLen >= 100) detailedCount++
      
      const imgCount = safeNumber(review.img_cnt || review.imageCount || 0, 0)
      if (imgCount > 0) imageCount++
      
      const rating = safeNumber(review.rating || review.score, 0)
      if (rating >= 9) promoterCount++
      
      // 응답 여부 (데이터에 따라 조정)
      if (review.replied || review.response) responseCount++
    })
    
    const total = filteredReviews.length
    const detailRate = (detailedCount / total) * 100
    const imageRate = (imageCount / total) * 100
    const promoterRate = (promoterCount / total) * 100
    const responseRate = (responseCount / total) * 100
    
    // 품질 점수 계산 (가중치 적용)
    const score = Math.round(
      (detailRate * 0.25) + 
      (imageRate * 0.20) + 
      (promoterRate * 0.35) + 
      (responseRate * 0.20)
    )
    
    // 등급 결정
    let grade: 'S' | 'A' | 'B' | 'C' | 'D'
    if (score >= 80) grade = 'S'
    else if (score >= 65) grade = 'A'
    else if (score >= 50) grade = 'B'
    else if (score >= 35) grade = 'C'
    else grade = 'D'
    
    // 이전 기간 계산 (동일 기간)
    const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const prevEnd = new Date(start.getTime() - 1)
    const prevStart = new Date(prevEnd.getTime() - ((days - 1) * 24 * 60 * 60 * 1000))
    
    const prevReviews = reviewData.filter((review: any) => {
      try {
        const dateField = review.dt || review.created_at || review.review_date || review.date
        if (!dateField) return false
        const reviewDate = new Date(dateField)
        return reviewDate >= prevStart && reviewDate <= prevEnd
      } catch {
        return false
      }
    })
    
    let previousScore = 0
    if (prevReviews.length > 0) {
      let prevDetailed = 0, prevImage = 0, prevPromoter = 0, prevResponse = 0
      prevReviews.forEach((review: any) => {
        const contentLen = safeNumber(review.contents_len || review.contentLength || (review.contents?.length || 0), 0)
        if (contentLen >= 100) prevDetailed++
        const imgCount = safeNumber(review.img_cnt || review.imageCount || 0, 0)
        if (imgCount > 0) prevImage++
        const rating = safeNumber(review.rating || review.score, 0)
        if (rating >= 9) prevPromoter++
        if (review.replied || review.response) prevResponse++
      })
      const prevTotal = prevReviews.length
      previousScore = Math.round(
        ((prevDetailed / prevTotal) * 100 * 0.25) +
        ((prevImage / prevTotal) * 100 * 0.20) +
        ((prevPromoter / prevTotal) * 100 * 0.35) +
        ((prevResponse / prevTotal) * 100 * 0.20)
      )
    }
    
    const change = previousScore > 0 ? ((score - previousScore) / previousScore) * 100 : 0
    const trend = change > 2 ? 'up' : change < -2 ? 'down' : 'stable'
    
    res.json({
      success: true,
      data: {
        score,
        grade,
        components: {
          detailRate: Math.round(detailRate * 10) / 10,
          imageRate: Math.round(imageRate * 10) / 10,
          promoterRate: Math.round(promoterRate * 10) / 10,
          responseRate: Math.round(responseRate * 10) / 10
        },
        previousScore,
        change: Math.round(change * 10) / 10,
        trend
      }
    })
  } catch (error: any) {
    console.error('[ReviewAnalytics] Quality score failed:', error)
    res.status(500).json({
      success: false,
      error: '리뷰 품질 점수 계산 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

/**
 * 리뷰 이상 탐지
 * GET /api/review-analytics/anomalies?startDate=2024-01-01&endDate=2024-12-18
 */
router.get('/anomalies', async (req: Request, res: Response) => {
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
        const dateField = review.dt || review.created_at || review.review_date || review.date
        if (!dateField) return false
        const reviewDate = new Date(dateField)
        return reviewDate >= start && reviewDate <= end
      } catch {
        return false
      }
    })
    
    // 이전 30일 데이터 (기준선)
    const baselineStart = new Date(start.getTime() - 30 * 24 * 60 * 60 * 1000)
    const baselineReviews = reviewData.filter((review: any) => {
      try {
        const dateField = review.dt || review.created_at || review.review_date || review.date
        if (!dateField) return false
        const reviewDate = new Date(dateField)
        return reviewDate >= baselineStart && reviewDate < start
      } catch {
        return false
      }
    })
    
    const anomalies: any[] = []
    
    // 1. 전체 평점 이상 탐지
    const currentNPS = calculateNPS(filteredReviews)
    const baselineNPS = calculateNPS(baselineReviews)
    
    if (baselineNPS.total > 0 && currentNPS.total > 0) {
      const ratingDeviation = baselineNPS.avgRating > 0 
        ? ((currentNPS.avgRating - baselineNPS.avgRating) / baselineNPS.avgRating) * 100 
        : 0
      
      if (ratingDeviation < -15) {
        anomalies.push({
          type: 'critical',
          target: 'overall',
          targetName: null,
          metric: 'rating',
          currentValue: currentNPS.avgRating,
          expectedValue: baselineNPS.avgRating,
          deviation: ratingDeviation,
          affectedReviews: currentNPS.total,
          detectedAt: new Date().toISOString(),
          mainIssues: ['평점 급락 감지']
        })
      } else if (ratingDeviation < -10) {
        anomalies.push({
          type: 'warning',
          target: 'overall',
          targetName: null,
          metric: 'rating',
          currentValue: currentNPS.avgRating,
          expectedValue: baselineNPS.avgRating,
          deviation: ratingDeviation,
          affectedReviews: currentNPS.total,
          detectedAt: new Date().toISOString(),
          mainIssues: ['평점 하락 추세']
        })
      }
      
      // NPS 이상 탐지
      const npsDeviation = baselineNPS.score !== 0 
        ? ((currentNPS.score - baselineNPS.score) / Math.abs(baselineNPS.score)) * 100 
        : 0
      
      if (currentNPS.score - baselineNPS.score < -20) {
        anomalies.push({
          type: 'critical',
          target: 'overall',
          targetName: null,
          metric: 'nps',
          currentValue: currentNPS.score,
          expectedValue: baselineNPS.score,
          deviation: npsDeviation,
          affectedReviews: currentNPS.total,
          detectedAt: new Date().toISOString(),
          mainIssues: ['NPS 급락 감지']
        })
      }
    }
    
    // 2. 작가별 이상 탐지
    const artistReviews: Record<string, any[]> = {}
    const artistBaselineReviews: Record<string, any[]> = {}
    
    filteredReviews.forEach((review: any) => {
      const artist = review.artist_name || review.artistName || 'Unknown'
      if (!artistReviews[artist]) artistReviews[artist] = []
      artistReviews[artist].push(review)
    })
    
    baselineReviews.forEach((review: any) => {
      const artist = review.artist_name || review.artistName || 'Unknown'
      if (!artistBaselineReviews[artist]) artistBaselineReviews[artist] = []
      artistBaselineReviews[artist].push(review)
    })
    
    Object.keys(artistReviews).forEach((artist) => {
      if (artist === 'Unknown') return
      
      const currentArtist = calculateNPS(artistReviews[artist])
      const baselineArtist = artistBaselineReviews[artist] 
        ? calculateNPS(artistBaselineReviews[artist])
        : null
      
      if (baselineArtist && baselineArtist.total >= 5 && currentArtist.total >= 3) {
        const ratingDev = baselineArtist.avgRating > 0
          ? ((currentArtist.avgRating - baselineArtist.avgRating) / baselineArtist.avgRating) * 100
          : 0
        
        if (ratingDev < -20) {
          // 부정 리뷰 샘플 추출 (영어/일본어)
          const negativeReviews = artistReviews[artist]
            .filter((r: any) => safeNumber(r.rating || r.score, 0) <= 6)
            .slice(0, 3)
            .map((r: any) => ({
              content: r.contents || r.content || '',
              language: detectReviewLanguage(r.contents || r.content || ''),
              rating: safeNumber(r.rating || r.score, 0)
            }))
          
          anomalies.push({
            type: ratingDev < -30 ? 'critical' : 'warning',
            target: 'artist',
            targetId: artist,
            targetName: artist,
            metric: 'rating',
            currentValue: currentArtist.avgRating,
            expectedValue: baselineArtist.avgRating,
            deviation: ratingDev,
            affectedReviews: currentArtist.total,
            detectedAt: new Date().toISOString(),
            mainIssues: extractMainIssues(artistReviews[artist]),
            sampleReviews: negativeReviews
          })
        }
      }
    })
    
    // 우선순위 정렬 (critical > warning > info)
    const typeOrder = { critical: 0, warning: 1, info: 2 }
    anomalies.sort((a, b) => 
      (typeOrder[a.type as keyof typeof typeOrder] || 3) - 
      (typeOrder[b.type as keyof typeof typeOrder] || 3)
    )
    
    res.json({
      success: true,
      data: {
        referenceDate: endDate,
        anomalies: anomalies.slice(0, 10) // 최대 10개
      }
    })
  } catch (error: any) {
    console.error('[ReviewAnalytics] Anomaly detection failed:', error)
    res.status(500).json({
      success: false,
      error: '이상 탐지 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

/**
 * 주간 NPS 변화
 * GET /api/review-analytics/weekly-nps?endDate=2024-12-18
 */
router.get('/weekly-nps', async (req: Request, res: Response) => {
  try {
    const { endDate } = req.query
    
    if (!endDate) {
      return res.status(400).json({
        success: false,
        error: 'endDate가 필요합니다.'
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
    
    const end = new Date(endDate as string)
    end.setHours(23, 59, 59, 999)
    
    // 최근 7일 각 날짜별 NPS 계산
    const weeklyData: Array<{ date: string; nps: number; reviews: number }> = []
    
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(end)
      dayStart.setDate(dayStart.getDate() - i)
      dayStart.setHours(0, 0, 0, 0)
      
      const dayEnd = new Date(dayStart)
      dayEnd.setHours(23, 59, 59, 999)
      
      const dayReviews = reviewData.filter((review: any) => {
        try {
          const dateField = review.dt || review.created_at || review.review_date || review.date
          if (!dateField) return false
          const reviewDate = new Date(dateField)
          return reviewDate >= dayStart && reviewDate <= dayEnd
        } catch {
          return false
        }
      })
      
      const dayNPS = calculateNPS(dayReviews)
      
      weeklyData.push({
        date: dayStart.toISOString().split('T')[0],
        nps: dayNPS.score,
        reviews: dayNPS.total
      })
    }
    
    // 전체 7일 NPS
    const weekStart = new Date(end)
    weekStart.setDate(weekStart.getDate() - 6)
    weekStart.setHours(0, 0, 0, 0)
    
    const weekReviews = reviewData.filter((review: any) => {
      try {
        const dateField = review.dt || review.created_at || review.review_date || review.date
        if (!dateField) return false
        const reviewDate = new Date(dateField)
        return reviewDate >= weekStart && reviewDate <= end
      } catch {
        return false
      }
    })
    
    const weekNPS = calculateNPS(weekReviews)
    
    // 이전 7일 NPS (비교용)
    const prevWeekEnd = new Date(weekStart.getTime() - 1)
    const prevWeekStart = new Date(prevWeekEnd)
    prevWeekStart.setDate(prevWeekStart.getDate() - 6)
    prevWeekStart.setHours(0, 0, 0, 0)
    
    const prevWeekReviews = reviewData.filter((review: any) => {
      try {
        const dateField = review.dt || review.created_at || review.review_date || review.date
        if (!dateField) return false
        const reviewDate = new Date(dateField)
        return reviewDate >= prevWeekStart && reviewDate <= prevWeekEnd
      } catch {
        return false
      }
    })
    
    const prevWeekNPS = calculateNPS(prevWeekReviews)
    
    res.json({
      success: true,
      data: {
        period: {
          start: weekStart.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        },
        currentWeek: {
          nps: weekNPS.score,
          avgRating: weekNPS.avgRating.toFixed(2),
          totalReviews: weekNPS.total
        },
        previousWeek: {
          nps: prevWeekNPS.score,
          avgRating: prevWeekNPS.avgRating.toFixed(2),
          totalReviews: prevWeekNPS.total
        },
        change: weekNPS.score - prevWeekNPS.score,
        trend: weekNPS.score > prevWeekNPS.score ? 'up' : weekNPS.score < prevWeekNPS.score ? 'down' : 'stable',
        daily: weeklyData
      }
    })
  } catch (error: any) {
    console.error('[ReviewAnalytics] Weekly NPS failed:', error)
    res.status(500).json({
      success: false,
      error: '주간 NPS 조회 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

/**
 * 불만 패턴 분석
 * GET /api/review-analytics/complaint-patterns?startDate=2024-01-01&endDate=2024-12-18&limit=10
 */
router.get('/complaint-patterns', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, limit = '10' } = req.query
    
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
    
    // 부정 리뷰 필터링 (6점 이하 = Detractor)
    const negativeReviews = reviewData.filter((review: any) => {
      try {
        const dateField = review.dt || review.created_at || review.review_date || review.date
        if (!dateField) return false
        const reviewDate = new Date(dateField)
        if (reviewDate < start || reviewDate > end) return false
        
        const rating = safeNumber(review.rating || review.score, 0)
        return rating <= 6
      } catch {
        return false
      }
    })
    
    // 키워드 분석 (다국어 지원)
    const keywordPatterns: Record<string, {
      category: string
      keywords: { ja: string[], en: string[] }
      count: number
      reviews: any[]
    }> = {
      'delivery': {
        category: 'delivery',
        keywords: {
          ja: ['配送', '届く', '遅い', '遅れ', '到着', '発送'],
          en: ['delivery', 'shipping', 'arrived', 'late', 'slow', 'delayed']
        },
        count: 0,
        reviews: []
      },
      'quality': {
        category: 'quality',
        keywords: {
          ja: ['品質', '壊れ', '傷', '汚れ', '不良', '破損'],
          en: ['quality', 'broken', 'damaged', 'defect', 'poor', 'bad']
        },
        count: 0,
        reviews: []
      },
      'packaging': {
        category: 'packaging',
        keywords: {
          ja: ['梱包', '包装', '箱'],
          en: ['packaging', 'package', 'box', 'wrap']
        },
        count: 0,
        reviews: []
      },
      'size': {
        category: 'size',
        keywords: {
          ja: ['サイズ', '小さい', '大きい', '合わない'],
          en: ['size', 'small', 'big', 'large', 'fit']
        },
        count: 0,
        reviews: []
      },
      'color': {
        category: 'color',
        keywords: {
          ja: ['色', 'カラー', '違う色'],
          en: ['color', 'colour', 'different color']
        },
        count: 0,
        reviews: []
      },
      'different': {
        category: 'different',
        keywords: {
          ja: ['違う', '写真', '画像', 'イメージ'],
          en: ['different', 'photo', 'picture', 'image', 'expected']
        },
        count: 0,
        reviews: []
      },
      'price': {
        category: 'price',
        keywords: {
          ja: ['価格', '高い', '値段'],
          en: ['price', 'expensive', 'cost', 'overpriced']
        },
        count: 0,
        reviews: []
      },
      'service': {
        category: 'service',
        keywords: {
          ja: ['対応', 'サービス', '返答', '連絡'],
          en: ['service', 'response', 'support', 'contact', 'reply']
        },
        count: 0,
        reviews: []
      }
    }
    
    // 리뷰 분석
    negativeReviews.forEach((review: any) => {
      const content = (review.contents || review.content || '').toLowerCase()
      if (!content) return
      
      const lang = detectReviewLanguage(content)
      
      Object.entries(keywordPatterns).forEach(([key, pattern]) => {
        const keywords = lang === 'ja' ? pattern.keywords.ja : pattern.keywords.en
        const found = keywords.some(kw => content.includes(kw.toLowerCase()))
        
        if (found) {
          pattern.count++
          if (pattern.reviews.length < 5) {
            pattern.reviews.push({
              content: review.contents || review.content || '',
              language: lang,
              rating: safeNumber(review.rating || review.score, 0)
            })
          }
        }
      })
    })
    
    // 이전 기간 비교 (트렌드 계산용)
    const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const prevEnd = new Date(start.getTime() - 1)
    const prevStart = new Date(prevEnd.getTime() - ((days - 1) * 24 * 60 * 60 * 1000))
    
    const prevNegativeReviews = reviewData.filter((review: any) => {
      try {
        const dateField = review.dt || review.created_at || review.review_date || review.date
        if (!dateField) return false
        const reviewDate = new Date(dateField)
        if (reviewDate < prevStart || reviewDate > prevEnd) return false
        
        const rating = safeNumber(review.rating || review.score, 0)
        return rating <= 6
      } catch {
        return false
      }
    })
    
    // 이전 기간 키워드 카운트
    const prevCounts: Record<string, number> = {}
    Object.keys(keywordPatterns).forEach(key => prevCounts[key] = 0)
    
    prevNegativeReviews.forEach((review: any) => {
      const content = (review.contents || review.content || '').toLowerCase()
      if (!content) return
      
      const lang = detectReviewLanguage(content)
      
      Object.entries(keywordPatterns).forEach(([key, pattern]) => {
        const keywords = lang === 'ja' ? pattern.keywords.ja : pattern.keywords.en
        const found = keywords.some(kw => content.includes(kw.toLowerCase()))
        if (found) prevCounts[key]++
      })
    })
    
    // 결과 정렬 및 포맷
    const patterns = Object.entries(keywordPatterns)
      .filter(([_, p]) => p.count > 0)
      .map(([key, p]) => {
        const prevCount = prevCounts[key] || 0
        let trend: 'up' | 'stable' | 'down' = 'stable'
        
        if (prevCount > 0) {
          const changeRate = ((p.count - prevCount) / prevCount) * 100
          if (changeRate > 20) trend = 'up'
          else if (changeRate < -20) trend = 'down'
        } else if (p.count > 0) {
          trend = 'up'
        }
        
        // 키워드 라벨 (한국어)
        const labels: Record<string, string> = {
          delivery: '배송 지연',
          quality: '상품 품질',
          packaging: '포장 상태',
          size: '사이즈 불일치',
          color: '색상 차이',
          different: '사진과 다름',
          price: '가격 문제',
          service: '서비스 불만'
        }
        
        return {
          keyword: labels[key] || key,
          category: p.category,
          count: p.count,
          percentage: negativeReviews.length > 0 ? (p.count / negativeReviews.length) * 100 : 0,
          trend,
          sampleReviews: p.reviews
        }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, parseInt(limit as string))
    
    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        totalNegativeReviews: negativeReviews.length,
        patterns
      }
    })
  } catch (error: any) {
    console.error('[ReviewAnalytics] Complaint patterns failed:', error)
    res.status(500).json({
      success: false,
      error: '불만 패턴 분석 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

/**
 * 리뷰-재구매 상관 분석
 * GET /api/review-analytics/impact-analysis?startDate=2024-01-01&endDate=2024-12-18
 */
router.get('/impact-analysis', async (req: Request, res: Response) => {
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
    
    // 주문 데이터 로드 (재구매 분석용)
    let orderData: any[] = []
    try {
      orderData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.ORDER, true)
    } catch (error) {
      console.warn('[ReviewAnalytics] Order data not available for impact analysis')
    }
    
    const start = new Date(startDate as string)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate as string)
    end.setHours(23, 59, 59, 999)
    
    // 기간 내 리뷰 필터링
    const filteredReviews = reviewData.filter((review: any) => {
      try {
        const dateField = review.dt || review.created_at || review.review_date || review.date
        if (!dateField) return false
        const reviewDate = new Date(dateField)
        return reviewDate >= start && reviewDate <= end
      } catch {
        return false
      }
    })
    
    // 고객별 첫 리뷰 평점 및 재구매 여부 분석
    const customerReviews: Map<string, { rating: number; date: Date }> = new Map()
    const customerOrders: Map<string, Date[]> = new Map()
    
    // 리뷰 데이터에서 고객별 첫 리뷰 추출
    filteredReviews.forEach((review: any) => {
      const customerId = review.user_id || review.customer_id || review.email
      if (!customerId) return
      
      const rating = safeNumber(review.rating || review.score, 0)
      const dateField = review.dt || review.created_at || review.review_date || review.date
      const reviewDate = new Date(dateField)
      
      if (!customerReviews.has(customerId) || reviewDate < customerReviews.get(customerId)!.date) {
        customerReviews.set(customerId, { rating, date: reviewDate })
      }
    })
    
    // 주문 데이터에서 고객별 주문 날짜 추출
    orderData.forEach((order: any) => {
      const customerId = order.user_id || order.customer_id || order.email
      if (!customerId) return
      
      const dateField = order.order_created || order.created_at || order.date
      if (!dateField) return
      
      const orderDate = new Date(dateField)
      if (isNaN(orderDate.getTime())) return
      
      if (!customerOrders.has(customerId)) {
        customerOrders.set(customerId, [])
      }
      customerOrders.get(customerId)!.push(orderDate)
    })
    
    // 평점별 재구매율 계산
    const ratingStats: Record<number, { total: number; repurchased: number }> = {}
    for (let i = 1; i <= 10; i++) {
      ratingStats[i] = { total: 0, repurchased: 0 }
    }
    
    customerReviews.forEach((reviewInfo, customerId) => {
      const rating = Math.min(10, Math.max(1, Math.round(reviewInfo.rating)))
      ratingStats[rating].total++
      
      // 재구매 여부 확인 (리뷰 작성 후 추가 주문이 있는지)
      const orders = customerOrders.get(customerId) || []
      const hasRepurchase = orders.some(orderDate => orderDate > reviewInfo.date)
      
      if (hasRepurchase) {
        ratingStats[rating].repurchased++
      }
    })
    
    // 평점별 재구매율 데이터 생성
    const ratingRepurchase = Object.entries(ratingStats)
      .map(([rating, stats]) => ({
        rating: parseInt(rating),
        repurchaseRate: stats.total > 0 ? (stats.repurchased / stats.total) * 100 : 0,
        sampleSize: stats.total
      }))
      .sort((a, b) => a.rating - b.rating)
    
    // 상관계수 계산 (피어슨 상관계수)
    const validData = ratingRepurchase.filter(d => d.sampleSize > 0)
    let correlation = 0
    let pValue = 1
    
    if (validData.length >= 3) {
      const n = validData.length
      const sumX = validData.reduce((sum, d) => sum + d.rating, 0)
      const sumY = validData.reduce((sum, d) => sum + d.repurchaseRate, 0)
      const sumXY = validData.reduce((sum, d) => sum + d.rating * d.repurchaseRate, 0)
      const sumX2 = validData.reduce((sum, d) => sum + d.rating * d.rating, 0)
      const sumY2 = validData.reduce((sum, d) => sum + d.repurchaseRate * d.repurchaseRate, 0)
      
      const numerator = n * sumXY - sumX * sumY
      const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
      
      if (denominator > 0) {
        correlation = numerator / denominator
        
        // 간단한 p-value 근사 (t-분포 기반)
        const t = correlation * Math.sqrt((n - 2) / (1 - correlation * correlation))
        // 실제 p-value 계산은 복잡하므로 근사값 사용
        if (Math.abs(t) > 3.5) pValue = 0.001
        else if (Math.abs(t) > 2.5) pValue = 0.01
        else if (Math.abs(t) > 2) pValue = 0.05
        else pValue = 0.1
      }
    }
    
    // 인사이트 생성
    let insight = ''
    const promoterAvg = ratingRepurchase
      .filter(d => d.rating >= 9)
      .reduce((sum, d, _, arr) => sum + d.repurchaseRate / arr.length, 0)
    const detractorAvg = ratingRepurchase
      .filter(d => d.rating <= 6)
      .reduce((sum, d, _, arr) => sum + d.repurchaseRate / arr.length, 0)
    
    if (promoterAvg > 0 && detractorAvg > 0) {
      const ratio = promoterAvg / detractorAvg
      insight = `9점 이상 리뷰 고객의 재구매율이 6점 이하 고객 대비 ${ratio.toFixed(1)}배 높습니다. `
    }
    
    if (correlation > 0.5) {
      insight += '평점과 재구매율 사이에 강한 양의 상관관계가 있어, 리뷰 품질 관리가 매출에 직접적인 영향을 미칩니다.'
    } else if (correlation > 0.3) {
      insight += '평점과 재구매율 사이에 중간 정도의 상관관계가 있습니다.'
    }
    
    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        ratingRepurchase,
        correlation: Math.round(correlation * 100) / 100,
        pValue,
        insight: insight || '분석 데이터가 충분하지 않습니다.'
      }
    })
  } catch (error: any) {
    console.error('[ReviewAnalytics] Impact analysis failed:', error)
    res.status(500).json({
      success: false,
      error: '리뷰-재구매 상관 분석 중 오류가 발생했습니다.',
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

/**
 * 리뷰 언어 감지
 */
function detectReviewLanguage(text: string): 'ja' | 'en' {
  if (!text) return 'en'
  
  // 일본어 문자 (히라가나, 가타카나, 한자) 패턴
  const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/
  
  if (japanesePattern.test(text)) {
    return 'ja'
  }
  
  return 'en'
}

/**
 * 부정 리뷰에서 주요 불만 사항 추출 (간단 버전)
 */
function extractMainIssues(reviews: any[]): string[] {
  const issues: string[] = []
  const keywords: Record<string, number> = {}
  
  // 부정 리뷰만 필터링 (6점 이하)
  const negativeReviews = reviews.filter((r: any) => 
    safeNumber(r.rating || r.score, 0) <= 6
  )
  
  // 키워드 빈도 계산 (영어/일본어)
  const issueKeywords = {
    delivery: ['delivery', 'shipping', 'arrived', 'late', 'slow', '配送', '届く', '遅い', '배송'],
    quality: ['quality', 'broken', 'damaged', 'defect', '品質', '壊れ', '傷', '품질'],
    packaging: ['packaging', 'package', 'box', '梱包', '包装', '포장'],
    size: ['size', 'small', 'big', 'サイズ', '小さい', '大きい', '사이즈'],
    color: ['color', 'colour', '色', '색상'],
    different: ['different', 'photo', 'picture', '違う', '写真', '다른', '사진'],
  }
  
  negativeReviews.forEach((review: any) => {
    const content = (review.contents || review.content || '').toLowerCase()
    
    Object.entries(issueKeywords).forEach(([category, words]) => {
      words.forEach((word) => {
        if (content.includes(word.toLowerCase())) {
          keywords[category] = (keywords[category] || 0) + 1
        }
      })
    })
  })
  
  // 빈도순 정렬 후 상위 3개 추출
  const issueLabels: Record<string, string> = {
    delivery: '배송 지연',
    quality: '상품 품질',
    packaging: '포장 상태',
    size: '사이즈 불일치',
    color: '색상 차이',
    different: '사진과 다름',
  }
  
  Object.entries(keywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .forEach(([key]) => {
      if (issueLabels[key]) {
        issues.push(issueLabels[key])
      }
    })
  
  return issues.length > 0 ? issues : ['기타 불만']
}

export default router

