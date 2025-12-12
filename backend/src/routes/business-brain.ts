/**
 * Business Brain API 라우트
 * 기존 라우트와 독립적으로 동작
 */

import { Router } from 'express'
import { BusinessBrainAgent } from '../services/agents/BusinessBrainAgent'
import { businessBrainCache } from '../services/analytics'
import { mapActionsToInsights } from '../services/analytics/InsightActionMapper'
import { exportData, getSupportedExportTypes, ExportType } from '../services/analytics/ExportService'
import { ChurnPredictor } from '../services/analytics/ChurnPredictor'
import { ArtistHealthCalculator } from '../services/analytics/ArtistHealthCalculator'
import { NewUserAcquisitionAnalyzer } from '../services/analytics/NewUserAcquisitionAnalyzer'
import { RepurchaseAnalyzer } from '../services/analytics/RepurchaseAnalyzer'
import { enhancedAgentOrchestrator } from '../services/agents/EnhancedAgentOrchestrator'
import { WhatIfSimulator, SimulationScenario } from '../services/analytics/WhatIfSimulator'
import { DataProcessor } from '../services/analytics/DataProcessor'
import { ReportGenerator, ReportOptions } from '../services/analytics/ReportGenerator'

const router = Router()

/**
 * GET /api/business-brain/briefing
 * 경영 브리핑 조회
 * Query: period (7d, 30d, 90d, 180d, 365d)
 */
