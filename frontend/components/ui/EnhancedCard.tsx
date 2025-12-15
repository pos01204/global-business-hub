'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Tooltip } from './Tooltip'
import { cn } from '@/lib/utils'

export interface EnhancedCardProps {
  children: React.ReactNode
  variant?: 'default' | 'bordered' | 'elevated'
  hover?: boolean
  tooltip?: string
  onClick?: () => void
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const variantStyles = {
  default: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
  bordered: 'bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600',
  elevated: 'bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700',
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
}

export function EnhancedCard({
  children,
  variant = 'default',
  hover = false,
  tooltip,
  onClick,
  className,
  padding = 'md',
}: EnhancedCardProps) {
  const card = (
    <motion.div
      whileHover={hover ? { y: -2, scale: 1.01 } : {}}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={cn(
        'rounded-xl transition-all duration-200',
        variantStyles[variant],
        paddingStyles[padding],
        hover && 'cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {children}
    </motion.div>
  )

  if (tooltip) {
    return (
      <Tooltip content={tooltip} delay={300}>
        {card}
      </Tooltip>
    )
  }

  return card
}

