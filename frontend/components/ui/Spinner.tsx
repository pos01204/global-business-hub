'use client'

import React from 'react'

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'white' | 'gray' | 'current'
  className?: string
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
}) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4',
  }

  const colors = {
    primary: 'border-[#F78C3A] border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-slate-300 border-t-slate-600',
    current: 'border-current border-t-transparent',
  }

  return (
    <div
      className={`
        animate-spin rounded-full
        ${sizes[size]}
        ${colors[color]}
        ${className}
      `}
      role="status"
      aria-label="로딩 중"
    >
      <span className="sr-only">로딩 중...</span>
    </div>
  )
}

export interface LoadingOverlayProps {
  message?: string
  fullScreen?: boolean
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = '로딩 중...',
  fullScreen = false,
}) => {
  return (
    <div
      className={`
        flex flex-col items-center justify-center gap-3
        ${fullScreen ? 'fixed inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-50' : 'py-12'}
      `}
    >
      <Spinner size="lg" />
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{message}</p>
    </div>
  )
}

export default Spinner
