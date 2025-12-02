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
  applicableTargets: ApplicableTarget[]
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
  applicableTargets: [],
}
