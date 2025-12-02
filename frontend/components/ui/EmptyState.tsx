'use client'

import React from 'react'
import { Button } from './Button'

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'outline'
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
  className = '',
}) => {
  const sizes = {
    sm: {
      container: 'py-8',
      icon: 'w-12 h-12 text-3xl',
      title: 'text-base',
      description: 'text-sm',
    },
    md: {
      container: 'py-12',
      icon: 'w-16 h-16 text-4xl',
      title: 'text-lg',
      description: 'text-sm',
    },
    lg: {
      container: 'py-16',
      icon: 'w-20 h-20 text-5xl',
      title: 'text-xl',
      description: 'text-base',
    },
  }

  const defaultIcon = (
    <svg className="w-full h-full text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  )

  return (
    <div className={`flex flex-col items-center justify-center text-center ${sizes[size].container} ${className}`}>
      <div className={`${sizes[size].icon} mb-4 flex items-center justify-center rounded-full bg-slate-50`}>
        {icon || defaultIcon}
      </div>
      <h3 className={`font-semibold text-slate-900 ${sizes[size].title}`}>
        {title}
      </h3>
      {description && (
        <p className={`mt-2 text-slate-500 max-w-sm ${sizes[size].description}`}>
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-6 flex items-center gap-3">
          {action && (
            <Button
              variant={action.variant || 'primary'}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// 프리셋 빈 상태 컴포넌트들
export const NoDataState: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <EmptyState
    icon={<span>📊</span>}
    title="데이터가 없습니다"
    description="조건을 변경하여 다시 검색해보세요"
    action={onRetry ? { label: '다시 시도', onClick: onRetry } : undefined}
  />
)

export const NoSearchResultState: React.FC<{ onClear?: () => void }> = ({ onClear }) => (
  <EmptyState
    icon={<span>🔍</span>}
    title="검색 결과가 없습니다"
    description="다른 검색어로 시도해보세요"
    action={onClear ? { label: '검색 초기화', onClick: onClear, variant: 'outline' } : undefined}
  />
)

export const ErrorState: React.FC<{ onRetry?: () => void; message?: string }> = ({ 
  onRetry, 
  message = '데이터를 불러오는 중 오류가 발생했습니다' 
}) => (
  <EmptyState
    icon={<span>⚠️</span>}
    title="오류가 발생했습니다"
    description={message}
    action={onRetry ? { label: '다시 시도', onClick: onRetry } : undefined}
  />
)

export default EmptyState
