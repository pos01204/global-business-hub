/**
 * InsightActionMapper - 인사이트 → 액션 매핑 서비스
 * v4.0: 인사이트 유형별로 적절한 액션을 자동 매핑
 */

import { BusinessInsight, InsightAction, AffectedEntities, InsightCategory } from './types'

// 카테고리별 기본 액션 매핑
const CATEGORY_ACTION_MAP: Record<InsightCategory, InsightAction[]> = {
  revenue: [
    {
      id: 'view-revenue-detail',
      label: '매출 상세 보기',
      icon: '📊',
      type: 'navigate',
      href: '/business-brain',
      params: { tab: 'comprehensive' }
    },
    {
      id: 'download-revenue-data',
      label: '데이터 다운로드',
      icon: '📥',
      type: 'download',
      downloadType: 'excel',
      dataKey: 'revenue'
    }
  ],
  customer: [
    {
      id: 'view-rfm',
      label: 'RFM 분석 보기',
      icon: '👥',
      type: 'navigate',
      href: '/business-brain',
      params: { tab: 'rfm' }
    },
    {
      id: 'view-customer-list',
      label: '고객 목록',
      icon: '📋',
      type: 'navigate',
      href: '/customer-analytics'
    }
  ],
  artist: [
    {
      id: 'view-artist-detail',
      label: '작가 분석 보기',
      icon: '🎨',
      type: 'navigate',
      href: '/artist-analytics'
    },
    {
      id: 'view-pareto',
      label: '파레토 분석',
      icon: '📊',
      type: 'navigate',
      href: '/business-brain',
      params: { tab: 'pareto' }
    }
  ],
  operations: [
    {
      id: 'view-qc',
      label: 'QC 관리',
      icon: '✅',
      type: 'navigate',
      href: '/qc'
    },
    {
      id: 'view-logistics',
      label: '물류 현황',
      icon: '📦',
      type: 'navigate',
      href: '/dashboard'
    }
  ],
  geographic: [
    {
      id: 'view-country-analysis',
      label: '국가별 분석',
      icon: '🌍',
      type: 'navigate',
      href: '/business-brain',
      params: { tab: 'comprehensive' }
    }
  ],
  product: [
    {
      id: 'view-product-analysis',
      label: '상품 분석',
      icon: '🛍️',
      type: 'navigate',
      href: '/business-brain',
      params: { tab: 'pareto' }
    }
  ]
}

// 인사이트 유형별 특수 액션
const TYPE_SPECIAL_ACTIONS: Record<string, (insight: BusinessInsight) => InsightAction[]> = {
  // VIP 이탈 위험
  'vip-churn-risk': (insight) => [
    {
      id: 'issue-coupon',
      label: '쿠폰 발급하기',
      icon: '🎁',
      type: 'navigate',
      href: '/coupon-generator',
      params: { 
        targetSegment: 'at_risk_vip',
        preset: 'retention'
      }
    },
    {
      id: 'view-at-risk-vip',
      label: 'VIP 위험 고객 보기',
      icon: '⚠️',
      type: 'navigate',
      href: '/business-brain',
      params: { tab: 'rfm', filter: 'atRiskVIP' }
    }
  ],
  
  // 작가 집중도 위험
  'artist-concentration': (insight) => [
    {
      id: 'view-artist-pareto',
      label: '작가 집중도 분석',
      icon: '📊',
      type: 'navigate',
      href: '/business-brain',
      params: { tab: 'pareto' }
    },
    {
      id: 'view-new-artists',
      label: '신규 작가 발굴',
      icon: '🎨',
      type: 'navigate',
      href: '/artist-analytics',
      params: { filter: 'new' }
    }
  ],
  
  // 발송 지연
  'shipping-delay': (insight) => [
    {
      id: 'view-qc-delayed',
      label: '지연 건 확인',
      icon: '⏰',
      type: 'navigate',
      href: '/qc',
      params: { status: 'delayed' }
    },
    {
      id: 'view-logistics',
      label: '물류 파이프라인',
      icon: '📦',
      type: 'navigate',
      href: '/dashboard'
    }
  ],
  
  // 국가별 성장 기회
  'country-growth': (insight) => [
    {
      id: 'view-country-detail',
      label: '국가별 상세 분석',
      icon: '🌍',
      type: 'navigate',
      href: '/business-brain',
      params: { tab: 'comprehensive' }
    }
  ],
  
  // 재구매율 하락
  'repeat-rate-decline': (insight) => [
    {
      id: 'view-cohort',
      label: '코호트 분석',
      icon: '📈',
      type: 'navigate',
      href: '/business-brain',
      params: { tab: 'cohort' }
    },
    {
      id: 'view-at-risk',
      label: '이탈 위험 고객',
      icon: '⚠️',
      type: 'navigate',
      href: '/business-brain',
      params: { tab: 'rfm', filter: 'atRisk' }
    }
  ],

  // 매출 급증/급락
  'revenue-anomaly': (insight) => [
    {
      id: 'view-anomaly',
      label: '이상 탐지 상세',
      icon: '🔍',
      type: 'navigate',
      href: '/business-brain',
      params: { tab: 'anomaly' }
    },
    {
      id: 'view-trends',
      label: '트렌드 분석',
      icon: '📊',
      type: 'navigate',
      href: '/business-brain',
      params: { tab: 'trends' }
    }
  ]
}

