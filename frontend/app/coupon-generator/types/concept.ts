import { CouponSettings } from './coupon'

export interface ConceptCategory {
  id: string
  name: string
  icon: string
  concepts: Concept[]
}

export interface Concept {
  id: string
  name: string
  nameJP: string
  description: string
  defaults: Partial<CouponSettings>
  couponNameTemplate: {
    jp: string
    en: string
  }
}

export interface SeasonEvent {
  id: string
  name: string
  nameJP: string
  startDate: { month: number; day: number }
  endDate: { month: number; day: number }
  recommendedDiscount: number
  targetRegions: ('JP' | 'GLOBAL' | 'ALL')[]
}

export const SEASON_EVENTS: SeasonEvent[] = [
  { id: 'new_year', name: '신년', nameJP: '新年', startDate: { month: 1, day: 1 }, endDate: { month: 1, day: 7 }, recommendedDiscount: 10, targetRegions: ['ALL'] },
  { id: 'valentines', name: '발렌타인', nameJP: 'バレンタイン', startDate: { month: 2, day: 10 }, endDate: { month: 2, day: 14 }, recommendedDiscount: 10, targetRegions: ['JP'] },
  { id: 'white_day', name: '화이트데이', nameJP: 'ホワイトデー', startDate: { month: 3, day: 10 }, endDate: { month: 3, day: 14 }, recommendedDiscount: 10, targetRegions: ['JP'] },
  { id: 'golden_week', name: '골든위크', nameJP: 'GW', startDate: { month: 4, day: 29 }, endDate: { month: 5, day: 6 }, recommendedDiscount: 10, targetRegions: ['JP'] },
  { id: 'silver_week', name: '실버위크', nameJP: 'SW', startDate: { month: 9, day: 15 }, endDate: { month: 9, day: 23 }, recommendedDiscount: 10, targetRegions: ['JP'] },
  { id: 'black_friday', name: '블랙프라이데이', nameJP: 'ブラックフライデー', startDate: { month: 11, day: 24 }, endDate: { month: 11, day: 27 }, recommendedDiscount: 15, targetRegions: ['GLOBAL'] },
  { id: 'christmas', name: '크리스마스', nameJP: 'クリスマス', startDate: { month: 12, day: 20 }, endDate: { month: 12, day: 25 }, recommendedDiscount: 10, targetRegions: ['ALL'] },
]

export const CONCEPT_CATEGORIES: ConceptCategory[] = [
  {
    id: 'welcome',
    name: '신규/웰컴',
    icon: '🎁',
    concepts: [
      {
        id: 'new_user',
        name: '신규 가입',
        nameJP: '新規登録',
        description: '신규 가입자 대상 웰컴 쿠폰',
        defaults: {
          discountType: 'FIXED',
          discount: 500,
          currencyCode: 'JPY',
          minOrderPrice: 0,
          isPublic: false,
          issueLimitPerUser: 1,
        },
        couponNameTemplate: { jp: '今だけ！初回限定クーポン', en: 'Welcome Coupon' },
      },
      {
        id: 'first_purchase',
        name: '첫 구매',
        nameJP: '初回購入',
        description: '첫 구매 유도 쿠폰',
        defaults: {
          discountType: 'RATE',
          discount: 15,
          currencyCode: 'JPY',
          minOrderPrice: 5000,
          isPublic: false,
        },
        couponNameTemplate: { jp: '初回購入限定{discount}%OFF', en: 'First Purchase {discount}% OFF' },
      },
    ],
  },
  {
    id: 'season',
    name: '시즌 이벤트',
    icon: '📅',
    concepts: [
      {
        id: 'golden_week',
        name: '골든위크',
        nameJP: 'GW',
        description: '일본 골든위크 기획전',
        defaults: { discountType: 'RATE', discount: 10, currencyCode: 'JPY', minOrderPrice: 8000, maxDiscountPrice: 1000, isPublic: true },
        couponNameTemplate: { jp: 'GW限定{discount}%OFF', en: 'Golden Week {discount}% OFF' },
      },
      {
        id: 'silver_week',
        name: '실버위크',
        nameJP: 'SW',
        description: '일본 실버위크 기획전',
        defaults: { discountType: 'RATE', discount: 10, currencyCode: 'JPY', minOrderPrice: 8000, maxDiscountPrice: 1000, isPublic: true },
        couponNameTemplate: { jp: 'SW限定{discount}%OFF', en: 'Silver Week {discount}% OFF' },
      },
      {
        id: 'black_friday',
        name: '블랙프라이데이',
        nameJP: 'ブラックフライデー',
        description: '글로벌 블랙프라이데이',
        defaults: { discountType: 'RATE', discount: 15, currencyCode: 'USD', minOrderPrice: 25, maxDiscountPrice: 5, isPublic: true },
        couponNameTemplate: { jp: 'BF限定{discount}%OFF', en: 'Black Friday {discount}% OFF' },
      },
      {
        id: 'christmas',
        name: '크리스마스',
        nameJP: 'クリスマス',
        description: '크리스마스 시즌 기획전',
        defaults: { discountType: 'RATE', discount: 10, currencyCode: 'JPY', minOrderPrice: 8000, maxDiscountPrice: 1000, isPublic: true },
        couponNameTemplate: { jp: 'Xmas限定{discount}%OFF', en: 'Christmas {discount}% OFF' },
      },
    ],
  },
  {
    id: 'artist',
    name: '아티스트 프로모션',
    icon: '🎨',
    concepts: [
      {
        id: 'new_artist',
        name: '신규 입점',
        nameJP: '新規出店',
        description: '신규 아티스트 입점 기념',
        defaults: { discountType: 'RATE', discount: 10, currencyCode: 'JPY', minOrderPrice: 5000, isPublic: true },
        couponNameTemplate: { jp: '【新規出店】限定{discount}%OFF', en: 'New Artist {discount}% OFF' },
      },
      {
        id: 'artist_promo',
        name: '아티스트 기획전',
        nameJP: 'アーティスト企画',
        description: '아티스트 기획전 쿠폰',
        defaults: { discountType: 'RATE', discount: 10, currencyCode: 'JPY', minOrderPrice: 8000, maxDiscountPrice: 1000, isPublic: true },
        couponNameTemplate: { jp: '【アーティスト名】限定{discount}%OFF', en: 'Artist Promo {discount}% OFF' },
      },
    ],
  },
  {
    id: 'target',
    name: '타겟 마케팅',
    icon: '🎯',
    concepts: [
      {
        id: 'dormant',
        name: '휴면 재활성화',
        nameJP: '休眠復帰',
        description: '휴면 고객 복귀 유도',
        defaults: { discountType: 'FIXED', discount: 1000, currencyCode: 'JPY', minOrderPrice: 0, isPublic: false, validPeriod: 30 },
        couponNameTemplate: { jp: 'お帰りなさい！特別クーポン', en: 'Welcome Back Coupon' },
      },
      {
        id: 'vip',
        name: 'VIP 전용',
        nameJP: 'VIP限定',
        description: 'VIP 고객 전용 쿠폰',
        defaults: { discountType: 'RATE', discount: 20, currencyCode: 'JPY', minOrderPrice: 15000, maxDiscountPrice: 2000, isPublic: false },
        couponNameTemplate: { jp: 'VIP限定{discount}%OFF', en: 'VIP Exclusive {discount}% OFF' },
      },
    ],
  },
]

// 쿠폰명 생성
export function generateCouponName(concept: Concept, discount: number): string {
  return concept.couponNameTemplate.jp.replace('{discount}', discount.toString())
}
