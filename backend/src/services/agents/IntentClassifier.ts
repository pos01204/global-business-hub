import { openaiService } from '../openaiService'

export interface ExtractedIntent {
  intent: string
  confidence: number
  entities: {
    dateRange?: {
      start: string
      end: string
      type: 'absolute' | 'relative' | 'month' | 'year' | 'quarter'
    }
    sheets?: string[]
    filters?: Array<{
      column: string
      operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'between'
      value: any
    }>
    aggregations?: Array<{
      column: string
      function: 'sum' | 'avg' | 'count' | 'max' | 'min'
    }>
    groupBy?: string[]
    orderBy?: Array<{
      column: string
      direction: 'asc' | 'desc'
    }>
    limit?: number
  }
  context?: {
    previousQuery?: string
    clarificationNeeded?: boolean
    suggestedQuestions?: string[]
  }
}

// Function Calling을 위한 함수 정의
const INTENT_CLASSIFICATION_FUNCTION = {
  name: 'classify_query_intent',
  description: '사용자의 자연어 질문을 분석하여 데이터 분석에 필요한 구조화된 의도와 엔티티를 추출합니다.',
  parameters: {
    type: 'object',
    properties: {
      intent: {
        type: 'string',
        enum: ['general_query', 'trend_analysis', 'comparison', 'aggregation', 'ranking', 'filter', 'join'],
        description: '질문의 의도 유형',
      },
      confidence: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        description: '의도 분류 신뢰도 (0.0 ~ 1.0)',
      },
      sheets: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['order', 'logistics', 'users', 'artists'],
        },
        description: '필요한 데이터 시트 목록',
      },
      dateRange: {
        type: 'object',
        properties: {
          start: { type: 'string', description: '시작 날짜 (YYYY-MM-DD)' },
          end: { type: 'string', description: '종료 날짜 (YYYY-MM-DD)' },
          type: { type: 'string', enum: ['absolute', 'relative', 'month', 'year', 'quarter'] },
        },
        description: '날짜 범위',
      },
      filters: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            column: { type: 'string', description: '필터링할 컬럼명' },
            operator: { type: 'string', enum: ['equals', 'contains', 'greater_than', 'less_than', 'in', 'between'] },
            value: { description: '필터 값' },
          },
        },
        description: '필터 조건 목록',
      },
      aggregations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            column: { type: 'string', description: '집계할 컬럼명' },
            function: { type: 'string', enum: ['sum', 'avg', 'count', 'max', 'min'] },
          },
        },
        description: '집계 함수 목록',
      },
      groupBy: {
        type: 'array',
        items: { type: 'string' },
        description: '그룹화할 컬럼 목록',
      },
      orderBy: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            column: { type: 'string' },
            direction: { type: 'string', enum: ['asc', 'desc'] },
          },
        },
        description: '정렬 조건',
      },
      limit: {
        type: 'number',
        description: '결과 제한 수',
      },
    },
    required: ['intent', 'confidence', 'sheets'],
  },
}

export class IntentClassifier {
  private systemPrompt = `당신은 데이터 분석 쿼리 의도 분류 전문가입니다.
사용자의 자연어 질문을 분석하여 구조화된 의도와 엔티티를 추출합니다.

사용 가능한 데이터 소스:
- order: 주문 정보 (order_code, order_created, user_id, Total GMV, platform, PG사, method)
- logistics: 물류 추적 정보 (order_code, shipment_id, country, product_name, artist_name (kr), 처리상태 등)
- users: 사용자 정보 (ID, NAME, EMAIL, COUNTRY, CREATED_AT)
- artists: 작가 정보 (작가명, 작품수 등)

의도 유형:
- general_query: 일반적인 질의 (현황, 상태 확인)
- trend_analysis: 트렌드/추이 분석 (시간에 따른 변화)
- comparison: 비교 분석 (국가별, 플랫폼별 비교)
- aggregation: 집계 분석 (합계, 평균 등)
- ranking: 랭킹 분석 (상위 N개, 순위)
- filter: 필터링 (특정 조건 검색)
- join: 조인 분석 (여러 시트 결합)

중요한 컬럼명:
- order 시트: order_code, order_created, user_id, Total GMV, platform, PG사, method
- logistics 시트: order_code, shipment_id, country, product_name, artist_name (kr), 처리상태, 구매수량
- users 시트: ID, NAME, EMAIL, COUNTRY, CREATED_AT

국가 코드: JP(일본), US(미국), KR(한국), CN(중국), TW(대만), HK(홍콩)

오늘 날짜: ${new Date().toISOString().split('T')[0]}`

