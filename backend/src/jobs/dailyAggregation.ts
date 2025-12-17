// backend/src/jobs/dailyAggregation.ts
// 일별 집계 배치 Job

import cron from 'node-cron'
import { db } from '../db'
import GoogleSheetsService from '../services/googleSheets'
import { sheetsConfig, SHEET_NAMES } from '../config/sheets'
import { CURRENCY, BATCH_CONFIG } from '../config/constants'
import { NPS_THRESHOLDS } from '../config/businessRules'

// Google Sheets 서비스 인스턴스
const sheetsService = new GoogleSheetsService(sheetsConfig)

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * 날짜를 YYYY-MM-DD 형식으로 변환
 */
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * N일 전 날짜 반환
 */
function getDaysAgo(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

/**
 * 안전한 숫자 변환
 */
function safeNumber(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined) return defaultValue
  const num = typeof value === 'string' 
    ? parseFloat(value.replace(/[,\s]/g, ''))
    : Number(value)
  return isNaN(num) || !isFinite(num) ? defaultValue : num
}

/**
 * 배치 Job 로그 기록
 */
async function logJobStart(jobName: string, targetDate: string): Promise<number> {
  const result = await db.query(
    `INSERT INTO batch_job_logs (job_name, target_date, status, started_at)
     VALUES ($1, $2, 'RUNNING', NOW())
     RETURNING id`,
    [jobName, targetDate]
  )
  return result.rows[0].id
}

async function logJobSuccess(logId: number, recordsProcessed: number): Promise<void> {
  await db.query(
    `UPDATE batch_job_logs 
     SET status = 'SUCCESS', completed_at = NOW(), 
         duration_ms = EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000,
         records_processed = $2
     WHERE id = $1`,
    [logId, recordsProcessed]
  )
}

async function logJobFailure(logId: number, errorMessage: string): Promise<void> {
  await db.query(
    `UPDATE batch_job_logs 
     SET status = 'FAILED', completed_at = NOW(),
         duration_ms = EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000,
         error_message = $2
     WHERE id = $1`,
    [logId, errorMessage]
  )
}

// ============================================================
// 집계 함수
// ============================================================

/**
 * 일별 기본 지표 집계
 */
