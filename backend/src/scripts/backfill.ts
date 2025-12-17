// backend/src/scripts/backfill.ts
// 과거 데이터 백필 스크립트

import { db } from '../db'
import { 
  aggregateDailyMetrics,
  aggregateDailyReviewMetrics,
  aggregateDailyCouponMetrics
} from '../jobs/dailyAggregation'

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
 * 날짜 범위 생성
 */
function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const current = new Date(startDate)
  const end = new Date(endDate)
  
  while (current <= end) {
    dates.push(formatDate(current))
    current.setDate(current.getDate() + 1)
  }
  
  return dates
}

/**
 * 진행률 표시
 */
function showProgress(current: number, total: number, date: string): void {
  const percent = Math.round((current / total) * 100)
  const bar = '█'.repeat(Math.floor(percent / 5)) + '░'.repeat(20 - Math.floor(percent / 5))
  process.stdout.write(`\r[${bar}] ${percent}% (${current}/${total}) - ${date}`)
}

/**
 * 대기 함수 (Rate Limiting 방지)
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 백필 실행
 */
async function runBackfill(options: {
  startDate: string
  endDate: string
  types?: ('metrics' | 'review' | 'coupon')[]
  dryRun?: boolean
  delayMs?: number
}): Promise<void> {
  const { 
    startDate, 
    endDate, 
    types = ['metrics', 'review', 'coupon'],
    dryRun = false,
    delayMs = 1000 // 기본 1초 대기 (Google Sheets API Rate Limit 방지)
  } = options
  
  console.log('\n' + '='.repeat(60))
  console.log('📊 Global Business Hub - 데이터 백필 스크립트')
  console.log('='.repeat(60))
  console.log(`시작일: ${startDate}`)
  console.log(`종료일: ${endDate}`)
  console.log(`집계 유형: ${types.join(', ')}`)
  console.log(`Dry Run: ${dryRun ? 'Yes' : 'No'}`)
  console.log(`요청 간격: ${delayMs}ms`)
  console.log('='.repeat(60) + '\n')
  
  // 날짜 유효성 검사
  const startDateObj = new Date(startDate)
  const endDateObj = new Date(endDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
    console.error('❌ 유효하지 않은 날짜 형식입니다.')
    process.exit(1)
  }
  
  if (startDateObj > endDateObj) {
    console.error('❌ 시작일이 종료일보다 큽니다.')
    process.exit(1)
  }
  
  if (endDateObj >= today) {
    console.warn('⚠️ 종료일이 오늘 이후입니다. 어제까지만 집계합니다.')
    endDateObj.setDate(today.getDate() - 1)
  }
  
  const dates = getDateRange(startDate, formatDate(endDateObj))
  console.log(`📅 총 ${dates.length}일 데이터 백필 예정\n`)
  
  if (dryRun) {
    console.log('🔍 Dry Run 모드 - 실제 데이터 저장 없음')
    console.log('대상 날짜:')
    dates.forEach(date => console.log(`  - ${date}`))
    return
  }
  
  // DB 연결 확인
  try {
    await db.checkConnection()
    console.log('✅ 데이터베이스 연결 확인\n')
  } catch (error) {
    console.error('❌ 데이터베이스 연결 실패:', error)
    process.exit(1)
  }
  
  const results = {
    success: 0,
    failed: 0,
    errors: [] as { date: string; type: string; error: string }[]
  }
  
  const startTime = Date.now()
  
  for (let i = 0; i < dates.length; i++) {
    const date = dates[i]
    showProgress(i + 1, dates.length, date)
    
    for (const type of types) {
      try {
        switch (type) {
          case 'metrics':
            await aggregateDailyMetrics(date)
            break
          case 'review':
            await aggregateDailyReviewMetrics(date)
            break
          case 'coupon':
            await aggregateDailyCouponMetrics(date)
            break
        }
        results.success++
      } catch (error: any) {
        results.failed++
        results.errors.push({
          date,
          type,
          error: error.message
        })
      }
    }
    
    // Rate Limiting 방지
    if (i < dates.length - 1) {
      await sleep(delayMs)
    }
  }
  
  const duration = Math.round((Date.now() - startTime) / 1000)
  
  console.log('\n\n' + '='.repeat(60))
  console.log('📊 백필 완료')
  console.log('='.repeat(60))
  console.log(`✅ 성공: ${results.success}건`)
  console.log(`❌ 실패: ${results.failed}건`)
  console.log(`⏱️ 소요 시간: ${duration}초`)
  
  if (results.errors.length > 0) {
    console.log('\n❌ 오류 목록:')
    results.errors.forEach(err => {
      console.log(`  - ${err.date} (${err.type}): ${err.error}`)
    })
  }
  
  console.log('='.repeat(60) + '\n')
}

