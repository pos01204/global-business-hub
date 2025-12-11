/**
 * ExportService - 데이터 내보내기 서비스
 * v4.0: CSV/Excel 형식으로 분석 결과 내보내기
 */

import { BusinessBrainAgent } from '../agents/BusinessBrainAgent'
import { DataProcessor } from './DataProcessor'

export type ExportFormat = 'csv' | 'json'
export type ExportType = 
  | 'rfm-segments'
  | 'rfm-customers'
  | 'cohort-analysis'
  | 'pareto-artists'
  | 'pareto-countries'
  | 'anomaly-detection'
  | 'insights'
  | 'health-score'
  | 'trends'

interface ExportResult {
  data: string
  filename: string
  contentType: string
}

/**
 * CSV 이스케이프 처리
 */
function escapeCSV(value: any): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * 배열을 CSV 문자열로 변환
 */
function arrayToCSV(data: Record<string, any>[], headers?: string[]): string {
  if (data.length === 0) return ''
  
  const keys = headers || Object.keys(data[0])
  const headerRow = keys.map(escapeCSV).join(',')
  const dataRows = data.map(row => 
    keys.map(key => escapeCSV(row[key])).join(',')
  )
  
  return [headerRow, ...dataRows].join('\n')
}

/**
 * RFM 세그먼트 데이터 내보내기
 */
async function exportRFMSegments(period: string): Promise<ExportResult> {
  const agent = new BusinessBrainAgent()
  const rfmData = await agent.runRFMAnalysis()
  
  const segments = rfmData.segments.map(seg => ({
    '세그먼트': seg.segment,
    '고객수': seg.count,
    '비율(%)': (seg.percentage * 100).toFixed(1),
    '평균 최근성(일)': seg.avgRecency.toFixed(0),
    '평균 구매빈도': seg.avgFrequency.toFixed(1),
    '평균 구매금액(USD)': seg.avgMonetary.toFixed(2),
    '총 매출(USD)': seg.totalRevenue.toFixed(2)
  }))
  
  return {
    data: arrayToCSV(segments),
    filename: `rfm-segments-${period}-${new Date().toISOString().split('T')[0]}.csv`,
    contentType: 'text/csv; charset=utf-8'
  }
}

/**
 * RFM 고객 목록 내보내기
 */
async function exportRFMCustomers(period: string, segment?: string): Promise<ExportResult> {
  const agent = new BusinessBrainAgent()
  const rfmData = await agent.runRFMAnalysis()
  
  let customers = rfmData.customers || []
  if (segment) {
    customers = customers.filter((c: any) => c.segment === segment)
  }
  
  const exportData = customers.map((c: any) => ({
    '고객ID': c.customerId,
    '세그먼트': c.segment,
    '최근성(일)': c.recency,
    '구매빈도': c.frequency,
    '총구매금액(USD)': c.monetary?.toFixed(2) || '0',
    'R점수': c.rScore,
    'F점수': c.fScore,
    'M점수': c.mScore
  }))
  
  const segmentSuffix = segment ? `-${segment}` : ''
  return {
    data: arrayToCSV(exportData),
    filename: `rfm-customers${segmentSuffix}-${period}-${new Date().toISOString().split('T')[0]}.csv`,
    contentType: 'text/csv; charset=utf-8'
  }
}

/**
 * 이탈 위험 VIP 고객 내보내기
 */
async function exportAtRiskVIP(period: string): Promise<ExportResult> {
  const agent = new BusinessBrainAgent()
  const rfmData = await agent.runRFMAnalysis()
  
  const atRiskVIPs = rfmData.atRiskVIPs || []
  const exportData = atRiskVIPs.map((c: any) => ({
    '고객ID': c.customerId,
    '이전 세그먼트': 'VIP',
    '현재 상태': '이탈 위험',
    '최근성(일)': c.recency,
    '구매빈도': c.frequency,
    '총구매금액(USD)': c.monetary?.toFixed(2) || '0',
    '권장조치': '즉시 리텐션 캠페인 필요'
  }))
  
  return {
    data: arrayToCSV(exportData),
    filename: `at-risk-vip-${period}-${new Date().toISOString().split('T')[0]}.csv`,
    contentType: 'text/csv; charset=utf-8'
  }
}

/**
 * 코호트 분석 내보내기
 */