export async function aggregateDailyMetrics(targetDate: string): Promise<number> {
  console.log(`[DailyMetrics] Aggregating for ${targetDate}...`)
  
  const logId = await logJobStart('daily_metrics', targetDate)
  
  try {
    // 1. Google Sheets에서 logistics 데이터 조회
    const logisticsData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.LOGISTICS, true)
    
    // 2. 해당 날짜 데이터 필터링
    const targetDateStart = new Date(targetDate)
    targetDateStart.setHours(0, 0, 0, 0)
    const targetDateEnd = new Date(targetDate)
    targetDateEnd.setHours(23, 59, 59, 999)
    
    const filteredData = logisticsData.filter((row: any) => {
      try {
        if (!row.order_created) return false
        const orderDate = new Date(row.order_created)
        return orderDate >= targetDateStart && orderDate <= targetDateEnd
      } catch {
        return false
      }
    })
    
    // 3. 집계 계산
    const orderCodes = new Set<string>()
    const userIds = new Set<string>()
    const artistNames = new Set<string>()
    const productIds = new Set<string>()
    
    let totalGmvUsd = 0
    let itemCount = 0
    let jpOrderCodes = new Set<string>()
    let jpGmvUsd = 0
    let jpUserIds = new Set<string>()
    let enOrderCodes = new Set<string>()
    let enGmvUsd = 0
    let enUserIds = new Set<string>()
    let deliveryCompletedCodes = new Set<string>()
    
    filteredData.forEach((row: any) => {
      const orderCode = row.order_code
      const gmv = safeNumber(row['Total GMV'])
      const country = (row.country || '').toUpperCase()
      const userId = row.user_id
      const artistName = row['artist_name (kr)']
      const productId = row.product_id
      const logisticsStatus = (row.logistics || '').trim()
      const qty = safeNumber(row['구매수량'], 1)
      
      if (orderCode) {
        orderCodes.add(orderCode)
        totalGmvUsd += gmv
        itemCount += qty
        
        if (userId) userIds.add(String(userId))
        if (artistName) artistNames.add(artistName)
        if (productId) productIds.add(productId)
        
        // 국가별 집계
        if (country === 'JP') {
          jpOrderCodes.add(orderCode)
          jpGmvUsd += gmv
          if (userId) jpUserIds.add(String(userId))
        } else {
          enOrderCodes.add(orderCode)
          enGmvUsd += gmv
          if (userId) enUserIds.add(String(userId))
        }
        
        // 배송 완료 집계
        if (logisticsStatus === '배송 완료' || logisticsStatus === '배달 완료') {
          deliveryCompletedCodes.add(orderCode)
        }
      }
    })
    
    const orderCount = orderCodes.size
    const totalGmvKrw = totalGmvUsd * CURRENCY.USD_TO_KRW
    const avgAov = orderCount > 0 ? totalGmvKrw / orderCount : 0
    const deliveryRate = orderCount > 0 ? (deliveryCompletedCodes.size / orderCount) * 100 : 0
    
    // 4. users 데이터로 신규 고객 계산
    let newCustomers = 0
    let returningCustomers = 0
    
    try {
      const usersData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.USERS, false)
      const newUserIds = new Set<string>()
      
      usersData.forEach((user: any) => {
        try {
          if (!user.CREATED_AT) return
          const createdAt = new Date(user.CREATED_AT)
          if (createdAt >= targetDateStart && createdAt <= targetDateEnd) {
            newUserIds.add(String(user.ID))
          }
        } catch {}
      })
      
      newCustomers = newUserIds.size
      
      // 재구매 고객 = 구매 고객 - 신규 고객
      const purchaseUserIds = userIds
      let newPurchasers = 0
      purchaseUserIds.forEach(uid => {
        if (newUserIds.has(uid)) newPurchasers++
      })
      returningCustomers = purchaseUserIds.size - newPurchasers
    } catch (error) {
      console.warn('[DailyMetrics] Users data not available:', error)
    }
    
    // 5. DB 저장 (UPSERT)
    await db.query(`
      INSERT INTO daily_metrics (
        date, order_count, total_gmv_krw, total_gmv_usd, avg_aov, item_count,
        unique_customers, new_customers, returning_customers,
        unique_artists, unique_products,
        jp_order_count, jp_gmv_krw, jp_gmv_usd, jp_unique_customers,
        en_order_count, en_gmv_krw, en_gmv_usd, en_unique_customers,
        delivery_completed_count, delivery_rate
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      ON CONFLICT (date) DO UPDATE SET
        order_count = EXCLUDED.order_count,
        total_gmv_krw = EXCLUDED.total_gmv_krw,
        total_gmv_usd = EXCLUDED.total_gmv_usd,
        avg_aov = EXCLUDED.avg_aov,
        item_count = EXCLUDED.item_count,
        unique_customers = EXCLUDED.unique_customers,
        new_customers = EXCLUDED.new_customers,
        returning_customers = EXCLUDED.returning_customers,
        unique_artists = EXCLUDED.unique_artists,
        unique_products = EXCLUDED.unique_products,
        jp_order_count = EXCLUDED.jp_order_count,
        jp_gmv_krw = EXCLUDED.jp_gmv_krw,
        jp_gmv_usd = EXCLUDED.jp_gmv_usd,
        jp_unique_customers = EXCLUDED.jp_unique_customers,
        en_order_count = EXCLUDED.en_order_count,
        en_gmv_krw = EXCLUDED.en_gmv_krw,
        en_gmv_usd = EXCLUDED.en_gmv_usd,
        en_unique_customers = EXCLUDED.en_unique_customers,
        delivery_completed_count = EXCLUDED.delivery_completed_count,
        delivery_rate = EXCLUDED.delivery_rate,
        updated_at = NOW()
    `, [
      targetDate,
      orderCount,
      totalGmvKrw,
      totalGmvUsd,
      avgAov,
      itemCount,
      userIds.size,
      newCustomers,
      returningCustomers,
      artistNames.size,
      productIds.size,
      jpOrderCodes.size,
      jpGmvUsd * CURRENCY.USD_TO_KRW,
      jpGmvUsd,
      jpUserIds.size,
      enOrderCodes.size,
      enGmvUsd * CURRENCY.USD_TO_KRW,
      enGmvUsd,
      enUserIds.size,
      deliveryCompletedCodes.size,
      deliveryRate
    ])
    
    // 6. 집계 상태 업데이트
    await db.query(`
      INSERT INTO aggregation_status (date, aggregation_type, status, last_run_at)
      VALUES ($1, 'metrics', 'COMPLETED', NOW())
      ON CONFLICT (date, aggregation_type) DO UPDATE SET
        status = 'COMPLETED',
        last_run_at = NOW()
    `, [targetDate])
    
    await logJobSuccess(logId, filteredData.length)
    console.log(`[DailyMetrics] Completed for ${targetDate}: ${orderCount} orders, ₩${Math.round(totalGmvKrw).toLocaleString()}`)
    
    return filteredData.length
  } catch (error: any) {
    await logJobFailure(logId, error.message)
    console.error(`[DailyMetrics] Failed for ${targetDate}:`, error)
    throw error
  }
}

