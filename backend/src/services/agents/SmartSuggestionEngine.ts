/**
 * 스마트 제안 엔진
 * 데이터 분석 결과와 컨텍스트를 기반으로 동적 후속 질문 생성
 */

export interface SuggestionContext {
  intent: string
  sheets: string[]
  dateRange?: { start: string; end: string }
  filters?: Array<{ column: string; value: any }>
  dataStats?: {
    rowCount: number
    hasNumericData: boolean
    hasDateData: boolean
    topCategories?: string[]
    countries?: string[]
  }
  previousQueries?: string[]
}

export interface Suggestion {
  label: string
  action: string
  data?: any
  priority: number // 1-10, 높을수록 우선
  category: 'drill_down' | 'compare' | 'trend' | 'export' | 'switch_view'
}

export class SmartSuggestionEngine {
  /**
   * 컨텍스트 기반 동적 제안 생성
   */
  generateSuggestions(context: SuggestionContext, data: any[]): Suggestion[] {
    const suggestions: Suggestion[] = []

    // 1. 데이터 통계 분석
    const stats = this.analyzeData(data, context)

    // 2. 의도별 기본 제안
    suggestions.push(...this.getIntentBasedSuggestions(context, stats))

    // 3. 데이터 기반 동적 제안
    suggestions.push(...this.getDataDrivenSuggestions(stats, context))

    // 4. 시간 기반 제안
    suggestions.push(...this.getTimeBasedSuggestions(context))

    // 5. 이전 질문 기반 제안
    if (context.previousQueries && context.previousQueries.length > 0) {
      suggestions.push(...this.getFollowUpSuggestions(context))
    }

    // 우선순위 정렬 및 중복 제거
    return this.deduplicateAndSort(suggestions).slice(0, 5)
  }

  /**
   * 데이터 통계 분석
   */
  private analyzeData(data: any[], context: SuggestionContext): SuggestionContext['dataStats'] {
    if (!Array.isArray(data) || data.length === 0) {
      return { rowCount: 0, hasNumericData: false, hasDateData: false }
    }

    const sampleRow = data[0]
    const keys = Object.keys(sampleRow)

    // 숫자 컬럼 확인
    const hasNumericData = keys.some(k => {
      const val = sampleRow[k]
      return typeof val === 'number' || !isNaN(Number(val))
    })

    // 날짜 컬럼 확인
    const hasDateData = keys.some(k => {
      const val = sampleRow[k]
      return val && !isNaN(Date.parse(String(val)))
    })

    // 카테고리 추출 (country, platform 등)
    const topCategories: string[] = []
    const countries: string[] = []

    const countryCol = keys.find(k => k.toLowerCase().includes('country'))
    if (countryCol) {
      const countrySet = new Set(data.map(d => d[countryCol]).filter(Boolean))
      countries.push(...Array.from(countrySet).slice(0, 5) as string[])
    }

    const categoryCol = keys.find(k => 
      k.toLowerCase().includes('platform') || 
      k.toLowerCase().includes('category') ||
      k.toLowerCase().includes('type')
    )
    if (categoryCol) {
      const catSet = new Set(data.map(d => d[categoryCol]).filter(Boolean))
      topCategories.push(...Array.from(catSet).slice(0, 5) as string[])
    }

    return {
      rowCount: data.length,
      hasNumericData,
      hasDateData,
      topCategories,
      countries,
    }
  }

  /**
   * 의도별 기본 제안
   */
  private getIntentBasedSuggestions(
    context: SuggestionContext,
    stats: SuggestionContext['dataStats']
  ): Suggestion[] {
    const suggestions: Suggestion[] = []

    switch (context.intent) {
      case 'trend_analysis':
        suggestions.push(
          {
            label: '📊 기간 확장 (90일)',
            action: 'query',
            data: { query: '최근 90일 트렌드 분석해줘' },
            priority: 8,
            category: 'trend',
          },
          {
            label: '📈 주간 단위로 보기',
            action: 'query',
            data: { query: '주간 단위로 트렌드 분석해줘' },
            priority: 7,
            category: 'trend',
          }
        )
        break

      case 'ranking':
        suggestions.push(
          {
            label: '📥 랭킹 데이터 내보내기',
            action: 'export',
            data: { format: 'csv' },
            priority: 8,
            category: 'export',
          },
          {
            label: '📊 상위 20개로 확장',
            action: 'query',
            data: { query: '상위 20개 랭킹 보여줘' },
            priority: 7,
            category: 'drill_down',
          }
        )
        break

      case 'comparison':
        suggestions.push(
          {
            label: '📈 시계열 비교',
            action: 'query',
            data: { query: '월별 추이로 비교해줘' },
            priority: 8,
            category: 'compare',
          }
        )
        break

      case 'aggregation':
        suggestions.push(
          {
            label: '🔍 세부 내역 보기',
            action: 'query',
            data: { query: '세부 내역을 보여줘' },
            priority: 7,
            category: 'drill_down',
          }
        )
        break

      default:
        suggestions.push(
          {
            label: '📊 트렌드 분석',
            action: 'query',
            data: { query: '트렌드 분석해줘' },
            priority: 6,
            category: 'trend',
          }
        )
    }

    return suggestions
  }

