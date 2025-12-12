import { BaseAgent, AgentContext } from './BaseAgent'
import { intentClassifier, ExtractedIntent } from './IntentClassifier'
import { queryOptimizer, OptimizedQuery } from './QueryOptimizer'
import { getSchemaSummaryForPrompt } from '../../config/sheetsSchema'
import { smartSuggestionEngine, SuggestionContext } from './SmartSuggestionEngine'
import { openaiRetryHandler } from './RetryHandler'
import { dataAnalystValidator } from './ResponseValidator'
import { correlationAnalyzer } from './CorrelationAnalyzer'
import { metricsCollector } from './MetricsCollector'
import { enhancedDateParser, ComparisonDateRanges } from './EnhancedDateParser'

export class DataAnalystAgent extends BaseAgent {
  private getSystemPrompt(): string {
    return `당신은 글로벌 이커머스 데이터 분석 전문가입니다.
idus Global의 크로스보더 이커머스 데이터를 분석하여 비즈니스 인사이트를 제공합니다.

${getSchemaSummaryForPrompt()}

분석 원칙:
1. 구체적인 숫자와 함께 설명 (예: "매출 1,234 USD", "전월 대비 15% 증가")
2. 데이터 기반 인사이트 제공 (단순 나열이 아닌 의미 해석)
3. 비즈니스 관점의 시사점 포함
4. 추가 분석이 필요한 경우 제안

응답 형식:
📊 분석 결과 요약
- 핵심 지표 1~3개를 먼저 제시

📈 상세 분석
- 데이터에서 발견한 패턴이나 트렌드
- 주목할 만한 포인트

💡 인사이트
- 비즈니스 관점의 해석
- 개선 기회나 주의점

참고:
- 금액 단위: USD (필요시 KRW 환산, 환율 1,350원)
- 국가 코드: JP(일본), US(미국), KR(한국), CN(중국), TW(대만), HK(홍콩)
- 한국어로 답변하세요.`
  }

  async process(query: string, context: AgentContext = {}): Promise<{
    response: string
    data?: any
    charts?: any[]
    actions?: Array<{ label: string; action: string; data?: any }>
  }> {
    const startTime = Date.now()
    let intentType = 'unknown'
    let dataCount = 0

    try {
      // LLM 기반 의도 분류 및 엔티티 추출 (고도화)
      let extractedIntent: ExtractedIntent
      try {
        extractedIntent = await intentClassifier.classify(query, context.history)
        intentType = extractedIntent.intent
      } catch (llmError) {
        // LLM 실패 시 폴백
        console.warn('[DataAnalystAgent] LLM 의도 분류 실패, 폴백 사용:', llmError)
        const analysis = await this.analyzeIntent(query)
        extractedIntent = {
          intent: analysis.intent,
          confidence: 0.5,
          entities: {
            sheets: analysis.dataNeeds.sheets,
            dateRange: analysis.dataNeeds.dateRange
              ? {
                  ...analysis.dataNeeds.dateRange,
                  type: 'absolute' as const,
                }
              : undefined,
            filters: analysis.dataNeeds.filters
              ? Object.entries(analysis.dataNeeds.filters).map(([column, value]) => ({
                  column,
                  operator: 'equals' as const,
                  value,
                }))
              : undefined,
          },
        }
      }

      // 비교 분석 의도 감지 및 두 기간 추출
      let comparisonRanges: ComparisonDateRanges | undefined
      if (extractedIntent.intent === 'comparison') {
        comparisonRanges = enhancedDateParser.parseComparisonDateRange(query)
        if (comparisonRanges) {
          console.log('[DataAnalystAgent] 비교 분석 감지:', {
            period1: comparisonRanges.period1,
            period2: comparisonRanges.period2,
            labels: {
              period1: comparisonRanges.period1Label,
              period2: comparisonRanges.period2Label
            }
          })
        }
      }

      // 쿼리 최적화
      const optimizedQuery = queryOptimizer.optimize(extractedIntent)

      // 쿼리 검증
      const validation = queryOptimizer.validate(optimizedQuery)
      if (!validation.valid && validation.errors.length > 0) {
        return {
          response: `쿼리 오류가 발견되었습니다:\n${validation.errors.join('\n')}\n\n제안: ${validation.suggestions.join('\n')}`,
          actions: this.getSuggestedActions(query),
        }
      }

      // 비교 분석인 경우 두 기간 데이터 조회
      let results: {
        data: any
        charts?: any[]
        actions?: Array<{ label: string; action: string; data?: any }>
      }
      
      if (comparisonRanges && extractedIntent.intent === 'comparison') {
        results = await this.executeComparisonQuery(optimizedQuery, comparisonRanges, query)
      } else {
        // 최적화된 쿼리 실행
        results = await this.executeOptimizedQuery(optimizedQuery, extractedIntent.intent)
      }

      // 데이터가 없는 경우 친화적 메시지
      if (!results.data || (Array.isArray(results.data) && results.data.length === 0)) {
        return {
          response: this.getNoDataMessage(query, extractedIntent),
          actions: this.getSuggestedActions(query),
        }
      }

      // LLM을 통한 자연어 응답 생성
      const response = await this.generateResponse(
        query,
        results,
        extractedIntent,
        validation.suggestions
      )

      dataCount = Array.isArray(results.data) ? results.data.length : 1

      // 메트릭 기록 (성공)
      metricsCollector.record({
        agentType: 'DataAnalyst',
        operation: 'process',
        duration: Date.now() - startTime,
        success: true,
        metadata: {
          query: query.substring(0, 100),
          intent: intentType,
          dataCount,
        },
      })

      return {
        response,
        data: results.data,
        charts: results.charts,
        actions: this.getContextualActions(
          extractedIntent.intent, 
          results.data, 
          extractedIntent,
          context.history?.filter(h => h.role === 'user').map(h => h.content)
        ),
      }
    } catch (error: any) {
      console.error('[DataAnalystAgent] 오류:', error)

      // 메트릭 기록 (실패)
      metricsCollector.record({
        agentType: 'DataAnalyst',
        operation: 'process',
        duration: Date.now() - startTime,
        success: false,
        error: error.message,
        metadata: {
          query: query.substring(0, 100),
          intent: intentType,
        },
      })

      // 최종 폴백: 기존 방식
      try {
        const analysis = await this.analyzeIntent(query)
        const results = await this.executeAnalysis(analysis)
        const response = await this.generateResponse(query, results, analysis)

        return {
          response,
          data: results.data,
          charts: results.charts,
          actions: this.getContextualActions(
            analysis.intent, 
            results.data,
            undefined,
            context.history?.filter(h => h.role === 'user').map(h => h.content)
          ),
        }
      } catch (fallbackError: any) {
        console.error('[DataAnalystAgent] 폴백도 실패:', fallbackError)
        return {
          response: this.getUserFriendlyErrorMessage(error),
          actions: this.getSuggestedActions(query),
        }
      }
    }
  }