/**
 * 일별 리뷰 지표 집계
 */
export async function aggregateDailyReviewMetrics(targetDate: string): Promise<number> {
  console.log(`[DailyReviewMetrics] Aggregating for ${targetDate}...`)
  
  const logId = await logJobStart('daily_review_metrics', targetDate)
  
  try {
    // 1. Google Sheets에서 review 데이터 조회
    const reviewData = await sheetsService.getSheetDataAsJson(SHEET_NAMES.REVIEW, false)
    
    // 2. 해당 날짜 데이터 필터링
    const targetDateStart = new Date(targetDate)
    targetDateStart.setHours(0, 0, 0, 0)
    const targetDateEnd = new Date(targetDate)
    targetDateEnd.setHours(23, 59, 59, 999)
    
    const filteredData = reviewData.filter((row: any) => {
      try {
        // 리뷰 날짜 필드명 확인 필요 (created_at 또는 review_date 등)
        const dateField = row.created_at || row.review_date || row.date
        if (!dateField) return false
        const reviewDate = new Date(dateField)
        return reviewDate >= targetDateStart && reviewDate <= targetDateEnd
      } catch {
        return false
      }
    })
    
    // 3. 집계 계산
    let totalRating = 0
    let rating1 = 0, rating2 = 0, rating3 = 0, rating4 = 0, rating5 = 0
    let jpCount = 0, jpTotalRating = 0
    let enCount = 0, enTotalRating = 0
    
    filteredData.forEach((row: any) => {
      const rating = safeNumber(row.rating || row.score, 0)
      const country = (row.country || '').toUpperCase()
      
      if (rating >= 1 && rating <= 5) {
        totalRating += rating
        
        if (rating === 1) rating1++
        else if (rating === 2) rating2++
        else if (rating === 3) rating3++
        else if (rating === 4) rating4++
        else if (rating === 5) rating5++
        
        if (country === 'JP') {
          jpCount++
          jpTotalRating += rating
        } else {
          enCount++
          enTotalRating += rating
        }
      }
    })
    
    const reviewCount = filteredData.length
    const avgRating = reviewCount > 0 ? totalRating / reviewCount : 0
    const jpAvgRating = jpCount > 0 ? jpTotalRating / jpCount : 0
    const enAvgRating = enCount > 0 ? enTotalRating / enCount : 0
    
    // NPS 계산 (5점 만점 기준)
    const promoters = rating5  // 5점
    const passives = rating4   // 4점
    const detractors = rating1 + rating2 + rating3  // 1~3점
    const npsScore = reviewCount > 0 
      ? ((promoters - detractors) / reviewCount) * 100 
      : 0
    
    // 4. DB 저장 (UPSERT)
    await db.query(`
      INSERT INTO daily_review_metrics (
        date, review_count, avg_rating,
        rating_1, rating_2, rating_3, rating_4, rating_5,
        promoters, passives, detractors, nps_score,
        jp_review_count, jp_avg_rating,
        en_review_count, en_avg_rating
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (date) DO UPDATE SET
        review_count = EXCLUDED.review_count,
        avg_rating = EXCLUDED.avg_rating,
        rating_1 = EXCLUDED.rating_1,
        rating_2 = EXCLUDED.rating_2,
        rating_3 = EXCLUDED.rating_3,
        rating_4 = EXCLUDED.rating_4,
        rating_5 = EXCLUDED.rating_5,
        promoters = EXCLUDED.promoters,
        passives = EXCLUDED.passives,
        detractors = EXCLUDED.detractors,
        nps_score = EXCLUDED.nps_score,
        jp_review_count = EXCLUDED.jp_review_count,
        jp_avg_rating = EXCLUDED.jp_avg_rating,
        en_review_count = EXCLUDED.en_review_count,
        en_avg_rating = EXCLUDED.en_avg_rating,
        updated_at = NOW()
    `, [
      targetDate,
      reviewCount,
      avgRating,
      rating1, rating2, rating3, rating4, rating5,
      promoters, passives, detractors, npsScore,
      jpCount, jpAvgRating,
      enCount, enAvgRating
    ])
    
    // 5. 집계 상태 업데이트
    await db.query(`
      INSERT INTO aggregation_status (date, aggregation_type, status, last_run_at)
      VALUES ($1, 'review', 'COMPLETED', NOW())
      ON CONFLICT (date, aggregation_type) DO UPDATE SET
        status = 'COMPLETED',
        last_run_at = NOW()
    `, [targetDate])
    
    await logJobSuccess(logId, filteredData.length)
    console.log(`[DailyReviewMetrics] Completed for ${targetDate}: ${reviewCount} reviews, avg ${avgRating.toFixed(2)}`)
    
    return filteredData.length
  } catch (error: any) {
    await logJobFailure(logId, error.message)
    console.error(`[DailyReviewMetrics] Failed for ${targetDate}:`, error)
    throw error
  }
}