async function exportCohortAnalysis(period: string): Promise<ExportResult> {
  const agent = new BusinessBrainAgent()
  const cohortData = await agent.runCohortAnalysis()
  
  const cohorts = cohortData.cohorts || []
  const exportData = cohorts.map((c: any) => {
    const retention = c.retentionByMonth || []
    const retentionCols: Record<string, string> = {}
    retention.forEach((r: number, idx: number) => {
      retentionCols[`M${idx} 리텐션(%)`] = (r * 100).toFixed(1)
    })
    
    return {
      '코호트(월)': c.cohortMonth,
      '총 사용자': c.totalUsers,
      'LTV(USD)': c.ltv?.toFixed(2) || '0',
      '평균 주문수': c.avgOrdersPerUser?.toFixed(1) || '0',
      '첫구매까지(일)': c.avgDaysToFirstPurchase?.toFixed(0) || '-',
      ...retentionCols
    }
  })
  
  return {
    data: arrayToCSV(exportData),
    filename: `cohort-analysis-${period}-${new Date().toISOString().split('T')[0]}.csv`,
    contentType: 'text/csv; charset=utf-8'
  }
}

/**
 * 파레토 분석 (작가) 내보내기
 */
async function exportParetoArtists(period: string): Promise<ExportResult> {
  const agent = new BusinessBrainAgent()
  const paretoData = await agent.runParetoAnalysis()
  
  const artists = paretoData.artistConcentration?.top10Percent?.names || []
  const exportData = artists.map((name: string, idx: number) => ({
    '순위': idx + 1,
    '작가명': name,
    '구분': 'Top 10%'
  }))
  
  // 추가 통계
  exportData.push({
    '순위': 0,
    '작가명': '--- 통계 ---',
    '구분': '-'
  })
  exportData.push({
    '순위': 0,
    '작가명': `Top 10% 매출 비중: ${(paretoData.artistConcentration?.top10Percent?.revenueShare * 100 || 0).toFixed(1)}%`,
    '구분': '-'
  })
  exportData.push({
    '순위': 0,
    '작가명': `Top 20% 매출 비중: ${(paretoData.artistConcentration?.top20Percent?.revenueShare * 100 || 0).toFixed(1)}%`,
    '구분': '-'
  })
  exportData.push({
    '순위': 0,
    '작가명': `지니계수: ${paretoData.artistConcentration?.giniCoefficient?.toFixed(3) || '-'}`,
    '구분': '-'
  })
  
  return {
    data: arrayToCSV(exportData),
    filename: `pareto-artists-${period}-${new Date().toISOString().split('T')[0]}.csv`,
    contentType: 'text/csv; charset=utf-8'
  }
}

/**
 * 이상 탐지 내보내기
 */
async function exportAnomalyDetection(period: string): Promise<ExportResult> {
  const agent = new BusinessBrainAgent()
  const anomalyData = await agent.runAnomalyDetection('medium')
  
  const anomalies = anomalyData.anomalies || []
  const exportData = anomalies.map((a: any) => ({
    '날짜': a.date,
    '지표': a.metric,
    '실제값': a.actualValue?.toFixed(2) || '0',
    '예상값': a.expectedValue?.toFixed(2) || '0',
    '편차(σ)': a.deviation?.toFixed(2) || '0',
    '심각도': a.severity,
    '가능한 원인': (a.possibleCauses || []).join('; ')
  }))
  
  return {
    data: arrayToCSV(exportData),
    filename: `anomaly-detection-${period}-${new Date().toISOString().split('T')[0]}.csv`,
    contentType: 'text/csv; charset=utf-8'
  }
}

/**
 * 인사이트 내보내기
 */
async function exportInsights(): Promise<ExportResult> {
  const agent = new BusinessBrainAgent()
  const insights = await agent.discoverInsights()
  
  const exportData = insights.map((i: any) => ({
    '유형': i.type,
    '카테고리': i.category,
    '제목': i.title,
    '설명': i.description,
    '지표': i.metric,
    '현재값': i.currentValue?.toFixed(2) || '0',
    '비교값': i.comparisonValue?.toFixed(2) || '0',
    '편차(%)': i.deviationPercent?.toFixed(1) || '0',
    '권장조치': i.recommendation || '-',
    '우선순위': i.priority,
    '총점수': i.totalScore?.toFixed(2) || '0'
  }))
  
  return {
    data: arrayToCSV(exportData),
    filename: `insights-${new Date().toISOString().split('T')[0]}.csv`,
    contentType: 'text/csv; charset=utf-8'
  }
}

