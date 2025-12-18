/**
 * 🎨 Brand Assets 유틸리티
 * idus 브랜드 에셋 경로 상수 및 유틸리티 함수
 * 
 * @version 1.0.0
 * @created 2025-12-18
 */

// ============================================================
// 기본 경로 상수
// ============================================================
export const BRAND_BASE_PATH = '/brand/brand assets'
export const REBRAND_PATH = '/brand/Rebranding Design Resources/Rebranding Design Resources'

// ============================================================
// 브랜드 에셋 상수
// ============================================================
export const BRAND_ASSETS = {
  // 기본 경로
  basePath: BRAND_BASE_PATH,
  rebrandPath: REBRAND_PATH,

  // ============================================================
  // 이모션 아이콘 - 피드백/상태 표시
  // ============================================================
  emotions: {
    like: `${BRAND_BASE_PATH}/좋아요.png`,
    great: `${BRAND_BASE_PATH}/멋져요.png`,
    happy: `${BRAND_BASE_PATH}/기뻐요.png`,
    sad: `${BRAND_BASE_PATH}/슬퍼요.png`,
    cheer: `${BRAND_BASE_PATH}/힘내요.png`,
    touched: `${BRAND_BASE_PATH}/감동이에ㅛ.png`,
    best: `${BRAND_BASE_PATH}/최고.png`,
  },

  // ============================================================
  // 프로필 아이콘 - 기본 아바타
  // ============================================================
  profiles: Array.from({ length: 10 }, (_, i) =>
    `${BRAND_BASE_PATH}/profile${String(i + 1).padStart(2, '0')}.png`
  ),

  // ============================================================
  // 라인 일러스트 - Empty State, 헤더 장식
  // ============================================================
  lines: {
    // 모든 라인 일러스트
    all: Array.from({ length: 12 }, (_, i) =>
      `${BRAND_BASE_PATH}/line_${String(i + 1).padStart(2, '0')}.png`
    ),
    // 타입별 매핑
    byType: {
      search: `${BRAND_BASE_PATH}/line_01.png`,
      empty: `${BRAND_BASE_PATH}/line_02.png`,
      loading: `${BRAND_BASE_PATH}/line_03.png`,
      success: `${BRAND_BASE_PATH}/line_04.png`,
      error: `${BRAND_BASE_PATH}/line_05.png`,
      analytics: `${BRAND_BASE_PATH}/line_06.png`,
      shipping: `${BRAND_BASE_PATH}/line_07.png`,
      package: `${BRAND_BASE_PATH}/line_08.png`,
      document: `${BRAND_BASE_PATH}/line_09.png`,
      settings: `${BRAND_BASE_PATH}/line_10.png`,
      notification: `${BRAND_BASE_PATH}/line_11.png`,
      complete: `${BRAND_BASE_PATH}/line_12.png`,
    },
    // Rebranding 버전 (고화질)
    rebrand: Array.from({ length: 12 }, (_, i) =>
      `${REBRAND_PATH}/06. Line illust/line${String(i + 1).padStart(2, '0')}.png`
    ),
  },

  // ============================================================
  // 패턴 - 배경 장식
  // ============================================================
  patterns: {
    pattern1: `${BRAND_BASE_PATH}/pattern01.png`,
    pattern2: `${BRAND_BASE_PATH}/pattern02.png`,
    pattern3: `${BRAND_BASE_PATH}/pattern03.png`,
    logoPattern: `${REBRAND_PATH}/07. Cover images/logo_pattern.jpg`,
    logoPatternWhite: `${REBRAND_PATH}/07. Cover images/logo_pattern-wh.jpg`,
    patternA1: `${REBRAND_PATH}/04. idus_icon_set/2.4.4_pattern A_A1.png`,
    patternA2: `${REBRAND_PATH}/04. idus_icon_set/2.4.4_pattern A_A2.png`,
    patternA3: `${REBRAND_PATH}/04. idus_icon_set/2.4.4_pattern A_A3.png`,
  },

  // ============================================================
  // 카테고리 아이콘 - 작가/상품 분석
  // ============================================================
  categories: {
    // 공예/핸드메이드
    craft: `${BRAND_BASE_PATH}/공예.png`,
    ceramic: `${BRAND_BASE_PATH}/도자.png`,
    woodwork: `${BRAND_BASE_PATH}/목공.png`,
    silkScreen: `${BRAND_BASE_PATH}/실크스크린.png`,
    candle: `${BRAND_BASE_PATH}/캔들.png`,
    paper: `${BRAND_BASE_PATH}/종이페이퍼.png`,
    
    // 뷰티/패션
    beauty: `${BRAND_BASE_PATH}/뷰티.png`,
    beauty03: `${BRAND_BASE_PATH}/뷰티03.png`,
    fashion: `${BRAND_BASE_PATH}/의류패션잡화.png`,
    bag: `${BRAND_BASE_PATH}/가방.png`,
    jewelry: `${BRAND_BASE_PATH}/주얼리_목걸이.png`,
    
    // 식품/음료
    food: `${BRAND_BASE_PATH}/식품.png`,
    dessert: `${BRAND_BASE_PATH}/디저트.png`,
    cooking: `${BRAND_BASE_PATH}/요리.png`,
    meal: `${BRAND_BASE_PATH}/식사.png`,
    fruit: `${BRAND_BASE_PATH}/과일.png`,
    dairy: `${BRAND_BASE_PATH}/유제품.png`,
    drink: `${BRAND_BASE_PATH}/음료수.png`,
    coffee: `${BRAND_BASE_PATH}/아메리카노.png`,
    
    // 기타
    art: `${BRAND_BASE_PATH}/미술.png`,
    camera: `${BRAND_BASE_PATH}/카메라.png`,
    plant: `${BRAND_BASE_PATH}/플랜트.png`,
    gift: `${BRAND_BASE_PATH}/선물.png`,
    experience: `${BRAND_BASE_PATH}/체험.png`,
    stationery: `${BRAND_BASE_PATH}/문구사무용품.png`,
  },

  // ============================================================
  // 컨셉 일러스트 - 대시보드, 온보딩
  // ============================================================
  concepts: {
    animal: `${REBRAND_PATH}/04. idus_icon_set/2.1.8_brandmark_usage(illustration)_animal.png`,
    dessert: `${REBRAND_PATH}/04. idus_icon_set/2.1.8_brandmark_usage(illustration)_dessert.png`,
    flower: `${REBRAND_PATH}/04. idus_icon_set/2.1.8_brandmark_usage(illustration)_flower.png`,
    interior: `${REBRAND_PATH}/04. idus_icon_set/2.1.8_brandmark_usage(illustration)_interior.png`,
    knitting: `${REBRAND_PATH}/04. idus_icon_set/2.1.8_brandmark_usage(illustration)_knitting.png`,
    silkScreen: `${REBRAND_PATH}/04. idus_icon_set/2.1.8_brandmark_usage(illustration)_silk_screen.png`,
    // 컨셉 이미지
    concept5: `${REBRAND_PATH}/04. idus_icon_set/1.5_concept 5.png`,
    concept6: `${REBRAND_PATH}/04. idus_icon_set/1.5_concept 6.png`,
    concept7: `${REBRAND_PATH}/04. idus_icon_set/1.5_concept 7.png`,
    concept8: `${REBRAND_PATH}/04. idus_icon_set/1.5_concept 8.png`,
    concept9: `${REBRAND_PATH}/04. idus_icon_set/1.5_concept 9.png`,
    concept10: `${REBRAND_PATH}/04. idus_icon_set/1.5_concept 10.png`,
  },

  // ============================================================
  // 로고
  // ============================================================
  logo: {
    color: `${REBRAND_PATH}/01. BI/idus_Logo_RGB_2_.png`,
    white: `${REBRAND_PATH}/01. BI/idus_Logo_RGB_1_W.png`,
    rev1: `${REBRAND_PATH}/01. BI/idus_Logo_RGB_Rev1_1.png`,
    rev2: `${REBRAND_PATH}/01. BI/idus_Logo_RGB_Rev1_2.png`,
    noBg: `${REBRAND_PATH}/01. BI/logo_without_BG.png`,
    icon: `${REBRAND_PATH}/02. Profile/icon.png`,
    appIcon: `${REBRAND_PATH}/02. Profile/appicon-1024.png`,
    appIcon512: `${REBRAND_PATH}/02. Profile/thm_idus_512.png`,
  },

  // ============================================================
  // 배송 관련
  // ============================================================
  delivery: {
    truck: `${BRAND_BASE_PATH}/택배차02 1.png`,
    box: `${BRAND_BASE_PATH}/배송박스.png`,
  },

  // ============================================================
  // 커버 이미지
  // ============================================================
  covers: {
    facebook: `${REBRAND_PATH}/07. Cover images/facebook_cover.jpg`,
    twitter: `${REBRAND_PATH}/07. Cover images/twitter_cover.jpg`,
    youtube: `${REBRAND_PATH}/07. Cover images/youtube_cover.jpg`,
    kakao: `${REBRAND_PATH}/07. Cover images/kakaotalk_cover.jpg`,
    naver: `${REBRAND_PATH}/07. Cover images/naverpost_cover.jpg`,
    notion: `${REBRAND_PATH}/07. Cover images/notion_cover.jpg`,
    google: `${REBRAND_PATH}/07. Cover images/google_idus_background_(1).png`,
  },

  // ============================================================
  // 로딩
  // ============================================================
  loading: {
    gif: '/loading/3times.gif',
  },

  // ============================================================
  // 컬러 (이미지)
  // ============================================================
  colors: {
    primaryOrange: `${BRAND_BASE_PATH}/_color/primary_orange.png`,
    primaryBlack: `${BRAND_BASE_PATH}/_color/primary_black.png`,
    orange10: `${BRAND_BASE_PATH}/color/primary_orange_10.png`,
    orange50: `${BRAND_BASE_PATH}/color/primary_orange_50.png`,
    orange70: `${BRAND_BASE_PATH}/color/primary_orange_70.png`,
    orange90: `${BRAND_BASE_PATH}/color/primary_orange_90.png`,
    black10: `${BRAND_BASE_PATH}/color/primary_black_10.png`,
    black20: `${BRAND_BASE_PATH}/color/primary_black_20.png`,
    black50: `${BRAND_BASE_PATH}/color/primary_black_50.png`,
    black70: `${BRAND_BASE_PATH}/color/primary_black_70.png`,
    black90: `${BRAND_BASE_PATH}/color/primary_black_90.png`,
  },
} as const

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * 변화율에 따른 이모션 아이콘 반환
 * @param change 변화율 (%)
 * @returns 이모션 아이콘 경로
 */