/**
 * 일별 쿠폰 지표 집계
 */
export async function aggregateDailyCouponMetrics(targetDate: string): Promise<number> {
  console.log(`[DailyCouponMetrics] Aggregating for ${targetDate}...`)
  
  const logId = await logJobStart('daily_coupon_metrics', targetDate)
  
  try {
    // 1. Google Sheets에서 coupon 데이터 조회
    let couponData: any[] = []
    try {
      couponData = await sheetsService.getSheetDataAsJson('coupon', false)
    } catch (error) {
      console.warn('[DailyCouponMetrics] Coupon sheet not available, skipping...')
      await logJobSuccess(logId, 0)
      return 0
    }
    
    // 2. 해당 날짜에 활성화된 쿠폰 필터링
    const targetDateObj = new Date(targetDate)
    
    const activeCoupons = couponData.filter((row: any) => {
      try {
        const fromDate = row.from_datetime ? new Date(row.from_datetime) : null
        const toDate = row.to_datetime ? new Date(row.to_datetime) : null
        
        if (!fromDate || !toDate) return false
        return targetDateObj >= fromDate && targetDateObj <= toDate
      } catch {
        return false
      }
    })
    
    // 3. 집계 계산
    let totalIssued = 0
    let totalUsed = 0
    let totalDiscountUsd = 0
    let totalGmvUsd = 0
    let rateIssued = 0, rateUsed = 0, rateDiscountUsd = 0
    let fixedIssued = 0, fixedUsed = 0, fixedDiscountUsd = 0
    let jpIssued = 0, jpUsed = 0, jpGmvUsd = 0
    let enIssued = 0, enUsed = 0, enGmvUsd = 0
    
    activeCoupons.forEach((row: any) => {
      const issued = safeNumber(row.issue_count)
      const used = safeNumber(row.used_count)
      const discount = safeNumber(row.discount_amount)
      const gmv = safeNumber(row.total_gmv)
      const discountType = (row.discount_type || '').toUpperCase()
      const country = (row.coupon_country || '').toUpperCase()
      
      totalIssued += issued
      totalUsed += used
      totalDiscountUsd += discount
      totalGmvUsd += gmv
      
      if (discountType === 'RATE') {
        rateIssued += issued
        rateUsed += used
        rateDiscountUsd += discount
      } else if (discountType === 'FIXED') {
        fixedIssued += issued
        fixedUsed += used
        fixedDiscountUsd += discount
      }
      
      if (country === 'JP') {
        jpIssued += issued
        jpUsed += used
        jpGmvUsd += gmv
      } else {
        enIssued += issued
        enUsed += used
        enGmvUsd += gmv
      }
    })
    
    const conversionRate = totalIssued > 0 ? totalUsed / totalIssued : 0
    const roi = totalDiscountUsd > 0 ? totalGmvUsd / totalDiscountUsd : 0
    
    // 4. DB 저장 (UPSERT)
    await db.query(`
      INSERT INTO daily_coupon_metrics (
        date, active_coupons, issued_count, used_count, conversion_rate,
        total_discount_usd, total_discount_krw, total_gmv_usd, total_gmv_krw, roi,
        rate_issued, rate_used, rate_discount_usd,
        fixed_issued, fixed_used, fixed_discount_usd,
        jp_issued, jp_used, jp_gmv_usd,
        en_issued, en_used, en_gmv_usd
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      ON CONFLICT (date) DO UPDATE SET
        active_coupons = EXCLUDED.active_coupons,
        issued_count = EXCLUDED.issued_count,
        used_count = EXCLUDED.used_count,
        conversion_rate = EXCLUDED.conversion_rate,
        total_discount_usd = EXCLUDED.total_discount_usd,
        total_discount_krw = EXCLUDED.total_discount_krw,
        total_gmv_usd = EXCLUDED.total_gmv_usd,
        total_gmv_krw = EXCLUDED.total_gmv_krw,
        roi = EXCLUDED.roi,
        rate_issued = EXCLUDED.rate_issued,
        rate_used = EXCLUDED.rate_used,
        rate_discount_usd = EXCLUDED.rate_discount_usd,
        fixed_issued = EXCLUDED.fixed_issued,
        fixed_used = EXCLUDED.fixed_used,
        fixed_discount_usd = EXCLUDED.fixed_discount_usd,
        jp_issued = EXCLUDED.jp_issued,
        jp_used = EXCLUDED.jp_used,
        jp_gmv_usd = EXCLUDED.jp_gmv_usd,
        en_issued = EXCLUDED.en_issued,
        en_used = EXCLUDED.en_used,
        en_gmv_usd = EXCLUDED.en_gmv_usd,
        updated_at = NOW()
    `, [
      targetDate,
      activeCoupons.length,
      totalIssued,
      totalUsed,
      conversionRate,
      totalDiscountUsd,
      totalDiscountUsd * CURRENCY.USD_TO_KRW,
      totalGmvUsd,
      totalGmvUsd * CURRENCY.USD_TO_KRW,
      roi,
      rateIssued, rateUsed, rateDiscountUsd,
      fixedIssued, fixedUsed, fixedDiscountUsd,
      jpIssued, jpUsed, jpGmvUsd,
      enIssued, enUsed, enGmvUsd
    ])
    
    // 5. 집계 상태 업데이트
    await db.query(`
      INSERT INTO aggregation_status (date, aggregation_type, status, last_run_at)
      VALUES ($1, 'coupon', 'COMPLETED', NOW())
      ON CONFLICT (date, aggregation_type) DO UPDATE SET
        status = 'COMPLETED',
        last_run_at = NOW()
    `, [targetDate])
    
    await logJobSuccess(logId, activeCoupons.length)
    console.log(`[DailyCouponMetrics] Completed for ${targetDate}: ${activeCoupons.length} active coupons`)
    
    return activeCoupons.length
  } catch (error: any) {
    await logJobFailure(logId, error.message)
    console.error(`[DailyCouponMetrics] Failed for ${targetDate}:`, error)
    throw error
  }
}

