'use client'

import React from 'react'

export interface TabItem {
  id: string
  label: string
  icon?: React.ReactNode
  badge?: string | number
  disabled?: boolean
}

export interface TabsProps {
  items: TabItem[]
  activeTab: string
  onChange: (tabId: string) => void
  variant?: 'underline' | 'pills' | 'enclosed'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  className?: string
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeTab,
  onChange,
  variant = 'underline',
  size = 'md',
  fullWidth = false,
  className = '',
}) => {
  const containerStyles = {
    underline: 'border-b border-slate-200 dark:border-slate-700',
    pills: 'bg-slate-100 dark:bg-slate-800 p-1 rounded-lg',
    enclosed: 'border-b border-slate-200 dark:border-slate-700',
  }

  const tabBaseStyles = `
    inline-flex items-center justify-center gap-2 font-medium
    transition-all duration-200 cursor-pointer
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2
  `

  const tabVariants = {
    underline: {
      base: 'border-b-2 border-transparent -mb-px',
      active: 'border-[#F78C3A] text-[#F78C3A]',
      inactive: 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600',
    },
    pills: {
      base: 'rounded-md',
      active: 'bg-white dark:bg-slate-700 text-[#F78C3A] shadow-sm',
      inactive: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50',
    },
    enclosed: {
      base: 'border border-transparent rounded-t-lg -mb-px',
      active: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 border-b-white dark:border-b-slate-900 text-[#F78C3A]',
      inactive: 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800',
    },
  }

  const tabSizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <div
      className={`${containerStyles[variant]} ${fullWidth ? 'w-full' : 'inline-flex'} ${className}`}
      role="tablist"
    >
      <div className={`flex ${fullWidth ? 'w-full' : ''} gap-1`}>
        {items.map((item) => {
          const isActive = activeTab === item.id
          const variantStyles = tabVariants[variant]

          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${item.id}`}
              disabled={item.disabled}
              onClick={() => !item.disabled && onChange(item.id)}
              className={`
                ${tabBaseStyles}
                ${variantStyles.base}
                ${isActive ? variantStyles.active : variantStyles.inactive}
                ${tabSizes[size]}
                ${fullWidth ? 'flex-1' : ''}
              `}
            >
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className={`
                    px-1.5 py-0.5 text-xs rounded-full font-semibold
                    ${isActive ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}
                  `}
                >
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export interface TabPanelProps {
  id: string
  activeTab: string
  children: React.ReactNode
  className?: string
}

export const TabPanel: React.FC<TabPanelProps> = ({
  id,
  activeTab,
  children,
  className = '',
}) => {
  if (activeTab !== id) return null

  return (
    <div
      id={`tabpanel-${id}`}
      role="tabpanel"
      aria-labelledby={id}
      className={`animate-fadeIn ${className}`}
    >
      {children}
    </div>
  )
}

export default Tabs
