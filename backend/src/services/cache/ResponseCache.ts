/**
 * LLM 응답 캐시
 * 동일한 질문에 대한 응답 재사용으로 토큰 절약
 */

import crypto from 'crypto'

interface CachedResponse {
  response: string
  timestamp: number
  hitCount: number
  metadata?: {
    intent?: string
    dataHash?: string
  }
}

export class ResponseCache {
  private cache: Map<string, CachedResponse> = new Map()
  private maxSize = 500 // 최대 캐시 항목 수
  private defaultTTL = 30 * 60 * 1000 // 30분

  /**
   * 캐시 키 생성 (질문 + 데이터 해시)
   */
  private generateKey(query: string, dataHash?: string): string {
    const normalized = query.toLowerCase().trim()
    const combined = dataHash ? `${normalized}:${dataHash}` : normalized
    return crypto.createHash('md5').update(combined).digest('hex')
  }

  /**
   * 데이터 해시 생성
   */
  generateDataHash(data: any): string {
    if (!data) return ''
    
    // 데이터 요약 (전체 해시 대신 주요 특성만)
    if (Array.isArray(data)) {
      const summary = {
        length: data.length,
        firstRow: data[0] ? Object.keys(data[0]).sort().join(',') : '',
        // 숫자 컬럼 합계 (간단한 지문)
        sums: this.calculateSums(data),
      }
      return crypto.createHash('md5').update(JSON.stringify(summary)).digest('hex').substring(0, 8)
    }
    
    return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex').substring(0, 8)
  }

  /**
   * 숫자 컬럼 합계 계산
   */
  private calculateSums(data: any[]): Record<string, number> {
    if (data.length === 0) return {}
    
    const sums: Record<string, number> = {}
    const sampleRow = data[0]
    
    for (const key of Object.keys(sampleRow)) {
      const val = sampleRow[key]
      if (typeof val === 'number' || !isNaN(Number(val))) {
        sums[key] = data.reduce((sum, row) => sum + (Number(row[key]) || 0), 0)
      }
    }
    
    return sums
  }

  /**
   * 캐시에서 응답 조회
   */
  get(query: string, dataHash?: string): string | null {
    const key = this.generateKey(query, dataHash)
    const cached = this.cache.get(key)

    if (!cached) return null

    // TTL 확인
    if (Date.now() - cached.timestamp > this.defaultTTL) {
      this.cache.delete(key)
      return null
    }

    // 히트 카운트 증가
    cached.hitCount++
    console.log(`[ResponseCache] 캐시 히트: "${query.substring(0, 30)}..." (히트: ${cached.hitCount}회)`)
    
    return cached.response
  }

  /**
   * 캐시에 응답 저장
   */
  set(
    query: string,
    response: string,
    options?: { dataHash?: string; intent?: string }
  ): void {
    const key = this.generateKey(query, options?.dataHash)

    // 캐시 크기 제한
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed()
    }

    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      hitCount: 0,
      metadata: {
        intent: options?.intent,
        dataHash: options?.dataHash,
      },
    })

    console.log(`[ResponseCache] 캐시 저장: "${query.substring(0, 30)}..."`)
  }

  /**
   * 유사 질문 검색 (간단한 유사도)
   */
  findSimilar(query: string, threshold: number = 0.8): string | null {
    const normalizedQuery = query.toLowerCase().trim()
    const queryWords = new Set(normalizedQuery.split(/\s+/))

    for (const [key, cached] of this.cache.entries()) {
      // TTL 확인
      if (Date.now() - cached.timestamp > this.defaultTTL) continue

      // 캐시된 질문 복원은 불가능하므로 스킵
      // 대신 정확한 매칭만 사용
    }

    return null
  }

  /**
   * 가장 적게 사용된 항목 제거
   */
  private evictLeastUsed(): void {
    let minHits = Infinity
    let minKey: string | null = null

    for (const [key, cached] of this.cache.entries()) {
      if (cached.hitCount < minHits) {
        minHits = cached.hitCount
        minKey = key
      }
    }

    if (minKey) {
      this.cache.delete(minKey)
    }
  }

  /**
   * 캐시 통계
   */
  getStats(): {
    size: number
    totalHits: number
    avgHitsPerEntry: number
  } {
    let totalHits = 0
    for (const cached of this.cache.values()) {
      totalHits += cached.hitCount
    }

    return {
      size: this.cache.size,
      totalHits,
      avgHitsPerEntry: this.cache.size > 0 ? totalHits / this.cache.size : 0,
    }
  }

  /**
   * 캐시 클리어
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * 만료된 항목 정리
   */
  cleanup(): number {
    let removed = 0
    const now = Date.now()

    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.defaultTTL) {
        this.cache.delete(key)
        removed++
      }
    }

    return removed
  }
}

// 싱글톤 인스턴스
export const responseCache = new ResponseCache()

// 10분마다 만료된 캐시 정리
setInterval(() => {
  const removed = responseCache.cleanup()
  if (removed > 0) {
    console.log(`[ResponseCache] ${removed}개 만료 항목 정리됨`)
  }
}, 10 * 60 * 1000)
