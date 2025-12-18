/**
 * 🎨 Brand Components
 * idus 브랜드 에셋을 활용한 컴포넌트 모음
 * 
 * @version 1.0.0
 * @created 2025-12-18
 */

// 기존 BrandComponents.tsx에서 export
export {
  LoadingSpinner,
  EmptyState as BrandEmptyStateBase,
  ErrorState,
  SuccessState,
  BrandCard,
  BrandBadge,
  BrandPatternBg,
} from '../BrandComponents'

// 브랜드 에셋 유틸리티
export {
  BRAND_ASSETS,
  BRAND_BASE_PATH,
  REBRAND_PATH,
  getEmotionByChange,
  getEmotionByStatus,
  getDefaultProfile,
  getCategoryIcon,
  getHeaderIllust,
  getLineIllust,
  getRandomConcept,
  getRandomPattern,
} from '@/lib/brand-assets'

export type {
  EmotionType,
  LineType,
  CategoryType,
  ConceptType,
  PatternType,
} from '@/lib/brand-assets'

// 브랜드 아바타
export { BrandAvatar, BrandAvatarGroup } from './BrandAvatar'

// 브랜드 피드백 (이모션)
export { 
  BrandFeedback, 
  SuccessFeedback, 
  ErrorFeedback, 
  KPIFeedback 
} from './BrandFeedback'

// 카테고리 아이콘
export { 
  CategoryIcon, 
  CategoryBadge, 
  CategoryFilterGroup,
  ALL_CATEGORIES 
} from './CategoryIcon'