router.get('/briefing', async (req, res) => {
  try {
    const { period = '30d' } = req.query
    console.log(`[BusinessBrain] 브리핑 요청 (${period})`)
    
    const agent = new BusinessBrainAgent()
    const briefing = await agent.generateExecutiveBriefing(period as any)
    
    res.json({
      success: true,
      briefing,
      period,
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
 * Query: period (7d, 30d, 90d, 180d, 365d)
 */
router.get('/health-score', async (req, res) => {
  try {
    const { period = '30d' } = req.query
    console.log(`[BusinessBrain] 건강도 점수 요청 (${period})`)
    
    const agent = new BusinessBrainAgent()
    const score = await agent.calculateHealthScore(period as any)
    
    res.json({
      success: true,
      score,
      period,
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
 * 인사이트 목록 (v4.0: 액션 매핑 포함)
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
    
    // v4.0: 액션 매핑 추가
    const insightsWithActions = mapActionsToInsights(insights)
    
    res.json({
      success: true,
      insights: insightsWithActions,
      total: insightsWithActions.length,
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
 * Query: period (7d, 30d, 90d, 180d, 365d)
 */
router.get('/trends', async (req, res) => {
  try {
    const { period = '90d' } = req.query
    console.log(`[BusinessBrain] 트렌드 분석 요청 (${period})`)
    
    const agent = new BusinessBrainAgent()
    const result = await agent.analyzeLongTermTrends(period as any)
    
    res.json({
      success: true,
      period,
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

// ==================== 새로운 고급 분석 API ====================

/**
 * GET /api/business-brain/cohort
 * 코호트 분석 결과
 */
router.get('/cohort', async (_req, res) => {
  try {
    console.log('[BusinessBrain] 코호트 분석 요청')
    
    const agent = new BusinessBrainAgent()
    const result = await agent.runCohortAnalysis()
    
    res.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('[BusinessBrain] 코호트 분석 오류:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || '코호트 분석 중 오류가 발생했습니다.',
    })
  }
})

/**
 * GET /api/business-brain/rfm
 * RFM 세분화 분석 결과
 */
router.get('/rfm', async (_req, res) => {
  try {
    console.log('[BusinessBrain] RFM 분석 요청')
    
    const agent = new BusinessBrainAgent()
    const result = await agent.runRFMAnalysis()
    
    res.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('[BusinessBrain] RFM 분석 오류:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || 'RFM 분석 중 오류가 발생했습니다.',
    })
  }
})

/**
 * GET /api/business-brain/pareto
 * 파레토 분석 결과
 */
router.get('/pareto', async (_req, res) => {
  try {
    console.log('[BusinessBrain] 파레토 분석 요청')
    
    const agent = new BusinessBrainAgent()
    const result = await agent.runParetoAnalysis()
    
    res.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('[BusinessBrain] 파레토 분석 오류:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || '파레토 분석 중 오류가 발생했습니다.',
    })
  }
})

/**
 * GET /api/business-brain/correlation
 * 상관관계 분석 결과
 */
router.get('/correlation', async (_req, res) => {
  try {
    console.log('[BusinessBrain] 상관관계 분석 요청')
    
    const agent = new BusinessBrainAgent()
    const result = await agent.runCorrelationAnalysis()
    
    res.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('[BusinessBrain] 상관관계 분석 오류:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || '상관관계 분석 중 오류가 발생했습니다.',
    })
  }
})

/**
 * GET /api/business-brain/anomaly
 * 이상 탐지 결과
 */
router.get('/anomaly', async (req, res) => {
  try {
    console.log('[BusinessBrain] 이상 탐지 요청')
    
    const sensitivity = (req.query.sensitivity as 'low' | 'medium' | 'high') || 'medium'
    
    const agent = new BusinessBrainAgent()
    const result = await agent.runAnomalyDetection(sensitivity)
    
    res.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('[BusinessBrain] 이상 탐지 오류:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || '이상 탐지 중 오류가 발생했습니다.',
    })
  }
})

/**
 * GET /api/business-brain/timeseries
 * 시계열 분석 결과
 */
router.get('/timeseries', async (_req, res) => {
  try {
    console.log('[BusinessBrain] 시계열 분석 요청')
    
    const agent = new BusinessBrainAgent()
    const result = await agent.runTimeSeriesAnalysis()
    
    res.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('[BusinessBrain] 시계열 분석 오류:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || '시계열 분석 중 오류가 발생했습니다.',
    })
  }
})

/**
 * GET /api/business-brain/advanced
 * 종합 고급 분석 결과 (모든 분석 통합)
 */
router.get('/advanced', async (_req, res) => {
  try {
    console.log('[BusinessBrain] 종합 고급 분석 요청')
    
    const agent = new BusinessBrainAgent()
    const result = await agent.runAdvancedAnalytics()
    
    res.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('[BusinessBrain] 종합 고급 분석 오류:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || '종합 고급 분석 중 오류가 발생했습니다.',
    })
  }
})

// ==================== 기간별 분석 API (v2.1) ====================

/**
 * GET /api/business-brain/analysis/:type
 * 기간별 분석 (rfm, pareto, cohort, anomaly, timeseries)
 * Query: period (7d, 30d, 90d, 180d, 365d), startDate, endDate (custom)
 */
router.get('/analysis/:type', async (req, res) => {
  try {
    const { type } = req.params
    const { period = '30d', startDate, endDate } = req.query

    console.log(`[BusinessBrain] 기간별 ${type} 분석 요청 (${period})`)
    
    const validTypes = ['rfm', 'pareto', 'cohort', 'anomaly', 'timeseries']
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `유효하지 않은 분석 유형입니다. 허용: ${validTypes.join(', ')}`,
      })
    }

    const agent = new BusinessBrainAgent()
    const customRange = startDate && endDate 
      ? { start: startDate as string, end: endDate as string }
      : undefined
    
    const result = await agent.runAnalysisWithPeriod(
      type as any,
      period as any,
      customRange
    )
    
    res.json({
      success: true,
      analysisType: type,
      ...result,
    })
  } catch (error: any) {
    console.error(`[BusinessBrain] 기간별 분석 오류:`, error)
    res.status(500).json({ 
      success: false,
      error: error.message || '기간별 분석 중 오류가 발생했습니다.',
    })
  }
})

/**
 * GET /api/business-brain/forecast
 * 매출 예측
 * Query: period (기본 90d), forecastDays (기본 30)
 */
router.get('/forecast', async (req, res) => {
  try {
    const { period = '90d', forecastDays = '30', startDate, endDate } = req.query

    console.log(`[BusinessBrain] 예측 요청 (${period}, ${forecastDays}일)`)
    
    const agent = new BusinessBrainAgent()
    const customRange = startDate && endDate 
      ? { start: startDate as string, end: endDate as string }
      : undefined
    
    const result = await agent.runForecast(
      period as any,
      parseInt(forecastDays as string, 10),
      customRange
    )
    
    res.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('[BusinessBrain] 예측 오류:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || '예측 중 오류가 발생했습니다.',
    })
  }
})

/**
 * GET /api/business-brain/compare
 * 기간 비교 분석
 * Query: period1Start, period1End, period2Start, period2End
 */
router.get('/compare', async (req, res) => {
  try {
    const { period1Start, period1End, period2Start, period2End, period1Label, period2Label } = req.query

    if (!period1Start || !period1End || !period2Start || !period2End) {
      return res.status(400).json({
        success: false,
        error: '두 기간의 시작일과 종료일이 모두 필요합니다.',
      })
    }

    console.log(`[BusinessBrain] 기간 비교 요청`)
    
    const agent = new BusinessBrainAgent()
    const result = await agent.runPeriodComparison(
      { start: period1Start as string, end: period1End as string },
      { start: period2Start as string, end: period2End as string },
      period1Label as string,
      period2Label as string
    )
    
    res.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('[BusinessBrain] 기간 비교 오류:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || '기간 비교 중 오류가 발생했습니다.',
    })
  }
})

/**
 * GET /api/business-brain/multi-period
 * 다중 기간 트렌드 분석
 * Query: periodType (weekly, monthly, quarterly), numPeriods
 */
router.get('/multi-period', async (req, res) => {
  try {
    const { periodType = 'monthly', numPeriods = '6' } = req.query

    console.log(`[BusinessBrain] 다중 기간 분석 요청 (${periodType}, ${numPeriods}개)`)
    
    const validTypes = ['weekly', 'monthly', 'quarterly']
    if (!validTypes.includes(periodType as string)) {
      return res.status(400).json({
        success: false,
        error: `유효하지 않은 기간 유형입니다. 허용: ${validTypes.join(', ')}`,
      })
    }

    const agent = new BusinessBrainAgent()
    const result = await agent.runMultiPeriodAnalysis(
      periodType as any,
      parseInt(numPeriods as string, 10)
    )
    
    res.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('[BusinessBrain] 다중 기간 분석 오류:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || '다중 기간 분석 중 오류가 발생했습니다.',
    })
  }
})

/**
 * GET /api/business-brain/comprehensive
 * 종합 인사이트 분석 (기간 기반)
 * Query: period (7d, 30d, 90d, 180d, 365d)
 */
router.get('/comprehensive', async (req, res) => {
  try {
    const { period = '30d', startDate, endDate } = req.query

    console.log(`[BusinessBrain] 종합 인사이트 분석 요청 (${period})`)
    
    const agent = new BusinessBrainAgent()
    const customRange = startDate && endDate 
      ? { start: startDate as string, end: endDate as string }
      : undefined
    
    const result = await agent.runComprehensiveAnalysis(
      period as any,
      customRange
    )
    
    res.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('[BusinessBrain] 종합 인사이트 분석 오류:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || '종합 인사이트 분석 중 오류가 발생했습니다.',
    })
  }
})

/**
 * GET /api/business-brain/strategy-analysis
 * 전략 분석 조회 (v4.2 Phase 3)
 * 시장 분석, 성장 기회, 위험 요소 분석
 * Query: period (7d, 30d, 90d, 180d, 365d)
 */
router.get('/strategy-analysis', async (req, res) => {
  try {
    const { period = '90d' } = req.query
    console.log(`[BusinessBrain] 전략 분석 요청 (${period})`)
    
    const agent = new BusinessBrainAgent()
    const result = await agent.analyzeStrategy(period as any)
    
    res.json({
      success: true,
      ...result,
      period,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[BusinessBrain] 전략 분석 오류:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || '전략 분석 중 오류가 발생했습니다.',
    })
  }
})

/**
 * GET /api/business-brain/action-proposals
 * 액션 제안 조회 (v4.2 Phase 3)
 * 우선순위별 액션, 예상 효과, 실행 계획
 * Query: period (7d, 30d, 90d, 180d, 365d)
 */
router.get('/action-proposals', async (req, res) => {
  try {
    const { period = '90d' } = req.query
    console.log(`[BusinessBrain] 액션 제안 요청 (${period})`)
    
    const agent = new BusinessBrainAgent()
    const result = await agent.generateActionProposals(period as any)
    
    res.json({
      success: true,
      ...result,
      period,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[BusinessBrain] 액션 제안 오류:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || '액션 제안 생성 중 오류가 발생했습니다.',
    })
  }
})

// ==================== v4.0: 데이터 내보내기 API ====================

/**
 * GET /api/business-brain/export/types
 * 지원하는 내보내기 유형 목록
 */
router.get('/export/types', async (req, res) => {
  try {
    const types = getSupportedExportTypes()
    res.json({
      success: true,
      types,
    })
  } catch (error: any) {
    console.error('[BusinessBrain] 내보내기 유형 조회 오류:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || '내보내기 유형 조회 중 오류가 발생했습니다.',
    })
  }
})

/**
 * GET /api/business-brain/export/:type
 * 데이터 내보내기 (CSV)
 * Params: type - 내보내기 유형
 * Query: period, segment, format
 */
router.get('/export/:type', async (req, res) => {
  try {
    const { type } = req.params
    const { period = '30d', segment, format = 'csv' } = req.query

    console.log(`[BusinessBrain] 데이터 내보내기 요청: ${type} (${period})`)
    
    const result = await exportData(type as ExportType, {
      period: period as string,
      segment: segment as string | undefined,
      format: format as 'csv' | 'json'
    })
    
    // CSV 다운로드로 응답
    res.setHeader('Content-Type', result.contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
    res.send('\uFEFF' + result.data) // BOM 추가 (Excel 한글 호환)
    
  } catch (error: any) {
    console.error('[BusinessBrain] 데이터 내보내기 오류:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || '데이터 내보내기 중 오류가 발생했습니다.',
    })
  }
})

// ==================== v4.0: 고객 이탈 예측 API ====================

/**
 * GET /api/business-brain/churn-prediction
 * 고객 이탈 예측 목록
 * Query: period, minOrders, riskLevel
 */
router.get('/churn-prediction', async (req, res) => {
  try {
    const { period = '90d', minOrders = '2', riskLevel } = req.query

    console.log(`[BusinessBrain] 이탈 예측 요청 (${period})`)
    
    const predictor = new ChurnPredictor()
    const result = await predictor.predictChurn(
      period as any,
      {
        minOrders: parseInt(minOrders as string, 10),
        riskLevelFilter: riskLevel ? (riskLevel as string).split(',') : undefined
      }
    )
    
    res.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('[BusinessBrain] 이탈 예측 오류:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || '이탈 예측 중 오류가 발생했습니다.',
    })
  }
})

/**
 * GET /api/business-brain/churn-prediction/:customerId
 * 특정 고객 이탈 예측 상세
 */
router.get('/churn-prediction/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params

    console.log(`[BusinessBrain] 고객 이탈 예측 상세 요청: ${customerId}`)
    
    const predictor = new ChurnPredictor()
    const prediction = await predictor.predictCustomerChurn(customerId)
    
    if (!prediction) {
      return res.status(404).json({
        success: false,
        error: '해당 고객을 찾을 수 없습니다.',
      })
    }
    
    res.json({
      success: true,
      prediction,
    })
  } catch (error: any) {
    console.error('[BusinessBrain] 고객 이탈 예측 오류:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || '고객 이탈 예측 중 오류가 발생했습니다.',
    })
  }
})

