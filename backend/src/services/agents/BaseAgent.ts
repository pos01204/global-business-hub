import { openaiService } from '../openaiService'
import GoogleSheetsService from '../googleSheets'
import { sheetsConfig, SHEET_NAMES } from '../../config/sheets'

export interface ToolResult {
  success: boolean
  data?: any
  error?: string
  metadata?: {
    rowCount?: number
    executionTime?: number
    [key: string]: any
  }
}

export interface AgentContext {
  userId?: string
  sessionId?: string
  history?: Array<{ role: string; content: string }>
  [key: string]: any
}

export abstract class BaseAgent {
  protected sheetsService: GoogleSheetsService
  protected openaiService = openaiService
  protected context: AgentContext

  constructor(context: AgentContext = {}) {
    this.context = context
    this.sheetsService = new GoogleSheetsService({
      spreadsheetId: sheetsConfig.spreadsheetId,
      clientEmail: sheetsConfig.clientEmail,
      privateKey: sheetsConfig.privateKey,
    })
  }

  /**
   * 공통 도구: 데이터 조회
   */
  async getData(params: {
    sheet: 'order' | 'logistics' | 'users' | 'artists'
    dateRange?: { start: string; end: string }
    filters?: Record<string, any>
    limit?: number
  }): Promise<ToolResult> {
    const startTime = Date.now()
    try {
      const sheetName = SHEET_NAMES[params.sheet.toUpperCase() as keyof typeof SHEET_NAMES]
      if (!sheetName) {
        return {
          success: false,
          error: `알 수 없는 시트 이름: ${params.sheet}`,
        }
      }

      // Fill-down은 logistics 시트에만 적용
      const enableFillDown = params.sheet === 'logistics'
      let data = await this.sheetsService.getSheetDataAsJson(sheetName, enableFillDown)

      // 날짜 범위 필터링
      if (params.dateRange) {
        const startDate = new Date(params.dateRange.start)
        const endDate = new Date(params.dateRange.end)
        endDate.setHours(23, 59, 59, 999) // 하루 끝까지 포함

        const dateColumn = this.getDateColumn(params.sheet)
        if (dateColumn) {
          data = data.filter((row: any) => {
            const rowDate = new Date(row[dateColumn])
            return rowDate >= startDate && rowDate <= endDate
          })
        }
      }

      // 필터 적용
      if (params.filters) {
        data = this.applyFilters(data, params.filters)
      }

      // 제한 적용
      if (params.limit && params.limit > 0) {
        data = data.slice(0, params.limit)
      }

      const executionTime = Date.now() - startTime

      return {
        success: true,
        data,
        metadata: {
          rowCount: data.length,
          executionTime,
        },
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '데이터 조회 중 오류가 발생했습니다.',
      }
    }
  }

  /**
   * 공통 도구: 데이터 필터링
   */
  async filterData(params: {
    data: any[]
    conditions: Array<{ column: string; operator: string; value: any }>
  }): Promise<ToolResult> {
    try {
      let filtered = [...params.data]

      for (const condition of params.conditions) {
        const { column, operator, value } = condition

        filtered = filtered.filter((row: any) => {
          const cellValue = row[column]

          switch (operator) {
            case 'equals':
              return cellValue === value
            case 'not_equals':
              return cellValue !== value
            case 'contains':
              return String(cellValue).toLowerCase().includes(String(value).toLowerCase())
            case 'not_contains':
              return !String(cellValue).toLowerCase().includes(String(value).toLowerCase())
            case 'greater_than':
              return Number(cellValue) > Number(value)
            case 'less_than':
              return Number(cellValue) < Number(value)
            case 'greater_than_or_equal':
              return Number(cellValue) >= Number(value)
            case 'less_than_or_equal':
              return Number(cellValue) <= Number(value)
            case 'in':
              return Array.isArray(value) && value.includes(cellValue)
            case 'not_in':
              return Array.isArray(value) && !value.includes(cellValue)
            default:
              return true
          }
        })
      }

      return {
        success: true,
        data: filtered,
        metadata: {
          rowCount: filtered.length,
          originalCount: params.data.length,
        },
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '데이터 필터링 중 오류가 발생했습니다.',
      }
    }
  }

