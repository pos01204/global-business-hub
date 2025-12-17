// backend/src/routes/admin.ts
// 관리자 API - 수동 집계 트리거, 배치 Job 관리

import { Router, Request, Response } from 'express'
import { db } from '../db'
import { 
  runDailyAggregation, 
  runAggregationByType,
  aggregateDailyMetrics,
  aggregateDailyReviewMetrics,
  aggregateDailyCouponMetrics
} from '../jobs/dailyAggregation'

const router = Router()

// ============================================================
// 수동 집계 트리거 API
// ============================================================

/**
 * 수동 집계 트리거
 * POST /api/admin/trigger-aggregation
 * 
 * Body:
 * {
 *   "date": "2024-12-16",           // 집계 대상 날짜 (YYYY-MM-DD)
 *   "types": ["metrics", "review"]  // 집계 유형 (선택, 기본: 전체)
 * }
 */
router.post('/trigger-aggregation', async (req: Request, res: Response) => {
  try {
    const { date, types } = req.body
    
    // 날짜 검증
    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'date 필드가 필요합니다.',
        example: { date: '2024-12-16', types: ['metrics', 'review', 'coupon'] }
      })
    }
    
    // 날짜 형식 검증
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        error: '날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)',
        received: date
      })
    }
    
    // 미래 날짜 검증
    const targetDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (targetDate >= today) {
      return res.status(400).json({
        success: false,
        error: '오늘 또는 미래 날짜는 집계할 수 없습니다.',
        received: date
      })
    }
    
    console.log(`[Admin] Manual aggregation triggered for ${date}`)
    
    const startTime = Date.now()
    
    // 유형별 실행 또는 전체 실행
    if (types && Array.isArray(types) && types.length > 0) {
      const validTypes = types.filter((t: string) => 
        ['metrics', 'review', 'coupon'].includes(t)
      ) as ('metrics' | 'review' | 'coupon')[]
      
      if (validTypes.length === 0) {
        return res.status(400).json({
          success: false,
          error: '유효한 집계 유형이 없습니다.',
          validTypes: ['metrics', 'review', 'coupon'],
          received: types
        })
      }
      
      await runAggregationByType(date, validTypes)
    } else {
      await runDailyAggregation(date)
    }
    
    const duration = Date.now() - startTime
    
    res.json({
      success: true,
      message: '집계가 완료되었습니다.',
      date,
      types: types || ['metrics', 'review', 'coupon'],
      duration: `${duration}ms`
    })
  } catch (error: any) {
    console.error('[Admin] Manual aggregation failed:', error)
    res.status(500).json({
      success: false,
      error: '집계 실행 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

/**
 * 집계 상태 조회
 * GET /api/admin/aggregation-status?date=2024-12-16
 */
router.get('/aggregation-status', async (req: Request, res: Response) => {
  try {
    const { date, startDate, endDate } = req.query
    
    let query: string
    let params: any[]
    
    if (date) {
      // 특정 날짜 조회
      query = `
        SELECT date, aggregation_type, status, last_run_at, created_at, updated_at
        FROM aggregation_status
        WHERE date = $1
        ORDER BY aggregation_type
      `
      params = [date]
    } else if (startDate && endDate) {
      // 기간 조회
      query = `
        SELECT date, aggregation_type, status, last_run_at, created_at, updated_at
        FROM aggregation_status
        WHERE date BETWEEN $1 AND $2
        ORDER BY date DESC, aggregation_type
      `
      params = [startDate, endDate]
    } else {
      // 최근 7일
      query = `
        SELECT date, aggregation_type, status, last_run_at, created_at, updated_at
        FROM aggregation_status
        WHERE date >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY date DESC, aggregation_type
      `
      params = []
    }
    
    const result = await db.query(query, params)
    
    // 날짜별로 그룹화
    const grouped: Record<string, any> = {}
    result.rows.forEach((row: any) => {
      const dateStr = row.date.toISOString().split('T')[0]
      if (!grouped[dateStr]) {
        grouped[dateStr] = { date: dateStr, types: {} }
      }
      grouped[dateStr].types[row.aggregation_type] = {
        status: row.status,
        lastRunAt: row.last_run_at
      }
    })
    
    res.json({
      success: true,
      data: Object.values(grouped).sort((a: any, b: any) => 
        b.date.localeCompare(a.date)
      )
    })
  } catch (error: any) {
    console.error('[Admin] Aggregation status query failed:', error)
    res.status(500).json({
      success: false,
      error: '집계 상태 조회 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

/**
 * 배치 Job 로그 조회
 * GET /api/admin/batch-logs?limit=10&jobName=daily_metrics
 */
router.get('/batch-logs', async (req: Request, res: Response) => {
  try {
    const { limit = 20, jobName, status, startDate, endDate } = req.query
    
    let query = `
      SELECT id, job_name, target_date, status, started_at, completed_at,
             duration_ms, records_processed, error_message, created_at
      FROM batch_job_logs
      WHERE 1=1
    `
    const params: any[] = []
    let paramIndex = 1
    
    if (jobName) {
      query += ` AND job_name = $${paramIndex++}`
      params.push(jobName)
    }
    
    if (status) {
      query += ` AND status = $${paramIndex++}`
      params.push(status)
    }
    
    if (startDate) {
      query += ` AND target_date >= $${paramIndex++}`
      params.push(startDate)
    }
    
    if (endDate) {
      query += ` AND target_date <= $${paramIndex++}`
      params.push(endDate)
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`
    params.push(Number(limit))
    
    const result = await db.query(query, params)
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rowCount
    })
  } catch (error: any) {
    console.error('[Admin] Batch logs query failed:', error)
    res.status(500).json({
      success: false,
      error: '배치 로그 조회 중 오류가 발생했습니다.',
      details: error.message
    })
  }
})

/**
 * 데이터베이스 연결 상태 확인
 * GET /api/admin/db-status
 */
router.get('/db-status', async (req: Request, res: Response) => {
  try {
    const result = await db.query('SELECT NOW() as current_time, version() as version')
    
    res.json({
      success: true,
      connected: true,
      serverTime: result.rows[0].current_time,
      version: result.rows[0].version
    })
  } catch (error: any) {
    res.json({
      success: false,
      connected: false,
      error: error.message
    })
  }
})

/**
 * 테이블 통계 조회
 * GET /api/admin/table-stats
 */
router.get('/table-stats', async (req: Request, res: Response) => {
  try {
    const tables = ['daily_metrics', 'daily_review_metrics', 'daily_coupon_metrics', 'batch_job_logs', 'aggregation_status']
    const stats: Record<string, any> = {}
    
    for (const table of tables) {
      try {
        const countResult = await db.query(`SELECT COUNT(*) as count FROM ${table}`)
        const minMaxResult = await db.query(`
          SELECT MIN(date) as min_date, MAX(date) as max_date 
          FROM ${table}
          WHERE date IS NOT NULL
        `)
        
        stats[table] = {
          count: parseInt(countResult.rows[0].count),
          minDate: minMaxResult.rows[0]?.min_date,
          maxDate: minMaxResult.rows[0]?.max_date
        }
      } catch (e) {
        stats[table] = { error: 'Table not found or error' }
      }
    }
    
    res.json({
      success: true,
      data: stats
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export default router