// ============================================================
// 메인 실행 함수
// ============================================================

/**
 * 전체 일별 집계 실행
 */
export async function runDailyAggregation(targetDate?: string): Promise<void> {
  const date = targetDate || formatDate(getDaysAgo(1)) // 기본값: 어제
  
  console.log(`\n${'='.repeat(60)}`)
  console.log(`[DailyAggregation] Starting for ${date}`)
  console.log(`${'='.repeat(60)}\n`)
  
  const startTime = Date.now()
  
  try {
    // 순차 실행 (의존성 없음, 병렬 실행도 가능)
    await aggregateDailyMetrics(date)
    await aggregateDailyReviewMetrics(date)
    await aggregateDailyCouponMetrics(date)
    
    const duration = Date.now() - startTime
    console.log(`\n${'='.repeat(60)}`)
    console.log(`[DailyAggregation] All tasks completed for ${date}`)
    console.log(`[DailyAggregation] Total duration: ${duration}ms`)
    console.log(`${'='.repeat(60)}\n`)
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`\n${'='.repeat(60)}`)
    console.error(`[DailyAggregation] Failed for ${date} after ${duration}ms`)
    console.error(error)
    console.error(`${'='.repeat(60)}\n`)
    throw error
  }
}

/**
 * 특정 유형만 집계 실행
 */