  /**
   * 공통 도구: 데이터 집계
   */
  async aggregateData(params: {
    data: any[]
    groupBy?: string[]
    aggregations: Record<string, 'sum' | 'avg' | 'count' | 'max' | 'min'>
  }): Promise<ToolResult> {
    try {
      const { data, groupBy = [], aggregations } = params

      if (groupBy.length === 0) {
        // 그룹화 없이 전체 집계
        const result: Record<string, any> = {}

        for (const [column, operation] of Object.entries(aggregations)) {
          const values = data
            .map((row: any) => Number(row[column]))
            .filter((val: number) => !isNaN(val))

          switch (operation) {
            case 'sum':
              result[column] = values.reduce((a: number, b: number) => a + b, 0)
              break
            case 'avg':
              result[column] = values.length > 0 ? values.reduce((a: number, b: number) => a + b, 0) / values.length : 0
              break
            case 'count':
              result[column] = values.length
              break
            case 'max':
              result[column] = values.length > 0 ? Math.max(...values) : null
              break
            case 'min':
              result[column] = values.length > 0 ? Math.min(...values) : null
              break
          }
        }

        return {
          success: true,
          data: result,
        }
      }

      // 그룹별 집계
      const groups = new Map<string, any[]>()

      for (const row of data) {
        const groupKey = groupBy.map((col) => String(row[col] || '')).join('|')
        if (!groups.has(groupKey)) {
          groups.set(groupKey, [])
        }
        groups.get(groupKey)!.push(row)
      }

      const result = Array.from(groups.entries()).map(([key, groupData]) => {
        const groupValues = key.split('|')
        const groupObj: Record<string, any> = {}

        groupBy.forEach((col, index) => {
          groupObj[col] = groupValues[index]
        })

        for (const [column, operation] of Object.entries(aggregations)) {
          const values = groupData
            .map((row: any) => Number(row[column]))
            .filter((val: number) => !isNaN(val))

          switch (operation) {
            case 'sum':
              groupObj[column] = values.reduce((a, b) => a + b, 0)
              break
            case 'avg':
              groupObj[column] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
              break
            case 'count':
              groupObj[column] = values.length
              break
            case 'max':
              groupObj[column] = values.length > 0 ? Math.max(...values) : null
              break
            case 'min':
              groupObj[column] = values.length > 0 ? Math.min(...values) : null
              break
          }
        }

        return groupObj
      })

      return {
        success: true,
        data: result,
        metadata: {
          groupCount: result.length,
        },
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '데이터 집계 중 오류가 발생했습니다.',
      }
    }
  }

  /**
   * 공통 도구: 데이터 시각화 정보 생성
   */
  async visualizeData(params: {
    data: any[]
    chartType: 'bar' | 'line' | 'pie' | 'table'
    xAxis?: string
    yAxis?: string
    title?: string
  }): Promise<ToolResult> {
    try {
      const { data, chartType, xAxis, yAxis, title } = params

      // 차트 데이터 구조 생성
      let chartData: any = {
        type: chartType,
        title: title || '데이터 시각화',
        data: [],
      }

      if (chartType === 'table') {
        chartData.data = data
      } else if (xAxis && yAxis) {
        chartData.labels = data.map((row: any) => String(row[xAxis] || ''))
        chartData.values = data.map((row: any) => Number(row[yAxis]) || 0)
      } else {
        chartData.data = data
      }

      return {
        success: true,
        data: chartData,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '데이터 시각화 중 오류가 발생했습니다.',
      }
    }
  }

  /**
   * 추상 메서드: Agent별 처리 로직
   */
  abstract process(query: string, context?: AgentContext): Promise<{
    response: string
    data?: any
    charts?: any[]
    actions?: Array<{ label: string; action: string; data?: any }>
  }>

  /**
   * 헬퍼 메서드: 날짜 컬럼 이름 반환
   */
  private getDateColumn(sheet: string): string | null {
    const dateColumns: Record<string, string> = {
      order: 'order_created',
      logistics: 'order_created', // logistics는 order와 조인 필요
      users: 'CREATED_AT',
      artists: null as any,
    }
    return dateColumns[sheet] || null
  }

  /**
   * 헬퍼 메서드: 필터 적용
   */
  private applyFilters(data: any[], filters: Record<string, any>): any[] {
    return data.filter((row: any) => {
      for (const [column, value] of Object.entries(filters)) {
        if (value === null || value === undefined) continue

        const cellValue = row[column]

        // 문자열 포함 검사
        if (typeof value === 'string' && typeof cellValue === 'string') {
          if (!cellValue.toLowerCase().includes(value.toLowerCase())) {
            return false
          }
        }
        // 정확한 일치 검사
        else if (cellValue !== value) {
          return false
        }
      }
      return true
    })
  }
}