  /**
   * 데이터 기반 동적 제안
   */
  private getDataDrivenSuggestions(
    stats: SuggestionContext['dataStats'],
    context: SuggestionContext
  ): Suggestion[] {
    const suggestions: Suggestion[] = []

    if (!stats) return suggestions

    // 국가 데이터가 있으면 국가별 비교 제안
    if (stats.countries && stats.countries.length > 1) {
      const topCountry = stats.countries[0]
      suggestions.push({
        label: `🌏 ${this.getCountryName(topCountry)} 상세 분석`,
        action: 'query',
        data: { query: `${this.getCountryName(topCountry)} 데이터만 상세 분석해줘` },
        priority: 9,
        category: 'drill_down',
      })

      if (stats.countries.length >= 2) {
        suggestions.push({
          label: '🌍 국가별 비교 분석',
          action: 'query',
          data: { query: '국가별로 비교 분석해줘' },
          priority: 8,
          category: 'compare',
        })
      }
    }

    // 플랫폼/카테고리 데이터가 있으면 세그먼트 제안
    if (stats.topCategories && stats.topCategories.length > 1) {
      suggestions.push({
        label: '📱 플랫폼별 분석',
        action: 'query',
        data: { query: '플랫폼별로 분석해줘' },
        priority: 7,
        category: 'compare',
      })
    }

    // 데이터가 많으면 요약 제안
    if (stats.rowCount > 100) {
      suggestions.push({
        label: '📋 핵심 요약 보기',
        action: 'query',
        data: { query: '핵심 지표만 요약해줘' },
        priority: 6,
        category: 'switch_view',
      })
    }

    return suggestions
  }

  /**
   * 시간 기반 제안
   */
  private getTimeBasedSuggestions(context: SuggestionContext): Suggestion[] {
    const suggestions: Suggestion[] = []

    if (context.dateRange) {
      const start = new Date(context.dateRange.start)
      const end = new Date(context.dateRange.end)
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

      // 짧은 기간이면 확장 제안
      if (daysDiff <= 7) {
        suggestions.push({
          label: '📅 30일로 확장',
          action: 'query',
          data: { query: '최근 30일 데이터로 분석해줘' },
          priority: 7,
          category: 'trend',
        })
      }

      // 긴 기간이면 최근 데이터 제안
      if (daysDiff > 60) {
        suggestions.push({
          label: '📅 최근 30일만 보기',
          action: 'query',
          data: { query: '최근 30일 데이터만 보여줘' },
          priority: 6,
          category: 'trend',
        })
      }

      // 전월 대비 제안
      suggestions.push({
        label: '📊 전월 대비 비교',
        action: 'query',
        data: { query: '전월 대비 비교 분석해줘' },
        priority: 7,
        category: 'compare',
      })
    }

    return suggestions
  }

  /**
   * 이전 질문 기반 후속 제안
   */
  private getFollowUpSuggestions(context: SuggestionContext): Suggestion[] {
    const suggestions: Suggestion[] = []
    const lastQuery = context.previousQueries?.[context.previousQueries.length - 1] || ''

    // 매출 관련 질문 후
    if (lastQuery.includes('매출') || lastQuery.includes('GMV')) {
      suggestions.push({
        label: '🏆 매출 상위 작가',
        action: 'query',
        data: { query: '매출 상위 10개 작가 보여줘' },
        priority: 8,
        category: 'drill_down',
      })
    }

    // 주문 관련 질문 후
    if (lastQuery.includes('주문')) {
      suggestions.push({
        label: '📦 배송 현황 확인',
        action: 'query',
        data: { query: '배송 현황 분석해줘' },
        priority: 7,
        category: 'drill_down',
      })
    }

    // 작가 관련 질문 후
    if (lastQuery.includes('작가') || lastQuery.includes('artist')) {
      suggestions.push({
        label: '🎨 작가별 상품 분석',
        action: 'query',
        data: { query: '작가별 인기 상품 분석해줘' },
        priority: 7,
        category: 'drill_down',
      })
    }

    return suggestions
  }

  /**
   * 중복 제거 및 정렬
   */
  private deduplicateAndSort(suggestions: Suggestion[]): Suggestion[] {
    const seen = new Set<string>()
    const unique: Suggestion[] = []

    for (const s of suggestions) {
      const key = s.data?.query || s.label
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(s)
      }
    }

    return unique.sort((a, b) => b.priority - a.priority)
  }

  /**
   * 국가 코드 → 이름 변환
   */
  private getCountryName(code: string): string {
    const names: Record<string, string> = {
      JP: '일본',
      US: '미국',
      KR: '한국',
      CN: '중국',
      TW: '대만',
      HK: '홍콩',
    }
    return names[code] || code
  }
}

export const smartSuggestionEngine = new SmartSuggestionEngine()
