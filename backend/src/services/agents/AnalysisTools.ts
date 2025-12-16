/**
 * AnalysisTools - LangChain 기반 분석 도구 정의
 * Business Brain AI 에이전트가 사용하는 분석 도구들
 */

import { z } from 'zod'

// ==================== 도구 스키마 정의 ====================

/**
 * 매출 트렌드 분석 도구 스키마
 */
export const RevenueTrendSchema = z.object({
  startDate: z.string().describe('분석 시작 날짜 (YYYY-MM-DD 형식)'),
  endDate: z.string().describe('분석 종료 날짜 (YYYY-MM-DD 형식)'),
  segment: z.string().optional().describe('세그먼트 필터 (country, platform, artist)'),
  segmentValue: z.string().optional().describe('세그먼트 값'),
  aggregation: z.enum(['daily', 'weekly', 'monthly']).default('daily').describe('집계 단위'),
})

/**
 * 이상치 탐지 도구 스키마
 */
export const AnomalyDetectionSchema = z.object({
  metric: z.enum(['gmv', 'orders', 'aov', 'customers']).describe('분석할 지표'),
  period: z.enum(['7d', '30d', '90d']).default('30d').describe('분석 기간'),
  sensitivity: z.enum(['low', 'medium', 'high']).default('medium').describe('민감도'),
})

/**
 * 고객 세그먼트 분석 도구 스키마
 */
export const CustomerSegmentSchema = z.object({
  analysisType: z.enum(['rfm', 'cohort', 'clv']).describe('분석 유형'),
  period: z.enum(['30d', '90d', '180d', '365d']).default('90d').describe('분석 기간'),
})

/**
 * 예측 도구 스키마
 */
export const ForecastSchema = z.object({
  metric: z.enum(['gmv', 'orders', 'customers']).default('gmv').describe('예측할 지표'),
  forecastDays: z.number().min(7).max(90).default(30).describe('예측 일수'),
  includeConfidenceInterval: z.boolean().default(true).describe('신뢰 구간 포함 여부'),
})

/**
 * 파레토 분석 도구 스키마
 */
export const ParetoAnalysisSchema = z.object({
  dimension: z.enum(['artist', 'product', 'customer', 'country']).describe('분석 차원'),
  metric: z.enum(['gmv', 'orders']).default('gmv').describe('분석 지표'),
  period: z.enum(['30d', '90d', '180d']).default('90d').describe('분석 기간'),
})

/**
 * 기간 비교 도구 스키마
 */
export const PeriodComparisonSchema = z.object({
  period1Start: z.string().describe('첫 번째 기간 시작일'),
  period1End: z.string().describe('첫 번째 기간 종료일'),
  period2Start: z.string().describe('두 번째 기간 시작일'),
  period2End: z.string().describe('두 번째 기간 종료일'),
  metrics: z.array(z.string()).default(['gmv', 'orders', 'customers']).describe('비교할 지표들'),
})

/**
 * 상관관계 분석 도구 스키마
 */
export const CorrelationAnalysisSchema = z.object({
  variables: z.array(z.string()).min(2).describe('분석할 변수들'),
  period: z.enum(['30d', '90d', '180d']).default('90d').describe('분석 기간'),
})

/**
 * What-if 시뮬레이션 도구 스키마
 */
export const WhatIfSimulationSchema = z.object({
  scenario: z.enum(['price_change', 'marketing_budget', 'new_category', 'churn_prevention']).describe('시나리오 유형'),
  parameters: z.record(z.number()).describe('시나리오 파라미터'),
})

// ==================== 도구 타입 정의 ====================

export type RevenueTrendInput = z.infer<typeof RevenueTrendSchema>
export type AnomalyDetectionInput = z.infer<typeof AnomalyDetectionSchema>
export type CustomerSegmentInput = z.infer<typeof CustomerSegmentSchema>
export type ForecastInput = z.infer<typeof ForecastSchema>
export type ParetoAnalysisInput = z.infer<typeof ParetoAnalysisSchema>
export type PeriodComparisonInput = z.infer<typeof PeriodComparisonSchema>
export type CorrelationAnalysisInput = z.infer<typeof CorrelationAnalysisSchema>
export type WhatIfSimulationInput = z.infer<typeof WhatIfSimulationSchema>

// ==================== 도구 정의 ====================

export interface ToolDefinition {
  name: string
  description: string
  schema: z.ZodType<any>
}

export const ANALYSIS_TOOLS: ToolDefinition[] = [
  {
    name: 'analyze_revenue_trend',
    description: '특정 기간의 매출 트렌드를 분석합니다. 일별, 주별, 월별 집계와 세그먼트 필터링을 지원합니다.',
    schema: RevenueTrendSchema,
  },
  {
    name: 'detect_anomalies',
    description: '지정된 지표에서 이상치를 탐지합니다. Z-score와 IQR 방법을 사용하여 비정상적인 패턴을 찾습니다.',
    schema: AnomalyDetectionSchema,
  },
  {
    name: 'analyze_customer_segment',
    description: '고객 세그먼트 분석을 수행합니다. RFM 분석, 코호트 분석, 고객 생애 가치(CLV) 분석을 지원합니다.',
    schema: CustomerSegmentSchema,
  },
  {
    name: 'forecast_metrics',
    description: '지정된 지표의 미래 값을 예측합니다. 앙상블 모델을 사용하여 신뢰 구간과 함께 예측 결과를 제공합니다.',
    schema: ForecastSchema,
  },
  {
    name: 'analyze_pareto',
    description: '파레토 분석(80/20 법칙)을 수행합니다. 매출 기여도가 높은 상위 항목을 식별합니다.',
    schema: ParetoAnalysisSchema,
  },
  {
    name: 'compare_periods',
    description: '두 기간의 성과를 비교 분석합니다. 주요 지표의 변화율과 원인을 분석합니다.',
    schema: PeriodComparisonSchema,
  },
  {
    name: 'analyze_correlation',
    description: '변수 간 상관관계를 분석합니다. 피어슨 상관계수와 유의성 검정 결과를 제공합니다.',
    schema: CorrelationAnalysisSchema,
  },
  {
    name: 'run_whatif_simulation',
    description: 'What-if 시뮬레이션을 실행합니다. 가격 변경, 마케팅 예산 조정 등의 시나리오를 분석합니다.',
    schema: WhatIfSimulationSchema,
  },
]

// ==================== 도구 실행 결과 타입 ====================

export interface ToolResult {
  success: boolean
  data?: any
  error?: string
  metadata?: {
    executionTime: number
    dataPoints: number
    confidence?: number
  }
}

// ==================== 유틸리티 함수 ====================

/**
 * 도구 이름으로 도구 정의 찾기
 */
export function findToolByName(name: string): ToolDefinition | undefined {
  return ANALYSIS_TOOLS.find(tool => tool.name === name)
}

/**
 * 도구 입력 유효성 검사
 */
export function validateToolInput(toolName: string, input: unknown): { valid: boolean; error?: string } {
  const tool = findToolByName(toolName)
  if (!tool) {
    return { valid: false, error: `알 수 없는 도구: ${toolName}` }
  }

  try {
    tool.schema.parse(input)
    return { valid: true }
  } catch (error: any) {
    return { valid: false, error: error.message }
  }
}

/**
 * 도구 목록을 LLM 프롬프트용 문자열로 변환
 */
export function getToolsDescription(): string {
  return ANALYSIS_TOOLS.map(tool => 
    `- ${tool.name}: ${tool.description}`
  ).join('\n')
}

