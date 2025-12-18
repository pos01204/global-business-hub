/**
 * EmptyState - 빈 상태 디자인 컴포넌트
 * 데이터가 없거나 결과가 없을 때 표시
 * 브랜드 이모션 아이콘 지원 추가
 */

'use client'

import { ReactNode } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'
import { 
  Search, FileQuestion, Database, AlertCircle,
  Inbox, FolderOpen, BarChart3, Users, Package
} from 'lucide-react'
import { BRAND_ASSETS, getLineIllust } from '@/lib/brand-assets'

type EmptyStateVariant = 
  | 'default' 
  | 'search' 
  | 'data' 
  | 'error' 
  | 'filter' 
  | 'chart'
  | 'customer'
  | 'product'

interface EmptyStateProps {
  variant?: EmptyStateVariant
  title?: string
  description?: string
  icon?: ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
  size?: 'sm' | 'md' | 'lg'
  /** 브랜드 이모션 아이콘 사용 여부 */
  useBrandIcon?: boolean
}

// 변형별 기본값
const variantDefaults: Record<EmptyStateVariant, {
  icon: typeof Search
  title: string
  description: string
  emoji: string
  gradient: string
  brandEmotion: string
  brandLine: keyof typeof BRAND_ASSETS.lines.byType
}> = {
  default: {
    icon: Inbox,
    title: '데이터가 없습니다',
    description: '표시할 데이터가 없습니다. 나중에 다시 확인해주세요.',
    emoji: '📭',
    gradient: 'from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700',
    brandEmotion: BRAND_ASSETS.emotions.sad,
    brandLine: 'empty',
  },
  search: {
    icon: Search,
    title: '검색 결과가 없습니다',
    description: '검색어를 변경하거나 필터를 조정해보세요.',
    emoji: '🔍',
    gradient: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
    brandEmotion: BRAND_ASSETS.emotions.cheer,
    brandLine: 'search',
  },
  data: {
    icon: Database,
    title: '데이터를 불러올 수 없습니다',
    description: '데이터 로딩 중 문제가 발생했습니다. 새로고침을 시도해주세요.',
    emoji: '💾',
    gradient: 'from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20',
    brandEmotion: BRAND_ASSETS.emotions.cheer,
    brandLine: 'loading',
  },
  error: {
    icon: AlertCircle,
    title: '오류가 발생했습니다',
    description: '요청을 처리하는 중 문제가 발생했습니다.',
    emoji: '⚠️',
    gradient: 'from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20',
    brandEmotion: BRAND_ASSETS.emotions.sad,
    brandLine: 'error',
  },
  filter: {
    icon: FolderOpen,
    title: '필터 결과가 없습니다',
    description: '현재 필터 조건에 맞는 항목이 없습니다. 필터를 조정해보세요.',
    emoji: '📂',
    gradient: 'from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20',
    brandEmotion: BRAND_ASSETS.emotions.cheer,
    brandLine: 'search',
  },
  chart: {
    icon: BarChart3,
    title: '차트 데이터가 없습니다',
    description: '선택한 기간에 표시할 데이터가 없습니다.',
    emoji: '📊',
    gradient: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
    brandEmotion: BRAND_ASSETS.emotions.like,
    brandLine: 'analytics',
  },
  customer: {
    icon: Users,
    title: '고객 데이터가 없습니다',
    description: '해당 조건의 고객이 없습니다.',
    emoji: '👥',
    gradient: 'from-cyan-50 to-sky-50 dark:from-cyan-900/20 dark:to-sky-900/20',
    brandEmotion: BRAND_ASSETS.emotions.cheer,
    brandLine: 'loading',
  },
  product: {
    icon: Package,
    title: '상품 데이터가 없습니다',
    description: '해당 조건의 상품이 없습니다.',
    emoji: '📦',
    gradient: 'from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20',
    brandEmotion: BRAND_ASSETS.emotions.cheer,
    brandLine: 'package',
  },
}