// ==================== v4.0: 작가 건강도 API ====================

/**
 * GET /api/business-brain/artist-health
 * 작가 건강도 목록
 * Query: period, tier
 */
router.get('/artist-health', async (req, res) => {
  try {
    const { period = '90d', tier } = req.query

    console.log(`[BusinessBrain] 작가 건강도 요청 (${period})`)
    
    const calculator = new ArtistHealthCalculator()
    const result = await calculator.calculateAllArtistHealth(period as any)
    
    // 티어 필터링
    if (tier) {
      const tiers = (tier as string).split(',')
      result.artists = result.artists.filter(a => tiers.includes(a.tier))
    }
    
    res.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('[BusinessBrain] 작가 건강도 오류:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || '작가 건강도 계산 중 오류가 발생했습니다.',
    })
  }
})

/**
 * GET /api/business-brain/artist-health/:artistId
 * 특정 작가 건강도 상세
 */
router.get('/artist-health/:artistId', async (req, res) => {
  try {
    const { artistId } = req.params

    console.log(`[BusinessBrain] 작가 건강도 상세 요청: ${artistId}`)
    
    const calculator = new ArtistHealthCalculator()
    const artist = await calculator.getArtistHealth(artistId)
    
    if (!artist) {
      return res.status(404).json({
        success: false,
        error: '해당 작가를 찾을 수 없습니다.',
      })
    }
    
    res.json({
      success: true,
      artist,
    })
  } catch (error: any) {
    console.error('[BusinessBrain] 작가 건강도 상세 오류:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || '작가 건강도 조회 중 오류가 발생했습니다.',
    })
  }
})