export function getEmotionByChange(change: number): string {
  if (change >= 20) return BRAND_ASSETS.emotions.great
  if (change >= 10) return BRAND_ASSETS.emotions.happy
  if (change >= 0) return BRAND_ASSETS.emotions.like
  if (change >= -10) return BRAND_ASSETS.emotions.cheer
  return BRAND_ASSETS.emotions.sad
}

/**
 * 상태에 따른 이모션 아이콘 반환
 * @param status 상태 ('success' | 'error' | 'warning' | 'info')
 * @returns 이모션 아이콘 경로
 */
export function getEmotionByStatus(status: 'success' | 'error' | 'warning' | 'info'): string {
  switch (status) {
    case 'success':
      return BRAND_ASSETS.emotions.happy
    case 'error':
      return BRAND_ASSETS.emotions.sad
    case 'warning':
      return BRAND_ASSETS.emotions.cheer
    case 'info':
    default:
      return BRAND_ASSETS.emotions.like
  }
}

/**
 * 식별자 기반 기본 프로필 아이콘 반환
 * @param identifier 사용자 식별자 (이메일, 이름 등)
 * @returns 프로필 아이콘 경로
 */
export function getDefaultProfile(identifier: string): string {
  const hash = identifier.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return BRAND_ASSETS.profiles[hash % BRAND_ASSETS.profiles.length]
}

