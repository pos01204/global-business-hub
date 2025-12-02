'use client'

import React from 'react'

export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  className?: string
  animation?: 'pulse' | 'wave' | 'none'
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  animation = 'wave',
}) => {
  const variants = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  }

  const animations = {
    pulse: 'animate-pulse bg-slate-200',
    wave: 'skeleton',
    none: 'bg-slate-200',
  }

  const style: React.CSSProperties = {
    width: width ?? (variant === 'circular' ? height : '100%'),
    height: height ?? (variant === 'text' ? '1rem' : undefined),
  }

  return (
    <div
      className={`
        ${variants[variant]}
        ${animations[animation]}
        ${className}
      `}
      style={style}
      aria-hidden="true"
    />
  )
}

// 프리셋 스켈레톤 컴포넌트들
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        width={i === lines - 1 ? '60%' : '100%'}
      />
    ))}
  </div>
)

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-4 border border-slate-200 rounded-lg ${className}`}>
    <Skeleton variant="rounded" height={120} className="mb-4" />
    <Skeleton variant="text" width="70%" className="mb-2" />
    <Skeleton variant="text" width="50%" />
  </div>
)

export const SkeletonTable: React.FC<{ rows?: number; cols?: number; className?: string }> = ({
  rows = 5,
  cols = 4,
  className = '',
}) => (
  <div className={`space-y-3 ${className}`}>
    {/* Header */}
    <div className="flex gap-4 pb-3 border-b border-slate-200">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} variant="text" height={12} className="flex-1" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex gap-4 py-2">
        {Array.from({ length: cols }).map((_, colIndex) => (
          <Skeleton key={colIndex} variant="text" className="flex-1" />
        ))}
      </div>
    ))}
  </div>
)

export default Skeleton