// ==================== v4.1: 신규 유저 유치 분석 API ====================

/**
 * GET /api/business-brain/new-user-acquisition
 * 신규 유저 유치 분석
 * Query: period (30d, 90d, 180d, 365d)
 */
router.get('/new-user-acquisition', async (req, res) => {
  try {
    const { period = '90d' } = req.query

    console.log(`[BusinessBrain] 신규 유저 유치 분석 요청 (${period})`)
    
    const analyzer = new NewUserAcquisitionAnalyzer()
    const result = await analyzer.analyze(period as any)
    
    res.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('[BusinessBrain] 신규 유저 유치 분석 오류:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || '신규 유저 유치 분석 중 오류가 발생했습니다.',
    })
  }
})

// ==================== v4.1: 재구매율 향상 분석 API ====================

/**
 * GET /api/business-brain/repurchase-analysis
 * 재구매율 향상 분석
 * Query: period (30d, 90d, 180d, 365d)
 */
router.get('/repurchase-analysis', async (req, res) => {
  try {
    const { period = '90d' } = req.query

    console.log(`[BusinessBrain] 재구매율 향상 분석 요청 (${period})`)
    
    const analyzer = new RepurchaseAnalyzer()
    const result = await analyzer.analyze(period as any)
    
    res.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('[BusinessBrain] 재구매율 향상 분석 오류:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || '재구매율 향상 분석 중 오류가 발생했습니다.',
    })
  }
})

