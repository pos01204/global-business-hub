/**
 * 향상된 날짜 파싱 클래스
 * 상대적 날짜 표현 ("금일", "오늘", "어제" 등)을 정확하게 처리
 */

export interface DateRange {
  start: string
  end: string
  type: 'absolute' | 'relative'
}

export interface ComparisonDateRanges {
  period1: DateRange
  period2: DateRange
  period1Label: string
  period2Label: string
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

    // 6. "지난 달", "지난달", "전월" 처리
    if (lowerQuery.includes('지난 달') || lowerQuery.includes('지난달') || 
        lowerQuery.includes('전월') || lowerQuery.includes('last month') ||
        lowerQuery.includes('previous month')) {
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

  /**
   * 비교 분석을 위한 두 기간 추출
   * 예: "전월 대비", "이번 달 vs 지난 달", "11월 vs 12월"
   */
  parseComparisonDateRange(query: string): ComparisonDateRanges | undefined {
    const lowerQuery = query.toLowerCase()
    const today = this.currentDate
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth() + 1 // 1-12

    // 1. "전월 대비", "전월 비교", "지난 달 대비" 처리
    if (lowerQuery.includes('전월 대비') || lowerQuery.includes('전월 비교') ||
        lowerQuery.includes('지난 달 대비') || lowerQuery.includes('지난달 대비') ||
        lowerQuery.includes('previous month comparison') || lowerQuery.includes('last month vs')) {
      
      // 전월 (period1)
      const lastMonth = new Date(currentYear, today.getMonth() - 1, 1)
      lastMonth.setHours(0, 0, 0, 0)
      const lastMonthEnd = new Date(currentYear, today.getMonth(), 0)
      lastMonthEnd.setHours(23, 59, 59, 999)

      // 현재 월 (period2) - 오늘까지
      const currentMonthStart = new Date(currentYear, today.getMonth(), 1)
      currentMonthStart.setHours(0, 0, 0, 0)
      const currentMonthEnd = new Date(today)
      currentMonthEnd.setHours(23, 59, 59, 999)

      return {
        period1: {
          start: lastMonth.toISOString().split('T')[0],
          end: lastMonthEnd.toISOString().split('T')[0],
          type: 'relative'
        },
        period2: {
          start: currentMonthStart.toISOString().split('T')[0],
          end: currentMonthEnd.toISOString().split('T')[0],
          type: 'relative'
        },
        period1Label: `${lastMonth.getFullYear()}년 ${lastMonth.getMonth() + 1}월`,
        period2Label: `${currentYear}년 ${currentMonth}월`
      }
    }

    // 2. "이번 달 vs 지난 달" 처리
    if (lowerQuery.includes('이번 달') && (lowerQuery.includes('vs') || lowerQuery.includes('대비') || lowerQuery.includes('비교'))) {
      const lastMonth = new Date(currentYear, today.getMonth() - 1, 1)
      lastMonth.setHours(0, 0, 0, 0)
      const lastMonthEnd = new Date(currentYear, today.getMonth(), 0)
      lastMonthEnd.setHours(23, 59, 59, 999)

      const currentMonthStart = new Date(currentYear, today.getMonth(), 1)
      currentMonthStart.setHours(0, 0, 0, 0)
      const currentMonthEnd = new Date(today)
      currentMonthEnd.setHours(23, 59, 59, 999)

      return {
        period1: {
          start: lastMonth.toISOString().split('T')[0],
          end: lastMonthEnd.toISOString().split('T')[0],
          type: 'relative'
        },
        period2: {
          start: currentMonthStart.toISOString().split('T')[0],
          end: currentMonthEnd.toISOString().split('T')[0],
          type: 'relative'
        },
        period1Label: '지난 달',
        period2Label: '이번 달'
      }
    }

    // 3. 구체적인 월 비교 (예: "11월 vs 12월", "2024년 11월 vs 2024년 12월")
    const monthComparisonMatch = query.match(/(\d{4})\s*년\s*(\d{1,2})\s*월\s*(?:vs|대비|비교)\s*(\d{4})\s*년\s*(\d{1,2})\s*월/i)
    if (monthComparisonMatch) {
      const year1 = parseInt(monthComparisonMatch[1])
      const month1 = parseInt(monthComparisonMatch[2])
      const year2 = parseInt(monthComparisonMatch[3])
      const month2 = parseInt(monthComparisonMatch[4])

      const period1Start = new Date(year1, month1 - 1, 1)
      period1Start.setHours(0, 0, 0, 0)
      const period1End = new Date(year1, month1, 0)
      period1End.setHours(23, 59, 59, 999)

      const period2Start = new Date(year2, month2 - 1, 1)
      period2Start.setHours(0, 0, 0, 0)
      const period2End = new Date(year2, month2, 0)
      period2End.setHours(23, 59, 59, 999)

      return {
        period1: {
          start: period1Start.toISOString().split('T')[0],
          end: period1End.toISOString().split('T')[0],
          type: 'absolute'
        },
        period2: {
          start: period2Start.toISOString().split('T')[0],
          end: period2End.toISOString().split('T')[0],
          type: 'absolute'
        },
        period1Label: `${year1}년 ${month1}월`,
        period2Label: `${year2}년 ${month2}월`
      }
    }

    // 4. 현재 연도 기준 월 비교 (예: "11월 vs 12월")
    const simpleMonthMatch = query.match(/(\d{1,2})\s*월\s*(?:vs|대비|비교)\s*(\d{1,2})\s*월/i)
    if (simpleMonthMatch && !monthComparisonMatch) {
      const month1 = parseInt(simpleMonthMatch[1])
      const month2 = parseInt(simpleMonthMatch[2])
      
      // 두 월이 모두 현재 연도 기준으로 처리
      const year = currentYear
      const period1Start = new Date(year, month1 - 1, 1)
      period1Start.setHours(0, 0, 0, 0)
      const period1End = new Date(year, month1, 0)
      period1End.setHours(23, 59, 59, 999)

      const period2Start = new Date(year, month2 - 1, 1)
      period2Start.setHours(0, 0, 0, 0)
      const period2End = new Date(year, month2, 0)
      period2End.setHours(23, 59, 59, 999)

      return {
        period1: {
          start: period1Start.toISOString().split('T')[0],
          end: period1End.toISOString().split('T')[0],
          type: 'absolute'
        },
        period2: {
          start: period2Start.toISOString().split('T')[0],
          end: period2End.toISOString().split('T')[0],
          type: 'absolute'
        },
        period1Label: `${year}년 ${month1}월`,
        period2Label: `${year}년 ${month2}월`
      }
    }

    return undefined
  }
}

export const enhancedDateParser = new EnhancedDateParser()

