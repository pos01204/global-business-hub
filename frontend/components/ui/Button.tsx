'use client'

import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2 font-semibold
      rounded-lg transition-all duration-200 relative overflow-hidden
      disabled:opacity-50 disabled:cursor-not-allowed
      focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
    `

    const variants = {
      primary: `
        bg-gradient-to-br from-[#F78C3A] to-[#E67729] text-white
        hover:from-[#E67729] hover:to-[#D56618] hover:shadow-lg hover:-translate-y-0.5
        active:translate-y-0 focus-visible:ring-orange-400
      `,
      secondary: `
        bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm
        hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-orange-300 dark:hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-400
        focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500
      `,
      outline: `
        bg-transparent text-[#F78C3A] border-2 border-[#F78C3A]
        hover:bg-orange-50 dark:hover:bg-orange-900/20 focus-visible:ring-orange-400
      `,
      ghost: `
        bg-transparent text-slate-600 dark:text-slate-400
        hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-orange-600 dark:hover:text-orange-400
        focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500
      `,
      danger: `
        bg-gradient-to-br from-red-500 to-red-600 text-white
        hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:-translate-y-0.5
        active:translate-y-0 focus-visible:ring-red-400
      `,
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          ${baseStyles}
          ${variants[variant]}
          ${sizes[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {loading && (
          <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
        )}
        {!loading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