/**
 * 건강도 점수 내보내기
 */
async function exportHealthScore(period: string): Promise<ExportResult> {
  const agent = new BusinessBrainAgent()
  const healthScore = await agent.calculateHealthScore(period as any)
  
  const dimensions = healthScore.dimensions
  const exportData: Array<Record<string, string | number>> = [
    { '차원': '종합', '점수': healthScore.overall, '추세': '-', '변화': '-' },
    { '차원': '매출', '점수': dimensions.revenue.score, '추세': dimensions.revenue.trend, '변화': String(dimensions.revenue.change) },
    { '차원': '고객', '점수': dimensions.customer.score, '추세': dimensions.customer.trend, '변화': String(dimensions.customer.change) },
    { '차원': '작가', '점수': dimensions.artist.score, '추세': dimensions.artist.trend, '변화': String(dimensions.artist.change) },
    { '차원': '운영', '점수': dimensions.operations.score, '추세': dimensions.operations.trend, '변화': String(dimensions.operations.change) }
  ]
  
  // 요인별 상세
  exportData.push({ '차원': '--- 매출 요인 ---', '점수': 0, '추세': '-', '변화': '-' })
  for (const factor of dimensions.revenue.factors || []) {
    exportData.push({
      '차원': `  ${factor.name}`,
      '점수': factor.value,
      '추세': factor.status,
      '변화': String(factor.contribution)
    })
  }
  
  return {
    data: arrayToCSV(exportData),
    filename: `health-score-${period}-${new Date().toISOString().split('T')[0]}.csv`,
    contentType: 'text/csv; charset=utf-8'
  }
}

/**
 * 트렌드 분석 내보내기
 */
async function exportTrends(period: string): Promise<ExportResult> {
  const agent = new BusinessBrainAgent()
  const trends = await agent.analyzeLongTermTrends()
  
  const exportData = (trends.trends || []).map((t: any) => ({
    '지표': t.metric,
    '방향': t.direction,
    '크기': t.magnitude?.toFixed(2) || '0',
    '유의성': t.significance,
    '해석': t.implication
  }))
  
  return {
    data: arrayToCSV(exportData),
    filename: `trends-${period}-${new Date().toISOString().split('T')[0]}.csv`,
    contentType: 'text/csv; charset=utf-8'
  }
}

/**
 * 메인 내보내기 함수
 */
export async function exportData(
  type: ExportType,
  options: {
    period?: string
    segment?: string
    format?: ExportFormat
  } = {}
): Promise<ExportResult> {
  const period = options.period || '30d'
  
  switch (type) {
    case 'rfm-segments':
      return exportRFMSegments(period)
    case 'rfm-customers':
      return exportRFMCustomers(period, options.segment)
    case 'cohort-analysis':
      return exportCohortAnalysis(period)
    case 'pareto-artists':
      return exportParetoArtists(period)
    case 'anomaly-detection':
      return exportAnomalyDetection(period)
    case 'insights':
      return exportInsights()
    case 'health-score':
      return exportHealthScore(period)
    case 'trends':
      return exportTrends(period)
    default:
      throw new Error(`지원하지 않는 내보내기 유형: ${type}`)
  }
}

/**
 * 지원하는 내보내기 유형 목록
 */
export function getSupportedExportTypes(): { type: ExportType; label: string; description: string }[] {
  return [
    { type: 'rfm-segments', label: 'RFM 세그먼트', description: 'RFM 세그먼트별 통계' },
    { type: 'rfm-customers', label: 'RFM 고객 목록', description: '고객별 RFM 점수 및 세그먼트' },
    { type: 'cohort-analysis', label: '코호트 분석', description: '월별 코호트 리텐션 및 LTV' },
    { type: 'pareto-artists', label: '작가 파레토', description: '작가별 매출 집중도' },
    { type: 'anomaly-detection', label: '이상 탐지', description: '감지된 이상 항목' },
    { type: 'insights', label: '인사이트', description: '발견된 인사이트 목록' },
    { type: 'health-score', label: '건강도 점수', description: '비즈니스 건강도 상세' },
    { type: 'trends', label: '트렌드 분석', description: '장기 트렌드 분석 결과' }
  ]
}

export default {
  exportData,
  getSupportedExportTypes
}

