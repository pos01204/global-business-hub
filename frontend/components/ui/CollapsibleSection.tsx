'use client'

import React, { useState, useCallback, memo, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollapsibleSectionProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  icon?: ReactNode
  badge?: string | number
  badgeColor?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
  headerClassName?: string
  contentClassName?: string
  /** 접힘 상태에서 보여줄 요약 정보 */
  summary?: string
  /** 외부에서 열림 상태 제어 */
  isOpen?: boolean
  onToggle?: (isOpen: boolean) => void
}

const badgeColors = {
  default: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
}

export const CollapsibleSection = memo(function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  icon,
  badge,
  badgeColor = 'default',
  className,
  headerClassName,
  contentClassName,
  summary,
  isOpen: controlledIsOpen,
  onToggle,
}: CollapsibleSectionProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen)
  
  // 제어/비제어 모드 지원
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen
  
  const handleToggle = useCallback(() => {
    const newState = !isOpen
    if (onToggle) {
      onToggle(newState)
    } else {
      setInternalIsOpen(newState)
    }
  }, [isOpen, onToggle])

  return (
    <div className={cn('rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden', className)}>
      {/* 헤더 */}
      <button
        onClick={handleToggle}
        className={cn(
          'w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800',
          'hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-idus-500 focus-visible:ring-inset',
          headerClassName
        )}
        aria-expanded={isOpen}
        aria-controls={`collapsible-content-${title.replace(/\s/g, '-')}`}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <span className="text-slate-500 dark:text-slate-400" aria-hidden="true">
              {icon}
            </span>
          )}
          <span className="font-semibold text-slate-800 dark:text-slate-100">{title}</span>
          {badge !== undefined && (
            <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', badgeColors[badgeColor])}>
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* 접힘 상태에서 요약 표시 */}
          {!isOpen && summary && (
            <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">
              {summary}
            </span>
          )}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          </motion.div>
        </div>
      </button>

      {/* 콘텐츠 */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`collapsible-content-${title.replace(/\s/g, '-')}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className={cn('p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700', contentClassName)}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

/**
 * 상세 정보 토글 버튼 (인라인용)
 */
interface DetailToggleProps {
  isExpanded: boolean
  onToggle: () => void
  label?: string
  className?: string
}

export const DetailToggle = memo(function DetailToggle({
  isExpanded,
  onToggle,
  label = '상세 보기',
  className,
}: DetailToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md',
        'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300',
        'bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700',
        'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-idus-500',
        className
      )}
      aria-expanded={isExpanded}
    >
      <span>{isExpanded ? '접기' : label}</span>
      <motion.div
        animate={{ rotate: isExpanded ? 180 : 0 }}
        transition={{ duration: 0.15 }}
      >
        <ChevronDown className="w-3.5 h-3.5" />
      </motion.div>
    </button>
  )
})

export default CollapsibleSection

