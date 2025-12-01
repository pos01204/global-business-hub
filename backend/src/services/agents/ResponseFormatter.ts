/**
 * 응답 포맷터
 * 일관된 응답 형식 보장 및 데이터 포맷팅
 */

export interface FormattedResponse {
  text: string
  sections: Array<{
    title: string
    content: string
    emoji?: string
  }>
  highlights: string[]
  metadata?: {
    dataCount?: number
    dateRange?: string
    analysisType?: string
  }
}

export interface TableData {
  headers: string[]
  rows: any[][]
  title?: string
}

export class ResponseFormatter {
  /**
   * 숫자 포맷팅 (천 단위 구분)
   */
  static formatNumber(value: any, decimals: number = 0): string {
    const num = Number(value)
    if (isNaN(num)) return '0'
    return num.toLocaleString('ko-KR', { 
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals > 0 ? decimals : 0
    })
  }

  /**
   * 통화 포맷팅
   */
  static formatCurrency(value: any, currency: 'USD' | 'KRW' = 'USD'): string {
    const num = Number(value)
    if (isNaN(num)) return currency === 'USD' ? '$0' : '₩0'
    
    const formatted = num.toLocaleString('ko-KR', { maximumFractionDigits: 2 })
    return currency === 'USD' ? `$${formatted}` : `₩${formatted}`
  }

  /**
   * 퍼센트 포맷팅
   */
  static formatPercent(value: any, decimals: number = 1): string {
    const num = Number(value)
    if (isNaN(num)) return '0%'
    return `${num >= 0 ? '+' : ''}${num.toFixed(decimals)}%`
  }

  /**
   * 날짜 포맷팅
   */
  static formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
    const d = new Date(date)
    if (isNaN(d.getTime())) return String(date)

    if (format === 'short') {
      return d.toISOString().split('T')[0]
    }
    
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  /**
   * 날짜 범위 포맷팅
   */
  static formatDateRange(start: string, end: string): string {
    return `${this.formatDate(start)} ~ ${this.formatDate(end)}`
  }

  /**
   * 국가 코드를 이름으로 변환
   */
  static formatCountry(code: string): string {
    const countries: Record<string, string> = {
      JP: '일본 🇯🇵',
      US: '미국 🇺🇸',
      KR: '한국 🇰🇷',
      CN: '중국 🇨🇳',
      TW: '대만 🇹🇼',
      HK: '홍콩 🇭🇰',
    }
    return countries[code] || code
  }

  /**
   * 데이터 배열을 테이블 형식으로 포맷팅
   */
  static formatTable(data: any[], columns?: string[]): TableData {
    if (!Array.isArray(data) || data.length === 0) {
      return { headers: [], rows: [], title: '데이터 없음' }
    }

    const headers = columns || Object.keys(data[0])
    const rows = data.map(row => 
      headers.map(h => {
        const val = row[h]
        if (typeof val === 'number') {
          return this.formatNumber(val, val % 1 !== 0 ? 2 : 0)
        }
        return val ?? '-'
      })
    )

    return { headers, rows }
  }

