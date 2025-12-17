// frontend/config/constants.ts
// ⚠️ 이 파일의 값은 backend/src/config/constants.ts와 동기화되어야 합니다

/**
 * 통화 관련 상수
 * @description 모든 환율 변환 및 통화 표시에 사용
 */
export const CURRENCY = {
  /** USD → KRW 고정 환율 (2024년 12월 기준) */
  USD_TO_KRW: 1350,
  /** 원화 기호 */
  SYMBOL_KRW: '₩',
  /** 달러 기호 */
  SYMBOL_USD: '$',
  /** 원화 소수점 자릿수 (없음) */
  DECIMAL_PLACES_KRW: 0,
  /** 달러 소수점 자릿수 */
  DECIMAL_PLACES_USD: 2,
} as const

/**
 * 타임존 관련 상수
 * @description 모든 날짜/시간 처리에 사용
 */
export const TIMEZONE = {
  /** 기본 타임존 */
  DEFAULT: 'Asia/Seoul',
  /** UTC 오프셋 */
  OFFSET: 9,
} as const

/**
 * API 관련 상수
 */
export const API = {
  /** API 기본 URL */
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  /** API 타임아웃 (ms) */
  TIMEOUT: 30000,
} as const

/**
 * 페이지네이션 기본값
 */
export const PAGINATION = {
  /** 기본 페이지 번호 */
  DEFAULT_PAGE: 1,
  /** 기본 페이지 크기 */
  DEFAULT_PAGE_SIZE: 20,
  /** 최대 페이지 크기 */
  MAX_PAGE_SIZE: 100,
} as const

/**
 * 데이터 갱신 관련 상수
 */
export const DATA_REFRESH = {
  /** Raw Data 갱신 시간 (KST) */
  RAW_DATA_UPDATE_HOUR: 11,
  /** 배치 Job 실행 시간 (KST) */
  BATCH_JOB_HOUR: 12,
  /** 실시간 데이터 새로고침 간격 (ms) - 5분 */
  REALTIME_REFRESH_INTERVAL: 5 * 60 * 1000,
  /** 분석 데이터 새로고침 간격 (ms) - 30분 */
  ANALYTICS_REFRESH_INTERVAL: 30 * 60 * 1000,
} as const

/**
 * 차트 색상 테마
 */
export const CHART_COLORS = {
  PRIMARY: '#6366f1',
  SECONDARY: '#8b5cf6',
  SUCCESS: '#22c55e',
  WARNING: '#f59e0b',
  DANGER: '#ef4444',
  INFO: '#3b82f6',
  MUTED: '#6b7280',
  /** 그라데이션 색상 배열 */
  GRADIENT: ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'],
  /** 국가별 색상 */
  COUNTRY: {
    JP: '#ef4444',
    EN: '#3b82f6',
  },
} as const

/**
 * 날짜 포맷 상수
 */
export const DATE_FORMAT = {
  /** API 통신용 */
  API: 'yyyy-MM-dd',
  /** 시간 포함 */
  API_DATETIME: 'yyyy-MM-dd HH:mm:ss',
  /** UI 표시 (한국어) */
  DISPLAY_KR: 'yyyy년 MM월 dd일',
  /** UI 표시 (간략) */
  DISPLAY_SHORT: 'MM/dd',
  /** 기간 표시 */
  PERIOD: 'yyyy-MM',
} as const

