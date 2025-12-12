/**
 * PDF 리포트 생성 서비스
 * Business Brain 분석 결과를 PDF로 변환
 */

import { BusinessBrainAgent } from '../agents/BusinessBrainAgent'
import { DataProcessor } from './DataProcessor'

export interface ReportOptions {
  period: '7d' | '30d' | '90d' | '180d' | '365d'
  sections: Array<
    | 'overview'
    | 'health-score'
    | 'insights'
    | 'trends'
    | 'rfm'
    | 'churn'
    | 'artist-health'
    | 'recommendations'
  >
  includeCharts?: boolean
  format?: 'pdf' | 'html'
}

export interface ReportData {
  title: string
  generatedAt: string
  period: string
  sections: Array<{
    title: string
    content: string
    charts?: Array<{
      type: string
      data: any
      title: string
    }>
  }>
  summary: {
    totalGmv: number
    totalOrders: number
    totalCustomers: number
    healthScore: number
    topInsights: Array<{
      title: string
      priority: string
      impact: string
    }>
  }
}

export class ReportGenerator {
  private agent: BusinessBrainAgent

  constructor() {
    this.agent = new BusinessBrainAgent()
  }

  /**
   * 리포트 데이터 생성
   */
  async generateReportData(options: ReportOptions): Promise<ReportData> {
    const dateRange = DataProcessor.getDateRangeFromPreset(options.period)
    const sections: ReportData['sections'] = []

    // 개요 섹션
    if (options.sections.includes('overview')) {
      const briefing = await this.agent.generateExecutiveBriefing(options.period)
      sections.push({
        title: '경영 브리핑',
        content: briefing.summary || '',
      })
    }

    // 건강도 점수
    if (options.sections.includes('health-score')) {
      const healthScore = await this.agent.calculateHealthScore(options.period)
      sections.push({
        title: '비즈니스 건강도',
        content: this.formatHealthScore(healthScore),
      })
    }

    // 인사이트
    if (options.sections.includes('insights')) {
      const insights = await this.agent.discoverInsights()
      sections.push({
        title: '주요 인사이트',
        content: this.formatInsights(insights),
      })
    }

    // 트렌드
    if (options.sections.includes('trends')) {
      const trends = await this.agent.analyzeLongTermTrends(options.period)
      sections.push({
        title: '장기 트렌드',
        content: this.formatTrends(trends),
      })
    }

    // RFM 분석
    if (options.sections.includes('rfm')) {
      const rfm = await this.agent.runRFMAnalysis()
      sections.push({
        title: 'RFM 세분화 분석',
        content: this.formatRFM(rfm),
      })
    }

    // 이탈 예측
    if (options.sections.includes('churn')) {
      // ChurnPredictor는 별도로 호출 필요
      sections.push({
        title: '고객 이탈 예측',
        content: '이탈 예측 데이터는 별도 분석이 필요합니다.',
      })
    }

    // 작가 건강도
    if (options.sections.includes('artist-health')) {
      sections.push({
        title: '작가 건강도',
        content: '작가 건강도 데이터는 별도 분석이 필요합니다.',
      })
    }

    // 권장사항
    if (options.sections.includes('recommendations')) {
      const actionProposals = await this.agent.generateActionProposals(options.period)
      sections.push({
        title: '액션 제안',
        content: this.formatActionProposals(actionProposals),
      })
    }

    // 요약 생성
    const comprehensive = await this.agent.runComprehensiveAnalysis(options.period)
    const healthScore = await this.agent.calculateHealthScore(options.period)
    const insights = await this.agent.discoverInsights()
    const summary = {
      totalGmv: comprehensive.summary?.gmv || 0,
      totalOrders: comprehensive.summary?.orders || 0,
      totalCustomers: comprehensive.summary?.customers || 0,
      healthScore: healthScore.overall || 0,
      topInsights: insights
        .slice(0, 5)
        .map((i: any) => ({
          title: i.title,
          priority: i.type || 'medium',
          impact: i.description || '',
        })),
    }

    return {
      title: `Business Brain 리포트 - ${this.getPeriodLabel(options.period)}`,
      generatedAt: new Date().toISOString(),
      period: this.getPeriodLabel(options.period),
      sections,
      summary,
    }
  }