// ==================== v4.1: 시계열 분해 분석 API ====================

/**
 * GET /api/business-brain/time-series-decompose
 * 시계열 분해 분석 (STL 분해: 계절성 + 추세 + 잔차)
 * Query: period (30d, 90d, 180d, 365d), metric (gmv, orders, aov), periodType (optional)
 */
router.get('/time-series-decompose', async (req, res) => {
  try {
    const { period = '90d', metric = 'gmv', periodType } = req.query

    console.log(`[BusinessBrain] 시계열 분해 분석 요청 (${period}, ${metric})`)
    
    const agent = new BusinessBrainAgent()
    const result = await agent.decomposeTimeSeries(
      period as any,
      metric as 'gmv' | 'orders' | 'aov',
      periodType ? parseInt(periodType as string) : undefined
    )
    
    res.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('[BusinessBrain] 시계열 분해 분석 오류:', error)
    res.status(500).json({ 
      success: false,
      error: error.message || '시계열 분해 분석 중 오류가 발생했습니다.',
    })
  }
})

/**
 * POST /api/business-brain/orchestrate
 * v4.2: Enhanced Agent Orchestrator를 사용한 복잡한 질문 처리
 */
router.post('/orchestrate', async (req, res) => {
  try {
    const { query } = req.body
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'query 파라미터가 필요합니다.'
      })
    }

    console.log(`[BusinessBrain] 복잡한 질문 처리 요청: "${query}"`)
    
    const result = await enhancedAgentOrchestrator.orchestrateComplexQuery(query, {
      userId: req.body.userId,
      sessionId: req.body.sessionId
    })
    
    res.json({
      success: true,
      result,
      query,
      processedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[BusinessBrain] 오케스트레이션 오류:', error)
    res.status(500).json({
      success: false,
      error: error.message || '질문 처리 중 오류가 발생했습니다.',
    })
  }
})

