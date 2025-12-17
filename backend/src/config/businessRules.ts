// backend/src/config/businessRules.ts
// ⚠️ 이 파일의 값은 frontend/config/businessRules.ts와 동기화되어야 합니다

/**
 * 고객 활동 상태 기준 (일 수)
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
 * 물류 위험 기준일 (단계별)
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
 * RFM 세그먼트 기준
 */
export const RFM_THRESHOLDS = {
  /** Recency (최근성) 기준 - 일 수 */
  RECENCY: {
    HIGH: 30,
    MEDIUM: 90,
    LOW: 91,
  },
  /** Frequency (빈도) 기준 - 구매 횟수 */
  FREQUENCY: {
    HIGH: 5,
    MEDIUM: 2,
    LOW: 1,
  },
  /** Monetary (금액) 기준 - KRW */
  MONETARY: {
    HIGH: 500000,
    MEDIUM: 100000,
    LOW: 0,
  },
} as const

/**
 * NPS 계산 기준 (5점 만점 기준)
 */
export const NPS_THRESHOLDS = {
  /** Promoter: 5점 */
  PROMOTER_MIN: 5,
  /** Passive: 4점 */
  PASSIVE_MIN: 4,
  /** Detractor: 1~3점 */
  DETRACTOR_MAX: 3,
  /** NPS 점수 해석 기준 */
  EXCELLENT: 50,
  GOOD: 0,
  NEEDS_IMPROVEMENT: -50,
} as const

/**
 * 쿠폰 분석 기준
 */
export const COUPON_THRESHOLDS = {
  /** 저전환율 기준: 5% 미만 */
  LOW_CONVERSION_RATE: 5,
  /** 고전환율 기준: 20% 이상 */
  HIGH_CONVERSION_RATE: 20,
  /** 저효율 ROI 기준: 2배 미만 */
  LOW_ROI: 2,
  /** 고효율 ROI 기준: 10배 이상 */
  HIGH_ROI: 10,
  /** 실패 쿠폰 기준: 0% 전환율 */
  FAILED_CONVERSION_RATE: 0,
} as const

