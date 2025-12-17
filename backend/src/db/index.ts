// backend/src/db/index.ts
// PostgreSQL 데이터베이스 연결 설정

import { Pool, PoolConfig, QueryResult } from 'pg'

/**
 * 데이터베이스 연결 설정
 */
const poolConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'global_business_hub',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  
  // 연결 풀 설정
  max: parseInt(process.env.DB_POOL_MAX || '10'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
}

/**
 * 연결 풀 인스턴스
 */
const pool = new Pool(poolConfig)

// 연결 에러 핸들링
pool.on('error', (err: Error) => {
  console.error('[DB] Unexpected error on idle client', err)
})

// 연결 성공 로그
pool.on('connect', () => {
  console.log('[DB] New client connected to PostgreSQL')
})

/**
 * 데이터베이스 쿼리 실행
 * @param text - SQL 쿼리 문자열
 * @param params - 쿼리 파라미터
 * @returns 쿼리 결과
 */
export async function query(
  text: string,
  params?: any[]
): Promise<QueryResult<any>> {
  const start = Date.now()
  
  try {
    const result = await pool.query(text, params)
    const duration = Date.now() - start
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[DB Query]', {
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration: `${duration}ms`,
        rows: result.rowCount,
      })
    }
    
    return result
  } catch (error) {
    console.error('[DB Error]', { text, error })
    throw error
  }
}

/**
 * 트랜잭션 실행
 * @param callback - 트랜잭션 내에서 실행할 함수
 */
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/**
 * 데이터베이스 연결 확인
 */
export async function checkConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW()')
    console.log('[DB] Connection verified at', result.rows[0].now)
    return true
  } catch (error) {
    console.error('[DB] Connection check failed:', error)
    return false
  }
}

/**
 * 연결 풀 종료
 */
export async function closePool(): Promise<void> {
  await pool.end()
  console.log('[DB] Connection pool closed')
}

/**
 * 데이터베이스 객체 export
 */
export const db = {
  query,
  transaction,
  checkConnection,
  closePool,
  pool,
}

export default db

