/**
 * Business Brain 타입 정의
 */

// ==================== 건강도 점수 ====================
export interface BusinessHealthScore {
  overall: number
  calculatedAt: Date
  dimensions: {
    revenue: DimensionScore
    customer: DimensionScore
    artist: DimensionScore
    operations: DimensionScore
  }
}

export interface DimensionScore {
  score: number
  trend: 'up' | 'down' | 'stable'
  change: number
  factors: ScoreFactor[]
}

export interface ScoreFactor {
  name: string
  value: number
  contribution: number
  status: 'good' | 'warning' | 'critical'
}

// ==================== 인사이트 ====================
export interface BusinessInsight {
  id: string
  type: 'critical' | 'warning' | 'opportunity' | 'info'
  category: InsightCategory
  title: string
  description: string
  metric: string
  currentValue: number
  comparisonValue: number
  deviation: number
  deviationPercent: number
  evidence: InsightEvidence[]
  recommendation?: string
  actionLink?: string
  priority: number
  scores: InsightScores
  totalScore: number
  createdAt: Date
  expiresAt?: Date
  // v4.0 추가: 액션 연결
  actions?: InsightAction[]
  affectedEntities?: AffectedEntities
}

// ==================== 인사이트 액션 (v4.0) ====================
export interface InsightAction {
  id: string
  label: string
  icon: string
  type: 'navigate' | 'api_call' | 'download'
  // navigate 타입
  href?: string
  params?: Record<string, any>
  // api_call 타입
  endpoint?: string
  method?: 'GET' | 'POST'
  body?: any
  // download 타입
  downloadType?: 'csv' | 'excel'
  dataKey?: string
}

// ==================== 브리핑 입력 ====================
export interface BriefingInput {
  period: { start: string; end: string }
  metrics: {
    totalGmv: number
    gmvChange: number
    orderCount: number
    orderChange: number
    aov: number
    aovChange: number
    newCustomers: number
    repeatRate: number
  }
  healthScore: BusinessHealthScore
  insights: BusinessInsight[]
  anomalies: Array<{ metric: string; description: string }>
  trends: Array<{ metric: string; direction: string; magnitude: number }>
  topCountry?: { name: string; share: number }
  topArtist?: { name: string; revenue: number }
}

// ==================== 향상된 브리핑 입력 (v4.2) ====================
export interface SeasonalPattern {
  month: number
  avgChange: number
  historicalData: number[]
}

export interface StatisticalTestResult {
  metric: string
  isSignificant: boolean
  pValue: number
  effectSize: number
  interpretation: 'large' | 'medium' | 'small' | 'negligible'
}

export interface DataQualityScore {
  overall: number
  sampleSize: number
  missingRate: number
  completeness: number
  accuracy: number
  freshness: number
}

export interface EnhancedBriefingInput extends BriefingInput {
  // 비즈니스 컨텍스트
  businessContext: {
    businessAge: number // 비즈니스 운영 기간 (년)
    marketFocus: string[] // 주요 시장 (['JP', 'US', ...])
    serviceLaunch: Record<string, string> // 서비스 런칭 일자 { 'JP': '2025-03-01' }
    businessGoals: string[] // 현재 비즈니스 목표
  }
  // 역사적 컨텍스트
  historicalContext?: {
    previousPeriod?: BriefingInput // 전기 데이터
    yearOverYear?: BriefingInput // 전년 동기 데이터
    seasonalPatterns?: SeasonalPattern[] // 계절성 패턴
  }
  // 통계적 컨텍스트
  statisticalContext?: {
    significanceTests?: StatisticalTestResult[]
    confidenceIntervals?: Array<{
      metric: string
      interval: [number, number]
      level: number
    }>
    dataQuality?: DataQualityScore
  }
}

export interface AffectedEntities {
  type: 'customer' | 'artist' | 'product' | 'country'
  ids: string[]
  names: string[]
  count: number
}

export type InsightCategory = 
  | 'revenue' 
  | 'customer' 
  | 'artist' 
  | 'operations' 
  | 'geographic' 
  | 'product'

export interface InsightEvidence {
  metric: string
  value: number
  comparison: string
  change: number
}

export interface InsightScores {
  statisticalSignificance: number
  businessImpact: number
  actionability: number
  urgency: number
  confidence: number
}

// ==================== 큐브 분석 ====================
export interface CubeConfig {
  dimensions: CubeDimension[]
  metrics: CubeMetric[]
  minSampleSize: number
  deviationThreshold: number
}

export interface CubeDimension {
  name: string
  column: string
  values?: string[]
}

export interface CubeMetric {
  name: string
  column: string
  aggregation: 'sum' | 'avg' | 'count' | 'max' | 'min'
}

export interface CubeCell {
  dimensions: Record<string, string>
  metrics: Record<string, number>
  sampleSize: number
  benchmark: {
    overall: number
    parentSegment?: number
  }
  deviation: number
  deviationPercent: number
  isAnomaly: boolean
  anomalyType?: 'positive' | 'negative'
  insights?: string[]  // v4.1: 인사이트 자동 생성
}

export interface CubeAnalysisResult {
  config: CubeConfig
  totalCombinations: number
  analyzedCells: number
  cells: CubeCell[]
  anomalies: CubeCell[]
  topPositive: CubeCell[]
  topNegative: CubeCell[]
  executionTime: number
}

// ==================== 분해 분석 ====================
export interface DecompositionResult {
  period: {
    current: { start: Date; end: Date }
    previous: { start: Date; end: Date }
  }
  totalChange: number
  totalChangePercent: number
  decomposition: {
    volumeEffect: number
    valueEffect: number
    mixEffect: number
    bySegment: SegmentContribution[]
    topContributors: Contributor[]
  }
  explanation: string
}

export interface SegmentContribution {
  segment: string
  segmentValue: string
  contribution: number
  contributionPercent: number
  currentValue: number
  previousValue: number
  driver: 'volume' | 'value' | 'mix'
}

export interface Contributor {
  type: 'artist' | 'product' | 'customer' | 'country'
  name: string
  contribution: number
  contributionPercent: number
  isNew: boolean
}

// ==================== 경영 브리핑 ====================
export interface ExecutiveBriefing {
  generatedAt: Date
  period: { start: Date; end: Date }
  healthScore: BusinessHealthScore
  summary: string
  insights: BusinessInsight[]
  immediateActions: string[]
  weeklyFocus: string[]
  risks: string[]
  opportunities: string[]
  // v4.2: 브리핑 품질 검증 결과
  quality?: {
    specificity: number
    actionability: number
    dataBacking: number
    overall: number
    issues: string[]
  }
  confidence?: number
  usedLLM?: boolean
}

// ==================== 컨텍스트 ====================
export interface BusinessContext {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  totalArtists: number
  period: { start: Date; end: Date }
}
