'use client'

import Image from 'next/image'
import { getCategoryIcon, BRAND_ASSETS, CategoryType } from '@/lib/brand-assets'
import { cn } from '@/lib/utils'
import { Package } from 'lucide-react'

interface CategoryIconProps {
  /** 카테고리 키 */
  category: string
  /** 아이콘 크기 (px) */
  size?: number
  /** 추가 클래스명 */
  className?: string
  /** 폴백 아이콘 표시 여부 */
  showFallback?: boolean
}

/**
 * 카테고리 아이콘 컴포넌트
 * 브랜드 카테고리 아이콘을 표시하고, 없을 경우 폴백 아이콘 표시
 */
export function CategoryIcon({
  category,
  size = 24,
  className,
  showFallback = true,
}: CategoryIconProps) {
  const iconPath = getCategoryIcon(category)

  if (!iconPath) {
    if (!showFallback) return null
    
    // Lucide 아이콘 폴백
    return (
      <Package 
        size={size} 
        className={cn('text-slate-400', className)} 
      />
    )
  }

  return (
    <div 
      className={cn('relative flex-shrink-0', className)}
      style={{ width: size, height: size }}
    >
      <Image
        src={iconPath}
        alt={category}
        fill
        className="object-contain"
      />
    </div>
  )
}

/**
 * 카테고리 배지 컴포넌트
 * 아이콘 + 레이블 조합
 */
interface CategoryBadgeProps {
  /** 카테고리 키 */
  category: CategoryType | string
  /** 표시 레이블 */
  label?: string
  /** 크기 */
  size?: 'sm' | 'md' | 'lg'
  /** 선택 상태 */
  selected?: boolean
  /** 클릭 핸들러 */
  onClick?: () => void
  /** 추가 클래스명 */
  className?: string
}

const badgeSizes = {
  sm: { icon: 16, text: 'text-xs', padding: 'px-2 py-1' },
  md: { icon: 20, text: 'text-sm', padding: 'px-3 py-1.5' },
  lg: { icon: 24, text: 'text-base', padding: 'px-4 py-2' },
}

// 카테고리 한글 레이블 매핑
const categoryLabels: Record<string, string> = {
  craft: '공예',
  ceramic: '도자',
  woodwork: '목공',
  silkScreen: '실크스크린',
  candle: '캔들',
  paper: '종이/페이퍼',
  beauty: '뷰티',
  beauty03: '뷰티',
  fashion: '패션잡화',
  bag: '가방',
  jewelry: '주얼리',
  food: '식품',
  dessert: '디저트',
  cooking: '요리',
  meal: '식사',
  fruit: '과일',
  dairy: '유제품',
  drink: '음료',
  coffee: '커피',
  art: '미술',
  camera: '사진',
  plant: '플랜트',
  gift: '선물',
  experience: '체험',
  stationery: '문구',
}

export function CategoryBadge({
  category,
  label,
  size = 'md',
  selected = false,
  onClick,
  className,
}: CategoryBadgeProps) {
  const { icon, text, padding } = badgeSizes[size]
  const displayLabel = label || categoryLabels[category] || category

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border transition-all',
        padding,
        selected
          ? 'bg-idus-50 border-idus-300 text-idus-700 dark:bg-idus-900/30 dark:border-idus-700 dark:text-idus-300'
          : 'bg-white border-slate-200 text-slate-700 hover:border-idus-300 hover:bg-idus-50/50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-idus-700',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      <CategoryIcon category={category} size={icon} />
      <span className={cn('font-medium', text)}>{displayLabel}</span>
    </button>
  )
}

/**
 * 카테고리 필터 그룹 컴포넌트
 */
interface CategoryFilterGroupProps {
  /** 카테고리 목록 */
  categories: Array<{ key: string; label?: string }>
  /** 선택된 카테고리들 */
  selected: string[]
  /** 선택 변경 핸들러 */
  onChange: (selected: string[]) => void
  /** 다중 선택 허용 */
  multiple?: boolean
  /** 크기 */
  size?: 'sm' | 'md' | 'lg'
  /** 추가 클래스명 */
  className?: string
}

export function CategoryFilterGroup({
  categories,
  selected,
  onChange,
  multiple = true,
  size = 'sm',
  className,
}: CategoryFilterGroupProps) {
  const handleClick = (key: string) => {
    if (multiple) {
      if (selected.includes(key)) {
        onChange(selected.filter(k => k !== key))
      } else {
        onChange([...selected, key])
      }
    } else {
      onChange(selected.includes(key) ? [] : [key])
    }
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {categories.map(cat => (
        <CategoryBadge
          key={cat.key}
          category={cat.key}
          label={cat.label}
          size={size}
          selected={selected.includes(cat.key)}
          onClick={() => handleClick(cat.key)}
        />
      ))}
    </div>
  )
}

/**
 * 모든 카테고리 목록
 */
export const ALL_CATEGORIES = Object.keys(BRAND_ASSETS.categories) as CategoryType[]

export default CategoryIcon

