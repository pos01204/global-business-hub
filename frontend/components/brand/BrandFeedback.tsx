'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { getEmotionByChange, getEmotionByStatus, BRAND_ASSETS } from '@/lib/brand-assets'
import { cn } from '@/lib/utils'

interface BrandFeedbackProps {
  /** 변화율 (%) - change 또는 status 중 하나 필수 */
  change?: number
  /** 상태 타입 */
  status?: 'success' | 'error' | 'warning' | 'info'
  /** 아이콘 크기 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** 애니메이션 여부 */
  animate?: boolean
  /** 이모션 표시 기준 (변화율 기준, 기본: 10%) */
  threshold?: number
  /** 추가 클래스명 */
  className?: string
  /** 레이블 표시 */
  showLabel?: boolean
}

const sizeMap = {
  xs: { icon: 'w-4 h-4', label: 'text-[10px]' },
  sm: { icon: 'w-5 h-5', label: 'text-xs' },
  md: { icon: 'w-6 h-6', label: 'text-sm' },
  lg: { icon: 'w-8 h-8', label: 'text-base' },
  xl: { icon: 'w-10 h-10', label: 'text-lg' },
}

const emotionLabels: Record<string, string> = {
  [BRAND_ASSETS.emotions.great]: '멋져요!',
  [BRAND_ASSETS.emotions.happy]: '기뻐요!',
  [BRAND_ASSETS.emotions.like]: '좋아요',
  [BRAND_ASSETS.emotions.cheer]: '힘내요!',
  [BRAND_ASSETS.emotions.sad]: '아쉬워요',
  [BRAND_ASSETS.emotions.touched]: '감동이에요',
  [BRAND_ASSETS.emotions.best]: '최고!',
}

/**
 * 브랜드 이모션 피드백 컴포넌트
 * KPI 변화율이나 상태에 따른 이모션 아이콘 표시
 */
export function BrandFeedback({
  change,
  status,
  size = 'md',
  animate = true,
  threshold = 10,
  className,
  showLabel = false,
}: BrandFeedbackProps) {
  // 변화율 기반일 경우 threshold 미만이면 표시하지 않음
  if (change !== undefined && Math.abs(change) < threshold) {
    return null
  }

  // 이모션 아이콘 결정
  let emotionSrc: string
  if (change !== undefined) {
    emotionSrc = getEmotionByChange(change)
  } else if (status) {
    emotionSrc = getEmotionByStatus(status)
  } else {
    return null
  }

  const { icon: iconSize, label: labelSize } = sizeMap[size]
  const label = emotionLabels[emotionSrc] || ''

  const content = (
    <div 
      className={cn('inline-flex items-center gap-1', className)}
      role="img"
      aria-label={label || '피드백 이모션'}
    >
      <div className={cn('relative', iconSize)} aria-hidden="true">
        <Image
          src={emotionSrc}
          alt=""
          fill
          className="object-contain"
        />
      </div>
      {showLabel && label && (
        <span className={cn('font-medium text-slate-600 dark:text-slate-400', labelSize)}>
          {label}
        </span>
      )}
    </div>
  )

  if (animate) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: 'spring', 
          stiffness: 500, 
          damping: 25,
          delay: 0.1 
        }}
      >
        {content}
      </motion.div>
    )
  }

  return content
}

/**
 * 성공 피드백 (단축 컴포넌트)
 */
export function SuccessFeedback({ 
  size = 'md', 
  animate = true,
  className 
}: { 
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  animate?: boolean
  className?: string 
}) {
  return (
    <BrandFeedback 
      status="success" 
      size={size} 
      animate={animate} 
      threshold={0}
      className={className}
    />
  )
}

/**
 * 에러 피드백 (단축 컴포넌트)
 */
export function ErrorFeedback({ 
  size = 'md', 
  animate = true,
  className 
}: { 
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  animate?: boolean
  className?: string 
}) {
  return (
    <BrandFeedback 
      status="error" 
      size={size} 
      animate={animate} 
      threshold={0}
      className={className}
    />
  )
}

/**
 * KPI 변화 피드백 (단축 컴포넌트)
 */
export function KPIFeedback({ 
  change,
  size = 'sm', 
  animate = true,
  threshold = 10,
  className 
}: { 
  change: number
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  animate?: boolean
  threshold?: number
  className?: string 
}) {
  return (
    <BrandFeedback 
      change={change} 
      size={size} 
      animate={animate} 
      threshold={threshold}
      className={className}
    />
  )
}

export default BrandFeedback