/**
 * POST /api/business-brain/what-if/simulate
 * What-if 시뮬레이션 실행 (v4.3)
 */
router.post('/what-if/simulate', async (req, res) => {
  try {
    const { scenario, period } = req.body
    
    if (!scenario || !period) {
      return res.status(400).json({
        success: false,
        error: 'scenario와 period 파라미터가 필요합니다.'
      })
    }

    console.log(`[BusinessBrain] What-if 시뮬레이션 요청: ${scenario.name}`)
    
    const simulator = new WhatIfSimulator()
    const dateRange = DataProcessor.getDateRangeFromPreset(period as any)
    const result = await simulator.simulate(scenario as SimulationScenario, dateRange)
    
    res.json({
      success: true,
      result,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[BusinessBrain] What-if 시뮬레이션 오류:', error)
    res.status(500).json({
      success: false,
      error: error.message || '시뮬레이션 실행 중 오류가 발생했습니다.',
    })
  }
})

/**
 * POST /api/business-brain/what-if/compare
 * 여러 시나리오 비교 (v4.3)
 */
router.post('/what-if/compare', async (req, res) => {
  try {
    const { scenarios, period } = req.body
    
    if (!scenarios || !Array.isArray(scenarios) || scenarios.length === 0 || !period) {
      return res.status(400).json({
        success: false,
        error: 'scenarios 배열과 period 파라미터가 필요합니다.'
      })
    }

    console.log(`[BusinessBrain] What-if 시나리오 비교 요청: ${scenarios.length}개 시나리오`)
    
    const simulator = new WhatIfSimulator()
    const dateRange = DataProcessor.getDateRangeFromPreset(period as any)
    const results = await simulator.compareScenarios(scenarios as SimulationScenario[], dateRange)
    
    res.json({
      success: true,
      results,
      count: results.length,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[BusinessBrain] What-if 비교 오류:', error)
    res.status(500).json({
      success: false,
      error: error.message || '시나리오 비교 중 오류가 발생했습니다.',
    })
  }
})

/**
 * GET /api/business-brain/what-if/templates
 * 사전 정의된 시나리오 템플릿 조회 (v4.3)
 */
router.get('/what-if/templates', async (req, res) => {
  try {
    const templates = WhatIfSimulator.getTemplateScenarios()
    
    res.json({
      success: true,
      templates,
      count: templates.length,
    })
  } catch (error: any) {
    console.error('[BusinessBrain] 템플릿 조회 오류:', error)
    res.status(500).json({
      success: false,
      error: error.message || '템플릿 조회 중 오류가 발생했습니다.',
    })
  }
})

/**
 * POST /api/business-brain/report/generate
 * 리포트 생성 (v4.3)
 */
router.post('/report/generate', async (req, res) => {
  try {
    const options: ReportOptions = req.body
    
    if (!options.period || !options.sections || options.sections.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'period와 sections 파라미터가 필요합니다.'
      })
    }

    console.log(`[BusinessBrain] 리포트 생성 요청: ${options.period}, ${options.sections.length}개 섹션`)
    
    const generator = new ReportGenerator()
    const html = await generator.generateHTMLReport(options)
    
    res.json({
      success: true,
      html,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[BusinessBrain] 리포트 생성 오류:', error)
    res.status(500).json({
      success: false,
      error: error.message || '리포트 생성 중 오류가 발생했습니다.',
    })
  }
})

export default router
