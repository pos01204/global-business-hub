/**
 * QueryParser - 자연어 쿼리 파서
 * 사용자의 자연어 질문을 분석하여 의도와 파라미터를 추출
 */

import { z } from 'zod'

// ==================== 쿼리 의도 정의 ====================

export type QueryIntent = 
  | 'revenue_analysis'      // 매출 분석
  | 'customer_analysis'     // 고객 분석
  | 'trend_analysis'        // 트렌드 분석
  | 'anomaly_detection'     // 이상치 탐지
  | 'forecast'              // 예측
  | 'comparison'            // 비교 분석
  | 'pareto_analysis'       // 파레토 분석
  | 'correlation_analysis'  // 상관관계 분석
  | 'simulation'            // 시뮬레이션
  | 'health_check'          // 건강도 점검
  | 'briefing'              // 브리핑
  | 'general'               // 일반 질문

// ==================== 쿼리 파싱 결과 ====================

export interface ParsedQuery {
  intent: QueryIntent
  confidence: number
  entities: {
    period?: string
    startDate?: string
    endDate?: string
    metric?: string
    segment?: string
    segmentValue?: string
    comparison?: {
      type: 'period' | 'segment'
      values: string[]
    }
  }
  suggestedTools: string[]
  originalQuery: string
}

// ==================== 키워드 매핑 ====================

const INTENT_KEYWORDS: Record<QueryIntent, string[]> = {
  revenue_analysis: [
    '매출', '수익', '수입', 'gmv', 'revenue', 'sales', '판매', '실적',
    '얼마', '금액', '총액', '합계', '매출액'
  ],
  customer_analysis: [
    '고객', '사용자', '유저', 'customer', 'user', '회원',
    'rfm', '세그먼트', '코호트', 'cohort', 'clv', '생애가치',
    '이탈', 'churn', '리텐션', 'retention'
  ],
  trend_analysis: [
    '트렌드', '추세', '추이', '변화', 'trend', '동향', '흐름',
    '증가', '감소', '성장', '하락', '상승'
  ],
  anomaly_detection: [
    '이상', '비정상', '특이', 'anomaly', '급등', '급락',
    '이상치', '문제', '경고', '알림'
  ],
  forecast: [
    '예측', '전망', '예상', 'forecast', 'predict', '미래',
    '앞으로', '다음', '될까', '어떻게 될'
  ],
  comparison: [
    '비교', '대비', '차이', 'compare', 'vs', '와', '과',
    '전월', '전년', '지난달', '작년', '이전'
  ],
  pareto_analysis: [
    '파레토', 'pareto', '80/20', '상위', '탑', 'top',
    '집중', '기여', '비중'
  ],
  correlation_analysis: [
    '상관', '관계', '연관', 'correlation', '영향', '관련',
    '따라', '함께', '연결'
  ],
  simulation: [
    '시뮬레이션', 'simulation', 'what-if', '가정', '만약',
    '~면', '~하면', '변경', '조정'
  ],
  health_check: [
    '건강', 'health', '상태', '점검', '진단', '체크',
    '현황', '요약'
  ],
  briefing: [
    '브리핑', 'briefing', '요약', '정리', '리포트', 'report',
    '보고', '현황'
  ],
  general: []
}

const PERIOD_PATTERNS: Record<string, string> = {
  '오늘': '1d',
  '어제': '1d',
  '이번 주': '7d',
  '지난 주': '7d',
  '이번 달': '30d',
  '지난 달': '30d',
  '이번 분기': '90d',
  '지난 분기': '90d',
  '올해': '365d',
  '작년': '365d',
  '최근 7일': '7d',
  '최근 일주일': '7d',
  '최근 30일': '30d',
  '최근 한달': '30d',
  '최근 90일': '90d',
  '최근 3개월': '90d',
  '최근 180일': '180d',
  '최근 6개월': '180d',
  '최근 1년': '365d',
}

const METRIC_KEYWORDS: Record<string, string> = {
  '매출': 'gmv',
  'gmv': 'gmv',
  '수익': 'gmv',
  '주문': 'orders',
  '주문수': 'orders',
  '주문 수': 'orders',
  '고객': 'customers',
  '고객수': 'customers',
  '고객 수': 'customers',
  '평균 주문액': 'aov',
  '객단가': 'aov',
  'aov': 'aov',
}

const SEGMENT_KEYWORDS: Record<string, string> = {
  '국가': 'country',
  '나라': 'country',
  '플랫폼': 'platform',
  '작가': 'artist',
  '아티스트': 'artist',
  '카테고리': 'category',
}

// ==================== QueryParser 클래스 ====================