  async classify(query: string, history?: Array<{ role: string; content: string }>): Promise<ExtractedIntent> {
    try {
      // Function Calling을 통한 의도 분류
      const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
        { role: 'system', content: this.systemPrompt },
      ]

      // 대화 히스토리 추가
      if (history && history.length > 0) {
        const recentHistory = history.slice(-3)
        for (const h of recentHistory) {
          messages.push({
            role: h.role === 'user' ? 'user' : 'assistant',
            content: h.content,
          })
        }
      }

      messages.push({ role: 'user', content: query })

      const result = await openaiService.generateWithFunctions(
        messages,
        [INTENT_CLASSIFICATION_FUNCTION],
        {
          temperature: 0.2,
          maxTokens: 1000,
          functionCall: { name: 'classify_query_intent' },
        }
      )

      // Function Call 결과 처리
      if (result.functionCall && result.functionCall.name === 'classify_query_intent') {
        const args = result.functionCall.arguments
        
        const extracted: ExtractedIntent = {
          intent: args.intent || 'general_query',
          confidence: args.confidence || 0.8,
          entities: {
            sheets: args.sheets || ['order'],
            dateRange: args.dateRange ? this.normalizeDateRange(args.dateRange, query) : undefined,
            filters: args.filters,
            aggregations: args.aggregations,
            groupBy: args.groupBy,
            orderBy: args.orderBy,
            limit: args.limit,
          },
        }

        console.log('[IntentClassifier] Function Calling 성공:', {
          intent: extracted.intent,
          sheets: extracted.entities.sheets,
          dateRange: extracted.entities.dateRange,
        })

        return extracted
      }

      // Function Call 실패 시 폴백
      console.warn('[IntentClassifier] Function Call 응답 없음, 폴백 사용')
      return this.fallbackClassification(query)
    } catch (error: any) {
      console.error('[IntentClassifier] 오류:', error.message)
      return this.fallbackClassification(query)
    }
  }

  /**
   * 폴백 분류 (LLM 실패 시)
   */
  private fallbackClassification(query: string): ExtractedIntent {
    const lowerQuery = query.toLowerCase()

    // 기본 의도 분류
    let intent = 'general_query'
    if (lowerQuery.includes('트렌드') || lowerQuery.includes('추이')) {
      intent = 'trend_analysis'
    } else if (lowerQuery.includes('비교') || lowerQuery.includes('대비')) {
      intent = 'comparison'
    } else if (lowerQuery.includes('집계') || lowerQuery.includes('합계')) {
      intent = 'aggregation'
    } else if (lowerQuery.includes('상위') || lowerQuery.includes('랭킹')) {
      intent = 'ranking'
    }

    // 기본 시트 추출
    const sheets: string[] = []
    if (lowerQuery.includes('주문') || lowerQuery.includes('매출')) {
      sheets.push('order')
    }
    if (lowerQuery.includes('물류') || lowerQuery.includes('배송')) {
      sheets.push('logistics')
    }
    if (lowerQuery.includes('고객') || lowerQuery.includes('사용자')) {
      sheets.push('users')
    }
    if (sheets.length === 0) {
      sheets.push('order')
    }

    return {
      intent,
      confidence: 0.5,
      entities: {
        sheets,
      },
    }
  }

  /**
   * 날짜 범위 정규화
   */
  private normalizeDateRange(
    dateRange: any,
    query: string
  ): { start: string; end: string; type: 'absolute' | 'relative' | 'month' | 'year' | 'quarter' } {
    const today = new Date()
    const endDate = new Date(today)
    endDate.setHours(23, 59, 59, 999)

    // 이미 정규화된 경우
    if (dateRange.start && dateRange.end && dateRange.start.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // 타입이 이미 올바른 경우 그대로 반환, 아니면 기본값 설정
      if (dateRange.type && ['absolute', 'relative', 'month', 'year', 'quarter'].includes(dateRange.type)) {
        return dateRange as { start: string; end: string; type: 'absolute' | 'relative' | 'month' | 'year' | 'quarter' }
      }
      // 타입이 없거나 잘못된 경우 absolute로 설정
      return {
        start: dateRange.start,
        end: dateRange.end,
        type: 'absolute' as const,
      }
    }

    // 상대적 날짜 파싱
    const lowerQuery = query.toLowerCase()

    if (lowerQuery.includes('최근') || lowerQuery.includes('recent')) {
      const daysMatch = query.match(/(\d+)\s*(일|days?)/i)
      const days = daysMatch ? parseInt(daysMatch[1]) : 30
      const startDate = new Date(today)
      startDate.setDate(startDate.getDate() - days)
      startDate.setHours(0, 0, 0, 0)

      return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        type: 'relative' as const,
      }
    }

    // 월 파싱
    const monthMatch = query.match(/(\d{4})\s*년\s*(\d{1,2})\s*월|(\d{4})\/(\d{1,2})/i)
    if (monthMatch) {
      const year = parseInt(monthMatch[1] || monthMatch[3])
      const month = parseInt(monthMatch[2] || monthMatch[4]) - 1
      const startDate = new Date(year, month, 1)
      startDate.setHours(0, 0, 0, 0)
      const endDateForMonth = new Date(year, month + 1, 0)
      endDateForMonth.setHours(23, 59, 59, 999)

      return {
        start: startDate.toISOString().split('T')[0],
        end: endDateForMonth.toISOString().split('T')[0],
        type: 'month' as const,
      }
    }

    // 기본값: 최근 30일
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 30)
    startDate.setHours(0, 0, 0, 0)

    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
      type: 'relative' as const,
    }
  }
}

export const intentClassifier = new IntentClassifier()