/**
 * 카테고리 키로 아이콘 경로 반환
 * @param categoryKey 카테고리 키
 * @returns 카테고리 아이콘 경로 또는 null
 */
export function getCategoryIcon(categoryKey: string): string | null {
  const key = categoryKey.toLowerCase() as keyof typeof BRAND_ASSETS.categories
  return BRAND_ASSETS.categories[key] || null
}

/**
 * 페이지명으로 헤더 일러스트 반환
 * @param pageName 페이지명
 * @returns 일러스트 경로
 */
export function getHeaderIllust(pageName: string): string {
  const headerAssets: Record<string, string> = {
    dashboard: BRAND_ASSETS.lines.byType.analytics,
    analytics: BRAND_ASSETS.lines.byType.analytics,
    'performance-hub': BRAND_ASSETS.lines.byType.analytics,
    logistics: BRAND_ASSETS.delivery.truck,
    unreceived: BRAND_ASSETS.delivery.box,
    'control-tower': BRAND_ASSETS.delivery.truck,
    'customer-analytics': BRAND_ASSETS.lines.byType.loading,
    'customer-360': BRAND_ASSETS.lines.byType.loading,
    'artist-analytics': BRAND_ASSETS.categories.craft,
    'cost-analysis': BRAND_ASSETS.lines.byType.success,
    settlement: BRAND_ASSETS.lines.byType.document,
    qc: BRAND_ASSETS.lines.byType.error,
    chat: BRAND_ASSETS.lines.byType.search,
    'business-brain': BRAND_ASSETS.concepts.interior,
    marketer: BRAND_ASSETS.lines.byType.notification,
    'coupon-generator': BRAND_ASSETS.categories.gift,
    'review-analytics': BRAND_ASSETS.lines.byType.complete,
    lookup: BRAND_ASSETS.lines.byType.search,
  }

  return headerAssets[pageName] || BRAND_ASSETS.lines.byType.analytics
}