/**
 * 인사이트 키워드 기반 액션 유형 감지
 */
function detectInsightType(insight: BusinessInsight): string | null {
  const titleLower = insight.title.toLowerCase()
  const descLower = insight.description.toLowerCase()
  const combined = `${titleLower} ${descLower}`
  
  // VIP 이탈 관련
  if (combined.includes('vip') && (combined.includes('이탈') || combined.includes('위험') || combined.includes('churn'))) {
    return 'vip-churn-risk'
  }
  
  // 작가 집중도
  if ((combined.includes('작가') || combined.includes('artist')) && 
      (combined.includes('집중') || combined.includes('의존') || combined.includes('concentration'))) {
    return 'artist-concentration'
  }
  
  // 발송 지연
  if (combined.includes('발송') && combined.includes('지연') || combined.includes('shipping') && combined.includes('delay')) {
    return 'shipping-delay'
  }
  
  // 국가별 성장
  if ((combined.includes('국가') || combined.includes('시장') || combined.includes('country')) && 
      (combined.includes('성장') || combined.includes('증가') || combined.includes('growth'))) {
    return 'country-growth'
  }
  
  // 재구매율
  if (combined.includes('재구매') || combined.includes('repeat') || combined.includes('리텐션') || combined.includes('retention')) {
    return 'repeat-rate-decline'
  }
  
  // 매출 이상
  if ((combined.includes('매출') || combined.includes('revenue') || combined.includes('gmv')) && 
      (combined.includes('급') || combined.includes('이상') || combined.includes('anomaly'))) {
    return 'revenue-anomaly'
  }
  
  return null
}

/**
 * 인사이트에 액션 매핑
 */
export function mapActionsToInsight(insight: BusinessInsight): BusinessInsight {
  const actions: InsightAction[] = []
  
  // 1. 특수 액션 매핑 (키워드 기반)
  const insightType = detectInsightType(insight)
  if (insightType && TYPE_SPECIAL_ACTIONS[insightType]) {
    actions.push(...TYPE_SPECIAL_ACTIONS[insightType](insight))
  }
  
  // 2. 카테고리별 기본 액션 추가 (중복 제거)
  const categoryActions = CATEGORY_ACTION_MAP[insight.category] || []
  for (const action of categoryActions) {
    if (!actions.find(a => a.id === action.id)) {
      actions.push(action)
    }
  }
  
  // 3. 공통 액션 추가 (최대 4개까지만)
  const commonActions: InsightAction[] = [
    {
      id: 'view-detail',
      label: '상세 보기',
      icon: '🔍',
      type: 'navigate',
      href: '/business-brain',
      params: { tab: 'insights', highlight: insight.id }
    }
  ]
  
  for (const action of commonActions) {
    if (!actions.find(a => a.id === action.id) && actions.length < 4) {
      actions.push(action)
    }
  }
  
  return {
    ...insight,
    actions: actions.slice(0, 4) // 최대 4개 액션
  }
}

/**
 * 여러 인사이트에 액션 일괄 매핑
 */
export function mapActionsToInsights(insights: BusinessInsight[]): BusinessInsight[] {
  return insights.map(mapActionsToInsight)
}

/**
 * 인사이트 유형에 따른 영향 대상 추출 (향후 구현)
 */
export function extractAffectedEntities(
  insight: BusinessInsight,
  data?: any
): AffectedEntities | undefined {
  // TODO: 실제 데이터 기반으로 영향 받는 엔티티 추출
  // 현재는 placeholder
  return undefined
}

export default {
  mapActionsToInsight,
  mapActionsToInsights,
  extractAffectedEntities
}