  /**
   * 사용자 친화적 에러 메시지 생성
   */
  private getUserFriendlyErrorMessage(error: any): string {
    const errorMessage = error?.message || '알 수 없는 오류'
    
    if (errorMessage.includes('API') || errorMessage.includes('OpenAI')) {
      return '🔄 AI 서비스 연결에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.'
    }
    if (errorMessage.includes('timeout') || errorMessage.includes('TIMEOUT')) {
      return '⏱️ 요청 처리 시간이 초과되었습니다. 더 구체적인 조건으로 다시 질문해주세요.'
    }
    if (errorMessage.includes('sheet') || errorMessage.includes('Sheet')) {
      return '📊 데이터 소스 연결에 문제가 있습니다. 관리자에게 문의해주세요.'
    }
    
    return `분석 중 문제가 발생했습니다. 다른 방식으로 질문해보시거나, 잠시 후 다시 시도해주세요.\n\n💡 예시 질문:\n- "최근 30일 매출 현황 알려줘"\n- "일본 주문 트렌드 분석해줘"\n- "상위 10개 작가 매출 순위"`
  }

  /**
   * 데이터 없음 메시지 생성
   */
  private getNoDataMessage(query: string, intent: ExtractedIntent): string {
    const dateRange = intent.entities.dateRange
    const dateInfo = dateRange 
      ? `(${dateRange.start} ~ ${dateRange.end})` 
      : '(전체 기간)'
    
    return `📭 요청하신 조건에 해당하는 데이터가 없습니다 ${dateInfo}\n\n다음을 확인해보세요:\n- 날짜 범위가 올바른지 확인\n- 필터 조건이 너무 제한적이지 않은지 확인\n- 다른 기간이나 조건으로 다시 시도`
  }

  /**
   * 제안 액션 생성
   */
  private getSuggestedActions(query: string): Array<{ label: string; action: string; data?: any }> {
    return [
      { label: '📊 최근 30일 매출 보기', action: 'query', data: { query: '최근 30일 매출 현황 알려줘' } },
      { label: '🏆 작가 랭킹 보기', action: 'query', data: { query: '상위 10개 작가 매출 순위' } },
      { label: '🌏 국가별 현황', action: 'query', data: { query: '국가별 주문 현황 비교' } },
    ]
  }

  /**
   * 컨텍스트 기반 액션 생성 (스마트 제안 엔진 사용)
   */
  private getContextualActions(
    intent: string, 
    data: any,
    extractedIntent?: ExtractedIntent,
    previousQueries?: string[]
  ): Array<{ label: string; action: string; data?: any }> {
    // 스마트 제안 엔진 컨텍스트 구성
    const suggestionContext: SuggestionContext = {
      intent,
      sheets: extractedIntent?.entities?.sheets || ['order'],
      dateRange: extractedIntent?.entities?.dateRange 
        ? { start: extractedIntent.entities.dateRange.start, end: extractedIntent.entities.dateRange.end }
        : undefined,
      filters: extractedIntent?.entities?.filters?.map(f => ({ column: f.column, value: f.value })),
      previousQueries,
    }

    // 스마트 제안 생성
    const suggestions = smartSuggestionEngine.generateSuggestions(suggestionContext, Array.isArray(data) ? data : [])

    // Suggestion → Action 변환
    return suggestions.map(s => ({
      label: s.label,
      action: s.action,
      data: s.data,
    }))
  }

