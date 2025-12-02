'use client'

import React from 'react'

export interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled' | 'interactive'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
  children: React.ReactNode
  onClick?: () => void
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  className = '',
  children,
  onClick,
}) => {
  const variants = {
    default: 'bg-white border border-slate-200 shadow-sm hover:shadow-md',
    elevated: 'bg-white shadow-lg hover:shadow-xl',
    outlined: 'bg-white border-2 border-slate-200 hover:border-slate-300',
    filled: 'bg-slate-50 border border-slate-100',
    interactive: `
      bg-white border border-slate-200 shadow-sm cursor-pointer
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
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {children}
    </div>
  )
}

export interface CardHeaderProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  icon,
  action,
  className = '',
}) => (
  <div className={`flex items-start justify-between gap-4 mb-4 ${className}`}>
    <div className="flex items-start gap-3">
      {icon && (
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-[#F78C3A]">
          {icon}
        </div>
      )}
      <div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
)

export interface CardFooterProps {
  children: React.ReactNode
  className?: string
  bordered?: boolean
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = '',
  bordered = true,
}) => (
  <div
    className={`
      mt-4 pt-4 flex items-center justify-end gap-2
      ${bordered ? 'border-t border-slate-100' : ''}
      ${className}
    `}
  >
    {children}
  </div>
)

export default Card
