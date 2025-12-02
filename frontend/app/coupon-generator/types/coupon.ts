export interface CouponSettings {
  couponName: string
  description: string
  fromDateTime: string
  toDateTime: string
  validPeriod: number
  currencyCode: 'JPY' | 'USD'
  discountType: 'FIXED' | 'RATE'
  discount: number
  minOrderPrice: number
  maxDiscountPrice: number
  issueLimit: number
  issueLimitPerUser: number
  useLimitPerUser: number
  isPublic: boolean
  issueUserId: number  // 0 = 전체 사용자, 특정 ID = 개별 사용자
  applicableTargets: ApplicableTarget[]
}

// 입력값 검증 결과
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// 쿠폰 설정 검증
export function validateCouponSettings(settings: CouponSettings): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // 필수 필드 검증
  if (!settings.couponName.trim()) {
    errors.push('쿠폰명을 입력해주세요.')
  }
  if (!settings.description.trim()) {
    errors.push('설명을 입력해주세요.')
  }

  // 날짜 검증
  const fromDate = new Date(settings.fromDateTime)
  const toDate = new Date(settings.toDateTime)
  if (fromDate >= toDate) {
    errors.push('종료일은 시작일보다 이후여야 합니다.')
  }

  // 할인 검증
  if (settings.discountType === 'RATE') {
    if (settings.discount <= 0 || settings.discount > 100) {
      errors.push('할인율은 1~100% 사이여야 합니다.')
    }
    if (settings.discount > 30) {
      warnings.push('30% 이상 할인은 수익성에 큰 영향을 줄 수 있습니다.')
    }
  } else {
    if (settings.discount <= 0) {
      errors.push('할인 금액은 0보다 커야 합니다.')
    }
  }

  // 발급 수량 검증
  if (settings.issueLimit <= 0) {
    errors.push('총 발급 수량은 1 이상이어야 합니다.')
  }

  // 적용 대상 검증
  if (settings.applicableTargets.length === 0 && settings.isPublic) {
    warnings.push('적용 대상이 없으면 전체 사용자에게 공개됩니다.')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

export interface ApplicableTarget {
  targetType: 'COUNTRY' | 'SHOWROOM'
  targetId: string
}

export interface CouponQuery extends CouponSettings {
  adminId: number
  issueUserId: number
  maxValidDateTime: string
}

// 날짜를 KST 기준 UTC로 변환 (KST 00:00 = UTC 전날 15:00)
export function formatDateToUTC(dateStr: string): string {
  const date = new Date(dateStr)
  date.setDate(date.getDate() - 1)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}T15:00:00+00:00`
}

// 유효 기간 계산
export function calculateValidPeriod(fromDate: string, toDate: string): number {
  const from = new Date(fromDate)
  const to = new Date(toDate)
  const diffTime = to.getTime() - from.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// 오늘 날짜 (YYYY-MM-DD)
export function getTodayString(): string {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

// N일 후 날짜
export function getDateAfterDays(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

export const defaultCouponSettings: CouponSettings = {
  couponName: '',
  description: '',
  fromDateTime: formatDateToUTC(getTodayString()),
  toDateTime: formatDateToUTC(getDateAfterDays(7)),
  validPeriod: 7,
  currencyCode: 'JPY',
  discountType: 'RATE',
  discount: 10,
  minOrderPrice: 8000,
  maxDiscountPrice: 1000,
  issueLimit: 100,
  issueLimitPerUser: 1,
  useLimitPerUser: 1,
  isPublic: true,
  issueUserId: 0,  // 0 = 전체 사용자
  applicableTargets: [],
}
