/**
 * 대화 컨텍스트 관리자
 * 멀티턴 대화에서 슬롯 기반 컨텍스트 유지
 */

export interface ConversationSlot {
  dateRange?: { start: string; end: string }
  sheets?: string[]
  filters?: Array<{ column: string; operator: string; value: any }>
  country?: string
  platform?: string
  artist?: string
  limit?: number
  intent?: string
}

export interface ConversationContext {
  sessionId: string
  slots: ConversationSlot
  history: Array<{
    query: string
    intent: string
    timestamp: Date
    dataSnapshot?: {
      rowCount: number
      sheets: string[]
    }
  }>
  lastUpdated: Date
}

// 참조 패턴 정의
const REFERENCE_PATTERNS = [
  { pattern: /^(그|그것|그거|이것|이거|그\s*데이터|이\s*데이터)/i, type: 'data_reference' },
  { pattern: /(이전|아까|방금|위|위의)\s*(결과|데이터|분석)/i, type: 'previous_result' },
  { pattern: /^(더|좀\s*더|자세히|상세히|구체적으로)/i, type: 'drill_down' },
  { pattern: /^(다시|한번\s*더|재)/i, type: 'repeat' },
  { pattern: /(같은\s*기간|동일\s*기간|같은\s*조건)/i, type: 'same_condition' },
  { pattern: /(다른\s*국가|다른\s*플랫폼|다른\s*작가)/i, type: 'change_filter' },
  { pattern: /(비교|대비).*?(해줘|해\s*줘|보여줘)/i, type: 'compare_request' },
]

// 슬롯 추출 패턴
const SLOT_PATTERNS = {
  country: [
    { pattern: /일본|JP/i, value: 'JP' },
    { pattern: /미국|US/i, value: 'US' },
    { pattern: /한국|KR/i, value: 'KR' },
    { pattern: /중국|CN/i, value: 'CN' },
    { pattern: /대만|TW/i, value: 'TW' },
    { pattern: /홍콩|HK/i, value: 'HK' },
  ],
  platform: [
    { pattern: /iOS|아이폰|iPhone/i, value: 'iOS' },
    { pattern: /Android|안드로이드/i, value: 'Android' },
    { pattern: /Web|웹/i, value: 'Web' },
  ],
  limit: [
    { pattern: /상위\s*(\d+)/i, extract: (m: RegExpMatchArray) => parseInt(m[1]) },
    { pattern: /(\d+)\s*개/i, extract: (m: RegExpMatchArray) => parseInt(m[1]) },
    { pattern: /top\s*(\d+)/i, extract: (m: RegExpMatchArray) => parseInt(m[1]) },
  ],
}

export class ConversationManager {
  private contexts: Map<string, ConversationContext> = new Map()
  private maxHistoryLength = 10

  /**
   * 세션 컨텍스트 가져오기 또는 생성
   */
  getOrCreateContext(sessionId: string): ConversationContext {
    let context = this.contexts.get(sessionId)
    
    if (!context) {
      context = {
        sessionId,
        slots: {},
        history: [],
        lastUpdated: new Date(),
      }
      this.contexts.set(sessionId, context)
    }

    return context
  }

  /**
   * 쿼리 분석 및 컨텍스트 업데이트
   */
  analyzeAndUpdate(
    sessionId: string,
    query: string,
    intent: string,
    extractedEntities?: any
  ): {
    enhancedQuery: string
    mergedSlots: ConversationSlot
    referenceType?: string
  } {
    const context = this.getOrCreateContext(sessionId)
    
    // 1. 참조 패턴 감지
    const referenceType = this.detectReference(query)
    
    // 2. 새로운 슬롯 추출
    const newSlots = this.extractSlots(query, extractedEntities)
    
    // 3. 슬롯 병합 (참조 타입에 따라 다르게 처리)
    const mergedSlots = this.mergeSlots(context.slots, newSlots, referenceType)
    
    // 4. 쿼리 강화
    const enhancedQuery = this.enhanceQuery(query, context, referenceType)
    
    // 5. 컨텍스트 업데이트
    context.slots = mergedSlots
    context.history.push({
      query,
      intent,
      timestamp: new Date(),
    })
    
    // 히스토리 길이 제한
    if (context.history.length > this.maxHistoryLength) {
      context.history = context.history.slice(-this.maxHistoryLength)
    }
    
    context.lastUpdated = new Date()
    
    return {
      enhancedQuery,
      mergedSlots,
      referenceType,
    }
  }

  /**
   * 참조 패턴 감지
   */
  private detectReference(query: string): string | undefined {
    for (const { pattern, type } of REFERENCE_PATTERNS) {
      if (pattern.test(query)) {
        return type
      }
    }
    return undefined
  }

