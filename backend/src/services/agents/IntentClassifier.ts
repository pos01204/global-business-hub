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

export class IntentClassifier {
  private systemPrompt = `당신은 데이터 분석 쿼리 의도 분류 전문가입니다.
사용자의 자연어 질문을 분석하여 구조화된 의도와 엔티티를 추출합니다.

사용 가능한 데이터 소스:
- order: 주문 정보 (order_code, order_created, user_id, Total GMV, platform, PG사, method)
- logistics: 물류 추적 정보 (order_code, shipment_id, country, product_name, artist_name, 처리상태 등)
- users: 사용자 정보 (ID, NAME, EMAIL, COUNTRY, CREATED_AT)
- artists: 작가 정보 (작가명, 작품수 등)

의도 유형:
- general_query: 일반적인 질의
- trend_analysis: 트렌드 분석
- comparison: 비교 분석
- aggregation: 집계 분석
- ranking: 랭킹 분석
- filter: 필터링
- join: 조인 분석 (여러 시트 결합)

날짜 형식:
- 절대 날짜: "2025년 11월", "2025-11-01"
- 상대 날짜: "최근 30일", "지난 주", "이번 달"
- 월/년: "11월", "2025년"

필터 연산자:
- equals: 정확히 일치
- contains: 포함
- greater_than: 초과
- less_than: 미만
- in: 목록에 포함
- between: 범위

JSON 형식으로 응답하세요:
{
  "intent": "의도",
  "confidence": 0.0-1.0,
  "entities": {
    "dateRange": {"start": "YYYY-MM-DD", "end": "YYYY-MM-DD", "type": "absolute|relative|month|year"},
    "sheets": ["order"],
    "filters": [{"column": "country", "operator": "equals", "value": "JP"}],
    "aggregations": [{"column": "Total GMV", "function": "sum"}],
    "groupBy": ["country"],
    "orderBy": [{"column": "Total GMV", "direction": "desc"}],
    "limit": 10
  },
  "context": {
    "clarificationNeeded": false,
    "suggestedQuestions": []
  }
}`

  async classify(query: string, history?: Array<{ role: string; content: string }>): Promise<ExtractedIntent> {
    try {
      // LLM을 통한 의도 분류
      const prompt = `${this.systemPrompt}

사용자 질문: ${query}

${history && history.length > 0 
  ? `대화 히스토리:\n${history.slice(-3).map(h => `${h.role}: ${h.content}`).join('\n')}`
  : ''}

위 질문을 분석하여 구조화된 의도와 엔티티를 추출해주세요.
JSON 형식으로만 응답하세요.`

      const response = await openaiService.generate(prompt, {
        temperature: 0.3, // 낮은 temperature로 일관성 확보
        maxTokens: 1000,
      })

      // JSON 파싱
      let parsed: ExtractedIntent
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0])
        } else {
          parsed = JSON.parse(response)
        }
      } catch (e) {
        // 파싱 실패 시 폴백 로직
        return this.fallbackClassification(query)
      }

      // 날짜 범위 정규화
      if (parsed.entities.dateRange) {
        parsed.entities.dateRange = this.normalizeDateRange(
          parsed.entities.dateRange,
          query
        )
      }

      return parsed
    } catch (error: any) {
      console.error('[IntentClassifier] 오류:', error)
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
  ): { start: string; end: string; type: string } {
    const today = new Date()
    const endDate = new Date(today)
    endDate.setHours(23, 59, 59, 999)

    // 이미 정규화된 경우
    if (dateRange.start && dateRange.end && dateRange.start.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateRange
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
        type: 'relative',
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
        type: 'month',
      }
    }

    // 기본값: 최근 30일
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 30)
    startDate.setHours(0, 0, 0, 0)

    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
      type: 'relative',
    }
  }
}

export const intentClassifier = new IntentClassifier()

