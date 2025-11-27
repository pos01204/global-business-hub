import { BaseAgent, AgentContext, ToolResult } from './BaseAgent'

export class DataAnalystAgent extends BaseAgent {
  private systemPrompt = `당신은 데이터 분석 전문가입니다. 
사용자의 자연어 질문을 분석하여 적절한 데이터 조회 및 분석을 수행합니다.

사용 가능한 데이터 소스:
- order: 주문 정보 (order_code, order_created, user_id, Total GMV, platform, PG사, method)
- logistics: 물류 추적 정보 (order_code, shipment_id, country, product_name, artist_name, 처리상태 등)
- users: 사용자 정보 (ID, NAME, EMAIL, COUNTRY, CREATED_AT)
- artists: 작가 정보 (작가명, 작품수 등)

분석 시 다음을 고려하세요:
1. 날짜 범위가 명시되지 않으면 최근 30일 데이터를 기본으로 사용
2. 숫자 데이터는 USD 단위이며, 필요시 KRW로 변환 (환율 1350)
3. 데이터가 없거나 부족한 경우 명확히 알려주세요
4. 분석 결과는 구체적인 숫자와 함께 제시하세요
5. 가능하면 트렌드나 패턴을 설명하세요

답변은 한국어로 작성하세요.`

  async process(query: string, context: AgentContext = {}): Promise<{
    response: string
    data?: any
    charts?: any[]
    actions?: Array<{ label: string; action: string; data?: any }>
  }> {
    try {
      // 의도 분석 및 데이터 조회 계획 수립
      const analysis = await this.analyzeIntent(query)
      
      // 데이터 조회 및 분석 수행
      const results = await this.executeAnalysis(analysis)

      // LLM을 통한 자연어 응답 생성
      const response = await this.generateResponse(query, results, analysis)

      return {
        response,
        data: results.data,
        charts: results.charts,
        actions: results.actions,
      }
    } catch (error: any) {
      return {
        response: `분석 중 오류가 발생했습니다: ${error.message}`,
      }
    }
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
   * 분석 실행
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
  private async analyzeTrends(data: any[], dateRange?: { start: string; end: string }): Promise<any[]> {
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
  private async createComparisonChart(data: any[]): Promise<any[]> {
    if (data.length === 0) return []

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
   * 자연어 응답 생성
   */
  private async generateResponse(
    query: string,
    results: { data: any; charts?: any[]; actions?: any[] },
    analysis: any
  ): Promise<string> {
    const dataSummary = this.formatDataSummary(results.data, analysis.intent)

    // 실제 데이터가 있는지 확인
    const hasData = Array.isArray(results.data) 
      ? results.data.length > 0 
      : results.data && Object.keys(results.data).length > 0

    // 날짜 범위 정보 추가
    const dateRangeInfo = analysis.dataNeeds?.dateRange 
      ? `\n요청한 날짜 범위: ${analysis.dataNeeds.dateRange.start} ~ ${analysis.dataNeeds.dateRange.end}`
      : '\n날짜 범위: 전체 데이터'

    const prompt = `${this.systemPrompt}

사용자 질문: ${query}
${dateRangeInfo}

분석 결과:
${hasData ? JSON.stringify(dataSummary, null, 2) : '데이터가 없습니다.'}

${hasData 
  ? '위 분석 결과를 바탕으로 사용자에게 친절하고 전문적인 답변을 작성해주세요.'
  : '데이터가 조회되지 않았습니다. 실제로 데이터가 존재하는지 확인하고, 날짜 범위가 올바른지 확인해주세요.'}
- 구체적인 숫자와 함께 설명하세요
- 트렌드나 패턴이 있다면 설명하세요
- 인사이트나 제안이 있다면 포함하세요
- 데이터가 없는 경우, 실제 데이터 범위를 확인한 후 정확히 알려주세요
- 한국어로 답변하세요.`

    return await this.openaiService.generate(prompt, {
      temperature: 0.7,
      maxTokens: 1500,
    })
  }

  /**
   * 데이터 요약 포맷팅
   */
  private formatDataSummary(data: any, intent: string): string {
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return '데이터가 없습니다.'
      }

      if (intent === 'trend_analysis') {
        const totalGmv = data.reduce((sum: number, d: any) => sum + (d.gmv || 0), 0)
        const totalOrders = data.reduce((sum: number, d: any) => sum + (d.orderCount || 0), 0)
        return `총 ${data.length}일간의 데이터: 총 매출 ${totalGmv.toLocaleString()} USD, 총 주문 ${totalOrders}건`
      }

      if (intent === 'ranking') {
        return `상위 ${data.length}개 항목:\n${data.slice(0, 5).map((d, i) => `${i + 1}. ${d.name}: ${d.gmv.toLocaleString()} USD`).join('\n')}`
      }

      return `총 ${data.length}건의 데이터`
    }

    if (typeof data === 'object') {
      return JSON.stringify(data, null, 2)
    }

    return String(data)
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