/**
 * 특정 기간 백필 검증
 */
async function verifyBackfill(startDate: string, endDate: string): Promise<void> {
  console.log('\n📋 백필 데이터 검증\n')
  
  const result = await db.query(`
    SELECT 
      date,
      order_count,
      total_gmv_krw,
      new_customers,
      delivery_rate
    FROM daily_metrics
    WHERE date BETWEEN $1 AND $2
    ORDER BY date
  `, [startDate, endDate])
  
  if (result.rows.length === 0) {
    console.log('⚠️ 해당 기간에 데이터가 없습니다.')
    return
  }
  
  console.log('날짜       | 주문수 | GMV (KRW)    | 신규고객 | 배송완료율')
  console.log('-'.repeat(60))
  
  result.rows.forEach((row: any) => {
    const date = row.date.toISOString().split('T')[0]
    const gmv = Math.round(row.total_gmv_krw).toLocaleString()
    console.log(
      `${date} | ${String(row.order_count).padStart(6)} | ₩${gmv.padStart(12)} | ${String(row.new_customers).padStart(8)} | ${row.delivery_rate?.toFixed(1) || 0}%`
    )
  })
  
  console.log('-'.repeat(60))
  console.log(`총 ${result.rows.length}일 데이터\n`)
}

// CLI 실행
async function main(): Promise<void> {
  const args = process.argv.slice(2)
  
  if (args.length < 2) {
    console.log(`
사용법: npx ts-node src/scripts/backfill.ts <시작일> <종료일> [옵션]

옵션:
  --types=metrics,review,coupon  집계 유형 (기본: 전체)
  --dry-run                      실제 저장 없이 대상 확인
  --delay=1000                   요청 간격 (ms, 기본: 1000)
  --verify                       백필 후 데이터 검증

예시:
  npx ts-node src/scripts/backfill.ts 2024-11-01 2024-12-15
  npx ts-node src/scripts/backfill.ts 2024-12-01 2024-12-15 --types=metrics
  npx ts-node src/scripts/backfill.ts 2024-12-01 2024-12-15 --dry-run
  npx ts-node src/scripts/backfill.ts 2024-12-01 2024-12-15 --verify
`)
    process.exit(1)
  }
  
  const startDate = args[0]
  const endDate = args[1]
  
  // 옵션 파싱
  const options: any = {
    startDate,
    endDate,
    types: ['metrics', 'review', 'coupon'],
    dryRun: false,
    delayMs: 1000
  }
  
  let verify = false
  
  for (let i = 2; i < args.length; i++) {
    const arg = args[i]
    
    if (arg.startsWith('--types=')) {
      options.types = arg.split('=')[1].split(',')
    } else if (arg === '--dry-run') {
      options.dryRun = true
    } else if (arg.startsWith('--delay=')) {
      options.delayMs = parseInt(arg.split('=')[1])
    } else if (arg === '--verify') {
      verify = true
    }
  }
  
  try {
    await runBackfill(options)
    
    if (verify && !options.dryRun) {
      await verifyBackfill(startDate, endDate)
    }
    
    process.exit(0)
  } catch (error) {
    console.error('백필 실패:', error)
    process.exit(1)
  }
}

main()

export { runBackfill, verifyBackfill }

