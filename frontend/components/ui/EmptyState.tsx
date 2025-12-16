/**
 * EmptyState - 빈 상태 디자인 컴포넌트
 * 데이터가 없거나 결과가 없을 때 표시
 */

'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/Icon'
import { 
  Search, FileQuestion, Database, AlertCircle,
  Inbox, FolderOpen, BarChart3, Users, Package
} from 'lucide-react'

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
}

// 변형별 기본값
const variantDefaults: Record<EmptyStateVariant, {
  icon: typeof Search
  title: string
  description: string
  emoji: string
  gradient: string
}> = {
  default: {
    icon: Inbox,
    title: '데이터가 없습니다',
    description: '표시할 데이터가 없습니다. 나중에 다시 확인해주세요.',
    emoji: '📭',
    gradient: 'from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700',
  },
  search: {
    icon: Search,
    title: '검색 결과가 없습니다',
    description: '검색어를 변경하거나 필터를 조정해보세요.',
    emoji: '🔍',
    gradient: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
  },
  data: {
    icon: Database,
    title: '데이터를 불러올 수 없습니다',
    description: '데이터 로딩 중 문제가 발생했습니다. 새로고침을 시도해주세요.',
    emoji: '💾',
    gradient: 'from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20',
  },
  error: {
    icon: AlertCircle,
    title: '오류가 발생했습니다',
    description: '요청을 처리하는 중 문제가 발생했습니다.',
    emoji: '⚠️',
    gradient: 'from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20',
  },
  filter: {
    icon: FolderOpen,
    title: '필터 결과가 없습니다',
    description: '현재 필터 조건에 맞는 항목이 없습니다. 필터를 조정해보세요.',
    emoji: '📂',
    gradient: 'from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20',
  },
  chart: {
    icon: BarChart3,
    title: '차트 데이터가 없습니다',
    description: '선택한 기간에 표시할 데이터가 없습니다.',
    emoji: '📊',
    gradient: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
  },
  customer: {
    icon: Users,
    title: '고객 데이터가 없습니다',
    description: '해당 조건의 고객이 없습니다.',
    emoji: '👥',
    gradient: 'from-cyan-50 to-sky-50 dark:from-cyan-900/20 dark:to-sky-900/20',
  },
  product: {
    icon: Package,
    title: '상품 데이터가 없습니다',
    description: '해당 조건의 상품이 없습니다.',
    emoji: '📦',
    gradient: 'from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20',
  },
}

// 크기별 스타일
const sizeStyles = {
  sm: {
    container: 'py-8 px-4',
    iconBox: 'w-12 h-12',
    emoji: 'text-2xl',
    title: 'text-base',
    description: 'text-xs',
    button: 'px-3 py-1.5 text-xs',
  },
  md: {
    container: 'py-12 px-6',
    iconBox: 'w-16 h-16',
    emoji: 'text-4xl',
    title: 'text-lg',
    description: 'text-sm',
    button: 'px-4 py-2 text-sm',
  },
  lg: {
    container: 'py-16 px-8',
    iconBox: 'w-20 h-20',
    emoji: 'text-5xl',
    title: 'text-xl',
    description: 'text-base',
    button: 'px-5 py-2.5 text-base',
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
}: EmptyStateProps) {
  const defaults = variantDefaults[variant]
  const styles = sizeStyles[size]
  const IconComponent = defaults.icon

  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center',
      `bg-gradient-to-br ${defaults.gradient}`,
      'rounded-xl',
      styles.container,
      className
    )}>
      {/* 아이콘/이모지 */}
      <div className={cn(
        'rounded-full flex items-center justify-center mb-4',
        'bg-white dark:bg-slate-800 shadow-sm',
        styles.iconBox
      )}>
        {icon || (
          <span className={styles.emoji}>{defaults.emoji}</span>
        )}
      </div>

      {/* 제목 */}
      <h3 className={cn(
        'font-semibold text-slate-800 dark:text-slate-100 mb-2',
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
                'bg-indigo-600 text-white rounded-lg font-medium',
                'hover:bg-indigo-700 transition-colors',
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
  className,
}: {
  message?: string
  icon?: ReactNode
  className?: string
}) {
  return (
    <div className={cn(
      'flex items-center justify-center gap-2 py-4 text-slate-500 dark:text-slate-400',
      className
    )}>
      {icon || <Icon icon={Inbox} size="sm" />}
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
}: {
  colSpan: number
  message?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
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
        />
      </td>
    </tr>
  )
}

export default EmptyState
