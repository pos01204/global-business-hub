/**
 * Business Brain 전용 캐시
 * 기존 DataCacheService와 독립적으로 동작
 */

interface CacheEntry<T> {
  data: T
  expiry: number
  createdAt: number
}

interface CacheConfig {
  defaultTtl: number
  maxSize: number
}

const DEFAULT_CONFIG: CacheConfig = {
  defaultTtl: 10 * 60 * 1000, // 10분
  maxSize: 100,
}

// TTL 설정 (밀리초)
export const CACHE_TTL = {
  briefing: 10 * 60 * 1000,        // 10분
  healthScore: 5 * 60 * 1000,      // 5분
  insights: 10 * 60 * 1000,        // 10분
  cubeAnalysis: 30 * 60 * 1000,    // 30분
  decomposition: 15 * 60 * 1000,   // 15분
  survivalAnalysis: 60 * 60 * 1000, // 1시간
}

export class BusinessBrainCache {
  private cache = new Map<string, CacheEntry<any>>()
  private config: CacheConfig

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * 캐시에서 데이터 조회
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // 만료 확인
    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      console.log(`[BusinessBrainCache] 캐시 만료: ${key}`)
      return null
    }

    console.log(`[BusinessBrainCache] 캐시 히트: ${key}`)
    return entry.data as T
  }

  /**
   * 캐시에 데이터 저장
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // 최대 크기 초과 시 오래된 항목 제거
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest()
    }

    const entry: CacheEntry<T> = {
      data,
      expiry: Date.now() + (ttl || this.config.defaultTtl),
      createdAt: Date.now(),
    }

    this.cache.set(key, entry)
    console.log(`[BusinessBrainCache] 캐시 저장: ${key}, TTL: ${ttl || this.config.defaultTtl}ms`)
  }

  /**
   * 특정 패턴의 캐시 무효화
   */
  invalidate(pattern: string): number {
    let count = 0
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
        count++
      }
    }
    console.log(`[BusinessBrainCache] 캐시 무효화: ${pattern}, ${count}개 삭제`)
    return count
  }

  /**
   * 전체 캐시 클리어
   */
  clear(): void {
    const size = this.cache.size
    this.cache.clear()
    console.log(`[BusinessBrainCache] 전체 캐시 클리어: ${size}개 삭제`)
  }

  /**
   * 캐시 통계
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }

  /**
   * 가장 오래된 항목 제거
   */
  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      console.log(`[BusinessBrainCache] 오래된 캐시 제거: ${oldestKey}`)
    }
  }

  /**
   * 캐시 키 생성 헬퍼
   */
  static generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(k => `${k}=${JSON.stringify(params[k])}`)
      .join('&')
    return `${prefix}:${sortedParams}`
  }
}

// 싱글톤 인스턴스
export const businessBrainCache = new BusinessBrainCache()