  /**
   * 랭킹 데이터 포맷팅
   */
  static formatRanking(
    data: any[],
    nameKey: string,
    valueKey: string,
    limit: number = 10
  ): string {
    const lines: string[] = []
    const sorted = [...data].sort((a, b) => Number(b[valueKey]) - Number(a[valueKey]))

    sorted.slice(0, limit).forEach((item, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`
      const name = item[nameKey] || '알 수 없음'
      const value = this.formatNumber(item[valueKey])
      lines.push(`${medal} ${name}: ${value}`)
    })

    return lines.join('\n')
  }

  /**
   * 비교 데이터 포맷팅
   */
  static formatComparison(
    data: any[],
    categoryKey: string,
    valueKey: string
  ): string {
    const lines: string[] = []
    const total = data.reduce((sum, d) => sum + (Number(d[valueKey]) || 0), 0)

    data.forEach(item => {
      const category = item[categoryKey] || '기타'
      const value = Number(item[valueKey]) || 0
      const percent = total > 0 ? (value / total * 100).toFixed(1) : '0'
      lines.push(`• ${category}: ${this.formatNumber(value)} (${percent}%)`)
    })

    return lines.join('\n')
  }

  /**
   * 트렌드 데이터 포맷팅
   */
  static formatTrend(
    data: any[],
    dateKey: string,
    valueKey: string
  ): { summary: string; direction: string; changeRate: number } {
    if (data.length < 2) {
      return { summary: '데이터 부족', direction: 'stable', changeRate: 0 }
    }

    const sorted = [...data].sort((a, b) => 
      new Date(a[dateKey]).getTime() - new Date(b[dateKey]).getTime()
    )

    const firstValue = Number(sorted[0][valueKey]) || 0
    const lastValue = Number(sorted[sorted.length - 1][valueKey]) || 0
    const changeRate = firstValue > 0 ? ((lastValue - firstValue) / firstValue * 100) : 0

    let direction: string
    let emoji: string
    if (changeRate > 5) {
      direction = 'increasing'
      emoji = '📈'
    } else if (changeRate < -5) {
      direction = 'decreasing'
      emoji = '📉'
    } else {
      direction = 'stable'
      emoji = '➡️'
    }

    const summary = `${emoji} ${this.formatPercent(changeRate)} (${this.formatNumber(firstValue)} → ${this.formatNumber(lastValue)})`

    return { summary, direction, changeRate }
  }

  /**
   * 응답 섹션 생성
   */
  static createSection(
    emoji: string,
    title: string,
    content: string | string[]
  ): string {
    const contentStr = Array.isArray(content) ? content.join('\n') : content
    return `${emoji} ${title}\n${contentStr}`
  }

  /**
   * 전체 응답 포맷팅
   */
  static formatFullResponse(sections: Array<{
    emoji: string
    title: string
    content: string | string[]
  }>): string {
    return sections
      .map(s => this.createSection(s.emoji, s.title, s.content))
      .join('\n\n')
  }

  /**
   * 하이라이트 추출
   */
  static extractHighlights(data: any[], limit: number = 3): string[] {
    const highlights: string[] = []

    if (!Array.isArray(data) || data.length === 0) {
      return highlights
    }

    // 숫자 컬럼 찾기
    const sampleRow = data[0]
    const numericColumns = Object.keys(sampleRow).filter(k => {
      const val = sampleRow[k]
      return typeof val === 'number' || !isNaN(Number(val))
    })

    // 각 숫자 컬럼의 합계 계산
    for (const col of numericColumns.slice(0, limit)) {
      const sum = data.reduce((s, row) => s + (Number(row[col]) || 0), 0)
      if (sum > 0) {
        highlights.push(`${col}: ${this.formatNumber(sum)}`)
      }
    }

    return highlights
  }

  /**
   * 에러 응답 포맷팅
   */
  static formatError(error: string, suggestions?: string[]): string {
    let response = `⚠️ ${error}`
    
    if (suggestions && suggestions.length > 0) {
      response += '\n\n💡 시도해볼 수 있는 방법:\n'
      response += suggestions.map(s => `• ${s}`).join('\n')
    }

    return response
  }

  /**
   * 빈 데이터 응답 포맷팅
   */
  static formatNoData(query: string, dateRange?: string): string {
    const lines = [
      '📭 요청하신 조건에 해당하는 데이터가 없습니다.',
      '',
      dateRange ? `조회 기간: ${dateRange}` : '',
      '',
      '다음을 확인해보세요:',
      '• 날짜 범위가 올바른지 확인',
      '• 필터 조건이 너무 제한적이지 않은지 확인',
      '• 다른 기간이나 조건으로 다시 시도',
    ]

    return lines.filter(l => l !== '').join('\n')
  }
}

export default ResponseFormatter