  /**
   * 사용자 질문 의도 분석
   */
  private async analyzeIntent(query: string): Promise<{
    intent: string
    entities: Record<string, any>
    dataNeeds: {
      sheets: string[]
      dateRange?: { start: string; end: string }
      filters?: Record<string, any>
    }
  }> {
    // 간단한 의도 분류 (실제로는 LLM 사용 가능)
    const lowerQuery = query.toLowerCase()

    // 날짜 추출
    const dateRange = this.extractDateRange(query)

    // 시트 추출
    const sheets: string[] = []
    if (lowerQuery.includes('주문') || lowerQuery.includes('order') || lowerQuery.includes('매출') || lowerQuery.includes('gmv')) {
      sheets.push('order')
    }
    if (lowerQuery.includes('물류') || lowerQuery.includes('logistics') || lowerQuery.includes('배송')) {
      sheets.push('logistics')
    }
    if (lowerQuery.includes('고객') || lowerQuery.includes('user') || lowerQuery.includes('사용자')) {
      sheets.push('users')
    }
    if (lowerQuery.includes('작가') || lowerQuery.includes('artist')) {
      sheets.push('artists')
    }
    if (sheets.length === 0) {
      sheets.push('order') // 기본값
    }

    // 필터 추출
    const filters: Record<string, any> = {}
    const countryMatch = query.match(/(일본|JP|US|미국|한국|KR|중국|CN)/i)
    if (countryMatch) {
      const countryMap: Record<string, string> = {
        일본: 'JP',
        JP: 'JP',
        미국: 'US',
        US: 'US',
        한국: 'KR',
        KR: 'KR',
        중국: 'CN',
        CN: 'CN',
      }
      filters.country = countryMap[countryMatch[0]] || countryMatch[0]
    }

    // 의도 분류
    let intent = 'general_query'
    if (lowerQuery.includes('트렌드') || lowerQuery.includes('추이') || lowerQuery.includes('변화')) {
      intent = 'trend_analysis'
    } else if (lowerQuery.includes('비교') || lowerQuery.includes('대비')) {
      intent = 'comparison'
    } else if (lowerQuery.includes('집계') || lowerQuery.includes('합계') || lowerQuery.includes('총')) {
      intent = 'aggregation'
    } else if (lowerQuery.includes('상위') || lowerQuery.includes('top') || lowerQuery.includes('랭킹')) {
      intent = 'ranking'
    }

    return {
      intent,
      entities: {},
      dataNeeds: {
        sheets,
        dateRange,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
      },
    }
  }

  /**
   * 비교 분석 쿼리 실행 (두 기간)
   */
  private async executeComparisonQuery(
    optimizedQuery: OptimizedQuery,
    comparisonRanges: ComparisonDateRanges,
    originalQuery: string
  ): Promise<{
    data: any
    charts?: any[]
    actions?: Array<{ label: string; action: string; data?: any }>
  }> {
    const results: any[] = []

    // 각 시트에서 두 기간 데이터 조회
    for (const sheet of optimizedQuery.sheets) {
      // 기간 1 데이터
      const result1 = await this.getData({
        sheet: sheet as any,
        dateRange: comparisonRanges.period1,
        filters: optimizedQuery.filters.length > 0 ? optimizedQuery.filters : undefined,
        limit: optimizedQuery.limit,
      })

      // 기간 2 데이터
      const result2 = await this.getData({
        sheet: sheet as any,
        dateRange: comparisonRanges.period2,
        filters: optimizedQuery.filters.length > 0 ? optimizedQuery.filters : undefined,
        limit: optimizedQuery.limit,
      })

      if (result1.success && result1.data) {
        results.push(...result1.data.map((row: any) => ({
          ...row,
          _period: 'period1',
          _periodLabel: comparisonRanges.period1Label
        })))
      }

      if (result2.success && result2.data) {
        results.push(...result2.data.map((row: any) => ({
          ...row,
          _period: 'period2',
          _periodLabel: comparisonRanges.period2Label
        })))
      }
    }

    // 비교 분석 수행
    const comparisonData = this.performPeriodComparison(
      results,
      comparisonRanges.period1Label,
      comparisonRanges.period2Label
    )

    // 비교 차트 생성
    const charts = await this.createComparisonChart(comparisonData)

    return {
      data: comparisonData,
      charts,
      actions: []
    }
  }

  /**
   * 기간별 비교 분석 수행
   */
  private performPeriodComparison(
    data: any[],
    period1Label: string,
    period2Label: string
  ): any {
    const period1Data = data.filter((row: any) => row._period === 'period1')
    const period2Data = data.filter((row: any) => row._period === 'period2')

    // GMV 계산 (Total GMV 컬럼 확인)
    const calculateGMV = (rows: any[]): number => {
      return rows.reduce((sum, row) => {
        const gmv = row['Total GMV'] || row['total_gmv'] || row['gmv'] || row['GMV'] || 0
        return sum + (typeof gmv === 'number' ? gmv : parseFloat(String(gmv).replace(/,/g, '')) || 0)
      }, 0)
    }

    const period1GMV = calculateGMV(period1Data)
    const period2GMV = calculateGMV(period2Data)
    const period1OrderCount = new Set(period1Data.map((r: any) => r.order_code).filter(Boolean)).size
    const period2OrderCount = new Set(period2Data.map((r: any) => r.order_code).filter(Boolean)).size

    // 변화율 계산
    const gmvChange = period2GMV - period1GMV
    const gmvChangePercent = period1GMV > 0 ? ((period2GMV - period1GMV) / period1GMV) * 100 : (period2GMV > 0 ? null : 0)
    const orderChange = period2OrderCount - period1OrderCount
    const orderChangePercent = period1OrderCount > 0 ? ((period2OrderCount - period1OrderCount) / period1OrderCount) * 100 : (period2OrderCount > 0 ? null : 0)

    // 국가별 비교
    const countryComparison = this.compareByCountry(period1Data, period2Data, period1Label, period2Label)

    return {
      summary: {
        period1: {
          label: period1Label,
          gmv: period1GMV,
          orderCount: period1OrderCount,
          avgOrderValue: period1OrderCount > 0 ? period1GMV / period1OrderCount : 0
        },
        period2: {
          label: period2Label,
          gmv: period2GMV,
          orderCount: period2OrderCount,
          avgOrderValue: period2OrderCount > 0 ? period2GMV / period2OrderCount : 0
        },
        changes: {
          gmv: {
            absolute: gmvChange,
            percent: gmvChangePercent,
            direction: gmvChange > 0 ? 'increase' : gmvChange < 0 ? 'decrease' : 'stable'
          },
          orders: {
            absolute: orderChange,
            percent: orderChangePercent,
            direction: orderChange > 0 ? 'increase' : orderChange < 0 ? 'decrease' : 'stable'
          }
        }
      },
      countryComparison,
      rawData: {
        period1: period1Data,
        period2: period2Data
      }
    }
  }

