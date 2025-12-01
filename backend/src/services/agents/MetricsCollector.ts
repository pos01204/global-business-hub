/**
 * 메트릭 수집기
 * AI Agent 성능 모니터링 및 분석
 */

export interface AgentMetric {
  timestamp: Date
  agentType: string
  operation: string
  duration: number // ms
  success: boolean
  error?: string
  metadata?: {
    query?: string
    intent?: string
    dataCount?: number
    tokenUsage?: number
    cacheHit?: boolean
    retryCount?: number
  }
}

export interface AggregatedMetrics {
  totalRequests: number
  successRate: number
  avgDuration: number
  p50Duration: number
  p95Duration: number
  p99Duration: number
  errorRate: number
  cacheHitRate: number
  byAgent: Record<string, {
    requests: number
    successRate: number
    avgDuration: number
  }>
  byOperation: Record<string, {
    requests: number
    successRate: number
    avgDuration: number
  }>
  recentErrors: Array<{
    timestamp: Date
    agent: string
    error: string
  }>
}

export class MetricsCollector {
  private metrics: AgentMetric[] = []
  private maxMetrics = 10000 // 최대 저장 개수
  private retentionPeriod = 24 * 60 * 60 * 1000 // 24시간

  /**
   * 메트릭 기록
   */
  record(metric: Omit<AgentMetric, 'timestamp'>): void {
    const fullMetric: AgentMetric = {
      ...metric,
      timestamp: new Date(),
    }

    this.metrics.push(fullMetric)

    // 오래된 메트릭 정리
    this.cleanup()

    // 로깅 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Metrics] ${metric.agentType}.${metric.operation}: ${metric.duration}ms (${metric.success ? 'success' : 'failed'})`)
    }
  }

  /**
   * 작업 시간 측정 헬퍼
   */
  async measure<T>(
    agentType: string,
    operation: string,
    fn: () => Promise<T>,
    metadata?: AgentMetric['metadata']
  ): Promise<T> {
    const startTime = Date.now()
    let success = true
    let error: string | undefined

    try {
      const result = await fn()
      return result
    } catch (e: any) {
      success = false
      error = e.message
      throw e
    } finally {
      this.record({
        agentType,
        operation,
        duration: Date.now() - startTime,
        success,
        error,
        metadata,
      })
    }
  }

  /**
   * 집계된 메트릭 조회
   */
  getAggregatedMetrics(periodMs?: number): AggregatedMetrics {
    const cutoff = periodMs 
      ? new Date(Date.now() - periodMs)
      : new Date(0)

    const filtered = this.metrics.filter(m => m.timestamp >= cutoff)

    if (filtered.length === 0) {
      return this.emptyMetrics()
    }

    // 기본 통계
    const totalRequests = filtered.length
    const successCount = filtered.filter(m => m.success).length
    const successRate = (successCount / totalRequests) * 100

    // 응답 시간 통계
    const durations = filtered.map(m => m.duration).sort((a, b) => a - b)
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
    const p50Duration = this.percentile(durations, 50)
    const p95Duration = this.percentile(durations, 95)
    const p99Duration = this.percentile(durations, 99)

    // 에러율
    const errorRate = ((totalRequests - successCount) / totalRequests) * 100

    // 캐시 히트율
    const cacheMetrics = filtered.filter(m => m.metadata?.cacheHit !== undefined)
    const cacheHits = cacheMetrics.filter(m => m.metadata?.cacheHit).length
    const cacheHitRate = cacheMetrics.length > 0 
      ? (cacheHits / cacheMetrics.length) * 100 
      : 0

    // Agent별 통계
    const byAgent = this.groupByField(filtered, 'agentType')

    // Operation별 통계
    const byOperation = this.groupByField(filtered, 'operation')

    // 최근 에러
    const recentErrors = filtered
      .filter(m => !m.success && m.error)
      .slice(-10)
      .map(m => ({
        timestamp: m.timestamp,
        agent: m.agentType,
        error: m.error!,
      }))

    return {
      totalRequests,
      successRate,
      avgDuration,
      p50Duration,
      p95Duration,
      p99Duration,
      errorRate,
      cacheHitRate,
      byAgent,
      byOperation,
      recentErrors,
    }
  }

  /**
   * 특정 Agent 메트릭 조회
   */
  getAgentMetrics(agentType: string, periodMs?: number): AggregatedMetrics {
    const cutoff = periodMs 
      ? new Date(Date.now() - periodMs)
      : new Date(0)

    const filtered = this.metrics.filter(
      m => m.agentType === agentType && m.timestamp >= cutoff
    )

    if (filtered.length === 0) {
      return this.emptyMetrics()
    }

    return this.getAggregatedMetrics(periodMs)
  }

  /**
   * 실시간 통계 (최근 1분)
   */
  getRealtimeStats(): {
    requestsPerMinute: number
    avgResponseTime: number
    errorCount: number
  } {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000)
    const recent = this.metrics.filter(m => m.timestamp >= oneMinuteAgo)

    return {
      requestsPerMinute: recent.length,
      avgResponseTime: recent.length > 0
        ? recent.reduce((sum, m) => sum + m.duration, 0) / recent.length
        : 0,
      errorCount: recent.filter(m => !m.success).length,
    }
  }

  /**
   * 메트릭 초기화
   */
  clear(): void {
    this.metrics = []
  }

  /**
   * 오래된 메트릭 정리
   */
  private cleanup(): void {
    const cutoff = new Date(Date.now() - this.retentionPeriod)
    
    // 오래된 메트릭 제거
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoff)

    // 최대 개수 초과 시 오래된 것부터 제거
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }

  /**
   * 백분위수 계산
   */
  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0
    const index = Math.ceil((p / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)]
  }

  /**
   * 필드별 그룹화 통계
   */
  private groupByField(
    metrics: AgentMetric[],
    field: 'agentType' | 'operation'
  ): Record<string, { requests: number; successRate: number; avgDuration: number }> {
    const groups = new Map<string, AgentMetric[]>()

    for (const m of metrics) {
      const key = m[field]
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(m)
    }

    const result: Record<string, { requests: number; successRate: number; avgDuration: number }> = {}

    for (const [key, items] of groups.entries()) {
      const successCount = items.filter(m => m.success).length
      result[key] = {
        requests: items.length,
        successRate: (successCount / items.length) * 100,
        avgDuration: items.reduce((sum, m) => sum + m.duration, 0) / items.length,
      }
    }

    return result
  }

  /**
   * 빈 메트릭 객체
   */
  private emptyMetrics(): AggregatedMetrics {
    return {
      totalRequests: 0,
      successRate: 0,
      avgDuration: 0,
      p50Duration: 0,
      p95Duration: 0,
      p99Duration: 0,
      errorRate: 0,
      cacheHitRate: 0,
      byAgent: {},
      byOperation: {},
      recentErrors: [],
    }
  }

  /**
   * 메트릭 내보내기 (JSON)
   */
  export(): string {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      totalMetrics: this.metrics.length,
      aggregated: this.getAggregatedMetrics(),
      realtime: this.getRealtimeStats(),
    }, null, 2)
  }
}

// 싱글톤 인스턴스
export const metricsCollector = new MetricsCollector()

// 1시간마다 오래된 메트릭 정리
setInterval(() => {
  const before = metricsCollector['metrics'].length
  metricsCollector['cleanup']()
  const after = metricsCollector['metrics'].length
  if (before !== after) {
    console.log(`[MetricsCollector] ${before - after}개 오래된 메트릭 정리됨`)
  }
}, 60 * 60 * 1000)
