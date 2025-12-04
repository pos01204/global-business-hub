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
}

// ==================== 컨텍스트 ====================
export interface BusinessContext {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  totalArtists: number
  period: { start: Date; end: Date }
}