export async function runAggregationByType(
  targetDate: string,
  types: ('metrics' | 'review' | 'coupon')[]
): Promise<void> {
  console.log(`[Aggregation] Running for ${targetDate}, types: ${types.join(', ')}`)
  
  for (const type of types) {
    switch (type) {
      case 'metrics':
        await aggregateDailyMetrics(targetDate)
        break
      case 'review':
        await aggregateDailyReviewMetrics(targetDate)
        break
      case 'coupon':
        await aggregateDailyCouponMetrics(targetDate)
        break
    }
  }
}

// ============================================================
// Cron 스케줄러 설정
// ============================================================

/**
 * 배치 Job 스케줄 시작
 * 
 * ⚠️ 중요: Raw Data(Google Sheets)는 매일 11:00 KST에 수동 업데이트됨
 * 따라서 배치 Job은 12:00 KST(정오)에 실행하여 최신 데이터 반영
 */
export function startScheduler(): void {
  console.log('[Scheduler] Starting daily aggregation scheduler...')
  console.log(`[Scheduler] Cron expression: ${BATCH_CONFIG.CRON_EXPRESSION}`)
  console.log(`[Scheduler] Timezone: ${BATCH_CONFIG.TIMEZONE}`)
  
  cron.schedule(BATCH_CONFIG.CRON_EXPRESSION, async () => {
    console.log('[Scheduler] Triggered daily aggregation')
    try {
      await runDailyAggregation()
    } catch (error) {
      console.error('[Scheduler] Daily aggregation failed:', error)
    }
  }, {
    timezone: BATCH_CONFIG.TIMEZONE
  })
  
  console.log('[Scheduler] Daily aggregation scheduled for 12:00 KST')
}

// 모듈 직접 실행 시 (테스트용)
if (require.main === module) {
  const targetDate = process.argv[2] || formatDate(getDaysAgo(1))
  console.log(`Running aggregation for: ${targetDate}`)
  
  runDailyAggregation(targetDate)
    .then(() => {
      console.log('Aggregation completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Aggregation failed:', error)
      process.exit(1)
    })
}

