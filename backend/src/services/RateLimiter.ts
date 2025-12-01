/**
 * Rate Limiter
 * OpenAI API 요청 속도 제한 및 토큰 절약
 */

interface RateLimitConfig {
  maxRequestsPerMinute: number
  maxTokensPerMinute: number
  retryAfterMs: number
}

interface QueuedRequest {
  id: string
  execute: () => Promise<any>
  resolve: (value: any) => void
  reject: (error: any) => void
  priority: number
  timestamp: number
}

export class RateLimiter {
  private config: RateLimitConfig
  private requestTimestamps: number[] = []
  private tokenUsage: Array<{ timestamp: number; tokens: number }> = []
  private queue: QueuedRequest[] = []
  private isProcessing = false

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      maxRequestsPerMinute: config.maxRequestsPerMinute || 3, // Free tier: 3 RPM
      maxTokensPerMinute: config.maxTokensPerMinute || 40000, // Free tier: 40K TPM
      retryAfterMs: config.retryAfterMs || 20000, // 20초 대기
    }

    // 1분마다 오래된 기록 정리
    setInterval(() => this.cleanup(), 60000)
  }

  /**
   * Rate limit 확인 후 요청 실행
   */
  async execute<T>(
    fn: () => Promise<T>,
    options?: { priority?: number; estimatedTokens?: number }
  ): Promise<T> {
    const priority = options?.priority || 5
    const estimatedTokens = options?.estimatedTokens || 1000

    // 즉시 실행 가능한지 확인
    if (this.canExecuteNow(estimatedTokens)) {
      return this.executeWithTracking(fn, estimatedTokens)
    }

    // 큐에 추가하고 대기
    return new Promise((resolve, reject) => {
      const request: QueuedRequest = {
        id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        execute: fn,
        resolve,
        reject,
        priority,
        timestamp: Date.now(),
      }

      this.queue.push(request)
      this.queue.sort((a, b) => b.priority - a.priority) // 높은 우선순위 먼저

      console.log(`[RateLimiter] 요청 큐에 추가됨 (대기: ${this.queue.length}개)`)

      // 큐 처리 시작
      this.processQueue()
    })
  }

  /**
   * 즉시 실행 가능 여부 확인
   */
  private canExecuteNow(estimatedTokens: number): boolean {
    const now = Date.now()
    const oneMinuteAgo = now - 60000

    // 최근 1분간 요청 수 확인
    const recentRequests = this.requestTimestamps.filter(t => t > oneMinuteAgo)
    if (recentRequests.length >= this.config.maxRequestsPerMinute) {
      return false
    }

    // 최근 1분간 토큰 사용량 확인
    const recentTokens = this.tokenUsage
      .filter(t => t.timestamp > oneMinuteAgo)
      .reduce((sum, t) => sum + t.tokens, 0)
    
    if (recentTokens + estimatedTokens > this.config.maxTokensPerMinute) {
      return false
    }

    return true
  }

  /**
   * 추적과 함께 실행
   */
  private async executeWithTracking<T>(
    fn: () => Promise<T>,
    estimatedTokens: number
  ): Promise<T> {
    const now = Date.now()
    this.requestTimestamps.push(now)
    this.tokenUsage.push({ timestamp: now, tokens: estimatedTokens })

    try {
      return await fn()
    } catch (error: any) {
      // Rate limit 에러 시 대기 시간 추출
      if (error.response?.status === 429) {
        const retryAfter = this.extractRetryAfter(error)
        console.log(`[RateLimiter] Rate limit 도달, ${retryAfter}ms 후 재시도`)
        
        await this.sleep(retryAfter)
        return this.executeWithTracking(fn, estimatedTokens)
      }
      throw error
    }
  }

  /**
   * 큐 처리
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return

    this.isProcessing = true

    while (this.queue.length > 0) {
      const request = this.queue[0]

      // 실행 가능할 때까지 대기
      while (!this.canExecuteNow(1000)) {
        const waitTime = this.calculateWaitTime()
        console.log(`[RateLimiter] ${waitTime}ms 대기 중...`)
        await this.sleep(waitTime)
      }

      // 큐에서 제거하고 실행
      this.queue.shift()

      try {
        const result = await this.executeWithTracking(request.execute, 1000)
        request.resolve(result)
      } catch (error) {
        request.reject(error)
      }
    }

    this.isProcessing = false
  }

  /**
   * 대기 시간 계산
   */
  private calculateWaitTime(): number {
    const now = Date.now()
    const oneMinuteAgo = now - 60000

    // 가장 오래된 요청이 만료될 때까지 대기
    const oldestRequest = this.requestTimestamps
      .filter(t => t > oneMinuteAgo)
      .sort((a, b) => a - b)[0]

    if (oldestRequest) {
      return Math.max(1000, oldestRequest + 60000 - now + 1000) // 1초 여유
    }

    return this.config.retryAfterMs
  }

  /**
   * 에러에서 retry-after 추출
   */
  private extractRetryAfter(error: any): number {
    const message = error.response?.data?.error?.message || ''
    const match = message.match(/try again in (\d+)s/)
    if (match) {
      return parseInt(match[1]) * 1000 + 1000 // 1초 여유
    }
    return this.config.retryAfterMs
  }

  /**
   * 오래된 기록 정리
   */
  private cleanup(): void {
    const oneMinuteAgo = Date.now() - 60000
    this.requestTimestamps = this.requestTimestamps.filter(t => t > oneMinuteAgo)
    this.tokenUsage = this.tokenUsage.filter(t => t.timestamp > oneMinuteAgo)
  }

  /**
   * 현재 상태 조회
   */
  getStatus(): {
    requestsInLastMinute: number
    tokensInLastMinute: number
    queueLength: number
    canExecuteNow: boolean
  } {
    const now = Date.now()
    const oneMinuteAgo = now - 60000

    return {
      requestsInLastMinute: this.requestTimestamps.filter(t => t > oneMinuteAgo).length,
      tokensInLastMinute: this.tokenUsage
        .filter(t => t.timestamp > oneMinuteAgo)
        .reduce((sum, t) => sum + t.tokens, 0),
      queueLength: this.queue.length,
      canExecuteNow: this.canExecuteNow(1000),
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 싱글톤 인스턴스
export const rateLimiter = new RateLimiter()
