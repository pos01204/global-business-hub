/**
 * 향상된 날짜 파싱 클래스
 * 상대적 날짜 표현 ("금일", "오늘", "어제" 등)을 정확하게 처리
 */

export interface DateRange {
  start: string
  end: string
  type: 'absolute' | 'relative'
}

export interface DateRangeValidation {
  valid: boolean
  warnings: string[]
}

export class EnhancedDateParser {
  private currentDate: Date

  constructor(currentDate?: Date) {
    this.currentDate = currentDate || new Date()
  }

  /**
   * 향상된 날짜 범위 파싱
   */
  parseDateRange(
    query: string,
    currentDate: Date = this.currentDate
  ): DateRange | undefined {
    const lowerQuery = query.toLowerCase()
    const today = new Date(currentDate)
    today.setHours(0, 0, 0, 0)
    const endDate = new Date(today)
    endDate.setHours(23, 59, 59, 999)

    // 1. "금일", "오늘", "오늘 기준" 처리
    if (
      lowerQuery.includes('금일') ||
      lowerQuery.includes('오늘') ||
      lowerQuery.includes('오늘 기준') ||
      lowerQuery.includes('today') ||
      lowerQuery.includes('오늘의')
    ) {
      return {
        start: today.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        type: 'relative'
      }
    }

    // 2. "어제" 처리
    if (lowerQuery.includes('어제') || lowerQuery.includes('yesterday')) {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayEnd = new Date(yesterday)
      yesterdayEnd.setHours(23, 59, 59, 999)

      return {
        start: yesterday.toISOString().split('T')[0],
        end: yesterdayEnd.toISOString().split('T')[0],
        type: 'relative'
      }
    }

    // 3. "이번 주", "이번주" 처리
    if (lowerQuery.includes('이번 주') || lowerQuery.includes('이번주') || lowerQuery.includes('this week')) {
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay())
      startOfWeek.setHours(0, 0, 0, 0)

      return {
        start: startOfWeek.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        type: 'relative'
      }
    }

    // 4. "지난 주", "지난주" 처리
    if (lowerQuery.includes('지난 주') || lowerQuery.includes('지난주') || lowerQuery.includes('last week')) {
      const lastWeekStart = new Date(today)
      lastWeekStart.setDate(today.getDate() - today.getDay() - 7)
      lastWeekStart.setHours(0, 0, 0, 0)
      const lastWeekEnd = new Date(lastWeekStart)
      lastWeekEnd.setDate(lastWeekStart.getDate() + 6)
      lastWeekEnd.setHours(23, 59, 59, 999)

      return {
        start: lastWeekStart.toISOString().split('T')[0],
        end: lastWeekEnd.toISOString().split('T')[0],
        type: 'relative'
      }
    }

    // 5. "이번 달", "이번달" 처리
    if (lowerQuery.includes('이번 달') || lowerQuery.includes('이번달') || lowerQuery.includes('this month')) {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      startOfMonth.setHours(0, 0, 0, 0)

      return {
        start: startOfMonth.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        type: 'relative'
      }
    }

    // 6. "지난 달", "지난달" 처리
    if (lowerQuery.includes('지난 달') || lowerQuery.includes('지난달') || lowerQuery.includes('last month')) {
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      lastMonth.setHours(0, 0, 0, 0)
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
      lastMonthEnd.setHours(23, 59, 59, 999)

      return {
        start: lastMonth.toISOString().split('T')[0],
        end: lastMonthEnd.toISOString().split('T')[0],
        type: 'relative'
      }
    }

    // 7. "최근 N일" 처리 (개선)
    const recentMatch = query.match(/(최근|recent)\s*(\d+)\s*(일|days?)/i)
    if (recentMatch) {
      const days = parseInt(recentMatch[2])
      const startDate = new Date(today)
      startDate.setDate(today.getDate() - days + 1) // 오늘 포함
      startDate.setHours(0, 0, 0, 0)

      return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        type: 'relative'
      }
    }

    // 8. 구체적인 연도와 월 파싱 (예: "2025년 11월", "2025년11월", "2025/11")
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
        type: 'absolute'
      }
    }

    // 9. 구체적인 연도만 파싱 (예: "2025년")
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
        type: 'absolute'
      }
    }

    // 10. 월만 파싱 (예: "11월", "11월분") - 현재 연도 기준
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
        type: 'relative'
      }
    }

    // 11. 최근 N일 (단순 숫자만 있는 경우)
    const simpleRecentMatch = query.match(/(\d+)일|(\d+)days?/i)
    if (simpleRecentMatch && !recentMatch) {
      const days = parseInt(simpleRecentMatch[1] || simpleRecentMatch[2] || '30')
      const startDate = new Date(today)
      startDate.setDate(today.getDate() - days + 1)
      startDate.setHours(0, 0, 0, 0)

      return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        type: 'relative'
      }
    }

    return undefined
  }

  /**
   * 날짜 범위 검증
   */
  validateDateRange(
    dateRange: DateRange,
    currentDate: Date = this.currentDate
  ): DateRangeValidation {
    const warnings: string[] = []
    const start = new Date(dateRange.start)
    const end = new Date(dateRange.end)
    const today = new Date(currentDate)
    today.setHours(0, 0, 0, 0)

    // 미래 날짜 경고
    if (start > today) {
      warnings.push(`시작 날짜가 현재 날짜(${today.toISOString().split('T')[0]})보다 미래입니다.`)
    }

    if (end > today) {
      warnings.push(`종료 날짜가 현재 날짜(${today.toISOString().split('T')[0]})보다 미래입니다.`)
    }

    // 날짜 범위가 비정상적으로 넓은 경우
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff > 365) {
      warnings.push(`날짜 범위가 1년을 초과합니다 (${daysDiff}일). 의도한 범위인지 확인해주세요.`)
    }

    // 시작일이 종료일보다 늦은 경우
    if (start > end) {
      return {
        valid: false,
        warnings: ['시작 날짜가 종료 날짜보다 늦습니다.']
      }
    }

    return {
      valid: true,
      warnings
    }
  }

  /**
   * 현재 날짜 문자열 반환 (YYYY-MM-DD)
   */
  getCurrentDateString(): string {
    return this.currentDate.toISOString().split('T')[0]
  }

  /**
   * 현재 날짜 정보 반환 (한국어 형식)
   */
  getCurrentDateInfo(): string {
    const today = this.currentDate
    const year = today.getFullYear()
    const month = today.getMonth() + 1
    const date = today.getDate()
    return `${year}년 ${month}월 ${date}일`
  }
}

export const enhancedDateParser = new EnhancedDateParser()