// 크기별 스타일
const sizeStyles = {
  sm: {
    container: 'py-8 px-4',
    iconBox: 'w-12 h-12',
    brandIcon: 'w-10 h-10',
    emoji: 'text-2xl',
    title: 'text-base',
    description: 'text-xs',
    button: 'px-3 py-1.5 text-xs',
    illust: 'w-16 h-16',
  },
  md: {
    container: 'py-12 px-6',
    iconBox: 'w-16 h-16',
    brandIcon: 'w-14 h-14',
    emoji: 'text-4xl',
    title: 'text-lg',
    description: 'text-sm',
    button: 'px-4 py-2 text-sm',
    illust: 'w-24 h-24',
  },
  lg: {
    container: 'py-16 px-8',
    iconBox: 'w-20 h-20',
    brandIcon: 'w-16 h-16',
    emoji: 'text-5xl',
    title: 'text-xl',
    description: 'text-base',
    button: 'px-5 py-2.5 text-base',
    illust: 'w-32 h-32',
  },
}

export function EmptyState({
  variant = 'default',
  title,
  description,
  icon,
  action,
  secondaryAction,
  className,
  size = 'md',
  useBrandIcon = false,
}: EmptyStateProps) {
  const defaults = variantDefaults[variant]
  const styles = sizeStyles[size]

  // 브랜드 아이콘 렌더링
  const renderIcon = () => {
    if (icon) return icon

    if (useBrandIcon) {
      return (
        <div className="flex flex-col items-center gap-2" aria-hidden="true">
          {/* 라인 일러스트 */}
          <div className={cn('relative opacity-60', styles.illust)}>
            <Image
              src={getLineIllust(defaults.brandLine)}
              alt=""
              fill
              className="object-contain"
            />
          </div>
          {/* 이모션 아이콘 */}
          <div className={cn('relative', styles.brandIcon)}>
            <Image
              src={defaults.brandEmotion}
              alt=""
              fill
              className="object-contain"
            />
          </div>
        </div>
      )
    }

    return <span className={styles.emoji}>{defaults.emoji}</span>
  }

  return (
    <div 
      className={cn(
        'flex flex-col items-center justify-center text-center',
        `bg-gradient-to-br ${defaults.gradient}`,
        'rounded-xl',
        styles.container,
        className
      )}
      role="status"
      aria-label={title || defaults.title}
    >
      {/* 아이콘/이모지 */}
      {useBrandIcon ? (
        renderIcon()
      ) : (
        <div 
          className={cn(
            'rounded-full flex items-center justify-center mb-4',
            'bg-white dark:bg-slate-800 shadow-sm',
            styles.iconBox
          )}
          aria-hidden="true"
        >
          {renderIcon()}
        </div>
      )}

      {/* 제목 */}
      <h3 className={cn(
        'font-semibold text-slate-800 dark:text-slate-100 mb-2',
        useBrandIcon && 'mt-4',
        styles.title
      )}>
        {title || defaults.title}
      </h3>

      {/* 설명 */}
      <p className={cn(
        'text-slate-500 dark:text-slate-400 max-w-md mb-4',
        styles.description
      )}>
        {description || defaults.description}
      </p>

      {/* 액션 버튼 */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <button
              onClick={action.onClick}
              className={cn(
                'bg-idus-500 text-white rounded-lg font-medium',
                'hover:bg-idus-600 transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-idus-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800',
                styles.button
              )}
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className={cn(
                'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium',
                'border border-slate-200 dark:border-slate-700',
                'hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800',
                styles.button
              )}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// 인라인 빈 상태 (작은 영역용)
export function EmptyStateInline({
  message = '데이터가 없습니다',
  icon,
  useBrandIcon = false,
  className,
}: {
  message?: string
  icon?: ReactNode
  useBrandIcon?: boolean
  className?: string
}) {
  return (
    <div 
      className={cn(
        'flex items-center justify-center gap-2 py-4 text-slate-500 dark:text-slate-400',
        className
      )}
      role="status"
      aria-label={message}
    >
      <span aria-hidden="true">
        {icon ? (
          icon
        ) : useBrandIcon ? (
          <span className="relative w-5 h-5 inline-block">
            <Image
              src={BRAND_ASSETS.emotions.sad}
              alt=""
              fill
              className="object-contain"
            />
          </span>
        ) : (
          <Icon icon={Inbox} size="sm" />
        )}
      </span>
      <span className="text-sm">{message}</span>
    </div>
  )
}

// 테이블 빈 상태
export function EmptyStateTable({
  colSpan,
  message = '데이터가 없습니다',
  description,
  action,
  useBrandIcon = false,
}: {
  colSpan: number
  message?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  useBrandIcon?: boolean
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12">
        <EmptyState
          variant="default"
          title={message}
          description={description}
          action={action}
          size="sm"
          useBrandIcon={useBrandIcon}
        />
      </td>
    </tr>
  )
}

export default EmptyState