  /**
   * HTML 리포트 생성
   */
  async generateHTMLReport(options: ReportOptions): Promise<string> {
    const data = await this.generateReportData(options)

    const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      border-radius: 10px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
    }
    .header .meta {
      margin-top: 10px;
      opacity: 0.9;
      font-size: 14px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .summary-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .summary-card h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #666;
      text-transform: uppercase;
    }
    .summary-card .value {
      font-size: 28px;
      font-weight: bold;
      color: #667eea;
    }
    .section {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }
    .section h2 {
      margin: 0 0 20px 0;
      font-size: 24px;
      color: #333;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
    }
    .section-content {
      white-space: pre-wrap;
      line-height: 1.8;
    }
    .insight-item {
      padding: 15px;
      margin: 10px 0;
      border-left: 4px solid #667eea;
      background: #f8f9fa;
      border-radius: 4px;
    }
    .insight-item.high {
      border-left-color: #dc3545;
    }
    .insight-item.medium {
      border-left-color: #ffc107;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${data.title}</h1>
    <div class="meta">
      생성일: ${new Date(data.generatedAt).toLocaleString('ko-KR')} | 기간: ${data.period}
    </div>
  </div>

  <div class="summary">
    <div class="summary-card">
      <h3>총 GMV</h3>
      <div class="value">₩${Math.round(data.summary.totalGmv).toLocaleString()}</div>
    </div>
    <div class="summary-card">
      <h3>총 주문</h3>
      <div class="value">${data.summary.totalOrders.toLocaleString()}건</div>
    </div>
    <div class="summary-card">
      <h3>총 고객</h3>
      <div class="value">${data.summary.totalCustomers.toLocaleString()}명</div>
    </div>
    <div class="summary-card">
      <h3>건강도 점수</h3>
      <div class="value">${data.summary.healthScore.toFixed(0)}점</div>
    </div>
  </div>

  ${data.sections
    .map(
      (section) => `
    <div class="section">
      <h2>${section.title}</h2>
      <div class="section-content">${section.content}</div>
    </div>
  `
    )
    .join('')}

  ${data.summary.topInsights.length > 0 ? `
    <div class="section">
      <h2>주요 인사이트 요약</h2>
      ${data.summary.topInsights
        .map(
          (insight) => `
        <div class="insight-item ${insight.priority}">
          <strong>${insight.title}</strong>
          <p>${insight.impact}</p>
        </div>
      `
        )
        .join('')}
    </div>
  ` : ''}

  <div class="footer">
    <p>이 리포트는 Business Brain 시스템에서 자동 생성되었습니다.</p>
    <p>© ${new Date().getFullYear()} Idus Global Business Hub</p>
  </div>
</body>
</html>
    `.trim()

    return html
  }

  /**
   * 건강도 점수 포맷팅
   */
  private formatHealthScore(healthScore: any): string {
    return `
전체 건강도: ${healthScore.overall.toFixed(1)}점

차원별 건강도:
- 매출 건강도: ${healthScore.dimensions?.revenue?.score?.toFixed(1) || 0}점
- 고객 건강도: ${healthScore.dimensions?.customer?.score?.toFixed(1) || 0}점
- 작가 건강도: ${healthScore.dimensions?.artist?.score?.toFixed(1) || 0}점
- 운영 건강도: ${healthScore.dimensions?.operations?.score?.toFixed(1) || 0}점
    `.trim()
  }

  /**
   * 인사이트 포맷팅
   */
  private formatInsights(insights: any[]): string {
    if (!insights || insights.length === 0) {
      return '발견된 인사이트가 없습니다.'
    }

    return insights
      .slice(0, 10)
      .map(
        (insight, idx) => `
${idx + 1}. [${insight.priority || 'medium'}] ${insight.title}
   ${insight.description || ''}
   우선순위 점수: ${insight.totalScore?.toFixed(1) || 'N/A'}
    `.trim()
      )
      .join('\n\n')
  }

  /**
   * 트렌드 포맷팅
   */
  private formatTrends(trends: any): string {
    if (!trends || !trends.trends) {
      return '트렌드 데이터가 없습니다.'
    }

    return trends.trends
      .slice(0, 5)
      .map(
        (trend: any) => `
${trend.metric}: ${trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} ${trend.magnitude}%
${trend.description || ''}
    `.trim()
      )
      .join('\n\n')
  }

  /**
   * RFM 분석 포맷팅
   */
  private formatRFM(rfm: any): string {
    if (!rfm || !rfm.segments) {
      return 'RFM 분석 데이터가 없습니다.'
    }

    return `
총 고객 수: ${rfm.totalCustomers || 0}명

세그먼트별 분포:
${Object.entries(rfm.segments || {})
  .map(([segment, data]: [string, any]) => `- ${segment}: ${data.count || 0}명 (${((data.count / (rfm.totalCustomers || 1)) * 100).toFixed(1)}%)`)
  .join('\n')}
    `.trim()
  }

  /**
   * 액션 제안 포맷팅
   */
  private formatActionProposals(actionProposals: any): string {
    if (!actionProposals || !actionProposals.prioritizedActions) {
      return '액션 제안이 없습니다.'
    }

    return actionProposals.prioritizedActions
      .slice(0, 10)
      .map(
        (action: any, idx: number) => `
${idx + 1}. [${action.priority}] ${action.title}
   ${action.description || ''}
   예상 효과: ${action.expectedImpact?.improvement || 0}% 개선
   기간: ${action.timeline || '미정'}
    `.trim()
      )
      .join('\n\n')
  }

  /**
   * 기간 레이블
   */
  private getPeriodLabel(period: string): string {
    const labels: Record<string, string> = {
      '7d': '최근 7일',
      '30d': '최근 30일',
      '90d': '최근 90일',
      '180d': '최근 180일',
      '365d': '최근 365일',
    }
    return labels[period] || period
  }
}

