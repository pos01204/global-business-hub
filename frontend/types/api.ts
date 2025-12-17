// frontend/types/api.ts
// API 관련 타입 정의

/**
 * API 응답 기본 구조
 */
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  timestamp?: string
}

/**
 * 페이지네이션 응답
 */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * 기간 파라미터
 */
export interface DateRangeParams {
  startDate: string
  endDate: string
}

/**
 * 페이지네이션 파라미터
 */
export interface PaginationParams {
  page?: number
  pageSize?: number
}

// ===== Dashboard Types =====

export interface DashboardKPI {
  value: number
  change: number
  previousValue?: number
}

export interface DashboardMainResponse {
  kpis: {
    totalGMV: DashboardKPI
    orderCount: DashboardKPI
    avgOrderValue: DashboardKPI
    newCustomers?: DashboardKPI
    deliveryRate?: DashboardKPI
  }
  trends: {
    gmv: Array<{ date: string; value: number }>
    orders: Array<{ date: string; value: number }>
  }
  byCountry: {
    JP: { gmv: number; orders: number }
    EN: { gmv: number; orders: number }
  }
}

// ===== Metrics Types =====

export interface DailyMetrics {
  date: string
  orderCount: number
  totalGmvKrw: number
  totalGmvUsd: number
  avgAov: number
  uniqueCustomers: number
  newCustomers: number
  returningCustomers: number
  byCountry: {
    JP: { orderCount: number; gmv: number }
    EN: { orderCount: number; gmv: number }
  }
}

export interface MetricsSummary {
  period: { start: string; end: string }
  totalOrderCount: number
  totalGmvKrw: number
  avgDailyGmv: number
  avgAov: number
  totalUniqueCustomers: number
  totalNewCustomers: number
}

export interface MetricsTrend {
  metric: string
  data: Array<{ date: string; value: number }>
}

// ===== Coupon Analytics Types =====

export interface CouponSummary {
  period: { start: string; end: string }
  totalCoupons: number
  totalIssued: number
  totalUsed: number
  overallConversionRate: number
  totalDiscount: number
  totalGmv: number
  roi: number
  change: {
    conversionRate: number
    roi: number
    gmv: number
  }
}

export interface CouponTrend {
  monthly: Array<{
    month: string
    issued: number
    used: number
    conversionRate: number
    gmv: number
    discount: number
  }>
}

export interface CouponByType {
  RATE: CouponTypeMetrics
  FIXED: CouponTypeMetrics
}

interface CouponTypeMetrics {
  count: number
  totalIssued: number
  totalUsed: number
  avgConversion: number
  totalGmv: number
  avgRoi: number
}

export interface CouponByCountry {
  JP: CouponCountryMetrics
  EN: CouponCountryMetrics
}

interface CouponCountryMetrics {
  issued: number
  used: number
  conversionRate: number
  gmv: number
  roi: number
}

export interface TopPerformer {
  couponId: number
  couponName: string
  discountType: string
  conversionRate: number
  gmv: number
  roi: number
}

export interface FailedCoupon {
  couponId: number
  couponName: string
  issuedCount: number
  possibleReason?: string
  conversionRate?: number
}

// ===== Review Analytics Types =====

export interface NPSResult {
  score: number
  promoters: number
  promotersPct: number
  passives: number
  passivesPct: number
  detractors: number
  detractorsPct: number
}

export interface ReviewTrend {
  monthly: Array<{
    month: string
    count: number
    avgRating: number
    nps: number
  }>
}

export interface ReviewByRating {
  rating: number
  count: number
  percentage: number
}

// ===== Customer Analytics Types =====

export interface RFMSummary {
  segment: string
  count: number
  percentage: number
  avgRecency: number
  avgFrequency: number
  avgMonetary: number
}

export interface Customer360 {
  profile: {
    userId: string
    email: string
    country: string
    createdAt: string
    lastOrderDate: string
    segment: string
  }
  rfm: {
    recency: number
    frequency: number
    monetary: number
    score: string
    segment: string
  }
  orders: Array<{
    orderId: string
    orderDate: string
    totalAmount: number
    itemCount: number
    status: string
  }>
  coupons: Array<{
    couponId: number
    couponName: string
    usedDate: string
    discountAmount: number
  }>
  reviews: Array<{
    reviewId: string
    productName: string
    rating: number
    content: string
    date: string
  }>
  ltv: {
    estimatedValue: number
    confidence: number
    basis: string
  }
}

// ===== Admin Types =====

export interface AggregationTriggerRequest {
  date: string
  types?: ('metrics' | 'review' | 'coupon')[]
}

export interface AggregationResult {
  success: boolean
  date: string
  types: string[]
  duration: number
  message?: string
}

// ===== Common Types =====

export type Country = 'JP' | 'EN' | 'KR'
export type DiscountType = 'RATE' | 'FIXED'
export type CouponSource = 'idus' | 'CRM' | 'Sodam'
export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'CHURN_RISK' | 'CHURNED'

