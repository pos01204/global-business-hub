import { ExtractedIntent } from './IntentClassifier'

export interface OptimizedQuery {
  sheets: string[]
  dateRange?: { start: string; end: string }
  filters: Array<{
    column: string
    operator: string
    value: any
  }>
  aggregations?: Record<string, string>
  groupBy?: string[]
  orderBy?: Array<{ column: string; direction: 'asc' | 'desc' }>
  limit?: number
  join?: Array<{
    leftSheet: string
    rightSheet: string
    leftKey: string
    rightKey: string
  }>
}

export class QueryOptimizer {
  /**
   * 의도를 최적화된 쿼리로 변환
   */
  optimize(intent: ExtractedIntent): OptimizedQuery {
    const optimized: OptimizedQuery = {
      sheets: intent.entities.sheets || ['order'],
      filters: [],
    }

    // 날짜 범위 추가
    if (intent.entities.dateRange) {
      optimized.dateRange = {
        start: intent.entities.dateRange.start,
        end: intent.entities.dateRange.end,
      }
    }

    // 필터 변환
    if (intent.entities.filters) {
      optimized.filters = intent.entities.filters.map((f) => ({
        column: f.column,
        operator: f.operator,
        value: f.value,
      }))
    }

    // 집계 변환
    if (intent.entities.aggregations && intent.entities.aggregations.length > 0) {
      optimized.aggregations = {}
      for (const agg of intent.entities.aggregations) {
        optimized.aggregations[agg.column] = agg.function
      }
    }

    // 그룹화
    if (intent.entities.groupBy && intent.entities.groupBy.length > 0) {
      optimized.groupBy = intent.entities.groupBy
    }

    // 정렬
    if (intent.entities.orderBy && intent.entities.orderBy.length > 0) {
      optimized.orderBy = intent.entities.orderBy
    }

    // 제한
    if (intent.entities.limit) {
      optimized.limit = intent.entities.limit
    }

    // 조인 필요성 확인
    if (optimized.sheets.length > 1) {
      optimized.join = this.detectJoins(optimized.sheets)
    }

    return optimized
  }

  /**
   * 조인 필요성 감지
   */
  private detectJoins(sheets: string[]): Array<{
    leftSheet: string
    rightSheet: string
    leftKey: string
    rightKey: string
  }> {
    const joins: Array<{
      leftSheet: string
      rightSheet: string
      leftKey: string
      rightKey: string
    }> = []

    // order와 logistics 조인
    if (sheets.includes('order') && sheets.includes('logistics')) {
      joins.push({
        leftSheet: 'order',
        rightSheet: 'logistics',
        leftKey: 'order_code',
        rightKey: 'order_code',
      })
    }

    // order와 users 조인
    if (sheets.includes('order') && sheets.includes('users')) {
      joins.push({
        leftSheet: 'order',
        rightSheet: 'users',
        leftKey: 'user_id',
        rightKey: 'ID',
      })
    }

    return joins
  }

  /**
   * 쿼리 검증
   */
  validate(query: OptimizedQuery): {
    valid: boolean
    errors: string[]
    suggestions: string[]
  } {
    const errors: string[] = []
    const suggestions: string[] = []

    // 시트 검증
    const validSheets = ['order', 'logistics', 'users', 'artists']
    for (const sheet of query.sheets) {
      if (!validSheets.includes(sheet)) {
        errors.push(`알 수 없는 시트: ${sheet}`)
      }
    }

    // 날짜 범위 검증
    if (query.dateRange) {
      const start = new Date(query.dateRange.start)
      const end = new Date(query.dateRange.end)
      if (start > end) {
        errors.push('시작 날짜가 종료 날짜보다 늦습니다.')
      }
      if (end > new Date()) {
        suggestions.push('미래 날짜가 포함되어 있습니다. 확인이 필요합니다.')
      }
    }

    // 필터 검증
    for (const filter of query.filters) {
      if (!filter.column || !filter.operator) {
        errors.push('필터에 컬럼 또는 연산자가 없습니다.')
      }
    }

    // 집계 검증
    if (query.aggregations && Object.keys(query.aggregations).length > 0) {
      if (!query.groupBy || query.groupBy.length === 0) {
        suggestions.push('집계 함수를 사용할 때는 groupBy를 지정하는 것이 좋습니다.')
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      suggestions,
    }
  }
}

export const queryOptimizer = new QueryOptimizer()