/**
 * 라인 일러스트 타입으로 경로 반환
 * @param type 라인 일러스트 타입
 * @returns 일러스트 경로
 */
export function getLineIllust(type: keyof typeof BRAND_ASSETS.lines.byType): string {
  return BRAND_ASSETS.lines.byType[type]
}

/**
 * 랜덤 컨셉 일러스트 반환
 * @returns 컨셉 일러스트 경로
 */
export function getRandomConcept(): string {
  const concepts = [
    BRAND_ASSETS.concepts.animal,
    BRAND_ASSETS.concepts.dessert,
    BRAND_ASSETS.concepts.flower,
    BRAND_ASSETS.concepts.interior,
    BRAND_ASSETS.concepts.knitting,
    BRAND_ASSETS.concepts.silkScreen,
  ]
  return concepts[Math.floor(Math.random() * concepts.length)]
}

/**
 * 랜덤 패턴 반환
 * @returns 패턴 경로
 */
export function getRandomPattern(): string {
  const patterns = [
    BRAND_ASSETS.patterns.pattern1,
    BRAND_ASSETS.patterns.pattern2,
    BRAND_ASSETS.patterns.pattern3,
  ]
  return patterns[Math.floor(Math.random() * patterns.length)]
}

// ============================================================
// 타입 정의
// ============================================================
export type EmotionType = keyof typeof BRAND_ASSETS.emotions
export type LineType = keyof typeof BRAND_ASSETS.lines.byType
export type CategoryType = keyof typeof BRAND_ASSETS.categories
export type ConceptType = keyof typeof BRAND_ASSETS.concepts
export type PatternType = keyof typeof BRAND_ASSETS.patterns

