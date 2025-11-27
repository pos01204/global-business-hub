import express from 'express'
import { PerformanceMetrics } from '../types/performance'

const router = express.Router()

// 인메모리 성과 데이터 저장소 (실제로는 데이터베이스 사용 권장)
let performanceData: PerformanceMetrics[] = []

// 콘텐츠별 성과 조회
router.get('/:contentId', (req, res) => {
  try {
    const { contentId } = req.params
    const metrics = performanceData.filter((m) => m.contentId === contentId)

    if (metrics.length === 0) {
      return res.json({
        success: true,
        data: {
          contentId,
          title: '콘텐츠',
          totalViews: 0,
          totalEngagement: 0,
          totalConversions: 0,
          averageEngagementRate: 0,
          metrics: [],
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        },
      })
    }

    const totalViews = metrics.reduce((sum, m) => sum + m.views, 0)
    const totalEngagement = metrics.reduce((sum, m) => sum + m.engagement, 0)
    const totalConversions = metrics.reduce((sum, m) => sum + m.conversions, 0)
    const averageEngagementRate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0

    res.json({
      success: true,
      data: {
        contentId,
        title: '콘텐츠',
        totalViews,
        totalEngagement,
        totalConversions,
        averageEngagementRate: Math.round(averageEngagementRate * 100) / 100,
        metrics: metrics.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        createdAt: metrics[metrics.length - 1]?.date || new Date().toISOString(),
        lastUpdated: metrics[0]?.date || new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('성과 조회 오류:', error)
    res.status(500).json({
      success: false,
      error: '성과 데이터를 불러오는 중 오류가 발생했습니다.',
    })
  }
})

// 성과 데이터 추가 (시뮬레이션용)
router.post('/', (req, res) => {
  try {
    const { contentId, views, engagement, conversions, platform, date } = req.body

    if (!contentId) {
      return res.status(400).json({
        success: false,
        error: 'contentId가 필요합니다.',
      })
    }

    const metric: PerformanceMetrics = {
      contentId,
      date: date || new Date().toISOString(),
      views: views || 0,
      engagement: engagement || 0,
      conversions: conversions || 0,
      platform: platform || 'unknown',
    }

    performanceData.push(metric)

    res.json({
      success: true,
      data: metric,
      message: '성과 데이터가 추가되었습니다.',
    })
  } catch (error) {
    console.error('성과 데이터 추가 오류:', error)
    res.status(500).json({
      success: false,
      error: '성과 데이터 추가 중 오류가 발생했습니다.',
    })
  }
})

// 성과 리포트 생성
router.get('/report/summary', (req, res) => {
  try {
    const { startDate, endDate } = req.query

    let filteredData = performanceData

    if (startDate || endDate) {
      filteredData = performanceData.filter((m) => {
        const metricDate = new Date(m.date)
        if (startDate && metricDate < new Date(startDate as string)) return false
        if (endDate && metricDate > new Date(endDate as string)) return false
        return true
      })
    }

    // 콘텐츠별 집계
    const contentMap = new Map<string, PerformanceMetrics[]>()
    filteredData.forEach((metric) => {
      const existing = contentMap.get(metric.contentId) || []
      existing.push(metric)
      contentMap.set(metric.contentId, existing)
    })

    const summary = Array.from(contentMap.entries()).map(([contentId, metrics]) => {
      const totalViews = metrics.reduce((sum, m) => sum + m.views, 0)
      const totalEngagement = metrics.reduce((sum, m) => sum + m.engagement, 0)
      const totalConversions = metrics.reduce((sum, m) => sum + m.conversions, 0)
      const averageEngagementRate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0

      return {
        contentId,
        totalViews,
        totalEngagement,
        totalConversions,
        averageEngagementRate: Math.round(averageEngagementRate * 100) / 100,
        metricCount: metrics.length,
      }
    })

    // 전체 집계
    const totalViews = filteredData.reduce((sum, m) => sum + m.views, 0)
    const totalEngagement = filteredData.reduce((sum, m) => sum + m.engagement, 0)
    const totalConversions = filteredData.reduce((sum, m) => sum + m.conversions, 0)
    const overallEngagementRate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0

    res.json({
      success: true,
      data: {
        summary,
        overall: {
          totalViews,
          totalEngagement,
          totalConversions,
          averageEngagementRate: Math.round(overallEngagementRate * 100) / 100,
          contentCount: contentMap.size,
        },
        period: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
      },
    })
  } catch (error) {
    console.error('성과 리포트 생성 오류:', error)
    res.status(500).json({
      success: false,
      error: '성과 리포트 생성 중 오류가 발생했습니다.',
    })
  }
})

export default router





