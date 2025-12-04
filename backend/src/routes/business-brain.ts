/**
 * Business Brain API 라우트
 * 기존 라우트와 독립적으로 동작
 */

import { Router } from 'express'
import { BusinessBrainAgent } from '../services/agents/BusinessBrainAgent'
import { businessBrainCache } from '../services/analytics'

const router = Router()

/**
 * GET /api/business-brain/briefing
 * 경영 브리핑 조회
 */
router.get('/briefing', async (req, res) => {
  try {
    console.log('[BusinessBrain] 브리핑 요청')
    
    const agent = new BusinessBrainAgent()
    const briefing = await agent.generateExecutiveBriefing()
    
    res.json({
      success: true,
      briefing,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[BusinessBrain] 브리핑 오류:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || '브리핑 생성 중 오류가 발생했습니다.',
    })
  }
})

/**
 * GET /api/business-brain/health-score
 * 비즈니스 건강도 점수
 */
router.get('/health-score', async (req, res) => {
  try {
    console.log('[BusinessBrain] 건강도 점수 요청')
    
    const agent = new BusinessBrainAgent()
    const score = await agent.calculateHealthScore()
    
    res.json({
      success: true,
      score,
      calculatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[BusinessBrain] 건강도 점수 오류:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || '건강도 점수 계산 중 오류가 발생했습니다.',
    })
  }
})

/**
 * GET /api/business-brain/insights
 * 인사이트 목록
 */
router.get('/insights', async (req, res) => {
  try {
    console.log('[BusinessBrain] 인사이트 요청')
    
    const { type, limit = 20 } = req.query
    
    const agent = new BusinessBrainAgent()
    let insights = await agent.discoverInsights()
    
    // 타입 필터링
    if (type) {
      insights = insights.filter(i => i.type === type)
    }
    
    // 정렬 및 제한
    insights = insights
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, Number(limit))
    
    res.json({
      success: true,
      insights,
      total: insights.length,
    })
  } catch (error: any) {
    console.error('[BusinessBrain] 인사이트 오류:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || '인사이트 조회 중 오류가 발생했습니다.',
    })
  }
})

/**
 * GET /api/business-brain/decomposition
 * 매출 변화 분해 분석
 */
router.get('/decomposition', async (req, res) => {
  try {
    console.log('[BusinessBrain] 분해 분석 요청')
    
    const { startDate, endDate, compareWith = 'previous' } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate와 endDate가 필요합니다.',
      })
    }
    
    const agent = new BusinessBrainAgent()
    const decomposition = await agent.decomposeRevenueChange(
      startDate as string,
      endDate as string,
      compareWith as string
    )
    
    res.json({
      success: true,
      decomposition,
    })
  } catch (error: any) {
    console.error('[BusinessBrain] 분해 분석 오류:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || '분해 분석 중 오류가 발생했습니다.',
    })
  }
})

/**
 * GET /api/business-brain/cube
 * N차원 큐브 분석 결과
 */
router.get('/cube', async (req, res) => {
  try {
    console.log('[BusinessBrain] 큐브 분석 요청')
    
    const { dimensions, metrics, startDate, endDate } = req.query
    
    const agent = new BusinessBrainAgent()
    const cubeResult = await agent.runCubeAnalysis({
      dimensions: (dimensions as string)?.split(',') || ['country', 'platform'],
      metrics: (metrics as string)?.split(',') || ['gmv', 'orders'],
      dateRange: startDate && endDate ? { 
        start: startDate as string, 
        end: endDate as string 
      } : undefined,
    })
    
    res.json({
      success: true,
      result: cubeResult,
    })
  } catch (error: any) {
    console.error('[BusinessBrain] 큐브 분석 오류:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || '큐브 분석 중 오류가 발생했습니다.',
    })
  }
})

/**
 * POST /api/business-brain/chat
 * Business Brain과 채팅
 */
router.post('/chat', async (req, res) => {
  try {
    const { query, context } = req.body
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: '질문이 필요합니다.',
      })
    }
    
    const agent = new BusinessBrainAgent(context)
    const response = await agent.process(query, context)
    
    res.json({
      success: true,
      ...response,
    })
  } catch (error: any) {
    console.error('[BusinessBrain] 채팅 오류:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || '처리 중 오류가 발생했습니다.',
    })
  }
})

/**
 * GET /api/business-brain/human-error-checks
 * 휴먼 에러 체크 결과
 */
router.get('/human-error-checks', async (_req, res) => {
  try {
    console.log('[BusinessBrain] 휴먼 에러 체크 요청')
    
    const agent = new BusinessBrainAgent()
    const result = await agent.runHumanErrorChecks()
    
    res.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('[BusinessBrain] 휴먼 에러 체크 오류:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || '휴먼 에러 체크 중 오류가 발생했습니다.',
    })
  }
})

/**
 * GET /api/business-brain/trends
 * 장기 트렌드 분석
 */
router.get('/trends', async (_req, res) => {
  try {
    console.log('[BusinessBrain] 트렌드 분석 요청')
    
    const agent = new BusinessBrainAgent()
    const result = await agent.analyzeLongTermTrends()
    
    res.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('[BusinessBrain] 트렌드 분석 오류:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || '트렌드 분석 중 오류가 발생했습니다.',
    })
  }
})

/**
 * GET /api/business-brain/recommendations
 * 전략 제안
 */
router.get('/recommendations', async (_req, res) => {
  try {
    console.log('[BusinessBrain] 전략 제안 요청')
    
    const agent = new BusinessBrainAgent()
    const result = await agent.generateStrategicRecommendations()
    
    res.json({
      success: true,
      recommendations: result,
    })
  } catch (error: any) {
    console.error('[BusinessBrain] 전략 제안 오류:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || '전략 제안 생성 중 오류가 발생했습니다.',
    })
  }
})

/**
 * GET /api/business-brain/cache/stats
 * 캐시 통계 (개발용)
 */
router.get('/cache/stats', async (_req, res) => {
  try {
    const stats = businessBrainCache.getStats()
    res.json({
      success: true,
      stats,
    })
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      error: error.message,
    })
  }
})

/**
 * DELETE /api/business-brain/cache
 * 캐시 클리어 (개발용)
 */
router.delete('/cache', async (req, res) => {
  try {
    const { pattern } = req.query
    
    if (pattern) {
      const count = businessBrainCache.invalidate(pattern as string)
      res.json({
        success: true,
        message: `${count}개 캐시 항목이 삭제되었습니다.`,
      })
    } else {
      businessBrainCache.clear()
      res.json({
        success: true,
        message: '모든 캐시가 클리어되었습니다.',
      })
    }
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      error: error.message,
    })
  }
})

export default router