  /**
   * 국가별 비교 분석
   */
  private compareByCountry(
    period1Data: any[],
    period2Data: any[],
    period1Label: string,
    period2Label: string
  ): any[] {
    const countryMap = new Map<string, { period1: any[]; period2: any[] }>()

    // 기간 1 국가별 그룹화
    period1Data.forEach((row: any) => {
      const country = row.country || row['country_code'] || 'Unknown'
      if (!countryMap.has(country)) {
        countryMap.set(country, { period1: [], period2: [] })
      }
      countryMap.get(country)!.period1.push(row)
    })

    // 기간 2 국가별 그룹화
    period2Data.forEach((row: any) => {
      const country = row.country || row['country_code'] || 'Unknown'
      if (!countryMap.has(country)) {
        countryMap.set(country, { period1: [], period2: [] })
      }
      countryMap.get(country)!.period2.push(row)
    })

    const calculateGMV = (rows: any[]): number => {
      return rows.reduce((sum, row) => {
        const gmv = row['Total GMV'] || row['total_gmv'] || row['gmv'] || row['GMV'] || 0
        return sum + (typeof gmv === 'number' ? gmv : parseFloat(String(gmv).replace(/,/g, '')) || 0)
      }, 0)
    }

    return Array.from(countryMap.entries()).map(([country, data]) => {
      const period1GMV = calculateGMV(data.period1)
      const period2GMV = calculateGMV(data.period2)
      const period1Orders = new Set(data.period1.map((r: any) => r.order_code).filter(Boolean)).size
      const period2Orders = new Set(data.period2.map((r: any) => r.order_code).filter(Boolean)).size

      const gmvChange = period2GMV - period1GMV
      const gmvChangePercent = period1GMV > 0 ? ((period2GMV - period1GMV) / period1GMV) * 100 : (period2GMV > 0 ? null : 0)

      return {
        country,
        period1: {
          gmv: period1GMV,
          orderCount: period1Orders
        },
        period2: {
          gmv: period2GMV,
          orderCount: period2Orders
        },
        change: {
          gmv: gmvChange,
          gmvPercent: gmvChangePercent,
          orders: period2Orders - period1Orders
        }
      }
    }).sort((a, b) => b.period2.gmv - a.period2.gmv)
  }

  /**
   * 최적화된 쿼리 실행
   */
  private async executeOptimizedQuery(
    optimizedQuery: OptimizedQuery,
    intentType: string
  ): Promise<{
    data: any
    charts?: any[]
    actions?: Array<{ label: string; action: string; data?: any }>
  }> {
    const results: any[] = []

    // 각 시트에서 데이터 조회
    for (const sheet of optimizedQuery.sheets) {
      const result = await this.getData({
        sheet: sheet as any,
        dateRange: optimizedQuery.dateRange,
        filters: optimizedQuery.filters.length > 0 ? optimizedQuery.filters : undefined,
        limit: optimizedQuery.limit,
      })

      if (result.success && result.data) {
        results.push(...result.data)
      }
    }

    // 조인 처리
    let joinedData = results
    if (optimizedQuery.join && optimizedQuery.join.length > 0) {
      joinedData = await this.performJoins(results, optimizedQuery.join)
    }

    // 집계 처리
    let processedData = joinedData
    if (optimizedQuery.aggregations && Object.keys(optimizedQuery.aggregations).length > 0) {
      const aggregations: Record<string, 'sum' | 'avg' | 'count' | 'max' | 'min'> = {}
      for (const [column, func] of Object.entries(optimizedQuery.aggregations)) {
        if (['sum', 'avg', 'count', 'max', 'min'].includes(func)) {
          aggregations[column] = func as 'sum' | 'avg' | 'count' | 'max' | 'min'
        }
      }
      const aggregationResult = await this.aggregateData({
        data: joinedData,
        groupBy: optimizedQuery.groupBy,
        aggregations,
      })
      if (aggregationResult.success) {
        processedData = Array.isArray(aggregationResult.data) 
          ? aggregationResult.data 
          : [aggregationResult.data]
      }
    }

    // 정렬 처리
    if (optimizedQuery.orderBy && optimizedQuery.orderBy.length > 0 && Array.isArray(processedData)) {
      processedData = this.applySorting(processedData, optimizedQuery.orderBy)
    }

    // 제한 적용
    if (optimizedQuery.limit && Array.isArray(processedData)) {
      processedData = processedData.slice(0, optimizedQuery.limit)
    }

    // 의도별 차트 생성
    const charts = await this.generateChartsForIntent(intentType, processedData)

    return {
      data: processedData,
      charts,
      actions: [],
    }
  }

  /**
   * 조인 수행
   */
  private async performJoins(
    data: any[],
    joins: Array<{ leftSheet: string; rightSheet: string; leftKey: string; rightKey: string }>
  ): Promise<any[]> {
    // 간단한 조인 구현
    let joined = data

    for (const join of joins) {
      // 조인할 시트 데이터 조회
      const rightSheetData = await this.getData({
        sheet: join.rightSheet as any,
      })

      if (rightSheetData.success && rightSheetData.data) {
        // 조인 수행
        const joinMap = new Map()
        for (const rightRow of rightSheetData.data) {
          const key = rightRow[join.rightKey]
          if (!joinMap.has(key)) {
            joinMap.set(key, [])
          }
          joinMap.get(key)!.push(rightRow)
        }

        joined = joined.map((leftRow) => {
          const key = leftRow[join.leftKey]
          const rightRows = joinMap.get(key) || []
          return {
            ...leftRow,
            [`${join.rightSheet}_data`]: rightRows,
          }
        })
      }
    }

    return joined
  }

