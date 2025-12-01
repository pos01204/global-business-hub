/**
 * 재시도 핸들러
 * API 호출 실패 시 자동 재시도 및 폴백 처리
 */

export interface RetryConfig {
  maxRetries: number
  baseDelay: number // ms
  maxDelay: number // ms
  backoffMultiplier: number
  retryableErrors: string[]
}

export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: string
  attempts: number
  totalTime: number
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'rate_limit',
    '429',
    '500',
    '502',
    '503',
    '504',
    'timeout',
    'network',
  ],
}

export class RetryHandler {
  private config: RetryConfig

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * 재시도 가능한 에러인지 확인
   */
  private isRetryable(error: any): boolean {
    const errorMessage = String(error?.message || error || '').toLowerCase()
    const errorCode = String(error?.code || '').toLowerCase()
    const statusCode = String(error?.response?.status || '')

    return this.config.retryableErrors.some(
      (retryable) =>
        errorMessage.includes(retryable.toLowerCase()) ||
        errorCode.includes(retryable.toLowerCase()) ||
        statusCode === retryable
    )
  }

  /**
   * 지수 백오프 딜레이 계산
   */
  private calculateDelay(attempt: number): number {
    const delay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1)
    // 지터 추가 (±20%)
    const jitter = delay * 0.2 * (Math.random() * 2 - 1)
    return Math.min(delay + jitter, this.config.maxDelay)
  }

  /**
   * 재시도 로직으로 함수 실행
   */
  async execute<T>(
    fn: () => Promise<T>,
    context?: string
  ): Promise<RetryResult<T>> {
    const startTime = Date.now()
    let lastError: any = null

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const data = await fn()
        return {
          success: true,
          data,
          attempts: attempt,
          totalTime: Date.now() - startTime,
        }
      } catch (error: any) {
        lastError = error
        const isRetryable = this.isRetryable(error)

        console.warn(
          `[RetryHandler] ${context || 'Operation'} 실패 (시도 ${attempt}/${this.config.maxRetries})`,
          {
            error: error.message,
            isRetryable,
            code: error.code,
            status: error.response?.status,
          }
        )

        // 마지막 시도이거나 재시도 불가능한 에러면 종료
        if (attempt === this.config.maxRetries || !isRetryable) {
          break
        }

        // 딜레이 후 재시도
        const delay = this.calculateDelay(attempt)
        console.log(`[RetryHandler] ${delay}ms 후 재시도...`)
        await this.sleep(delay)
      }
    }

    return {
      success: false,
      error: lastError?.message || '알 수 없는 오류',
      attempts: this.config.maxRetries,
      totalTime: Date.now() - startTime,
    }
  }

  /**
   * 폴백과 함께 실행
   */
  async executeWithFallback<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T>,
    context?: string
  ): Promise<RetryResult<T>> {
    // 먼저 primary 시도
    const primaryResult = await this.execute(primary, `${context} (primary)`)
    
    if (primaryResult.success) {
      return primaryResult
    }

    // primary 실패 시 fallback 시도
    console.log(`[RetryHandler] Primary 실패, fallback 시도: ${context}`)
    const fallbackResult = await this.execute(fallback, `${context} (fallback)`)

    return {
      ...fallbackResult,
      attempts: primaryResult.attempts + fallbackResult.attempts,
      totalTime: primaryResult.totalTime + fallbackResult.totalTime,
    }
  }

  /**
   * 병렬 실행 (하나라도 성공하면 반환)
   */
  async executeRace<T>(
    fns: Array<() => Promise<T>>,
    context?: string
  ): Promise<RetryResult<T>> {
    const startTime = Date.now()

    try {
      const promises = fns.map((fn, index) =>
        this.execute(fn, `${context} [${index}]`).then((result) => {
          if (result.success) return result
          throw new Error(result.error)
        })
      )

      const result = await Promise.any(promises)
      return {
        ...result,
        totalTime: Date.now() - startTime,
      }
    } catch (error: any) {
      return {
        success: false,
        error: '모든 시도가 실패했습니다.',
        attempts: fns.length * this.config.maxRetries,
        totalTime: Date.now() - startTime,
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// 기본 인스턴스
export const retryHandler = new RetryHandler()

// OpenAI 전용 (더 긴 딜레이)
export const openaiRetryHandler = new RetryHandler({
  maxRetries: 3,
  baseDelay: 2000,
  maxDelay: 15000,
  backoffMultiplier: 2,
})

// Google Sheets 전용
export const sheetsRetryHandler = new RetryHandler({
  maxRetries: 2,
  baseDelay: 1000,
  maxDelay: 5000,
  backoffMultiplier: 1.5,
})