  /**
   * 슬롯 추출
   */
  private extractSlots(query: string, extractedEntities?: any): ConversationSlot {
    const slots: ConversationSlot = {}

    // 엔티티에서 추출
    if (extractedEntities) {
      if (extractedEntities.dateRange) {
        slots.dateRange = extractedEntities.dateRange
      }
      if (extractedEntities.sheets) {
        slots.sheets = extractedEntities.sheets
      }
      if (extractedEntities.filters) {
        slots.filters = extractedEntities.filters
      }
      if (extractedEntities.limit) {
        slots.limit = extractedEntities.limit
      }
    }

    // 패턴 기반 추출
    for (const { pattern, value } of SLOT_PATTERNS.country) {
      if (pattern.test(query)) {
        slots.country = value
        break
      }
    }

    for (const { pattern, value } of SLOT_PATTERNS.platform) {
      if (pattern.test(query)) {
        slots.platform = value
        break
      }
    }

    for (const { pattern, extract } of SLOT_PATTERNS.limit) {
      const match = query.match(pattern)
      if (match) {
        slots.limit = extract(match)
        break
      }
    }

    return slots
  }

  /**
   * 슬롯 병합
   */
  private mergeSlots(
    existing: ConversationSlot,
    newSlots: ConversationSlot,
    referenceType?: string
  ): ConversationSlot {
    // 완전히 새로운 질문이면 새 슬롯만 사용
    if (!referenceType) {
      // 단, 명시적으로 지정되지 않은 슬롯은 이전 값 유지
      return {
        ...newSlots,
        // 날짜 범위가 없으면 이전 값 유지
        dateRange: newSlots.dateRange || existing.dateRange,
      }
    }

    // 참조 타입별 병합 전략
    switch (referenceType) {
      case 'data_reference':
      case 'previous_result':
      case 'same_condition':
        // 이전 슬롯 유지, 새 슬롯으로 덮어쓰기
        return { ...existing, ...newSlots }

      case 'drill_down':
        // 이전 슬롯 유지, 새 슬롯 추가
        return {
          ...existing,
          ...newSlots,
          // 필터는 병합
          filters: [...(existing.filters || []), ...(newSlots.filters || [])],
        }

      case 'change_filter':
        // 필터만 변경, 나머지 유지
        return {
          ...existing,
          country: newSlots.country || existing.country,
          platform: newSlots.platform || existing.platform,
          artist: newSlots.artist || existing.artist,
        }

      case 'compare_request':
        // 비교 요청 시 기존 조건 유지
        return { ...existing, ...newSlots }

      case 'repeat':
        // 이전 슬롯 그대로 사용
        return existing

      default:
        return { ...existing, ...newSlots }
    }
  }

  /**
   * 쿼리 강화
   */
  private enhanceQuery(
    query: string,
    context: ConversationContext,
    referenceType?: string
  ): string {
    if (!referenceType || context.history.length === 0) {
      return query
    }

    const lastQuery = context.history[context.history.length - 1]?.query

    switch (referenceType) {
      case 'data_reference':
      case 'previous_result':
        return `이전 질문 "${lastQuery}"의 결과를 바탕으로: ${query}`

      case 'drill_down':
        return `${lastQuery}에 대해 ${query}`

      case 'repeat':
        return lastQuery || query

      case 'same_condition':
        const conditions = this.formatSlotConditions(context.slots)
        return `${conditions} 조건으로 ${query}`

      default:
        return query
    }
  }

  /**
   * 슬롯 조건 포맷팅
   */
  private formatSlotConditions(slots: ConversationSlot): string {
    const parts: string[] = []

    if (slots.dateRange) {
      parts.push(`${slots.dateRange.start}~${slots.dateRange.end}`)
    }
    if (slots.country) {
      parts.push(`국가: ${slots.country}`)
    }
    if (slots.platform) {
      parts.push(`플랫폼: ${slots.platform}`)
    }

    return parts.length > 0 ? `[${parts.join(', ')}]` : ''
  }

  /**
   * 데이터 스냅샷 저장
   */
  saveDataSnapshot(
    sessionId: string,
    rowCount: number,
    sheets: string[]
  ): void {
    const context = this.contexts.get(sessionId)
    if (context && context.history.length > 0) {
      const lastEntry = context.history[context.history.length - 1]
      lastEntry.dataSnapshot = { rowCount, sheets }
    }
  }

  /**
   * 세션 정리
   */
  clearSession(sessionId: string): void {
    this.contexts.delete(sessionId)
  }

  /**
   * 오래된 세션 정리 (1시간 이상)
   */
  cleanupOldSessions(): number {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    let removed = 0

    for (const [sessionId, context] of this.contexts.entries()) {
      if (context.lastUpdated < oneHourAgo) {
        this.contexts.delete(sessionId)
        removed++
      }
    }

    return removed
  }

  /**
   * 현재 슬롯 상태 조회
   */
  getCurrentSlots(sessionId: string): ConversationSlot {
    return this.getOrCreateContext(sessionId).slots
  }

  /**
   * 대화 히스토리 조회
   */
  getHistory(sessionId: string): ConversationContext['history'] {
    return this.getOrCreateContext(sessionId).history
  }
}

// 싱글톤 인스턴스
export const conversationManager = new ConversationManager()

// 10분마다 오래된 세션 정리
setInterval(() => {
  const removed = conversationManager.cleanupOldSessions()
  if (removed > 0) {
    console.log(`[ConversationManager] ${removed}개 오래된 세션 정리됨`)
  }
}, 10 * 60 * 1000)