export class QueryParser {
  /**
   * 자연어 쿼리 파싱
   */
  parse(query: string): ParsedQuery {
    const lowerQuery = query.toLowerCase()
    
    // 의도 분류
    const { intent, confidence } = this.classifyIntent(lowerQuery)
    
    // 엔티티 추출
    const entities = this.extractEntities(query, lowerQuery)
    
    // 추천 도구 결정
    const suggestedTools = this.suggestTools(intent, entities)
    
    return {
      intent,
      confidence,
      entities,
      suggestedTools,
      originalQuery: query,
    }
  }

  /**
   * 의도 분류
   */
  private classifyIntent(query: string): { intent: QueryIntent; confidence: number } {
    const scores: Record<QueryIntent, number> = {
      revenue_analysis: 0,
      customer_analysis: 0,
      trend_analysis: 0,
      anomaly_detection: 0,
      forecast: 0,
      comparison: 0,
      pareto_analysis: 0,
      correlation_analysis: 0,
      simulation: 0,
      health_check: 0,
      briefing: 0,
      general: 0,
    }

    // 키워드 매칭으로 점수 계산
    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
      for (const keyword of keywords) {
        if (query.includes(keyword)) {
          scores[intent as QueryIntent] += 1
        }
      }
    }

    // 최고 점수 의도 찾기
    let maxScore = 0
    let maxIntent: QueryIntent = 'general'
    
    for (const [intent, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score
        maxIntent = intent as QueryIntent
      }
    }

    // 신뢰도 계산 (0-1 사이)
    const totalKeywords = Object.values(INTENT_KEYWORDS).flat().length
    const confidence = maxScore > 0 ? Math.min(maxScore / 3, 1) : 0.3

    return { intent: maxIntent, confidence }
  }

  /**
   * 엔티티 추출
   */
  private extractEntities(query: string, lowerQuery: string): ParsedQuery['entities'] {
    const entities: ParsedQuery['entities'] = {}

    // 기간 추출
    for (const [pattern, period] of Object.entries(PERIOD_PATTERNS)) {
      if (lowerQuery.includes(pattern)) {
        entities.period = period
        break
      }
    }

    // 날짜 추출 (YYYY-MM-DD 형식)
    const datePattern = /(\d{4}-\d{2}-\d{2})/g
    const dates = query.match(datePattern)
    if (dates && dates.length >= 2) {
      entities.startDate = dates[0]
      entities.endDate = dates[1]
    } else if (dates && dates.length === 1) {
      entities.startDate = dates[0]
    }

    // 지표 추출
    for (const [keyword, metric] of Object.entries(METRIC_KEYWORDS)) {
      if (lowerQuery.includes(keyword)) {
        entities.metric = metric
        break
      }
    }

    // 세그먼트 추출
    for (const [keyword, segment] of Object.entries(SEGMENT_KEYWORDS)) {
      if (lowerQuery.includes(keyword)) {
        entities.segment = segment
        break
      }
    }

    // 비교 패턴 감지
    if (lowerQuery.includes('비교') || lowerQuery.includes('대비') || lowerQuery.includes('vs')) {
      // 기간 비교 패턴
      if (lowerQuery.includes('전월') || lowerQuery.includes('전년') || lowerQuery.includes('지난')) {
        entities.comparison = {
          type: 'period',
          values: ['current', 'previous']
        }
      }
    }

    return entities
  }

  /**
   * 추천 도구 결정
   */
  private suggestTools(intent: QueryIntent, entities: ParsedQuery['entities']): string[] {
    const toolMap: Record<QueryIntent, string[]> = {
      revenue_analysis: ['analyze_revenue_trend'],
      customer_analysis: ['analyze_customer_segment'],
      trend_analysis: ['analyze_revenue_trend', 'forecast_metrics'],
      anomaly_detection: ['detect_anomalies'],
      forecast: ['forecast_metrics'],
      comparison: ['compare_periods'],
      pareto_analysis: ['analyze_pareto'],
      correlation_analysis: ['analyze_correlation'],
      simulation: ['run_whatif_simulation'],
      health_check: ['analyze_revenue_trend', 'detect_anomalies'],
      briefing: ['analyze_revenue_trend', 'detect_anomalies', 'analyze_customer_segment'],
      general: [],
    }

    return toolMap[intent] || []
  }

  /**
   * 쿼리에서 날짜 범위 계산
   */
  calculateDateRange(entities: ParsedQuery['entities']): { startDate: string; endDate: string } {
    const now = new Date()
    const endDate = now.toISOString().split('T')[0]
    
    if (entities.startDate && entities.endDate) {
      return { startDate: entities.startDate, endDate: entities.endDate }
    }

    // 기간 문자열에서 일수 추출
    const period = entities.period || '30d'
    const days = parseInt(period.replace('d', ''), 10)
    
    const startDateObj = new Date(now)
    startDateObj.setDate(startDateObj.getDate() - days)
    const startDate = startDateObj.toISOString().split('T')[0]

    return { startDate, endDate }
  }
}

// 싱글톤 인스턴스
export const queryParser = new QueryParser()