  /**
   * 정렬 적용
   */
  private applySorting(
    data: any[],
    orderBy: Array<{ column: string; direction: 'asc' | 'desc' }>
  ): any[] {
    return [...data].sort((a, b) => {
      for (const order of orderBy) {
        const aVal = a[order.column]
        const bVal = b[order.column]

        let comparison = 0
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal
        } else {
          comparison = String(aVal).localeCompare(String(bVal))
        }

        if (comparison !== 0) {
          return order.direction === 'asc' ? comparison : -comparison
        }
      }
      return 0
    })
  }

  /**
   * 의도별 차트 생성
   */
  private async generateChartsForIntent(intent: string, data: any[]): Promise<any[]> {
    const charts: any[] = []

    if (intent === 'trend_analysis' && Array.isArray(data) && data.length > 0) {
      const trendChart = await this.createTrendChart(data)
      charts.push(...trendChart)
    } else if (intent === 'comparison' && Array.isArray(data) && data.length > 0) {
      const comparisonChart = await this.createComparisonChart(data)
      charts.push(...comparisonChart)
    } else if (intent === 'ranking' && Array.isArray(data) && data.length > 0) {
      const rankingChart = await this.visualizeData({
        data: data.slice(0, 10),
        chartType: 'bar',
        xAxis: Object.keys(data[0])[0],
        yAxis: Object.keys(data[0])[1] || 'value',
        title: '랭킹',
      })
      if (rankingChart.success) charts.push(rankingChart.data)
    }

    return charts
  }

  /**
   * 분석 실행 (레거시 - 호환성 유지)
   */
  private async executeAnalysis(analysis: {
    intent: string
    entities: Record<string, any>
    dataNeeds: {
      sheets: string[]
      dateRange?: { start: string; end: string }
      filters?: Record<string, any>
    }
  }): Promise<{
    data: any
    charts?: any[]
    actions?: Array<{ label: string; action: string; data?: any }>
    dateRange?: { start: string; end: string }
  }> {
    const { dataNeeds, intent } = analysis
    const results: any[] = []

    // 각 시트에서 데이터 조회
    for (const sheet of dataNeeds.sheets) {
      const result = await this.getData({
        sheet: sheet as any,
        dateRange: dataNeeds.dateRange,
        filters: dataNeeds.filters,
        limit: intent === 'ranking' ? 100 : undefined,
      })

      if (result.success && result.data) {
        results.push(...result.data)
      }
    }

    // 의도별 추가 처리
    let processedData = results
    let charts: any[] = []
    let actions: Array<{ label: string; action: string; data?: any }> = []

    switch (intent) {
      case 'trend_analysis':
        processedData = await this.analyzeTrends(processedData, dataNeeds.dateRange)
        charts = await this.createTrendChart(processedData)
        break

      case 'aggregation':
        processedData = await this.performAggregation(processedData)
        break

      case 'ranking':
        processedData = await this.createRanking(processedData)
        break

      case 'comparison':
        processedData = await this.performComparison(processedData)
        charts = await this.createComparisonChart(processedData)
        break
    }

    return {
      data: processedData,
      charts,
      actions,
      dateRange: dataNeeds.dateRange,
    }
  }

  /**
   * 트렌드 분석
   */
  private async analyzeTrends(data: any[], _dateRange?: { start: string; end: string }): Promise<any[]> {
    if (data.length === 0) return []

    // 날짜별 집계
    const dateGroups = new Map<string, any[]>()

    for (const row of data) {
      const dateKey = this.getDateKey(row)
      if (!dateGroups.has(dateKey)) {
        dateGroups.set(dateKey, [])
      }
      dateGroups.get(dateKey)!.push(row)
    }

    const trendData = Array.from(dateGroups.entries())
      .map(([date, rows]) => {
        const gmv = rows.reduce((sum: number, r: any) => sum + (Number(r['Total GMV']) || 0), 0)
        const orderCount = rows.length

        return {
          date,
          gmv,
          orderCount,
          avgOrderValue: orderCount > 0 ? gmv / orderCount : 0,
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    return trendData
  }

  /**
   * 집계 수행
   */
  private async performAggregation(data: any[]): Promise<any> {
    const result = await this.aggregateData({
      data,
      aggregations: {
        'Total GMV': 'sum',
        'order_code': 'count',
      },
    })

    return result.success ? result.data : {}
  }

  /**
   * 랭킹 생성
   */
  private async createRanking(data: any[]): Promise<any[]> {
    // 작가별 또는 상품별 집계
    const groups = new Map<string, any[]>()

    for (const row of data) {
      const key = row['artist_name (kr)'] || row['product_name'] || '기타'
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(row)
    }

    const ranking = Array.from(groups.entries())
      .map(([key, rows]) => {
        const gmv = rows.reduce((sum: number, r: any) => sum + (Number(r['Total GMV']) || 0), 0)
        const count = rows.length

        return {
          name: key,
          gmv,
          count,
          avgOrderValue: count > 0 ? gmv / count : 0,
        }
      })
      .sort((a, b) => b.gmv - a.gmv)
      .slice(0, 10)

    return ranking
  }

  /**
   * 비교 분석
   */
  private async performComparison(data: any[]): Promise<any[]> {
    // 국가별 또는 플랫폼별 비교
    const groups = new Map<string, any[]>()

    for (const row of data) {
      const key = row['country'] || row['platform'] || '기타'
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(row)
    }

    return Array.from(groups.entries()).map(([key, rows]) => {
      const gmv = rows.reduce((sum, r) => sum + (Number(r['Total GMV']) || 0), 0)
      const count = rows.length

      return {
        category: key,
        gmv,
        count,
        avgOrderValue: count > 0 ? gmv / count : 0,
      }
    })
  }

  /**
   * 트렌드 차트 생성
   */
  private async createTrendChart(data: any[]): Promise<any[]> {
    if (data.length === 0) return []

    const chartData = await this.visualizeData({
      data,
      chartType: 'line',
      xAxis: 'date',
      yAxis: 'gmv',
      title: '매출 트렌드',
    })

    return chartData.success ? [chartData.data] : []
  }

  /**
   * 비교 차트 생성
   */
  private async createComparisonChart(data: any): Promise<any[]> {
    // 비교 분석 결과가 객체인 경우 (기간 비교)
    if (data && typeof data === 'object' && !Array.isArray(data) && data.summary) {
      const summary = data.summary
      const chartData = [
        {
          period: summary.period1.label,
          gmv: summary.period1.gmv,
          orderCount: summary.period1.orderCount
        },
        {
          period: summary.period2.label,
          gmv: summary.period2.gmv,
          orderCount: summary.period2.orderCount
        }
      ]

      const chart = await this.visualizeData({
        data: chartData,
        chartType: 'bar',
        xAxis: 'period',
        yAxis: 'gmv',
        title: '기간별 비교 분석',
      })

      return chart.success ? [chart.data] : []
    }

    // 배열인 경우 (기존 로직)
    if (Array.isArray(data) && data.length === 0) return []

    const chartData = await this.visualizeData({
      data,
      chartType: 'bar',
      xAxis: 'category',
      yAxis: 'gmv',
      title: '비교 분석',
    })

    return chartData.success ? [chartData.data] : []
  }

  /**
   * 자연어 응답 생성 (고도화 + 재시도 + 검증)
   */
  private async generateResponse(
    query: string,
    results: { data: any; charts?: any[]; actions?: any[] },
    intent: ExtractedIntent | any,
    _suggestions?: string[]
  ): Promise<string> {
    const intentType = typeof intent === 'object' && intent.intent ? intent.intent : (intent.intent || 'general_query')

    // 실제 데이터가 있는지 확인
    const hasData = Array.isArray(results.data) 
      ? results.data.length > 0 
      : results.data && Object.keys(results.data).length > 0

    if (!hasData) {
      return this.getNoDataMessage(query, intent)
    }

    // 날짜 범위 정보
    const dateRange = typeof intent === 'object' && intent.entities?.dateRange
      ? intent.entities.dateRange
      : null
    const dateRangeInfo = dateRange
      ? `${dateRange.start} ~ ${dateRange.end}`
      : '전체 기간'

    // 데이터 요약 생성
    const dataSummary = this.generateDetailedSummary(results.data, intentType)

    // 상관관계 인사이트 추가 (데이터가 충분한 경우)
    let correlationInsight = ''
    if (Array.isArray(results.data) && results.data.length >= 10) {
      try {
        const analysis = correlationAnalyzer.analyze(results.data)
        if (analysis.insights.length > 0) {
          correlationInsight = `\n\n추가 발견 사항:\n${analysis.insights.slice(0, 2).map(i => `- ${i.title}: ${i.description}`).join('\n')}`
        }
      } catch (e) {
        // 상관관계 분석 실패 무시
      }
    }

    const prompt = `${this.getSystemPrompt()}

사용자 질문: "${query}"
분석 기간: ${dateRangeInfo}
분석 유형: ${this.getIntentLabel(intentType)}

분석 데이터:
${dataSummary}${correlationInsight}

위 데이터를 바탕으로 응답 형식에 맞춰 분석 결과를 작성해주세요.
- 핵심 수치를 먼저 제시하고, 의미를 해석해주세요
- 비교 가능한 경우 증감률이나 순위 변화를 언급해주세요
- 비즈니스 관점의 인사이트를 포함해주세요
- 마크다운 형식을 사용하지 말고 일반 텍스트로 작성해주세요
- 이모지는 섹션 구분에만 사용해주세요`

    // 재시도 핸들러로 LLM 호출
    const retryResult = await openaiRetryHandler.execute(
      () => this.openaiService.generate(prompt, {
        temperature: 0.6,
        maxTokens: 1500,
      }),
      'DataAnalyst LLM 응답 생성'
    )

    if (!retryResult.success) {
      console.error('[DataAnalystAgent] LLM 응답 생성 실패:', retryResult.error)
      return this.generateFallbackResponse(results.data, intentType, dateRangeInfo)
    }

    const response = retryResult.data!

    // 응답 품질 검증
    const validation = dataAnalystValidator.validate(response, {
      query,
      intent: intentType,
      hasData: true,
    })

    if (!validation.isValid && validation.score < 40) {
      console.warn('[DataAnalystAgent] 응답 품질 낮음:', validation.issues)
      // 품질이 매우 낮으면 폴백 응답 사용
      return this.generateFallbackResponse(results.data, intentType, dateRangeInfo)
    }

    return response
  }

  /**
   * 폴백 응답 생성 (LLM 실패 시)
   */
  private generateFallbackResponse(data: any, intentType: string, dateRangeInfo: string): string {
    const lines: string[] = []
    
    lines.push(`📊 분석 결과 요약 (${dateRangeInfo})`)
    lines.push('')

    if (Array.isArray(data) && data.length > 0) {
      lines.push(`총 ${data.length}건의 데이터가 조회되었습니다.`)
      
      // 숫자 컬럼 합계 계산
      const sampleRow = data[0]
      const numericColumns = Object.keys(sampleRow).filter(k => {
        const val = sampleRow[k]
        return typeof val === 'number' || !isNaN(Number(val))
      })

      for (const col of numericColumns.slice(0, 3)) {
        const sum = data.reduce((s, row) => s + (Number(row[col]) || 0), 0)
        if (sum > 0) {
          lines.push(`- ${col}: ${this.formatNumber(sum)}`)
        }
      }
    }

    lines.push('')
    lines.push('💡 더 자세한 분석이 필요하시면 구체적인 질문을 해주세요.')

    return lines.join('\n')
  }

  /**
   * 의도 유형 라벨
   */
  private getIntentLabel(intent: string): string {
    const labels: Record<string, string> = {
      trend_analysis: '트렌드 분석',
      comparison: '비교 분석',
      aggregation: '집계 분석',
      ranking: '랭킹 분석',
      general_query: '일반 조회',
      filter: '필터링',
      join: '조인 분석',
    }
    return labels[intent] || '데이터 분석'
  }

  /**
   * 상세 데이터 요약 생성
   */
  private generateDetailedSummary(data: any, intent: string): string {
    // 비교 분석 결과가 객체인 경우 (기간 비교)
    if (intent === 'comparison' && data && typeof data === 'object' && !Array.isArray(data) && data.summary) {
      const summary = data.summary
      const changes = summary.changes
      const lines: string[] = []
      
      lines.push(`기간별 비교 분석 결과:`)
      lines.push('')
      lines.push(`기간 1 (${summary.period1.label}):`)
      lines.push(`- 총 매출(GMV): ${this.formatNumber(summary.period1.gmv)} USD`)
      lines.push(`- 주문 수: ${summary.period1.orderCount}건`)
      lines.push(`- 평균 주문 금액: ${this.formatNumber(summary.period1.avgOrderValue)} USD`)
      lines.push('')
      lines.push(`기간 2 (${summary.period2.label}):`)
      lines.push(`- 총 매출(GMV): ${this.formatNumber(summary.period2.gmv)} USD`)
      lines.push(`- 주문 수: ${summary.period2.orderCount}건`)
      lines.push(`- 평균 주문 금액: ${this.formatNumber(summary.period2.avgOrderValue)} USD`)
      lines.push('')
      lines.push(`변화 분석:`)
      lines.push(`- 매출: ${changes.gmv.direction === 'increase' ? '증가' : changes.gmv.direction === 'decrease' ? '감소' : '유지'} `)
      if (changes.gmv.absolute !== 0) {
        lines.push(`  절대 변화: ${changes.gmv.absolute > 0 ? '+' : ''}${this.formatNumber(changes.gmv.absolute)} USD`)
      }
      if (changes.gmv.percent !== null && changes.gmv.percent !== undefined) {
        lines.push(`  변화율: ${changes.gmv.percent > 0 ? '+' : ''}${changes.gmv.percent.toFixed(1)}%`)
      }
      lines.push(`- 주문 수: ${changes.orders.direction === 'increase' ? '증가' : changes.orders.direction === 'decrease' ? '감소' : '유지'} `)
      if (changes.orders.absolute !== 0) {
        lines.push(`  절대 변화: ${changes.orders.absolute > 0 ? '+' : ''}${changes.orders.absolute}건`)
      }
      if (changes.orders.percent !== null && changes.orders.percent !== undefined) {
        lines.push(`  변화율: ${changes.orders.percent > 0 ? '+' : ''}${changes.orders.percent.toFixed(1)}%`)
      }
      
      if (data.countryComparison && data.countryComparison.length > 0) {
        lines.push('')
        lines.push('국가별 비교 (상위 5개):')
        data.countryComparison.slice(0, 5).forEach((c: any) => {
          const changeText = c.change.gmvPercent !== null && c.change.gmvPercent !== undefined
            ? `(${c.change.gmvPercent > 0 ? '+' : ''}${c.change.gmvPercent.toFixed(1)}%)`
            : ''
          lines.push(`- ${c.country}: ${this.formatNumber(c.period1.gmv)} USD → ${this.formatNumber(c.period2.gmv)} USD ${changeText}`)
        })
      }
      
      return lines.join('\n')
    }

    if (!Array.isArray(data) || data.length === 0) {
      return '데이터 없음'
    }

    const lines: string[] = []
    lines.push(`총 ${data.length}건의 데이터`)

    if (intent === 'trend_analysis') {
      const totalGmv = data.reduce((sum: number, d: any) => sum + (Number(d.gmv) || 0), 0)
      const totalOrders = data.reduce((sum: number, d: any) => sum + (Number(d.orderCount) || 0), 0)
      const avgGmv = data.length > 0 ? totalGmv / data.length : 0
      
      lines.push(`- 총 매출: ${this.formatNumber(totalGmv)} USD`)
      lines.push(`- 총 주문: ${totalOrders}건`)
      lines.push(`- 일평균 매출: ${this.formatNumber(avgGmv)} USD`)
      
      // 트렌드 방향 계산
      if (data.length >= 2) {
        const firstHalf = data.slice(0, Math.floor(data.length / 2))
        const secondHalf = data.slice(Math.floor(data.length / 2))
        const firstAvg = firstHalf.reduce((s: number, d: any) => s + (Number(d.gmv) || 0), 0) / firstHalf.length
        const secondAvg = secondHalf.reduce((s: number, d: any) => s + (Number(d.gmv) || 0), 0) / secondHalf.length
        const changeRate = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg * 100) : 0
        lines.push(`- 추세: ${changeRate > 0 ? '상승' : changeRate < 0 ? '하락' : '유지'} (${changeRate > 0 ? '+' : ''}${changeRate.toFixed(1)}%)`)
      }
    } else if (intent === 'ranking') {
      lines.push('\n상위 항목:')
      data.slice(0, 5).forEach((d: any, i: number) => {
        const name = d.name || d.category || d.artist_name || '알 수 없음'
        const value = d.gmv || d.totalGmv || d['Total GMV'] || d.count || 0
        lines.push(`${i + 1}. ${name}: ${this.formatNumber(value)} ${typeof value === 'number' && value > 100 ? 'USD' : '건'}`)
      })
    } else if (intent === 'comparison') {
      lines.push('\n비교 항목:')
      data.forEach((d: any) => {
        const category = d.category || d.country || d.platform || d.period || '기타'
        const gmv = d.gmv || d.totalGmv || 0
        const count = d.count || d.orderCount || 0
        lines.push(`- ${category}: ${this.formatNumber(gmv)} USD (${count}건)`)
      })
    } else {
      // 일반 데이터
      const sampleRow = data[0]
      const keys = Object.keys(sampleRow).slice(0, 5)
      lines.push(`컬럼: ${keys.join(', ')}`)
      
      // 숫자 컬럼 합계
      for (const key of keys) {
        const values = data.map((d: any) => Number(d[key])).filter((v: number) => !isNaN(v))
        if (values.length > 0 && values.length === data.length) {
          const sum = values.reduce((a: number, b: number) => a + b, 0)
          lines.push(`- ${key} 합계: ${this.formatNumber(sum)}`)
        }
      }
    }

    return lines.join('\n')
  }

  /**
   * 숫자 포맷팅 헬퍼
   */
  private formatNumber(value: any): string {
    const num = Number(value)
    if (isNaN(num)) return '0'
    return num.toLocaleString('ko-KR', { maximumFractionDigits: 2 })
  }

  /**
   * 날짜 범위 추출
   */
  private extractDateRange(query: string): { start: string; end: string } | undefined {
    const today = new Date()
    const endDate = new Date(today)
    endDate.setHours(23, 59, 59, 999)

    const lowerQuery = query.toLowerCase()

    // 구체적인 연도와 월 파싱 (예: "2025년 11월", "2025년11월", "2025/11")
    const yearMonthMatch = query.match(/(\d{4})\s*년\s*(\d{1,2})\s*월|(\d{4})\/(\d{1,2})/i)
    if (yearMonthMatch) {
      const year = parseInt(yearMonthMatch[1] || yearMonthMatch[3])
      const month = parseInt(yearMonthMatch[2] || yearMonthMatch[4]) - 1 // JavaScript Date는 0부터 시작
      
      const startDate = new Date(year, month, 1)
      startDate.setHours(0, 0, 0, 0)
      
      const endDateForMonth = new Date(year, month + 1, 0) // 해당 월의 마지막 날
      endDateForMonth.setHours(23, 59, 59, 999)

      return {
        start: startDate.toISOString().split('T')[0],
        end: endDateForMonth.toISOString().split('T')[0],
      }
    }

    // 구체적인 연도만 파싱 (예: "2025년")
    const yearMatch = query.match(/(\d{4})\s*년/i)
    if (yearMatch) {
      const year = parseInt(yearMatch[1])
      const startDate = new Date(year, 0, 1)
      startDate.setHours(0, 0, 0, 0)
      
      const endDateForYear = new Date(year, 11, 31)
      endDateForYear.setHours(23, 59, 59, 999)

      return {
        start: startDate.toISOString().split('T')[0],
        end: endDateForYear.toISOString().split('T')[0],
      }
    }

    // 월만 파싱 (예: "11월", "11월분")
    const monthMatch = query.match(/(\d{1,2})\s*월/i)
    if (monthMatch && !yearMonthMatch) {
      const month = parseInt(monthMatch[1]) - 1
      const startDate = new Date(today.getFullYear(), month, 1)
      startDate.setHours(0, 0, 0, 0)
      
      const endDateForMonth = new Date(today.getFullYear(), month + 1, 0)
      endDateForMonth.setHours(23, 59, 59, 999)

      return {
        start: startDate.toISOString().split('T')[0],
        end: endDateForMonth.toISOString().split('T')[0],
      }
    }

    // 최근 N일
    const recentMatch = query.match(/(\d+)일|(\d+)days?/i)
    if (recentMatch) {
      const days = parseInt(recentMatch[1] || recentMatch[2] || '30')
      const startDate = new Date(today)
      startDate.setDate(startDate.getDate() - days)
      startDate.setHours(0, 0, 0, 0)

      return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      }
    }

    // 이번 주, 이번 달 등
    if (lowerQuery.includes('이번 주') || lowerQuery.includes('이번주')) {
      const startDate = new Date(today)
      startDate.setDate(startDate.getDate() - startDate.getDay())
      startDate.setHours(0, 0, 0, 0)

      return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      }
    }

    if (lowerQuery.includes('이번 달') || lowerQuery.includes('이번달')) {
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      startDate.setHours(0, 0, 0, 0)

      return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      }
    }

    // 기본값: 최근 30일 (명시적인 날짜가 없을 때만)
    // 날짜가 명시되지 않은 경우 undefined 반환하여 전체 데이터 조회
    return undefined
  }

  /**
   * 날짜 키 추출
   */
  private getDateKey(row: any): string {
    const dateValue = row['order_created'] || row['CREATED_AT']
    if (!dateValue) return 'unknown'

    const date = new Date(dateValue)
    return date.toISOString().split('T')[0]
  }
}

