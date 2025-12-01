/**
 * 데이터 캐싱 서비스
 * Google Sheets API 호출 최적화를 위한 인메모리 캐시
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // milliseconds
  hits: number
}

interface CacheStats {
  totalEntries: number
  totalHits: number
  totalMisses: number
  hitRate: number
  memoryUsage: string
}

export class DataCacheService {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private stats = {
    hits: 0,
    misses: 0,
  }

  // 기본 TTL: 5분 (시트 데이터는 자주 변경되지 않음)
  private defaultTTL = 5 * 60 * 1000

  // 시트별 TTL 설정
  private sheetTTL: Record<string, number> = {
    order: 3 * 60 * 1000,      // 주문: 3분 (자주 변경)
    logistics: 3 * 60 * 1000,  // 물류: 3분
    users: 10 * 60 * 1000,     // 사용자: 10분 (덜 변경)
    artists: 10 * 60 * 1000,   // 작가: 10분
    review: 5 * 60 * 1000,     // 리뷰: 5분
    settlement_records: 30 * 60 * 1000, // 정산: 30분 (거의 안 변함)
    rate_lotte: 60 * 60 * 1000,  // 요금표: 1시간
    rate_ems: 60 * 60 * 1000,
    rate_kpacket: 60 * 60 * 1000,
  }

  /**
   * 캐시 키 생성
   */
  private generateKey(params: {
    sheet: string
    dateRange?: { start: string; end: string }
    filters?: any
  }): string {
    const parts = [params.sheet]
    
    if (params.dateRange) {
      parts.push(`${params.dateRange.start}_${params.dateRange.end}`)
    }
    
    if (params.filters) {
      parts.push(JSON.stringify(params.filters))
    }
    
    return parts.join(':')
  }

  /**
   * 캐시에서 데이터 조회
   */
  get<T>(params: {
    sheet: string
    dateRange?: { start: string; end: string }
    filters?: any
  }): T | null {
    const key = this.generateKey(params)
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      return null
    }

    // TTL 확인
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    entry.hits++
    this.stats.hits++
    return entry.data as T
  }

  /**
   * 캐시에 데이터 저장
   */
  set<T>(
    params: {
      sheet: string
      dateRange?: { start: string; end: string }
      filters?: any
    },
    data: T,
    customTTL?: number
  ): void {
    const key = this.generateKey(params)
    const ttl = customTTL || this.sheetTTL[params.sheet] || this.defaultTTL

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0,
    })

    // 캐시 크기 제한 (최대 100개 엔트리)
    if (this.cache.size > 100) {
      this.evictOldest()
    }
  }

  /**
   * 특정 시트 캐시 무효화
   */
  invalidate(sheet: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(sheet + ':') || key === sheet) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 전체 캐시 클리어
   */
  clear(): void {
    this.cache.clear()
    this.stats.hits = 0
    this.stats.misses = 0
  }

  /**
   * 캐시 통계 조회
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses
    return {
      totalEntries: this.cache.size,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
      memoryUsage: this.estimateMemoryUsage(),
    }
  }

  /**
   * 가장 오래된 엔트리 제거
   */
  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * 메모리 사용량 추정
   */
  private estimateMemoryUsage(): string {
    let totalSize = 0
    for (const entry of this.cache.values()) {
      totalSize += JSON.stringify(entry.data).length * 2 // UTF-16
    }
    
    if (totalSize < 1024) return `${totalSize} B`
    if (totalSize < 1024 * 1024) return `${(totalSize / 1024).toFixed(1)} KB`
    return `${(totalSize / (1024 * 1024)).toFixed(1)} MB`
  }

  /**
   * 만료된 엔트리 정리 (주기적 호출용)
   */
  cleanup(): number {
    let removed = 0
    const now = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
        removed++
      }
    }

    return removed
  }
}

// 싱글톤 인스턴스
export const dataCacheService = new DataCacheService()

// 5분마다 만료된 캐시 정리
setInterval(() => {
  const removed = dataCacheService.cleanup()
  if (removed > 0) {
    console.log(`[DataCache] ${removed}개 만료 엔트리 정리됨`)
  }
}, 5 * 60 * 1000)
