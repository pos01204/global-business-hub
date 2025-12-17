// backend/src/config/constants.ts
// ⚠️ 이 파일의 값은 frontend/config/constants.ts와 동기화되어야 합니다

/**
 * 통화 관련 상수
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
 */
export const TIMEZONE = {
  /** 기본 타임존 */
  DEFAULT: 'Asia/Seoul',
  /** UTC 오프셋 */
  OFFSET: 9,
} as const

/**
 * 배치 Job 관련 상수
 */
export const BATCH_CONFIG = {
  /** 배치 실행 시간 (KST) */
  EXECUTION_HOUR: 12,
  /** 배치 실행 분 */
  EXECUTION_MINUTE: 0,
  /** cron 표현식 (매일 12:00 KST) */
  CRON_EXPRESSION: '0 12 * * *',
  /** 타임존 */
  TIMEZONE: 'Asia/Seoul',
  /** 재시도 횟수 */
  RETRY_COUNT: 3,
  /** 재시도 간격 (ms) */
  RETRY_DELAY: 5000,
} as const

/**
 * 데이터 갱신 관련 상수
 */
export const DATA_REFRESH = {
  /** Raw Data 갱신 시간 (KST) */
  RAW_DATA_UPDATE_HOUR: 11,
  /** 배치 Job 실행 시간 (KST) */
  BATCH_JOB_HOUR: 12,
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
 * 날짜 포맷 상수
 */
export const DATE_FORMAT = {
  /** API 통신용 */
  API: 'yyyy-MM-dd',
  /** 시간 포함 */
  API_DATETIME: 'yyyy-MM-dd HH:mm:ss',
  /** 로그용 */
  LOG: 'yyyy-MM-dd HH:mm:ss.SSS',
} as const

