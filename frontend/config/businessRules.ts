// frontend/config/businessRules.ts
// ⚠️ 이 파일의 값은 backend/src/config/businessRules.ts와 동기화되어야 합니다

/**
 * 고객 활동 상태 기준 (일 수)
 * @description 고객 세그먼트 분류에 사용
 */
export const CUSTOMER_ACTIVITY_THRESHOLDS = {
  /** 활성 고객: 90일 이내 구매 */
  ACTIVE_DAYS: 90,
  /** 비활성 고객: 91~180일 내 구매 */
  INACTIVE_DAYS: 180,
  /** 이탈 위험 고객: 181일 이상 미구매 */
  CHURN_RISK_DAYS: 181,
} as const

/**
 * 고객 활동 상태 라벨
 */
export const CUSTOMER_ACTIVITY_LABELS = {
  ACTIVE: '활성',
  INACTIVE: '비활성',
  CHURN_RISK: '이탈 위험',
  CHURNED: '이탈',
} as const

/**
 * 물류 위험 기준일 (단계별)
 * @description Control Tower 위험 주문 식별에 사용
 */
export const LOGISTICS_CRITICAL_DAYS = {
  /** 미입고 */
  unreceived: 7,
  /** 작가 발송 */
  artistShipping: 5,
  /** 검수 대기 */
  awaitingInspection: 2,
  /** 검수 완료 */
  inspectionComplete: 3,
  /** 해외 배송 */
  internationalShipping: 14,
} as const

/**
 * 물류 단계 라벨
 */
export const LOGISTICS_STAGE_LABELS = {
  unreceived: '미입고',
  artistShipping: '작가 발송',
  awaitingInspection: '검수 대기',
  inspectionComplete: '검수 완료',
  internationalShipping: '해외 배송',
} as const

/**
 * RFM 세그먼트 기준
 * @description RFM 분석 점수 산정에 사용
 */
export const RFM_THRESHOLDS = {
  /** Recency (최근성) 기준 - 일 수 */
  RECENCY: {
    /** 높음: 30일 이내 */
    HIGH: 30,
    /** 중간: 31~90일 */
    MEDIUM: 90,
    /** 낮음: 91일 이상 */
    LOW: 91,
  },
  /** Frequency (빈도) 기준 - 구매 횟수 */
  FREQUENCY: {
    /** 높음: 5회 이상 */
    HIGH: 5,
    /** 중간: 2~4회 */
    MEDIUM: 2,
    /** 낮음: 1회 */
    LOW: 1,
  },
  /** Monetary (금액) 기준 - KRW */
  MONETARY: {
    /** 높음: 50만원 이상 */
    HIGH: 500000,
    /** 중간: 10~50만원 */
    MEDIUM: 100000,
    /** 낮음: 10만원 미만 */
    LOW: 0,
  },
} as const

/**
 * RFM 세그먼트 정의
 */
export const RFM_SEGMENTS = {
  CHAMPIONS: { label: 'Champions', color: '#22c55e', description: '최근 구매, 자주 구매, 고액 구매' },
  LOYAL_CUSTOMERS: { label: 'Loyal Customers', color: '#3b82f6', description: '자주 구매하는 충성 고객' },
  POTENTIAL_LOYALISTS: { label: 'Potential Loyalists', color: '#8b5cf6', description: '최근 구매, 성장 가능성' },
  NEW_CUSTOMERS: { label: 'New Customers', color: '#06b6d4', description: '최근 첫 구매 고객' },
  PROMISING: { label: 'Promising', color: '#14b8a6', description: '최근 구매, 빈도 낮음' },
  NEED_ATTENTION: { label: 'Need Attention', color: '#f59e0b', description: '평균 이상이었으나 최근 활동 감소' },
  ABOUT_TO_SLEEP: { label: 'About to Sleep', color: '#f97316', description: '평균 이하, 곧 이탈 위험' },
  AT_RISK: { label: 'At Risk', color: '#ef4444', description: '자주 구매했으나 오랜 기간 미구매' },
  CANT_LOSE: { label: "Can't Lose", color: '#dc2626', description: '고액 구매자였으나 이탈 위험' },
  HIBERNATING: { label: 'Hibernating', color: '#6b7280', description: '오랜 기간 미구매, 저빈도' },
  LOST: { label: 'Lost', color: '#374151', description: '완전 이탈 고객' },
} as const

/**
 * NPS 계산 기준 (5점 만점 기준)
 * @description 리뷰 분석 NPS 계산에 사용
 */
export const NPS_THRESHOLDS = {
  /** Promoter: 5점 */
  PROMOTER_MIN: 5,
  /** Passive: 4점 */
  PASSIVE_MIN: 4,
  /** Detractor: 1~3점 */
  DETRACTOR_MAX: 3,
} as const

/**
 * NPS 라벨 및 색상
 */
export const NPS_LABELS = {
  PROMOTER: { label: 'Promoter', color: '#22c55e', description: '추천 고객 (5점)' },
  PASSIVE: { label: 'Passive', color: '#f59e0b', description: '중립 고객 (4점)' },
  DETRACTOR: { label: 'Detractor', color: '#ef4444', description: '비추천 고객 (1~3점)' },
} as const

/**
 * 쿠폰 분석 기준
 * @description 쿠폰 효과 분석에 사용
 */
export const COUPON_THRESHOLDS = {
  /** 저전환율 기준: 1% 미만 */
  LOW_CONVERSION_RATE: 0.01,
  /** 고효율 ROI 기준: 10배 이상 */
  HIGH_ROI: 10,
  /** 실패 쿠폰 기준: 0% 전환율 */
  FAILED_CONVERSION_RATE: 0,
} as const

/**
 * 쿠폰 유형 라벨
 */
export const COUPON_TYPE_LABELS = {
  RATE: '정률 할인 (%)',
  FIXED: '정액 할인 ($)',
} as const

/**
 * 쿠폰 소스 라벨
 */
export const COUPON_SOURCE_LABELS = {
  idus: 'idus 쿠폰',
  CRM: 'CRM 쿠폰',
  Sodam: 'Sodam 쿠폰',
} as const

/**
 * 국가 라벨
 */
export const COUNTRY_LABELS = {
  JP: '일본',
  EN: '영어권',
  KR: '한국',
} as const

/**
 * 기간 프리셋
 */
export const PERIOD_PRESETS = {
  '7d': { label: '최근 7일', days: 7 },
  '30d': { label: '최근 30일', days: 30 },
  '90d': { label: '최근 90일', days: 90 },
  '180d': { label: '최근 180일', days: 180 },
  '365d': { label: '최근 1년', days: 365 },
} as const

export type PeriodPreset = keyof typeof PERIOD_PRESETS

