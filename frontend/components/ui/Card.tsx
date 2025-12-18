'use client'

import React, { memo, useCallback } from 'react'

export interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled' | 'interactive'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
  children: React.ReactNode
  onClick?: () => void
}

export const Card = memo(function Card({
  variant = 'default',
  padding = 'md',
  className = '',
  children,
  onClick,
}: CardProps) {
  const variants = {
    default: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md',
    elevated: 'bg-white dark:bg-slate-900 shadow-lg hover:shadow-xl',
    outlined: 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
    filled: 'bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700',
    interactive: `
      bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer
      hover:shadow-lg hover:border-[#F78C3A] hover:-translate-y-1
      active:translate-y-0 active:shadow-md
    `,
  }

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (onClick && e.key === 'Enter') {
      onClick()
    }
  }, [onClick])

  return (
    <div
      className={`
        rounded-xl transition-all duration-200
        ${variants[variant]}
        ${paddings[padding]}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
    >
      {children}
    </div>
  )
})

export interface CardHeaderProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export const CardHeader = memo(function CardHeader({
  title,
  subtitle,
  icon,
  action,
  className = '',
}: CardHeaderProps) {
  return (
  <div className={`flex items-start justify-between gap-4 mb-4 ${className}`}>
    <div className="flex items-start gap-3">
      {icon && (
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-[#F78C3A]">
          {icon}
        </div>
      )}
      <div>
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
  )
})

export interface CardFooterProps {
  children: React.ReactNode
  className?: string
  bordered?: boolean
}

export const CardFooter = memo(function CardFooter({
  children,
  className = '',
  bordered = true,
}: CardFooterProps) {
  return (
    <div
      className={`
        mt-4 pt-4 flex items-center justify-end gap-2
        ${bordered ? 'border-t border-slate-100 dark:border-slate-800' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
})

export default Card
